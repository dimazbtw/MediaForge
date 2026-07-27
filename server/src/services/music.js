import fsp from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'
import { writeZip } from '../converters/archive.js'
import { inspect, download, assertPublicUrl } from '../lib/ytdlp.js'
import { musicDownloadSchema, localizeSchema, defaultsFor, normalizeAgainst } from '../lib/options.js'
import { TranslatedError, localizeError, translator } from '../lib/i18n.js'
import { makeWorkDir, registerFile, outputPath, sanitizeFilename } from '../lib/storage.js'
import { mimeFor, previewKind } from '../lib/formats.js'
import { formatDuration } from '../converters/media.js'
import { updateTrack } from '../lib/jobs.js'
import { pickThumbnail } from './video.js'
import { resolveSpotify, parseSpotifyUrl, hasCredentials } from './spotify.js'

export const AUDIO_BITRATES = ['128', '256', '320']
export const AUDIO_FORMATS = ['mp3', 'm4a', 'opus', 'flac', 'wav']

/** Formatos sem perdas: anunciar um bitrate para estes seria enganador. */
export const LOSSLESS_FORMATS = new Set(['flac', 'wav'])

export function qualityLabel(format, bitrate, t = null) {
  if (!LOSSLESS_FORMATS.has(String(format).toLowerCase())) return `${bitrate} kbps`
  return t ? t('value.lossless') : 'sem perdas'
}

export function detectProvider(url) {
  const text = String(url).toLowerCase()
  if (text.includes('spotify.com') || text.startsWith('spotify:')) return 'spotify'
  if (text.includes('soundcloud.com')) return 'soundcloud'
  if (text.includes('bandcamp.com')) return 'bandcamp'
  if (text.includes('music.youtube.com')) return 'youtube-music'
  if (text.includes('youtube.com') || text.includes('youtu.be')) return 'youtube'
  return 'other'
}

/**
 * Cache curta dos resultados de probe.
 * O /music/download resolve o mesmo endereço que o /music/probe acabou de
 * resolver; sem cache era uma segunda chamada ao yt-dlp (vários segundos de
 * espera antes de o cartão de trabalho sequer aparecer).
 */
const probeCache = new Map()
const PROBE_TTL_MS = 10 * 60_000
const PROBE_CACHE_MAX = 40

function cacheGet(key) {
  const entry = probeCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.at > PROBE_TTL_MS) {
    probeCache.delete(key)
    return null
  }
  return entry.value
}

function cacheSet(key, value) {
  if (probeCache.size >= PROBE_CACHE_MAX) {
    probeCache.delete(probeCache.keys().next().value)
  }
  probeCache.set(key, { at: Date.now(), value })
  return value
}

/** Resolve qualquer link de música para uma estrutura uniforme. */
export async function probeMusic(url, { signal, fresh = false, lang } = {}) {
  const t = translator(lang)
  const target = String(url).trim()
  // O idioma entra na chave porque o resultado transporta texto traduzido.
  const cacheKey = `${t.language}|${target}`
  if (!fresh) {
    const cached = cacheGet(cacheKey)
    if (cached) return cached
  }
  const resolved = await resolveMusic(target, { signal, t })
  // O esquema de opções acompanha a coleção: a opção de ZIP só faz sentido
  // quando há mais do que uma faixa.
  const fields = musicDownloadSchema({ multipleTracks: resolved.tracks.length > 1 })
  return cacheSet(cacheKey, {
    ...resolved,
    options: { fields: localizeSchema(fields, t.language), defaults: defaultsFor(fields) },
  })
}

/** Valida as opções recebidas contra o esquema desta coleção. */
export function normalizeMusicOptions(raw, { multipleTracks = false } = {}) {
  return normalizeAgainst(musicDownloadSchema({ multipleTracks }), raw)
}

async function resolveMusic(url, { signal, t = translator() } = {}) {
  const provider = detectProvider(url)

  if (provider === 'spotify') {
    if (!parseSpotifyUrl(url)) throw new TranslatedError('error.spotifyUnknownLink')
    const resolved = await resolveSpotify(url)
    const tracks = resolved.tracks.slice(0, config.maxPlaylistItems)
    return {
      ...resolved,
      tracks: tracks.map(withId),
      truncated: resolved.tracks.length > tracks.length || resolved.totalTracks > tracks.length,
      limit: config.maxPlaylistItems,
      sourcing: t('note.spotifySourcing'),
      needsApiKey: !hasCredentials(),
    }
  }

  assertPublicUrl(url)
  const info = await inspect(url, { flat: true, signal })

  if (info._type === 'playlist' && Array.isArray(info.entries)) {
    const entries = info.entries.filter(Boolean).slice(0, config.maxPlaylistItems)
    return {
      kind: info.entries.length > 1 ? 'playlist' : 'track',
      provider,
      title: info.title || 'Coleção',
      subtitle: info.uploader || info.channel || '',
      cover: pickThumbnail(info) || pickThumbnail(entries[0] || {}),
      totalTracks: info.playlist_count || info.entries.length,
      limit: config.maxPlaylistItems,
      truncated: info.entries.length > entries.length,
      tracks: entries.map((entry, index) =>
        withId(
          {
            sourceId: entry.id,
            title: entry.title || 'Sem título',
            artist: entry.uploader || entry.channel || info.uploader || '',
            album: info.title || null,
            duration: Number(entry.duration) || 0,
            thumbnail: pickThumbnail(entry),
            webpageUrl: entry.url || entry.webpage_url || null,
          },
          index,
        ),
      ),
    }
  }

  return {
    kind: 'track',
    provider,
    title: info.title || 'Sem título',
    subtitle: info.uploader || info.channel || '',
    cover: pickThumbnail(info),
    totalTracks: 1,
    limit: config.maxPlaylistItems,
    truncated: false,
    tracks: [
      withId({
        sourceId: info.id,
        title: info.title || 'Sem título',
        artist: info.uploader || info.channel || '',
        album: info.album || null,
        duration: Number(info.duration) || 0,
        thumbnail: pickThumbnail(info),
        webpageUrl: info.webpage_url || url,
      }),
    ],
  }
}

/**
 * IDs de faixa DETERMINÍSTICOS.
 *
 * O cliente faz /music/probe, o utilizador escolhe faixas, e depois o
 * /music/download volta a resolver o mesmo endereço. Com IDs aleatórios os
 * dois conjuntos nunca coincidiam e a seleção era sempre rejeitada com
 * «Nenhuma faixa selecionada». Derivar o ID da própria faixa garante que o
 * mesmo endereço produz sempre os mesmos IDs.
 */
function withId(track, index = 0) {
  const seed = String(track.sourceId || track.webpageUrl || `${track.artist}|${track.title}`)
  return {
    id: `t${index}-${shortHash(seed)}`,
    ...track,
    durationLabel: track.duration ? formatDuration(track.duration) : null,
  }
}

/** FNV-1a de 32 bits em base36 — curto, estável e sem dependências. */
function shortHash(value) {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(36)
}

/**
 * Runner do job de música. Processa faixa a faixa (progresso individual),
 * e junta tudo num ZIP quando há mais do que uma.
 */
export function makeMusicRunner({ resolved, options = {} }) {
  const audioFormat = AUDIO_FORMATS.includes(options.format) ? options.format : 'mp3'
  const audioBitrate = AUDIO_BITRATES.includes(String(options.bitrate)) ? String(options.bitrate) : '256'
  const zipBatch = options.zipBatch !== false

  return async ({ job, signal, setStage, t }) => {
    const batchDir = await makeWorkDir('music')
    const produced = []

    try {
      for (const [index, track] of resolved.tracks.entries()) {
        if (signal.aborted) break

        setStage(t('stage.trackOf', { index: index + 1, total: resolved.tracks.length, title: track.title }))
        updateTrack(job.id, track.id, { status: 'processing', progress: 0, stage: t('stage.searching') })

        try {
          const trackDir = path.join(batchDir, `t${index}`)
          await fsp.mkdir(trackDir, { recursive: true })

          const target = buildSourceQuery(track, resolved.provider)
          const args = [
            '-f',
            'bestaudio/best',
            '-x',
            '--audio-format',
            audioFormat,
            '--audio-quality',
            LOSSLESS_FORMATS.has(audioFormat) ? '0' : `${audioBitrate}K`,
            '--no-playlist',
          ]
          if (options.embedMetadata !== false) args.push('--embed-metadata')
          if (options.embedCover !== false) args.push('--embed-thumbnail')

          updateTrack(job.id, track.id, { stage: t('stage.downloading') })

          const file = await download({
            url: target,
            destDir: trackDir,
            args,
            filenameTemplate: `${sanitizeFilename(trackLabel(track, options.filenamePattern, index))}.%(ext)s`,
            signal,
            t,
            // O progresso NÃO escreve a etapa: o progresso chega pelo stdout e as
            // etapas de pós-processamento pelo stderr, sem ordem garantida entre
            // si. Se ambos escrevessem, um evento de progresso atrasado apagava o
            // «A extrair o áudio…» e a faixa ficava eternamente «A descarregar…».
            onProgress: (value) => updateTrack(job.id, track.id, { progress: value }),
            onStage: (stage) => updateTrack(job.id, track.id, { stage }),
          })

          const ext = path.extname(file.name).replace('.', '').toLowerCase() || audioFormat
          const finalName = `${sanitizeFilename(trackLabel(track, options.filenamePattern, index))}.${ext}`
          const finalPath = outputPath(finalName)
          await fsp.rename(file.path, finalPath).catch(async () => fsp.copyFile(file.path, finalPath))

          const stat = await fsp.stat(finalPath)
          const entry = registerFile({ absPath: finalPath, filename: finalName, mime: mimeFor(ext) })
          produced.push({ path: finalPath, name: finalName })

          updateTrack(job.id, track.id, {
            status: 'done',
            progress: 100,
            stage: t('stage.trackDone'),
            fileId: entry.id,
            filename: finalName,
            size: stat.size,
            ext,
          })
        } catch (error) {
          if (signal.aborted) break
          updateTrack(job.id, track.id, {
            status: 'error',
            progress: 100,
            stage: t('stage.failed'),
            error: localizeError(error, t.language),
          })
        }
      }

      const okTracks = job.tracks?.filter((track) => track.status === 'done') || []
      if (!okTracks.length) throw new TranslatedError('error.noTrackDownloaded', {}, 502)

      if (produced.length > 1 && zipBatch) {
        setStage(t('stage.zipping'))
        const zipName = `${sanitizeFilename(resolved.title || 'mediaforge')}.zip`
        const zipPath = outputPath(zipName)
        // Áudio já está comprimido: nível 0 evita gastar tempo sem ganho.
        await writeZip(zipPath, produced, { level: 0 })
        const stat = await fsp.stat(zipPath)
        const entry = registerFile({ absPath: zipPath, filename: zipName, mime: 'application/zip' })
        return {
          fileId: entry.id,
          filename: zipName,
          size: stat.size,
          mime: 'application/zip',
          ext: 'zip',
          preview: 'none',
          note:
            okTracks.length < resolved.tracks.length
              ? t('note.tracksFailed', { count: resolved.tracks.length - okTracks.length })
              : null,
          details: {
            [t('detail.tracks')]: `${okTracks.length}`,
            [t('detail.format')]: audioFormat.toUpperCase(),
            [t('detail.quality')]: qualityLabel(audioFormat, audioBitrate, t),
          },
        }
      }

      const single = okTracks[0]
      return {
        fileId: single.fileId,
        filename: single.filename,
        size: single.size,
        mime: mimeFor(single.ext),
        ext: single.ext,
        preview: previewKind(single.ext),
        note: null,
        details: {
          [t('detail.format')]: audioFormat.toUpperCase(),
          [t('detail.quality')]: qualityLabel(audioFormat, audioBitrate, t),
        },
      }
    } finally {
      await fsp.rm(batchDir, { recursive: true, force: true }).catch(() => {})
    }
  }
}

/**
 * Para o Spotify não há URL de áudio: procura-se a faixa pelo par artista+título.
 * Para os restantes fornecedores usa-se o URL direto da faixa.
 */
function buildSourceQuery(track, provider) {
  if (provider === 'spotify' || !track.webpageUrl) {
    const query = [track.artist, track.title].filter(Boolean).join(' - ')
    return `ytsearch1:${query} audio`
  }
  if (/^https?:\/\//i.test(track.webpageUrl)) return track.webpageUrl
  return `https://www.youtube.com/watch?v=${track.sourceId}`
}

/** Nome do ficheiro segundo o padrão escolhido pelo utilizador. */
function trackLabel(track, pattern = 'artist-title', index = 0) {
  const number = String(index + 1).padStart(2, '0')
  switch (pattern) {
    case 'title':
      return track.title
    case 'track-title':
      return `${number} - ${track.title}`
    case 'artist-album-title':
      return [track.artist, track.album, track.title].filter(Boolean).join(' - ')
    default:
      return track.artist ? `${track.artist} - ${track.title}` : track.title
  }
}

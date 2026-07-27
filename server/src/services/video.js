import fsp from 'node:fs/promises'
import path from 'node:path'
import {
  inspect,
  download,
  videoFormatSelector,
  codecSortArgs,
  sectionArg,
  availableHeights,
  labelForHeight,
} from '../lib/ytdlp.js'
import { makeWorkDir, registerFile, outputPath, sanitizeFilename } from '../lib/storage.js'
import { mimeFor, previewKind } from '../lib/formats.js'
import { videoDownloadSchema, localizeSchema, defaultsFor, normalizeAgainst } from '../lib/options.js'
import { TranslatedError, translator } from '../lib/i18n.js'
import { formatDuration } from '../converters/media.js'
import { config } from '../config.js'

/** Metadados + esquema de opções já adaptado a este vídeo em concreto. */
export async function probeVideo(url, { signal, lang } = {}) {
  const info = await inspect(url, { noPlaylist: true, signal })

  if (info._type === 'playlist' && Array.isArray(info.entries)) {
    const first = info.entries.find(Boolean)
    if (!first) throw new TranslatedError('error.noVideoFound', {}, 404)
    return shapeVideo(first, lang)
  }
  return shapeVideo(info, lang)
}

function shapeVideo(info, lang) {
  const heights = availableHeights(info.formats || [])
  const hasAudio = (info.formats || []).some((format) => format.acodec && format.acodec !== 'none')
  const qualities = heights.map((height) => ({ value: height, label: labelForHeight(height) }))
  const containers = ['mp4', 'webm', 'mkv']
  const fields = videoDownloadSchema({ qualities, containers })

  return {
    id: info.id,
    title: info.title || 'Sem título',
    uploader: info.uploader || info.channel || info.uploader_id || '',
    uploaderUrl: info.uploader_url || info.channel_url || null,
    duration: Number(info.duration) || 0,
    durationLabel: info.duration ? formatDuration(info.duration) : null,
    thumbnail: pickThumbnail(info),
    viewCount: Number(info.view_count) || null,
    uploadDate: formatUploadDate(info.upload_date),
    webpageUrl: info.webpage_url || info.original_url || null,
    extractor: info.extractor_key || info.extractor || null,
    isLive: Boolean(info.is_live),
    qualities,
    containers,
    hasAudio,
    hasSubtitles: Object.keys(info.subtitles || {}).length > 0,
    availableSubtitles: Object.keys(info.subtitles || {}).slice(0, 20),
    // Esquema declarativo: a UI desenha os controlos a partir daqui.
    options: {
      fields: localizeSchema(fields, lang),
      defaults: { ...defaultsFor(fields), quality: qualities[0] ? String(qualities[0].value) : 'best' },
    },
  }
}

export function pickThumbnail(info) {
  if (info.thumbnail) return info.thumbnail
  const list = info.thumbnails || []
  if (!list.length) return null
  const sorted = [...list].sort((a, b) => (b.preference ?? 0) - (a.preference ?? 0) || (b.width || 0) - (a.width || 0))
  return sorted[0]?.url || null
}

function formatUploadDate(value) {
  if (!value || String(value).length !== 8) return null
  const text = String(value)
  return `${text.slice(6, 8)}/${text.slice(4, 6)}/${text.slice(0, 4)}`
}

const LOSSLESS = new Set(['flac', 'wav'])

/** Valida as opções recebidas contra o esquema deste vídeo. */
export function normalizeVideoOptions(raw, { qualities = [], containers = ['mp4', 'webm', 'mkv'] } = {}) {
  return normalizeAgainst(videoDownloadSchema({ qualities, containers }), raw)
}

/** Resumo legível das escolhas, para o subtítulo do cartão de trabalho. */
export function describeVideoChoice(options, lang) {
  const t = translator(lang)
  if (options.mode === 'audio') {
    const quality = LOSSLESS.has(options.audioFormat) ? t('value.lossless') : `${options.audioBitrate} kbps`
    return `${options.audioFormat.toUpperCase()} · ${quality}`
  }
  const parts = [options.container.toUpperCase(), options.quality === 'best' ? t('value.best') : `${options.quality}p`]
  if (options.fpsCap !== 'any') parts.push(`≤${options.fpsCap} fps`)
  if (options.codec !== 'any') parts.push(options.codec.toUpperCase())
  if (options.subtitles === 'embed') parts.push(t('detail.subtitles'))
  return parts.join(' · ')
}

/** Runner do job de download de vídeo. */
export function makeVideoRunner({ url, options }) {
  return async ({ signal, setProgress, setStage, t }) => {
    const workDir = await makeWorkDir('video')
    try {
      setStage(t('stage.negotiating'))

      const audioOnly = options.mode === 'audio'
      const args = []
      const notes = []

      if (audioOnly) {
        const format = options.audioFormat || 'mp3'
        args.push('-f', 'bestaudio/best', '-x', '--audio-format', format)
        args.push('--audio-quality', LOSSLESS.has(format) ? '0' : `${options.audioBitrate}K`)
      } else {
        const maxHeight = options.quality && options.quality !== 'best' ? Number(options.quality) : null
        const maxFps = options.fpsCap && options.fpsCap !== 'any' ? Number(options.fpsCap) : null
        args.push(
          '-f',
          videoFormatSelector({ container: options.container, maxHeight, maxFps }),
          '--merge-output-format',
          options.container,
          ...codecSortArgs(options.codec),
        )

        if (options.subtitles === 'embed') {
          args.push('--embed-subs', '--write-subs')
          args.push('--sub-langs', options.subtitleLang === 'all' ? 'all' : `${options.subtitleLang}.*,${options.subtitleLang}`)
          if (options.autoSubs) args.push('--write-auto-subs')
          notes.push(t('note.subtitlesMayMiss'))
        }
      }

      if (options.embedThumbnail) args.push('--embed-thumbnail')
      if (options.embedMetadata) args.push('--embed-metadata', '--embed-chapters')

      // Recorte: descarrega apenas o excerto pedido, em vez do vídeo inteiro.
      const section = sectionArg(options.trimStart, options.trimEnd)
      if (section) {
        args.push('--download-sections', section, '--force-keyframes-at-cuts')
        notes.push(t('note.trimProgress'))
      }

      args.push('--no-playlist')

      setStage(t('stage.downloading'))

      const file = await download({
        url,
        destDir: workDir,
        args,
        expectedFiles: audioOnly ? 1 : 2,
        signal,
        t,
        onProgress: (value) => setProgress(value),
        onStage: setStage,
      })

      setStage(t('stage.preparing'))
      const ext = path.extname(file.name).replace('.', '').toLowerCase() || (audioOnly ? options.audioFormat : options.container)
      const finalName = sanitizeFilename(file.name) || `mediaforge.${ext}`
      const finalPath = outputPath(finalName)
      await fsp.rename(file.path, finalPath).catch(async () => {
        await fsp.copyFile(file.path, finalPath)
      })

      const stat = await fsp.stat(finalPath)
      const entry = registerFile({ absPath: finalPath, filename: finalName, mime: mimeFor(ext) })

      return {
        fileId: entry.id,
        filename: finalName,
        size: stat.size,
        mime: entry.mime,
        ext,
        preview: previewKind(ext),
        note: notes.join(' ') || null,
        details: buildDetails(options, ext, t),
      }
    } finally {
      await fsp.rm(workDir, { recursive: true, force: true }).catch(() => {})
    }
  }
}

function buildDetails(options, ext, t) {
  const details = { [t('detail.format')]: ext.toUpperCase() }

  if (options.mode === 'audio') {
    details[t('detail.quality')] = LOSSLESS.has(options.audioFormat)
      ? t('value.lossless')
      : `${options.audioBitrate} kbps`
  } else {
    details[t('detail.quality')] =
      options.quality === 'best' ? t('value.best') : labelForHeight(Number(options.quality))
    if (options.fpsCap !== 'any') details[t('detail.fps')] = t('value.upTo', { value: options.fpsCap })
    if (options.codec !== 'any') details[t('detail.codec')] = options.codec.toUpperCase()
    if (options.subtitles === 'embed') details[t('detail.subtitles')] = options.subtitleLang
  }

  if (options.trimStart !== '' || options.trimEnd !== '') {
    const from = options.trimStart === '' ? 0 : Number(options.trimStart)
    const to = options.trimEnd === '' ? t('value.end') : formatDuration(Number(options.trimEnd))
    details[t('detail.trim')] = `${formatDuration(from)} → ${to}`
  }

  return details
}

export const MAX_PLAYLIST_ITEMS = config.maxPlaylistItems

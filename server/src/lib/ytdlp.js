import fsp from 'node:fs/promises'
import path from 'node:path'
import { binaries, requireBinary } from './binaries.js'
import { run } from './ffmpeg.js'
import { translator, TranslatedError, DEFAULT_LANGUAGE } from './i18n.js'

const PROGRESS_TAG = 'MFPROG'
const PROGRESS_TEMPLATE = `download:${PROGRESS_TAG}|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s`

const BLOCKED_HOSTS = /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?)/i

const SEARCH_PREFIX = /^(yt|sc|bandcamp)search\d*:/i

/**
 * Alvos aceites pelo yt-dlp: um URL público, ou uma pesquisa `ytsearch1:...`
 * (usada quando só temos artista + título, como acontece com o Spotify).
 */
export function resolveTarget(input) {
  const text = String(input).trim()
  if (SEARCH_PREFIX.test(text)) {
    return text.replace(/[\r\n]+/g, ' ').slice(0, 400)
  }
  return assertPublicUrl(text)
}

/** Valida a URL antes de a entregar ao yt-dlp. */
export function assertPublicUrl(input) {
  let url
  try {
    url = new URL(String(input).trim())
  } catch {
    throw new TranslatedError('error.invalidUrl')
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new TranslatedError('error.httpOnly')
  if (BLOCKED_HOSTS.test(url.hostname)) throw new TranslatedError('error.privateAddress')
  return url.toString()
}

function baseArgs() {
  const args = [
    '--no-warnings',
    '--no-color',
    '--no-progress',
    '--ignore-config',
    '--no-playlist-reverse',
    // O YouTube devolve 403 de forma intermitente sob rate-limiting; sem estas
    // tentativas um download perfeitamente válido falha de vez em quando.
    '--retries',
    '10',
    '--fragment-retries',
    '10',
    '--extractor-retries',
    '3',
    '--socket-timeout',
    '30',
  ]
  if (binaries.ffmpeg) args.push('--ffmpeg-location', path.dirname(binaries.ffmpeg))
  return args
}

/**
 * Traduz os erros do yt-dlp para algo acionável.
 * O texto cru («Unable to download JSON metadata: HTTP Error 404…») não diz
 * nada a quem só colou um link.
 */
const ERROR_PATTERNS = [
  [/404|not found|unable to download (json|webpage|api)/i, 'error.notFound', 404],
  [/private video|private playlist|members-only|premium/i, 'error.private', 403],
  [/sign in|login required|cookies|age.?restrict|confirm your age/i, 'error.loginRequired', 403],
  [/unsupported url|no video formats|unable to extract/i, 'error.unsupportedSite', 400],
  [/video unavailable|removed by the uploader|account.*terminated/i, 'error.gone', 404],
  [/geo.?restrict|not available in your country/i, 'error.geoBlocked', 451],
  [/timed out|timeout|connection reset|network/i, 'error.network', 504],
  [/403|forbidden/i, 'error.rateLimited', 429],
]

export function friendlyError(error) {
  const raw = String(error?.message || error || '')
  for (const [pattern, key, status] of ERROR_PATTERNS) {
    if (pattern.test(raw)) {
      const friendly = new TranslatedError(key, {}, status)
      friendly.cause = raw
      return friendly
    }
  }
  // Sem correspondência: limpa o prefixo do yt-dlp mas mantém o conteúdo, que
  // é diagnóstico técnico e não faz sentido traduzir.
  const cleaned = raw.replace(/^ERROR:\s*/i, '').replace(/^\[[^\]]+\]\s*/, '')
  if (!cleaned) return new TranslatedError('error.generic', {}, 502)
  const fallback = new Error(cleaned)
  fallback.status = 502
  return fallback
}

/** Metadados de um URL. `flat: true` evita resolver cada item de uma playlist. */
export async function inspect(url, { flat = false, noPlaylist = false, signal } = {}) {
  // Valida o endereço ANTES de exigir o binário: um URL inválido deve dar 400,
  // não um 503 a falar de yt-dlp em falta.
  const target = resolveTarget(url)
  const bin = requireBinary('ytdlp')
  const args = [...baseArgs(), '-J']
  if (flat) args.push('--flat-playlist')
  if (noPlaylist) args.push('--no-playlist')
  args.push('--', target)

  let stdout
  try {
    ;({ stdout } = await run(bin, args, { signal }))
  } catch (error) {
    throw friendlyError(error)
  }
  const trimmed = stdout.trim()
  if (!trimmed) throw new Error('O yt-dlp não devolveu metadados para este endereço.')
  try {
    return JSON.parse(trimmed.split('\n').at(-1))
  } catch {
    throw new Error('Não foi possível interpretar a resposta do yt-dlp.')
  }
}

/**
 * Descarrega para uma pasta vazia e devolve o caminho do ficheiro produzido.
 * O progresso vem de `--progress-template`, por isso é real e não simulado.
 */
export async function download({
  url,
  destDir,
  args = [],
  filenameTemplate = '%(title).150B.%(ext)s',
  expectedFiles = 1,
  signal,
  onProgress,
  onStage,
  t = translator(DEFAULT_LANGUAGE),
}) {
  const bin = requireBinary('ytdlp')
  const fullArgs = [
    ...baseArgs(),
    '--newline',
    '--progress',
    '--progress-template',
    PROGRESS_TEMPLATE,
    '--no-part',
    '--restrict-filenames',
    '--windows-filenames',
    '-o',
    path.join(destDir, filenameTemplate),
    ...args,
    '--',
    resolveTarget(url),
  ]

  // Um download com merge são dois streams seguidos (vídeo, depois áudio) e
  // cada um reporta a sua própria percentagem. Sem isto o progresso saltava
  // para trás a meio (45% → 0%). Cada stream ocupa uma fatia de 1/expectedFiles.
  let streamIndex = 0
  let previousDone = 0

  let buffer = ''
  const handle = (chunk) => {
    buffer += chunk
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith(PROGRESS_TAG)) {
        const [, downloaded, total, estimate] = trimmed.split('|')
        const done = Number(downloaded)
        const size = Number(total) || Number(estimate)
        if (Number.isFinite(done) && Number.isFinite(size) && size > 0) {
          // Bytes a recuar = começou um stream novo.
          if (done < previousDone) streamIndex = Math.min(streamIndex + 1, expectedFiles - 1)
          previousDone = done
          const fraction = Math.min(1, done / size)
          const overall = ((streamIndex + fraction) / expectedFiles) * 100
          onProgress?.(Math.max(0, Math.min(99, overall)))
        }
      } else if (/\[Merger\]/i.test(trimmed)) {
        onStage?.(t('stage.merging'))
      } else if (/\[ExtractAudio\]/i.test(trimmed)) {
        onStage?.(t('stage.extractingAudio'))
      } else if (/\[EmbedThumbnail\]|\[Metadata\]/i.test(trimmed)) {
        onStage?.(t('stage.writingMetadata'))
      }
    }
  }

  try {
    await run(bin, fullArgs, { signal, onStdout: handle, onStderr: handle })
  } catch (error) {
    if (signal?.aborted) throw error
    throw friendlyError(error)
  }

  const produced = await fsp.readdir(destDir)
  const files = []
  for (const name of produced) {
    const full = path.join(destDir, name)
    const stat = await fsp.stat(full)
    if (stat.isFile() && stat.size > 0) files.push({ path: full, name, size: stat.size })
  }
  if (!files.length) throw new Error('O download terminou mas não produziu ficheiro.')
  files.sort((a, b) => b.size - a.size)
  return files[0]
}

/** Seletor de formato do yt-dlp para um pedido de vídeo. */
export function videoFormatSelector({ container = 'mp4', maxHeight = null, maxFps = null }) {
  const filters = `${maxHeight ? `[height<=?${maxHeight}]` : ''}${maxFps ? `[fps<=?${maxFps}]` : ''}`

  if (container === 'webm') {
    return [
      `bestvideo${filters}[ext=webm]+bestaudio[ext=webm]`,
      `bestvideo${filters}+bestaudio`,
      `best${filters}`,
      'best',
    ].join('/')
  }
  if (container === 'mkv') {
    return [`bestvideo${filters}+bestaudio`, `best${filters}`, 'best'].join('/')
  }
  return [
    `bestvideo${filters}[ext=mp4]+bestaudio[ext=m4a]`,
    `bestvideo${filters}+bestaudio`,
    `best${filters}[ext=mp4]`,
    `best${filters}`,
    'best',
  ].join('/')
}

/**
 * Preferência de codec expressa como ordenação (-S) e não como filtro:
 * se o codec pedido não existir, o yt-dlp escolhe o melhor seguinte em vez
 * de falhar com «requested format is not available».
 */
export function codecSortArgs(codec) {
  const sort = { h264: 'vcodec:h264', vp9: 'vcodec:vp9', av1: 'vcodec:av01' }[codec]
  return sort ? ['-S', sort] : []
}

/** Converte segundos num intervalo aceite por --download-sections. */
export function sectionArg(start, end) {
  if (start === '' && end === '') return null
  const from = Number(start) > 0 ? Number(start) : 0
  const to = Number(end) > from ? Number(end) : null
  return `*${from}-${to ?? 'inf'}`
}

/** Alturas disponíveis, da maior para a menor, a partir dos formatos do yt-dlp. */
export function availableHeights(formats = []) {
  const heights = new Set()
  for (const format of formats) {
    if (format.vcodec && format.vcodec !== 'none' && Number(format.height) > 0) {
      heights.add(Number(format.height))
    }
  }
  return [...heights].sort((a, b) => b - a)
}

export const HEIGHT_LABELS = {
  144: '144p',
  240: '240p',
  360: '360p',
  480: '480p (SD)',
  720: '720p (HD)',
  1080: '1080p (Full HD)',
  1440: '1440p (2K)',
  2160: '2160p (4K)',
  4320: '4320p (8K)',
}

export function labelForHeight(height) {
  return HEIGHT_LABELS[height] || `${height}p`
}

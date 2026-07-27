import { probe, transcode, videoCodecArgs, AUDIO_PRESETS } from '../lib/ffmpeg.js'
import { normalizeExt, categoryOf } from '../lib/formats.js'
import { TranslatedError } from '../lib/i18n.js'

/**
 * Conversões de áudio e vídeo via ffmpeg, com progresso real derivado do
 * tempo de saída. As opções chegam já validadas por lib/options.js.
 */
export async function convertMedia({ inputPath, outputPath, from, to, options = {}, signal, onProgress, setStage, t }) {
  const source = normalizeExt(from)
  const target = normalizeExt(to)

  setStage?.(t('stage.analysing'))
  const info = await probe(inputPath, { signal })
  onProgress?.(3)

  const targetCategory = categoryOf(target)
  const wantsAudioOnly = targetCategory === 'audio'
  const applied = {}

  // ── Recorte temporal ──────────────────────────────────────────────────────
  // `-ss` antes do input é seek rápido; o tempo de saída passa a começar em
  // zero, por isso o progresso mapeia contra a duração efetiva.
  const start = numberOrNull(options.trimStart)
  const end = numberOrNull(options.trimEnd)
  const pre = []
  if (start != null && start > 0) pre.push('-ss', String(start))

  const args = [...pre, '-i', inputPath]

  let effectiveDuration = info.duration || 0
  if (start != null && start > 0) effectiveDuration = Math.max(0, effectiveDuration - start)
  if (end != null && end > (start || 0)) {
    const span = end - (start || 0)
    args.push('-t', String(span))
    effectiveDuration = Math.min(effectiveDuration || span, span)
    applied[t('detail.trim')] = `${formatDuration(start || 0)} → ${formatDuration(end)}`
  } else if (start != null && start > 0) {
    applied[t('detail.trim')] = t('value.from', { time: formatDuration(start) })
  }

  // ── Filtros de áudio ──────────────────────────────────────────────────────
  const audioFilters = []
  if (options.normalize === true) {
    audioFilters.push('loudnorm=I=-16:TP=-1.5:LRA=11')
    applied[t('detail.volume')] = t('value.normalised')
  } else {
    const gain = Number(options.volume)
    if (Number.isFinite(gain) && gain !== 0) {
      audioFilters.push(`volume=${gain}dB`)
      applied[t('detail.volume')] = `${gain > 0 ? '+' : ''}${gain} dB`
    }
  }

  if (wantsAudioOnly) {
    const preset = AUDIO_PRESETS[target]
    if (!preset) throw new TranslatedError('error.unsupportedPair', { from: source.toUpperCase(), to: target.toUpperCase(), targets: '—' })

    const bitrate = normalizeBitrate(options.bitrate)
    args.push(...preset(bitrate))
    if (!isLossless(target)) applied[t('detail.bitrate')] = bitrate

    if (options.sampleRate && options.sampleRate !== 'auto') {
      args.push('-ar', String(Number(options.sampleRate)))
      applied[t('detail.sampleRate')] = `${Math.round(Number(options.sampleRate) / 1000)} kHz`
    }
    if (options.channels && options.channels !== 'auto') {
      args.push('-ac', String(Number(options.channels)))
      applied[t('detail.channels')] = Number(options.channels) === 1 ? t('value.mono') : t('value.stereo')
    }
    if (audioFilters.length) args.push('-af', audioFilters.join(','))
  } else if (target === 'gif') {
    args.push(...gifArgs(options, applied, t))
  } else if (targetCategory === 'video') {
    const audioBitrate = normalizeBitrate(options.audioBitrate)
    args.push(...videoCodecArgs(target, { quality: options.quality, preset: options.preset, audioBitrate }))

    const videoFilters = buildVideoFilters(options, applied, t)
    if (videoFilters.length) args.push('-vf', videoFilters.join(','))

    if (options.removeAudio === true) {
      args.push('-an')
      applied[t('detail.audio')] = t('value.removed')
    } else {
      if (audioFilters.length) args.push('-af', audioFilters.join(','))
      applied[t('detail.audio')] = audioBitrate
    }

    applied[t('detail.quality')] = String(options.quality || 'media')
  } else {
    throw new TranslatedError('error.unsupportedPair', {
      from: source.toUpperCase(),
      to: target.toUpperCase(),
      targets: '—',
    })
  }

  args.push(outputPath)

  setStage?.(t('stage.converting', { format: target.toUpperCase() }))
  await transcode({
    args,
    durationSeconds: effectiveDuration,
    signal,
    onProgress: (value) => onProgress?.(3 + value * 0.96),
  })
  onProgress?.(100)

  const notes = []
  if (target === 'gif' && effectiveDuration > 30 && options.allowLongGif !== true) notes.push(t('note.gifTrimmed'))
  if (target === 'webm' && options.preset === 'slow') notes.push(t('note.vp9Slow'))
  if (options.normalize === true) notes.push(t('note.normalising'))

  return {
    note: notes.join(' ') || null,
    details: {
      [t('detail.duration')]: effectiveDuration ? formatDuration(effectiveDuration) : null,
      [t('detail.source')]: info.video
        ? `${info.video.width}×${info.video.height} ${info.video.codec}`
        : info.audio
          ? `${info.audio.codec} ${info.audio.channels}ch`
          : null,
      ...applied,
    },
  }
}

function buildVideoFilters(options, applied, t) {
  const filters = []

  if (options.fps && options.fps !== 'original') {
    filters.push(`fps=${Number(options.fps)}`)
    applied[t('detail.fps')] = `${Number(options.fps)} fps`
  }

  if (options.resolution && options.resolution !== 'original') {
    filters.push(`scale=-2:${Number(options.resolution)}:flags=lanczos`)
    applied[t('detail.resolution')] = `${Number(options.resolution)}p`
  } else {
    // O H.264/VP9 com yuv420p exige dimensões pares — o `trunc` garante isso
    // mesmo sem redimensionamento pedido (ex.: um GIF 201×151).
    filters.push('scale=trunc(iw/2)*2:trunc(ih/2)*2')
  }

  return filters
}

function gifArgs(options, applied, t) {
  const fps = clampNumber(options.gifFps, 5, 25, 12)
  const width = options.gifWidth && options.gifWidth !== 'original' ? Number(options.gifWidth) : null
  const scale = width ? `scale=${width}:-1:flags=lanczos,` : ''

  applied[t('detail.fps')] = `${fps} fps`
  applied[t('detail.width')] = width ? `${width}px` : t('value.original')

  const args = [
    '-vf',
    `fps=${fps},${scale}split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3`,
    '-loop',
    options.gifLoop === false ? '-1' : '0',
  ]
  if (options.gifLoop === false) applied[t('detail.loop')] = t('value.noLoop')

  if (options.allowLongGif !== true) args.push('-t', '30')
  return args
}

const ALLOWED_BITRATES = new Set(['96k', '128k', '160k', '192k', '256k', '320k'])

function normalizeBitrate(value) {
  if (!value) return '192k'
  const text = String(value).toLowerCase().replace(/bps$/, '')
  const withSuffix = text.endsWith('k') ? text : `${text}k`
  return ALLOWED_BITRATES.has(withSuffix) ? withSuffix : '192k'
}

const isLossless = (ext) => ext === 'flac' || ext === 'wav'

function numberOrNull(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, Math.round(number)))
}

export function formatDuration(seconds) {
  const total = Math.round(Number(seconds) || 0)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const pad = (value) => String(value).padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`
}

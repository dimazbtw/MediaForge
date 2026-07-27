import { spawn } from 'node:child_process'
import { requireBinary } from './binaries.js'

/** Executa um processo e devolve stdout, com suporte a AbortSignal. */
export function run(bin, args, { signal, onStderr, onStdout, cwd } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd, windowsHide: true })
    let stdout = ''
    let stderr = ''

    const onAbort = () => {
      child.kill('SIGKILL')
      reject(new Error('Processo cancelado.'))
    }
    if (signal) {
      if (signal.aborted) return onAbort()
      signal.addEventListener('abort', onAbort, { once: true })
    }

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      stdout += chunk
      if (stdout.length > 4_000_000) stdout = stdout.slice(-2_000_000)
      onStdout?.(chunk)
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
      if (stderr.length > 400_000) stderr = stderr.slice(-200_000)
      onStderr?.(chunk)
    })

    child.on('error', (error) => {
      signal?.removeEventListener('abort', onAbort)
      reject(new Error(`Não foi possível executar ${bin}: ${error.message}`))
    })
    child.on('close', (code) => {
      signal?.removeEventListener('abort', onAbort)
      if (code === 0) resolve({ stdout, stderr })
      else reject(new Error(lastMeaningfulLine(stderr) || `Processo terminou com código ${code}.`))
    })
  })
}

function lastMeaningfulLine(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^(frame|size|video:|\[.*@ 0x)/i.test(line))
  return lines.at(-1) || null
}

/** Metadados completos via ffprobe. */
export async function probe(filePath, { signal } = {}) {
  const bin = requireBinary('ffprobe')
  const { stdout } = await run(
    bin,
    ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', filePath],
    { signal },
  )
  const data = JSON.parse(stdout || '{}')
  const streams = data.streams || []
  const video = streams.find((stream) => stream.codec_type === 'video' && stream.disposition?.attached_pic !== 1)
  const audio = streams.find((stream) => stream.codec_type === 'audio')
  const duration = Number(data.format?.duration) || Number(video?.duration) || Number(audio?.duration) || 0
  return {
    duration,
    bitrate: Number(data.format?.bit_rate) || 0,
    size: Number(data.format?.size) || 0,
    formatName: data.format?.format_name || '',
    video: video
      ? {
          codec: video.codec_name,
          width: video.width,
          height: video.height,
          fps: parseFrameRate(video.avg_frame_rate || video.r_frame_rate),
        }
      : null,
    audio: audio
      ? {
          codec: audio.codec_name,
          channels: audio.channels,
          sampleRate: Number(audio.sample_rate) || 0,
          bitrate: Number(audio.bit_rate) || 0,
        }
      : null,
  }
}

function parseFrameRate(value) {
  if (!value || typeof value !== 'string') return 0
  const [num, den] = value.split('/').map(Number)
  if (!den) return num || 0
  return Math.round((num / den) * 100) / 100
}

/**
 * Corre o ffmpeg reportando progresso real (0-100) via `-progress pipe:1`.
 * `durationSeconds` é necessário para converter tempo decorrido em percentagem.
 */
export async function transcode({ args, durationSeconds, signal, onProgress }) {
  const bin = requireBinary('ffmpeg')
  const fullArgs = ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', ...args, '-progress', 'pipe:1', '-nostats']

  let buffer = ''
  await run(bin, fullArgs, {
    signal,
    onStdout: (chunk) => {
      buffer += chunk
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ''
      for (const line of lines) {
        const [key, value] = line.split('=')
        if (key === 'out_time_ms' && durationSeconds > 0) {
          const seconds = Number(value) / 1_000_000
          if (Number.isFinite(seconds)) {
            onProgress?.(Math.max(0, Math.min(99, (seconds / durationSeconds) * 100)))
          }
        } else if (key === 'progress' && value === 'end') {
          onProgress?.(100)
        }
      }
    },
  })
}

/** Presets de codec por formato de saída. */
export const AUDIO_PRESETS = {
  mp3: (bitrate = '192k') => ['-vn', '-c:a', 'libmp3lame', '-b:a', bitrate],
  wav: () => ['-vn', '-c:a', 'pcm_s16le'],
  ogg: (bitrate = '192k') => ['-vn', '-c:a', 'libvorbis', '-b:a', bitrate],
  opus: (bitrate = '160k') => ['-vn', '-c:a', 'libopus', '-b:a', bitrate],
  flac: () => ['-vn', '-c:a', 'flac', '-compression_level', '5'],
  aac: (bitrate = '192k') => ['-vn', '-c:a', 'aac', '-b:a', bitrate],
  m4a: (bitrate = '192k') => ['-vn', '-c:a', 'aac', '-b:a', bitrate, '-movflags', '+faststart'],
}

const CRF_BY_QUALITY = { alta: 20, media: 24, baixa: 30 }

/**
 * Argumentos de codec para um formato de vídeo.
 * Os filtros (-vf/-af) são compostos à parte, em converters/media.js, para que
 * escala, fps e recorte possam coexistir numa única cadeia.
 */
export function videoCodecArgs(target, { quality = 'media', preset = 'veryfast', audioBitrate = '192k' } = {}) {
  const crf = CRF_BY_QUALITY[quality] ?? 24
  const safePreset = ['veryfast', 'medium', 'slow'].includes(preset) ? preset : 'veryfast'

  switch (target) {
    case 'mp4':
      return ['-c:v', 'libx264', '-preset', safePreset, '-crf', String(crf), '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', audioBitrate, '-movflags', '+faststart']
    case 'mov':
      return ['-c:v', 'libx264', '-preset', safePreset, '-crf', String(crf), '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', audioBitrate]
    case 'mkv':
      return ['-c:v', 'libx264', '-preset', safePreset, '-crf', String(crf), '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', audioBitrate]
    case 'webm': {
      // No VP9 o esforço controla-se por -cpu-used (0 = melhor, 8 = mais rápido).
      const cpuUsed = { slow: 1, medium: 2, veryfast: 4 }[safePreset] ?? 4
      return ['-c:v', 'libvpx-vp9', '-crf', String(crf + 8), '-b:v', '0', '-deadline', 'good', '-cpu-used', String(cpuUsed), '-row-mt', '1', '-c:a', 'libopus', '-b:a', audioBitrate]
    }
    case 'avi':
      return ['-c:v', 'mpeg4', '-vtag', 'xvid', '-qscale:v', String(Math.round(crf / 4)), '-c:a', 'libmp3lame', '-b:a', audioBitrate]
    default:
      throw new Error(`Formato de vídeo não suportado: ${target}`)
  }
}

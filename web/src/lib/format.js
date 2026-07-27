export function formatBytes(bytes) {
  const value = Number(bytes)
  if (!Number.isFinite(value) || value <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)))
  const scaled = value / 1024 ** index
  return `${scaled >= 100 || index === 0 ? Math.round(scaled) : scaled.toFixed(1)} ${units[index]}`
}

export function formatDuration(seconds) {
  const total = Math.round(Number(seconds) || 0)
  if (!total) return '—'
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const pad = (value) => String(value).padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`
}

/** Devolve chave + parâmetros; quem mostra é que traduz. */
export function relativeParts(timestamp) {
  const diff = Date.now() - Number(timestamp || 0)
  if (!Number.isFinite(diff) || diff < 0) return ['time.now', {}]
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return ['time.now', {}]
  if (minutes < 60) return ['time.minutes', { count: minutes }]
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return ['time.hours', { count: hours }]
  return ['time.days', { count: Math.floor(hours / 24) }]
}

export function formatElapsed(job) {
  if (!job?.startedAt) return null
  const end = job.finishedAt || Date.now()
  const seconds = Math.max(0, Math.round((end - job.startedAt) / 1000))
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`
}

export function compactNumber(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  return new Intl.NumberFormat('pt-PT', { notation: 'compact', maximumFractionDigits: 1 }).format(number)
}

export const STATUS_KEY = {
  queued: 'status.queued',
  processing: 'status.processing',
  done: 'status.done',
  error: 'status.error',
  canceled: 'status.canceled',
}

export const KIND_KEY = {
  convert: 'kind.convert',
  video: 'kind.video',
  music: 'kind.music',
}

export function compactNumberIn(value, language) {
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  return new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'pt-PT', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(number)
}

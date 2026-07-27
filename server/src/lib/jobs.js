import { EventEmitter } from 'node:events'
import { nanoid } from 'nanoid'
import { config } from '../config.js'
import { safeRemove } from './storage.js'
import { translator, localizeError, DEFAULT_LANGUAGE } from './i18n.js'

export const jobEvents = new EventEmitter()
jobEvents.setMaxListeners(200)

/** @typedef {'queued'|'processing'|'done'|'error'|'canceled'} JobStatus */

const jobs = new Map()
const runtime = new Map() // jobId -> { abort, cleanup[] }

const MAX_JOBS = 500

function publish(job) {
  jobEvents.emit('job', serialize(job))
}

export function serialize(job) {
  const { onRun, ...rest } = job
  return structuredClone(rest)
}

export function createJob({ kind, title, subtitle, meta = {}, tracks = null, lang = DEFAULT_LANGUAGE }) {
  const t = translator(lang)
  const job = {
    id: nanoid(12),
    kind, // 'convert' | 'video' | 'music'
    // Guardado no próprio trabalho: as etapas e os erros são emitidos muito
    // depois do pedido HTTP terminar, e têm de sair no idioma de quem o criou.
    lang: t.language,
    title,
    subtitle: subtitle || '',
    status: /** @type {JobStatus} */ ('queued'),
    stage: t('stage.queued'),
    progress: 0,
    meta,
    tracks, // para álbuns/playlists: [{ id, title, artist, status, progress, fileId, error }]
    result: null, // { fileId, filename, size, mime, previewable }
    error: null,
    createdAt: Date.now(),
    startedAt: null,
    finishedAt: null,
    queuePosition: null,
  }
  jobs.set(job.id, job)
  trimJobs()
  publish(job)
  return job
}

function trimJobs() {
  if (jobs.size <= MAX_JOBS) return
  const sorted = [...jobs.values()].sort((a, b) => a.createdAt - b.createdAt)
  for (const job of sorted) {
    if (jobs.size <= MAX_JOBS) break
    if (job.status === 'processing' || job.status === 'queued') continue
    jobs.delete(job.id)
  }
}

export function getJob(id) {
  return jobs.get(id) || null
}

export function listJobs(ids) {
  if (Array.isArray(ids) && ids.length) {
    return ids.map((id) => jobs.get(id)).filter(Boolean).map(serialize)
  }
  return [...jobs.values()].sort((a, b) => b.createdAt - a.createdAt).map(serialize)
}

export function updateJob(id, patch) {
  const job = jobs.get(id)
  if (!job) return null
  Object.assign(job, patch)
  if (typeof job.progress === 'number') {
    job.progress = Math.max(0, Math.min(100, Math.round(job.progress)))
  }
  publish(job)
  return job
}

export function updateTrack(jobId, trackId, patch) {
  const job = jobs.get(jobId)
  if (!job?.tracks) return null
  const track = job.tracks.find((item) => item.id === trackId)
  if (!track) return null
  Object.assign(track, patch)
  if (typeof track.progress === 'number') {
    track.progress = Math.max(0, Math.min(100, Math.round(track.progress)))
  }
  const total = job.tracks.length
  const finished = job.tracks.filter((item) => item.status === 'done' || item.status === 'error').length
  const partial = job.tracks.reduce((sum, item) => sum + (item.progress || 0), 0) / (total * 100)
  job.progress = Math.max(0, Math.min(100, Math.round(partial * 100)))
  job.stage = translator(job.lang)('stage.trackProgress', { done: finished, total })
  publish(job)
  return track
}

/** Marca recursos a limpar quando o job terminar (pastas de trabalho, uploads). */
export function trackTemp(jobId, ...paths) {
  const entry = runtime.get(jobId) || { cleanup: [] }
  entry.cleanup.push(...paths.filter(Boolean))
  runtime.set(jobId, entry)
}

export function cancelJob(id) {
  const job = jobs.get(id)
  if (!job) return null
  if (job.status === 'done' || job.status === 'error' || job.status === 'canceled') return serialize(job)
  const t = translator(job.lang)
  const entry = runtime.get(id)
  entry?.controller?.abort(new Error(t('error.canceledByUser')))
  updateJob(id, { status: 'canceled', stage: t('stage.canceled'), finishedAt: Date.now() })
  return serialize(jobs.get(id))
}

// ── Fila com concorrência limitada ──────────────────────────────────────────

const pending = []
let active = 0

function refreshQueuePositions() {
  pending.forEach((task, index) => {
    const job = jobs.get(task.jobId)
    if (job && job.status === 'queued') {
      const t = translator(job.lang)
      job.queuePosition = index + 1
      job.stage = index === 0 ? t('stage.starting') : t('stage.queuedAt', { position: index + 1 })
      publish(job)
    }
  })
}

/**
 * Coloca um job na fila.
 * `runner` recebe `{ job, signal, setProgress, setStage }` e devolve o resultado.
 */
export function enqueue(job, runner) {
  return new Promise((resolve) => {
    pending.push({ jobId: job.id, runner, resolve })
    refreshQueuePositions()
    drain()
  })
}

function drain() {
  while (active < config.concurrency && pending.length) {
    const task = pending.shift()
    refreshQueuePositions()
    active += 1
    run(task).finally(() => {
      active -= 1
      drain()
    })
  }
}

async function run(task) {
  const job = jobs.get(task.jobId)
  if (!job || job.status === 'canceled') {
    task.resolve(null)
    return
  }

  const t = translator(job.lang)
  const controller = new AbortController()
  const entry = runtime.get(job.id) || { cleanup: [] }
  entry.controller = controller
  runtime.set(job.id, entry)

  const timeout = setTimeout(() => {
    controller.abort(new Error(t('error.timeout')))
  }, config.jobTimeoutMs)

  updateJob(job.id, {
    status: 'processing',
    stage: t('stage.processing'),
    progress: 0,
    startedAt: Date.now(),
    queuePosition: null,
  })

  const setProgress = (value, stage) => {
    const patch = { progress: value }
    if (stage) patch.stage = stage
    updateJob(job.id, patch)
  }
  const setStage = (stage) => updateJob(job.id, { stage })

  try {
    // `t` viaja com o contexto: é assim que cada motor emite texto no idioma
    // com que o trabalho foi criado, sem conhecer o pedido HTTP original.
    const result = await task.runner({ job, signal: controller.signal, setProgress, setStage, t })
    if (jobs.get(job.id)?.status === 'canceled') {
      task.resolve(null)
    } else {
      updateJob(job.id, {
        status: 'done',
        stage: t('stage.done'),
        progress: 100,
        result: result || null,
        finishedAt: Date.now(),
      })
      task.resolve(result || null)
    }
  } catch (error) {
    const canceled = controller.signal.aborted || jobs.get(job.id)?.status === 'canceled'
    updateJob(job.id, {
      status: canceled ? 'canceled' : 'error',
      stage: canceled ? t('stage.canceled') : t('stage.failed'),
      error: canceled ? t('error.canceled') : localizeError(error, job.lang),
      finishedAt: Date.now(),
    })
    task.resolve(null)
  } finally {
    clearTimeout(timeout)
    const cleanup = runtime.get(job.id)?.cleanup || []
    runtime.delete(job.id)
    for (const target of cleanup) await safeRemove(target)
  }
}

export function queueStats() {
  return { active, pending: pending.length, concurrency: config.concurrency }
}

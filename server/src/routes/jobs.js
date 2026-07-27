import { Router } from 'express'
import { getJob, listJobs, serialize, cancelJob, jobEvents, queueStats } from '../lib/jobs.js'
import { languageOf, t } from '../lib/i18n.js'

export const jobsRouter = Router()

/** Stream SSE com todas as atualizações de trabalhos. */
jobsRouter.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.write('retry: 3000\n\n')

  const onJob = (job) => {
    res.write(`event: job\ndata: ${JSON.stringify(job)}\n\n`)
  }
  jobEvents.on('job', onJob)

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000)

  req.on('close', () => {
    clearInterval(heartbeat)
    jobEvents.off('job', onJob)
  })
})

jobsRouter.get('/', (req, res) => {
  const ids = req.query.ids ? String(req.query.ids).split(',').filter(Boolean) : null
  res.json({ jobs: listJobs(ids), queue: queueStats() })
})

jobsRouter.get('/:id', (req, res) => {
  const job = getJob(req.params.id)
  if (!job) return res.status(404).json({ error: t(languageOf(req), 'error.jobNotFound') })
  res.json({ job: serialize(job) })
})

jobsRouter.post('/:id/cancel', (req, res) => {
  const job = cancelJob(req.params.id)
  if (!job) return res.status(404).json({ error: t(languageOf(req), 'error.jobNotFound') })
  res.json({ job })
})

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api.js'

const JobsContext = createContext(null)
const HISTORY_KEY = 'mediaforge.history'
const HISTORY_CAP = 80

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Estado global dos trabalhos.
 * O servidor empurra atualizações por SSE; o polling só entra em cena se
 * a ligação SSE cair (rede instável, proxy que não faz streaming).
 */
export function JobsProvider({ children }) {
  const [jobs, setJobs] = useState({})
  const [connected, setConnected] = useState(false)
  const [history, setHistory] = useState(loadHistory)
  const historyIds = useRef(new Set(loadHistory().map((entry) => entry.id)))

  const remember = useCallback((job) => {
    if (job.status !== 'done' || !job.result?.fileId) return
    if (historyIds.current.has(job.id)) return
    historyIds.current.add(job.id)

    const entry = {
      id: job.id,
      kind: job.kind,
      title: job.title,
      subtitle: job.subtitle,
      filename: job.result.filename,
      fileId: job.result.fileId,
      size: job.result.size,
      ext: job.result.ext,
      preview: job.result.preview,
      cover: job.meta?.thumbnail || job.meta?.cover || null,
      finishedAt: job.finishedAt || Date.now(),
      tracks: job.tracks?.filter((track) => track.status === 'done').map((track) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        fileId: track.fileId,
        filename: track.filename,
        size: track.size,
      })),
    }

    setHistory((current) => {
      const next = [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, HISTORY_CAP)
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      } catch {
        /* quota cheia — o histórico é só conveniência */
      }
      return next
    })
  }, [])

  const upsert = useCallback(
    (job) => {
      setJobs((current) => ({ ...current, [job.id]: job }))
      remember(job)
    },
    [remember],
  )

  const upsertMany = useCallback(
    (list) => {
      setJobs((current) => {
        const next = { ...current }
        for (const job of list) next[job.id] = job
        return next
      })
      for (const job of list) remember(job)
    },
    [remember],
  )

  // ── SSE ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    let source
    let retry
    let closed = false

    const connect = () => {
      source = new EventSource('/api/jobs/events')
      source.addEventListener('open', () => setConnected(true))
      source.addEventListener('job', (event) => {
        try {
          upsert(JSON.parse(event.data))
        } catch {
          /* mensagem malformada — ignorar */
        }
      })
      source.addEventListener('error', () => {
        setConnected(false)
        source.close()
        if (!closed) retry = setTimeout(connect, 3000)
      })
    }

    connect()
    return () => {
      closed = true
      clearTimeout(retry)
      source?.close()
    }
  }, [upsert])

  // ── Fallback: polling enquanto o SSE estiver em baixo ─────────────────────
  const activeIds = useMemo(
    () =>
      Object.values(jobs)
        .filter((job) => job.status === 'queued' || job.status === 'processing')
        .map((job) => job.id),
    [jobs],
  )

  useEffect(() => {
    if (connected || !activeIds.length) return undefined
    const timer = setInterval(() => {
      api
        .jobs(activeIds)
        .then((data) => upsertMany(data.jobs || []))
        .catch(() => {})
    }, 1500)
    return () => clearInterval(timer)
  }, [connected, activeIds, upsertMany])

  const cancel = useCallback(
    (id) => api.cancelJob(id).then((data) => data?.job && upsert(data.job)).catch(() => {}),
    [upsert],
  )

  const clearHistory = useCallback(() => {
    historyIds.current = new Set()
    setHistory([])
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch {
      /* nada a fazer */
    }
  }, [])

  const dismiss = useCallback((id) => {
    setJobs((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }, [])

  const value = useMemo(() => {
    const list = Object.values(jobs).sort((a, b) => b.createdAt - a.createdAt)
    return {
      jobs: list,
      byId: jobs,
      byKind: (kind) => list.filter((job) => job.kind === kind),
      active: list.filter((job) => job.status === 'queued' || job.status === 'processing'),
      connected,
      history,
      clearHistory,
      upsert,
      upsertMany,
      cancel,
      dismiss,
    }
  }, [jobs, connected, history, clearHistory, upsert, upsertMany, cancel, dismiss])

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>
}

export function useJobs() {
  const context = useContext(JobsContext)
  if (!context) throw new Error('useJobs tem de ser usado dentro de <JobsProvider>')
  return context
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api.js'

const CapabilitiesContext = createContext(null)

/**
 * Estado de arranque quando ainda não falámos com o servidor.
 *
 * `compressionTargets` fica VAZIO de propósito: se a API estiver inacessível,
 * é preferível não oferecer destino nenhum a oferecer só «zip» — isso fazia
 * uma falha de ligação parecer-se com um conjunto de funcionalidades limitado,
 * e o utilizador ficava a pensar que o conversor só sabia comprimir.
 */
const FALLBACK = {
  tools: {},
  conversion: { matrix: [], accepted: [], compressionTargets: [], maxUploadMb: 512 },
  limits: { maxUploadMb: 512, maxPlaylistItems: 50, fileTtlHours: 2, concurrency: 2 },
  features: {},
}

const ALIASES = { jpeg: 'jpg', jpe: 'jpg', tif: 'tiff', htm: 'html', mpg: 'mpeg', markdown: 'md' }
const canonical = (raw) => {
  const ext = String(raw || '').toLowerCase().replace(/^\./, '')
  return ALIASES[ext] || ext
}

export function CapabilitiesProvider({ children }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const timer = useRef(null)

  const load = useCallback((manual = false) => {
    clearTimeout(timer.current)
    setLoading(true)
    if (manual) setError(null)

    return api
      .capabilities()
      .then((result) => {
        setData(result)
        setError(null)
        setAttempt(0)
      })
      .catch((caught) => {
        setError(caught.message || 'Não foi possível contactar o servidor.')
        // Repete sozinho com recuo progressivo: um servidor que arranca depois
        // do browser deixaria a aplicação presa num estado inútil para sempre.
        setAttempt((current) => {
          const next = current + 1
          const delay = Math.min(30_000, 2000 * 2 ** Math.min(current, 4))
          timer.current = setTimeout(() => load(), delay)
          return next
        })
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    return () => clearTimeout(timer.current)
  }, [load])

  // Uma janela que volta ao primeiro plano é boa altura para tentar de novo.
  useEffect(() => {
    const onFocus = () => {
      if (!data) load()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [data, load])

  const value = useMemo(() => {
    const caps = data || FALLBACK
    const online = Boolean(data)

    const byExt = new Map()
    for (const category of caps.conversion.matrix) {
      for (const ext of category.accepts) {
        byExt.set(ext, { category: category.id, label: category.label, produces: category.produces })
      }
    }

    /** Destinos possíveis para uma extensão (espelha targetsFor do servidor). */
    const targetsFor = (rawExt) => {
      if (!online) return []
      const ext = canonical(rawExt)
      const entry = byExt.get(ext)
      const compression = caps.conversion.compressionTargets || []
      if (!entry) return [...compression]
      const extra = ext === 'gif' ? ['mp4', 'webm'] : []
      const merged = entry.category === 'archive' ? entry.produces : [...entry.produces, ...extra, ...compression]
      return [...new Set(merged)].filter((target) => target !== ext)
    }

    const categoryOf = (rawExt) => byExt.get(canonical(rawExt))?.category || null

    return {
      ...caps,
      loading,
      error,
      attempt,
      online,
      reload: () => load(true),
      targetsFor,
      categoryOf,
    }
  }, [data, loading, error, attempt, load])

  return <CapabilitiesContext.Provider value={value}>{children}</CapabilitiesContext.Provider>
}

export function useCapabilities() {
  const context = useContext(CapabilitiesContext)
  if (!context) throw new Error('useCapabilities tem de ser usado dentro de <CapabilitiesProvider>')
  return context
}

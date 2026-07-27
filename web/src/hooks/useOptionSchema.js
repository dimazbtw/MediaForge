import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { getLanguage } from '../i18n/index.jsx'

/**
 * Esquema de opções para um par (origem → destino), com cache.
 * O mesmo par é pedido uma vez por sessão, por muitos ficheiros que existam
 * na fila — a matriz é estática do lado do servidor.
 */
const cache = new Map()
const pending = new Map()

export function loadOptionSchema(from, to) {
  // O idioma entra na chave: o esquema vem do servidor já traduzido.
  const key = `${getLanguage()}|${from}>${to}`
  if (cache.has(key)) return Promise.resolve(cache.get(key))
  if (pending.has(key)) return pending.get(key)

  const request = api
    .convertOptions(from, to)
    .then((data) => {
      const value = { fields: data.fields || [], defaults: data.defaults || {} }
      cache.set(key, value)
      pending.delete(key)
      return value
    })
    .catch((error) => {
      pending.delete(key)
      throw error
    })

  pending.set(key, request)
  return request
}

export function peekOptionSchema(from, to) {
  return cache.get(`${getLanguage()}|${from}>${to}`) || null
}

export function useOptionSchema(from, to, { enabled = true } = {}) {
  const [state, setState] = useState(() => ({
    schema: from && to ? peekOptionSchema(from, to) : null,
    loading: false,
    error: null,
  }))

  useEffect(() => {
    if (!enabled || !from || !to) return undefined
    const cached = peekOptionSchema(from, to)
    if (cached) {
      setState({ schema: cached, loading: false, error: null })
      return undefined
    }

    let alive = true
    setState({ schema: null, loading: true, error: null })
    loadOptionSchema(from, to)
      .then((schema) => alive && setState({ schema, loading: false, error: null }))
      .catch((error) => alive && setState({ schema: null, loading: false, error: error.message }))

    return () => {
      alive = false
    }
  }, [from, to, enabled])

  return state
}

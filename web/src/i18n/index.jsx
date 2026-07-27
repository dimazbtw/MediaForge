import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import pt from './pt.js'
import en from './en.js'

const DICTIONARIES = { pt, en }
export const LANGUAGES = [
  { code: 'pt', label: 'Português', short: 'PT' },
  { code: 'en', label: 'English', short: 'EN' },
]

const STORAGE_KEY = 'mediaforge.lang'
const I18nContext = createContext(null)

function detectLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && DICTIONARIES[saved]) return saved
  } catch {
    /* modo privado */
  }
  const browser = (navigator.language || 'pt').slice(0, 2).toLowerCase()
  return DICTIONARIES[browser] ? browser : 'pt'
}

/** Idioma atual fora do React — o cliente HTTP precisa dele em cada pedido. */
let currentLanguage = typeof window === 'undefined' ? 'pt' : detectLanguage()
export const getLanguage = () => currentLanguage

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(currentLanguage)

  useEffect(() => {
    currentLanguage = language
    document.documentElement.lang = language === 'pt' ? 'pt-PT' : 'en'
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
      /* modo privado */
    }
  }, [language])

  const value = useMemo(() => {
    const dictionary = DICTIONARIES[language] || pt

    /**
     * Traduz uma chave, interpolando `{parâmetros}`.
     * Se a chave não existir, cai no português e depois na própria chave —
     * é melhor mostrar algo do que um espaço em branco.
     */
    const t = (key, params) => {
      const template = dictionary[key] ?? pt[key] ?? key
      if (!params) return template
      return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))
    }

    return {
      language,
      t,
      setLanguage: (next) => DICTIONARIES[next] && setLanguage(next),
      toggle: () => setLanguage((current) => (current === 'pt' ? 'en' : 'pt')),
      languages: LANGUAGES,
    }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n tem de ser usado dentro de <I18nProvider>')
  return context
}

/** Atalho para quem só precisa da função de tradução. */
export function useT() {
  return useI18n().t
}

/**
 * Interpola componentes React num texto traduzido.
 * `t('faq.cta', …)` devolve "Pronto para começar? {converter} ou {link}." e
 * isto substitui os marcadores por elementos, sem recorrer a HTML cru.
 */
export function useRichText() {
  const { t } = useI18n()
  return useCallback(
    (key, slots = {}) => {
      const template = t(key)
      const parts = String(template).split(/(\{\w+\})/g)
      return parts.map((part, index) => {
        const match = /^\{(\w+)\}$/.exec(part)
        if (!match) return part
        const slot = slots[match[1]]
        return slot ? <span key={index}>{slot}</span> : part
      })
    },
    [t],
  )
}

import { useMemo } from 'react'
import clsx from 'clsx'
import { Info } from 'lucide-react'
import { Label, Segmented, Toggle } from './ui.jsx'
import { useI18n } from '../i18n/index.jsx'

/**
 * Renderiza um esquema de opções vindo do servidor.
 *
 * A UI não sabe nada sobre formatos: desenha o que o servidor declarar. Assim
 * nunca aparece um controlo que o motor não saiba aplicar, nem falta um que ele
 * suporte — o esquema é a única fonte de verdade.
 */
export default function OptionsForm({ fields = [], value = {}, onChange, columns = 2, className }) {
  const { t } = useI18n()
  const groups = useMemo(() => {
    const map = new Map()
    for (const field of fields) {
      const key = field.group || t('common.options')
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(field)
    }
    return [...map.entries()]
  }, [fields, t])

  const set = (key, next) => onChange({ ...value, [key]: next })

  if (!fields.length) {
    return <p className={clsx('text-[13px] text-muted', className)}>{t('converter.noOptions')}</p>
  }

  return (
    <div className={clsx('space-y-5', className)}>
      {groups.map(([group, groupFields]) => {
        const visible = groupFields.filter((field) => isVisible(field, value))
        if (!visible.length) return null

        return (
          <fieldset key={group}>
            <legend className="mf-label mb-2.5">{group}</legend>
            <div className={clsx('grid gap-x-4 gap-y-3.5', columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1')}>
              {visible.map((field) => (
                <div key={field.key} className={clsx(spansFullRow(field) && 'sm:col-span-2')}>
                  <Field field={field} value={value[field.key]} onChange={(next) => set(field.key, next)} />
                </div>
              ))}
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}

/** Um campo só aparece se a sua condição `showIf` estiver satisfeita. */
export function isVisible(field, value) {
  const rule = field.showIf
  if (!rule) return true
  const current = value?.[rule.key]
  if (Array.isArray(rule.in)) return rule.in.map(String).includes(String(current))
  if ('equals' in rule) {
    // Comparação tolerante: os toggles chegam como booleanos, os selects como texto.
    if (typeof rule.equals === 'boolean') return Boolean(current) === rule.equals
    return String(current) === String(rule.equals)
  }
  return true
}

const spansFullRow = (field) => field.type === 'note' || field.type === 'toggle' || field.type === 'segmented'

function Field({ field, value, onChange }) {
  switch (field.type) {
    case 'note':
      return (
        <div className="flex gap-2.5 rounded-xl border border-line bg-raised px-3.5 py-2.5">
          <Info size={14} className="text-muted shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-muted leading-relaxed">{field.text}</p>
        </div>
      )

    case 'toggle':
      return (
        <Toggle
          id={`opt-${field.key}`}
          checked={Boolean(value)}
          onChange={onChange}
          label={field.label}
          hint={field.hint}
        />
      )

    case 'segmented':
      return (
        <div>
          <Label className="mb-1.5">{field.label}</Label>
          <Segmented options={field.options} value={String(value)} onChange={onChange} className="w-full" />
          {field.hint && <Hint>{field.hint}</Hint>}
        </div>
      )

    case 'select':
      return (
        <label className="block">
          <Label className="mb-1.5">{field.label}</Label>
          <select className="mf-field mf-select" value={String(value)} onChange={(event) => onChange(event.target.value)}>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {field.hint && <Hint>{field.hint}</Hint>}
        </label>
      )

    case 'range':
      return (
        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <Label>{field.label}</Label>
            <span className="mf-data text-accent">
              {value}
              {field.unit || ''}
            </span>
          </div>
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step || 1}
            value={Number(value)}
            onChange={(event) => onChange(Number(event.target.value))}
            className="mf-range"
            aria-label={field.label}
          />
          {field.hint && <Hint>{field.hint}</Hint>}
        </div>
      )

    case 'number':
      return (
        <label className="block">
          <Label className="mb-1.5">{field.label}</Label>
          <input
            type="number"
            className="mf-field"
            value={value ?? ''}
            min={field.min}
            max={field.max}
            onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
          />
          {field.hint && <Hint>{field.hint}</Hint>}
        </label>
      )

    case 'time':
      return (
        <label className="block">
          <Label className="mb-1.5">{field.label}</Label>
          <input
            type="text"
            inputMode="numeric"
            className="mf-field font-mono"
            placeholder={field.placeholder || 'm:ss'}
            value={formatTimeValue(value)}
            onChange={(event) => onChange(event.target.value)}
            aria-label={field.label}
          />
          {field.hint && <Hint>{field.hint}</Hint>}
        </label>
      )

    case 'color':
      return (
        <div>
          <Label className="mb-1.5">{field.label}</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value || '#ffffff'}
              onChange={(event) => onChange(event.target.value)}
              className="w-10 h-10 rounded-[10px] border border-line bg-raised cursor-pointer shrink-0"
              aria-label={field.label}
            />
            <input
              type="text"
              className="mf-field font-mono uppercase"
              value={value || '#ffffff'}
              onChange={(event) => onChange(event.target.value)}
            />
          </div>
          {field.hint && <Hint>{field.hint}</Hint>}
        </div>
      )

    default:
      return null
  }
}

function Hint({ children }) {
  return <p className="text-[11.5px] text-faint mt-1.5 leading-snug">{children}</p>
}

/** O servidor devolve segundos; o campo mostra m:ss para ser legível. */
function formatTimeValue(value) {
  if (value === '' || value == null) return ''
  if (typeof value === 'string') return value
  const total = Math.round(Number(value))
  if (!Number.isFinite(total)) return ''
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const pad = (part) => String(part).padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`
}

/** Só envia ao servidor os campos que estão realmente visíveis. */
export function visibleValues(fields, value) {
  const out = {}
  for (const field of fields) {
    if (field.type === 'note') continue
    if (!isVisible(field, value)) continue
    out[field.key] = value[field.key]
  }
  return out
}

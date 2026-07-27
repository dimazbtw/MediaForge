import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

export function Button({ as: Tag = 'button', variant = 'primary', size = 'md', busy, className, children, ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none select-none whitespace-nowrap'
  const sizes = {
    sm: 'h-8 px-3 text-[13px]',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-[15px]',
  }
  const variants = {
    primary:
      'bg-accent text-accent-ink hover:brightness-110 active:brightness-95 shadow-[0_8px_24px_-12px_var(--mf-accent)]',
    ghost: 'text-muted hover:text-ink hover:bg-raised border border-transparent hover:border-line',
    outline: 'border border-line-strong text-ink hover:border-accent hover:text-accent bg-transparent',
    danger: 'bg-danger-soft text-danger border border-danger/30 hover:bg-danger hover:text-canvas',
    subtle: 'bg-raised border border-line text-ink hover:border-line-strong',
  }

  return (
    <Tag className={clsx(base, sizes[size], variants[variant], className)} disabled={busy || props.disabled} {...props}>
      {busy && <Loader2 size={15} className="mf-spin" />}
      {children}
    </Tag>
  )
}

export function Card({ className, children, ...props }) {
  return (
    <div className={clsx('mf-card', className)} {...props}>
      {children}
    </div>
  )
}

export function Label({ children, className }) {
  return <span className={clsx('mf-label block', className)}>{children}</span>
}

export function Select({ label, className, children, ...props }) {
  return (
    <label className="block">
      {label && <Label className="mb-1.5">{label}</Label>}
      <select className={clsx('mf-field mf-select', className)} {...props}>
        {children}
      </select>
    </label>
  )
}

export function TextInput({ label, className, ...props }) {
  return (
    <label className="block w-full">
      {label && <Label className="mb-1.5">{label}</Label>}
      <input className={clsx('mf-field', className)} {...props} />
    </label>
  )
}

export function Segmented({ options, value, onChange, className }) {
  return (
    <div className={clsx('mf-inset inline-flex p-1 gap-1', className)} role="tablist">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={clsx(
              'rounded-[7px] px-3 h-8 text-[13px] font-medium transition-all duration-150',
              selected ? 'bg-accent text-accent-ink' : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({ checked, onChange, label, hint, id }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
      <span className="relative mt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          className={clsx(
            'block w-10 h-6 rounded-full border transition-colors duration-200',
            checked ? 'bg-accent border-accent' : 'bg-raised border-line group-hover:border-line-strong',
          )}
        />
        <span
          className={clsx(
            'absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-200',
            checked ? 'translate-x-4 bg-accent-ink' : 'bg-faint',
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight">{label}</span>
        {hint && <span className="block text-xs text-muted mt-0.5 leading-snug">{hint}</span>}
      </span>
    </label>
  )
}

const STATUS_STYLES = {
  idle: 'text-faint border-line',
  queued: 'text-cyan border-cyan/35 bg-cyan-soft',
  processing: 'text-accent border-accent/40 bg-accent-soft',
  done: 'text-accent border-accent/50 bg-accent-soft',
  error: 'text-danger border-danger/40 bg-danger-soft',
  canceled: 'text-faint border-line bg-raised',
}

export function StatusPill({ status, children }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 mf-data uppercase tracking-wider',
        STATUS_STYLES[status] || STATUS_STYLES.idle,
      )}
    >
      {status === 'processing' && <span className="w-1.5 h-1.5 rounded-full bg-accent mf-pulse-dot" />}
      {status === 'queued' && <span className="w-1.5 h-1.5 rounded-full bg-cyan" />}
      {children}
    </span>
  )
}

export function Badge({ children, tone = 'neutral', className }) {
  const tones = {
    neutral: 'border-line text-muted',
    accent: 'border-accent/40 text-accent bg-accent-soft',
    cyan: 'border-cyan/35 text-cyan bg-cyan-soft',
    danger: 'border-danger/40 text-danger bg-danger-soft',
  }
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 mf-data uppercase tracking-wider',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Barra de progresso: determinada quando há percentagem, indeterminada quando não há. */
export function Progress({ value, status = 'processing', className }) {
  const determinate = typeof value === 'number' && value > 0
  const tone = status === 'error' ? 'bg-danger' : status === 'done' ? 'bg-accent' : 'bg-accent'

  return (
    <div className={clsx('relative h-1.5 rounded-full bg-raised overflow-hidden border border-line', className)}>
      {determinate ? (
        <div
          className={clsx('mf-progress-fill h-full rounded-full transition-[width] duration-300 ease-out', tone)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      ) : (
        <div className="absolute inset-0 mf-shimmer" />
      )}
    </div>
  )
}

export function Note({ children, tone = 'neutral', icon: Icon, className }) {
  const tones = {
    neutral: 'border-line bg-raised text-muted',
    accent: 'border-accent/30 bg-accent-soft text-ink',
    cyan: 'border-cyan/30 bg-cyan-soft text-ink',
    danger: 'border-danger/30 bg-danger-soft text-ink',
  }
  return (
    <div className={clsx('flex gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed', tones[tone], className)}>
      {Icon && <Icon size={15} className="shrink-0 mt-0.5 opacity-80" />}
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export function Spinner({ size = 16, className }) {
  return <Loader2 size={size} className={clsx('mf-spin', className)} />
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6">
      {Icon && (
        <div className="mf-inset w-12 h-12 grid place-items-center mb-4 text-faint">
          <Icon size={20} />
        </div>
      )}
      <p className="font-display text-lg font-semibold tracking-tight">{title}</p>
      {children && <p className="text-sm text-muted mt-1.5 max-w-sm leading-relaxed">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

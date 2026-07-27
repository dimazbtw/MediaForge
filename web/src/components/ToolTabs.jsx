import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { TOOLS } from './Layout.jsx'
import { useI18n } from '../i18n/index.jsx'

/**
 * O hub: as três ferramentas vivem no mesmo sítio e trocam-se por separadores.
 * São links reais (URL partilhável, botão "voltar" funciona).
 */
export default function ToolTabs({ title, lead, children, aside }) {
  const { t } = useI18n()

  return (
    <div className="mf-stack space-y-7">
      <div className="mf-inset p-1 flex gap-1 overflow-x-auto" role="tablist">
        {TOOLS.map((tool) => (
          <NavLink
            key={tool.to}
            to={tool.to}
            role="tab"
            className={({ isActive }) =>
              clsx(
                'flex-1 min-w-[110px] flex items-center justify-center gap-2 h-11 rounded-[11px] text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-accent text-accent-ink shadow-[0_8px_22px_-14px_var(--mf-accent)]'
                  : 'text-muted hover:text-ink hover:bg-surface',
              )
            }
          >
            <tool.icon size={16} />
            {t(tool.labelKey)}
          </NavLink>
        ))}
      </div>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-[40px] font-extrabold tracking-[-0.035em]">{title}</h1>
          {lead && <p className="text-muted mt-2 max-w-xl leading-relaxed">{lead}</p>}
        </div>
        {aside}
      </header>

      {children}
    </div>
  )
}

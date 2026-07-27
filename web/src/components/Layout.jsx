import { NavLink, Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import {
  Sun,
  Moon,
  Flame,
  FileStack,
  Youtube,
  Music4,
  History,
  HelpCircle,
  Wifi,
  WifiOff,
  ServerCrash,
  RotateCw,
  Languages,
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme.jsx'
import { useJobs } from '../hooks/useJobs.jsx'
import { useCapabilities } from '../hooks/useCapabilities.jsx'
import { useI18n } from '../i18n/index.jsx'

export const TOOLS = [
  { to: '/conversor', labelKey: 'nav.converter', blurbKey: 'tool.converter.blurb', icon: FileStack },
  { to: '/video', labelKey: 'nav.video', blurbKey: 'tool.video.blurb', icon: Youtube },
  { to: '/musica', labelKey: 'nav.music', blurbKey: 'tool.music.blurb', icon: Music4 },
]

const SECONDARY = [
  { to: '/historico', labelKey: 'nav.history', icon: History },
  { to: '/faq', labelKey: 'nav.faq', icon: HelpCircle },
]

export default function Layout({ children }) {
  const { isDark, toggle } = useTheme()
  const { active, connected } = useJobs()
  const { limits, online, loading, reload } = useCapabilities()
  const { t, language, setLanguage, languages } = useI18n()
  const location = useLocation()
  const onHome = location.pathname === '/'
  const offline = !online && !loading

  return (
    <div className="relative z-10 min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="h-16 flex items-center gap-3 sm:gap-6">
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <Logo />
              <span className="font-display text-[19px] font-extrabold tracking-[-0.03em] hidden sm:block">
                Media<span className="text-accent">Forge</span>
              </span>
            </Link>

            <nav className="flex items-center gap-0.5 ml-auto sm:ml-0 overflow-x-auto mf-marquee-mask">
              {TOOLS.map((tool) => (
                <NavItem key={tool.to} to={tool.to} label={t(tool.labelKey)} icon={tool.icon} />
              ))}
              <span className="w-px h-5 bg-line mx-1.5 hidden sm:block" />
              {SECONDARY.map((item) => (
                <NavItem key={item.to} to={item.to} label={t(item.labelKey)} icon={item.icon} compact />
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2 shrink-0">
              {active.length > 0 && (
                <span className="hidden md:inline-flex items-center gap-1.5 mf-data text-accent border border-accent/35 bg-accent-soft rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mf-pulse-dot" />
                  {t('nav.active', { count: active.length })}
                </span>
              )}

              {/* Seletor de idioma: dois botões, sem menu — são só dois. */}
              <div className="mf-inset flex items-center p-0.5 gap-0.5" role="group" aria-label={t('lang.switchTo')}>
                <Languages size={13} className="text-faint ml-1.5 mr-0.5 shrink-0" aria-hidden />
                {languages.map((entry) => (
                  <button
                    key={entry.code}
                    type="button"
                    onClick={() => setLanguage(entry.code)}
                    aria-pressed={language === entry.code}
                    title={entry.label}
                    className={clsx(
                      'h-7 px-2 rounded-[7px] mf-data transition-colors duration-150',
                      language === entry.code ? 'bg-accent text-accent-ink' : 'text-muted hover:text-ink',
                    )}
                  >
                    {entry.short}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={toggle}
                aria-label={isDark ? t('nav.themeLight') : t('nav.themeDark')}
                title={isDark ? t('nav.themeLight') : t('nav.themeDark')}
                className="w-9 h-9 grid place-items-center rounded-[10px] border border-line text-muted hover:text-accent hover:border-accent/50 transition-colors"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/*
        Sem a API não há matriz de formatos. Em vez de deixar a interface
        degradar-se em silêncio, o problema é dito por palavras e com o que
        fazer a seguir.
      */}
      {offline && (
        <div className="sticky top-16 z-30 border-b border-danger/40 bg-danger-soft backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-2.5 flex items-center gap-3">
            <ServerCrash size={16} className="text-danger shrink-0" />
            <p className="text-[13px] leading-snug min-w-0 flex-1">
              <strong>{t('offline.title')}</strong>{' '}
              <span className="text-muted">
                {t('offline.body', { command: 'npm run dev' })}
              </span>
            </p>
            <button
              type="button"
              onClick={reload}
              className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-danger/40 text-[13px] hover:bg-danger hover:text-canvas transition-colors"
            >
              <RotateCw size={13} />
              {t('common.tryNow')}
            </button>
          </div>
        </div>
      )}

      <main className={clsx('flex-1 w-full', onHome ? '' : 'mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12')}>
        {children}
      </main>

      <footer className="border-t border-line mt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <Logo size={22} />
                <span className="font-display text-base font-extrabold tracking-tight">MediaForge</span>
              </div>
              <p className="text-[13px] text-muted leading-relaxed max-w-sm">
                {t('footer.about', { hours: limits?.fileTtlHours ?? 2 })}
              </p>
            </div>

            <div>
              <p className="mf-label mb-3">{t('footer.tools')}</p>
              <ul className="space-y-2">
                {TOOLS.map((tool) => (
                  <li key={tool.to}>
                    <Link to={tool.to} className="text-[13px] text-muted hover:text-accent transition-colors">
                      {t(tool.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mf-label mb-3">{t('footer.status')}</p>
              <ul className="space-y-2 text-[13px] text-muted">
                <li className="flex items-center gap-2">
                  {online && connected ? (
                    <Wifi size={13} className="text-accent" />
                  ) : (
                    <WifiOff size={13} className={offline ? 'text-danger' : 'text-faint'} />
                  )}
                  {online && connected ? t('status.connected') : offline ? t('status.unreachable') : t('status.connecting')}
                </li>
                <li>
                  <Link to="/faq" className="hover:text-accent transition-colors">
                    {t('footer.limits')}
                  </Link>
                </li>
                <li>
                  <Link to="/historico" className="hover:text-accent transition-colors">
                    {t('footer.history')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Aviso legal — visível em todas as páginas. */}
          <div className="mt-9 pt-6 border-t border-line">
            <div className="rounded-xl border border-line bg-raised px-4 py-3.5">
              <p className="mf-label mb-1.5 text-danger">{t('footer.legalTitle')}</p>
              <p className="text-[12.5px] text-muted leading-relaxed">
                {t('footer.legal')}{' '}
                <Link to="/faq" className="text-accent hover:underline underline-offset-2">
                  {t('footer.readMore')}
                </Link>
                .
              </p>
            </div>
            <p className="mt-4 mf-data text-faint">{t('footer.tagline')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function NavItem({ to, label, icon: Icon, compact }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'relative flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-[9px] text-[13.5px] font-medium transition-colors duration-150 shrink-0',
          isActive ? 'text-accent bg-accent-soft' : 'text-muted hover:text-ink hover:bg-raised',
        )
      }
    >
      <Icon size={15} />
      <span className={clsx(compact && 'hidden lg:inline')}>{label}</span>
    </NavLink>
  )
}

function Logo({ size = 26 }) {
  return (
    <span
      className="grid place-items-center rounded-[8px] bg-accent text-accent-ink shrink-0"
      style={{ width: size, height: size }}
    >
      <Flame size={size * 0.58} strokeWidth={2.3} />
    </span>
  )
}

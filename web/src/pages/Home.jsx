import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, UploadCloud, Link2, FileText, Music4, ShieldCheck, Timer, Cpu, ArrowUpRight } from 'lucide-react'
import clsx from 'clsx'
import { TOOLS } from '../components/Layout.jsx'
import { useCapabilities } from '../hooks/useCapabilities.jsx'
import { useI18n } from '../i18n/index.jsx'
import { Badge } from '../components/ui.jsx'
import { stashFiles } from '../lib/handoff.js'

export default function Home() {
  const { limits, features, online } = useCapabilities()
  const { t } = useI18n()
  const navigate = useNavigate()

  const inputRef = useRef(null)
  const dragDepth = useRef(0)
  const [over, setOver] = useState(false)
  const [url, setUrl] = useState('')

  /** Os ficheiros seguem para o conversor sem passarem pelo servidor. */
  const handleFiles = useCallback(
    (list) => {
      const files = [...list]
      if (!files.length) return
      stashFiles(files)
      navigate('/conversor')
    },
    [navigate],
  )

  /** Um link de música vai para Música; tudo o resto para Vídeo. */
  const submitLink = (event) => {
    event.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    const musical = /spotify\.com|soundcloud\.com|bandcamp\.com|music\.youtube\.com/i.test(trimmed)
    navigate(`${musical ? '/musica' : '/video'}?url=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="w-full">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-14 pb-8 sm:pt-20">
        <div className="mf-stack max-w-2xl">
          <Badge tone="accent">{t('home.badge')}</Badge>

          <h1 className="mt-5 font-display font-extrabold tracking-[-0.04em] text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.95]">
            {t('home.title1')} <span className="text-accent">{t('home.title2')}</span>
          </h1>

          <p className="mt-5 text-[17px] text-muted max-w-xl leading-relaxed">{t('home.lead')}</p>
        </div>
      </section>

      {/* ── As duas caixas ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="grid gap-4 lg:grid-cols-2 items-stretch mf-stack">
          {/* Caixa 1 — arrastar ficheiros */}
          <div
            role="button"
            tabIndex={online ? 0 : -1}
            aria-disabled={!online}
            onClick={() => online && inputRef.current?.click()}
            onKeyDown={(event) => {
              if (!online) return
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                inputRef.current?.click()
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault()
              dragDepth.current += 1
              setOver(true)
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              event.preventDefault()
              dragDepth.current -= 1
              if (dragDepth.current <= 0) {
                dragDepth.current = 0
                setOver(false)
              }
            }}
            onDrop={(event) => {
              event.preventDefault()
              dragDepth.current = 0
              setOver(false)
              if (online) handleFiles(event.dataTransfer.files)
            }}
            className={clsx(
              'group relative mf-card overflow-hidden px-6 py-12 sm:py-14 text-center cursor-pointer transition-all duration-200',
              !online && 'opacity-50 pointer-events-none',
              over
                ? 'border-accent bg-accent-soft scale-[1.004]'
                : 'hover:border-accent/50 hover:-translate-y-0.5',
            )}
          >
            <span
              className={clsx(
                'mx-auto grid place-items-center w-14 h-14 rounded-2xl border transition-all duration-200',
                over
                  ? 'bg-accent text-accent-ink border-accent scale-110'
                  : 'bg-raised border-line text-accent group-hover:scale-105',
              )}
            >
              <UploadCloud size={24} strokeWidth={1.9} />
            </span>

            <h2 className="mt-5 font-display text-xl sm:text-2xl font-bold tracking-tight">
              {over ? t('dropzone.drop') : t('home.dropTitle')}
            </h2>
            <p className="mt-2 text-sm text-muted">{t('home.dropSub')}</p>

            <span className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-[11px] bg-accent text-accent-ink font-medium text-[15px] shadow-[0_14px_36px_-18px_var(--mf-accent)] group-hover:brightness-110 transition-all">
              <FileText size={16} />
              {t('home.dropCta')}
            </span>

            <p className="mt-5 mf-data text-faint">{t('home.dropHint')}</p>

            <input
              ref={inputRef}
              type="file"
              multiple
              className="sr-only"
              onChange={(event) => {
                handleFiles(event.target.files)
                event.target.value = ''
              }}
            />
          </div>

          {/* Caixa 2 — colar um link */}
          <form
            onSubmit={submitLink}
            className="group relative mf-card overflow-hidden px-6 py-12 sm:py-14 text-center transition-all duration-200 hover:border-accent/50 hover:-translate-y-0.5"
          >
            <span className="mx-auto grid place-items-center w-14 h-14 rounded-2xl border bg-raised border-line text-accent transition-transform duration-200 group-focus-within:scale-105">
              <Link2 size={24} strokeWidth={1.9} />
            </span>

            <h2 className="mt-5 font-display text-xl sm:text-2xl font-bold tracking-tight">{t('home.linkTitle')}</h2>
            <p className="mt-2 text-sm text-muted">{t('home.linkSub')}</p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5 max-w-lg mx-auto">
              <input
                type="url"
                inputMode="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder={t('home.linkPlaceholder')}
                className="mf-field text-center sm:text-left"
                autoComplete="off"
                spellCheck={false}
                aria-label={t('home.linkTitle')}
              />
              <button
                type="submit"
                disabled={!url.trim() || !online}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 shrink-0 rounded-[11px] bg-accent text-accent-ink font-medium text-[15px] disabled:opacity-40 disabled:pointer-events-none hover:brightness-110 transition-all shadow-[0_14px_36px_-18px_var(--mf-accent)]"
              >
                <Music4 size={16} />
                {t('home.linkCta')}
              </button>
            </div>

            <p className="mt-5 mf-data text-faint">{t('home.linkHint')}</p>
          </form>
        </div>

        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-2xl overflow-hidden">
          <Stat value={`${limits?.maxUploadMb ?? 512} MB`} label={t('home.stat.perFile')} />
          <Stat value="4K" label={t('home.stat.video')} />
          <Stat value="320 kbps" label={t('home.stat.audio')} />
          <Stat value={`${limits?.fileTtlHours ?? 2} h`} label={t('home.stat.cleanup')} />
        </dl>
      </section>

      {/* ── Ferramentas ───────────────────────────────────────────────── */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-16">
          <div className="flex items-end justify-between gap-4 mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">{t('home.tools.title')}</h2>
            <span className="mf-label hidden sm:block">{t('home.tools.aside')}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {TOOLS.map((tool, index) => {
              const enabled = tool.to === '/conversor' ? features?.convert !== false : features?.video !== false
              return (
                <Link
                  key={tool.to}
                  to={tool.to}
                  className="group mf-card p-6 relative overflow-hidden hover:border-accent/50 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <span className="absolute top-5 right-5 mf-data text-faint">{String(index + 1).padStart(2, '0')}</span>

                  <span className="grid place-items-center w-12 h-12 rounded-xl bg-raised border border-line text-accent group-hover:bg-accent group-hover:text-accent-ink transition-colors duration-300">
                    <tool.icon size={21} />
                  </span>

                  <h3 className="mt-5 font-display text-xl font-bold tracking-tight">{t(tool.labelKey)}</h3>
                  <p className="mt-2 text-[13.5px] text-muted leading-relaxed">{t(tool.blurbKey)}</p>

                  <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent">
                    {t('common.open')}
                    <ArrowUpRight
                      size={15}
                      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>

                  {!enabled && <span className="absolute bottom-5 right-5 mf-data text-danger">{t('home.needsSetup')}</span>}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Como funciona ─────────────────────────────────────────────── */}
      <section className="border-t border-line bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-16">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-10">
            {t('home.steps.title')}
          </h2>

          <ol className="grid gap-8 md:grid-cols-3 relative">
            <span className="hidden md:block absolute top-5 left-0 right-0 h-px bg-line" aria-hidden />
            {[1, 2, 3].map((step) => (
              <li key={step} className="relative">
                <span className="relative z-10 grid place-items-center w-10 h-10 rounded-full bg-canvas border border-accent/50 text-accent mf-data">
                  {String(step).padStart(2, '0')}
                </span>
                <h3 className="font-display text-lg font-bold tracking-tight mt-4">{t(`home.step${step}.title`)}</h3>
                <p className="text-[13.5px] text-muted mt-1.5 leading-relaxed max-w-xs">{t(`home.step${step}.text`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Garantias ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          <Assurance icon={Cpu} title={t('home.assure1.title')} text={t('home.assure1.text')} />
          <Assurance
            icon={Timer}
            title={t('home.assure2.title')}
            text={t('home.assure2.text', { hours: limits?.fileTtlHours ?? 2 })}
          />
          <Assurance
            icon={ShieldCheck}
            title={t('home.assure3.title')}
            text={t('home.assure3.text')}
            link={{ to: '/faq', label: t('home.assure3.link') }}
          />
        </div>
      </section>
    </div>
  )
}

function Stat({ value, label }) {
  return (
    <div className="bg-canvas px-4 py-5">
      <dt className="font-display text-2xl font-extrabold tracking-tight text-accent">{value}</dt>
      <dd className="mf-label mt-1">{label}</dd>
    </div>
  )
}

function Assurance({ icon: Icon, title, text, link }) {
  return (
    <div className="mf-card p-6">
      <span className="grid place-items-center w-10 h-10 rounded-xl bg-raised border border-line text-accent">
        <Icon size={18} />
      </span>
      <h3 className="mt-4 font-display text-[17px] font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-[13.5px] text-muted leading-relaxed">{text}</p>
      {link && (
        <Link
          to={link.to}
          className="mt-3 inline-flex items-center gap-1 text-[13px] text-accent hover:underline underline-offset-4"
        >
          {link.label}
          <ArrowRight size={13} />
        </Link>
      )}
    </div>
  )
}

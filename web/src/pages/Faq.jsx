import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Scale, ShieldAlert, Server, Gauge, CheckCircle2, XCircle } from 'lucide-react'
import { useCapabilities } from '../hooks/useCapabilities.jsx'
import { useI18n, useRichText } from '../i18n/index.jsx'
import { Badge, Note } from '../components/ui.jsx'

export default function Faq() {
  const { conversion, limits, tools, features, loading } = useCapabilities()
  const { t } = useI18n()
  const rich = useRichText()
  const hours = limits?.fileTtlHours ?? 2

  const FAQ = [
    {
      q: t('faq.q1'),
      a: (
        <div className="space-y-3">
          <p>{t('faq.a1')}</p>
          <div className="grid gap-2">
            {(conversion?.matrix || []).map((category) => (
              <div key={category.id} className="mf-inset p-3">
                <p className="mf-label mb-2">{category.label}</p>
                <p className="text-[12.5px] text-muted leading-relaxed">
                  <span className="text-ink">{t('faq.accepts')}</span> {category.accepts.join(', ')}
                </p>
                <p className="text-[12.5px] text-muted leading-relaxed mt-1">
                  <span className="text-accent">{t('faq.produces')}</span> {category.produces.join(', ')}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[12.5px] text-muted">
            {t('faq.compressAny', {
              targets: (conversion?.compressionTargets || ['zip']).join(' / ').toUpperCase(),
            })}
          </p>
        </div>
      ),
    },
    { q: t('faq.q2'), a: <p>{t('faq.a2')}</p> },
    {
      q: t('faq.q3'),
      a: (
        <ul className="space-y-2">
          <Limit label={t('faq.limit.size')} value={`${limits?.maxUploadMb ?? 512} MB`} />
          <Limit label={t('faq.limit.batch')} value="12" />
          <Limit label={t('faq.limit.tracks')} value={String(limits?.maxPlaylistItems ?? 50)} />
          <Limit label={t('faq.limit.parallel')} value={String(limits?.concurrency ?? 2)} />
          <Limit label={t('faq.limit.ttl')} value={`${hours} h`} />
          <p className="text-[12.5px] text-muted pt-1">{t('faq.limit.note')}</p>
        </ul>
      ),
    },
    { q: t('faq.q4'), a: <p>{t('faq.a4', { hours })}</p> },
    {
      q: t('faq.q5'),
      a: (
        <div className="space-y-2">
          <p>{t('faq.a5a')}</p>
          <p className="text-[12.5px] text-muted">{t('faq.a5b')}</p>
        </div>
      ),
    },
    {
      q: t('faq.q6'),
      a: (
        <ul className="space-y-1.5 text-[13.5px]">
          {['faq.a6.1', 'faq.a6.2', 'faq.a6.3', 'faq.a6.4', 'faq.a6.5'].map((key) => (
            <li key={key}>· {t(key)}</li>
          ))}
        </ul>
      ),
    },
    { q: t('faq.q7'), a: <p>{t('faq.a7')}</p> },
  ]

  return (
    <div className="mf-stack space-y-8">
      <header>
        <h1 className="font-display text-3xl sm:text-[40px] font-extrabold tracking-[-0.035em]">{t('faq.title')}</h1>
        <p className="text-muted mt-2 max-w-2xl leading-relaxed">{t('faq.lead')}</p>
      </header>

      {/* ── Aviso legal em destaque ─────────────────────────────────── */}
      <section id="legal" className="mf-card overflow-hidden border-danger/30 scroll-mt-24">
        <div className="h-1 bg-danger" />
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-danger-soft border border-danger/30 text-danger">
              <Scale size={17} />
            </span>
            <h2 className="font-display text-xl font-extrabold tracking-tight">{t('faq.legal.title')}</h2>
          </div>

          <div className="space-y-3.5 text-[13.5px] leading-relaxed text-muted">
            <p>{t('faq.legal.p1')}</p>
            <p className="text-ink font-medium">{t('faq.legal.p2')}</p>

            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <div className="mf-inset p-4">
                <p className="flex items-center gap-2 text-ink font-medium text-[13.5px] mb-2.5">
                  <CheckCircle2 size={15} className="text-accent" />
                  {t('faq.legal.okTitle')}
                </p>
                <ul className="space-y-1.5 text-[12.5px]">
                  {['faq.legal.ok1', 'faq.legal.ok2', 'faq.legal.ok3', 'faq.legal.ok4', 'faq.legal.ok5'].map((key) => (
                    <li key={key}>· {t(key)}</li>
                  ))}
                </ul>
              </div>

              <div className="mf-inset p-4">
                <p className="flex items-center gap-2 text-ink font-medium text-[13.5px] mb-2.5">
                  <XCircle size={15} className="text-danger" />
                  {t('faq.legal.noTitle')}
                </p>
                <ul className="space-y-1.5 text-[12.5px]">
                  {['faq.legal.no1', 'faq.legal.no2', 'faq.legal.no3', 'faq.legal.no4'].map((key) => (
                    <li key={key}>· {t(key)}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="pt-1">{t('faq.legal.tos')}</p>
            <p className="text-[12.5px] border-t border-line mt-4 pt-4">{t('faq.legal.warranty')}</p>
          </div>
        </div>
      </section>

      {/* ── Estado do servidor ──────────────────────────────────────── */}
      <section className="mf-card p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-raised border border-line text-accent">
            <Server size={17} />
          </span>
          <h2 className="font-display text-xl font-extrabold tracking-tight">{t('faq.status.title')}</h2>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <ToolRow name="ffmpeg" label={t('faq.status.ffmpeg')} ok={tools?.ffmpeg?.available} loading={loading} required />
          <ToolRow name="yt-dlp" label={t('faq.status.ytdlp')} ok={tools?.ytdlp?.available} loading={loading} required />
          <ToolRow name="LibreOffice" label={t('faq.status.libreoffice')} ok={tools?.libreoffice?.available} loading={loading} />
          <ToolRow name="Spotify API" label={t('faq.status.spotify')} ok={features?.spotifyPlaylists} loading={loading} />
        </div>

        {!loading && (tools?.ffmpeg?.available === false || tools?.ytdlp?.available === false) && (
          <Note tone="danger" icon={ShieldAlert} className="mt-4">
            {rich('faq.status.warning', {
              command: <code className="mf-data text-accent">npm run doctor</code>,
            })}
          </Note>
        )}
      </section>

      {/* ── Perguntas ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-raised border border-line text-accent">
            <Gauge size={17} />
          </span>
          <h2 className="font-display text-xl font-extrabold tracking-tight">{t('faq.questions')}</h2>
        </div>

        <div className="space-y-2.5">
          {FAQ.map((item, index) => (
            <Accordion key={item.q} question={item.q} defaultOpen={index === 0}>
              {item.a}
            </Accordion>
          ))}
        </div>
      </section>

      <p className="text-[13px] text-muted">
        {rich('faq.cta', {
          converter: (
            <Link to="/conversor" className="text-accent hover:underline underline-offset-4">
              {t('faq.cta.converter')}
            </Link>
          ),
          link: (
            <Link to="/video" className="text-accent hover:underline underline-offset-4">
              {t('faq.cta.link')}
            </Link>
          ),
        })}
      </p>
    </div>
  )
}

function Accordion({ question, children, defaultOpen }) {
  const [open, setOpen] = useState(Boolean(defaultOpen))
  return (
    <div className="mf-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 text-left hover:bg-raised/40 transition-colors"
      >
        <span className="font-medium text-[14.5px]">{question}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180 text-accent' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-5 pt-0 text-[13.5px] text-muted leading-relaxed border-t border-line -mt-px">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  )
}

/** Enquanto as capacidades não chegam, nada é declarado «em falta». */
function ToolRow({ name, label, ok, required, loading }) {
  const { t } = useI18n()
  const state = loading ? 'loading' : ok ? 'ok' : required ? 'missing' : 'optional'
  const dot = { loading: 'bg-faint mf-pulse-dot', ok: 'bg-accent', missing: 'bg-danger', optional: 'bg-faint' }[state]
  const tone = { loading: 'neutral', ok: 'accent', missing: 'danger', optional: 'neutral' }[state]
  const text = {
    loading: t('faq.status.checking'),
    ok: t('faq.status.active'),
    missing: t('faq.status.missing'),
    optional: t('faq.status.optional'),
  }[state]

  return (
    <div className="mf-inset flex items-center gap-3 px-3.5 py-3">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium">{name}</p>
        <p className="mf-data text-faint truncate">{label}</p>
      </div>
      <Badge tone={tone}>{text}</Badge>
    </div>
  )
}

function Limit({ label, value }) {
  return (
    <li className="flex items-baseline justify-between gap-4 border-b border-line pb-2 last:border-0">
      <span className="text-[13.5px]">{label}</span>
      <span className="mf-data text-accent shrink-0">{value}</span>
    </li>
  )
}

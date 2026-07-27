import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Download, AlertTriangle, Link2, Eye, Clock, Radio, Youtube, SlidersHorizontal, ChevronDown, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import ToolTabs from '../components/ToolTabs.jsx'
import JobCard from '../components/JobCard.jsx'
import OptionsForm, { visibleValues } from '../components/OptionsForm.jsx'
import { Button, Note, Badge, EmptyState, Spinner } from '../components/ui.jsx'
import { useCapabilities } from '../hooks/useCapabilities.jsx'
import { useJobs } from '../hooks/useJobs.jsx'
import { api } from '../lib/api.js'
import { compactNumberIn } from '../lib/format.js'
import { useI18n } from '../i18n/index.jsx'

/** Grupos sempre à vista; o resto fica em «opções avançadas». */
const PRIMARY_GROUPS = new Set(['format', 'audio'])

export default function Video() {
  const { tools } = useCapabilities()
  const { byId } = useJobs()
  const { t, language } = useI18n()

  const [url, setUrl] = useState('')
  const [info, setInfo] = useState(null)
  const [options, setOptions] = useState({})
  const [probing, setProbing] = useState(false)
  const [error, setError] = useState(null)
  const [starting, setStarting] = useState(false)
  const [jobIds, setJobIds] = useState([])
  const [advanced, setAdvanced] = useState(false)

  const ytdlpMissing = tools?.ytdlp?.available === false
  const fields = info?.options?.fields || []

  const [primary, extra] = useMemo(
    () => [fields.filter((f) => PRIMARY_GROUPS.has(f.groupId)), fields.filter((f) => !PRIMARY_GROUPS.has(f.groupId))],
    [fields],
  )

  const changed = useMemo(() => {
    if (!info) return 0
    return fields.filter((f) => f.type !== 'note' && String(options[f.key]) !== String(info.options.defaults[f.key])).length
  }, [fields, options, info])

  const probeUrl = async (raw) => {
    const trimmed = String(raw || '').trim()
    if (!trimmed) return
    setProbing(true)
    setError(null)
    setInfo(null)
    try {
      const data = await api.probeVideo(trimmed)
      setInfo(data)
      setOptions({ ...data.options.defaults })
      setAdvanced(false)
    } catch (caught) {
      setError(caught.message)
    } finally {
      setProbing(false)
    }
  }

  const probe = (event) => {
    event?.preventDefault()
    probeUrl(url)
  }
  // Link vindo da página inicial: deteta-o assim que a página monta.
  const [params, setParams] = useSearchParams()
  const autoProbed = useRef(false)
  useEffect(() => {
    const incoming = params.get('url')
    if (!incoming || autoProbed.current) return
    autoProbed.current = true
    setUrl(incoming)
    setParams({}, { replace: true })
    probeUrl(incoming)
  }, [params, setParams])
  const start = async () => {
    if (!info) return
    setStarting(true)
    setError(null)
    try {
      const data = await api.downloadVideo({
        url: url.trim(),
        options: visibleValues(fields, options),
        qualities: info.qualities,
        title: info.title,
        thumbnail: info.thumbnail,
      })
      if (data?.job?.id) setJobIds((current) => [data.job.id, ...current])
    } catch (caught) {
      setError(caught.message)
    } finally {
      setStarting(false)
    }
  }

  const jobs = jobIds.map((id) => byId[id]).filter(Boolean)
  const audioMode = options.mode === 'audio'

  return (
    <ToolTabs
      title={t('video.title')}
      lead={t('video.lead')}
      aside={<Badge tone={ytdlpMissing ? 'danger' : 'neutral'}>{ytdlpMissing ? 'yt-dlp' : t('video.badge')}</Badge>}
    >
      {ytdlpMissing && (
        <Note tone="danger" icon={AlertTriangle}>
          <strong>yt-dlp</strong> · <code className="mf-data text-accent">npm run setup:ytdlp</code>
        </Note>
      )}

      <form onSubmit={probe} className="mf-card p-4 sm:p-5">
        <label htmlFor="video-url" className="mf-label mb-2 block">
          {t('video.urlLabel')}
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
            <input
              id="video-url"
              type="url"
              inputMode="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              className="mf-field !pl-10"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <Button type="submit" busy={probing} disabled={!url.trim() || ytdlpMissing} className="sm:w-auto">
            <Search size={15} />
            {t('common.detect')}
          </Button>
        </div>
        <p className="mt-2.5 mf-data text-faint">
          {t('video.sources')}
        </p>
      </form>

      {error && (
        <Note tone="danger" icon={AlertTriangle}>
          {error}
        </Note>
      )}

      {probing && (
        <div className="mf-card p-6 flex items-center gap-3 text-muted">
          <Spinner />
          <span className="text-sm">{t('video.probing')}</span>
        </div>
      )}

      {info && (
        <section className="mf-card overflow-hidden mf-enter">
          <div className="grid md:grid-cols-[280px_1fr] md:items-start">
            {/* aspeto fixo: sem isto a miniatura esticava-se com o painel de
                opções e ficava absurdamente ampliada */}
            <div className="relative bg-raised border-b md:border-b-0 md:border-r border-line md:sticky md:top-20">
              {info.thumbnail ? (
                <img src={info.thumbnail} alt="" className="w-full aspect-video object-cover" />
              ) : (
                <div className="aspect-video grid place-items-center text-faint">
                  <Youtube size={28} />
                </div>
              )}
              {info.durationLabel && (
                <span className="absolute bottom-2.5 right-2.5 mf-data bg-black/80 text-white rounded px-1.5 py-0.5">
                  {info.durationLabel}
                </span>
              )}
              {info.isLive && (
                <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 mf-data bg-danger text-white rounded px-1.5 py-0.5">
                  <Radio size={10} />
                  {t('video.live')}
                </span>
              )}
            </div>

            <div className="p-4 sm:p-5 min-w-0">
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight leading-snug">{info.title}</h2>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5">
                {info.uploader && <span className="text-[13px] text-muted">{info.uploader}</span>}
                {info.viewCount && (
                  <span className="mf-data text-faint inline-flex items-center gap-1">
                    <Eye size={11} />
                    {compactNumberIn(info.viewCount, language)}
                  </span>
                )}
                {info.uploadDate && (
                  <span className="mf-data text-faint inline-flex items-center gap-1">
                    <Clock size={11} />
                    {info.uploadDate}
                  </span>
                )}
                {info.extractor && <Badge>{info.extractor}</Badge>}
                {info.hasSubtitles && <Badge tone="cyan">{t('video.hasSubs')}</Badge>}
              </div>

              <div className="mt-5">
                <OptionsForm fields={primary} value={options} onChange={setOptions} />
              </div>

              {extra.length > 0 && (
                <div className="mt-5 border-t border-line pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setAdvanced((value) => !value)}
                      aria-expanded={advanced}
                      className="inline-flex items-center gap-2 text-[13px] font-medium text-muted hover:text-accent transition-colors"
                    >
                      <SlidersHorizontal size={14} />
                      {t('common.advanced')}
                      {changed > 0 && <Badge tone="accent">{changed}</Badge>}
                      <ChevronDown size={14} className={clsx('transition-transform', advanced && 'rotate-180')} />
                    </button>
                    {changed > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setOptions({ ...info.options.defaults })}>
                        <RotateCcw size={13} />
                        {t('common.reset')}
                      </Button>
                    )}
                  </div>

                  {advanced && (
                    <div className="mt-4 mf-enter">
                      <OptionsForm fields={extra} value={options} onChange={setOptions} />
                    </div>
                  )}
                </div>
              )}

              <Button size="lg" onClick={start} busy={starting} className="mt-5 w-full sm:w-auto">
                <Download size={16} />
                {audioMode
                  ? t('video.extractAudio', { format: String(options.audioFormat || 'mp3').toUpperCase() })
                  : t('video.downloadAs', { format: String(options.container || 'mp4').toUpperCase() })}
              </Button>
            </div>
          </div>
        </section>
      )}

      {jobs.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold tracking-tight">{t('video.downloads')}</h2>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </section>
      )}

      {!info && !probing && !jobs.length && !error && (
        <div className="mf-card">
          <EmptyState icon={Youtube} title={t('video.emptyTitle')}>
            {t('video.emptyBody')}
          </EmptyState>
        </div>
      )}

      <Note>
        {t('video.legal')}
      </Note>
    </ToolTabs>
  )
}

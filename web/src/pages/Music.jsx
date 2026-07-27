import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Download,
  AlertTriangle,
  Link2,
  Music4,
  Disc3,
  ListMusic,
  Info,
  CheckSquare,
  Square,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
} from 'lucide-react'
import clsx from 'clsx'
import ToolTabs from '../components/ToolTabs.jsx'
import JobCard from '../components/JobCard.jsx'
import OptionsForm, { visibleValues } from '../components/OptionsForm.jsx'
import { Button, Note, Badge, EmptyState, Spinner } from '../components/ui.jsx'
import { useCapabilities } from '../hooks/useCapabilities.jsx'
import { useJobs } from '../hooks/useJobs.jsx'
import { api } from '../lib/api.js'
import { useI18n } from '../i18n/index.jsx'

/** Grupos sempre à vista; o resto fica em «opções avançadas». */
const PRIMARY_GROUPS = new Set(['format'])

const PROVIDER_LABEL = {
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
  youtube: 'YouTube',
  'youtube-music': 'YouTube Music',
  bandcamp: 'Bandcamp',
  other: null,
}

const KIND_ICON = { track: Music4, album: Disc3, playlist: ListMusic }

export default function Music() {
  const { tools, limits } = useCapabilities()
  const { byId } = useJobs()
  const { t } = useI18n()

  const [url, setUrl] = useState('')
  const [info, setInfo] = useState(null)
  const [probing, setProbing] = useState(false)
  const [error, setError] = useState(null)
  const [starting, setStarting] = useState(false)
  const [jobIds, setJobIds] = useState([])

  const [options, setOptions] = useState({})
  const [advanced, setAdvanced] = useState(false)
  const [selected, setSelected] = useState(() => new Set())

  const ytdlpMissing = tools?.ytdlp?.available === false
  const fields = info?.options?.fields || []

  const [primary, extra] = useMemo(
    () => [fields.filter((f) => PRIMARY_GROUPS.has(f.groupId)), fields.filter((f) => !PRIMARY_GROUPS.has(f.groupId))],
    [fields],
  )

  const changed = useMemo(() => {
    if (!info) return 0
    return fields.filter((f) => f.type !== 'note' && String(options[f.key]) !== String(info.options.defaults[f.key]))
      .length
  }, [fields, options, info])

  const probeUrl = async (raw) => {
    const trimmed = String(raw || '').trim()
    if (!trimmed) return
    setProbing(true)
    setError(null)
    setInfo(null)
    try {
      const data = await api.probeMusic(trimmed)
      setInfo(data)
      setOptions({ ...data.options.defaults })
      setAdvanced(false)
      setSelected(new Set(data.tracks.map((track) => track.id)))
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
      const data = await api.downloadMusic({
        url: url.trim(),
        options: visibleValues(fields, options),
        trackIds: [...selected],
      })
      if (data?.job?.id) setJobIds((current) => [data.job.id, ...current])
    } catch (caught) {
      setError(caught.message)
    } finally {
      setStarting(false)
    }
  }

  const toggle = (id) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allSelected = info && selected.size === info.tracks.length
  const jobs = jobIds.map((id) => byId[id]).filter(Boolean)
  const KindIcon = useMemo(() => (info ? KIND_ICON[info.kind] || Music4 : Music4), [info])

  return (
    <ToolTabs
      title={t('music.title')}
      lead={t('music.lead')}
      aside={<Badge tone={ytdlpMissing ? 'danger' : 'neutral'}>{ytdlpMissing ? 'yt-dlp' : t('music.badge')}</Badge>}
    >
      {ytdlpMissing && (
        <Note tone="danger" icon={AlertTriangle}>
          <strong>yt-dlp</strong> · <code className="mf-data text-accent">npm run setup:ytdlp</code>
        </Note>
      )}

      <form onSubmit={probe} className="mf-card p-4 sm:p-5">
        <label htmlFor="music-url" className="mf-label mb-2 block">
          {t('music.urlLabel')}
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
            <input
              id="music-url"
              type="url"
              inputMode="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://open.spotify.com/album/…"
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
          {t('music.maxTracks', { count: limits?.maxPlaylistItems ?? 50 })}
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
          <span className="text-sm">{t('music.probing')}</span>
        </div>
      )}

      {/* ── Coleção detetada ────────────────────────────────────────── */}
      {info && (
        <section className="mf-card overflow-hidden mf-enter">
          <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 border-b border-line">
            {info.cover ? (
              <img
                src={info.cover}
                alt=""
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border border-line shrink-0"
              />
            ) : (
              <span className="w-24 h-24 grid place-items-center rounded-xl bg-raised border border-line text-faint shrink-0">
                <KindIcon size={28} />
              </span>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone="accent">
                  <KindIcon size={11} />
                  {info.kind === 'track' ? t('music.track') : info.kind === 'album' ? t('music.album') : t('music.playlist')}
                </Badge>
                <Badge>{PROVIDER_LABEL[info.provider] || info.provider}</Badge>
              </div>

              <h2 className="font-display text-xl font-bold tracking-tight mt-2.5 leading-snug">{info.title}</h2>
              {info.subtitle && <p className="text-[13.5px] text-muted mt-1">{info.subtitle}</p>}
              <p className="mf-data text-faint mt-2">
                {t('music.trackCount', { shown: info.tracks.length, total: info.totalTracks })}
                {info.truncated && ` · ${t('music.truncated', { limit: info.limit })}`}
              </p>
            </div>
          </div>

          {info.sourcing && (
            <div className="px-4 sm:px-5 py-3 border-b border-line bg-raised/40 flex gap-2.5">
              <Info size={14} className="text-muted shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-muted leading-relaxed">{info.sourcing}</p>
            </div>
          )}

          {/* Lista de faixas */}
          {info.tracks.length > 1 && (
            <>
              <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-line">
                <button
                  type="button"
                  onClick={() => setSelected(allSelected ? new Set() : new Set(info.tracks.map((track) => track.id)))}
                  className="inline-flex items-center gap-2 mf-data text-muted hover:text-accent transition-colors"
                >
                  {allSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                  {allSelected ? t('music.deselectAll') : t('music.selectAll')}
                </button>
                <span className="mf-data text-faint">{t('music.selected', { count: selected.size })}</span>
              </div>

              <ul className="divide-y divide-line max-h-[26rem] overflow-y-auto">
                {info.tracks.map((track, index) => {
                  const checked = selected.has(track.id)
                  return (
                    <li key={track.id}>
                      <label className="flex items-center gap-3 px-4 sm:px-5 py-2.5 cursor-pointer hover:bg-raised/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(track.id)}
                          className="sr-only"
                        />
                        <span
                          className={
                            checked
                              ? 'w-4 h-4 rounded-[5px] bg-accent border border-accent grid place-items-center shrink-0'
                              : 'w-4 h-4 rounded-[5px] border border-line-strong shrink-0'
                          }
                        >
                          {checked && (
                            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-accent-ink" fill="none">
                              <path d="M2.5 6.2 5 8.6l4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>

                        <span className="mf-data text-faint w-6 text-right shrink-0">
                          {String(index + 1).padStart(2, '0')}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] leading-tight truncate">{track.title}</span>
                          {track.artist && <span className="block mf-data text-faint truncate mt-0.5">{track.artist}</span>}
                        </span>

                        {track.durationLabel && (
                          <span className="mf-data text-faint shrink-0">{track.durationLabel}</span>
                        )}
                      </label>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {/* Opções + ação */}
          <div className="p-4 sm:p-5 border-t border-line bg-raised/30 space-y-4">
            <OptionsForm fields={primary} value={options} onChange={setOptions} />

            {extra.length > 0 && (
              <div className="border-t border-line pt-4">
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

            <Button size="lg" onClick={start} busy={starting} disabled={!selected.size} className="w-full sm:w-auto">
              <Download size={16} />
              {t('music.downloadTracks', { count: selected.size })}
            </Button>
          </div>
        </section>
      )}

      {jobs.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold tracking-tight">{t('video.downloads')}</h2>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} autoDownload={false} />
          ))}
        </section>
      )}

      {!info && !probing && !jobs.length && !error && (
        <div className="mf-card">
          <EmptyState icon={Music4} title={t('music.emptyTitle')}>
            {t('music.emptyBody')}
          </EmptyState>
        </div>
      )}

      <Note>
        {t('music.legal')}
      </Note>
    </ToolTabs>
  )
}

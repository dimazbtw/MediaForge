import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Trash2, History as HistoryIcon, FileStack, Youtube, Music4, ExternalLink } from 'lucide-react'
import { useJobs } from '../hooks/useJobs.jsx'
import { useCapabilities } from '../hooks/useCapabilities.jsx'
import { api, triggerDownload } from '../lib/api.js'
import { Button, Badge, EmptyState, Segmented, Note } from '../components/ui.jsx'
import { formatBytes, relativeParts, KIND_KEY } from '../lib/format.js'
import { useI18n } from '../i18n/index.jsx'

const KIND_ICON = { convert: FileStack, video: Youtube, music: Music4 }

export default function HistoryPage() {
  const { history, clearHistory } = useJobs()
  const { limits } = useCapabilities()
  const { t } = useI18n()
  const [filter, setFilter] = useState('all')
  const [gone, setGone] = useState(() => new Set())

  const visible = filter === 'all' ? history : history.filter((entry) => entry.kind === filter)

  /** Verifica se o ficheiro ainda existe antes de tentar descarregar. */
  const download = async (entry) => {
    try {
      await api.fileInfo(entry.fileId)
      triggerDownload(entry.fileId, entry.filename)
    } catch {
      setGone((current) => new Set(current).add(entry.fileId))
    }
  }

  return (
    <div className="mf-stack space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-[40px] font-extrabold tracking-[-0.035em]">{t('history.title')}</h1>
          <p className="text-muted mt-2 max-w-xl leading-relaxed">
            {t('history.lead', { hours: limits?.fileTtlHours ?? 2 })}
          </p>
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory}>
            <Trash2 size={14} />
            {t('history.clear')}
          </Button>
        )}
      </header>

      {history.length > 0 && (
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('history.all', { count: history.length }) },
            { value: 'convert', label: t('history.conversions') },
            { value: 'video', label: t('kind.video') },
            { value: 'music', label: t('kind.music') },
          ]}
        />
      )}

      {visible.length === 0 ? (
        <div className="mf-card">
          <EmptyState
            icon={HistoryIcon}
            title={history.length ? t('history.emptyFilterTitle') : t('history.emptyTitle')}
            action={
              !history.length && (
                <Button as={Link} to="/conversor">
                  {t('history.openConverter')}
                </Button>
              )
            }
          >
            {history.length ? t('history.emptyFilterBody') : t('history.emptyBody')}
          </EmptyState>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((entry) => {
            const Icon = KIND_ICON[entry.kind] || FileStack
            const expired = gone.has(entry.fileId)
            return (
              <li key={entry.id} className="mf-card p-4 flex items-center gap-3.5">
                {entry.cover ? (
                  <img src={entry.cover} alt="" className="w-12 h-12 rounded-[10px] object-cover border border-line shrink-0" />
                ) : (
                  <span className="w-11 h-11 grid place-items-center rounded-[10px] bg-raised border border-line text-muted shrink-0">
                    <Icon size={16} />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-[14px] leading-tight truncate" title={entry.title}>
                    {entry.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                    <Badge>{t(KIND_KEY[entry.kind]) || entry.kind}</Badge>
                    {entry.ext && <span className="mf-data text-faint uppercase">{entry.ext}</span>}
                    <span className="mf-data text-faint">{formatBytes(entry.size)}</span>
                    <span className="mf-data text-faint">{t(...relativeParts(entry.finishedAt))}</span>
                    {entry.tracks?.length > 1 && (
                      <span className="mf-data text-faint">{t('history.tracks', { count: entry.tracks.length })}</span>
                    )}
                  </div>
                </div>

                {expired ? (
                  <span className="mf-data text-faint shrink-0">{t('history.expired')}</span>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => download(entry)} className="shrink-0">
                    <Download size={14} />
                    <span className="hidden sm:inline">{t('common.download')}</span>
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {history.length > 0 && (
        <Note>
          {t('history.note')}{' '}
          <Link to="/faq" className="text-accent hover:underline underline-offset-2 inline-flex items-center gap-1">
            {t('common.readMore')}
            <ExternalLink size={11} />
          </Link>
        </Note>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  Download,
  X,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  FileStack,
  Youtube,
  Music4,
  Info,
  RotateCcw,
} from 'lucide-react'
import { api, triggerDownload } from '../lib/api.js'
import { formatBytes, formatElapsed, STATUS_KEY } from '../lib/format.js'
import { useI18n } from '../i18n/index.jsx'
import { useJobs } from '../hooks/useJobs.jsx'
import { Button, Progress, StatusPill, Badge } from './ui.jsx'
import FilePreview from './FilePreview.jsx'

const KIND_ICON = { convert: FileStack, video: Youtube, music: Music4 }

/**
 * Cartão de um trabalho: idle → a processar → concluído → erro.
 * Ao concluir, dispara o download automático uma única vez (opcional).
 */
export default function JobCard({ job, autoDownload = true, sourceFile = null, onRetry }) {
  const { cancel, dismiss } = useJobs()
  const { t } = useI18n()
  const [showPreview, setShowPreview] = useState(false)
  const downloaded = useRef(false)

  const Icon = KIND_ICON[job.kind] || FileStack
  const done = job.status === 'done'
  const failed = job.status === 'error'
  const running = job.status === 'processing' || job.status === 'queued'

  useEffect(() => {
    if (!autoDownload || !done || downloaded.current || !job.result?.fileId) return
    downloaded.current = true
    triggerDownload(job.result.fileId, job.result.filename)
  }, [autoDownload, done, job.result])

  useEffect(() => {
    if (done) setShowPreview(true)
  }, [done])

  const elapsed = formatElapsed(job)

  return (
    <article
      className={clsx(
        'mf-card overflow-hidden mf-enter transition-colors duration-300',
        done && 'border-accent/35',
        failed && 'border-danger/35',
      )}
    >
      {/* Faixa de estado no topo */}
      <div className="h-[3px] w-full overflow-hidden bg-raised">
        {running && <div className="h-full mf-hazard mf-hazard-run opacity-70" />}
        {done && <div className="h-full bg-accent" />}
        {failed && <div className="h-full bg-danger" />}
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {job.meta?.thumbnail || job.meta?.cover ? (
            <img
              src={job.meta.thumbnail || job.meta.cover}
              alt=""
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-[10px] object-cover border border-line shrink-0"
              loading="lazy"
            />
          ) : (
            <span className="w-11 h-11 grid place-items-center rounded-[10px] bg-raised border border-line text-muted shrink-0">
              <Icon size={17} />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2 justify-between">
              <h3 className="font-medium text-[15px] leading-snug break-words pr-1" title={job.title}>
                {job.title}
              </h3>
              <StatusPill status={job.status}>{t(STATUS_KEY[job.status]) || job.status}</StatusPill>
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5">
              {job.subtitle && <span className="mf-data text-muted">{job.subtitle}</span>}
              {job.meta?.inputSize > 0 && (
                <>
                  <span className="text-faint">·</span>
                  <span className="mf-data text-faint">{formatBytes(job.meta.inputSize)}</span>
                </>
              )}
              {elapsed && (
                <>
                  <span className="text-faint">·</span>
                  <span className="mf-data text-faint">{elapsed}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progresso */}
        {running && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5 gap-3">
              <span className="text-[13px] text-muted truncate">{job.stage}</span>
              <span className="mf-data text-accent shrink-0">
                {job.status === 'queued' && !job.progress ? '—' : `${job.progress}%`}
              </span>
            </div>
            <Progress
              value={job.status === 'queued' || job.progress >= 99 ? undefined : job.progress}
              status={job.status}
            />
          </div>
        )}

        {/* Faixas (playlists / álbuns) */}
        {job.tracks?.length > 0 && <TrackList tracks={job.tracks} />}

        {/* Erro */}
        {failed && (
          <div className="mt-4 flex gap-2.5 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-3">
            <AlertTriangle size={15} className="text-danger shrink-0 mt-0.5" />
            <p className="text-[13px] leading-relaxed">{job.error}</p>
          </div>
        )}

        {/* Nota informativa do motor de conversão */}
        {done && job.result?.note && (
          <div className="mt-4 flex gap-2.5 rounded-xl border border-line bg-raised px-3.5 py-3">
            <Info size={15} className="text-muted shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-muted leading-relaxed">{job.result.note}</p>
          </div>
        )}

        {/* Resultado */}
        {done && job.result?.fileId && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge tone="accent">
                <Check size={11} strokeWidth={3} />
                {job.result.ext?.toUpperCase()}
              </Badge>
              <Badge>{formatBytes(job.result.size)}</Badge>
              {job.result.details &&
                Object.entries(job.result.details).map(([key, value]) => (
                  <Badge key={key}>
                    {key} {value}
                  </Badge>
                ))}
            </div>

            {sourceFile && job.result.preview !== 'none' ? (
              <BeforeAfter sourceFile={sourceFile} job={job} visible={showPreview} />
            ) : (
              showPreview &&
              job.result.preview !== 'none' && (
                <FilePreview
                  url={api.previewUrl(job.result.fileId)}
                  kind={job.result.preview}
                  filename={job.result.filename}
                />
              )
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Button onClick={() => triggerDownload(job.result.fileId, job.result.filename)} size="sm">
                <Download size={14} />
                {t('common.download')}
              </Button>
              {job.result.preview !== 'none' && (
                <Button variant="ghost" size="sm" onClick={() => setShowPreview((value) => !value)}>
                  {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showPreview ? t('common.hide') : t('common.preview')}
                </Button>
              )}
              <span className="mf-data text-faint ml-auto truncate max-w-[45%]" title={job.result.filename}>
                {job.result.filename}
              </span>
            </div>
          </div>
        )}

        {/* Ações */}
        {(running || failed || job.status === 'canceled') && (
          <div className="flex items-center gap-2 mt-4">
            {running && (
              <Button variant="ghost" size="sm" onClick={() => cancel(job.id)}>
                <X size={14} />
                {t('common.cancel')}
              </Button>
            )}
            {(failed || job.status === 'canceled') && onRetry && (
              <Button variant="outline" size="sm" onClick={() => onRetry(job)}>
                <RotateCcw size={14} />
                {t('common.retry')}
              </Button>
            )}
            {(failed || job.status === 'canceled') && (
              <Button variant="ghost" size="sm" onClick={() => dismiss(job.id)}>
                {t('common.remove')}
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

/** Antes / depois lado a lado — só faz sentido no conversor. */
function BeforeAfter({ sourceFile, job, visible }) {
  const { t } = useI18n()
  if (!visible) return null
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <p className="mf-label mb-1.5">{t('job.before')} · {sourceFile.name.split('.').pop()?.toUpperCase()}</p>
        <FilePreview file={sourceFile} filename={sourceFile.name} compact />
      </div>
      <div>
        <p className="mf-label mb-1.5 text-accent">{t('job.after')} · {job.result.ext?.toUpperCase()}</p>
        <FilePreview
          url={api.previewUrl(job.result.fileId)}
          kind={job.result.preview}
          filename={job.result.filename}
          compact
        />
      </div>
    </div>
  )
}

function TrackList({ tracks }) {
  const { t } = useI18n()
  return (
    <ul className="mt-4 divide-y divide-line rounded-xl border border-line overflow-hidden">
      {tracks.map((track, index) => (
        <li key={track.id} className="flex items-center gap-3 px-3 py-2.5 bg-raised/50">
          <span className="mf-data text-faint w-6 shrink-0 text-right">{String(index + 1).padStart(2, '0')}</span>

          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] leading-tight truncate" title={track.title}>
              {track.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {track.artist && <span className="mf-data text-faint truncate">{track.artist}</span>}
              {track.durationLabel && (
                <>
                  <span className="text-faint text-[10px]">·</span>
                  <span className="mf-data text-faint">{track.durationLabel}</span>
                </>
              )}
            </div>
            {(track.status === 'processing' || track.status === 'queued') && (
              <>
                {/*
                 * Depois dos 99% o yt-dlp já não emite progresso — está a
                 * converter e a escrever metadados. Mostrar a barra parada
                 * nos 99% parece um bloqueio, por isso passa a indeterminada
                 * e o texto da etapa explica o que está a acontecer.
                 */}
                <Progress
                  value={track.progress >= 99 ? undefined : track.progress}
                  className="mt-2"
                />
                {track.stage && <p className="mf-data text-faint mt-1.5">{track.stage}</p>}
              </>
            )}
            {track.status === 'error' && <p className="mf-data text-danger mt-1 truncate">{track.error}</p>}
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {track.status === 'done' && track.fileId ? (
              <button
                type="button"
                onClick={() => triggerDownload(track.fileId, track.filename)}
                className="w-7 h-7 grid place-items-center rounded-lg border border-accent/40 text-accent bg-accent-soft hover:bg-accent hover:text-accent-ink transition-colors"
                title={`${t('common.download')} ${track.filename}`}
              >
                <Download size={13} />
              </button>
            ) : track.status === 'error' ? (
              <AlertTriangle size={14} className="text-danger" />
            ) : track.status === 'processing' ? (
              <span className="mf-data text-accent w-9 text-right">{track.progress}%</span>
            ) : (
              <span className="mf-data text-faint w-9 text-right">···</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

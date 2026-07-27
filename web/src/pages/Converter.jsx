import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  X,
  Wand2,
  Trash2,
  DownloadCloud,
  AlertTriangle,
  SlidersHorizontal,
  FileStack,
  Copy,
  RotateCcw,
  ChevronDown,
} from 'lucide-react'
import clsx from 'clsx'
import ToolTabs from '../components/ToolTabs.jsx'
import Dropzone from '../components/Dropzone.jsx'
import JobCard from '../components/JobCard.jsx'
import FilePreview from '../components/FilePreview.jsx'
import OptionsForm, { visibleValues } from '../components/OptionsForm.jsx'
import { Button, Note, Progress, EmptyState, Badge, Spinner } from '../components/ui.jsx'
import { useCapabilities } from '../hooks/useCapabilities.jsx'
import { useJobs } from '../hooks/useJobs.jsx'
import { loadOptionSchema, peekOptionSchema } from '../hooks/useOptionSchema.js'
import { api, triggerDownload } from '../lib/api.js'
import { takeFiles } from '../lib/handoff.js'
import { formatBytes } from '../lib/format.js'
import { useI18n } from '../i18n/index.jsx'

let uidCounter = 0

export default function Converter() {
  const { targetsFor, categoryOf, conversion, limits, tools, online, loading: capsLoading } = useCapabilities()
  const { byId } = useJobs()
  const { t } = useI18n()

  const [queue, setQueue] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)
  const [error, setError] = useState(null)
  const [batches, setBatches] = useState([])
  const resultsRef = useRef(null)
  const handoffDone = useRef(false)

  const addFiles = useCallback(
    (files) => {
      setError(null)
      const created = files.map((file) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || ''
        const targets = targetsFor(ext)
        return {
          uid: `f${(uidCounter += 1)}`,
          file,
          ext,
          category: categoryOf(ext),
          targets,
          target: targets[0] || '',
          // Distingue «o utilizador escolheu isto» de «foi o primeiro da lista».
          userPicked: false,
          schema: null,
          schemaLoading: false,
          options: {},
        }
      })
      setQueue((current) => [...current, ...created])
    },
    [targetsFor, categoryOf],
  )

  // Ficheiros largados na página inicial: recolhe-os ao montar.
  useEffect(() => {
    if (handoffDone.current) return
    handoffDone.current = true
    const incoming = takeFiles()
    if (incoming.length) addFiles(incoming)
  }, [addFiles])

  /**
   * As capacidades chegam por rede: um ficheiro largado antes disso ficaria
   * com uma lista de destinos degradada (só compressão). Quando a matriz
   * chega — ou muda — a fila é recalculada em vez de ficar presa ao engano.
   */
  useEffect(() => {
    setQueue((current) => {
      let dirty = false
      const next = current.map((item) => {
        const targets = targetsFor(item.ext)
        if (targets.length === item.targets.length && targets.every((value, index) => value === item.targets[index])) {
          return item
        }
        dirty = true
        // Uma escolha explícita é respeitada se continuar válida; um destino
        // que só foi herdado da lista degradada é recalculado.
        const keep = item.userPicked && targets.includes(item.target)
        const target = keep ? item.target : targets[0] || ''
        if (target === item.target) return { ...item, targets }
        return { ...item, targets, target, schema: null, schemaLoading: false, options: {} }
      })
      return dirty ? next : current
    })
  }, [targetsFor])

  /** Garante que cada ficheiro com destino tem o seu esquema carregado. */
  useEffect(() => {
    for (const item of queue) {
      if (!item.target || item.schema || item.schemaLoading) continue

      const { uid, ext, target } = item
      const cached = peekOptionSchema(ext, target)
      if (cached) {
        setQueue((current) =>
          current.map((entry) =>
            entry.uid === uid ? { ...entry, schema: cached, options: { ...cached.defaults } } : entry,
          ),
        )
        continue
      }

      setQueue((current) => current.map((entry) => (entry.uid === uid ? { ...entry, schemaLoading: true } : entry)))
      loadOptionSchema(ext, target)
        .then((schema) =>
          setQueue((current) =>
            current.map((entry) =>
              // Só aplica se o destino entretanto não tiver mudado.
              entry.uid === uid && entry.ext === ext && entry.target === target
                ? { ...entry, schema, options: { ...schema.defaults }, schemaLoading: false }
                : entry,
            ),
          ),
        )
        .catch(() =>
          setQueue((current) =>
            current.map((entry) => (entry.uid === uid ? { ...entry, schema: null, schemaLoading: false } : entry)),
          ),
        )
    }
  }, [queue])

  const changeTarget = (uid, target) =>
    setQueue((current) =>
      current.map((item) =>
        item.uid === uid ? { ...item, target, userPicked: true, schema: null, schemaLoading: false, options: {} } : item,
      ),
    )

  const setOptions = (uid, options) =>
    setQueue((current) => current.map((item) => (item.uid === uid ? { ...item, options } : item)))

  const resetOptions = (uid) =>
    setQueue((current) =>
      current.map((item) => (item.uid === uid ? { ...item, options: { ...(item.schema?.defaults || {}) } } : item)),
    )

  /** Copia as opções deste ficheiro para todos os que tenham o mesmo par. */
  const applyToSame = (uid) => {
    const source = queue.find((item) => item.uid === uid)
    if (!source) return
    setQueue((current) =>
      current.map((item) =>
        item.uid !== uid && item.ext === source.ext && item.target === source.target
          ? { ...item, options: { ...source.options } }
          : item,
      ),
    )
  }

  const removeItem = (uid) => {
    setQueue((current) => current.filter((item) => item.uid !== uid))
    setExpanded((current) => (current === uid ? null : current))
  }

  const sameParCount = (item) =>
    queue.filter((other) => other.uid !== item.uid && other.ext === item.ext && other.target === item.target).length

  const convertible = queue.filter((item) => item.target)
  const unsupported = queue.filter((item) => !item.targets.length)

  const submit = async () => {
    if (!convertible.length) return
    setSubmitting(true)
    setError(null)
    setUploadPercent(0)

    const perFileOptions = {}
    convertible.forEach((item, index) => {
      // Envia só os campos visíveis: um campo escondido por `showIf` não é
      // uma escolha do utilizador e não deve viajar para o servidor.
      perFileOptions[String(index)] = item.schema ? visibleValues(item.schema.fields, item.options) : {}
    })

    try {
      const data = await api.convert({
        files: convertible.map((item) => item.file),
        targets: convertible.map((item) => item.target),
        options: perFileOptions,
        onUploadProgress: setUploadPercent,
      })

      const created = (data?.jobs || []).map((job, index) => ({ jobId: job.id, file: convertible[index]?.file }))
      setBatches((current) => [...created, ...current])
      setQueue((current) => current.filter((item) => !convertible.includes(item)))
      setExpanded(null)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
    } catch (caught) {
      setError(caught.message)
    } finally {
      setSubmitting(false)
      setUploadPercent(0)
    }
  }

  const trackedJobs = batches.map((entry) => ({ job: byId[entry.jobId], file: entry.file })).filter((entry) => entry.job)
  const finished = trackedJobs.filter((entry) => entry.job.status === 'done' && entry.job.result?.fileId)

  return (
    <ToolTabs
      title={t('converter.title')}
      lead={t('converter.lead')}
      aside={
        <div className="flex items-center gap-2">
          {tools?.ffmpeg?.available === false && (
            <Badge tone="danger">
              <AlertTriangle size={11} />
              ffmpeg em falta
            </Badge>
          )}
          <Badge>{t('converter.maxSize', { size: limits?.maxUploadMb ?? 512 })}</Badge>
        </div>
      }
    >
      {tools?.ffmpeg?.available === false && (
        <Note tone="danger" icon={AlertTriangle}>
          {t('converter.ffmpegMissing')}
        </Note>
      )}

      <Dropzone
        onFiles={addFiles}
        maxMb={limits?.maxUploadMb ?? 512}
        accept={conversion?.accepted?.map((ext) => `.${ext}`).join(',')}
        // Sem a matriz do servidor não há destinos válidos para oferecer.
        disabled={submitting || !online}
      />

      {!online && (
        <Note tone={capsLoading ? 'neutral' : 'danger'} icon={capsLoading ? undefined : AlertTriangle}>
          {capsLoading
            ? t('offline.loadingFormats')
            : t('offline.converter')}
        </Note>
      )}

      {queue.length > 0 && (
        <section className="mf-card overflow-hidden">
          <header className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-line">
            <div className="flex items-center gap-2">
              <FileStack size={15} className="text-accent" />
              <h2 className="font-display text-base font-bold tracking-tight">
                {t('converter.ready', { count: queue.length })}
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setQueue([])}>
              <Trash2 size={14} />
              <span className="hidden sm:inline">{t('common.clear')}</span>
            </Button>
          </header>

          <ul className="divide-y divide-line">
            {queue.map((item) => {
              const open = expanded === item.uid
              const twins = sameParCount(item)
              const changed = item.schema ? countChanges(item.schema, item.options) : 0

              return (
                <li key={item.uid}>
                  <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
                    <div className="w-12 h-12 shrink-0">
                      <FilePreview file={item.file} filename={item.file.name} className="!h-12 w-12" compact />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] leading-tight truncate" title={item.file.name}>
                        {item.file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="mf-data text-faint uppercase">{item.ext || '?'}</span>
                        <span className="text-faint text-[10px]">·</span>
                        <span className="mf-data text-faint">{formatBytes(item.file.size)}</span>
                        {changed > 0 && (
                          <>
                            <span className="text-faint text-[10px]">·</span>
                            <span className="mf-data text-accent">
                              {t('converter.changed', { count: changed })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {item.targets.length ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <ArrowRight size={14} className="text-faint hidden sm:block" />
                        <select
                          value={item.target}
                          onChange={(event) => changeTarget(item.uid, event.target.value)}
                          className="mf-field mf-select !w-auto !py-1.5 text-[13px] uppercase font-mono"
                          aria-label={`${item.file.name}`}
                        >
                          {item.targets.map((target) => (
                            <option key={target} value={target}>
                              {target.toUpperCase()}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => setExpanded(open ? null : item.uid)}
                          aria-expanded={open}
                          className={clsx(
                            'inline-flex items-center gap-1.5 h-[34px] px-2.5 rounded-[10px] border text-[13px] transition-colors',
                            open
                              ? 'border-accent text-accent bg-accent-soft'
                              : 'border-line text-muted hover:text-ink hover:border-line-strong',
                          )}
                        >
                          <SlidersHorizontal size={14} />
                          <span className="hidden sm:inline">{t('common.options')}</span>
                          <ChevronDown size={13} className={clsx('transition-transform', open && 'rotate-180')} />
                        </button>
                      </div>
                    ) : (
                      // Se a API cair com a fila já montada, a lista de destinos
                      // esvazia-se — dizer «não suportado» seria mentira.
                      <span className={clsx('mf-data shrink-0', online ? 'text-danger' : 'text-faint')}>
                        {online ? t('converter.unsupported') : t('converter.waitingServer')}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => removeItem(item.uid)}
                      className="w-8 h-8 grid place-items-center rounded-lg text-faint hover:text-danger hover:bg-danger-soft transition-colors shrink-0"
                      aria-label={`Remover ${item.file.name}`}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {open && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 bg-raised/40 border-t border-line mf-enter">
                      <div className="flex items-center justify-between gap-3 py-3">
                        <p className="mf-data text-faint">
                          {item.ext?.toUpperCase()} → {item.target?.toUpperCase()}
                        </p>
                        <div className="flex items-center gap-1">
                          {twins > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => applyToSame(item.uid)}>
                              <Copy size={13} />
                              {t('converter.applyToOthers', { count: twins })}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => resetOptions(item.uid)} disabled={!changed}>
                            <RotateCcw size={13} />
                            {t('common.reset')}
                          </Button>
                        </div>
                      </div>

                      {item.schemaLoading ? (
                        <div className="flex items-center gap-2 text-muted text-[13px] py-4">
                          <Spinner size={14} />
                          {t('converter.loadingOptions')}
                        </div>
                      ) : (
                        <OptionsForm
                          fields={item.schema?.fields || []}
                          value={item.options}
                          onChange={(next) => setOptions(item.uid, next)}
                        />
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="px-4 sm:px-5 py-4 border-t border-line bg-raised/30">
            {submitting && uploadPercent > 0 && uploadPercent < 100 && (
              <div className="mb-3">
                <div className="flex justify-between mb-1.5">
                  <span className="mf-data text-muted">{t('converter.uploading')}</span>
                  <span className="mf-data text-accent">{Math.round(uploadPercent)}%</span>
                </div>
                <Progress value={uploadPercent} />
              </div>
            )}

            {unsupported.length > 0 && (
              <p className="mf-data text-danger mb-3">
                {t('converter.willIgnore', { count: unsupported.length })}
              </p>
            )}

            <Button size="lg" onClick={submit} busy={submitting} disabled={!convertible.length} className="w-full sm:w-auto">
              <Wand2 size={16} />
              {t('converter.convert', { count: convertible.length })}
            </Button>
          </div>
        </section>
      )}

      {error && (
        <Note tone="danger" icon={AlertTriangle}>
          {error}
        </Note>
      )}

      <section ref={resultsRef} className="space-y-4">
        {trackedJobs.length > 0 && (
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold tracking-tight">
              {t('converter.jobs')} <span className="text-faint mf-data align-middle">({trackedJobs.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              {finished.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    finished.forEach((entry, index) =>
                      setTimeout(() => triggerDownload(entry.job.result.fileId, entry.job.result.filename), index * 350),
                    )
                  }
                >
                  <DownloadCloud size={14} />
                  {t('common.downloadAll')}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setBatches([])}>
                {t('common.clearList')}
              </Button>
            </div>
          </div>
        )}

        {trackedJobs.map((entry) => (
          <JobCard key={entry.job.id} job={entry.job} sourceFile={entry.file} />
        ))}

        {!queue.length && !trackedJobs.length && (
          <div className="mf-card">
            <EmptyState icon={FileStack} title={t('converter.emptyTitle')}>
              {t('converter.emptyBody')}
            </EmptyState>
          </div>
        )}
      </section>
    </ToolTabs>
  )
}

/** Quantas opções diferem dos valores por omissão (para o resumo na linha). */
function countChanges(schema, options) {
  let count = 0
  for (const field of schema.fields) {
    if (field.type === 'note') continue
    const current = options[field.key]
    if (current === undefined) continue
    if (String(current) !== String(field.default)) count += 1
  }
  return count
}

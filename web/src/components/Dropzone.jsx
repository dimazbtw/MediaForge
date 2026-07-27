import { useCallback, useRef, useState } from 'react'
import clsx from 'clsx'
import { UploadCloud, FolderOpen } from 'lucide-react'
import { useI18n } from '../i18n/index.jsx'

/**
 * Zona de arrasto + seleção manual.
 * Aceita drop em qualquer ponto da área e mantém o teclado funcional.
 */
export default function Dropzone({ onFiles, accept, maxFiles = 12, maxMb = 512, disabled }) {
  const inputRef = useRef(null)
  const dragDepth = useRef(0)
  const [over, setOver] = useState(false)
  const [rejected, setRejected] = useState(null)
  const { t } = useI18n()

  const handle = useCallback(
    (fileList) => {
      const files = [...fileList]
      if (!files.length) return

      const tooBig = files.filter((file) => file.size > maxMb * 1024 * 1024)
      const accepted = files.filter((file) => file.size <= maxMb * 1024 * 1024).slice(0, maxFiles)

      if (tooBig.length) {
        setRejected(t('dropzone.tooBig', { count: tooBig.length, size: maxMb }))
        setTimeout(() => setRejected(null), 6000)
      } else if (files.length > maxFiles) {
        setRejected(t('dropzone.tooMany', { count: maxFiles }))
        setTimeout(() => setRejected(null), 6000)
      }

      if (accepted.length) onFiles(accepted)
    },
    [onFiles, maxFiles, maxMb, t],
  )

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (disabled) return
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
          if (!disabled) handle(event.dataTransfer.files)
        }}
        className={clsx(
          'relative group rounded-[18px] border-2 border-dashed px-6 py-12 sm:py-16 text-center cursor-pointer transition-all duration-200 overflow-hidden',
          disabled && 'opacity-50 pointer-events-none',
          over
            ? 'border-accent bg-accent-soft scale-[1.005]'
            : 'border-line-strong bg-surface hover:border-accent/60 hover:bg-raised',
        )}
      >
        {/* Cantos de mira — detalhe de oficina */}
        {['top-3 left-3 border-l-2 border-t-2', 'top-3 right-3 border-r-2 border-t-2', 'bottom-3 left-3 border-l-2 border-b-2', 'bottom-3 right-3 border-r-2 border-b-2'].map(
          (position) => (
            <span
              key={position}
              className={clsx(
                'absolute w-4 h-4 rounded-[3px] transition-colors duration-200',
                position,
                over ? 'border-accent' : 'border-line-strong group-hover:border-accent/50',
              )}
            />
          ),
        )}

        <div
          className={clsx(
            'mx-auto w-14 h-14 grid place-items-center rounded-2xl border transition-all duration-200',
            over ? 'bg-accent text-accent-ink border-accent scale-110' : 'bg-raised border-line text-muted group-hover:text-accent',
          )}
        >
          <UploadCloud size={24} strokeWidth={1.9} />
        </div>

        <p className="mt-4 font-display text-lg font-bold tracking-tight">
          {over ? t('dropzone.drop') : t('dropzone.title')}
        </p>
        <p className="mt-1.5 text-sm text-muted">
          {t('dropzone.or')}{' '}
          <span className="text-accent underline underline-offset-4 decoration-dotted">{t('dropzone.browse')}</span>
        </p>
        <p className="mt-4 mf-data text-faint">{t('dropzone.limits', { files: maxFiles, size: maxMb })}</p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          onChange={(event) => {
            handle(event.target.files)
            event.target.value = ''
          }}
        />
      </div>

      {rejected && (
        <p className="mf-data text-danger flex items-center gap-1.5">
          <FolderOpen size={12} />
          {rejected}
        </p>
      )}
    </div>
  )
}

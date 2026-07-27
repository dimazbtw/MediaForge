import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { FileText, FileQuestion, Music4, Film, Archive, Image as ImageIcon } from 'lucide-react'

const ICONS = {
  image: ImageIcon,
  audio: Music4,
  video: Film,
  text: FileText,
  pdf: FileText,
  archive: Archive,
  none: FileQuestion,
}

/**
 * Pré-visualização de um ficheiro local (objeto File) ou de um resultado
 * já no servidor (url). Cobre imagem, áudio, vídeo, texto e PDF.
 */
export default function FilePreview({ file, url, kind, filename, className, compact = false }) {
  const [objectUrl, setObjectUrl] = useState(null)
  const [textSample, setTextSample] = useState(null)
  const [failed, setFailed] = useState(false)

  const resolvedKind = kind || guessKind(filename || file?.name)
  const src = url || objectUrl

  useEffect(() => {
    setFailed(false)
    if (!file) {
      setObjectUrl(null)
      return undefined
    }
    if (!['image', 'audio', 'video', 'text'].includes(resolvedKind)) {
      setObjectUrl(null)
      return undefined
    }
    const created = URL.createObjectURL(file)
    setObjectUrl(created)
    return () => URL.revokeObjectURL(created)
  }, [file, resolvedKind])

  useEffect(() => {
    if (resolvedKind !== 'text' || !src) {
      setTextSample(null)
      return undefined
    }
    let alive = true
    const controller = new AbortController()
    fetch(src, { signal: controller.signal })
      .then((response) => response.blob())
      .then((blob) => blob.slice(0, 4000).text())
      .then((text) => alive && setTextSample(text))
      .catch(() => alive && setTextSample(null))
    return () => {
      alive = false
      controller.abort()
    }
  }, [resolvedKind, src])

  const frame = clsx(
    'mf-inset overflow-hidden grid place-items-center',
    compact ? 'h-24' : 'h-44 sm:h-52',
    className,
  )

  if (!src || failed || !['image', 'audio', 'video', 'text', 'pdf'].includes(resolvedKind)) {
    return <Placeholder kind={resolvedKind} className={frame} filename={filename || file?.name} />
  }

  if (resolvedKind === 'image') {
    return (
      <div className={clsx(frame, 'bg-[repeating-conic-gradient(var(--mf-raised)_0_25%,transparent_0_50%)] bg-[length:16px_16px]')}>
        <img
          src={src}
          alt={filename || 'Pré-visualização'}
          loading="lazy"
          onError={() => setFailed(true)}
          // min-h-0/min-w-0: sem isto o `min-height:auto` dos itens de grelha
          // ignora o max-h-full e a imagem transborda a moldura.
          className="max-h-full max-w-full min-h-0 min-w-0 object-contain"
        />
      </div>
    )
  }

  if (resolvedKind === 'audio') {
    return (
      <div className={clsx(frame, 'flex-col gap-3 px-4')}>
        <Waveform />
        <audio src={src} controls preload="metadata" onError={() => setFailed(true)} className="w-full max-w-sm" />
      </div>
    )
  }

  if (resolvedKind === 'video') {
    return (
      <div className={clsx(frame, 'bg-black/40')}>
        <video
          src={src}
          controls
          preload="metadata"
          onError={() => setFailed(true)}
          className="max-h-full max-w-full min-h-0 min-w-0"
        />
      </div>
    )
  }

  if (resolvedKind === 'pdf') {
    return (
      <div className={frame}>
        <object data={src} type="application/pdf" className="w-full h-full">
          <Placeholder kind="pdf" className="w-full h-full grid place-items-center" filename={filename} />
        </object>
      </div>
    )
  }

  return (
    <div className={clsx(frame, 'items-start justify-start p-0')}>
      <pre className="w-full h-full overflow-auto p-3 text-[11.5px] leading-relaxed font-mono text-muted whitespace-pre-wrap break-words">
        {textSample ?? 'A carregar…'}
      </pre>
    </div>
  )
}

function Placeholder({ kind, className, filename }) {
  const Icon = ICONS[kind] || FileQuestion
  const ext = String(filename || '').split('.').pop()?.toUpperCase()
  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-2 text-faint">
        <Icon size={22} />
        {ext && ext.length <= 5 && <span className="mf-data">{ext}</span>}
      </div>
    </div>
  )
}

/** Onda decorativa — sinaliza "áudio" antes do leitor carregar. */
function Waveform() {
  const bars = [8, 16, 26, 14, 32, 20, 38, 24, 12, 30, 18, 26, 10, 22, 34, 16, 8]
  return (
    <div className="flex items-end gap-[3px] h-10" aria-hidden>
      {bars.map((height, index) => (
        <span
          key={index}
          className="w-[3px] rounded-full bg-accent/45"
          style={{ height: `${height}px`, opacity: 0.35 + (height / 38) * 0.65 }}
        />
      ))}
    </div>
  )
}

export function guessKind(filename) {
  const ext = String(filename || '').split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif', 'bmp'].includes(ext)) return 'image'
  if (['mp3', 'wav', 'ogg', 'opus', 'flac', 'm4a', 'aac', 'wma', 'aiff'].includes(ext)) return 'audio'
  if (['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v'].includes(ext)) return 'video'
  if (['txt', 'md', 'html', 'htm', 'csv'].includes(ext)) return 'text'
  if (ext === 'pdf') return 'pdf'
  if (['zip', 'rar', 'tar', '7z'].includes(ext)) return 'archive'
  return 'none'
}

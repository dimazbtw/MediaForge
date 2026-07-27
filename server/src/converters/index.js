import path from 'node:path'
import fsp from 'node:fs/promises'
import { categoryOf, normalizeExt, mimeFor, previewKind, targetsFor } from '../lib/formats.js'
import { normalizeOptions } from '../lib/options.js'
import { translator, TranslatedError } from '../lib/i18n.js'
import { registerFile, outputPath as makeOutputPath, baseName, sanitizeFilename } from '../lib/storage.js'
import { convertImage } from './image.js'
import { convertMedia } from './media.js'
import { convertDocument } from './document.js'
import { convertArchive } from './archive.js'

/**
 * Ponto de entrada único da conversão: escolhe o motor pelo par (origem, destino)
 * e devolve o descritor do ficheiro produzido.
 */
export async function convertFile({
  inputPath,
  originalName,
  target,
  options = {},
  signal,
  setProgress,
  setStage,
  t = translator('pt'),
}) {
  const from = normalizeExt(path.extname(originalName))
  const to = normalizeExt(target)

  if (!to) throw new TranslatedError('error.noTarget')
  if (from === to) throw new TranslatedError('error.sameFormat')

  const allowed = targetsFor(from)
  if (!allowed.includes(to)) {
    throw new TranslatedError('error.unsupportedPair', {
      from: from.toUpperCase() || '?',
      to: to.toUpperCase(),
      targets: allowed.map((value) => value.toUpperCase()).join(', ') || '—',
    })
  }

  const outName = `${sanitizeFilename(baseName(originalName))}.${to}`
  const outPath = makeOutputPath(outName)

  // Nenhum valor vindo do cliente chega aos motores sem passar pelo esquema:
  // o que não corresponder cai no valor por omissão.
  const safeOptions = normalizeOptions(from, to, options)

  const engine = pickEngine(from, to)
  const onProgress = (value) => setProgress?.(value)

  const result = await engine({
    inputPath,
    outputPath: outPath,
    from,
    to,
    originalName,
    options: safeOptions,
    signal,
    onProgress,
    setStage,
    t,
  })

  const stat = await fsp.stat(outPath)
  if (stat.size === 0) throw new TranslatedError('error.emptyOutput', {}, 500)

  const entry = registerFile({ absPath: outPath, filename: outName, mime: mimeFor(to), kind: 'output' })

  return {
    fileId: entry.id,
    filename: outName,
    size: stat.size,
    mime: entry.mime,
    ext: to,
    preview: previewKind(to),
    note: result?.note || null,
    details: cleanDetails(result?.details),
  }
}

function pickEngine(from, to) {
  const sourceCategory = categoryOf(from)
  const targetCategory = categoryOf(to)

  if (targetCategory === 'archive') return convertArchive
  if (sourceCategory === 'archive') return convertArchive
  // GIF → vídeo passa pelo ffmpeg; qualquer outra imagem → imagem usa o sharp.
  if (from === 'gif' && targetCategory === 'video') return convertMedia
  if (sourceCategory === 'image' && targetCategory === 'image') return convertImage
  if (sourceCategory === 'audio' || sourceCategory === 'video') return convertMedia
  if (sourceCategory === 'document') return convertDocument

  throw new TranslatedError('error.unsupportedPair', {
    from: from.toUpperCase() || '?',
    to: to.toUpperCase(),
    targets: targetsFor(from).map((value) => value.toUpperCase()).join(', ') || '—',
  })
}

function cleanDetails(details) {
  if (!details) return null
  const entries = Object.entries(details).filter(([, value]) => value != null && value !== '')
  return entries.length ? Object.fromEntries(entries) : null
}

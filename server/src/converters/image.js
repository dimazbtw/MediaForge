import fsp from 'node:fs/promises'
import sharp from 'sharp'
import potrace from 'potrace'
import { normalizeExt } from '../lib/formats.js'

sharp.cache(false)

const ANIMATED = new Set(['gif', 'webp'])

/**
 * Converte imagens com sharp. Preserva animação quando origem e destino
 * a suportam (GIF <-> WEBP); caso contrário exporta o primeiro fotograma.
 * As opções chegam já validadas por lib/options.js.
 */
export async function convertImage({ inputPath, outputPath, from, to, options = {}, onProgress, setStage, t }) {
  const source = normalizeExt(from)
  const target = normalizeExt(to)

  if (target === 'svg') {
    return vectorize({ inputPath, outputPath, options, onProgress, setStage, t })
  }

  setStage?.(t('stage.reading'))
  onProgress?.(10)

  const animated = ANIMATED.has(source) && ANIMATED.has(target)
  const pipeline = sharp(inputPath, {
    animated,
    // SVG de entrada: rasteriza a uma densidade maior para não sair pixelizado.
    density: source === 'svg' ? Number(options.density) || 384 : 72,
    limitInputPixels: 268_402_689,
  })

  const metadata = await pipeline.metadata()
  onProgress?.(30)

  const applied = {}

  // ── Redimensionamento ─────────────────────────────────────────────────────
  if (options.resizeMode && options.resizeMode !== 'none') {
    const width = Number(options.width) || null
    const height = Number(options.height) || null
    if (width || height) {
      pipeline.resize({
        width: width || undefined,
        height: height || undefined,
        fit: options.resizeMode === 'cover' ? 'cover' : 'inside',
        position: 'centre',
        withoutEnlargement: options.allowUpscale !== true,
      })
      const size = `${width || '?'}×${height || '?'}`
      applied[t('detail.dimensions')] =
        options.resizeMode === 'cover' ? t('value.fill', { size }) : t('value.fitIn', { size })
    }
  }

  // Metadados: por omissão são removidos (privacidade).
  if (options.stripMetadata === false) {
    pipeline.withMetadata()
    applied[t('detail.metadata')] = t('value.preserved')
  }

  const quality = clampNumber(options.quality, 40, 100, 82)
  const lossless = options.lossless === true

  setStage?.(t('stage.encoding', { format: target.toUpperCase() }))
  onProgress?.(55)

  switch (target) {
    case 'jpg':
      pipeline.flatten({ background: options.background || '#ffffff' })
      pipeline.jpeg({ quality, mozjpeg: true, progressive: true })
      applied[t('detail.quality')] = `${quality}%`
      break
    case 'png':
      pipeline.png({ compressionLevel: 9, effort: 7, palette: options.palette === true })
      if (options.palette === true) applied[t('detail.palette')] = '256'
      break
    case 'webp':
      pipeline.webp({ quality, effort: 4, lossless })
      applied[t('detail.quality')] = lossless ? t('value.lossless') : `${quality}%`
      break
    case 'avif':
      pipeline.avif({ quality, effort: 4 })
      applied[t('detail.quality')] = `${quality}%`
      break
    case 'gif':
      pipeline.gif({ effort: 7 })
      break
    case 'tiff':
      pipeline.tiff({ quality, compression: 'lzw' })
      applied[t('detail.quality')] = `${quality}%`
      break
    default:
      throw new Error(`Formato de imagem não suportado: ${target}`)
  }

  await pipeline.toFile(outputPath)
  onProgress?.(100)

  const output = await sharp(outputPath).metadata().catch(() => null)

  return {
    note:
      animated || !ANIMATED.has(source)
        ? null
        : t('note.animatedLost', { from: source.toUpperCase(), to: target.toUpperCase() }),
    details: {
      [t('detail.source')]: `${metadata.width || '?'}×${metadata.height || '?'}`,
      [t('detail.output')]: output ? `${output.width}×${output.height}` : null,
      ...applied,
    },
  }
}

/** Rasteriza para PNG e vetoriza com potrace (posterização a cores). */
async function vectorize({ inputPath, outputPath, options, onProgress, setStage, t }) {
  setStage?.(t('stage.tracing'))
  onProgress?.(15)

  const traceWidth = clampNumber(options.traceWidth, 200, 3000, 1200)
  const steps = clampNumber(options.steps, 2, 10, 5)

  const raster = await sharp(inputPath, { animated: false })
    .resize({ width: traceWidth, withoutEnlargement: true })
    .png()
    .toBuffer()

  onProgress?.(45)
  setStage?.(t('stage.vectorising'))

  const svg = await new Promise((resolve, reject) => {
    potrace.posterize(
      raster,
      {
        steps,
        threshold: potrace.Potrace.THRESHOLD_AUTO,
        color: options.monochrome === true ? '#101010' : 'auto',
        background: 'transparent',
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    )
  })

  await fsp.writeFile(outputPath, svg, 'utf8')
  onProgress?.(100)

  return {
    note: t('note.vectorised'),
    details: {
      [t('detail.levels')]: String(steps),
      [t('detail.trace')]: `${traceWidth}px`,
      [t('detail.mode')]: options.monochrome === true ? t('value.monochrome') : t('value.colour'),
    },
  }
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, Math.round(number)))
}

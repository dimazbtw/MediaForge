import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import AdmZip from 'adm-zip'
import archiver from 'archiver'
import { normalizeExt } from '../lib/formats.js'
import { TranslatedError } from '../lib/i18n.js'
import { makeWorkDir, sanitizeFilename } from '../lib/storage.js'

/**
 * Escreve um ZIP em streaming, com nível de compressão configurável.
 * (O adm-zip não expõe o nível do zlib e carrega tudo em memória; para
 * escrita usamos o archiver, para leitura o adm-zip continua a servir.)
 */
export function writeZip(outputPath, entries, { level = 6 } = {}) {
  return new Promise((resolve, reject) => {
    // `Number(level) || 6` estaria errado: o nível 0 («não comprimir») é
    // falsy e passaria silenciosamente a 6.
    const parsed = Number(level)
    const safeLevel = Number.isFinite(parsed) ? Math.max(0, Math.min(9, Math.round(parsed))) : 6

    const output = fs.createWriteStream(outputPath)
    const archive = archiver('zip', {
      zlib: { level: safeLevel },
      // Nível 0 tem de usar o método STORE — com DEFLATE a nível 0 o zlib
      // ainda envolve os dados em blocos e o ficheiro cresce.
      store: safeLevel === 0,
    })

    output.on('close', resolve)
    output.on('error', reject)
    archive.on('error', reject)
    archive.on('warning', (warning) => {
      if (warning.code !== 'ENOENT') reject(warning)
    })

    archive.pipe(output)
    for (const entry of entries) archive.file(entry.path, { name: entry.name })
    archive.finalize()
  })
}

/**
 * Compressão e reempacotamento.
 *  - qualquer ficheiro  → ZIP / TAR
 *  - ZIP / TAR / RAR    → ZIP / TAR   (extrai e volta a empacotar)
 *
 * Nota: não existe codificador RAR livre (formato proprietário), por isso
 * o RAR é suportado apenas para leitura.
 */
export async function convertArchive({ inputPath, outputPath, from, to, originalName, options = {}, onProgress, setStage, t }) {
  const source = normalizeExt(from)
  const target = normalizeExt(to)

  if (target === 'rar') throw new TranslatedError('error.rarNotSupported')
  if (!['zip', 'tar'].includes(target)) {
    throw new TranslatedError('error.unsupportedPair', {
      from: source.toUpperCase(),
      to: target.toUpperCase(),
      targets: 'ZIP, TAR',
    })
  }

  const isArchiveSource = ['zip', 'tar', 'rar'].includes(source)

  const level = Number(options.compressionLevel ?? 6)

  if (!isArchiveSource) {
    setStage?.(t('stage.compressing', { format: target.toUpperCase() }))
    onProgress?.(30)
    const entryName = sanitizeFilename(originalName || path.basename(inputPath))
    if (target === 'zip') {
      await writeZip(outputPath, [{ name: entryName, path: inputPath }], { level })
    } else {
      await writeTar(outputPath, [{ name: entryName, path: inputPath }])
    }
    onProgress?.(100)
    const before = (await fsp.stat(inputPath)).size
    const after = (await fsp.stat(outputPath)).size
    return {
      note: null,
      details: {
        [t('detail.entries')]: '1',
        [t('detail.compression')]: target === 'zip' ? levelLabel(level, t) : t('value.noneTar'),
        [t('detail.reduction')]: before > 0 ? `${Math.max(0, Math.round((1 - after / before) * 100))}%` : null,
      },
    }
  }

  setStage?.(t('stage.unpacking'))
  onProgress?.(15)
  const workDir = await makeWorkDir('archive')
  try {
    const entries = await extractArchive({ inputPath, source, destDir: workDir })
    if (!entries.length) throw new TranslatedError('error.emptyOutput', {}, 422)
    onProgress?.(60)

    setStage?.(t('stage.repacking', { format: target.toUpperCase() }))
    if (target === 'zip') {
      await writeZip(outputPath, entries, { level })
    } else {
      await writeTar(outputPath, entries)
    }
    onProgress?.(100)

    return {
      note: source === 'rar' ? t('note.rarRepacked') : null,
      details: {
        [t('detail.entries')]: String(entries.length),
        [t('detail.compression')]: target === 'zip' ? levelLabel(level, t) : t('value.noneTar'),
      },
    }
  } finally {
    await fsp.rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}

const levelLabel = (level, t) =>
  ({ 0: t('value.none'), 1: t('value.fastest'), 6: t('value.normal'), 9: t('value.maximum') })[Number(level)] ||
  String(level)

async function extractArchive({ inputPath, source, destDir }) {
  if (source === 'zip') {
    const zip = new AdmZip(inputPath)
    zip.extractAllTo(destDir, true)
    return walk(destDir)
  }
  if (source === 'rar') {
    const { createExtractorFromData } = await import('node-unrar-js')
    const data = await fsp.readFile(inputPath)
    const extractor = await createExtractorFromData({ data: Uint8Array.from(data).buffer })
    const extracted = extractor.extract()
    const files = [...extracted.files]
    for (const file of files) {
      if (file.fileHeader.flags.directory || !file.extraction) continue
      const safeName = safeJoin(destDir, file.fileHeader.name)
      await fsp.mkdir(path.dirname(safeName), { recursive: true })
      await fsp.writeFile(safeName, Buffer.from(file.extraction))
    }
    return walk(destDir)
  }
  if (source === 'tar') {
    await readTar(inputPath, destDir)
    return walk(destDir)
  }
  throw new Error(`Não sei extrair ficheiros ${source.toUpperCase()}.`)
}

/** Bloqueia zip-slip: nenhuma entrada pode escapar da pasta de destino. */
function safeJoin(root, entryName) {
  const normalized = path
    .normalize(String(entryName).replace(/\\/g, '/'))
    .replace(/^([/\\]|\.\.[/\\])+/, '')
  const full = path.resolve(root, normalized)
  if (!full.startsWith(path.resolve(root) + path.sep) && full !== path.resolve(root)) {
    throw new Error(`Entrada de arquivo insegura: ${entryName}`)
  }
  return full
}

async function walk(root, base = root) {
  const out = []
  for (const entry of await fsp.readdir(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full, base)))
    else if (entry.isFile()) out.push({ path: full, name: path.relative(base, full).replace(/\\/g, '/') })
  }
  return out
}

// ── TAR (ustar) mínimo, sem dependências ────────────────────────────────────

const BLOCK = 512

function tarHeader({ name, size, mode = 0o644, mtime = Math.floor(Date.now() / 1000) }) {
  const header = Buffer.alloc(BLOCK, 0)
  const write = (value, offset, length) => header.write(String(value).slice(0, length - 1), offset, length, 'utf8')
  const octal = (value, length) => value.toString(8).padStart(length - 1, '0') + '\0'

  let entryName = name
  let prefix = ''
  if (Buffer.byteLength(entryName) > 100) {
    const cut = entryName.lastIndexOf('/', entryName.length - 100)
    if (cut > 0) {
      prefix = entryName.slice(0, cut)
      entryName = entryName.slice(cut + 1)
    } else {
      entryName = entryName.slice(-99)
    }
  }

  write(entryName, 0, 100)
  write(octal(mode, 8), 100, 8)
  write(octal(0, 8), 108, 8) // uid
  write(octal(0, 8), 116, 8) // gid
  write(octal(size, 12), 124, 12)
  write(octal(mtime, 12), 136, 12)
  header.write('        ', 148, 8, 'utf8') // checksum provisório
  header.write('0', 156, 1, 'utf8') // tipo: ficheiro normal
  header.write('ustar\0', 257, 6, 'utf8')
  header.write('00', 263, 2, 'utf8')
  if (prefix) write(prefix, 345, 155)

  let checksum = 0
  for (const byte of header) checksum += byte
  header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'utf8')
  return header
}

function writeTar(outputPath, entries) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(outputPath)
    out.on('error', reject)

    const next = async (index) => {
      try {
        if (index >= entries.length) {
          out.write(Buffer.alloc(BLOCK * 2, 0))
          out.end(() => resolve())
          return
        }
        const entry = entries[index]
        const stat = await fsp.stat(entry.path)
        out.write(tarHeader({ name: entry.name, size: stat.size, mtime: Math.floor(stat.mtimeMs / 1000) }))

        const reader = fs.createReadStream(entry.path)
        reader.on('error', reject)
        reader.on('data', (chunk) => out.write(chunk))
        reader.on('end', () => {
          const padding = (BLOCK - (stat.size % BLOCK)) % BLOCK
          if (padding) out.write(Buffer.alloc(padding, 0))
          next(index + 1)
        })
      } catch (error) {
        reject(error)
      }
    }

    next(0)
  })
}

async function readTar(inputPath, destDir) {
  const data = await fsp.readFile(inputPath)
  let offset = 0
  while (offset + BLOCK <= data.length) {
    const header = data.subarray(offset, offset + BLOCK)
    if (header.every((byte) => byte === 0)) break

    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '')
    const prefix = header.subarray(345, 500).toString('utf8').replace(/\0.*$/, '')
    const sizeField = header.subarray(124, 136).toString('utf8').replace(/\0.*$/, '').trim()
    const size = parseInt(sizeField, 8) || 0
    const type = header.subarray(156, 157).toString('utf8')
    offset += BLOCK

    if (name && (type === '0' || type === '\0' || type === '')) {
      const full = safeJoin(destDir, prefix ? `${prefix}/${name}` : name)
      await fsp.mkdir(path.dirname(full), { recursive: true })
      await fsp.writeFile(full, data.subarray(offset, offset + size))
    }
    offset += Math.ceil(size / BLOCK) * BLOCK
  }
}

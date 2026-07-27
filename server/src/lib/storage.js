import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import { config } from '../config.js'

/**
 * Registo em memória dos ficheiros temporários.
 * Cada entrada expira ao fim de FILE_TTL_HOURS e é apagada do disco pelo limpador.
 */
const files = new Map()

export function registerFile({ absPath, filename, mime, kind = 'output' }) {
  const id = nanoid(16)
  let size = 0
  try {
    size = fs.statSync(absPath).size
  } catch {
    /* ficheiro pode ainda não existir — tamanho fica a 0 */
  }
  const entry = {
    id,
    absPath,
    filename,
    mime: mime || 'application/octet-stream',
    kind,
    size,
    createdAt: Date.now(),
    expiresAt: Date.now() + config.fileTtlHours * 3_600_000,
  }
  files.set(id, entry)
  return entry
}

export function getFile(id) {
  const entry = files.get(id)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    files.delete(id)
    return null
  }
  if (!fs.existsSync(entry.absPath)) {
    files.delete(id)
    return null
  }
  return entry
}

export function listFiles() {
  return [...files.values()]
}

export function forgetFile(id) {
  files.delete(id)
}

/** Cria uma pasta de trabalho isolada para um job. */
export async function makeWorkDir(prefix = 'job') {
  const dir = path.join(config.workDir, `${prefix}-${nanoid(10)}`)
  await fsp.mkdir(dir, { recursive: true })
  return dir
}

export function outputPath(filename) {
  return path.join(config.outputDir, `${nanoid(12)}-${sanitizeFilename(filename)}`)
}

/** Remove caracteres problemáticos mantendo acentos e espaços legíveis. */
export function sanitizeFilename(name, fallback = 'ficheiro') {
  const cleaned = String(name || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 180)
  return cleaned || fallback
}

export function baseName(filename) {
  const parsed = path.parse(filename || '')
  return parsed.name || 'ficheiro'
}

export function extOf(filename) {
  return path.extname(filename || '').replace('.', '').toLowerCase()
}

export async function safeRemove(target) {
  if (!target) return
  try {
    await fsp.rm(target, { recursive: true, force: true })
  } catch {
    /* limpeza é best-effort */
  }
}

/** Apaga ficheiros expirados (registados ou órfãos) das pastas temporárias. */
export async function sweep({ ttlMs = config.fileTtlHours * 3_600_000 } = {}) {
  const now = Date.now()
  const removed = []

  for (const entry of [...files.values()]) {
    if (entry.expiresAt <= now) {
      await safeRemove(entry.absPath)
      files.delete(entry.id)
      removed.push(entry.absPath)
    }
  }

  for (const dir of [config.uploadDir, config.outputDir, config.workDir]) {
    let names = []
    try {
      names = await fsp.readdir(dir)
    } catch {
      continue
    }
    for (const name of names) {
      const full = path.join(dir, name)
      try {
        const stat = await fsp.stat(full)
        if (now - stat.mtimeMs > ttlMs) {
          await safeRemove(full)
          removed.push(full)
        }
      } catch {
        /* corrida com outra limpeza — ignorar */
      }
    }
  }

  return removed
}

export function storageStats() {
  const entries = listFiles()
  return {
    trackedFiles: entries.length,
    trackedBytes: entries.reduce((sum, entry) => sum + (entry.size || 0), 0),
    ttlHours: config.fileTtlHours,
  }
}

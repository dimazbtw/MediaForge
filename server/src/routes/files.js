import { Router } from 'express'
import fs from 'node:fs'
import { getFile } from '../lib/storage.js'
import { languageOf, t } from '../lib/i18n.js'

export const filesRouter = Router()

function resolve(req, res) {
  const entry = getFile(req.params.id)
  if (!entry) {
    res.status(404).json({ error: t(languageOf(req), 'error.fileGone') })
    return null
  }
  return entry
}

/** Descarrega com Content-Disposition: attachment. */
filesRouter.get('/:id', (req, res) => {
  const entry = resolve(req, res)
  if (!entry) return
  res.setHeader('Content-Type', entry.mime)
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${asciiFallback(entry.filename)}"; filename*=UTF-8''${encodeURIComponent(entry.filename)}`,
  )
  res.sendFile(entry.absPath, (error) => {
    if (error && !res.headersSent) res.status(500).json({ error: 'Falha ao enviar o ficheiro.' })
  })
})

/** Pré-visualização inline (imagens, áudio, vídeo, texto) com suporte a Range. */
filesRouter.get('/:id/preview', (req, res) => {
  const entry = resolve(req, res)
  if (!entry) return
  res.setHeader('Content-Type', entry.mime)
  res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(entry.filename)}`)
  res.setHeader('Cache-Control', 'private, max-age=600')
  res.sendFile(entry.absPath, { acceptRanges: true }, (error) => {
    if (error && !res.headersSent) res.status(500).end()
  })
})

/** Metadados do ficheiro, sem o transferir. */
filesRouter.get('/:id/info', (req, res) => {
  const entry = resolve(req, res)
  if (!entry) return
  let size = entry.size
  try {
    size = fs.statSync(entry.absPath).size
  } catch {
    /* mantém o valor registado */
  }
  res.json({
    id: entry.id,
    filename: entry.filename,
    mime: entry.mime,
    size,
    expiresAt: entry.expiresAt,
  })
})

function asciiFallback(name) {
  return String(name)
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/"/g, "'")
}

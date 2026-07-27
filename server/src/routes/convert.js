import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import { nanoid } from 'nanoid'
import { config } from '../config.js'
import { convertFile } from '../converters/index.js'
import { createJob, enqueue, trackTemp, serialize } from '../lib/jobs.js'
import { normalizeExt, targetsFor, categoryOf } from '../lib/formats.js'
import { describeOptions } from '../lib/options.js'
import { languageOf, TranslatedError } from '../lib/i18n.js'
import { sanitizeFilename } from '../lib/storage.js'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const original = decodeOriginalName(file.originalname)
    cb(null, `${nanoid(12)}${path.extname(original).toLowerCase() || ''}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes, files: 12 },
})

/** O multer entrega latin1; o browser envia UTF-8. */
function decodeOriginalName(name) {
  try {
    return Buffer.from(name, 'latin1').toString('utf8')
  } catch {
    return name
  }
}

export const convertRouter = Router()

/** Descobre destinos possíveis sem enviar o ficheiro. */
convertRouter.get('/targets', (req, res) => {
  const ext = normalizeExt(req.query.ext || path.extname(String(req.query.filename || '')))
  res.json({ ext, category: categoryOf(ext), targets: targetsFor(ext) })
})

/**
 * Esquema de opções para um par (origem → destino).
 * A UI desenha os controlos a partir daqui, por isso nunca aparece no ecrã
 * uma opção que o motor não saiba aplicar.
 */
convertRouter.get('/options', (req, res, next) => {
  const from = normalizeExt(req.query.from || '')
  const to = normalizeExt(req.query.to || '')
  const allowed = targetsFor(from)
  if (!to || !allowed.includes(to)) {
    return next(
      new TranslatedError('error.unsupportedPair', {
        from: from.toUpperCase() || '?',
        to: to.toUpperCase() || '?',
        targets: allowed.map((value) => value.toUpperCase()).join(', ') || '—',
      }),
    )
  }
  res.json({ from, to, ...describeOptions(from, to, languageOf(req)) })
})

convertRouter.post('/', upload.array('files', 12), (req, res, next) => {
  try {
    const lang = languageOf(req)
    const files = req.files || []
    if (!files.length) throw new TranslatedError('error.noFiles')

    // `targets` pode ser um único valor (mesmo destino para todos) ou um por ficheiro.
    const rawTargets = req.body.targets ?? req.body.target
    const targets = Array.isArray(rawTargets) ? rawTargets : [rawTargets]
    let options = {}
    try {
      options = req.body.options ? JSON.parse(req.body.options) : {}
    } catch {
      options = {}
    }

    const jobs = files.map((file, index) => {
      const originalName = sanitizeFilename(decodeOriginalName(file.originalname))
      const target = normalizeExt(targets[index] ?? targets[0])
      const from = normalizeExt(path.extname(originalName))

      const job = createJob({
        kind: 'convert',
        lang,
        title: originalName,
        subtitle: `${from.toUpperCase() || '?'} → ${target.toUpperCase() || '?'}`,
        meta: {
          from,
          to: target,
          inputSize: file.size,
          category: categoryOf(from),
        },
      })

      trackTemp(job.id, file.path)

      enqueue(job, ({ signal, setProgress, setStage, t }) =>
        convertFile({
          inputPath: file.path,
          originalName,
          target,
          options: options[originalName] || options[String(index)] || options.all || options,
          signal,
          setProgress,
          setStage,
          t,
        }),
      )

      return serialize(job)
    })

    res.status(202).json({ jobs })
  } catch (error) {
    next(error)
  }
})

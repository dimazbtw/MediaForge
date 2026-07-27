import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { config, ensureDirs } from './config.js'
import { capabilitiesReport } from './lib/binaries.js'
import { formatMatrix, ACCEPTED_EXTENSIONS, COMPRESSION_TARGETS } from './lib/formats.js'
import { sweep, storageStats } from './lib/storage.js'
import { languageOf, localizeError, t, LANGUAGES } from './lib/i18n.js'
import { queueStats } from './lib/jobs.js'
import { convertRouter } from './routes/convert.js'
import { videoRouter, musicRouter } from './routes/downloads.js'
import { jobsRouter } from './routes/jobs.js'
import { filesRouter } from './routes/files.js'

ensureDirs()

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)

app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((value) => value.trim()),
    credentials: false,
  }),
)
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: Math.round(process.uptime()), queue: queueStats(), storage: storageStats() })
})

app.get('/api/capabilities', (_req, res) => {
  const tools = capabilitiesReport()
  res.json({
    tools,
    conversion: {
      matrix: formatMatrix(),
      accepted: ACCEPTED_EXTENSIONS,
      compressionTargets: COMPRESSION_TARGETS,
      maxUploadMb: config.maxUploadMb,
    },
    limits: {
      maxUploadMb: config.maxUploadMb,
      maxPlaylistItems: config.maxPlaylistItems,
      fileTtlHours: config.fileTtlHours,
      concurrency: config.concurrency,
    },
    languages: LANGUAGES,
    features: {
      convert: tools.ffmpeg.available,
      video: tools.ytdlp.available,
      music: tools.ytdlp.available,
      spotifyPlaylists: tools.spotifyApi.available,
      highFidelityDocs: tools.libreoffice.available,
    },
  })
})

app.use('/api/convert', convertRouter)
app.use('/api/video', videoRouter)
app.use('/api/music', musicRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/files', filesRouter)

app.use('/api', (req, res) => res.status(404).json({ error: t(languageOf(req), 'error.endpointNotFound') }))

// eslint-disable-next-line no-unused-vars -- o Express exige a assinatura de 4 argumentos
app.use((error, req, res, _next) => {
  const lang = languageOf(req)

  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? t(lang, 'error.fileTooLarge', { max: config.maxUploadMb })
        : t(lang, 'error.uploadFailed', { reason: error.message })
    return res.status(413).json({ error: message })
  }

  const status = error.status || 500
  if (status >= 500) console.error('[mediaforge]', error)
  res.status(status).json({ error: localizeError(error, lang) || t(lang, 'error.internal') })
})

const server = app.listen(config.port, config.host, () => {
  const tools = capabilitiesReport()
  console.log('')
  console.log('  ▲ MediaForge API')
  console.log(`    http://${config.host}:${config.port}`)
  console.log('')
  console.log(`    ffmpeg      ${tools.ffmpeg.available ? '✓ ' + (tools.ffmpeg.version || '') : '✗ em falta — conversões A/V desativadas'}`)
  console.log(`    yt-dlp      ${tools.ytdlp.available ? '✓ ' + (tools.ytdlp.version || '') : '✗ em falta — corre `npm run setup:ytdlp`'}`)
  console.log(`    LibreOffice ${tools.libreoffice.available ? '✓ documentos em alta fidelidade' : '· opcional (melhora DOCX↔PDF)'}`)
  console.log(`    Spotify API ${tools.spotifyApi.available ? '✓ álbuns e playlists' : '· opcional (só faixas isoladas sem chaves)'}`)
  console.log('')
  console.log(`    ficheiros temporários apagados ao fim de ${config.fileTtlHours}h`)
  console.log('')
})

// Limpeza periódica do armazenamento temporário.
const cleanup = setInterval(async () => {
  const removed = await sweep()
  if (removed.length) console.log(`[mediaforge] limpeza: ${removed.length} ficheiro(s) removido(s)`)
}, config.cleanupIntervalMinutes * 60_000)
cleanup.unref()

sweep().catch(() => {})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    clearInterval(cleanup)
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 3000).unref()
  })
}

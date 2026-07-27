import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const here = path.dirname(fileURLToPath(import.meta.url))
export const SERVER_ROOT = path.resolve(here, '..')
export const REPO_ROOT = path.resolve(SERVER_ROOT, '..')

// .env na raiz do repo tem prioridade; .env dentro de /server também é aceite.
dotenv.config({ path: path.join(REPO_ROOT, '.env') })
dotenv.config({ path: path.join(SERVER_ROOT, '.env') })

const num = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const resolveDir = (value, fallback) => {
  const raw = value?.trim() || fallback
  return path.isAbsolute(raw) ? raw : path.join(SERVER_ROOT, raw)
}

const tmpDir = resolveDir(process.env.TMP_DIR, 'tmp')

export const config = {
  port: num(process.env.PORT, 4000),
  host: process.env.HOST?.trim() || '127.0.0.1',
  corsOrigin: process.env.CORS_ORIGIN?.trim() || 'http://localhost:5173',

  tmpDir,
  uploadDir: path.join(tmpDir, 'uploads'),
  outputDir: path.join(tmpDir, 'outputs'),
  workDir: path.join(tmpDir, 'work'),
  binDir: path.join(SERVER_ROOT, 'bin'),

  fileTtlHours: num(process.env.FILE_TTL_HOURS, 2),
  cleanupIntervalMinutes: num(process.env.CLEANUP_INTERVAL_MINUTES, 10),
  maxUploadBytes: num(process.env.MAX_UPLOAD_MB, 512) * 1024 * 1024,
  maxUploadMb: num(process.env.MAX_UPLOAD_MB, 512),

  concurrency: num(process.env.QUEUE_CONCURRENCY, 2),
  maxPlaylistItems: num(process.env.MAX_PLAYLIST_ITEMS, 50),
  jobTimeoutMs: num(process.env.JOB_TIMEOUT_MINUTES, 30) * 60_000,

  ffmpegPath: process.env.FFMPEG_PATH?.trim() || '',
  ffprobePath: process.env.FFPROBE_PATH?.trim() || '',
  ytdlpPath: process.env.YTDLP_PATH?.trim() || '',
  sofficePath: process.env.SOFFICE_PATH?.trim() || '',

  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID?.trim() || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET?.trim() || '',
  },
}

export function ensureDirs() {
  for (const dir of [config.tmpDir, config.uploadDir, config.outputDir, config.workDir]) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

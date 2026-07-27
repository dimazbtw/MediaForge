import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { config } from '../config.js'
import { TranslatedError, t } from './i18n.js'

const require = createRequire(import.meta.url)
const isWin = process.platform === 'win32'
const exeName = (name) => (isWin ? `${name}.exe` : name)

/** Procura `name` no PATH sem depender de `which`/`where`. */
function findOnPath(name) {
  const dirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean)
  const candidates = isWin
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';').map((ext) => name + ext.toLowerCase())
    : [name]
  for (const dir of dirs) {
    for (const candidate of candidates) {
      const full = path.join(dir, candidate)
      try {
        if (fs.statSync(full).isFile()) return full
      } catch {
        /* segue */
      }
    }
  }
  return null
}

function fromStatic(moduleName) {
  try {
    const resolved = require(moduleName)
    const value = typeof resolved === 'string' ? resolved : resolved?.path
    return value && fs.existsSync(value) ? value : null
  } catch {
    return null
  }
}

function inBinDir(name) {
  const full = path.join(config.binDir, exeName(name))
  return fs.existsSync(full) ? full : null
}

function firstExisting(...values) {
  for (const value of values) {
    if (!value) continue
    if (path.isAbsolute(value) || value.includes(path.sep)) {
      if (fs.existsSync(value)) return value
      continue
    }
    return value
  }
  return null
}

const cache = new Map()

function detect(key, resolver) {
  if (!cache.has(key)) cache.set(key, resolver())
  return cache.get(key)
}

export const binaries = {
  get ffmpeg() {
    return detect('ffmpeg', () =>
      firstExisting(config.ffmpegPath, inBinDir('ffmpeg'), findOnPath('ffmpeg'), fromStatic('ffmpeg-static')),
    )
  },
  get ffprobe() {
    return detect('ffprobe', () => {
      const direct = firstExisting(config.ffprobePath, inBinDir('ffprobe'), findOnPath('ffprobe'))
      if (direct) return direct
      // ffmpeg e ffprobe costumam viver lado a lado.
      const ffmpeg = binaries.ffmpeg
      if (ffmpeg) {
        const sibling = path.join(path.dirname(ffmpeg), exeName('ffprobe'))
        if (fs.existsSync(sibling)) return sibling
      }
      return fromStatic('ffprobe-static')
    })
  },
  get ytdlp() {
    return detect('ytdlp', () =>
      firstExisting(
        config.ytdlpPath,
        inBinDir('yt-dlp'),
        findOnPath('yt-dlp'),
        findOnPath('yt-dlp_x86'),
        findOnPath('youtube-dl'),
      ),
    )
  },
  get soffice() {
    return detect('soffice', () => {
      const direct = firstExisting(config.sofficePath, findOnPath('soffice'))
      if (direct) return direct
      const guesses = isWin
        ? [
            'C:/Program Files/LibreOffice/program/soffice.exe',
            'C:/Program Files (x86)/LibreOffice/program/soffice.exe',
          ]
        : ['/usr/bin/soffice', '/usr/local/bin/soffice', '/Applications/LibreOffice.app/Contents/MacOS/soffice']
      return guesses.find((candidate) => fs.existsSync(candidate)) || null
    })
  },
}

/** Versão legível de um binário, ou null se não arrancar. */
export function probeVersion(bin, args = ['-version']) {
  if (!bin) return null
  try {
    const result = spawnSync(bin, args, { encoding: 'utf8', timeout: 8000, windowsHide: true })
    if (result.error || result.status !== 0) return null
    const line = (result.stdout || result.stderr || '').split(/\r?\n/)[0]?.trim()
    return line || null
  } catch {
    return null
  }
}

export function capabilitiesReport() {
  const ffmpeg = binaries.ffmpeg
  const ffprobe = binaries.ffprobe
  const ytdlp = binaries.ytdlp
  const soffice = binaries.soffice
  return {
    ffmpeg: { available: Boolean(ffmpeg), path: ffmpeg, version: probeVersion(ffmpeg) },
    ffprobe: { available: Boolean(ffprobe), path: ffprobe, version: probeVersion(ffprobe) },
    ytdlp: { available: Boolean(ytdlp), path: ytdlp, version: probeVersion(ytdlp, ['--version']) },
    libreoffice: { available: Boolean(soffice), path: soffice },
    spotifyApi: { available: Boolean(config.spotify.clientId && config.spotify.clientSecret) },
  }
}

export function requireBinary(name) {
  const bin = binaries[name]
  if (!bin) {
    // A dica é resolvida no idioma do pedido pelo TranslatedError.
    const error = new MissingBinaryError(name)
    throw error
  }
  return bin
}

/** Erro com a dica de instalação certa para cada binário. */
class MissingBinaryError extends TranslatedError {
  constructor(name) {
    super('error.missingBinary', { name, hint: HINTS[name] || '' }, 503)
    this.code = 'MISSING_BINARY'
    this.binary = name
  }

  localized(language) {
    return t(language, 'error.missingBinary', { name: this.binary, hint: t(language, HINTS[this.binary] || '') })
  }
}

const HINTS = {
  ffmpeg: 'hint.ffmpeg',
  ffprobe: 'hint.ffprobe',
  ytdlp: 'hint.ytdlp',
  soffice: 'hint.soffice',
}

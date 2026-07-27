#!/usr/bin/env node
/**
 * Descarrega o binário oficial do yt-dlp (releases do GitHub) para ./server/bin.
 * Corre com:  npm run setup:ytdlp
 */
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const binDir = path.join(root, 'server', 'bin')

const ASSETS = {
  win32: { asset: 'yt-dlp.exe', file: 'yt-dlp.exe' },
  darwin: { asset: 'yt-dlp_macos', file: 'yt-dlp' },
  linux: { asset: process.arch === 'arm64' ? 'yt-dlp_linux_aarch64' : 'yt-dlp_linux', file: 'yt-dlp' },
}

const target = ASSETS[process.platform]
if (!target) {
  console.error(`Plataforma não suportada automaticamente: ${process.platform}`)
  console.error('Instala o yt-dlp manualmente e define YTDLP_PATH no .env.')
  process.exit(1)
}

const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${target.asset}`
const dest = path.join(binDir, target.file)

console.log(`→ a descarregar ${target.asset}`)
console.log(`  de ${url}`)

await fsp.mkdir(binDir, { recursive: true })

const response = await fetch(url, { redirect: 'follow' })
if (!response.ok || !response.body) {
  console.error(`Falhou: HTTP ${response.status}`)
  process.exit(1)
}

const tmp = `${dest}.part`
await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(tmp))
await fsp.rename(tmp, dest)
if (process.platform !== 'win32') await fsp.chmod(dest, 0o755)

const { size } = await fsp.stat(dest)
console.log(`✓ guardado em ${dest} (${(size / 1024 / 1024).toFixed(1)} MB)`)
console.log('  Reinicia o servidor para o MediaForge o detetar.')

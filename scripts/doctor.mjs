#!/usr/bin/env node
/** Diagnóstico rápido: que funcionalidades estão ativas nesta máquina. */
import { capabilitiesReport } from '../server/src/lib/binaries.js'
import { config } from '../server/src/config.js'

const tools = capabilitiesReport()
const line = (label, ok, detail) =>
  console.log(`  ${ok ? '✓' : '✗'}  ${label.padEnd(14)} ${detail || ''}`)

console.log('\n  MediaForge — diagnóstico\n')

line('ffmpeg', tools.ffmpeg.available, tools.ffmpeg.path || 'não encontrado (conversões A/V desativadas)')
line('ffprobe', tools.ffprobe.available, tools.ffprobe.path || 'não encontrado')
line('yt-dlp', tools.ytdlp.available, tools.ytdlp.path || 'não encontrado — corre `npm run setup:ytdlp`')
line('LibreOffice', tools.libreoffice.available, tools.libreoffice.path || 'opcional — melhora DOCX ↔ PDF')
line('Spotify API', tools.spotifyApi.available, tools.spotifyApi.available ? 'álbuns e playlists ativos' : 'opcional — sem chaves, só faixas isoladas')

console.log('\n  Configuração')
console.log(`     porta            ${config.port}`)
console.log(`     upload máximo    ${config.maxUploadMb} MB`)
console.log(`     TTL ficheiros    ${config.fileTtlHours} h`)
console.log(`     concorrência     ${config.concurrency}`)
console.log(`     máx. por lista   ${config.maxPlaylistItems}`)
console.log(`     pasta temp.      ${config.tmpDir}\n`)

const blocking = !tools.ffmpeg.available || !tools.ytdlp.available
process.exit(blocking ? 1 : 0)

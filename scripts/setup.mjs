#!/usr/bin/env node
/**
 * Instalador do MediaForge.
 *
 * Corre com:  npm run setup
 *
 * Só usa módulos nativos do Node, para poder correr ANTES de existir
 * node_modules. Faz, por esta ordem:
 *   1. verifica a versão do Node
 *   2. cria o .env a partir do .env.example (se ainda não existir)
 *   3. instala as dependências npm dos dois workspaces
 *   4. descarrega o yt-dlp para ./server/bin
 *   5. procura o ffmpeg e o LibreOffice e diz o que falta
 *
 * Sinalizadores:
 *   --skip-ytdlp     não descarrega o yt-dlp
 *   --skip-install   não corre o npm install (só verifica o resto)
 *   --with-ffmpeg    tenta instalar o ffmpeg pelo gestor de pacotes do sistema
 */
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BIN_DIR = path.join(ROOT, 'server', 'bin')
const isWin = process.platform === 'win32'
const args = new Set(process.argv.slice(2))

// ── Apresentação ────────────────────────────────────────────────────────────

const supportsColour = process.stdout.isTTY && !process.env.NO_COLOR
const paint = (code, text) => (supportsColour ? `\u001b[${code}m${text}\u001b[0m` : text)
const bold = (text) => paint('1', text)
const dim = (text) => paint('2', text)
const green = (text) => paint('32', text)
const yellow = (text) => paint('33', text)
const red = (text) => paint('31', text)

const steps = []
let stepNumber = 0

function step(title) {
  stepNumber += 1
  console.log(`\n${bold(`[${stepNumber}/5]`)} ${bold(title)}`)
}
const ok = (message) => console.log(`  ${green('✓')} ${message}`)
const warn = (message) => console.log(`  ${yellow('!')} ${message}`)
const fail = (message) => console.log(`  ${red('✗')} ${message}`)
const info = (message) => console.log(`  ${dim(message)}`)

// ── Utilitários ─────────────────────────────────────────────────────────────

/** Procura um executável no PATH sem depender de `which`/`where`. */
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
        /* continua */
      }
    }
  }
  return null
}

function firstExisting(...paths) {
  return paths.find((candidate) => candidate && fs.existsSync(candidate)) || null
}

function run(command, commandArgs, { cwd = ROOT } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, commandArgs, {
      cwd,
      stdio: 'inherit',
      // No Windows o npm é um .cmd e precisa da shell.
      shell: isWin,
    })
    child.on('error', () => resolve(1))
    child.on('close', (code) => resolve(code ?? 1))
  })
}

function version(bin, versionArgs = ['-version']) {
  if (!bin) return null
  try {
    const result = spawnSync(bin, versionArgs, { encoding: 'utf8', timeout: 8000, windowsHide: true })
    if (result.error || result.status !== 0) return null
    return (result.stdout || result.stderr || '').split(/\r?\n/)[0]?.trim() || null
  } catch {
    return null
  }
}

// ── 1. Node ─────────────────────────────────────────────────────────────────

console.log(`\n${bold('  MediaForge')} ${dim('— instalação')}`)
console.log(dim(`  ${os.type()} ${os.release()} · Node ${process.version}\n`))

step('Versão do Node')
const [major, minor] = process.versions.node.split('.').map(Number)
if (major < 20 || (major === 20 && minor < 11)) {
  fail(`Node ${process.version} é demasiado antigo. É preciso 20.11 ou superior.`)
  info('Descarrega em https://nodejs.org — escolhe a versão LTS.')
  process.exit(1)
}
ok(`Node ${process.version}`)

// ── 2. .env ─────────────────────────────────────────────────────────────────

step('Ficheiro de configuração')
const envPath = path.join(ROOT, '.env')
const envExample = path.join(ROOT, '.env.example')
if (fs.existsSync(envPath)) {
  ok('.env já existe — deixado como está')
} else if (fs.existsSync(envExample)) {
  await fsp.copyFile(envExample, envPath)
  ok('.env criado a partir do .env.example')
  info('Todos os valores têm omissões sensatas; só mexe se precisares.')
} else {
  warn('.env.example não encontrado — a saltar (o servidor usa os valores por omissão)')
}

// ── 3. Dependências npm ─────────────────────────────────────────────────────

step('Dependências npm')
if (args.has('--skip-install')) {
  info('saltado (--skip-install)')
} else {
  info('a correr `npm install` (instala a raiz, o server e o web de uma vez)…')
  const code = await run('npm', ['install', '--no-audit', '--no-fund'])
  if (code !== 0) {
    fail('O npm install falhou.')
    info('Tenta apagar node_modules e package-lock.json e correr de novo.')
    process.exit(1)
  }
  ok('dependências instaladas')
}

// ── 4. yt-dlp ───────────────────────────────────────────────────────────────

const YTDLP_ASSETS = {
  win32: { asset: 'yt-dlp.exe', file: 'yt-dlp.exe' },
  darwin: { asset: 'yt-dlp_macos', file: 'yt-dlp' },
  linux: { asset: process.arch === 'arm64' ? 'yt-dlp_linux_aarch64' : 'yt-dlp_linux', file: 'yt-dlp' },
}

step('yt-dlp (downloads de vídeo e música)')
const ytTarget = YTDLP_ASSETS[process.platform]
const ytLocal = ytTarget ? path.join(BIN_DIR, ytTarget.file) : null

if (args.has('--skip-ytdlp')) {
  info('saltado (--skip-ytdlp)')
  steps.push(['yt-dlp', Boolean(firstExisting(ytLocal) || findOnPath('yt-dlp')), 'obrigatório para downloads'])
} else if (ytLocal && fs.existsSync(ytLocal)) {
  ok(`já instalado — ${version(ytLocal, ['--version']) || ytLocal}`)
  steps.push(['yt-dlp', true, ''])
} else if (findOnPath('yt-dlp')) {
  ok(`encontrado no PATH — ${findOnPath('yt-dlp')}`)
  steps.push(['yt-dlp', true, ''])
} else if (!ytTarget) {
  warn(`sem binário automático para ${process.platform}`)
  info('Instala o yt-dlp manualmente e define YTDLP_PATH no .env.')
  steps.push(['yt-dlp', false, 'instala manualmente'])
} else {
  const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${ytTarget.asset}`
  info(`a descarregar de ${url}`)
  try {
    await fsp.mkdir(BIN_DIR, { recursive: true })
    const response = await fetch(url, { redirect: 'follow' })
    if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`)
    const tmp = `${ytLocal}.part`
    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(tmp))
    await fsp.rename(tmp, ytLocal)
    if (!isWin) await fsp.chmod(ytLocal, 0o755)
    const size = (await fsp.stat(ytLocal)).size
    ok(`instalado em server/bin (${(size / 1024 / 1024).toFixed(1)} MB)`)
    steps.push(['yt-dlp', true, ''])
  } catch (error) {
    fail(`não foi possível descarregar: ${error.message}`)
    info('Podes tentar mais tarde com `npm run setup:ytdlp`.')
    steps.push(['yt-dlp', false, 'corre `npm run setup:ytdlp`'])
  }
}

// ── 5. Binários do sistema ──────────────────────────────────────────────────

step('Binários do sistema')

const FFMPEG_INSTALL = {
  win32: ['winget', ['install', '--id', 'Gyan.FFmpeg', '-e', '--source', 'winget']],
  darwin: ['brew', ['install', 'ffmpeg']],
  linux: ['sudo', ['apt', 'install', '-y', 'ffmpeg']],
}

let ffmpeg = firstExisting(path.join(BIN_DIR, isWin ? 'ffmpeg.exe' : 'ffmpeg')) || findOnPath('ffmpeg')

if (!ffmpeg && args.has('--with-ffmpeg') && FFMPEG_INSTALL[process.platform]) {
  const [command, commandArgs] = FFMPEG_INSTALL[process.platform]
  info(`a instalar o ffmpeg com \`${command} ${commandArgs.join(' ')}\`…`)
  await run(command, commandArgs)
  ffmpeg = findOnPath('ffmpeg')
  if (ffmpeg) info('Nota: pode ser preciso abrir um terminal novo para o PATH atualizar.')
}

if (ffmpeg) {
  ok(`ffmpeg — ${version(ffmpeg) || ffmpeg}`)
  steps.push(['ffmpeg', true, ''])
} else {
  fail('ffmpeg não encontrado — conversões de áudio e vídeo ficam indisponíveis')
  const hint = {
    win32: 'winget install Gyan.FFmpeg',
    darwin: 'brew install ffmpeg',
    linux: 'sudo apt install ffmpeg',
  }[process.platform]
  if (hint) info(`Instala com:  ${bold(hint)}`)
  info('Ou volta a correr este script com --with-ffmpeg.')
  steps.push(['ffmpeg', false, hint || 'instala o ffmpeg'])
}

const soffice =
  findOnPath('soffice') ||
  firstExisting(
    'C:/Program Files/LibreOffice/program/soffice.exe',
    'C:/Program Files (x86)/LibreOffice/program/soffice.exe',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
    '/usr/bin/soffice',
  )

if (soffice) ok('LibreOffice — documentos em alta fidelidade')
else info('LibreOffice não encontrado (opcional — melhora muito DOCX ↔ PDF)')

// ── Resumo ──────────────────────────────────────────────────────────────────

const blocking = steps.filter(([, present]) => !present)

console.log(`\n${bold('  Resumo')}`)
if (!blocking.length) {
  console.log(`  ${green('Tudo pronto.')}\n`)
  console.log(`  Arranca com:  ${bold('npm run dev')}`)
  console.log(`  Depois abre:  ${bold('http://localhost:5173')}\n`)
} else {
  console.log(`  ${yellow('Instalado, mas com componentes em falta:')}\n`)
  for (const [name, , hint] of blocking) console.log(`    · ${bold(name)} — ${hint}`)
  console.log(`\n  O site arranca na mesma; as funcionalidades afetadas dizem-te o que falta.`)
  console.log(`  Arranca com:  ${bold('npm run dev')}\n`)
}

console.log(dim('  Verifica o estado a qualquer momento com `npm run doctor`.\n'))
process.exit(0)

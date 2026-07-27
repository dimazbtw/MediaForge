import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import mammoth from 'mammoth'
import PDFDocument from 'pdfkit'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { binaries } from '../lib/binaries.js'
import { TranslatedError } from '../lib/i18n.js'
import { run } from '../lib/ffmpeg.js'
import { normalizeExt } from '../lib/formats.js'
import { makeWorkDir } from '../lib/storage.js'

const NEEDS_OFFICE = new Set(['rtf', 'odt'])

export async function convertDocument({ inputPath, outputPath, from, to, options = {}, signal, onProgress, setStage, t }) {
  const source = normalizeExt(from)
  const target = normalizeExt(to)
  const notes = []

  // Caminho de alta fidelidade: se o LibreOffice existir, é normalmente melhor
  // do que reconstruir o documento a partir de texto simples. O utilizador
  // pode forçar um dos motores através da opção «engine».
  const engine = options.engine || 'auto'
  const officeCapable =
    engine !== 'internal' &&
    binaries.soffice &&
    !(source === 'pdf' && target !== 'txt') && // o import de PDF do LO é fraco
    ['docx', 'odt', 'rtf', 'html', 'txt', 'md'].includes(source) &&
    ['pdf', 'docx', 'txt'].includes(target)

  if (engine === 'libreoffice' && !officeCapable) {
    throw new TranslatedError(binaries.soffice ? 'error.libreOfficeCannot' : 'error.libreOfficeUnavailable')
  }

  if (officeCapable) {
    setStage?.(t('stage.libreoffice'))
    onProgress?.(20)
    try {
      await libreOfficeConvert({ inputPath, outputPath, target, signal })
      onProgress?.(100)
      return {
        note: target === 'pdf' ? t('note.libreOfficeLayout') : null,
        details: { [t('detail.engine')]: 'LibreOffice' },
      }
    } catch (error) {
      if (engine === 'libreoffice') throw error
      notes.push(t('note.libreOfficeFailed', { reason: error.message }))
    }
  }

  if (NEEDS_OFFICE.has(source) && !binaries.soffice) {
    throw new TranslatedError('error.libreOfficeRequired', { format: source.toUpperCase() }, 503)
  }

  setStage?.(t('stage.extracting'))
  onProgress?.(20)
  const extracted = await extractText({ inputPath, source, signal })
  onProgress?.(55)

  if (!extracted.text.trim()) notes.push(t('note.noText'))

  setStage?.(t('stage.generating', { format: target.toUpperCase() }))
  switch (target) {
    case 'txt': {
      const text = options.lineEnding === 'crlf' ? extracted.text.replace(/\r?\n/g, '\r\n') : extracted.text
      await fsp.writeFile(outputPath, text, 'utf8')
      break
    }
    case 'pdf':
      await writePdf(outputPath, extracted, options)
      break
    case 'docx':
      await writeDocx(outputPath, extracted, options)
      break
    default:
      throw new TranslatedError('error.unsupportedPair', {
        from: source.toUpperCase(),
        to: target.toUpperCase(),
        targets: 'PDF, DOCX, TXT',
      })
  }

  onProgress?.(100)

  if (source === 'pdf' && target === 'docx') notes.push(t('note.pdfToDocx'))
  if (!binaries.soffice && (target === 'pdf' || source === 'docx')) notes.push(t('note.installLibreOffice'))

  return {
    note: notes.join(' ') || null,
    details: {
      [t('detail.engine')]: t('value.internal'),
      [t('detail.pages')]: extracted.pages ? String(extracted.pages) : null,
      [t('detail.characters')]: String(extracted.text.length),
      [t('detail.page')]:
        target === 'pdf'
          ? `${options.pageSize || 'A4'} ${options.orientation === 'landscape' ? t('value.landscape') : t('value.portrait')}`
          : null,
    },
  }
}

// ── Extração ────────────────────────────────────────────────────────────────

async function extractText({ inputPath, source, signal }) {
  switch (source) {
    case 'pdf':
      return extractFromPdf(inputPath)
    case 'docx':
      return extractFromDocx(inputPath)
    case 'html':
      return { text: htmlToText(await fsp.readFile(inputPath, 'utf8')), blocks: null, pages: null }
    case 'txt':
    case 'md': {
      const text = await fsp.readFile(inputPath, 'utf8')
      return { text, blocks: markdownBlocks(text), pages: null }
    }
    case 'rtf':
    case 'odt': {
      // Só chegamos aqui com o LibreOffice presente: converte para txt primeiro.
      const workDir = await makeWorkDir('doc')
      const intermediate = path.join(workDir, 'extraido.txt')
      await libreOfficeConvert({ inputPath, outputPath: intermediate, target: 'txt', signal })
      const text = await fsp.readFile(intermediate, 'utf8')
      await fsp.rm(workDir, { recursive: true, force: true })
      return { text, blocks: null, pages: null }
    }
    default:
      throw new Error(`Não sei ler ficheiros ${source.toUpperCase()}.`)
  }
}

async function extractFromPdf(inputPath) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const data = new Uint8Array(await fsp.readFile(inputPath))
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: true }).promise

  const pages = []
  const pageCount = doc.numPages
  for (let index = 1; index <= pageCount; index += 1) {
    const page = await doc.getPage(index)
    const content = await page.getTextContent()
    let line = ''
    const lines = []
    for (const item of content.items) {
      if (typeof item.str !== 'string') continue
      line += item.str
      if (item.hasEOL) {
        lines.push(line.trimEnd())
        line = ''
      }
    }
    if (line.trim()) lines.push(line.trimEnd())
    pages.push(lines.join('\n'))
    page.cleanup()
  }
  await doc.destroy()

  const text = pages.join('\n\n')
  return {
    text,
    pages: pageCount,
    blocks: text
      .split(/\n{2,}/)
      .map((chunk) => ({ type: 'p', text: chunk.replace(/\n/g, ' ').trim() }))
      .filter((block) => block.text),
  }
}

async function extractFromDocx(inputPath) {
  const { value: html } = await mammoth.convertToHtml({ path: inputPath })
  const blocks = []
  const pattern = /<(h[1-6]|p|li)[^>]*>([\s\S]*?)<\/\1>/gi
  let match
  while ((match = pattern.exec(html))) {
    const text = htmlToText(match[2]).trim()
    if (!text) continue
    const tag = match[1].toLowerCase()
    blocks.push({ type: tag === 'li' ? 'li' : tag === 'p' ? 'p' : tag, text })
  }
  const { value: raw } = await mammoth.extractRawText({ path: inputPath })
  return { text: raw, blocks: blocks.length ? blocks : null, pages: null }
}

function htmlToText(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function markdownBlocks(text) {
  return text
    .split(/\n{2,}/)
    .map((chunk) => {
      const trimmed = chunk.trim()
      if (!trimmed) return null
      const heading = /^(#{1,6})\s+(.*)$/s.exec(trimmed)
      if (heading) return { type: `h${heading[1].length}`, text: heading[2].replace(/\n/g, ' ').trim() }
      if (/^[-*+]\s+/.test(trimmed)) return { type: 'li', text: trimmed.replace(/^[-*+]\s+/gm, '').trim() }
      return { type: 'p', text: trimmed }
    })
    .filter(Boolean)
}

// ── Geração ─────────────────────────────────────────────────────────────────

/** Escalas de título relativas ao corpo, para o tamanho de letra escolhido. */
const HEADING_SCALE = { h1: 2, h2: 1.6, h3: 1.35, h4: 1.18, h5: 1.08, h6: 1 }
const MARGIN_PRESETS = { narrow: 36, normal: 64, wide: 96 }

function writePdf(outputPath, extracted, options) {
  return new Promise((resolve, reject) => {
    const margin = MARGIN_PRESETS[options.margin] ?? MARGIN_PRESETS.normal
    const bodySize = clampNumber(options.fontSize, 8, 16, 11)

    const doc = new PDFDocument({
      size: options.pageSize || 'A4',
      layout: options.orientation === 'landscape' ? 'landscape' : 'portrait',
      margins: { top: margin, bottom: margin, left: margin, right: margin },
      info: { Title: options.title || 'Documento', Producer: 'MediaForge' },
    })
    const stream = fs.createWriteStream(outputPath)
    stream.on('finish', resolve)
    stream.on('error', reject)
    doc.on('error', reject)
    doc.pipe(stream)

    const blocks = extracted.blocks?.length
      ? extracted.blocks
      : extracted.text.split(/\n{2,}/).map((chunk) => ({ type: 'p', text: chunk.trim() })).filter((b) => b.text)

    if (!blocks.length) {
      doc.font('Helvetica-Oblique').fontSize(11).fillColor('#666666').text('(documento sem texto extraível)')
    }

    const align = options.align === 'justify' ? 'justify' : 'left'

    for (const block of blocks) {
      if (block.type.startsWith('h')) {
        doc
          .font('Helvetica-Bold')
          .fontSize(Math.round(bodySize * (HEADING_SCALE[block.type] || 1.2)))
          .fillColor('#111111')
          .text(sanitizeForPdf(block.text), { paragraphGap: Math.round(bodySize * 0.7) })
      } else if (block.type === 'li') {
        doc
          .font('Helvetica')
          .fontSize(bodySize)
          .fillColor('#222222')
          .list([sanitizeForPdf(block.text)], { bulletRadius: 1.6, textIndent: 12, paragraphGap: 4 })
      } else {
        doc
          .font('Helvetica')
          .fontSize(bodySize)
          .fillColor('#222222')
          .text(sanitizeForPdf(block.text), { align, lineGap: 3, paragraphGap: Math.round(bodySize * 0.7) })
      }
    }

    doc.end()
  })
}

/** As fontes base do PDFKit usam WinAnsi: troca o que não cabe por equivalentes. */
function sanitizeForPdf(text) {
  return String(text)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, '')
}

async function writeDocx(outputPath, extracted, options) {
  const blocks = extracted.blocks?.length
    ? extracted.blocks
    : extracted.text.split(/\n{2,}/).map((chunk) => ({ type: 'p', text: chunk.trim() })).filter((b) => b.text)

  const headingLevels = {
    h1: HeadingLevel.HEADING_1,
    h2: HeadingLevel.HEADING_2,
    h3: HeadingLevel.HEADING_3,
    h4: HeadingLevel.HEADING_4,
    h5: HeadingLevel.HEADING_5,
    h6: HeadingLevel.HEADING_6,
  }

  const children = blocks.length
    ? blocks.map((block) =>
        block.type.startsWith('h')
          ? new Paragraph({ text: block.text, heading: headingLevels[block.type] })
          : new Paragraph({
              children: [new TextRun({ text: block.text, size: 22 })],
              bullet: block.type === 'li' ? { level: 0 } : undefined,
              spacing: { after: 160 },
            }),
      )
    : [new Paragraph({ children: [new TextRun({ text: '(documento sem texto extraível)', italics: true })] })]

  const doc = new Document({
    creator: 'MediaForge',
    title: options.title || 'Documento',
    sections: [{ properties: {}, children }],
  })
  const buffer = await Packer.toBuffer(doc)
  await fsp.writeFile(outputPath, buffer)
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, Math.round(number)))
}

// ── LibreOffice ─────────────────────────────────────────────────────────────

async function libreOfficeConvert({ inputPath, outputPath, target, signal }) {
  const bin = binaries.soffice
  if (!bin) throw new Error('LibreOffice não encontrado')

  const workDir = await makeWorkDir('soffice')
  const profile = path.join(workDir, 'profile')
  const filter = target === 'docx' ? 'docx:MS Word 2007 XML' : target === 'txt' ? 'txt:Text (encoded):UTF8' : target

  try {
    await run(
      bin,
      [
        `-env:UserInstallation=${pathToFileURL(profile).href}`,
        '--headless',
        '--norestore',
        '--convert-to',
        filter,
        '--outdir',
        workDir,
        inputPath,
      ],
      { signal, cwd: workDir },
    )

    const produced = (await fsp.readdir(workDir)).find((name) => name.toLowerCase().endsWith(`.${target}`))
    if (!produced) throw new Error('o LibreOffice não produziu ficheiro de saída')
    await fsp.copyFile(path.join(workDir, produced), outputPath)
  } finally {
    await fsp.rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}

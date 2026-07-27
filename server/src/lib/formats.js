/**
 * Registo central de formatos: alimenta o motor de conversão E a UI
 * (a matriz de formatos suportados é servida em GET /api/capabilities).
 */

export const CATEGORIES = {
  image: {
    id: 'image',
    label: 'Imagem',
    formats: ['jpg', 'png', 'webp', 'gif', 'svg', 'avif', 'tiff', 'bmp'],
    outputs: ['jpg', 'png', 'webp', 'gif', 'avif', 'tiff', 'svg'],
  },
  audio: {
    id: 'audio',
    label: 'Áudio',
    formats: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus', 'wma', 'aiff'],
    outputs: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus'],
  },
  video: {
    id: 'video',
    label: 'Vídeo',
    formats: ['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv', 'wmv', 'm4v', 'mpeg', 'mpg'],
    outputs: ['mp4', 'avi', 'mov', 'webm', 'mkv', 'gif', 'mp3', 'wav', 'aac'],
  },
  document: {
    id: 'document',
    label: 'Documento',
    formats: ['pdf', 'docx', 'txt', 'md', 'rtf', 'odt', 'html'],
    outputs: ['pdf', 'docx', 'txt'],
  },
  archive: {
    id: 'archive',
    label: 'Arquivo',
    formats: ['zip', 'rar', 'tar'],
    outputs: ['zip', 'tar'],
  },
}

/**
 * Formatos de compressão que qualquer ficheiro pode produzir.
 * (Não existe codificador RAR livre — o RAR é suportado apenas para leitura.)
 */
export const COMPRESSION_TARGETS = ['zip', 'tar']

const EXT_ALIASES = {
  jpeg: 'jpg',
  jpe: 'jpg',
  tif: 'tiff',
  htm: 'html',
  markdown: 'md',
  mpg: 'mpeg',
}

export function normalizeExt(ext) {
  const clean = String(ext || '').toLowerCase().replace(/^\./, '')
  return EXT_ALIASES[clean] || clean
}

export function categoryOf(ext) {
  const normalized = normalizeExt(ext)
  for (const category of Object.values(CATEGORIES)) {
    if (category.formats.includes(normalized)) return category.id
  }
  return null
}

/**
 * Formatos de destino válidos para uma extensão de entrada.
 * Qualquer ficheiro conhecido pode ainda ser comprimido para ZIP/TAR.
 */
export function targetsFor(ext) {
  const normalized = normalizeExt(ext)
  const category = categoryOf(normalized)
  if (!category) return [...COMPRESSION_TARGETS]

  const own = CATEGORIES[category].outputs
  // O GIF é uma imagem animada: faz sentido poder virar vídeo, tal como
  // um vídeo pode virar GIF.
  const extra = normalized === 'gif' ? ['mp4', 'webm'] : []
  const merged = category === 'archive' ? own : [...own, ...extra, ...COMPRESSION_TARGETS]
  return [...new Set(merged)].filter((target) => target !== normalized)
}

export const MIME_BY_EXT = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  tiff: 'image/tiff',
  bmp: 'image/bmp',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
  flac: 'audio/flac',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
  html: 'text/html; charset=utf-8',
  zip: 'application/zip',
  tar: 'application/x-tar',
  rar: 'application/vnd.rar',
}

export function mimeFor(ext) {
  return MIME_BY_EXT[normalizeExt(ext)] || 'application/octet-stream'
}

/** Extensões que o browser consegue pré-visualizar diretamente. */
export function previewKind(ext) {
  const normalized = normalizeExt(ext)
  if (['jpg', 'png', 'webp', 'gif', 'svg', 'avif', 'bmp'].includes(normalized)) return 'image'
  if (['mp3', 'wav', 'ogg', 'opus', 'flac', 'm4a', 'aac'].includes(normalized)) return 'audio'
  if (['mp4', 'webm', 'mov'].includes(normalized)) return 'video'
  if (['txt', 'md', 'html'].includes(normalized)) return 'text'
  if (normalized === 'pdf') return 'pdf'
  return 'none'
}

/** Estrutura enviada à UI para desenhar a matriz de formatos. */
export function formatMatrix() {
  return Object.values(CATEGORIES).map((category) => ({
    id: category.id,
    label: category.label,
    accepts: category.formats,
    produces: category.outputs,
  }))
}

export const ACCEPTED_EXTENSIONS = [
  ...new Set(Object.values(CATEGORIES).flatMap((category) => category.formats)),
].sort()

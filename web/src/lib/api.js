import { getLanguage } from '../i18n/index.jsx'

const BASE = '/api'

/**
 * O servidor produz texto (rótulos de opções, etapas, erros) e precisa de saber
 * em que idioma. Vai em cabeçalho próprio para não colidir com o Accept-Language
 * do browser, que reflete o sistema e não a escolha feita no site.
 */
const langHeaders = () => ({ 'X-MediaForge-Language': getLanguage() })

async function parse(response) {
  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  if (!response.ok) {
    const error = new Error(data?.error || `Pedido falhou (${response.status}).`)
    error.status = response.status
    throw error
  }
  return data
}

function post(path, body, { signal } = {}) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...langHeaders() },
    body: JSON.stringify(body),
    signal,
  }).then(parse)
}

function get(path, { signal } = {}) {
  return fetch(`${BASE}${path}`, { headers: langHeaders(), signal }).then(parse)
}

export const api = {
  capabilities: () => get('/capabilities'),
  health: () => get('/health'),

  convertOptions: (from, to) =>
    get(`/convert/options?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&lang=${getLanguage()}`),

  convert: ({ files, targets, options, onUploadProgress, signal }) =>
    new Promise((resolve, reject) => {
      const form = new FormData()
      for (const file of files) form.append('files', file, file.name)
      for (const target of targets) form.append('targets', target)
      if (options) form.append('options', JSON.stringify(options))

      // XHR (e não fetch) porque só ele reporta progresso de upload.
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${BASE}/convert`)
      xhr.setRequestHeader('X-MediaForge-Language', getLanguage())
      xhr.responseType = 'text'

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) onUploadProgress?.((event.loaded / event.total) * 100)
      })
      xhr.addEventListener('load', () => {
        let data = null
        try {
          data = JSON.parse(xhr.responseText)
        } catch {
          /* resposta não-JSON */
        }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data)
        else reject(new Error(data?.error || `Upload falhou (${xhr.status}).`))
      })
      xhr.addEventListener('error', () => reject(new Error('Falha de rede durante o upload.')))
      xhr.addEventListener('abort', () => reject(new DOMException('Cancelado', 'AbortError')))
      signal?.addEventListener('abort', () => xhr.abort(), { once: true })

      xhr.send(form)
    }),

  probeVideo: (url, options) => post('/video/probe', { url }, options),
  downloadVideo: (payload, options) => post('/video/download', payload, options),

  probeMusic: (url, options) => post('/music/probe', { url }, options),
  downloadMusic: (payload, options) => post('/music/download', payload, options),

  job: (id) => get(`/jobs/${id}`),
  jobs: (ids) => get(`/jobs${ids?.length ? `?ids=${ids.join(',')}` : ''}`),
  cancelJob: (id) => post(`/jobs/${id}/cancel`, {}),

  fileInfo: (fileId) => get(`/files/${fileId}/info`),
  fileUrl: (fileId) => `${BASE}/files/${fileId}`,
  previewUrl: (fileId) => `${BASE}/files/${fileId}/preview`,
}

/** Dispara o download no browser sem sair da página. */
export function triggerDownload(fileId, filename) {
  const link = document.createElement('a')
  link.href = api.fileUrl(fileId)
  link.download = filename || ''
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

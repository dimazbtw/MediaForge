import { config } from '../config.js'
import { TranslatedError, t } from '../lib/i18n.js'

/**
 * Cliente mínimo da Web API do Spotify (client credentials).
 *
 * Importante: a Web API só devolve METADADOS (nome, artista, capa, duração).
 * O Spotify não distribui os ficheiros de áudio por esta via — o MediaForge
 * usa os metadados para localizar a faixa em fontes públicas (YouTube), tal
 * como fazem as ferramentas open-source do género.
 */

let cachedToken = null

/** O tipo de recurso («álbuns»/«playlists») também tem de ser traduzido. */
class SpotifyKeysError extends TranslatedError {
  constructor(kindKey) {
    super('error.spotifyNeedsKeys', { kind: kindKey }, 503)
    this.kindKey = kindKey
  }

  localized(language) {
    return t(language, 'error.spotifyNeedsKeys', { kind: t(language, this.kindKey) })
  }
}

export function hasCredentials() {
  return Boolean(config.spotify.clientId && config.spotify.clientSecret)
}

async function getToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value

  const basic = Buffer.from(`${config.spotify.clientId}:${config.spotify.clientSecret}`).toString('base64')
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  if (!response.ok) {
    throw new Error(`Autenticação no Spotify falhou (${response.status}). Verifica SPOTIFY_CLIENT_ID/SECRET.`)
  }
  const data = await response.json()
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 }
  return cachedToken.value
}

async function api(endpoint) {
  const token = await getToken()
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (response.status === 404) throw new Error('Recurso não encontrado no Spotify (link inválido ou privado).')
  if (!response.ok) throw new Error(`A API do Spotify respondeu ${response.status}.`)
  return response.json()
}

/** Extrai { type, id } de um URL ou URI do Spotify. */
export function parseSpotifyUrl(input) {
  const text = String(input).trim()
  const uri = /^spotify:(track|album|playlist|artist):([A-Za-z0-9]+)$/.exec(text)
  if (uri) return { type: uri[1], id: uri[2] }

  try {
    const url = new URL(text)
    if (!/(^|\.)spotify\.com$/.test(url.hostname)) return null
    const parts = url.pathname.split('/').filter(Boolean)
    const typeIndex = parts.findIndex((part) => ['track', 'album', 'playlist', 'artist'].includes(part))
    if (typeIndex === -1 || !parts[typeIndex + 1]) return null
    return { type: parts[typeIndex], id: parts[typeIndex + 1].split('?')[0] }
  } catch {
    return null
  }
}

const shapeTrack = (track, fallbackCover = null) => ({
  sourceId: track.id,
  title: track.name,
  artist: (track.artists || []).map((artist) => artist.name).join(', ') || 'Desconhecido',
  album: track.album?.name || null,
  duration: Math.round((track.duration_ms || 0) / 1000),
  thumbnail: track.album?.images?.[0]?.url || fallbackCover,
  isrc: track.external_ids?.isrc || null,
  trackNumber: track.track_number || null,
  webpageUrl: track.external_urls?.spotify || null,
})

/** Resolve um link do Spotify para { kind, title, subtitle, cover, tracks[] }. */
export async function resolveSpotify(input) {
  const parsed = parseSpotifyUrl(input)
  if (!parsed) throw new TranslatedError('error.spotifyUnknownLink')

  if (!hasCredentials()) return resolveViaOEmbed(input, parsed)

  if (parsed.type === 'track') {
    const track = await api(`/tracks/${parsed.id}`)
    return {
      kind: 'track',
      provider: 'spotify',
      title: track.name,
      subtitle: (track.artists || []).map((artist) => artist.name).join(', '),
      cover: track.album?.images?.[0]?.url || null,
      totalTracks: 1,
      tracks: [shapeTrack(track)],
    }
  }

  if (parsed.type === 'album') {
    const album = await api(`/albums/${parsed.id}`)
    const cover = album.images?.[0]?.url || null
    const items = [...(album.tracks?.items || [])]
    let next = album.tracks?.next
    while (next && items.length < config.maxPlaylistItems) {
      const page = await api(next.replace('https://api.spotify.com/v1', ''))
      items.push(...(page.items || []))
      next = page.next
    }
    return {
      kind: 'album',
      provider: 'spotify',
      title: album.name,
      subtitle: (album.artists || []).map((artist) => artist.name).join(', '),
      cover,
      totalTracks: album.total_tracks || items.length,
      tracks: items.map((item) => shapeTrack({ ...item, album: { name: album.name, images: album.images } }, cover)),
    }
  }

  if (parsed.type === 'playlist') {
    const playlist = await api(`/playlists/${parsed.id}?fields=name,description,owner(display_name),images,tracks(total)`)
    const items = []
    let next = `/playlists/${parsed.id}/tracks?limit=100`
    while (next && items.length < config.maxPlaylistItems) {
      const page = await api(next.replace('https://api.spotify.com/v1', ''))
      items.push(...(page.items || []).map((item) => item.track).filter((track) => track && track.id))
      next = page.next
    }
    return {
      kind: 'playlist',
      provider: 'spotify',
      title: playlist.name,
      subtitle: playlist.owner?.display_name ? `por ${playlist.owner.display_name}` : '',
      cover: playlist.images?.[0]?.url || null,
      totalTracks: playlist.tracks?.total || items.length,
      tracks: items.map((track) => shapeTrack(track)),
    }
  }

  throw new TranslatedError('error.spotifyArtist')
}

/** Sem credenciais: o oEmbed público dá título e capa, mas não a lista de faixas. */
async function resolveViaOEmbed(input, parsed) {
  const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(input)}`)
  if (!response.ok) {
    throw new Error(
      'Sem credenciais do Spotify configuradas e o modo público falhou. Define SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET no .env.',
    )
  }
  const data = await response.json()
  const title = data.title || 'Faixa do Spotify'

  if (parsed.type !== 'track') {
    throw new SpotifyKeysError(parsed.type === 'album' ? 'kind.albums' : 'kind.playlists')
  }

  return {
    kind: 'track',
    provider: 'spotify',
    title,
    subtitle: '',
    cover: data.thumbnail_url || null,
    totalTracks: 1,
    degraded: true,
    tracks: [
      {
        sourceId: parsed.id,
        title,
        artist: '',
        album: null,
        duration: 0,
        thumbnail: data.thumbnail_url || null,
        webpageUrl: input,
      },
    ],
  }
}

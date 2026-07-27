import { Router } from 'express'
import { config } from '../config.js'
import { createJob, enqueue, serialize } from '../lib/jobs.js'
import { languageOf, translator, TranslatedError } from '../lib/i18n.js'
import { probeVideo, makeVideoRunner, normalizeVideoOptions, describeVideoChoice } from '../services/video.js'
import {
  probeMusic,
  makeMusicRunner,
  normalizeMusicOptions,
  qualityLabel,
  AUDIO_BITRATES,
  AUDIO_FORMATS,
} from '../services/music.js'

export const videoRouter = Router()
export const musicRouter = Router()

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

// ── Vídeo ───────────────────────────────────────────────────────────────────

videoRouter.post(
  '/probe',
  asyncHandler(async (req, res) => {
    const lang = languageOf(req)
    const url = String(req.body?.url || '').trim()
    if (!url) throw new TranslatedError('error.pasteVideoUrl')
    res.json(await probeVideo(url, { lang }))
  }),
)

videoRouter.post(
  '/download',
  asyncHandler(async (req, res) => {
    const lang = languageOf(req)
    const { url, options: raw, title, thumbnail, qualities } = req.body || {}
    if (!url) throw new TranslatedError('error.pasteVideoUrl')

    // As qualidades vêm da deteção feita no cliente; se faltarem, «best» serve.
    const options = normalizeVideoOptions(raw, {
      qualities: Array.isArray(qualities) ? qualities : [],
      containers: ['mp4', 'webm', 'mkv'],
    })

    const job = createJob({
      kind: 'video',
      lang,
      title: title || 'Video',
      subtitle: describeVideoChoice(options, lang),
      meta: { url, thumbnail: thumbnail || null, options },
    })

    enqueue(job, makeVideoRunner({ url, options }))
    res.status(202).json({ job: serialize(job) })
  }),
)

// ── Música ──────────────────────────────────────────────────────────────────

musicRouter.post(
  '/probe',
  asyncHandler(async (req, res) => {
    const lang = languageOf(req)
    const url = String(req.body?.url || '').trim()
    if (!url) throw new TranslatedError('error.pasteMusicUrl')
    const info = await probeMusic(url, { lang })
    res.json({ ...info, bitrates: AUDIO_BITRATES, formats: AUDIO_FORMATS, maxItems: config.maxPlaylistItems })
  }),
)

musicRouter.post(
  '/download',
  asyncHandler(async (req, res) => {
    const lang = languageOf(req)
    const t = translator(lang)
    const { url, options: raw, trackIds = null } = req.body || {}
    if (!url) throw new TranslatedError('error.pasteMusicUrl')

    const resolved = await probeMusic(url, { lang })
    const selected =
      Array.isArray(trackIds) && trackIds.length
        ? resolved.tracks.filter((track) => trackIds.includes(track.id))
        : resolved.tracks

    if (!selected.length) {
      throw new TranslatedError(
        Array.isArray(trackIds) && trackIds.length ? 'error.tracksChanged' : 'error.noTracksSelected',
      )
    }

    const options = normalizeMusicOptions(raw, { multipleTracks: resolved.tracks.length > 1 })

    const job = createJob({
      kind: 'music',
      lang,
      title: resolved.title,
      subtitle: `${selected.length} × ${options.format.toUpperCase()} ${qualityLabel(options.format, options.bitrate, t)}`,
      meta: {
        url,
        provider: resolved.provider,
        kind: resolved.kind,
        cover: resolved.cover,
        options,
      },
      tracks: selected.map((track) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        durationLabel: track.durationLabel,
        thumbnail: track.thumbnail,
        status: 'queued',
        stage: t('stage.queued'),
        progress: 0,
        fileId: null,
        filename: null,
        size: null,
        ext: null,
        error: null,
      })),
    })

    enqueue(job, makeMusicRunner({ resolved: { ...resolved, tracks: selected }, options }))
    res.status(202).json({ job: serialize(job) })
  }),
)

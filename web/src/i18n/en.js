export default {
  'lang.name': 'English',
  'lang.switchTo': 'Mudar para português',

  // ── Common ───────────────────────────────────────────────────────────────
  'common.download': 'Download',
  'common.downloadAll': 'Download all',
  'common.cancel': 'Cancel',
  'common.remove': 'Remove',
  'common.clear': 'Clear',
  'common.clearList': 'Clear list',
  'common.retry': 'Try again',
  'common.reset': 'Reset',
  'common.options': 'Options',
  'common.advanced': 'Advanced options',
  'common.detect': 'Detect',
  'common.hide': 'Hide',
  'common.preview': 'Preview',
  'common.loading': 'Loading…',
  'common.open': 'Open',
  'common.back': 'Back to the start',
  'common.tryNow': 'Try now',
  'common.readMore': 'Learn more',

  'status.queued': 'Queued',
  'status.processing': 'Processing',
  'status.done': 'Done',
  'status.error': 'Error',
  'status.canceled': 'Canceled',

  'kind.convert': 'Conversion',
  'kind.video': 'Video',
  'kind.music': 'Music',

  'time.now': 'just now',
  'time.minutes': '{count} min ago',
  'time.hours': '{count} h ago',
  'time.days': '{count} day(s) ago',

  // ── Navigation ───────────────────────────────────────────────────────────
  'nav.converter': 'Converter',
  'nav.video': 'Video',
  'nav.music': 'Music',
  'nav.history': 'History',
  'nav.faq': 'FAQ',
  'nav.themeLight': 'Switch to light theme',
  'nav.themeDark': 'Switch to dark theme',
  'nav.active': '{count} active',

  'tool.converter.blurb': 'Documents, images, audio, video and ZIP',
  'tool.video.blurb': 'YouTube and other sources, up to 4K',
  'tool.music.blurb': 'Spotify, SoundCloud and YouTube',

  // ── Connection ───────────────────────────────────────────────────────────
  'offline.title': 'No connection to the server.',
  'offline.body':
    'The MediaForge API is not responding — start it with {command} in the project root. Retrying automatically…',
  'offline.converter':
    'Without the format list from the server there is no way to know what to convert into. This page will be ready on its own as soon as the API responds.',
  'offline.loadingFormats': 'Fetching the list of supported formats…',
  'status.connected': 'Connected to the server',
  'status.connecting': 'Connecting…',
  'status.unreachable': 'Server unreachable',

  // ── Home ─────────────────────────────────────────────────────────────────
  'home.badge': 'converter + downloader',
  'home.title1': 'Convert any',
  'home.title2': 'file',
  'home.lead':
    'Drop a file and pick what to turn it into. Or paste a link and pull down the video or the music. All processed on your own server.',
  'home.dropTitle': 'Drop your file here',
  'home.dropSub': 'or pick one from your computer',
  'home.dropCta': 'Select file',
  'home.dropHint': 'documents · images · audio · video · archives',
  'home.linkTitle': 'Or paste a link',
  'home.linkSub': 'video or music, detected automatically',
  'home.linkPlaceholder': 'https://youtube.com/watch?v=… or open.spotify.com/…',
  'home.linkCta': 'Fetch',
  'home.linkHint': 'YouTube · Spotify · SoundCloud · and hundreds more',
  'home.or': 'or',
  'home.stat.perFile': 'per file',
  'home.stat.video': 'max video',
  'home.stat.audio': 'max audio',
  'home.stat.cleanup': 'until auto-cleanup',
  'home.steps.title': 'Three steps, no manual',
  'home.step1.title': 'Drop or paste',
  'home.step1.text': 'Drag a file onto the bench, or paste the link to a video or track.',
  'home.step2.title': 'Pick the format',
  'home.step2.text': 'Only targets that make sense for what you loaded are offered.',
  'home.step3.title': 'Get the result',
  'home.step3.text': 'Real progress, before-and-after preview, and an automatic download.',
  'home.tools.title': 'Pick a tool',
  'home.tools.aside': 'direct access',
  'home.needsSetup': 'needs setup',
  'home.assure1.title': 'Processed on your server',
  'home.assure1.text':
    'ffmpeg, sharp and yt-dlp run on the machine hosting MediaForge. Nothing is sent to third-party services.',
  'home.assure2.title': 'Automatic cleanup',
  'home.assure2.text':
    'Uploads and results are deleted after {hours} hours. No file is kept indefinitely.',
  'home.assure3.title': 'Responsible use',
  'home.assure3.text':
    'Only download content you can legally use. Responsibility for copyright rests with whoever downloads.',
  'home.assure3.link': 'Read the legal notice',

  // ── Converter ────────────────────────────────────────────────────────────
  'converter.title': 'File converter',
  'converter.lead': 'Drop the files, tune whatever you want, and get the result. Every file has its own options.',
  'converter.maxSize': 'max {size} MB',
  'converter.ffmpegMissing':
    'ffmpeg was not found on the server. Audio and video conversions are unavailable — images, documents and compression still work.',
  'converter.ready': '{count} file(s) ready',
  'converter.convert': 'Convert {count} file(s)',
  'converter.unsupported': 'unsupported format',
  'converter.waitingServer': 'waiting for the server',
  'converter.willIgnore': '{count} file(s) with no possible target will be skipped.',
  'converter.uploading': 'Uploading…',
  'converter.applyToOthers': 'Apply to the other {count}',
  'converter.changed': '{count} option(s) changed',
  'converter.loadingOptions': 'Loading the options…',
  'converter.jobs': 'Jobs',
  'converter.emptyTitle': 'The bench is empty',
  'converter.emptyBody':
    'Drag files onto the area above. Each one brings its own options — quality, dimensions, trimming, page size, compression level — depending on what makes sense for the target format.',
  'converter.noOptions': 'This conversion has no options — the recommended settings are applied automatically.',

  'dropzone.title': 'Drag files here',
  'dropzone.drop': 'Drop it here',
  'dropzone.or': 'or',
  'dropzone.browse': 'pick from your computer',
  'dropzone.limits': 'up to {files} files · max {size} MB each',
  'dropzone.tooBig': '{count} file(s) over the {size} MB limit were skipped.',
  'dropzone.tooMany': 'Maximum of {count} files at a time.',

  // ── Video ────────────────────────────────────────────────────────────────
  'video.title': 'Video downloader',
  'video.lead':
    'Paste the link, confirm it is the right video, and tune whatever you want — resolution, codec, subtitles or just an excerpt.',
  'video.badge': 'up to 4K',
  'video.urlLabel': 'Video address',
  'video.sources': 'YouTube, Vimeo, Twitter/X, Twitch, Dailymotion and hundreds of other sites supported by yt-dlp.',
  'video.probing': 'Reading the video metadata…',
  'video.live': 'LIVE',
  'video.hasSubs': 'subtitles available',
  'video.downloads': 'Downloads',
  'video.extractAudio': 'Extract {format} audio',
  'video.downloadAs': 'Download {format}',
  'video.emptyTitle': 'Paste a link to get started',
  'video.emptyBody':
    'The video is detected automatically — you see the thumbnail, title and duration before deciding. The available options depend on what the video actually offers.',
  'video.legal':
    'Make sure you have the right to download this content. Downloading protected works without permission may breach copyright law and the source platform’s terms of service.',

  // ── Music ────────────────────────────────────────────────────────────────
  'music.title': 'Music downloader',
  'music.lead':
    'Tracks, albums and playlists from Spotify, SoundCloud, YouTube Music and Bandcamp — with per-track progress.',
  'music.badge': 'up to 320 kbps',
  'music.urlLabel': 'Track, album or playlist address',
  'music.maxTracks': 'Maximum of {count} tracks per list.',
  'music.probing': 'Resolving the collection…',
  'music.track': 'Track',
  'music.album': 'Album',
  'music.playlist': 'Playlist',
  'music.trackCount': '{shown} of {total} track(s)',
  'music.truncated': 'capped at {limit}',
  'music.selectAll': 'Select all',
  'music.deselectAll': 'Deselect all',
  'music.selected': '{count} selected',
  'music.downloadTracks': 'Download {count} track(s)',
  'music.emptyTitle': 'Paste a music link',
  'music.emptyBody':
    'Track, album or playlist. You see the cover, name and duration before downloading, and you can pick exactly which tracks you want.',
  'music.legal':
    'The vast majority of music on streaming platforms is protected by copyright. Use this tool only for your own content, freely licensed material, or with the rights holder’s permission.',

  // ── History ──────────────────────────────────────────────────────────────
  'history.title': 'History',
  'history.lead':
    'Everything you processed in this browser. The list is stored locally — the files themselves disappear from the server after {hours} hours.',
  'history.clear': 'Clear history',
  'history.all': 'Everything ({count})',
  'history.conversions': 'Conversions',
  'history.expired': 'expired',
  'history.emptyTitle': 'Nothing processed yet',
  'history.emptyBody': 'As soon as you convert a file or download a video, it shows up here.',
  'history.emptyFilterTitle': 'Nothing in this category',
  'history.emptyFilterBody': 'Change the filter to see the other jobs.',
  'history.openConverter': 'Open the converter',
  'history.note':
    'The history lives only in this browser (localStorage) and is never sent anywhere. If a download fails as “expired”, the file was already removed from the server by the automatic cleanup — just process it again.',
  'history.tracks': '{count} tracks',

  // ── FAQ ──────────────────────────────────────────────────────────────────
  'faq.title': 'FAQ & About',
  'faq.lead': 'Limits, supported formats, how it works under the hood and — importantly — your legal responsibilities.',
  'faq.legal.title': 'Legal notice and copyright',
  'faq.legal.p1':
    'MediaForge is a neutral technical tool. It converts files and fetches content from addresses the user provides. It does not host, index or distribute any protected work.',
  'faq.legal.p2':
    'Responsibility rests entirely with whoever uses the tool. By downloading or converting content, you declare that you have the legal right to do so.',
  'faq.legal.okTitle': 'Legitimate uses',
  'faq.legal.ok1': 'Content you created or own the rights to',
  'faq.legal.ok2': 'Works in the public domain',
  'faq.legal.ok3': 'Freely licensed material (Creative Commons and similar)',
  'faq.legal.ok4': 'Content with explicit permission from the rights holder',
  'faq.legal.ok5': 'Private copying, within the terms and limits of your country’s law',
  'faq.legal.noTitle': 'Uses you should avoid',
  'faq.legal.no1': 'Downloading protected works without permission',
  'faq.legal.no2': 'Redistributing or reselling what you downloaded',
  'faq.legal.no3': 'Circumventing technical protection measures (DRM)',
  'faq.legal.no4': 'Using third-party content commercially without a licence',
  'faq.legal.tos':
    'Downloading content may also breach the source platform’s terms of service, even when it does not breach copyright law — these are distinct, and both count. When in doubt, check the law that applies in your country.',
  'faq.legal.warranty':
    'The software is provided “as is”, without warranty. The authors accept no responsibility for misuse or for damages arising from its use.',

  'faq.status.title': 'Status of this installation',
  'faq.status.ffmpeg': 'Audio and video conversion',
  'faq.status.ytdlp': 'Video and music downloads',
  'faq.status.libreoffice': 'High-fidelity DOCX ↔ PDF',
  'faq.status.spotify': 'Spotify albums and playlists',
  'faq.status.active': 'active',
  'faq.status.missing': 'missing',
  'faq.status.optional': 'optional',
  'faq.status.checking': 'checking',
  'faq.status.warning':
    'At least one required component is missing. See README.md or run {command} in the project root.',

  'faq.questions': 'Frequently asked questions',
  'faq.q1': 'Which formats are supported?',
  'faq.a1':
    'The full matrix is generated by the server — the converter only shows targets it can actually produce for the file you loaded.',
  'faq.accepts': 'Accepts:',
  'faq.produces': 'Produces:',
  'faq.compressAny': 'On top of that, any file can be compressed to {targets}.',
  'faq.q2': 'Why can’t I create RAR files?',
  'faq.a2':
    'RAR is a proprietary format with no free encoder. MediaForge reads RAR files (extracts the contents and repacks them as ZIP or TAR), but cannot create them. To compress, use ZIP — it is open, universal and opens on any system without extra software.',
  'faq.q3': 'What are the usage limits?',
  'faq.limit.size': 'Size per file',
  'faq.limit.batch': 'Files per batch',
  'faq.limit.tracks': 'Tracks per playlist or album',
  'faq.limit.parallel': 'Jobs in parallel',
  'faq.limit.ttl': 'Time until auto-cleanup',
  'faq.limit.note': 'Since MediaForge is self-hosted, all of these are adjustable in the .env file.',
  'faq.q4': 'Where do my files go?',
  'faq.a4':
    'Into a temporary folder on the server hosting MediaForge. There is no database, no accounts, and nothing is sent to third-party services — conversion runs locally with ffmpeg, sharp and LibreOffice. Uploads and results are deleted automatically after {hours} hours by a periodic sweeper. The history you see in the app lives only in your browser.',
  'faq.q5': 'How does the Spotify download work?',
  'faq.a5a':
    'Spotify does not distribute audio files through its API. What MediaForge does is use the official API to get metadata — track name, artist, album, cover and duration — and then locate that track on public sources (YouTube) by matching artist and title, just like the open-source tools of this kind.',
  'faq.a5b':
    'Practical consequence: matching is good but not perfect, especially for remixes, live versions and tracks with ambiguous titles. Always check the result. Without SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET configured, albums and playlists do not work.',
  'faq.q6': 'Why did a conversion fail?',
  'faq.a6.1': 'The file is corrupt, password-protected or has DRM.',
  'faq.a6.2': 'It is a scanned PDF (images only) — extracting text would need OCR, which is not included.',
  'faq.a6.3': 'The video is too long and exceeded the job time limit.',
  'faq.a6.4': 'A binary is missing on the server (ffmpeg, yt-dlp or LibreOffice). Run npm run doctor to check.',
  'faq.a6.5': 'The link is private, was removed, or requires signing in.',
  'faq.q7': 'Is quality lost in conversion?',
  'faq.a7':
    'It depends. Converting between lossy formats (MP3 → AAC, JPG → WEBP) always means re-encoding and some degradation — that is unavoidable. Converting to lossless formats (FLAC, WAV, PNG) preserves exactly what is there, but does not recover quality that was already lost. For video, choose “High” in the options if you prefer larger files that stay closer to the original.',
  'faq.cta': 'Ready to start? {converter} or {link}.',
  'faq.cta.converter': 'Open the converter',
  'faq.cta.link': 'paste a link',

  // ── 404 ──────────────────────────────────────────────────────────────────
  'notfound.title': 'This page does not exist',
  'notfound.body': 'The address you followed does not match anything in MediaForge. Maybe one of these helps:',

  // ── Footer ───────────────────────────────────────────────────────────────
  'footer.about':
    'File conversion and media downloading on a single workbench. Files are processed on your own server and deleted automatically after {hours} hours.',
  'footer.tools': 'Tools',
  'footer.status': 'Status',
  'footer.limits': 'Limits and formats',
  'footer.history': 'Session history',
  'footer.legalTitle': 'Legal notice',
  'footer.legal':
    'MediaForge is a technical tool. Responsibility for downloaded or converted content rests entirely with the user. Only download material you own the rights to, that is in the public domain, freely licensed, or for which you have explicit permission. Downloading copyrighted works without permission may breach the law and the source platforms’ terms of service. By using this site you declare that you comply with the applicable law.',
  'footer.readMore': 'Read more in the FAQ',
  'footer.tagline': 'MediaForge · self-hosted · no accounts, no tracking',

  // ── Job card ─────────────────────────────────────────────────────────────
  'job.before': 'Before',
  'job.after': 'After',
  'job.noPreview': '(no preview)',
  'preview.noText': '(document has no text)',
}

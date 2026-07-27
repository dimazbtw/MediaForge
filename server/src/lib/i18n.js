/**
 * Traduções do lado do servidor.
 *
 * Nem tudo o que o utilizador lê nasce no frontend: os rótulos das opções, as
 * etapas dos trabalhos e as mensagens de erro são produzidos aqui. Cada job
 * guarda o idioma com que foi criado, para que o texto que emite mais tarde
 * (já sem pedido HTTP associado) continue no idioma certo.
 */

export const LANGUAGES = ['pt', 'en']
export const DEFAULT_LANGUAGE = 'pt'

const pt = {
  // ── Etapas dos trabalhos ────────────────────────────────────────────────
  'stage.queued': 'Na fila',
  'stage.queuedAt': 'Na fila (posição {position})',
  'stage.starting': 'A começar…',
  'stage.processing': 'A processar…',
  'stage.done': 'Concluído',
  'stage.failed': 'Falhou',
  'stage.canceled': 'Cancelado',
  'stage.reading': 'A ler a imagem…',
  'stage.analysing': 'A analisar o ficheiro…',
  'stage.encoding': 'A codificar para {format}…',
  'stage.converting': 'A converter para {format}…',
  'stage.tracing': 'A preparar o traçado vetorial…',
  'stage.vectorising': 'A vetorizar (potrace)…',
  'stage.extracting': 'A extrair o conteúdo…',
  'stage.generating': 'A gerar o {format}…',
  'stage.libreoffice': 'A converter com o LibreOffice…',
  'stage.compressing': 'A comprimir para {format}…',
  'stage.unpacking': 'A extrair o arquivo…',
  'stage.repacking': 'A reempacotar em {format}…',
  'stage.negotiating': 'A negociar com o servidor…',
  'stage.downloading': 'A descarregar…',
  'stage.merging': 'A juntar vídeo e áudio…',
  'stage.extractingAudio': 'A extrair o áudio…',
  'stage.writingMetadata': 'A escrever metadados…',
  'stage.preparing': 'A preparar o ficheiro…',
  'stage.searching': 'A procurar…',
  'stage.trackProgress': '{done}/{total} faixas concluídas',
  'stage.trackOf': 'Faixa {index}/{total}: {title}',
  'stage.trackDone': 'Concluída',
  'stage.zipping': 'A criar o ZIP do lote…',

  // ── Detalhes mostrados nos cartões ──────────────────────────────────────
  'detail.source': 'origem',
  'detail.output': 'saída',
  'detail.quality': 'qualidade',
  'detail.duration': 'duração',
  'detail.bitrate': 'bitrate',
  'detail.format': 'formato',
  'detail.engine': 'motor',
  'detail.pages': 'páginas',
  'detail.characters': 'caracteres',
  'detail.page': 'página',
  'detail.entries': 'entradas',
  'detail.compression': 'compressão',
  'detail.reduction': 'redução',
  'detail.dimensions': 'dimensões',
  'detail.metadata': 'metadados',
  'detail.palette': 'paleta',
  'detail.levels': 'níveis',
  'detail.trace': 'traçado',
  'detail.mode': 'modo',
  'detail.channels': 'canais',
  'detail.sampleRate': 'amostragem',
  'detail.volume': 'volume',
  'detail.trim': 'recorte',
  'detail.resolution': 'resolução',
  'detail.fps': 'fps',
  'detail.audio': 'áudio',
  'detail.codec': 'codec',
  'detail.subtitles': 'legendas',
  'detail.width': 'largura',
  'detail.loop': 'ciclo',
  'detail.tracks': 'faixas',

  'value.preserved': 'preservados',
  'value.removed': 'removido',
  'value.stereo': 'estéreo',
  'value.mono': 'mono',
  'value.normalised': 'normalizado',
  'value.lossless': 'sem perdas',
  'value.original': 'original',
  'value.best': 'melhor disponível',
  'value.noLoop': 'sem repetição',
  'value.colour': 'a cores',
  'value.monochrome': 'monocromático',
  'value.internal': 'interno',
  'value.none': 'nenhuma',
  'value.fastest': 'rápida',
  'value.normal': 'normal',
  'value.maximum': 'máxima',
  'value.noneTar': 'nenhuma (TAR)',
  'value.from': 'a partir de {time}',
  'value.end': 'fim',
  'value.portrait': 'retrato',
  'value.landscape': 'paisagem',
  'value.fitIn': 'caber em {size}',
  'value.fill': 'preencher {size}',
  'value.upTo': '≤ {value}',

  // ── Notas ───────────────────────────────────────────────────────────────
  'note.animatedLost':
    'A origem era animada ({from}); {to} não guarda animação, foi exportado o primeiro fotograma.',
  'note.vectorised':
    'A vetorização é um traçado automático (potrace): formas planas ficam excelentes, fotografias ficam estilizadas.',
  'note.gifTrimmed':
    'O GIF foi limitado aos primeiros 30 segundos — usa a opção «Permitir mais de 30 segundos» para o ficheiro inteiro.',
  'note.vp9Slow': 'VP9 no modo lento pode demorar bastante, mas produz o ficheiro mais pequeno.',
  'note.normalising': 'A normalização analisa o áudio completo, por isso é mais lenta do que um ganho fixo.',
  'note.pdfToDocx':
    'PDF → DOCX recupera o texto e a estrutura de parágrafos, mas não o layout original (colunas, imagens, tabelas).',
  'note.installLibreOffice': 'Com o LibreOffice instalado esta conversão preserva muito mais formatação.',
  'note.libreOfficeLayout':
    'Com o LibreOffice o esquema original manda — as opções de página e texto só se aplicam ao motor interno.',
  'note.libreOfficeFailed': 'O LibreOffice falhou ({reason}); usei o motor interno.',
  'note.noText': 'Não foi encontrado texto extraível — o documento pode ser só imagens (precisaria de OCR).',
  'note.rarRepacked': 'O RAR foi extraído e reempacotado — o conteúdo é idêntico, o contentor é que muda.',
  'note.subtitlesMayMiss': 'Se o vídeo não tiver legendas no idioma escolhido, o download continua sem elas.',
  'note.trimProgress': 'Com recorte ativo o progresso pode saltar — o yt-dlp só conhece o tamanho total no fim.',
  'note.tracksFailed': '{count} faixa(s) falharam e ficaram de fora.',
  'note.spotifySourcing':
    'Os metadados vêm da API oficial do Spotify; o áudio é localizado em fontes públicas (YouTube) por correspondência de artista e título.',

  // ── Erros ───────────────────────────────────────────────────────────────
  'error.invalidUrl': 'URL inválida.',
  'error.httpOnly': 'Só são aceites endereços http(s).',
  'error.privateAddress': 'Endereços locais ou privados não são permitidos.',
  'error.notFound':
    'Não foi encontrado nada neste endereço. Confirma o link — pode ter sido removido ou estar mal copiado.',
  'error.private': 'Este conteúdo é privado ou exclusivo de subscritores, por isso não pode ser acedido.',
  'error.loginRequired':
    'Este conteúdo exige início de sessão (por idade ou restrição da plataforma) e não pode ser obtido sem credenciais.',
  'error.unsupportedSite': 'Este site não é suportado, ou a página não contém multimédia que se consiga extrair.',
  'error.gone': 'O conteúdo já não está disponível na origem.',
  'error.geoBlocked': 'Este conteúdo está bloqueado na região deste servidor.',
  'error.network': 'A ligação à origem falhou. Tenta de novo daqui a pouco.',
  'error.rateLimited':
    'A origem recusou o pedido (normalmente limitação temporária de tráfego). Tenta de novo daqui a pouco.',
  'error.generic': 'Não foi possível processar este endereço.',
  'error.noFiles': 'Nenhum ficheiro recebido.',
  'error.noTarget': 'Formato de destino em falta.',
  'error.sameFormat': 'O ficheiro já está nesse formato.',
  'error.unsupportedPair':
    'Conversão {from} → {to} não suportada. Destinos possíveis: {targets}.',
  'error.emptyOutput': 'A conversão produziu um ficheiro vazio.',
  'error.fileTooLarge': 'Ficheiro demasiado grande (máximo {max} MB).',
  'error.uploadFailed': 'Falha no upload: {reason}.',
  'error.pasteVideoUrl': 'Cola um endereço de vídeo.',
  'error.pasteMusicUrl': 'Cola um endereço de faixa, álbum ou playlist.',
  'error.noTracksSelected': 'Nenhuma faixa selecionada.',
  'error.tracksChanged':
    'As faixas selecionadas já não constam deste endereço — o conteúdo pode ter mudado. Volta a carregar em «Detetar».',
  'error.noTrackDownloaded': 'Nenhuma faixa pôde ser descarregada.',
  'error.jobNotFound': 'Trabalho não encontrado (pode já ter expirado).',
  'error.fileGone': 'Ficheiro indisponível — expirou ou já foi limpo do servidor.',
  'error.endpointNotFound': 'Endpoint não encontrado.',
  'error.internal': 'Erro interno.',
  'error.noVideoFound': 'Não foi encontrado nenhum vídeo neste endereço.',
  'error.rarNotSupported':
    'Não é possível criar ficheiros RAR: o formato é proprietário e não tem codificador livre. Usa ZIP ou TAR.',
  'error.libreOfficeRequired':
    'Converter {format} exige o LibreOffice instalado. Instala-o e reinicia o servidor, ou define SOFFICE_PATH no .env.',
  'error.libreOfficeUnavailable':
    'O LibreOffice não está instalado neste servidor. Escolhe o motor «Automático» ou «Interno».',
  'error.libreOfficeCannot':
    'O LibreOffice não consegue fazer esta conversão em particular. Escolhe o motor «Automático» ou «Interno».',
  'error.missingBinary': 'Binário «{name}» não encontrado. {hint}',
  'error.spotifyUnknownLink': 'Link do Spotify não reconhecido.',
  'error.spotifyArtist': 'Links de artista não são suportados — usa um álbum, playlist ou faixa.',
  'error.spotifyNeedsKeys':
    'Para descarregar {kind} do Spotify é preciso configurar SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET no .env (a lista de faixas só vem da API oficial).',
  'error.timeout': 'O trabalho excedeu o tempo limite.',
  'error.canceledByUser': 'Cancelado pelo utilizador',
  'error.canceled': 'Cancelado.',
  'kind.albums': 'álbuns',
  'kind.playlists': 'playlists',

  'hint.ffmpeg': 'Instala o ffmpeg e garante que está no PATH (ou define FFMPEG_PATH no .env).',
  'hint.ffprobe': 'O ffprobe acompanha o ffmpeg. Verifica a instalação ou define FFPROBE_PATH.',
  'hint.ytdlp': 'Corre `npm run setup:ytdlp` na raiz do projeto, ou define YTDLP_PATH no .env.',
  'hint.soffice': 'Instala o LibreOffice para conversões de documentos de alta fidelidade.',
}

const en = {
  'stage.queued': 'Queued',
  'stage.queuedAt': 'Queued (position {position})',
  'stage.starting': 'Starting…',
  'stage.processing': 'Processing…',
  'stage.done': 'Done',
  'stage.failed': 'Failed',
  'stage.canceled': 'Canceled',
  'stage.reading': 'Reading the image…',
  'stage.analysing': 'Analysing the file…',
  'stage.encoding': 'Encoding to {format}…',
  'stage.converting': 'Converting to {format}…',
  'stage.tracing': 'Preparing the vector trace…',
  'stage.vectorising': 'Vectorising (potrace)…',
  'stage.extracting': 'Extracting the content…',
  'stage.generating': 'Generating the {format}…',
  'stage.libreoffice': 'Converting with LibreOffice…',
  'stage.compressing': 'Compressing to {format}…',
  'stage.unpacking': 'Extracting the archive…',
  'stage.repacking': 'Repacking as {format}…',
  'stage.negotiating': 'Contacting the server…',
  'stage.downloading': 'Downloading…',
  'stage.merging': 'Merging video and audio…',
  'stage.extractingAudio': 'Extracting the audio…',
  'stage.writingMetadata': 'Writing metadata…',
  'stage.preparing': 'Preparing the file…',
  'stage.searching': 'Searching…',
  'stage.trackProgress': '{done}/{total} tracks done',
  'stage.trackOf': 'Track {index}/{total}: {title}',
  'stage.trackDone': 'Done',
  'stage.zipping': 'Creating the batch ZIP…',

  'detail.source': 'source',
  'detail.output': 'output',
  'detail.quality': 'quality',
  'detail.duration': 'duration',
  'detail.bitrate': 'bitrate',
  'detail.format': 'format',
  'detail.engine': 'engine',
  'detail.pages': 'pages',
  'detail.characters': 'characters',
  'detail.page': 'page',
  'detail.entries': 'entries',
  'detail.compression': 'compression',
  'detail.reduction': 'reduction',
  'detail.dimensions': 'dimensions',
  'detail.metadata': 'metadata',
  'detail.palette': 'palette',
  'detail.levels': 'levels',
  'detail.trace': 'trace',
  'detail.mode': 'mode',
  'detail.channels': 'channels',
  'detail.sampleRate': 'sample rate',
  'detail.volume': 'volume',
  'detail.trim': 'trim',
  'detail.resolution': 'resolution',
  'detail.fps': 'fps',
  'detail.audio': 'audio',
  'detail.codec': 'codec',
  'detail.subtitles': 'subtitles',
  'detail.width': 'width',
  'detail.loop': 'loop',
  'detail.tracks': 'tracks',

  'value.preserved': 'kept',
  'value.removed': 'removed',
  'value.stereo': 'stereo',
  'value.mono': 'mono',
  'value.normalised': 'normalised',
  'value.lossless': 'lossless',
  'value.original': 'original',
  'value.best': 'best available',
  'value.noLoop': 'no loop',
  'value.colour': 'colour',
  'value.monochrome': 'monochrome',
  'value.internal': 'internal',
  'value.none': 'none',
  'value.fastest': 'fastest',
  'value.normal': 'normal',
  'value.maximum': 'maximum',
  'value.noneTar': 'none (TAR)',
  'value.from': 'from {time}',
  'value.end': 'end',
  'value.portrait': 'portrait',
  'value.landscape': 'landscape',
  'value.fitIn': 'fit within {size}',
  'value.fill': 'fill {size}',
  'value.upTo': '≤ {value}',

  'note.animatedLost': 'The source was animated ({from}); {to} cannot store animation, so the first frame was exported.',
  'note.vectorised':
    'Vectorising is an automatic trace (potrace): flat shapes come out great, photographs come out stylised.',
  'note.gifTrimmed':
    'The GIF was capped at the first 30 seconds — use the “Allow over 30 seconds” option for the whole file.',
  'note.vp9Slow': 'VP9 on the slow preset can take a while, but produces the smallest file.',
  'note.normalising': 'Normalising analyses the whole audio, so it is slower than a fixed gain.',
  'note.pdfToDocx':
    'PDF → DOCX recovers the text and paragraph structure, but not the original layout (columns, images, tables).',
  'note.installLibreOffice': 'With LibreOffice installed this conversion preserves far more formatting.',
  'note.libreOfficeLayout':
    'With LibreOffice the original layout wins — the page and text options only apply to the internal engine.',
  'note.libreOfficeFailed': 'LibreOffice failed ({reason}); the internal engine was used instead.',
  'note.noText': 'No extractable text was found — the document may be images only (that would need OCR).',
  'note.rarRepacked': 'The RAR was extracted and repacked — the contents are identical, only the container changes.',
  'note.subtitlesMayMiss': 'If the video has no subtitles in the chosen language, the download continues without them.',
  'note.trimProgress': 'With trimming on, progress may jump — yt-dlp only knows the total size at the end.',
  'note.tracksFailed': '{count} track(s) failed and were left out.',
  'note.spotifySourcing':
    'Metadata comes from the official Spotify API; the audio is located on public sources (YouTube) by matching artist and title.',

  'error.invalidUrl': 'Invalid URL.',
  'error.httpOnly': 'Only http(s) addresses are accepted.',
  'error.privateAddress': 'Local or private addresses are not allowed.',
  'error.notFound': 'Nothing was found at this address. Check the link — it may have been removed or mistyped.',
  'error.private': 'This content is private or subscriber-only, so it cannot be accessed.',
  'error.loginRequired':
    'This content requires signing in (age or platform restriction) and cannot be fetched without credentials.',
  'error.unsupportedSite': 'This site is not supported, or the page contains no extractable media.',
  'error.gone': 'The content is no longer available at the source.',
  'error.geoBlocked': 'This content is blocked in this server’s region.',
  'error.network': 'The connection to the source failed. Try again shortly.',
  'error.rateLimited': 'The source refused the request (usually temporary rate limiting). Try again shortly.',
  'error.generic': 'This address could not be processed.',
  'error.noFiles': 'No file received.',
  'error.noTarget': 'Target format missing.',
  'error.sameFormat': 'The file is already in that format.',
  'error.unsupportedPair': '{from} → {to} conversion is not supported. Possible targets: {targets}.',
  'error.emptyOutput': 'The conversion produced an empty file.',
  'error.fileTooLarge': 'File too large (maximum {max} MB).',
  'error.uploadFailed': 'Upload failed: {reason}.',
  'error.pasteVideoUrl': 'Paste a video address.',
  'error.pasteMusicUrl': 'Paste a track, album or playlist address.',
  'error.noTracksSelected': 'No track selected.',
  'error.tracksChanged':
    'The selected tracks are no longer at this address — the content may have changed. Press “Detect” again.',
  'error.noTrackDownloaded': 'No track could be downloaded.',
  'error.jobNotFound': 'Job not found (it may have expired).',
  'error.fileGone': 'File unavailable — it expired or was already cleaned from the server.',
  'error.endpointNotFound': 'Endpoint not found.',
  'error.internal': 'Internal error.',
  'error.noVideoFound': 'No video was found at this address.',
  'error.rarNotSupported':
    'RAR files cannot be created: the format is proprietary and has no free encoder. Use ZIP or TAR.',
  'error.libreOfficeRequired':
    'Converting {format} requires LibreOffice. Install it and restart the server, or set SOFFICE_PATH in .env.',
  'error.libreOfficeUnavailable': 'LibreOffice is not installed on this server. Choose the “Automatic” or “Internal” engine.',
  'error.libreOfficeCannot':
    'LibreOffice cannot perform this particular conversion. Choose the “Automatic” or “Internal” engine.',
  'error.missingBinary': 'Binary “{name}” not found. {hint}',
  'error.spotifyUnknownLink': 'Spotify link not recognised.',
  'error.spotifyArtist': 'Artist links are not supported — use an album, playlist or track.',
  'error.spotifyNeedsKeys':
    'Downloading Spotify {kind} requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env (the track list only comes from the official API).',
  'error.timeout': 'The job exceeded the time limit.',
  'error.canceledByUser': 'Canceled by the user',
  'error.canceled': 'Canceled.',
  'kind.albums': 'albums',
  'kind.playlists': 'playlists',

  'hint.ffmpeg': 'Install ffmpeg and make sure it is on the PATH (or set FFMPEG_PATH in .env).',
  'hint.ffprobe': 'ffprobe ships with ffmpeg. Check the installation or set FFPROBE_PATH.',
  'hint.ytdlp': 'Run `npm run setup:ytdlp` in the project root, or set YTDLP_PATH in .env.',
  'hint.soffice': 'Install LibreOffice for high-fidelity document conversions.',
}

const DICTIONARIES = { pt, en }

/** Normaliza qualquer entrada para um idioma suportado. */
export function resolveLanguage(value) {
  const raw = String(value || '').toLowerCase()
  for (const language of LANGUAGES) {
    if (raw.startsWith(language)) return language
  }
  return DEFAULT_LANGUAGE
}

/** Idioma de um pedido: `?lang=` tem prioridade sobre o cabeçalho do browser. */
export function languageOf(req) {
  const explicit = req?.query?.lang || req?.body?.lang || req?.get?.('X-MediaForge-Language')
  if (explicit) return resolveLanguage(explicit)
  const header = req?.get?.('Accept-Language')
  return header ? resolveLanguage(header.split(',')[0]) : DEFAULT_LANGUAGE
}

/** Traduz uma chave, interpolando `{parâmetros}`. */
export function t(language, key, params) {
  const dictionary = DICTIONARIES[resolveLanguage(language)] || pt
  const template = dictionary[key] ?? pt[key] ?? key
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))
}

/** Fábrica ligada a um idioma, para não o repetir em cada chamada. */
export function translator(language) {
  const resolved = resolveLanguage(language)
  const fn = (key, params) => t(resolved, key, params)
  fn.language = resolved
  return fn
}

/**
 * Erro que carrega a sua própria chave de tradução.
 * Assim uma falha lançada no fundo de um conversor pode ser apresentada no
 * idioma do pedido sem que cada camada tenha de saber qual é.
 */
export class TranslatedError extends Error {
  constructor(key, params = {}, status = 400) {
    super(t(DEFAULT_LANGUAGE, key, params))
    this.name = 'TranslatedError'
    this.i18nKey = key
    this.i18nParams = params
    this.status = status
  }

  localized(language) {
    return t(language, this.i18nKey, this.i18nParams)
  }
}

/** Devolve a mensagem já traduzida, seja o erro nosso ou de terceiros. */
export function localizeError(error, language) {
  if (error instanceof TranslatedError) return error.localized(language)
  return error?.message || t(language, 'error.internal')
}

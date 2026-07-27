import { categoryOf, normalizeExt } from './formats.js'
import { binaries } from './binaries.js'
import { resolveLanguage } from './i18n.js'

/**
 * Esquema declarativo de opções.
 *
 * O servidor é a única fonte de verdade: descreve que controlos existem para
 * cada par (origem, destino), e a UI desenha-os genericamente. Assim nunca há
 * uma opção no ecrã que o motor não saiba aplicar, nem o contrário.
 *
 * As traduções ficam ao lado de cada rótulo, via `L(pt, en)`. Para um ficheiro
 * denso de texto como este, é bastante mais legível do que espalhar chaves por
 * um dicionário à parte — e impossível de dessincronizar.
 *
 * Tipos de campo: 'select' | 'segmented' | 'toggle' | 'range' | 'number' |
 *                 'time' | 'color' | 'note'
 * `showIf` esconde o campo conforme o valor de outro campo.
 */

const L = (pt, en) => ({ pt, en })

const LOSSY_IMAGE = new Set(['jpg', 'webp', 'avif', 'tiff'])
const LOSSLESS_AUDIO = new Set(['flac', 'wav'])

/**
 * Cada grupo carrega um `id` estável além das traduções: a UI precisa de
 * decidir o que mostrar em destaque, e não pode fazê-lo comparando texto
 * que muda com o idioma.
 */
const G = (id, pt, en) => ({ id, pt, en })

const GROUPS = {
  quality: G('quality', 'Qualidade', 'Quality'),
  dimensions: G('dimensions', 'Dimensões', 'Dimensions'),
  metadata: G('metadata', 'Metadados', 'Metadata'),
  vector: G('vector', 'Vetorização', 'Vectorising'),
  audio: G('audio', 'Áudio', 'Audio'),
  trim: G('trim', 'Recorte', 'Trim'),
  gif: G('gif', 'GIF', 'GIF'),
  engine: G('engine', 'Motor', 'Engine'),
  page: G('page', 'Página', 'Page'),
  text: G('text', 'Texto', 'Text'),
  compression: G('compression', 'Compressão', 'Compression'),
  format: G('format', 'Formato', 'Format'),
  subtitles: G('subtitles', 'Legendas', 'Subtitles'),
  organisation: G('organisation', 'Organização', 'Organisation'),
}

const BITRATE_FIELD = (key = 'bitrate', label = L('Bitrate', 'Bitrate')) => ({
  key,
  label,
  type: 'select',
  default: '192k',
  options: [
    { value: '96k', label: L('96 kbps — voz', '96 kbps — speech') },
    { value: '128k', label: L('128 kbps — aceitável', '128 kbps — acceptable') },
    { value: '192k', label: L('192 kbps — recomendado', '192 kbps — recommended') },
    { value: '256k', label: L('256 kbps — alta', '256 kbps — high') },
    { value: '320k', label: L('320 kbps — máxima', '320 kbps — maximum') },
  ],
})

const TRIM_FIELDS = (hint = L('Deixa vazio para o ficheiro inteiro.', 'Leave empty for the whole file.')) => [
  {
    key: 'trimStart',
    label: L('Cortar a partir de', 'Trim from'),
    type: 'time',
    default: '',
    placeholder: '0:00',
    hint,
    group: GROUPS.trim,
  },
  {
    key: 'trimEnd',
    label: L('Cortar até', 'Trim until'),
    type: 'time',
    default: '',
    placeholder: L('fim', 'end'),
    group: GROUPS.trim,
  },
]

const RESIZE_FIELDS = [
  {
    key: 'resizeMode',
    label: L('Redimensionar', 'Resize'),
    type: 'select',
    default: 'none',
    group: GROUPS.dimensions,
    options: [
      { value: 'none', label: L('Manter tamanho original', 'Keep original size') },
      { value: 'fit', label: L('Caber dentro de (mantém proporção)', 'Fit within (keeps aspect ratio)') },
      { value: 'cover', label: L('Preencher e cortar (tamanho exato)', 'Fill and crop (exact size)') },
    ],
  },
  {
    key: 'width',
    label: L('Largura (px)', 'Width (px)'),
    type: 'number',
    default: 1920,
    min: 1,
    max: 12000,
    group: GROUPS.dimensions,
    showIf: { key: 'resizeMode', in: ['fit', 'cover'] },
  },
  {
    key: 'height',
    label: L('Altura (px)', 'Height (px)'),
    type: 'number',
    default: 1080,
    min: 1,
    max: 12000,
    group: GROUPS.dimensions,
    showIf: { key: 'resizeMode', in: ['fit', 'cover'] },
  },
  {
    key: 'allowUpscale',
    label: L('Permitir ampliar', 'Allow upscaling'),
    type: 'toggle',
    default: false,
    hint: L(
      'Ampliar uma imagem pequena não cria detalhe — só a torna maior e mais desfocada.',
      'Upscaling a small image creates no detail — it just makes it bigger and blurrier.',
    ),
    group: GROUPS.dimensions,
    showIf: { key: 'resizeMode', in: ['fit', 'cover'] },
  },
]

function imageFields(from, to) {
  const fields = []

  if (LOSSY_IMAGE.has(to)) {
    fields.push({
      key: 'quality',
      label: L('Qualidade', 'Quality'),
      type: 'range',
      default: 82,
      min: 40,
      max: 100,
      step: 1,
      unit: '%',
      hint: L(
        'Acima de 90 o ganho visual é pequeno e o ficheiro cresce depressa.',
        'Above 90 the visual gain is small and the file grows quickly.',
      ),
      group: GROUPS.quality,
      showIf: { key: 'lossless', equals: false },
    })
  }

  if (to === 'webp') {
    fields.push({
      key: 'lossless',
      label: L('Sem perdas', 'Lossless'),
      type: 'toggle',
      default: false,
      hint: L('Ficheiro maior, pixels idênticos ao original.', 'Larger file, pixels identical to the original.'),
      group: GROUPS.quality,
    })
  }

  if (to === 'png') {
    fields.push({
      key: 'palette',
      label: L('Paleta de 256 cores', '256-colour palette'),
      type: 'toggle',
      default: false,
      hint: L(
        'Reduz muito o tamanho em gráficos e ilustrações; degrada fotografias.',
        'Shrinks graphics and illustrations a lot; degrades photographs.',
      ),
      group: GROUPS.quality,
    })
  }

  if (to === 'jpg') {
    fields.push({
      key: 'background',
      label: L('Fundo para zonas transparentes', 'Background for transparent areas'),
      type: 'color',
      default: '#ffffff',
      hint: L(
        'O JPG não suporta transparência, por isso ela tem de ser preenchida.',
        'JPG has no transparency, so it has to be filled in.',
      ),
      group: GROUPS.quality,
    })
  }

  if (to === 'svg') {
    return [
      {
        key: 'steps',
        label: L('Níveis de cor', 'Colour levels'),
        type: 'range',
        default: 5,
        min: 2,
        max: 10,
        step: 1,
        hint: L(
          'Mais níveis = mais fiel e mais pesado. Formas planas ficam melhores com poucos.',
          'More levels = more faithful and heavier. Flat shapes look better with few.',
        ),
        group: GROUPS.vector,
      },
      {
        key: 'monochrome',
        label: L('Traçado monocromático', 'Monochrome trace'),
        type: 'toggle',
        default: false,
        group: GROUPS.vector,
      },
      {
        key: 'traceWidth',
        label: L('Resolução do traçado (px)', 'Trace resolution (px)'),
        type: 'number',
        default: 1200,
        min: 200,
        max: 3000,
        group: GROUPS.vector,
      },
    ]
  }

  fields.push(...RESIZE_FIELDS)

  if (from === 'svg') {
    fields.push({
      key: 'density',
      label: L('Densidade de rasterização (DPI)', 'Rasterisation density (DPI)'),
      type: 'select',
      default: 384,
      group: GROUPS.dimensions,
      options: [
        { value: 96, label: L('96 — ecrã', '96 — screen') },
        { value: 192, label: L('192 — ecrã retina', '192 — retina screen') },
        { value: 384, label: L('384 — recomendado', '384 — recommended') },
        { value: 600, label: L('600 — impressão', '600 — print') },
      ],
    })
  }

  fields.push({
    key: 'stripMetadata',
    label: L('Remover metadados (EXIF, GPS)', 'Strip metadata (EXIF, GPS)'),
    type: 'toggle',
    default: true,
    hint: L(
      'Fotografias guardam local, data e modelo da câmara. Remover protege a privacidade.',
      'Photos store location, date and camera model. Stripping protects privacy.',
    ),
    group: GROUPS.metadata,
  })

  return fields
}

function audioFields(to) {
  const fields = []

  if (!LOSSLESS_AUDIO.has(to)) {
    fields.push({ ...BITRATE_FIELD(), group: GROUPS.quality })
  } else {
    fields.push({
      key: 'losslessNote',
      label: L('Formato sem perdas', 'Lossless format'),
      type: 'note',
      text: L(
        'Este formato preserva exatamente o áudio de origem. Se a fonte já for comprimida, o tamanho aumenta sem ganho de qualidade.',
        'This format preserves the source audio exactly. If the source is already compressed, the size grows with no quality gain.',
      ),
      group: GROUPS.quality,
    })
  }

  fields.push(
    {
      key: 'sampleRate',
      label: L('Frequência de amostragem', 'Sample rate'),
      type: 'select',
      default: 'auto',
      group: GROUPS.quality,
      options: [
        { value: 'auto', label: L('Manter a do original', 'Keep the original') },
        { value: '48000', label: L('48 kHz — vídeo', '48 kHz — video') },
        { value: '44100', label: L('44,1 kHz — CD', '44.1 kHz — CD') },
        { value: '22050', label: L('22 kHz — voz', '22 kHz — speech') },
      ],
    },
    {
      key: 'channels',
      label: L('Canais', 'Channels'),
      type: 'select',
      default: 'auto',
      group: GROUPS.quality,
      options: [
        { value: 'auto', label: L('Manter os do original', 'Keep the original') },
        { value: '2', label: L('Estéreo', 'Stereo') },
        { value: '1', label: L('Mono — metade do tamanho', 'Mono — half the size') },
      ],
    },
    {
      key: 'normalize',
      label: L('Normalizar volume', 'Normalise volume'),
      type: 'toggle',
      default: false,
      hint: L(
        'Iguala o volume percebido (EBU R128). Torna a conversão mais lenta.',
        'Evens out perceived loudness (EBU R128). Makes the conversion slower.',
      ),
      group: GROUPS.audio,
    },
    {
      key: 'volume',
      label: L('Ganho manual', 'Manual gain'),
      type: 'select',
      default: '0',
      group: GROUPS.audio,
      showIf: { key: 'normalize', equals: false },
      options: [
        { value: '-6', label: L('−6 dB', '−6 dB') },
        { value: '-3', label: L('−3 dB', '−3 dB') },
        { value: '0', label: L('Sem alteração', 'No change') },
        { value: '3', label: L('+3 dB', '+3 dB') },
        { value: '6', label: L('+6 dB', '+6 dB') },
      ],
    },
    ...TRIM_FIELDS(),
  )

  return fields
}

function videoFields(to) {
  if (to === 'gif') {
    return [
      {
        key: 'gifFps',
        label: L('Fotogramas por segundo', 'Frames per second'),
        type: 'range',
        default: 12,
        min: 5,
        max: 25,
        step: 1,
        unit: 'fps',
        hint: L('Mais fps = mais fluido e muito mais pesado.', 'More fps = smoother and much heavier.'),
        group: GROUPS.gif,
      },
      {
        key: 'gifWidth',
        label: L('Largura', 'Width'),
        type: 'select',
        default: '480',
        group: GROUPS.gif,
        options: [
          { value: '240', label: L('240 px — miniatura', '240 px — thumbnail') },
          { value: '320', label: L('320 px', '320 px') },
          { value: '480', label: L('480 px — recomendado', '480 px — recommended') },
          { value: '640', label: L('640 px', '640 px') },
          { value: 'original', label: L('Original — cuidado com o tamanho', 'Original — mind the size') },
        ],
      },
      {
        key: 'gifLoop',
        label: L('Repetir em ciclo', 'Loop forever'),
        type: 'toggle',
        default: true,
        group: GROUPS.gif,
      },
      {
        key: 'allowLongGif',
        label: L('Permitir mais de 30 segundos', 'Allow over 30 seconds'),
        type: 'toggle',
        default: false,
        hint: L(
          'Por omissão o GIF é cortado aos 30 s — acima disso os ficheiros ficam enormes.',
          'By default the GIF is cut at 30 s — beyond that the files get huge.',
        ),
        group: GROUPS.gif,
      },
      ...TRIM_FIELDS(),
    ]
  }

  return [
    {
      key: 'quality',
      label: L('Qualidade', 'Quality'),
      type: 'select',
      default: 'media',
      group: GROUPS.quality,
      options: [
        { value: 'alta', label: L('Alta — ficheiro maior', 'High — larger file') },
        { value: 'media', label: L('Equilibrada — recomendada', 'Balanced — recommended') },
        { value: 'baixa', label: L('Compacta — ficheiro menor', 'Compact — smaller file') },
      ],
    },
    {
      key: 'resolution',
      label: L('Resolução', 'Resolution'),
      type: 'select',
      default: 'original',
      group: GROUPS.quality,
      options: [
        { value: 'original', label: L('Manter a original', 'Keep the original') },
        { value: '2160', label: L('2160p (4K)', '2160p (4K)') },
        { value: '1440', label: L('1440p (2K)', '1440p (2K)') },
        { value: '1080', label: L('1080p', '1080p') },
        { value: '720', label: L('720p', '720p') },
        { value: '480', label: L('480p', '480p') },
        { value: '360', label: L('360p', '360p') },
      ],
    },
    {
      key: 'fps',
      label: L('Fotogramas por segundo', 'Frames per second'),
      type: 'select',
      default: 'original',
      group: GROUPS.quality,
      options: [
        { value: 'original', label: L('Manter os do original', 'Keep the original') },
        { value: '60', label: L('60 fps', '60 fps') },
        { value: '30', label: L('30 fps', '30 fps') },
        { value: '24', label: L('24 fps — cinema', '24 fps — cinematic') },
        { value: '15', label: L('15 fps — muito leve', '15 fps — very light') },
      ],
    },
    {
      key: 'preset',
      label: L('Velocidade de codificação', 'Encoding speed'),
      type: 'select',
      default: 'veryfast',
      group: GROUPS.quality,
      hint: L(
        'Mais lento comprime melhor com a mesma qualidade.',
        'Slower compresses better at the same quality.',
      ),
      options: [
        { value: 'veryfast', label: L('Rápida — recomendada', 'Fast — recommended') },
        { value: 'medium', label: L('Média', 'Medium') },
        { value: 'slow', label: L('Lenta — melhor compressão', 'Slow — better compression') },
      ],
    },
    {
      key: 'removeAudio',
      label: L('Remover o áudio', 'Remove the audio'),
      type: 'toggle',
      default: false,
      group: GROUPS.audio,
    },
    {
      ...BITRATE_FIELD('audioBitrate', L('Bitrate do áudio', 'Audio bitrate')),
      group: GROUPS.audio,
      showIf: { key: 'removeAudio', equals: false },
    },
    ...TRIM_FIELDS(),
  ]
}

function documentFields(to) {
  const fields = []

  if (binaries.soffice) {
    fields.push({
      key: 'engine',
      label: L('Motor de conversão', 'Conversion engine'),
      type: 'select',
      default: 'auto',
      group: GROUPS.engine,
      hint: L(
        'O LibreOffice preserva muito mais formatação; o motor interno é mais rápido e previsível.',
        'LibreOffice preserves far more formatting; the internal engine is faster and more predictable.',
      ),
      options: [
        { value: 'auto', label: L('Automático — melhor disponível', 'Automatic — best available') },
        { value: 'libreoffice', label: L('LibreOffice — máxima fidelidade', 'LibreOffice — maximum fidelity') },
        { value: 'internal', label: L('Interno — só o texto e a estrutura', 'Internal — text and structure only') },
      ],
    })
  }

  if (to === 'pdf') {
    fields.push(
      {
        key: 'pageSize',
        label: L('Tamanho da página', 'Page size'),
        type: 'select',
        default: 'A4',
        group: GROUPS.page,
        options: [
          { value: 'A4', label: L('A4', 'A4') },
          { value: 'A5', label: L('A5', 'A5') },
          { value: 'LETTER', label: L('Letter', 'Letter') },
          { value: 'LEGAL', label: L('Legal', 'Legal') },
        ],
      },
      {
        key: 'orientation',
        label: L('Orientação', 'Orientation'),
        type: 'select',
        default: 'portrait',
        group: GROUPS.page,
        options: [
          { value: 'portrait', label: L('Retrato', 'Portrait') },
          { value: 'landscape', label: L('Paisagem', 'Landscape') },
        ],
      },
      {
        key: 'margin',
        label: L('Margens', 'Margins'),
        type: 'select',
        default: 'normal',
        group: GROUPS.page,
        options: [
          { value: 'narrow', label: L('Estreitas', 'Narrow') },
          { value: 'normal', label: L('Normais', 'Normal') },
          { value: 'wide', label: L('Largas', 'Wide') },
        ],
      },
      {
        key: 'align',
        label: L('Alinhamento do texto', 'Text alignment'),
        type: 'select',
        default: 'left',
        group: GROUPS.text,
        options: [
          { value: 'left', label: L('À esquerda', 'Left') },
          { value: 'justify', label: L('Justificado', 'Justified') },
        ],
      },
      {
        key: 'fontSize',
        label: L('Tamanho da letra', 'Font size'),
        type: 'range',
        default: 11,
        min: 8,
        max: 16,
        step: 1,
        unit: 'pt',
        group: GROUPS.text,
      },
    )
  }

  if (to === 'txt') {
    fields.push({
      key: 'lineEnding',
      label: L('Fim de linha', 'Line ending'),
      type: 'select',
      default: 'lf',
      group: GROUPS.text,
      options: [
        { value: 'lf', label: L('LF — Linux, macOS', 'LF — Linux, macOS') },
        { value: 'crlf', label: L('CRLF — Windows', 'CRLF — Windows') },
      ],
    })
  }

  return fields
}

function archiveFields(to) {
  if (to === 'zip') {
    return [
      {
        key: 'compressionLevel',
        label: L('Nível de compressão', 'Compression level'),
        type: 'select',
        default: '6',
        group: GROUPS.compression,
        options: [
          { value: '0', label: L('Nenhuma — apenas agrupar', 'None — just bundle') },
          { value: '1', label: L('Rápida', 'Fast') },
          { value: '6', label: L('Normal — recomendada', 'Normal — recommended') },
          { value: '9', label: L('Máxima — mais lenta', 'Maximum — slowest') },
        ],
      },
    ]
  }
  return [
    {
      key: 'tarNote',
      label: L('TAR', 'TAR'),
      type: 'note',
      text: L(
        'O TAR agrupa ficheiros sem os comprimir — o tamanho fica igual à soma dos originais.',
        'TAR bundles files without compressing them — the size equals the sum of the originals.',
      ),
      group: GROUPS.compression,
    },
  ]
}

/**
 * Campos disponíveis para um par (origem → destino).
 *
 * A ordem de decisão espelha DELIBERADAMENTE a de `pickEngine`, em
 * converters/index.js. É o que garante que os controlos mostrados são os que o
 * motor escolhido sabe aplicar — o GIF, por exemplo, é da categoria «imagem»,
 * mas vindo de um vídeo é o ffmpeg que o produz, e as opções têm de ser as
 * de vídeo (fps, recorte) e não as de imagem (redimensionar, EXIF).
 */
export function optionSchema(fromExt, toExt) {
  const from = normalizeExt(fromExt)
  const to = normalizeExt(toExt)
  const sourceCategory = categoryOf(from)
  const targetCategory = categoryOf(to)

  if (targetCategory === 'archive' || sourceCategory === 'archive') return archiveFields(to)
  if (from === 'gif' && targetCategory === 'video') return videoFields(to)
  if (sourceCategory === 'image' && targetCategory === 'image') return imageFields(from, to)
  if (sourceCategory === 'audio' || sourceCategory === 'video') {
    return targetCategory === 'audio' ? audioFields(to) : videoFields(to)
  }
  if (sourceCategory === 'document') return documentFields(to)
  return []
}

// ── Localização ─────────────────────────────────────────────────────────────

const pick = (value, language) =>
  value && typeof value === 'object' && !Array.isArray(value) && 'pt' in value ? value[language] ?? value.pt : value

/** Resolve os pares `L(pt, en)` de um esquema para um idioma concreto. */
export function localizeSchema(fields, language) {
  const lang = resolveLanguage(language)
  return fields.map((field) => ({
    ...field,
    groupId: field.group?.id || null,
    label: pick(field.label, lang),
    hint: pick(field.hint, lang),
    text: pick(field.text, lang),
    group: pick(field.group, lang),
    placeholder: pick(field.placeholder, lang),
    options: field.options?.map((option) => ({ ...option, label: pick(option.label, lang) })),
  }))
}

/** Valores por omissão de um esquema. */
export function defaultsFor(fields) {
  const out = {}
  for (const field of fields) {
    if (field.type === 'note') continue
    out[field.key] = field.default
  }
  return out
}

// ── Normalização ────────────────────────────────────────────────────────────

/** Aceita "1:23", "01:02:03" ou "83"; devolve segundos, ou null. */
export function parseTime(value) {
  if (value == null || value === '') return null
  const text = String(value).trim()
  if (!text) return null
  if (/^\d+(\.\d+)?$/.test(text)) return Number(text)
  const parts = text.split(':').map((part) => Number(part))
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return null
  const seconds = parts.reduce((total, part) => total * 60 + part, 0)
  return Number.isFinite(seconds) ? seconds : null
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

/**
 * Valida os valores recebidos contra o esquema de conversão.
 * Tudo o que não corresponder cai no valor por omissão — nenhum valor do
 * cliente chega aos motores sem passar por aqui.
 */
export function normalizeOptions(fromExt, toExt, raw = {}) {
  return normalizeAgainst(optionSchema(fromExt, toExt), raw)
}

/** Esquema + valores por omissão, prontos para a UI. */
export function describeOptions(fromExt, toExt, language) {
  const fields = optionSchema(fromExt, toExt)
  return { fields: localizeSchema(fields, language), defaults: defaultsFor(fields) }
}

// ── Downloaders ─────────────────────────────────────────────────────────────

const AUDIO_FORMAT_OPTIONS = [
  { value: 'mp3', label: L('MP3 — compatível com tudo', 'MP3 — works everywhere') },
  { value: 'm4a', label: L('M4A/AAC — melhor no mesmo bitrate', 'M4A/AAC — better at the same bitrate') },
  { value: 'opus', label: L('Opus — o mais eficiente', 'Opus — the most efficient') },
  { value: 'flac', label: L('FLAC — sem perdas', 'FLAC — lossless') },
  { value: 'wav', label: L('WAV — sem perdas, não comprimido', 'WAV — lossless, uncompressed') },
]

const AUDIO_QUALITY_OPTIONS = [
  { value: '128', label: L('128 kbps', '128 kbps') },
  { value: '192', label: L('192 kbps', '192 kbps') },
  { value: '256', label: L('256 kbps', '256 kbps') },
  { value: '320', label: L('320 kbps — máxima', '320 kbps — maximum') },
]

const SUBTITLE_FIELDS = [
  {
    key: 'subtitles',
    label: L('Incluir legendas', 'Include subtitles'),
    type: 'select',
    default: 'none',
    group: GROUPS.subtitles,
    options: [
      { value: 'none', label: L('Sem legendas', 'No subtitles') },
      { value: 'embed', label: L('Incorporar no ficheiro', 'Embed in the file') },
    ],
  },
  {
    key: 'subtitleLang',
    label: L('Idioma', 'Language'),
    type: 'select',
    default: 'pt',
    group: GROUPS.subtitles,
    showIf: { key: 'subtitles', equals: 'embed' },
    options: [
      { value: 'pt', label: L('Português', 'Portuguese') },
      { value: 'en', label: L('Inglês', 'English') },
      { value: 'es', label: L('Espanhol', 'Spanish') },
      { value: 'fr', label: L('Francês', 'French') },
      { value: 'de', label: L('Alemão', 'German') },
      { value: 'all', label: L('Todos os disponíveis', 'All available') },
    ],
  },
  {
    key: 'autoSubs',
    label: L('Aceitar legendas automáticas', 'Accept auto-generated subtitles'),
    type: 'toggle',
    default: false,
    hint: L(
      'Geradas por reconhecimento de voz: úteis, mas com erros.',
      'Produced by speech recognition: useful, but with mistakes.',
    ),
    group: GROUPS.subtitles,
    showIf: { key: 'subtitles', equals: 'embed' },
  },
]

/** Opções do downloader de vídeo. As qualidades vêm da deteção do próprio vídeo. */
export function videoDownloadSchema({ qualities = [], containers = ['mp4', 'webm'] } = {}) {
  return [
    {
      key: 'mode',
      label: L('O que descarregar', 'What to download'),
      type: 'segmented',
      default: 'video',
      group: GROUPS.format,
      options: [
        { value: 'video', label: L('Vídeo + áudio', 'Video + audio') },
        { value: 'audio', label: L('Apenas áudio', 'Audio only') },
      ],
    },
    {
      key: 'container',
      label: L('Contentor', 'Container'),
      type: 'segmented',
      default: 'mp4',
      group: GROUPS.format,
      showIf: { key: 'mode', equals: 'video' },
      options: containers.map((value) => ({ value, label: value.toUpperCase() })),
    },
    {
      key: 'quality',
      label: L('Resolução', 'Resolution'),
      type: 'select',
      default: 'best',
      group: GROUPS.format,
      showIf: { key: 'mode', equals: 'video' },
      options: [
        { value: 'best', label: L('Melhor disponível', 'Best available') },
        ...qualities.map((quality) => ({ value: String(quality.value), label: quality.label })),
      ],
    },
    {
      key: 'fpsCap',
      label: L('Limite de fotogramas', 'Frame rate cap'),
      type: 'select',
      default: 'any',
      group: GROUPS.format,
      showIf: { key: 'mode', equals: 'video' },
      options: [
        { value: 'any', label: L('Sem limite', 'No cap') },
        { value: '60', label: L('Até 60 fps', 'Up to 60 fps') },
        { value: '30', label: L('Até 30 fps — ficheiro menor', 'Up to 30 fps — smaller file') },
      ],
    },
    {
      key: 'codec',
      label: L('Codec preferido', 'Preferred codec'),
      type: 'select',
      default: 'any',
      group: GROUPS.format,
      showIf: { key: 'mode', equals: 'video' },
      hint: L(
        'H.264 é o mais compatível; AV1 e VP9 dão ficheiros menores mas exigem leitores recentes.',
        'H.264 is the most compatible; AV1 and VP9 give smaller files but need recent players.',
      ),
      options: [
        { value: 'any', label: L('Automático', 'Automatic') },
        { value: 'h264', label: L('H.264 — máxima compatibilidade', 'H.264 — maximum compatibility') },
        { value: 'vp9', label: L('VP9', 'VP9') },
        { value: 'av1', label: L('AV1 — mais eficiente', 'AV1 — most efficient') },
      ],
    },
    {
      key: 'audioFormat',
      label: L('Formato do áudio', 'Audio format'),
      type: 'select',
      default: 'mp3',
      group: GROUPS.audio,
      showIf: { key: 'mode', equals: 'audio' },
      options: AUDIO_FORMAT_OPTIONS,
    },
    {
      key: 'audioBitrate',
      label: L('Qualidade do áudio', 'Audio quality'),
      type: 'select',
      default: '192',
      group: GROUPS.audio,
      showIf: { key: 'mode', equals: 'audio' },
      options: AUDIO_QUALITY_OPTIONS,
    },
    ...SUBTITLE_FIELDS.map((field) => ({ ...field, showIf: field.showIf || { key: 'mode', equals: 'video' } })),
    {
      key: 'embedThumbnail',
      label: L('Incorporar a miniatura', 'Embed the thumbnail'),
      type: 'toggle',
      default: true,
      group: GROUPS.metadata,
    },
    {
      key: 'embedMetadata',
      label: L('Incorporar título, autor e capítulos', 'Embed title, author and chapters'),
      type: 'toggle',
      default: true,
      group: GROUPS.metadata,
    },
    ...TRIM_FIELDS(
      L('Descarrega apenas um excerto, em vez do vídeo inteiro.', 'Downloads only an excerpt instead of the whole video.'),
    ),
  ]
}

/** Opções do downloader de música. */
export function musicDownloadSchema({ multipleTracks = false } = {}) {
  const fields = [
    {
      key: 'format',
      label: L('Formato', 'Format'),
      type: 'segmented',
      default: 'mp3',
      group: GROUPS.format,
      options: [
        { value: 'mp3', label: 'MP3' },
        { value: 'm4a', label: 'M4A' },
        { value: 'opus', label: 'Opus' },
        { value: 'flac', label: 'FLAC' },
      ],
    },
    {
      key: 'bitrate',
      label: L('Qualidade', 'Quality'),
      type: 'select',
      default: '256',
      group: GROUPS.format,
      showIf: { key: 'format', in: ['mp3', 'm4a', 'opus'] },
      options: AUDIO_QUALITY_OPTIONS,
    },
    {
      key: 'losslessNote',
      type: 'note',
      label: L('Sem perdas', 'Lossless'),
      text: L(
        'A fonte é comprimida com perdas — o FLAC preserva exatamente o que existe, mas não recupera qualidade perdida.',
        'The source is lossy — FLAC preserves exactly what is there, but cannot recover lost quality.',
      ),
      group: GROUPS.format,
      showIf: { key: 'format', in: ['flac'] },
    },
    {
      key: 'filenamePattern',
      label: L('Nome dos ficheiros', 'File naming'),
      type: 'select',
      default: 'artist-title',
      group: GROUPS.organisation,
      options: [
        { value: 'artist-title', label: L('Artista - Título', 'Artist - Title') },
        { value: 'title', label: L('Apenas o título', 'Title only') },
        { value: 'track-title', label: L('Nº - Título', 'No. - Title') },
        { value: 'artist-album-title', label: L('Artista - Álbum - Título', 'Artist - Album - Title') },
      ],
    },
    {
      key: 'embedCover',
      label: L('Incorporar a capa', 'Embed the cover art'),
      type: 'toggle',
      default: true,
      group: GROUPS.metadata,
    },
    {
      key: 'embedMetadata',
      label: L('Incorporar artista, álbum e título', 'Embed artist, album and title'),
      type: 'toggle',
      default: true,
      group: GROUPS.metadata,
    },
  ]

  if (multipleTracks) {
    fields.push({
      key: 'zipBatch',
      label: L('Juntar tudo num ZIP', 'Bundle everything into a ZIP'),
      type: 'toggle',
      default: true,
      hint: L(
        'Desligado, cada faixa fica disponível individualmente.',
        'When off, each track is available individually.',
      ),
      group: GROUPS.organisation,
    })
  }

  return fields
}

/** Valida valores contra um esquema já construído. */
export function normalizeAgainst(fields, raw = {}) {
  const input = raw && typeof raw === 'object' ? raw : {}
  const out = {}

  for (const field of fields) {
    if (field.type === 'note') continue
    const value = input[field.key]

    switch (field.type) {
      case 'toggle':
        out[field.key] =
          typeof value === 'boolean' ? value : value === 'true' ? true : value === 'false' ? false : field.default
        break
      case 'range':
      case 'number': {
        const number = Number(value)
        out[field.key] = Number.isFinite(number)
          ? clamp(number, field.min ?? -Infinity, field.max ?? Infinity)
          : field.default
        break
      }
      case 'select':
      case 'segmented': {
        const allowed = field.options.map((option) => String(option.value))
        out[field.key] = allowed.includes(String(value)) ? String(value) : field.default
        break
      }
      case 'time': {
        const seconds = parseTime(value)
        out[field.key] = seconds == null ? field.default : seconds
        break
      }
      case 'color':
        out[field.key] = /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : field.default
        break
      default:
        out[field.key] = value ?? field.default
    }
  }

  if (out.trimStart !== '' && out.trimEnd !== '' && Number(out.trimEnd) <= Number(out.trimStart)) {
    out.trimEnd = ''
  }

  return out
}

# MediaForge

Plataforma tudo-em-um, autoalojada, para **converter ficheiros** e **descarregar multimédia**.
Três ferramentas num único hub: Conversor, Vídeo e Música.

```
React + Vite + Tailwind v4   ←→   Node/Express + ffmpeg + yt-dlp
```

---

## Em ação

### Conversão de ficheiros

Larga o ficheiro, escolhe o destino e afina as opções — cada ficheiro tem as suas, conforme o
formato de saída. Progresso real e pré-visualização antes/depois.

![Conversão de ficheiros no MediaForge](https://i.imgur.com/aPmi4NS.gif)

### Download de música

Cola o link de uma faixa, álbum ou playlist. Escolhes exatamente que faixas queres, e cada uma
tem a sua própria barra de progresso.

![Download de música no MediaForge](https://i.imgur.com/kQ6KC7r.gif)

### Download de vídeo

Deteção automática com miniatura, título e duração. Resolução até 4K, escolha de codec,
legendas, ou apenas um excerto.

![Download de vídeo no MediaForge](https://i.imgur.com/dF5M9Ns.gif)

---

## Arranque rápido

```bash
npm run setup
```

Um comando trata de tudo: verifica o Node, cria o `.env`, instala as dependências dos dois
workspaces, descarrega o yt-dlp e diz-te o que falta no sistema. Depois:

```bash
npm run dev
```

Abre <http://localhost:5173>.

Quem preferir não usar o terminal: `setup.ps1` (Windows, botão direito → Executar com o
PowerShell) ou `./setup.sh` (macOS/Linux).

**Guia completo de instalação, extras opcionais e resolução de problemas: [SETUP.md](SETUP.md).**

### Verificar a instalação

```bash
npm run doctor
```

Mostra que binários foram detetados e que funcionalidades estão ativas.

---

## Requisitos

| Componente | Estado | Para quê |
|---|---|---|
| **Node.js ≥ 20.11** | obrigatório | runtime |
| **ffmpeg** + **ffprobe** | obrigatório | áudio, vídeo, progresso real |
| **yt-dlp** | obrigatório para downloads | vídeo e música |
| **LibreOffice** | opcional | DOCX ↔ PDF de alta fidelidade |
| **Chaves da API do Spotify** | opcional | álbuns e playlists do Spotify |

O ffmpeg é procurado por esta ordem: `FFMPEG_PATH` → `server/bin/` → `PATH` → pacote `ffmpeg-static`.
Se nada existir, o site continua a funcionar para imagens, documentos e compressão, e diz-te
claramente o que falta.

**Instalar o ffmpeg:** `winget install Gyan.FFmpeg` (Windows) · `brew install ffmpeg` (macOS) ·
`apt install ffmpeg` (Debian/Ubuntu).

---

## Funcionalidades

### 1. Conversor

Arrasta ou escolhe até 12 ficheiros. O destino é validado no servidor — só aparecem formatos
que ele consegue mesmo produzir.

| Categoria | Aceita | Produz |
|---|---|---|
| Documentos | pdf, docx, txt, md, rtf, odt, html | pdf, docx, txt |
| Imagens | jpg, png, webp, gif, svg, avif, tiff, bmp | jpg, png, webp, gif, avif, tiff, svg |
| Áudio | mp3, wav, ogg, flac, aac, m4a, opus, wma, aiff | mp3, wav, ogg, flac, aac, m4a, opus |
| Vídeo | mp4, avi, mov, webm, mkv, flv, wmv, m4v, mpeg | mp4, avi, mov, webm, mkv, gif, mp3, wav, aac |
| Arquivos | zip, rar, tar | zip, tar |

Além disto, **qualquer** ficheiro pode ser comprimido para ZIP ou TAR, e o GIF também converte
para MP4/WEBM.

**Cada ficheiro tem as suas próprias opções**, e só aparecem as que fazem sentido para o par
origem → destino escolhido:

| Destino | Opções |
|---|---|
| Imagem | qualidade, sem perdas (WEBP), paleta 256 cores (PNG), cor de fundo (JPG), redimensionar (caber/preencher), permitir ampliar, remover EXIF/GPS, densidade de rasterização (de SVG) |
| SVG | níveis de cor, traçado monocromático, resolução do traçado |
| Áudio | bitrate, frequência de amostragem, canais (mono/estéreo), normalizar volume (EBU R128), ganho manual, recorte temporal |
| Vídeo | qualidade, resolução, fps, velocidade de codificação, remover áudio, bitrate do áudio, recorte temporal |
| GIF | fps, largura, repetir em ciclo, permitir >30 s, recorte temporal |
| PDF | motor (LibreOffice/interno), tamanho de página, orientação, margens, alinhamento, tamanho da letra |
| TXT | fim de linha (LF/CRLF) |
| ZIP | nível de compressão (0 a 9) |

Os downloaders têm o mesmo tratamento: contentor, resolução, limite de fps, codec preferido,
legendas (idioma e automáticas), miniatura e metadados incorporados, e **recorte** — que
descarrega apenas o excerto pedido em vez do vídeo inteiro. Na música: formato, qualidade,
padrão de nome dos ficheiros, capa e metadados, e ZIP do lote.

> **Como funciona.** O esquema de opções é declarado **no servidor** (`server/src/lib/options.js`)
> e servido por API; a UI limita-se a desenhá-lo. Não existe uma opção no ecrã que o motor não
> saiba aplicar, nem uma capacidade do motor que a UI esconda. Todos os valores recebidos são
> validados contra o mesmo esquema antes de chegarem ao ffmpeg ou ao sharp: o que não
> corresponder cai no valor por omissão.

Detalhes que importam:

- **Progresso real**, não simulado — vem do `-progress pipe:1` do ffmpeg e do
  `--progress-template` do yt-dlp.
- **Pré-visualização antes/depois** lado a lado no cartão de cada conversão.
- **PNG/JPG → SVG** por vetorização automática (potrace, posterização a cores).
- **PDF → texto** com `pdfjs-dist`; **DOCX** com `mammoth`. Se o LibreOffice estiver instalado,
  é usado em vez disso e a formatação sobrevive muito melhor.
- **RAR** é lido (extraído e reempacotado), mas não pode ser criado: o formato é proprietário e
  não existe codificador livre.

### 2. Downloader de vídeo

Cola o link → deteção automática (miniatura, título, duração, autor, visualizações) → escolhe
qualidade (144p a 4K, conforme o disponível) e formato (MP4/WEBM) → download.
Alternativa: extrair só o áudio em MP3 (128–320 kbps).

Funciona com tudo o que o yt-dlp suporta — YouTube, Vimeo, Twitter/X, Twitch, Dailymotion e
centenas de outros sites.

### 3. Downloader de música

Faixa, álbum ou playlist do **Spotify**, **SoundCloud**, **YouTube Music** ou **Bandcamp**.
Mostra capa, artista e duração; permite escolher exatamente que faixas descarregar; e dá
**barra de progresso individual por faixa** mais um ZIP do lote no fim.

> **Como funciona o Spotify.** O Spotify não distribui ficheiros de áudio por API. O MediaForge
> usa a Web API oficial apenas para **metadados** (nome, artista, álbum, capa, duração) e depois
> localiza a faixa em fontes públicas por correspondência de artista + título — a mesma
> abordagem das ferramentas open-source do género. A correspondência é boa mas não é perfeita:
> confirma sempre o resultado, sobretudo em remisturas e versões ao vivo.

Para álbuns e playlists precisas de credenciais (grátis) em
<https://developer.spotify.com/dashboard>:

```env
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
```

Sem elas, só links de faixa individual funcionam (via oEmbed público).

---

## Arquitetura

```
server/src/
├── index.js              Express, CORS, tratamento de erros, limpeza periódica
├── config.js             .env com valores por omissão sensatos
├── lib/
│   ├── binaries.js       deteção de ffmpeg / ffprobe / yt-dlp / LibreOffice
│   ├── ffmpeg.js         spawn + parsing de progresso + presets de codec
│   ├── ytdlp.js          wrapper, validação de URL/SSRF, seletor de formatos
│   ├── jobs.js           registo de trabalhos, eventos, fila com concorrência
│   ├── storage.js        ficheiros temporários, TTL, limpeza, anti-path-traversal
│   ├── formats.js        matriz de formatos (serve o motor E a UI)
│   ├── options.js        esquema declarativo de opções + validação (pt/en)
│   └── i18n.js           traduções do servidor + TranslatedError
├── converters/           image (sharp) · media (ffmpeg) · document · archive
├── services/             video · music · spotify
└── routes/               convert · downloads · jobs (SSE) · files
```

**Fila assíncrona.** Os trabalhos entram numa fila com concorrência limitada
(`QUEUE_CONCURRENCY`, por omissão 2). Cada trabalho tem `AbortController` próprio, timeout, e
limpa os seus ficheiros temporários no fim — mesmo quando falha.

**Progresso ao vivo.** O servidor emite um stream SSE em `/api/jobs/events`. Se a ligação cair,
o cliente passa automaticamente para polling e volta ao SSE quando reconectar.

**Bilingue (pt-PT / en).** O seletor está no cabeçalho e a escolha fica guardada no navegador.
Não é só a interface: os rótulos das opções, as etapas dos trabalhos, os detalhes dos
resultados e as mensagens de erro nascem no **servidor**, e por isso viajam traduzidos.

- O cliente envia `X-MediaForge-Language` em cada pedido.
- Cada trabalho guarda o idioma com que foi criado (`job.lang`), para que uma etapa emitida
  minutos depois — já sem pedido HTTP associado — saia na língua certa.
- Erros nossos são lançados como `TranslatedError` com uma chave, não com texto; só são
  convertidos em palavras à saída, no idioma de quem pergunta.
- Os grupos de opções carregam um `groupId` estável além do nome traduzido, porque a UI
  decide o que destacar por identificador e nunca por comparação de texto.

**Movimento reduzido.** Com `prefers-reduced-motion: reduce` as animações decorativas
(entradas, deslizes, transformações) são desligadas — mas os **indicadores de estado
continuam a animar**, trocando rotação e deslize por pulsação de opacidade. Um spinner
parado faz a aplicação parecer bloqueada, o que é pior do que o movimento que se queria evitar.

**Armazenamento temporário.** Uploads e resultados vivem em `server/tmp/` e são apagados ao fim
de `FILE_TTL_HOURS` (2h por omissão) por um limpador que corre a cada `CLEANUP_INTERVAL_MINUTES`.
Não há base de dados nem contas. O histórico da UI vive no `localStorage` do navegador.

### API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/capabilities` | binários detetados, matriz de formatos, limites |
| `GET` | `/api/health` | estado, fila, armazenamento |
| `POST` | `/api/convert` | multipart: `files[]`, `targets[]`, `options` → `{ jobs }` |
| `GET` | `/api/convert/targets?ext=` | destinos possíveis para uma extensão |
| `GET` | `/api/convert/options?from=&to=` | esquema de opções + valores por omissão do par |
| `POST` | `/api/video/probe` | `{ url }` → metadados + qualidades |
| `POST` | `/api/video/download` | `{ url, quality, container, audioOnly }` → `{ job }` |
| `POST` | `/api/music/probe` | `{ url }` → coleção + faixas |
| `POST` | `/api/music/download` | `{ url, format, bitrate, trackIds }` → `{ job }` |
| `GET` | `/api/jobs/events` | stream SSE de atualizações |
| `GET` | `/api/jobs/:id` | estado de um trabalho |
| `POST` | `/api/jobs/:id/cancel` | cancela um trabalho em curso |
| `GET` | `/api/files/:id` | download (`attachment`) |
| `GET` | `/api/files/:id/preview` | inline, com suporte a `Range` |

---

## Produção

```bash
npm run build     # gera web/dist
npm start         # arranca só a API
```

Serve `web/dist` com nginx/Caddy e encaminha `/api` para a porta 4000.
Notas para quem expõe isto à Internet:

- `/api/jobs/events` é SSE — desliga o buffering (`proxy_buffering off;` no nginx).
- Ajusta `client_max_body_size` para bater certo com `MAX_UPLOAD_MB`.
- Define `CORS_ORIGIN` para o teu domínio.
- Não há autenticação embutida. Se o serviço for público, põe-lhe autenticação à frente e
  reduz `MAX_UPLOAD_MB` e `QUEUE_CONCURRENCY` — conversão de vídeo consome muito CPU.

---

## Aviso legal

O MediaForge é uma **ferramenta técnica neutra**: converte ficheiros e obtém conteúdo a partir
de endereços que o utilizador fornece. Não aloja, não indexa e não distribui obras protegidas.

**A responsabilidade pelo conteúdo descarregado ou convertido é inteiramente do utilizador.**
Descarrega apenas material de que sejas titular dos direitos, que esteja em domínio público,
que tenha licença livre, ou para o qual tenhas autorização expressa do titular.

Descarregar obras protegidas por direitos de autor sem autorização pode violar a lei. Pode
também violar os **termos de serviço** da plataforma de origem, mesmo quando não viola a lei de
direitos de autor — são coisas distintas e ambas contam. Informa-te sobre a legislação aplicável
no teu país.

Este aviso está visível no rodapé de todas as páginas do site e desenvolvido em `/faq`.

O software é fornecido «tal como está», sem garantias. Os autores não se responsabilizam por
uso indevido nem por danos decorrentes da sua utilização.

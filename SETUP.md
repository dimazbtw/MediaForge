# Instalar o MediaForge

Guia do zero até ao site a funcionar. Se só queres o comando:

```bash
npm run setup
```

---

## 1. Pré-requisito único: Node.js

O MediaForge precisa de **Node.js 20.11 ou superior**. É a única coisa que tens de instalar
à mão — o resto o script trata.

Descarrega a versão **LTS** em <https://nodejs.org>. Para confirmar:

```bash
node --version
```

Se aparecer algo como `v22.18.0`, estás pronto.

---

## 2. Correr o instalador

Abre um terminal **na pasta do projeto** e corre:

```bash
npm run setup
```

Alternativas equivalentes, se preferires não usar o terminal:

| Sistema | Como |
|---|---|
| Windows | Botão direito em `setup.ps1` → **Executar com o PowerShell** |
| macOS / Linux | `chmod +x setup.sh && ./setup.sh` |

### O que o script faz

1. **Verifica a versão do Node** e pára com uma mensagem clara se for demasiado antiga.
2. **Cria o `.env`** a partir do `.env.example`, se ainda não existir. Se já existir, não lhe toca.
3. **Instala as dependências npm** dos dois workspaces (`server` e `web`) de uma só vez.
4. **Descarrega o yt-dlp** oficial (das releases do GitHub) para `server/bin/`.
5. **Procura o ffmpeg e o LibreOffice** e diz-te exatamente o que falta e como resolver.

No fim imprime um resumo. Se algo faltar, o site arranca na mesma — as funcionalidades
afetadas mostram na interface o que está em falta e o comando para corrigir.

### Sinalizadores

```bash
npm run setup -- --with-ffmpeg    # tenta instalar o ffmpeg pelo gestor de pacotes
npm run setup -- --skip-ytdlp     # não descarrega o yt-dlp
npm run setup -- --skip-install   # só verifica, não corre o npm install
```

---

## 3. Instalar o ffmpeg

O ffmpeg é **obrigatório** para converter áudio e vídeo (imagens, documentos e compressão
funcionam sem ele). O instalador não o instala sozinho por omissão porque cada sistema tem
o seu gestor de pacotes — mas diz-te o comando certo.

| Sistema | Comando |
|---|---|
| Windows | `winget install Gyan.FFmpeg` |
| macOS | `brew install ffmpeg` |
| Debian / Ubuntu | `sudo apt install ffmpeg` |
| Fedora | `sudo dnf install ffmpeg` |

> **Windows:** depois de instalar, **fecha e abre o terminal**. O PATH só é relido em
> processos novos, e sem isso o MediaForge continua a não encontrar o ffmpeg.

Para instalar automaticamente durante o setup:

```bash
npm run setup -- --with-ffmpeg
```

---

## 4. Arrancar

```bash
npm run dev
```

Arranca as duas peças ao mesmo tempo:

- **API** em <http://127.0.0.1:4000>
- **Site** em <http://localhost:5173> ← abre este

Para parar, `Ctrl+C` no terminal.

---

## 5. Confirmar que está tudo bem

```bash
npm run doctor
```

Mostra o que foi detetado nesta máquina:

```
  ✓  ffmpeg         C:\...\ffmpeg.exe
  ✓  ffprobe        C:\...\ffprobe.exe
  ✓  yt-dlp         C:\...\server\bin\yt-dlp.exe
  ✓  LibreOffice    C:\Program Files\LibreOffice\program\soffice.exe
  ✗  Spotify API    opcional — sem chaves, só faixas isoladas
```

O mesmo estado aparece dentro do site, na página **FAQ → Estado desta instalação**.

---

## Extras opcionais

Nada disto é preciso para o site funcionar, mas cada um desbloqueia mais qualidade.

### LibreOffice — documentos com muito mais fidelidade

Sem ele, DOCX → PDF recupera texto e estrutura de parágrafos, mas não o esquema original.
Com ele, a formatação sobrevive quase toda. É detetado automaticamente.

Descarrega em <https://www.libreoffice.org/download/>.

### Chaves do Spotify — álbuns e playlists

Sem chaves, só links de **faixa individual** do Spotify funcionam. Com chaves, álbuns e
playlists inteiras são resolvidos.

1. Vai a <https://developer.spotify.com/dashboard> e cria uma app (é gratuito).
2. Copia o **Client ID** e o **Client Secret**.
3. Abre o `.env` e preenche:

```env
SPOTIFY_CLIENT_ID=o_teu_client_id
SPOTIFY_CLIENT_SECRET=o_teu_client_secret
```

4. Reinicia o servidor (`Ctrl+C` e `npm run dev` outra vez).

> O Spotify não distribui ficheiros de áudio por API. As chaves servem só para obter
> **metadados** (nome, artista, álbum, capa, duração); o áudio é depois localizado em
> fontes públicas por correspondência de artista e título.

---

## Ajustar as definições

Tudo vive no `.env` na raiz. Os valores mais úteis:

```env
PORT=4000                  # porta da API
MAX_UPLOAD_MB=512          # tamanho máximo por ficheiro
FILE_TTL_HOURS=2           # horas até os ficheiros serem apagados
QUEUE_CONCURRENCY=2        # trabalhos em paralelo (sobe se tens muitos núcleos)
MAX_PLAYLIST_ITEMS=50      # máximo de faixas por playlist
```

Depois de mexer, reinicia o servidor.

---

## Se correr mal

**«npm não é reconhecido»**
O Node não está instalado ou não está no PATH. Reinstala a partir de <https://nodejs.org>
e abre um terminal novo.

**O `npm install` falha a meio**
Apaga e tenta de novo:

```bash
rm -rf node_modules package-lock.json    # PowerShell: Remove-Item -Recurse -Force node_modules, package-lock.json
npm run setup
```

**O site abre mas diz «Sem ligação ao servidor»**
A API não está a correr. O `npm run dev` arranca as duas; se arrancaste só o site,
abre outro terminal e corre `npm start`.

**«ffmpeg em falta» mesmo depois de instalar**
Abre um terminal novo (o PATH não é relido em processos já abertos). Se continuar, aponta
o caminho diretamente no `.env`:

```env
FFMPEG_PATH=C:\caminho\completo\para\ffmpeg.exe
```

**Downloads do YouTube falham com 403**
Acontece de vez em quando por limitação de tráfego do YouTube. O MediaForge já repete
sozinho; se persistir, espera alguns minutos. Vale também atualizar o yt-dlp:

```bash
npm run setup:ytdlp
```

**A porta 4000 ou 5173 já está ocupada**
Muda a porta da API no `.env` (`PORT=4001`). Para o site, corre
`npm run dev:web -- --port 5174`.

---

## Pôr em produção

```bash
npm run build     # gera web/dist
npm start         # arranca só a API
```

Serve `web/dist` com nginx ou Caddy e encaminha `/api` para a porta 4000. Três cuidados:

- `/api/jobs/events` é SSE — desliga o buffering (`proxy_buffering off;` no nginx).
- Ajusta o `client_max_body_size` para bater certo com o `MAX_UPLOAD_MB`.
- Define `CORS_ORIGIN` para o teu domínio.

Não há autenticação embutida. Se o serviço for público, põe autenticação à frente e reduz
`MAX_UPLOAD_MB` e `QUEUE_CONCURRENCY` — converter vídeo consome muito CPU.

---

Detalhes de funcionamento, matriz de formatos e aviso legal: [README.md](README.md).

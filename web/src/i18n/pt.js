export default {
  'lang.name': 'Português',
  'lang.switchTo': 'Switch to English',

  // ── Comum ────────────────────────────────────────────────────────────────
  'common.download': 'Descarregar',
  'common.downloadAll': 'Descarregar tudo',
  'common.cancel': 'Cancelar',
  'common.remove': 'Remover',
  'common.clear': 'Limpar',
  'common.clearList': 'Limpar lista',
  'common.retry': 'Tentar de novo',
  'common.reset': 'Repor',
  'common.options': 'Opções',
  'common.advanced': 'Opções avançadas',
  'common.detect': 'Detetar',
  'common.hide': 'Esconder',
  'common.preview': 'Pré-visualizar',
  'common.loading': 'A carregar…',
  'common.open': 'Abrir',
  'common.back': 'Voltar ao início',
  'common.tryNow': 'Tentar agora',
  'common.readMore': 'Saber mais',

  'status.queued': 'Na fila',
  'status.processing': 'A processar',
  'status.done': 'Concluído',
  'status.error': 'Erro',
  'status.canceled': 'Cancelado',

  'kind.convert': 'Conversão',
  'kind.video': 'Vídeo',
  'kind.music': 'Música',

  'time.now': 'agora mesmo',
  'time.minutes': 'há {count} min',
  'time.hours': 'há {count} h',
  'time.days': 'há {count} dia(s)',

  // ── Navegação ────────────────────────────────────────────────────────────
  'nav.converter': 'Conversor',
  'nav.video': 'Vídeo',
  'nav.music': 'Música',
  'nav.history': 'Histórico',
  'nav.faq': 'FAQ',
  'nav.themeLight': 'Mudar para tema claro',
  'nav.themeDark': 'Mudar para tema escuro',
  'nav.active': '{count} ativo(s)',

  'tool.converter.blurb': 'Documentos, imagens, áudio, vídeo e ZIP',
  'tool.video.blurb': 'YouTube e outras fontes, até 4K',
  'tool.music.blurb': 'Spotify, SoundCloud e YouTube',

  // ── Ligação ──────────────────────────────────────────────────────────────
  'offline.title': 'Sem ligação ao servidor.',
  'offline.body':
    'A API do MediaForge não responde — arranca-a com {command} na raiz do projeto. A tentar de novo automaticamente…',
  'offline.converter':
    'Sem a lista de formatos do servidor não é possível saber para que formatos converter. Assim que a API responder, esta página fica pronta sozinha.',
  'offline.loadingFormats': 'A obter a lista de formatos suportados…',
  'status.connected': 'Ligado ao servidor',
  'status.connecting': 'A ligar…',
  'status.unreachable': 'Servidor inacessível',

  // ── Home ─────────────────────────────────────────────────────────────────
  'home.badge': 'conversor + downloader',
  'home.title1': 'Converte qualquer',
  'home.title2': 'ficheiro',
  'home.lead':
    'Larga um ficheiro e escolhe em que o queres transformar. Ou cola um link e traz o vídeo ou a música. Tudo processado no teu servidor.',
  'home.dropTitle': 'Larga aqui o teu ficheiro',
  'home.dropSub': 'ou escolhe do computador',
  'home.dropCta': 'Escolher ficheiro',
  'home.dropHint': 'documentos · imagens · áudio · vídeo · arquivos',
  'home.linkTitle': 'Ou cola um link',
  'home.linkSub': 'vídeo ou música, detetado automaticamente',
  'home.linkPlaceholder': 'https://youtube.com/watch?v=… ou open.spotify.com/…',
  'home.linkCta': 'Trazer',
  'home.linkHint': 'YouTube · Spotify · SoundCloud · e centenas mais',
  'home.or': 'ou',
  'home.stat.perFile': 'por ficheiro',
  'home.stat.video': 'vídeo máximo',
  'home.stat.audio': 'áudio máximo',
  'home.stat.cleanup': 'até auto-limpeza',
  'home.steps.title': 'Três passos, sem manual',
  'home.step1.title': 'Larga ou cola',
  'home.step1.text': 'Arrasta um ficheiro para a bancada, ou cola o link do vídeo ou da faixa.',
  'home.step2.title': 'Escolhe o formato',
  'home.step2.text': 'Só aparecem destinos que fazem sentido para o que carregaste.',
  'home.step3.title': 'Recebe o resultado',
  'home.step3.text': 'Progresso real, pré-visualização antes e depois, e download automático.',
  'home.tools.title': 'Escolhe a ferramenta',
  'home.tools.aside': 'acesso direto',
  'home.needsSetup': 'requer configuração',
  'home.assure1.title': 'Processado no teu servidor',
  'home.assure1.text':
    'ffmpeg, sharp e yt-dlp correm na máquina onde alojas o MediaForge. Nada é enviado para serviços de terceiros.',
  'home.assure2.title': 'Limpeza automática',
  'home.assure2.text':
    'Uploads e resultados são apagados ao fim de {hours} horas. Nenhum ficheiro fica guardado indefinidamente.',
  'home.assure3.title': 'Uso responsável',
  'home.assure3.text':
    'Descarrega apenas conteúdo que possas usar legalmente. A responsabilidade pelos direitos de autor é de quem descarrega.',
  'home.assure3.link': 'Ver aviso legal',

  // ── Conversor ────────────────────────────────────────────────────────────
  'converter.title': 'Conversor de ficheiros',
  'converter.lead':
    'Larga os ficheiros, afina o que quiseres e recebe o resultado. Cada ficheiro tem as suas próprias opções.',
  'converter.maxSize': 'máx. {size} MB',
  'converter.ffmpegMissing':
    'O ffmpeg não foi encontrado no servidor. Conversões de áudio e vídeo estão indisponíveis — imagens, documentos e compressão continuam a funcionar.',
  'converter.ready': '{count} ficheiro(s) pronto(s)',
  'converter.convert': 'Converter {count} ficheiro(s)',
  'converter.unsupported': 'formato não suportado',
  'converter.waitingServer': 'à espera do servidor',
  'converter.willIgnore': '{count} ficheiro(s) sem destino possível serão ignorados.',
  'converter.uploading': 'A enviar…',
  'converter.applyToOthers': 'Aplicar aos outros {count}',
  'converter.changed': '{count} opção(ões) alterada(s)',
  'converter.loadingOptions': 'A carregar as opções…',
  'converter.jobs': 'Trabalhos',
  'converter.emptyTitle': 'A bancada está vazia',
  'converter.emptyBody':
    'Arrasta ficheiros para a zona acima. Cada um traz as suas próprias opções — qualidade, dimensões, recorte, tamanho de página, nível de compressão — conforme o que fizer sentido para o formato de destino.',
  'converter.noOptions':
    'Esta conversão não tem opções — as definições recomendadas são aplicadas automaticamente.',

  'dropzone.title': 'Arrasta ficheiros para aqui',
  'dropzone.drop': 'Larga aqui',
  'dropzone.or': 'ou',
  'dropzone.browse': 'escolhe do computador',
  'dropzone.limits': 'até {files} ficheiros · máx. {size} MB cada',
  'dropzone.tooBig': '{count} ficheiro(s) acima do limite de {size} MB foram ignorados.',
  'dropzone.tooMany': 'Máximo de {count} ficheiros de cada vez.',

  // ── Vídeo ────────────────────────────────────────────────────────────────
  'video.title': 'Downloader de vídeo',
  'video.lead':
    'Cola o link, confirma que é o vídeo certo e afina o que quiseres — resolução, codec, legendas ou só um excerto.',
  'video.badge': 'até 4K',
  'video.urlLabel': 'Endereço do vídeo',
  'video.sources': 'YouTube, Vimeo, Twitter/X, Twitch, Dailymotion e centenas de outros sites suportados pelo yt-dlp.',
  'video.probing': 'A ler os metadados do vídeo…',
  'video.live': 'DIRETO',
  'video.hasSubs': 'legendas disponíveis',
  'video.downloads': 'Downloads',
  'video.extractAudio': 'Extrair áudio {format}',
  'video.downloadAs': 'Descarregar {format}',
  'video.emptyTitle': 'Cola um link para começar',
  'video.emptyBody':
    'O vídeo é detetado automaticamente — vês a miniatura, o título e a duração antes de decidir. As opções disponíveis dependem do que o vídeo realmente oferece.',
  'video.legal':
    'Confirma que tens o direito de descarregar este conteúdo. Descarregar obras protegidas sem autorização pode violar a lei de direitos de autor e os termos de serviço da plataforma de origem.',

  // ── Música ───────────────────────────────────────────────────────────────
  'music.title': 'Downloader de música',
  'music.lead':
    'Faixas, álbuns e playlists do Spotify, SoundCloud, YouTube Music e Bandcamp — com progresso individual por faixa.',
  'music.badge': 'até 320 kbps',
  'music.urlLabel': 'Endereço da faixa, álbum ou playlist',
  'music.maxTracks': 'Máximo de {count} faixas por lista.',
  'music.probing': 'A resolver a coleção…',
  'music.track': 'Faixa',
  'music.album': 'Álbum',
  'music.playlist': 'Playlist',
  'music.trackCount': '{shown} de {total} faixa(s)',
  'music.truncated': 'limitado a {limit}',
  'music.selectAll': 'Selecionar todas',
  'music.deselectAll': 'Desmarcar todas',
  'music.selected': '{count} selecionada(s)',
  'music.downloadTracks': 'Descarregar {count} faixa(s)',
  'music.emptyTitle': 'Cola um link de música',
  'music.emptyBody':
    'Faixa, álbum ou playlist. Vês a capa, o nome e a duração antes de descarregar, e podes escolher exatamente que faixas queres.',
  'music.legal':
    'A grande maioria da música em plataformas de streaming está protegida por direitos de autor. Usa esta ferramenta apenas para conteúdo próprio, sob licença livre, ou com autorização do titular dos direitos.',

  // ── Histórico ────────────────────────────────────────────────────────────
  'history.title': 'Histórico',
  'history.lead':
    'Tudo o que processaste neste navegador. A lista fica guardada localmente — os ficheiros em si desaparecem do servidor ao fim de {hours} horas.',
  'history.clear': 'Limpar histórico',
  'history.all': 'Tudo ({count})',
  'history.conversions': 'Conversões',
  'history.expired': 'expirado',
  'history.emptyTitle': 'Ainda não processaste nada',
  'history.emptyBody': 'Assim que converteres um ficheiro ou descarregares um vídeo, ele aparece aqui.',
  'history.emptyFilterTitle': 'Nada nesta categoria',
  'history.emptyFilterBody': 'Muda o filtro para ver os outros trabalhos.',
  'history.openConverter': 'Abrir o conversor',
  'history.note':
    'O histórico vive apenas neste navegador (localStorage) e nunca é enviado para lado nenhum. Se um download falhar com «expirado», o ficheiro já foi apagado do servidor pela limpeza automática — basta processá-lo de novo.',
  'history.tracks': '{count} faixas',

  // ── FAQ ──────────────────────────────────────────────────────────────────
  'faq.title': 'FAQ e Sobre',
  'faq.lead': 'Limites, formatos suportados, como funciona por dentro e — importante — as tuas responsabilidades legais.',
  'faq.legal.title': 'Aviso legal e direitos de autor',
  'faq.legal.p1':
    'O MediaForge é uma ferramenta técnica neutra. Converte ficheiros e obtém conteúdo a partir de endereços que o utilizador fornece. Não aloja, não indexa e não distribui qualquer obra protegida.',
  'faq.legal.p2':
    'A responsabilidade é inteiramente de quem usa a ferramenta. Ao descarregar ou converter conteúdo, declaras que tens o direito legal de o fazer.',
  'faq.legal.okTitle': 'Utilizações legítimas',
  'faq.legal.ok1': 'Conteúdo que criaste ou de que és titular dos direitos',
  'faq.legal.ok2': 'Obras em domínio público',
  'faq.legal.ok3': 'Material sob licença livre (Creative Commons e afins)',
  'faq.legal.ok4': 'Conteúdo com autorização expressa do titular',
  'faq.legal.ok5': 'Cópia privada, nos termos e limites da lei do teu país',
  'faq.legal.noTitle': 'Utilizações que não deves fazer',
  'faq.legal.no1': 'Descarregar obras protegidas sem autorização',
  'faq.legal.no2': 'Redistribuir ou revender o que descarregaste',
  'faq.legal.no3': 'Contornar medidas técnicas de proteção (DRM)',
  'faq.legal.no4': 'Usar conteúdo de terceiros comercialmente sem licença',
  'faq.legal.tos':
    'Descarregar conteúdo pode ainda violar os termos de serviço da plataforma de origem, mesmo quando não viola a lei de direitos de autor — são coisas distintas e ambas contam. Em caso de dúvida, informa-te sobre a legislação aplicável no teu país.',
  'faq.legal.warranty':
    'O software é fornecido «tal como está», sem garantias. Os autores não se responsabilizam por qualquer uso indevido nem por danos decorrentes da sua utilização.',

  'faq.status.title': 'Estado desta instalação',
  'faq.status.ffmpeg': 'Conversão de áudio e vídeo',
  'faq.status.ytdlp': 'Downloads de vídeo e música',
  'faq.status.libreoffice': 'DOCX ↔ PDF de alta fidelidade',
  'faq.status.spotify': 'Álbuns e playlists do Spotify',
  'faq.status.active': 'ativo',
  'faq.status.missing': 'em falta',
  'faq.status.optional': 'opcional',
  'faq.status.checking': 'a verificar',
  'faq.status.warning': 'Falta pelo menos um componente obrigatório. Consulta o README.md ou corre {command} na raiz do projeto.',

  'faq.questions': 'Perguntas frequentes',
  'faq.q1': 'Que formatos são suportados?',
  'faq.a1':
    'A matriz completa é gerada pelo servidor — o conversor só mostra destinos que consegue mesmo produzir para o ficheiro que carregaste.',
  'faq.accepts': 'Aceita:',
  'faq.produces': 'Produz:',
  'faq.compressAny': 'Além disso, qualquer ficheiro pode ser comprimido para {targets}.',
  'faq.q2': 'Porque não posso criar ficheiros RAR?',
  'faq.a2':
    'O RAR é um formato proprietário e não existe codificador livre. O MediaForge lê ficheiros RAR (extrai o conteúdo e reempacota em ZIP ou TAR), mas não os consegue criar. Para comprimir, usa ZIP — é aberto, universal e abre em qualquer sistema sem software extra.',
  'faq.q3': 'Quais são os limites de uso?',
  'faq.limit.size': 'Tamanho por ficheiro',
  'faq.limit.batch': 'Ficheiros por lote',
  'faq.limit.tracks': 'Faixas por playlist ou álbum',
  'faq.limit.parallel': 'Trabalhos em paralelo',
  'faq.limit.ttl': 'Tempo até auto-limpeza',
  'faq.limit.note': 'Como o MediaForge é autoalojado, todos estes valores se ajustam no ficheiro .env.',
  'faq.q4': 'Onde ficam os meus ficheiros?',
  'faq.a4':
    'Numa pasta temporária do servidor onde alojas o MediaForge. Não há base de dados, não há contas e nada é enviado para serviços de terceiros — a conversão corre localmente com ffmpeg, sharp e LibreOffice. Uploads e resultados são apagados automaticamente ao fim de {hours} horas por um limpador periódico. O histórico que vês na aplicação vive só no teu navegador.',
  'faq.q5': 'Como funciona o download do Spotify?',
  'faq.a5a':
    'O Spotify não distribui ficheiros de áudio por API. O que o MediaForge faz é usar a API oficial para obter metadados — nome da faixa, artista, álbum, capa e duração — e depois localizar essa faixa em fontes públicas (YouTube) por correspondência de artista e título, tal como as ferramentas open-source do género.',
  'faq.a5b':
    'Consequência prática: a correspondência é boa mas não é perfeita, sobretudo em remisturas, versões ao vivo e faixas com títulos ambíguos. Confirma sempre o resultado. Sem as chaves SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET configuradas, álbuns e playlists não funcionam.',
  'faq.q6': 'Porque é que uma conversão falhou?',
  'faq.a6.1': 'O ficheiro está corrompido, protegido por palavra-passe ou tem DRM.',
  'faq.a6.2': 'É um PDF digitalizado (só imagens) — extrair texto exigiria OCR, que não está incluído.',
  'faq.a6.3': 'O vídeo é demasiado longo e ultrapassou o tempo limite do trabalho.',
  'faq.a6.4': 'Falta um binário no servidor (ffmpeg, yt-dlp ou LibreOffice). Corre npm run doctor para verificar.',
  'faq.a6.5': 'O link é privado, foi removido, ou exige início de sessão.',
  'faq.q7': 'A qualidade perde-se na conversão?',
  'faq.a7':
    'Depende. Converter entre formatos com perdas (MP3 → AAC, JPG → WEBP) implica sempre uma recodificação e alguma degradação — é inevitável. Converter para formatos sem perdas (FLAC, WAV, PNG) preserva exatamente o que existe, mas não recupera qualidade que já se tinha perdido. Para vídeo, escolhe «Alta» nas opções se preferires ficheiros maiores e mais fiéis ao original.',
  'faq.cta': 'Pronto para começar? {converter} ou {link}.',
  'faq.cta.converter': 'Abre o conversor',
  'faq.cta.link': 'cola um link',

  // ── 404 ──────────────────────────────────────────────────────────────────
  'notfound.title': 'Esta página não existe',
  'notfound.body': 'O endereço que seguiste não corresponde a nada no MediaForge. Talvez uma destas te sirva:',

  // ── Rodapé ───────────────────────────────────────────────────────────────
  'footer.about':
    'Conversão de ficheiros e download de multimédia numa só bancada de trabalho. Os ficheiros são processados no teu servidor e apagados automaticamente ao fim de {hours} horas.',
  'footer.tools': 'Ferramentas',
  'footer.status': 'Estado',
  'footer.limits': 'Limites e formatos',
  'footer.history': 'Histórico da sessão',
  'footer.legalTitle': 'Aviso legal',
  'footer.legal':
    'O MediaForge é uma ferramenta técnica. A responsabilidade pelo conteúdo descarregado ou convertido é inteiramente do utilizador. Descarrega apenas material de que sejas titular dos direitos, que esteja em domínio público, sob licença livre, ou para o qual tenhas autorização expressa. Descarregar obras protegidas por direitos de autor sem permissão pode violar a lei e os termos de serviço das plataformas de origem. Ao usar este site declaras que cumpres a legislação aplicável.',
  'footer.readMore': 'Ler mais na FAQ',
  'footer.tagline': 'MediaForge · autoalojado · sem contas, sem rastreio',

  // ── Cartão de trabalho ───────────────────────────────────────────────────
  'job.before': 'Antes',
  'job.after': 'Depois',
  'job.noPreview': '(sem pré-visualização)',
  'preview.noText': '(documento sem texto)',
}

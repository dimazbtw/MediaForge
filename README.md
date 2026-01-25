# MediaForge - Conversor & Editor de Mídia

Um conversor e editor de imagens/vídeos moderno com backend Node.js e frontend React + Tailwind.

## ✨ Funcionalidades

### Vídeo
- **Vídeo → GIF**: Conversão de alta qualidade com paleta otimizada
- **Conversão de formato**: MP4, WebM, AVI, MKV, MOV
- **Compressão**: Reduz tamanho mantendo qualidade
- **Extração de áudio**: MP3, AAC, WAV, OGG

### Imagem
- **Conversão de formato**: WebP, JPEG, PNG, AVIF, GIF
- **Compressão**: MozJPEG e otimização PNG
- **Redimensionamento**: Com presets para redes sociais
- **Filtros**: Preto e branco, rotação, flip, brilho, saturação, desfoque

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- FFmpeg instalado no sistema

### Backend

```bash
cd backend
npm install
npm start
```

O servidor iniciará na porta 3001.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend iniciará na porta 3000.

## 📁 Estrutura do Projeto

```
media-converter/
├── backend/
│   ├── server.js        # Servidor Express com todas as rotas
│   ├── package.json
│   ├── uploads/         # Arquivos enviados (temporário)
│   └── outputs/         # Arquivos processados (temporário)
│
└── frontend/
    ├── src/
    │   ├── App.jsx              # Componente principal
    │   ├── main.jsx             # Entry point
    │   ├── index.css            # Estilos globais
    │   ├── components/
    │   │   ├── FileUpload.jsx   # Upload com drag & drop
    │   │   ├── FileInfo.jsx     # Info do arquivo
    │   │   ├── VideoPanel.jsx   # Painel de vídeo
    │   │   └── ImagePanel.jsx   # Painel de imagem
    │   ├── hooks/
    │   │   └── useApi.js        # Hook para API
    │   └── utils/
    │       └── format.js        # Utilitários de formatação
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

## 🔧 API Endpoints

### Upload
- `POST /api/upload` - Upload de arquivo

### Informações
- `GET /api/info/:fileId` - Info do arquivo
- `GET /api/progress/:taskId` - Progresso da conversão

### Vídeo
- `POST /api/convert/video-to-gif` - Vídeo para GIF
- `POST /api/convert/video` - Converter formato
- `POST /api/compress/video` - Comprimir vídeo
- `POST /api/extract/audio` - Extrair áudio

### Imagem
- `POST /api/convert/image` - Converter formato
- `POST /api/compress/image` - Comprimir imagem
- `POST /api/resize/image` - Redimensionar
- `POST /api/filter/image` - Aplicar filtros
- `POST /api/crop/image` - Recortar

### Outros
- `GET /api/download/:filename` - Download de arquivo
- `DELETE /api/file/:fileId` - Deletar arquivo
- `GET /api/health` - Health check

## 🎨 Tecnologias

### Backend
- **Express.js** - Framework web
- **Multer** - Upload de arquivos
- **FFmpeg/Fluent-FFmpeg** - Processamento de vídeo
- **Sharp** - Processamento de imagem

### Frontend
- **React 18** - UI Library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Ícones
- **Axios** - HTTP client
- **React Dropzone** - Drag & drop

## 📝 Notas

- Arquivos são automaticamente deletados após 30 minutos
- Limite de upload: 500MB
- A conversão vídeo → GIF usa 2-pass encoding com paleta otimizada para máxima qualidade

## 🎯 Roadmap

- [ ] Batch processing (múltiplos arquivos)
- [ ] Corte de vídeo (trim)
- [ ] Marca d'água
- [ ] Merge de vídeos
- [ ] Extração de frames
- [ ] Preview em tempo real
- [ ] WebSocket para progresso real-time

## 📄 Licença

MIT License

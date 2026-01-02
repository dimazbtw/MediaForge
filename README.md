<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

<h1 align="center">⚡ MediaForge</h1>

<p align="center">
  <strong>Conversor Universal de Mídia</strong><br>
  Converte imagens, vídeos e áudio diretamente no navegador — sem necessidade de servidor!
</p>

<p align="center">
  <a href="#-funcionalidades">Funcionalidades</a> •
  <a href="#-demonstração">Demonstração</a> •
  <a href="#-instalação">Instalação</a> •
  <a href="#-utilização">Utilização</a> •
  <a href="#-formatos-suportados">Formatos</a> •
  <a href="#-tecnologias">Tecnologias</a> •
  <a href="#-licença">Licença</a>
</p>

---

## ✨ Funcionalidades

### 🖼️ Conversão de Imagens
- Converte entre PNG, JPG, JPEG, WEBP, GIF, BMP e ICO
- Redimensionamento com proporção bloqueada
- Controlo de qualidade (10-100%)

### 🎬 Conversão de Vídeos
- Converte entre MP4, WEBM e GIF animado
- Extração de áudio de vídeos
- Redimensionamento de resolução
- **Vídeo para GIF** com encoder nativo em JavaScript puro

### 🎵 Conversão de Áudio
- Converte entre MP3, WAV, OGG, WEBM e M4A
- Controlo de qualidade

### 🌐 Multi-Idioma
- 🇵🇹 Português (Portugal)
- 🇬🇧 Inglês

### 🎨 Interface Moderna
- Design escuro com efeitos neon
- Animações suaves
- Drag & drop de ficheiros
- Pré-visualização em tempo real
- Histórico de conversões
- Totalmente responsivo

---

## 🚀 Demonstração

### Pré-visualização
```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ MediaForge                              🇵🇹 PT  🇬🇧 EN  │
│     Conversor Universal de Mídia                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │  📁 Ficheiro        │  │  ✨ Resultado       │          │
│  │                     │  │                     │          │
│  │  📤 Arrasta aqui    │  │  🎯 Aparecerá aqui  │          │
│  │                     │  │                     │          │
│  │  Converter para:    │  │                     │          │
│  │  [PNG][JPG][WEBP]   │  │                     │          │
│  │                     │  │                     │          │
│  │  ⚡ Converter Agora │  │  📥 Transferir      │          │
│  └─────────────────────┘  └─────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Instalação

### Opção 1: Clone do Repositório

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/mediaforge.git

# Entrar na pasta
cd mediaforge

# Abrir no navegador
# Basta abrir o ficheiro index.html
```

### Opção 2: Download Direto

1. Faz download do ZIP do repositório
2. Extrai os ficheiros
3. Abre `index.html` no navegador

### Opção 3: Servidor Local (Recomendado)

```bash
# Com Python 3
python -m http.server 8000

# Com Node.js (npx)
npx serve .

# Com PHP
php -S localhost:8000
```

Depois acede a `http://localhost:8000`

---

## 🎯 Utilização

### Conversão Básica

1. **Arrasta e larga** um ficheiro na zona indicada, ou **clica** para selecionar
2. Escolhe o **formato de destino**
3. (Opcional) Ajusta a **qualidade** e **dimensões**
4. Clica em **⚡ Converter Agora**
5. Faz **download** do ficheiro convertido

### Vídeo para GIF

1. Carrega um ficheiro de vídeo (MP4, WEBM, etc.)
2. Seleciona **GIF** como formato de destino
3. Ajusta a qualidade (maior = melhor, mas mais lento)
4. O GIF será limitado a 8 segundos e 400px de largura máxima para otimização

### Extrair Áudio de Vídeo

1. Carrega um ficheiro de vídeo
2. Seleciona **MP3** ou **WAV** como formato de destino
3. O áudio será extraído automaticamente

---

## 📋 Formatos Suportados

| Tipo | Formatos de Entrada | Formatos de Saída |
|------|---------------------|-------------------|
| **Imagens** | PNG, JPG, JPEG, WEBP, GIF, BMP, SVG | PNG, JPG, JPEG, WEBP, GIF, BMP, ICO |
| **Vídeos** | MP4, WEBM, MOV, AVI* | MP4, WEBM, GIF |
| **Áudio** | MP3, WAV, OGG, M4A, WEBM | MP3, WAV, OGG, WEBM, M4A |

> *Alguns formatos dependem do suporte do navegador

---

## 🛠️ Tecnologias

- **HTML5** - Estrutura semântica
- **CSS3** - Estilos modernos com variáveis CSS, animações e glassmorphism
- **JavaScript ES6+** - Lógica de conversão e interatividade
- **Canvas API** - Processamento de imagens
- **MediaRecorder API** - Conversão de vídeo e áudio
- **Web Audio API** - Extração e processamento de áudio
- **GIF Encoder** - Implementação nativa em JS (NeuQuant + LZW)

### Estrutura do Projeto

```
mediaforge/
├── index.html          # Estrutura HTML
├── styles.css          # Estilos CSS
├── script.js           # Lógica principal + GIF Encoder
├── translations.js     # Sistema de traduções
├── README.md           # Documentação
└── LICENSE             # Licença MIT
```

---

## 🌍 Internacionalização (i18n)

O MediaForge suporta múltiplos idiomas através de um sistema de traduções simples.

### Adicionar um Novo Idioma

1. Abre `translations.js`
2. Adiciona um novo objeto de idioma:

```javascript
'es': {
    title: 'MediaForge',
    subtitle: 'Convertidor Universal de Medios',
    // ... resto das traduções
}
```

3. Adiciona o botão no HTML:

```html
<button class="lang-btn" data-lang="es" title="Español">🇪🇸 ES</button>
```

---

## ⚙️ Configuração

### Limites do GIF

No ficheiro `script.js`, podes ajustar os limites do encoder GIF:

```javascript
// Dentro da função videoToGif()
const maxSize = 400;      // Largura/altura máxima em pixels
const duration = 8;       // Duração máxima em segundos
const fps = 10;           // Frames por segundo
```

### Qualidade Padrão

```javascript
// Qualidade inicial do slider
const defaultQuality = 80;  // 10-100
```

---

## 🤝 Contribuir

Contribuições são bem-vindas! Sente-te à vontade para:

1. Fazer **Fork** do projeto
2. Criar uma **Branch** (`git checkout -b feature/NovaFuncionalidade`)
3. **Commit** das alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. **Push** para a Branch (`git push origin feature/NovaFuncionalidade`)
5. Abrir um **Pull Request**

### Ideias para Contribuição

- [ ] Suporte a mais formatos de vídeo
- [ ] Modo de processamento em lote
- [ ] Recorte de imagens/vídeos
- [ ] Filtros e efeitos
- [ ] PWA (Progressive Web App)
- [ ] Mais idiomas

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - vê o ficheiro [LICENSE](LICENSE) para mais detalhes.

```
MIT License

Copyright (c) 2025 MediaForge

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Agradecimentos

- [Google Fonts](https://fonts.google.com/) - Fontes Syne e Space Mono
- [NeuQuant](https://scientificlib.com/en/Mathematics/LX/NeuQuant.html) - Algoritmo de quantização de cores
- Comunidade open-source

---

<p align="center">
  Feito com ❤️ em Portugal
</p>

<p align="center">
  <a href="#-mediaforge">⬆️ Voltar ao topo</a>
</p>

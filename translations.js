const translations = {
    'pt-PT': {
        // Header
        title: 'MediaForge',
        subtitle: 'Conversor Universal de Mídia',
        
        // Input Card
        inputFile: 'Ficheiro de Entrada',
        dropZoneText: 'Arrasta e larga o teu ficheiro aqui',
        dropZoneHint: 'ou clica para selecionar',
        
        // File Info
        fileName: 'Nome',
        fileType: 'Tipo',
        fileSize: 'Tamanho',
        fileDimensions: 'Dimensões',
        unknown: 'Desconhecido',
        notApplicable: 'N/A',
        
        // Conversion
        convertTo: 'Converter para',
        quality: 'Qualidade',
        resizeOptional: 'Redimensionar (opcional)',
        widthPx: 'Largura (px)',
        heightPx: 'Altura (px)',
        convertNow: '⚡ Converter Agora',
        
        // Progress
        processing: 'A processar...',
        startingConversion: 'A iniciar conversão...',
        processingImage: 'A processar imagem...',
        convertingFormat: 'A converter formato...',
        loadingVideo: 'A carregar vídeo...',
        preparingConversion: 'A preparar conversão...',
        processingPercent: 'A processar: {percent}%',
        extractingAudio: 'A extrair áudio...',
        processingAudio: 'A processar áudio...',
        capturingFrames: 'A capturar frames...',
        capturingFrame: 'A capturar frame {current}/{total}...',
        generatingGif: 'A gerar GIF animado...',
        encodingGif: 'A codificar GIF: {percent}%',
        completed: 'Concluído!',
        
        // Output Card
        result: 'Resultado',
        outputPlaceholder: 'O teu ficheiro convertido aparecerá aqui',
        format: 'Formato',
        size: 'Tamanho',
        dimensions: 'Dimensões',
        reduction: 'Redução',
        downloadFile: '📥 Transferir Ficheiro',
        
        // History
        history: '📜 Histórico',
        clearHistory: 'Limpar Histórico',
        noConversionsYet: 'Nenhuma conversão realizada ainda',
        
        // Supported Formats
        supportedFormats: '📋 Formatos Suportados',
        images: '🖼️ Imagens',
        videos: '🎬 Vídeos',
        audio: '🎵 Áudio',
        special: '🔄 Especiais',
        videoToGif: 'Vídeo → GIF',
        videoToAudio: 'Vídeo → Áudio',
        resize: 'Redimensionar',
        
        // Toasts
        conversionSuccess: 'Conversão concluída com sucesso!',
        conversionError: 'Erro na conversão: {message}',
        downloadStarted: 'Transferência iniciada!',
        historyCleared: 'Histórico limpo!',
        
        // Errors
        failedToCreateBlob: 'Falha ao criar blob',
        failedToLoadImage: 'Falha ao carregar imagem',
        failedToLoadVideo: 'Falha ao carregar vídeo',
        failedToLoadAudio: 'Falha ao carregar áudio',
        
        // Language
        language: 'Idioma'
    },
    
    'en': {
        // Header
        title: 'MediaForge',
        subtitle: 'Universal Media Converter',
        
        // Input Card
        inputFile: 'Input File',
        dropZoneText: 'Drag and drop your file here',
        dropZoneHint: 'or click to select',
        
        // File Info
        fileName: 'Name',
        fileType: 'Type',
        fileSize: 'Size',
        fileDimensions: 'Dimensions',
        unknown: 'Unknown',
        notApplicable: 'N/A',
        
        // Conversion
        convertTo: 'Convert to',
        quality: 'Quality',
        resizeOptional: 'Resize (optional)',
        widthPx: 'Width (px)',
        heightPx: 'Height (px)',
        convertNow: '⚡ Convert Now',
        
        // Progress
        processing: 'Processing...',
        startingConversion: 'Starting conversion...',
        processingImage: 'Processing image...',
        convertingFormat: 'Converting format...',
        loadingVideo: 'Loading video...',
        preparingConversion: 'Preparing conversion...',
        processingPercent: 'Processing: {percent}%',
        extractingAudio: 'Extracting audio...',
        processingAudio: 'Processing audio...',
        capturingFrames: 'Capturing frames...',
        capturingFrame: 'Capturing frame {current}/{total}...',
        generatingGif: 'Generating animated GIF...',
        encodingGif: 'Encoding GIF: {percent}%',
        completed: 'Completed!',
        
        // Output Card
        result: 'Result',
        outputPlaceholder: 'Your converted file will appear here',
        format: 'Format',
        size: 'Size',
        dimensions: 'Dimensions',
        reduction: 'Reduction',
        downloadFile: '📥 Download File',
        
        // History
        history: '📜 History',
        clearHistory: 'Clear History',
        noConversionsYet: 'No conversions yet',
        
        // Supported Formats
        supportedFormats: '📋 Supported Formats',
        images: '🖼️ Images',
        videos: '🎬 Videos',
        audio: '🎵 Audio',
        special: '🔄 Special',
        videoToGif: 'Video → GIF',
        videoToAudio: 'Video → Audio',
        resize: 'Resize',
        
        // Toasts
        conversionSuccess: 'Conversion completed successfully!',
        conversionError: 'Conversion error: {message}',
        downloadStarted: 'Download started!',
        historyCleared: 'History cleared!',
        
        // Errors
        failedToCreateBlob: 'Failed to create blob',
        failedToLoadImage: 'Failed to load image',
        failedToLoadVideo: 'Failed to load video',
        failedToLoadAudio: 'Failed to load audio',
        
        // Language
        language: 'Language'
    }
};

// Current language
let currentLang = localStorage.getItem('mediaforge-lang') || 'pt-PT';

// Get translation
function t(key, params = {}) {
    let text = translations[currentLang]?.[key] || translations['pt-PT'][key] || key;
    
    // Replace parameters
    Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
}

// Set language
function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('mediaforge-lang', lang);
        updatePageLanguage();
    }
}

// Update all page text
function updatePageLanguage() {
    // Header
    document.querySelector('h1').textContent = t('title');
    document.querySelector('.subtitle').textContent = t('subtitle');
    
    // Input Card
    document.querySelector('.card:first-of-type .card-title').textContent = t('inputFile');
    document.querySelector('.drop-zone-text').textContent = t('dropZoneText');
    document.querySelector('.drop-zone-hint').textContent = t('dropZoneHint');
    
    // File Info Labels
    const fileLabels = document.querySelectorAll('.file-info .file-detail-label');
    if (fileLabels.length >= 4) {
        fileLabels[0].textContent = t('fileName');
        fileLabels[1].textContent = t('fileType');
        fileLabels[2].textContent = t('fileSize');
        fileLabels[3].textContent = t('fileDimensions');
    }
    
    // Conversion Section
    const convertToTitle = document.querySelector('#conversionSection .section-title');
    if (convertToTitle) convertToTitle.textContent = t('convertTo');
    
    // Quality Section
    const qualityTitle = document.querySelector('#qualitySection .section-title');
    if (qualityTitle) qualityTitle.textContent = t('quality');
    
    // Resize Section
    const resizeTitle = document.querySelector('#resizeSection .section-title');
    if (resizeTitle) resizeTitle.textContent = t('resizeOptional');
    
    const resizeLabels = document.querySelectorAll('.resize-input-group label');
    if (resizeLabels.length >= 2) {
        resizeLabels[0].textContent = t('widthPx');
        resizeLabels[1].textContent = t('heightPx');
    }
    
    // Convert Button
    document.getElementById('convertBtn').textContent = t('convertNow');
    
    // Output Card
    document.querySelector('.output-card .card-title').textContent = t('result');
    document.querySelector('.output-empty p').textContent = t('outputPlaceholder');
    
    // Output Info Labels
    const outputLabels = document.querySelectorAll('.output-info .file-detail-label');
    if (outputLabels.length >= 4) {
        outputLabels[0].textContent = t('format');
        outputLabels[1].textContent = t('size');
        outputLabels[2].textContent = t('dimensions');
        outputLabels[3].textContent = t('reduction');
    }
    
    // Download Button
    document.getElementById('downloadBtn').textContent = t('downloadFile');
    
    // History
    document.querySelector('.history-title').textContent = t('history');
    document.getElementById('clearHistoryBtn').textContent = t('clearHistory');
    document.querySelector('#historyEmpty p').textContent = t('noConversionsYet');
    
    // Supported Formats
    document.querySelector('.formats-info .card-title').textContent = t('supportedFormats');
    const categoryTitles = document.querySelectorAll('.format-category-title');
    if (categoryTitles.length >= 4) {
        categoryTitles[0].textContent = t('images');
        categoryTitles[1].textContent = t('videos');
        categoryTitles[2].textContent = t('audio');
        categoryTitles[3].textContent = t('special');
    }
    
    // Special format tags
    const specialTags = document.querySelectorAll('.format-category:last-child .format-tag');
    if (specialTags.length >= 4) {
        specialTags[0].textContent = 'GIF → MP4';
        specialTags[1].textContent = t('videoToGif');
        specialTags[2].textContent = t('videoToAudio');
        specialTags[3].textContent = t('resize');
    }
    
    // Language selector
    const langLabel = document.querySelector('.lang-label');
    if (langLabel) langLabel.textContent = t('language');
    
    // Update language selector active state
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
}

// Export for use in other files
window.t = t;
window.setLanguage = setLanguage;
window.currentLang = currentLang;
window.updatePageLanguage = updatePageLanguage;

// State
let currentFile = null;
let selectedFormat = null;
let originalDimensions = { width: 0, height: 0 };
let aspectRatioLocked = true;
let conversionHistory = [];
let convertedBlob = null;
let convertedFileName = '';

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const previewContainer = document.getElementById('previewContainer');
const formatGrid = document.getElementById('formatGrid');
const conversionSection = document.getElementById('conversionSection');
const qualitySection = document.getElementById('qualitySection');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const resizeSection = document.getElementById('resizeSection');
const resizeWidth = document.getElementById('resizeWidth');
const resizeHeight = document.getElementById('resizeHeight');
const resizeLock = document.getElementById('resizeLock');
const convertBtn = document.getElementById('convertBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const outputEmpty = document.getElementById('outputEmpty');
const outputPreview = document.getElementById('outputPreview');
const outputMedia = document.getElementById('outputMedia');
const downloadBtn = document.getElementById('downloadBtn');
const historyGrid = document.getElementById('historyGrid');
const historyEmpty = document.getElementById('historyEmpty');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const toastContainer = document.getElementById('toastContainer');

// Format Mappings
const formatsByType = {
    image: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'ico'],
    video: ['mp4', 'webm', 'gif'],
    audio: ['mp3', 'wav', 'ogg', 'webm', 'm4a']
};

const mimeTypes = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4'
};

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
qualitySlider.addEventListener('input', updateQualityValue);
resizeLock.addEventListener('click', toggleAspectRatioLock);
resizeWidth.addEventListener('input', handleWidthChange);
resizeHeight.addEventListener('input', handleHeightChange);
convertBtn.addEventListener('click', performConversion);
downloadBtn.addEventListener('click', downloadConverted);
clearHistoryBtn.addEventListener('click', clearHistory);

// Language selector event listeners
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setLanguage(btn.dataset.lang);
    });
});

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    updatePageLanguage();
});

// Drag and Drop Handlers
function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// File Processing
function processFile(file) {
    currentFile = file;
    selectedFormat = null;
    
    // Update file info
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileType').textContent = file.type || t('unknown');
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    
    // Show file info
    fileInfo.classList.add('active');
    
    // Determine file type and show preview
    const fileType = getFileType(file);
    showPreview(file, fileType);
    
    // Show conversion options
    showConversionOptions(fileType);
    
    // Reset output
    resetOutput();
}

function getFileType(file) {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'unknown';
}

function showPreview(file, fileType) {
    previewContainer.innerHTML = '';
    previewContainer.classList.add('active');
    
    const url = URL.createObjectURL(file);
    
    if (fileType === 'image') {
        const img = document.createElement('img');
        img.src = url;
        img.onload = () => {
            originalDimensions = { width: img.naturalWidth, height: img.naturalHeight };
            document.getElementById('fileDimensions').textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
        };
        previewContainer.appendChild(img);
    } else if (fileType === 'video') {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.onloadedmetadata = () => {
            originalDimensions = { width: video.videoWidth, height: video.videoHeight };
            document.getElementById('fileDimensions').textContent = `${video.videoWidth} × ${video.videoHeight}`;
        };
        previewContainer.appendChild(video);
    } else if (fileType === 'audio') {
        const audio = document.createElement('audio');
        audio.src = url;
        audio.controls = true;
        previewContainer.appendChild(audio);
        document.getElementById('fileDimensions').textContent = t('notApplicable');
    }
}

function showConversionOptions(fileType) {
    conversionSection.style.display = 'block';
    formatGrid.innerHTML = '';
    
    let formats = [];
    
    if (fileType === 'image') {
        formats = [...formatsByType.image];
        resizeSection.classList.add('active');
        qualitySection.style.display = 'block';
    } else if (fileType === 'video') {
        formats = [...formatsByType.video, 'mp3', 'wav'];
        resizeSection.classList.add('active');
        qualitySection.style.display = 'block';
    } else if (fileType === 'audio') {
        formats = formatsByType.audio;
        resizeSection.classList.remove('active');
        qualitySection.style.display = 'block';
    }
    
    // Get current file extension
    const currentExt = currentFile.name.split('.').pop().toLowerCase();
    
    formats.forEach(format => {
        const btn = document.createElement('button');
        btn.className = 'format-btn';
        btn.textContent = format.toUpperCase();
        btn.dataset.format = format;
        
        // Disable current format
        if (format === currentExt) {
            btn.disabled = true;
        }
        
        btn.addEventListener('click', () => selectFormat(format, btn));
        formatGrid.appendChild(btn);
    });
}

function selectFormat(format, btn) {
    // Remove previous selection
    document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('selected'));
    
    // Select new format
    btn.classList.add('selected');
    selectedFormat = format;
    
    // Enable convert button
    convertBtn.disabled = false;
}

// Quality Slider
function updateQualityValue() {
    qualityValue.textContent = qualitySlider.value + '%';
}

// Aspect Ratio Lock
function toggleAspectRatioLock() {
    aspectRatioLocked = !aspectRatioLocked;
    resizeLock.classList.toggle('locked', aspectRatioLocked);
    resizeLock.textContent = aspectRatioLocked ? '🔗' : '🔓';
}

function handleWidthChange() {
    if (aspectRatioLocked && resizeWidth.value && originalDimensions.width) {
        const ratio = originalDimensions.height / originalDimensions.width;
        resizeHeight.value = Math.round(resizeWidth.value * ratio);
    }
}

function handleHeightChange() {
    if (aspectRatioLocked && resizeHeight.value && originalDimensions.height) {
        const ratio = originalDimensions.width / originalDimensions.height;
        resizeWidth.value = Math.round(resizeHeight.value * ratio);
    }
}

// Conversion
async function performConversion() {
    if (!currentFile || !selectedFormat) return;
    
    const fileType = getFileType(currentFile);
    
    // Show progress
    progressContainer.classList.add('active');
    convertBtn.disabled = true;
    progressFill.style.width = '0%';
    progressText.textContent = t('startingConversion');
    
    try {
        let result;
        
        if (fileType === 'image') {
            result = await convertImage();
        } else if (fileType === 'video') {
            result = await convertVideo();
        } else if (fileType === 'audio') {
            result = await convertAudio();
        }
        
        if (result) {
            showOutput(result);
            addToHistory(result);
            showToast(t('conversionSuccess'), 'success');
        }
    } catch (error) {
        console.error('Conversion error:', error);
        showToast(t('conversionError', { message: error.message }), 'error');
    } finally {
        progressContainer.classList.remove('active');
        convertBtn.disabled = false;
    }
}

async function convertImage() {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            progressFill.style.width = '30%';
            progressText.textContent = t('processingImage');
            
            // Determine output dimensions
            let width = resizeWidth.value ? parseInt(resizeWidth.value) : img.naturalWidth;
            let height = resizeHeight.value ? parseInt(resizeHeight.value) : img.naturalHeight;
            
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // Draw image
            ctx.drawImage(img, 0, 0, width, height);
            
            progressFill.style.width = '60%';
            progressText.textContent = t('convertingFormat');
            
            // Get quality
            const quality = qualitySlider.value / 100;
            
            // Convert to blob
            const mimeType = mimeTypes[selectedFormat] || 'image/png';
            
            canvas.toBlob((blob) => {
                if (blob) {
                    progressFill.style.width = '100%';
                    progressText.textContent = t('completed');
                    
                    const fileName = currentFile.name.replace(/\.[^/.]+$/, '') + '.' + selectedFormat;
                    
                    resolve({
                        blob,
                        fileName,
                        format: selectedFormat,
                        dimensions: { width, height },
                        originalSize: currentFile.size,
                        type: 'image'
                    });
                } else {
                    reject(new Error(t('failedToCreateBlob')));
                }
            }, mimeType, quality);
        };
        
        img.onerror = () => reject(new Error(t('failedToLoadImage')));
        img.src = URL.createObjectURL(currentFile);
    });
}

async function convertVideo() {
    progressFill.style.width = '20%';
    progressText.textContent = t('loadingVideo');
    
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    
    return new Promise((resolve, reject) => {
        video.onloadedmetadata = async () => {
            try {
                // Check if converting to audio
                if (['mp3', 'wav', 'ogg', 'm4a'].includes(selectedFormat)) {
                    const result = await extractAudioFromVideo(video);
                    resolve(result);
                    return;
                }
                
                // Check if converting to GIF
                if (selectedFormat === 'gif') {
                    const result = await videoToGif(video);
                    resolve(result);
                    return;
                }
                
                // For video to video conversion, use MediaRecorder
                const result = await recordVideoConversion(video);
                resolve(result);
                
            } catch (error) {
                reject(error);
            }
        };
        
        video.onerror = () => reject(new Error(t('failedToLoadVideo')));
        video.src = URL.createObjectURL(currentFile);
    });
}

async function videoToGif(video) {
    progressText.textContent = t('preparingConversion');
    
    const canvas = document.createElement('canvas');
    let width = resizeWidth.value ? parseInt(resizeWidth.value) : video.videoWidth;
    let height = resizeHeight.value ? parseInt(resizeHeight.value) : video.videoHeight;
    
    // Limit GIF size for performance
    const maxSize = 400;
    if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Capture frames
    const duration = Math.min(video.duration, 8); // Limit to 8 seconds
    const fps = 10;
    const frameCount = Math.floor(duration * fps);
    const frameDelay = Math.round(1000 / fps);
    
    progressText.textContent = t('capturingFrames');
    video.currentTime = 0;
    
    const frames = [];
    
    for (let i = 0; i < frameCount; i++) {
        await new Promise(resolve => {
            video.onseeked = () => {
                ctx.drawImage(video, 0, 0, width, height);
                const imageData = ctx.getImageData(0, 0, width, height);
                frames.push(imageData);
                
                progressFill.style.width = (10 + (i / frameCount) * 40) + '%';
                progressText.textContent = t('capturingFrame', { current: i + 1, total: frameCount });
                resolve();
            };
            video.currentTime = i / fps;
        });
    }
    
    progressText.textContent = t('generatingGif');
    progressFill.style.width = '50%';
    
    // Encode GIF
    const quality = Math.round(1 + ((100 - qualitySlider.value) / 100) * 19); // 1-20, lower = better
    const gifData = await encodeGIF(frames, width, height, frameDelay, quality, (progress) => {
        progressFill.style.width = (50 + progress * 50) + '%';
        progressText.textContent = t('encodingGif', { percent: Math.round(progress * 100) });
    });
    
    const gifBlob = new Blob([gifData], { type: 'image/gif' });
    
    progressFill.style.width = '100%';
    progressText.textContent = t('completed');
    
    const fileName = currentFile.name.replace(/\.[^/.]+$/, '') + '.gif';
    
    return {
        blob: gifBlob,
        fileName,
        format: 'gif',
        dimensions: { width, height },
        originalSize: currentFile.size,
        type: 'image'
    };
}

// GIF Encoder - Pure JavaScript implementation
async function encodeGIF(frames, width, height, delay, quality, onProgress) {
    const encoder = new GIFEncoder(width, height);
    encoder.setRepeat(0); // Loop forever
    encoder.setDelay(delay);
    encoder.setQuality(quality);
    
    encoder.start();
    
    for (let i = 0; i < frames.length; i++) {
        encoder.addFrame(frames[i].data);
        if (onProgress) {
            onProgress((i + 1) / frames.length);
        }
        // Allow UI to update
        await new Promise(r => setTimeout(r, 0));
    }
    
    encoder.finish();
    return encoder.getData();
}

// ==================== GIF ENCODER ====================
// Based on NeuQuant and LZW encoding algorithms

class GIFEncoder {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.data = [];
        this.pixels = null;
        this.indexedPixels = null;
        this.colorDepth = null;
        this.colorTab = null;
        this.usedEntry = [];
        this.palSize = 7;
        this.dispose = -1;
        this.repeat = -1;
        this.delay = 0;
        this.quality = 10;
        this.started = false;
        this.firstFrame = true;
    }

    setDelay(ms) {
        this.delay = Math.round(ms / 10);
    }

    setRepeat(iter) {
        this.repeat = iter;
    }

    setQuality(quality) {
        this.quality = Math.max(1, Math.min(20, quality));
    }

    start() {
        this.started = true;
        this.data = [];
        this.writeString('GIF89a');
    }

    addFrame(imageData) {
        if (!this.started) return;
        
        this.pixels = this.getPixels(imageData);
        this.analyzePixels();
        
        if (this.firstFrame) {
            this.writeLSD();
            this.writePalette();
            if (this.repeat >= 0) {
                this.writeNetscapeExt();
            }
        }
        
        this.writeGraphicCtrlExt();
        this.writeImageDesc();
        if (!this.firstFrame) {
            this.writePalette();
        }
        this.writePixels();
        this.firstFrame = false;
    }

    finish() {
        if (!this.started) return;
        this.started = false;
        this.data.push(0x3B); // GIF trailer
    }

    getData() {
        return new Uint8Array(this.data);
    }

    getPixels(imageData) {
        const pixels = [];
        for (let i = 0; i < imageData.length; i += 4) {
            pixels.push(imageData[i]);     // R
            pixels.push(imageData[i + 1]); // G
            pixels.push(imageData[i + 2]); // B
        }
        return pixels;
    }

    analyzePixels() {
        const len = this.pixels.length;
        const nPix = len / 3;
        
        // Use NeuQuant to build color palette
        const nq = new NeuQuant(this.pixels, len, this.quality);
        this.colorTab = nq.process();
        
        // Map pixels to palette indices
        this.indexedPixels = new Uint8Array(nPix);
        let k = 0;
        for (let i = 0; i < nPix; i++) {
            const index = nq.map(
                this.pixels[k++],
                this.pixels[k++],
                this.pixels[k++]
            );
            this.usedEntry[index] = true;
            this.indexedPixels[i] = index;
        }
        
        this.pixels = null;
        this.colorDepth = 8;
        this.palSize = 7;
    }

    writeLSD() {
        // Logical Screen Descriptor
        this.writeShort(this.width);
        this.writeShort(this.height);
        this.data.push(0x80 | 0x70 | this.palSize); // GCT flag, color resolution, GCT size
        this.data.push(0); // Background color index
        this.data.push(0); // Pixel aspect ratio
    }

    writePalette() {
        this.data.push(...this.colorTab);
        const n = 3 * 256 - this.colorTab.length;
        for (let i = 0; i < n; i++) {
            this.data.push(0);
        }
    }

    writeNetscapeExt() {
        this.data.push(0x21); // Extension
        this.data.push(0xFF); // App extension
        this.data.push(11);   // Block size
        this.writeString('NETSCAPE2.0');
        this.data.push(3);    // Sub-block size
        this.data.push(1);    // Loop sub-block ID
        this.writeShort(this.repeat);
        this.data.push(0);    // Block terminator
    }

    writeGraphicCtrlExt() {
        this.data.push(0x21); // Extension
        this.data.push(0xF9); // GCE
        this.data.push(4);    // Block size
        this.data.push(0);    // Packed fields
        this.writeShort(this.delay);
        this.data.push(0);    // Transparent color index
        this.data.push(0);    // Block terminator
    }

    writeImageDesc() {
        this.data.push(0x2C); // Image separator
        this.writeShort(0);   // Image left
        this.writeShort(0);   // Image top
        this.writeShort(this.width);
        this.writeShort(this.height);
        this.data.push(0x80 | this.palSize); // Local color table
    }

    writePixels() {
        const encoder = new LZWEncoder(this.width, this.height, this.indexedPixels, this.colorDepth);
        encoder.encode(this.data);
    }

    writeShort(val) {
        this.data.push(val & 0xFF);
        this.data.push((val >> 8) & 0xFF);
    }

    writeString(str) {
        for (let i = 0; i < str.length; i++) {
            this.data.push(str.charCodeAt(i));
        }
    }
}

// NeuQuant Neural-Net Quantization Algorithm
class NeuQuant {
    constructor(pixels, len, sample) {
        this.netsize = 256;
        this.prime1 = 499;
        this.prime2 = 491;
        this.prime3 = 487;
        this.prime4 = 503;
        this.minpicturebytes = 3 * this.prime4;
        this.maxnetpos = this.netsize - 1;
        this.netbiasshift = 4;
        this.ncycles = 100;
        this.intbiasshift = 16;
        this.intbias = 1 << this.intbiasshift;
        this.gammashift = 10;
        this.gamma = 1 << this.gammashift;
        this.betashift = 10;
        this.beta = this.intbias >> this.betashift;
        this.betagamma = this.intbias << (this.gammashift - this.betashift);
        this.initrad = this.netsize >> 3;
        this.radiusbiasshift = 6;
        this.radiusbias = 1 << this.radiusbiasshift;
        this.initradius = this.initrad * this.radiusbias;
        this.radiusdec = 30;
        this.alphabiasshift = 10;
        this.initalpha = 1 << this.alphabiasshift;
        this.radbiasshift = 8;
        this.radbias = 1 << this.radbiasshift;
        this.alpharadbshift = this.alphabiasshift + this.radbiasshift;
        this.alpharadbias = 1 << this.alpharadbshift;

        this.thepicture = pixels;
        this.lengthcount = len;
        this.samplefac = sample;

        this.network = [];
        this.netindex = new Int32Array(256);
        this.bias = new Int32Array(this.netsize);
        this.freq = new Int32Array(this.netsize);
        this.radpower = new Int32Array(this.netsize >> 3);

        for (let i = 0; i < this.netsize; i++) {
            this.network[i] = new Float64Array(4);
            const v = (i << (this.netbiasshift + 8)) / this.netsize;
            this.network[i][0] = v;
            this.network[i][1] = v;
            this.network[i][2] = v;
            this.freq[i] = this.intbias / this.netsize;
            this.bias[i] = 0;
        }
    }

    process() {
        this.learn();
        this.unbiasnet();
        this.inxbuild();
        return this.colorMap();
    }

    colorMap() {
        const map = [];
        const index = new Int32Array(this.netsize);
        for (let i = 0; i < this.netsize; i++) {
            index[this.network[i][3] | 0] = i;
        }
        for (let i = 0; i < this.netsize; i++) {
            const j = index[i];
            map.push(this.network[j][0] | 0);
            map.push(this.network[j][1] | 0);
            map.push(this.network[j][2] | 0);
        }
        return map;
    }

    inxbuild() {
        let previouscol = 0;
        let startpos = 0;
        for (let i = 0; i < this.netsize; i++) {
            const p = this.network[i];
            let smallpos = i;
            let smallval = p[1] | 0;
            for (let j = i + 1; j < this.netsize; j++) {
                const q = this.network[j];
                if ((q[1] | 0) < smallval) {
                    smallpos = j;
                    smallval = q[1] | 0;
                }
            }
            const q = this.network[smallpos];
            if (i !== smallpos) {
                [p[0], q[0]] = [q[0], p[0]];
                [p[1], q[1]] = [q[1], p[1]];
                [p[2], q[2]] = [q[2], p[2]];
                [p[3], q[3]] = [q[3], p[3]];
            }
            if (smallval !== previouscol) {
                this.netindex[previouscol] = (startpos + i) >> 1;
                for (let j = previouscol + 1; j < smallval; j++) {
                    this.netindex[j] = i;
                }
                previouscol = smallval;
                startpos = i;
            }
        }
        this.netindex[previouscol] = (startpos + this.maxnetpos) >> 1;
        for (let j = previouscol + 1; j < 256; j++) {
            this.netindex[j] = this.maxnetpos;
        }
    }

    learn() {
        if (this.lengthcount < this.minpicturebytes) {
            this.samplefac = 1;
        }
        const alphadec = 30 + ((this.samplefac - 1) / 3);
        const samplepixels = this.lengthcount / (3 * this.samplefac);
        let delta = (samplepixels / this.ncycles) | 0;
        let alpha = this.initalpha;
        let radius = this.initradius;
        let rad = radius >> this.radiusbiasshift;
        if (rad <= 1) rad = 0;
        for (let i = 0; i < rad; i++) {
            this.radpower[i] = alpha * (((rad * rad - i * i) * this.radbias) / (rad * rad));
        }

        let step;
        if (this.lengthcount < this.minpicturebytes) {
            step = 3;
        } else if (this.lengthcount % this.prime1 !== 0) {
            step = 3 * this.prime1;
        } else if (this.lengthcount % this.prime2 !== 0) {
            step = 3 * this.prime2;
        } else if (this.lengthcount % this.prime3 !== 0) {
            step = 3 * this.prime3;
        } else {
            step = 3 * this.prime4;
        }

        let pix = 0;
        for (let i = 0; i < samplepixels; ) {
            const b = this.thepicture[pix] << this.netbiasshift;
            const g = this.thepicture[pix + 1] << this.netbiasshift;
            const r = this.thepicture[pix + 2] << this.netbiasshift;
            let j = this.contest(b, g, r);
            this.altersingle(alpha, j, b, g, r);
            if (rad !== 0) this.alterneigh(rad, j, b, g, r);

            pix += step;
            if (pix >= this.lengthcount) pix -= this.lengthcount;
            i++;
            if (delta === 0) delta = 1;
            if (i % delta === 0) {
                alpha -= alpha / alphadec;
                radius -= radius / this.radiusdec;
                rad = radius >> this.radiusbiasshift;
                if (rad <= 1) rad = 0;
                for (let k = 0; k < rad; k++) {
                    this.radpower[k] = alpha * (((rad * rad - k * k) * this.radbias) / (rad * rad));
                }
            }
        }
    }

    map(b, g, r) {
        let bestd = 1000;
        let best = -1;
        let i = this.netindex[g];
        let j = i - 1;

        while (i < this.netsize || j >= 0) {
            if (i < this.netsize) {
                const p = this.network[i];
                let dist = (p[1] | 0) - g;
                if (dist >= bestd) {
                    i = this.netsize;
                } else {
                    i++;
                    if (dist < 0) dist = -dist;
                    let a = (p[0] | 0) - b;
                    if (a < 0) a = -a;
                    dist += a;
                    if (dist < bestd) {
                        a = (p[2] | 0) - r;
                        if (a < 0) a = -a;
                        dist += a;
                        if (dist < bestd) {
                            bestd = dist;
                            best = p[3] | 0;
                        }
                    }
                }
            }
            if (j >= 0) {
                const p = this.network[j];
                let dist = g - (p[1] | 0);
                if (dist >= bestd) {
                    j = -1;
                } else {
                    j--;
                    if (dist < 0) dist = -dist;
                    let a = (p[0] | 0) - b;
                    if (a < 0) a = -a;
                    dist += a;
                    if (dist < bestd) {
                        a = (p[2] | 0) - r;
                        if (a < 0) a = -a;
                        dist += a;
                        if (dist < bestd) {
                            bestd = dist;
                            best = p[3] | 0;
                        }
                    }
                }
            }
        }
        return best;
    }

    unbiasnet() {
        for (let i = 0; i < this.netsize; i++) {
            this.network[i][0] >>= this.netbiasshift;
            this.network[i][1] >>= this.netbiasshift;
            this.network[i][2] >>= this.netbiasshift;
            this.network[i][3] = i;
        }
    }

    alterneigh(rad, i, b, g, r) {
        let lo = i - rad;
        if (lo < -1) lo = -1;
        let hi = i + rad;
        if (hi > this.netsize) hi = this.netsize;

        let j = i + 1;
        let k = i - 1;
        let m = 1;
        while (j < hi || k > lo) {
            const a = this.radpower[m++];
            if (j < hi) {
                const p = this.network[j++];
                p[0] -= (a * (p[0] - b)) / this.alpharadbias;
                p[1] -= (a * (p[1] - g)) / this.alpharadbias;
                p[2] -= (a * (p[2] - r)) / this.alpharadbias;
            }
            if (k > lo) {
                const p = this.network[k--];
                p[0] -= (a * (p[0] - b)) / this.alpharadbias;
                p[1] -= (a * (p[1] - g)) / this.alpharadbias;
                p[2] -= (a * (p[2] - r)) / this.alpharadbias;
            }
        }
    }

    altersingle(alpha, i, b, g, r) {
        const p = this.network[i];
        p[0] -= (alpha * (p[0] - b)) / this.initalpha;
        p[1] -= (alpha * (p[1] - g)) / this.initalpha;
        p[2] -= (alpha * (p[2] - r)) / this.initalpha;
    }

    contest(b, g, r) {
        let bestd = ~(1 << 31);
        let bestbiasd = bestd;
        let bestpos = -1;
        let bestbiaspos = bestpos;

        for (let i = 0; i < this.netsize; i++) {
            const p = this.network[i];
            let dist = Math.abs(p[0] - b) + Math.abs(p[1] - g) + Math.abs(p[2] - r);
            if (dist < bestd) {
                bestd = dist;
                bestpos = i;
            }
            const biasdist = dist - (this.bias[i] >> (this.intbiasshift - this.netbiasshift));
            if (biasdist < bestbiasd) {
                bestbiasd = biasdist;
                bestbiaspos = i;
            }
            const betafreq = this.freq[i] >> this.betashift;
            this.freq[i] -= betafreq;
            this.bias[i] += betafreq << this.gammashift;
        }
        this.freq[bestpos] += this.beta;
        this.bias[bestpos] -= this.betagamma;
        return bestbiaspos;
    }
}

// LZW Encoder for GIF
class LZWEncoder {
    constructor(width, height, pixels, colorDepth) {
        this.width = width;
        this.height = height;
        this.pixels = pixels;
        this.colorDepth = Math.max(2, colorDepth);
        this.initCodeSize = this.colorDepth;
        this.accum = new Uint8Array(256);
        this.htab = new Int32Array(5003);
        this.codetab = new Int32Array(5003);
        this.cur_accum = 0;
        this.cur_bits = 0;
        this.a_count = 0;
        this.remaining = 0;
        this.curPixel = 0;
        this.BITS = 12;
        this.HSIZE = 5003;
        this.masks = [
            0x0000, 0x0001, 0x0003, 0x0007, 0x000F, 0x001F,
            0x003F, 0x007F, 0x00FF, 0x01FF, 0x03FF, 0x07FF,
            0x0FFF, 0x1FFF, 0x3FFF, 0x7FFF, 0xFFFF
        ];
    }

    encode(output) {
        this.output = output;
        output.push(this.initCodeSize);
        this.remaining = this.width * this.height;
        this.curPixel = 0;
        this.compress(this.initCodeSize + 1);
        output.push(0);
    }

    compress(initBits) {
        let fcode, c, i, ent, disp, hsize_reg, hshift;

        const g_init_bits = initBits;
        let g_bits = g_init_bits;
        const maxbits = this.BITS;
        let maxcode = (1 << g_bits) - 1;
        const ClearCode = 1 << (initBits - 1);
        const EOFCode = ClearCode + 1;
        let free_ent = ClearCode + 2;

        this.a_count = 0;

        ent = this.nextPixel();

        hshift = 0;
        for (fcode = this.HSIZE; fcode < 65536; fcode *= 2) {
            hshift++;
        }
        hshift = 8 - hshift;
        hsize_reg = this.HSIZE;
        this.cl_hash(hsize_reg);
        this.outputCode(ClearCode);

        outer: while ((c = this.nextPixel()) !== -1) {
            fcode = (c << maxbits) + ent;
            i = (c << hshift) ^ ent;

            if (this.htab[i] === fcode) {
                ent = this.codetab[i];
                continue;
            } else if (this.htab[i] >= 0) {
                disp = hsize_reg - i;
                if (i === 0) disp = 1;
                do {
                    if ((i -= disp) < 0) i += hsize_reg;
                    if (this.htab[i] === fcode) {
                        ent = this.codetab[i];
                        continue outer;
                    }
                } while (this.htab[i] >= 0);
            }

            this.outputCode(ent);
            ent = c;

            if (free_ent < 1 << maxbits) {
                this.codetab[i] = free_ent++;
                this.htab[i] = fcode;
            } else {
                this.cl_hash(hsize_reg);
                free_ent = ClearCode + 2;
                g_bits = g_init_bits;
                maxcode = (1 << g_bits) - 1;
                this.outputCode(ClearCode);
            }
        }

        this.outputCode(ent);
        this.outputCode(EOFCode);
    }

    outputCode(code) {
        this.cur_accum &= this.masks[this.cur_bits];
        if (this.cur_bits > 0) {
            this.cur_accum |= code << this.cur_bits;
        } else {
            this.cur_accum = code;
        }
        this.cur_bits += this.initCodeSize + 1;

        while (this.cur_bits >= 8) {
            this.char_out(this.cur_accum & 0xFF);
            this.cur_accum >>= 8;
            this.cur_bits -= 8;
        }
    }

    char_out(c) {
        this.accum[this.a_count++] = c;
        if (this.a_count >= 254) {
            this.flush_char();
        }
    }

    flush_char() {
        if (this.a_count > 0) {
            this.output.push(this.a_count);
            for (let i = 0; i < this.a_count; i++) {
                this.output.push(this.accum[i]);
            }
            this.a_count = 0;
        }
    }

    cl_hash(hsize) {
        for (let i = 0; i < hsize; i++) {
            this.htab[i] = -1;
        }
    }

    nextPixel() {
        if (this.remaining === 0) return -1;
        this.remaining--;
        return this.pixels[this.curPixel++] & 0xFF;
    }
}

async function recordVideoConversion(video) {
    progressText.textContent = t('preparingConversion');
    
    const canvas = document.createElement('canvas');
    let width = resizeWidth.value ? parseInt(resizeWidth.value) : video.videoWidth;
    let height = resizeHeight.value ? parseInt(resizeHeight.value) : video.videoHeight;
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    const stream = canvas.captureStream(30);
    
    // Add audio track if available
    try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination);
        
        dest.stream.getAudioTracks().forEach(track => {
            stream.addTrack(track);
        });
    } catch (e) {
        console.log('No audio track or audio context error');
    }
    
    const mimeType = selectedFormat === 'webm' ? 'video/webm;codecs=vp9' : 'video/mp4';
    const recorder = new MediaRecorder(stream, { 
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm'
    });
    
    const chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    
    return new Promise((resolve, reject) => {
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const fileName = currentFile.name.replace(/\.[^/.]+$/, '') + '.' + selectedFormat;
            
            progressFill.style.width = '100%';
            progressText.textContent = t('completed');
            
            resolve({
                blob,
                fileName,
                format: selectedFormat,
                dimensions: { width, height },
                originalSize: currentFile.size,
                type: 'video'
            });
        };
        
        recorder.start();
        video.play();
        
        const draw = () => {
            if (video.ended || video.paused) {
                recorder.stop();
                return;
            }
            ctx.drawImage(video, 0, 0, width, height);
            progressFill.style.width = (30 + (video.currentTime / video.duration) * 60) + '%';
            progressText.textContent = t('processingPercent', { percent: Math.round(video.currentTime / video.duration * 100) });
            requestAnimationFrame(draw);
        };
        
        video.onended = () => recorder.stop();
        draw();
    });
}

async function extractAudioFromVideo(video) {
    progressText.textContent = t('extractingAudio');
    
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(video);
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);
    
    const mimeType = 'audio/webm';
    const recorder = new MediaRecorder(dest.stream, { mimeType });
    
    const chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    
    return new Promise((resolve) => {
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const fileName = currentFile.name.replace(/\.[^/.]+$/, '') + '.' + selectedFormat;
            
            progressFill.style.width = '100%';
            progressText.textContent = t('completed');
            
            resolve({
                blob,
                fileName,
                format: selectedFormat,
                dimensions: null,
                originalSize: currentFile.size,
                type: 'audio'
            });
        };
        
        recorder.start();
        video.play();
        
        video.onended = () => recorder.stop();
        
        const updateProgress = () => {
            if (!video.ended && !video.paused) {
                progressFill.style.width = (30 + (video.currentTime / video.duration) * 60) + '%';
                requestAnimationFrame(updateProgress);
            }
        };
        updateProgress();
    });
}

async function convertAudio() {
    progressText.textContent = t('processingAudio');
    progressFill.style.width = '30%';
    
    const audio = document.createElement('audio');
    audio.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
        audio.onloadedmetadata = async () => {
            try {
                const audioCtx = new AudioContext();
                const source = audioCtx.createMediaElementSource(audio);
                const dest = audioCtx.createMediaStreamDestination();
                source.connect(dest);
                source.connect(audioCtx.destination);
                
                const mimeType = 'audio/webm';
                const recorder = new MediaRecorder(dest.stream, { mimeType });
                
                const chunks = [];
                recorder.ondataavailable = e => chunks.push(e.data);
                
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: mimeType });
                    const fileName = currentFile.name.replace(/\.[^/.]+$/, '') + '.' + selectedFormat;
                    
                    progressFill.style.width = '100%';
                    progressText.textContent = t('completed');
                    
                    resolve({
                        blob,
                        fileName,
                        format: selectedFormat,
                        dimensions: null,
                        originalSize: currentFile.size,
                        type: 'audio'
                    });
                };
                
                recorder.start();
                audio.play();
                
                audio.onended = () => recorder.stop();
                
                const updateProgress = () => {
                    if (!audio.ended && !audio.paused) {
                        progressFill.style.width = (30 + (audio.currentTime / audio.duration) * 60) + '%';
                        requestAnimationFrame(updateProgress);
                    }
                };
                updateProgress();
                
            } catch (error) {
                reject(error);
            }
        };
        
        audio.onerror = () => reject(new Error(t('failedToLoadAudio')));
        audio.src = URL.createObjectURL(currentFile);
    });
}

// Output Display
function showOutput(result) {
    convertedBlob = result.blob;
    convertedFileName = result.fileName;
    
    outputEmpty.style.display = 'none';
    outputPreview.classList.add('active');
    
    // Update info
    document.getElementById('outputFormat').textContent = result.format.toUpperCase();
    document.getElementById('outputSize').textContent = formatFileSize(result.blob.size);
    
    if (result.dimensions) {
        document.getElementById('outputDimensions').textContent = 
            `${result.dimensions.width} × ${result.dimensions.height}`;
    } else {
        document.getElementById('outputDimensions').textContent = t('notApplicable');
    }
    
    // Calculate reduction
    const reduction = ((result.originalSize - result.blob.size) / result.originalSize * 100).toFixed(1);
    const reductionText = reduction > 0 ? `-${reduction}%` : `+${Math.abs(reduction)}%`;
    document.getElementById('outputReduction').textContent = reductionText;
    document.getElementById('outputReduction').style.color = 
        reduction > 0 ? 'var(--accent-cyan)' : 'var(--accent-magenta)';
    
    // Show preview
    outputMedia.innerHTML = '';
    const url = URL.createObjectURL(result.blob);
    
    if (result.type === 'image') {
        const img = document.createElement('img');
        img.src = url;
        outputMedia.appendChild(img);
    } else if (result.type === 'video') {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        outputMedia.appendChild(video);
    } else if (result.type === 'audio') {
        const audio = document.createElement('audio');
        audio.src = url;
        audio.controls = true;
        outputMedia.appendChild(audio);
    }
}

function resetOutput() {
    outputEmpty.style.display = 'flex';
    outputPreview.classList.remove('active');
    convertedBlob = null;
    convertedFileName = '';
}

function downloadConverted() {
    if (!convertedBlob || !convertedFileName) return;
    
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = convertedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(t('downloadStarted'), 'success');
}

// History
function addToHistory(result) {
    const historyItem = {
        id: Date.now(),
        blob: result.blob,
        fileName: result.fileName,
        format: result.format,
        originalName: currentFile.name,
        type: result.type,
        timestamp: new Date().toLocaleString(currentLang === 'pt-PT' ? 'pt-PT' : 'en-GB')
    };
    
    conversionHistory.unshift(historyItem);
    
    // Limit history to 10 items
    if (conversionHistory.length > 10) {
        conversionHistory = conversionHistory.slice(0, 10);
    }
    
    renderHistory();
}

function renderHistory() {
    if (conversionHistory.length === 0) {
        historyEmpty.style.display = 'block';
        return;
    }
    
    historyEmpty.style.display = 'none';
    
    // Clear existing items (except empty message)
    const existingItems = historyGrid.querySelectorAll('.history-item');
    existingItems.forEach(item => item.remove());
    
    conversionHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const previewDiv = document.createElement('div');
        previewDiv.className = 'history-item-preview';
        
        const url = URL.createObjectURL(item.blob);
        
        if (item.type === 'image') {
            const img = document.createElement('img');
            img.src = url;
            previewDiv.appendChild(img);
        } else if (item.type === 'video') {
            const video = document.createElement('video');
            video.src = url;
            video.muted = true;
            previewDiv.appendChild(video);
        } else {
            previewDiv.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;">🎵</div>';
        }
        
        div.innerHTML = `
            <div class="history-item-info">
                <div>
                    <div class="history-item-conversion">${item.originalName.split('.').pop().toUpperCase()} → ${item.format.toUpperCase()}</div>
                    <small style="color: var(--text-secondary); font-size: 0.75rem;">${item.timestamp}</small>
                </div>
                <a class="history-item-download" title="${currentLang === 'pt-PT' ? 'Transferir' : 'Download'}">📥</a>
            </div>
        `;
        
        div.insertBefore(previewDiv, div.firstChild);
        
        // Download handler
        div.querySelector('.history-item-download').addEventListener('click', (e) => {
            e.preventDefault();
            const a = document.createElement('a');
            a.href = url;
            a.download = item.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
        
        historyGrid.appendChild(div);
    });
}

function clearHistory() {
    conversionHistory = [];
    renderHistory();
    showToast(t('historyCleared'), 'success');
}

// Utilities
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
        <span class="toast-message">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize
renderHistory();

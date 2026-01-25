import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURAÇÃO DO FFMPEG PARA WINDOWS
// ============================================
const FFMPEG_PATH = 'C:/Users/andre/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.0.1-full_build/bin/ffmpeg.exe';
const FFPROBE_PATH = 'C:/Users/andre/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.0.1-full_build/bin/ffprobe.exe';

// Verifica se os arquivos existem antes de configurar
if (fs.existsSync(FFMPEG_PATH)) {
  ffmpeg.setFfmpegPath(FFMPEG_PATH);
  console.log('✅ FFmpeg encontrado:', FFMPEG_PATH);
} else {
  console.log('⚠️  FFmpeg não encontrado no caminho configurado. Tentando PATH do sistema...');
}

if (fs.existsSync(FFPROBE_PATH)) {
  ffmpeg.setFfprobePath(FFPROBE_PATH);
  console.log('✅ FFprobe encontrado:', FFPROBE_PATH);
} else {
  console.log('⚠️  FFprobe não encontrado no caminho configurado. Tentando PATH do sistema...');
}
// ============================================

const app = express();
const PORT = process.env.PORT || 3001;

// Diretórios
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'outputs');

// Criar diretórios se não existirem
[UPLOAD_DIR, OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/outputs', express.static(OUTPUT_DIR));

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mov|mkv|webm|wmv|flv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                     file.mimetype.startsWith('video/') || 
                     file.mimetype.startsWith('image/');
    
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error('Tipo de arquivo não suportado'));
  }
});

// Store de progresso
const progressStore = new Map();

// Helpers
const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const videoExts = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.wmv', '.flv', '.m4v', '.3gp', '.mpeg', '.mpg', '.ts', '.mts', '.vob'];
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.svg', '.ico', '.heic', '.heif', '.avif'];
  
  if (videoExts.includes(ext)) return 'video';
  if (imageExts.includes(ext)) return 'image';
  return 'unknown';
};

const cleanupFile = (filepath) => {
  setTimeout(() => {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }, 30 * 60 * 1000); // 30 minutos
};

// ===== ROTAS =====

// Upload de arquivo
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  let fileType = getFileType(req.file.filename);
  
  // Fallback para MIME type se extensão não reconhecida
  if (fileType === 'unknown' && req.file.mimetype) {
    if (req.file.mimetype.startsWith('video/')) {
      fileType = 'video';
    } else if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    }
  }

  const fileId = path.parse(req.file.filename).name;

  console.log(`[UPLOAD] File: ${req.file.originalname}, Type: ${fileType}, MIME: ${req.file.mimetype}`);

  res.json({
    success: true,
    fileId,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    type: fileType,
    mimetype: req.file.mimetype,
    path: req.file.path
  });
});

// Obter informações do arquivo
app.get('/api/info/:fileId', async (req, res) => {
  const { fileId } = req.params;
  
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const file = files.find(f => f.startsWith(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const filepath = path.join(UPLOAD_DIR, file);
    const stats = fs.statSync(filepath);
    const fileType = getFileType(file);

    console.log(`[INFO] File: ${file}, Type detected: ${fileType}`);

    if (fileType === 'video') {
      ffmpeg.ffprobe(filepath, (err, metadata) => {
        if (err) {
          console.error('[ERROR] ffprobe error:', err.message);
          // Fallback: retorna info básica como vídeo mesmo com erro
          return res.json({
            type: 'video',
            filename: file,
            size: stats.size,
            duration: 0,
            bitrate: 0,
            width: 0,
            height: 0,
            fps: 0,
            codec: 'unknown',
            audioCodec: 'unknown'
          });
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        let fps = 0;
        try {
          if (videoStream?.r_frame_rate) {
            const [num, den] = videoStream.r_frame_rate.split('/');
            fps = den ? parseInt(num) / parseInt(den) : parseInt(num);
          }
        } catch (e) {
          fps = 0;
        }

        res.json({
          type: 'video',
          filename: file,
          size: stats.size,
          duration: metadata.format.duration || 0,
          bitrate: metadata.format.bit_rate || 0,
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          fps: fps,
          codec: videoStream?.codec_name || 'unknown',
          audioCodec: audioStream?.codec_name || 'none'
        });
      });
    } else if (fileType === 'image') {
      const metadata = await sharp(filepath).metadata();
      
      res.json({
        type: 'image',
        filename: file,
        size: stats.size,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        hasAlpha: metadata.hasAlpha,
        space: metadata.space
      });
    } else {
      res.status(400).json({ error: 'Tipo de arquivo não suportado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Progresso da conversão
app.get('/api/progress/:taskId', (req, res) => {
  const { taskId } = req.params;
  const progress = progressStore.get(taskId) || { percent: 0, status: 'pending' };
  res.json(progress);
});

// ===== CONVERSÃO DE VÍDEO =====

// Vídeo para GIF (alta qualidade)
app.post('/api/convert/video-to-gif', async (req, res) => {
  const { fileId, fps = 15, width = 480, quality = 'high', startTime, duration } = req.body;
  
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const file = files.find(f => f.startsWith(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const inputPath = path.join(UPLOAD_DIR, file);
    const taskId = uuidv4();
    const outputFilename = `${taskId}.gif`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);
    const palettePath = path.join(OUTPUT_DIR, `${taskId}_palette.png`);

    progressStore.set(taskId, { percent: 0, status: 'processing' });

    // Configurações de qualidade
    const qualitySettings = {
      low: { dither: 'none', bayerScale: 5 },
      medium: { dither: 'bayer', bayerScale: 3 },
      high: { dither: 'floyd_steinberg', bayerScale: 2 }
    };

    const settings = qualitySettings[quality] || qualitySettings.high;

    // Passo 1: Gerar paleta otimizada
    const paletteFilters = `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=max_colors=256:stats_mode=diff`;
    
    await new Promise((resolve, reject) => {
      let cmd = ffmpeg(inputPath);
      
      if (startTime) cmd = cmd.setStartTime(startTime);
      if (duration) cmd = cmd.setDuration(duration);
      
      cmd
        .outputOptions(['-vf', paletteFilters])
        .output(palettePath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    progressStore.set(taskId, { percent: 40, status: 'processing' });

    // Passo 2: Aplicar paleta ao GIF
    const gifFilters = `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=${settings.dither}${settings.dither === 'bayer' ? ':bayer_scale=' + settings.bayerScale : ''}`;

    await new Promise((resolve, reject) => {
      let cmd = ffmpeg();
      
      if (startTime) {
        cmd = cmd.input(inputPath).setStartTime(startTime);
        if (duration) cmd = cmd.setDuration(duration);
      } else {
        cmd = cmd.input(inputPath);
        if (duration) cmd = cmd.setDuration(duration);
      }
      
      cmd
        .input(palettePath)
        .complexFilter(gifFilters)
        .output(outputPath)
        .on('progress', (progress) => {
          const percent = 40 + Math.min(progress.percent || 0, 100) * 0.6;
          progressStore.set(taskId, { percent, status: 'processing' });
        })
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Limpar paleta
    if (fs.existsSync(palettePath)) {
      fs.unlinkSync(palettePath);
    }

    progressStore.set(taskId, { percent: 100, status: 'completed' });
    cleanupFile(outputPath);

    res.json({
      success: true,
      taskId,
      filename: outputFilename,
      url: `/outputs/${outputFilename}`
    });

  } catch (error) {
    console.error('Erro na conversão:', error);
    res.status(500).json({ error: error.message });
  }
});

// Converter formato de vídeo
app.post('/api/convert/video', async (req, res) => {
  const { 
    fileId, 
    format = 'mp4', 
    quality = 'medium',
    resolution,
    fps,
    codec = 'libx264'
  } = req.body;
  
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const file = files.find(f => f.startsWith(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const inputPath = path.join(UPLOAD_DIR, file);
    const taskId = uuidv4();
    const outputFilename = `${taskId}.${format}`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    progressStore.set(taskId, { percent: 0, status: 'processing' });

    // CRF por qualidade (menor = melhor qualidade)
    const crfValues = { low: 28, medium: 23, high: 18, ultra: 15 };
    const crf = crfValues[quality] || 23;

    const outputOptions = [
      `-c:v ${codec}`,
      `-crf ${crf}`,
      '-preset medium',
      '-c:a aac',
      '-b:a 128k'
    ];

    if (resolution) {
      outputOptions.push(`-vf scale=${resolution}`);
    }
    if (fps) {
      outputOptions.push(`-r ${fps}`);
    }

    ffmpeg(inputPath)
      .outputOptions(outputOptions)
      .output(outputPath)
      .on('progress', (progress) => {
        progressStore.set(taskId, { 
          percent: Math.min(progress.percent || 0, 99), 
          status: 'processing' 
        });
      })
      .on('end', () => {
        progressStore.set(taskId, { percent: 100, status: 'completed' });
        cleanupFile(outputPath);
        
        res.json({
          success: true,
          taskId,
          filename: outputFilename,
          url: `/outputs/${outputFilename}`
        });
      })
      .on('error', (err) => {
        progressStore.set(taskId, { percent: 0, status: 'error', error: err.message });
        res.status(500).json({ error: err.message });
      })
      .run();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comprimir vídeo
app.post('/api/compress/video', async (req, res) => {
  const { fileId, targetSizeMB, quality = 'medium' } = req.body;
  
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const file = files.find(f => f.startsWith(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const inputPath = path.join(UPLOAD_DIR, file);
    const taskId = uuidv4();
    const ext = path.extname(file);
    const outputFilename = `${taskId}_compressed${ext}`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    progressStore.set(taskId, { percent: 0, status: 'processing' });

    // Obter duração do vídeo
    const metadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const duration = metadata.format.duration;
    let videoBitrate;

    if (targetSizeMB) {
      // Calcular bitrate para atingir tamanho alvo
      const targetBits = targetSizeMB * 8 * 1024 * 1024;
      const audioBits = 128 * 1024 * duration;
      videoBitrate = Math.floor((targetBits - audioBits) / duration);
    } else {
      // Bitrates por qualidade
      const bitrates = { low: 500000, medium: 1000000, high: 2000000 };
      videoBitrate = bitrates[quality] || 1000000;
    }

    ffmpeg(inputPath)
      .outputOptions([
        `-b:v ${videoBitrate}`,
        '-c:v libx264',
        '-preset slow',
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart'
      ])
      .output(outputPath)
      .on('progress', (progress) => {
        progressStore.set(taskId, { 
          percent: Math.min(progress.percent || 0, 99), 
          status: 'processing' 
        });
      })
      .on('end', () => {
        const stats = fs.statSync(outputPath);
        progressStore.set(taskId, { percent: 100, status: 'completed' });
        cleanupFile(outputPath);
        
        res.json({
          success: true,
          taskId,
          filename: outputFilename,
          url: `/outputs/${outputFilename}`,
          originalSize: metadata.format.size,
          compressedSize: stats.size,
          compressionRatio: ((1 - stats.size / metadata.format.size) * 100).toFixed(1)
        });
      })
      .on('error', (err) => {
        progressStore.set(taskId, { percent: 0, status: 'error', error: err.message });
        res.status(500).json({ error: err.message });
      })
      .run();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Extrair áudio do vídeo
app.post('/api/extract/audio', async (req, res) => {
  const { fileId, format = 'mp3', bitrate = '192k' } = req.body;
  
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const file = files.find(f => f.startsWith(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const inputPath = path.join(UPLOAD_DIR, file);
    const taskId = uuidv4();
    const outputFilename = `${taskId}.${format}`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    progressStore.set(taskId, { percent: 0, status: 'processing' });

    const codecMap = { mp3: 'libmp3lame', aac: 'aac', wav: 'pcm_s16le', ogg: 'libvorbis' };
    const codec = codecMap[format] || 'libmp3lame';

    ffmpeg(inputPath)
      .noVideo()
      .audioCodec(codec)
      .audioBitrate(bitrate)
      .output(outputPath)
      .on('progress', (progress) => {
        progressStore.set(taskId, { 
          percent: Math.min(progress.percent || 0, 99), 
          status: 'processing' 
        });
      })
      .on('end', () => {
        progressStore.set(taskId, { percent: 100, status: 'completed' });
        cleanupFile(outputPath);
        res.json({
          success: true,
          taskId,
          filename: outputFilename,
          url: `/outputs/${outputFilename}`
        });
      })
      .on('error', (err) => {
        progressStore.set(taskId, { percent: 0, status: 'error', error: err.message });
        res.status(500).json({ error: err.message });
      })
      .run();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cortar vídeo (trim)
app.post('/api/trim/video', async (req, res) => {
  const { fileId, startTime, endTime } = req.body;
  
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const file = files.find(f => f.startsWith(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    if (startTime === undefined || endTime === undefined) {
      return res.status(400).json({ error: 'startTime e endTime são obrigatórios' });
    }

    const inputPath = path.join(UPLOAD_DIR, file);
    const taskId = uuidv4();
    const ext = path.extname(file);
    const outputFilename = `${taskId}_trimmed${ext}`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    progressStore.set(taskId, { percent: 0, status: 'processing' });

    // Calcula a duração
    const duration = endTime - startTime;

    // Retorna o taskId imediatamente para o cliente poder acompanhar
    res.json({
      success: true,
      taskId,
      filename: outputFilename,
      url: `/outputs/${outputFilename}`,
      processing: true
    });

    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .outputOptions([
        '-c:v libx264',
        '-crf 18',
        '-preset fast',
        '-c:a aac',
        '-b:a 192k',
        '-avoid_negative_ts make_zero'
      ])
      .output(outputPath)
      .on('progress', (progress) => {
        // Calcula progresso baseado no tempo processado vs duração do corte
        let percent = 0;
        if (progress.timemark) {
          const parts = progress.timemark.split(':');
          const processedSeconds = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
          percent = Math.min((processedSeconds / duration) * 100, 99);
        }
        progressStore.set(taskId, { 
          percent: Math.round(percent), 
          status: 'processing' 
        });
      })
      .on('end', () => {
        const stats = fs.statSync(outputPath);
        progressStore.set(taskId, { 
          percent: 100, 
          status: 'completed',
          url: `/outputs/${outputFilename}`,
          filename: outputFilename,
          size: stats.size
        });
        cleanupFile(outputPath);
      })
      .on('error', (err) => {
        console.error('Trim error:', err);
        progressStore.set(taskId, { percent: 0, status: 'error', error: err.message });
      })
      .run();

  } catch (error) {
    console.error('Trim error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== CONVERSÃO/EDIÇÃO DE IMAGEM =====

// Converter formato de imagem
app.post('/api/convert/image', async (req, res) => {
  const { fileId, format = 'webp', quality = 80 } = req.body;
  
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const file = files.find(f => f.startsWith(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const inputPath = path.join(UPLOAD_DIR, file);
    const taskId = uuidv4();
    const outputFilename = `${taskId}.${format}`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    let sharpInstance = sharp(inputPath);

    switch (format) {
      case 'jpeg':
      case 'jpg':
        sharpInstance = sharpInstance.jpeg({ quality });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ compressionLevel: Math.floor((100 - quality) / 10) });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality });
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif({ quality });
        break;
      case 'gif':
        sharpInstance = sharpInstance.gif();
        break;
      default:
        sharpInstance = sharpInstance.toFormat(format);
    }

    await sharpInstance.toFile(outputPath);
    cleanupFile(outputPath);

    const stats = fs.statSync(outputPath);

    res.json({
      success: true,
      taskId,
      filename: outputFilename,
      url: `/outputs/${outputFilename}`,
      size: stats.size
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comprimir imagem
app.post('/api/compress/image', async (req, res) => {
  const { fileId, quality = 70, maxWidth, maxHeight } = req.body;
  
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const file = files.find(f => f.startsWith(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const inputPath = path.join(UPLOAD_DIR, file);
    const taskId = uuidv4();
    const ext = path.extname(file).toLowerCase();
    const outputFilename = `${taskId}_compressed${ext === '.png' ? '.png' : '.jpg'}`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    const originalStats = fs.statSync(inputPath);
    let sharpInstance = sharp(inputPath);

    // Redimensionar se necessário
    if (maxWidth || maxHeight) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Aplicar compressão baseada no formato
    if (ext === '.png') {
      sharpInstance = sharpInstance.png({ 
        compressionLevel: 9,
        palette: true,
        quality
      });
    } else {
      sharpInstance = sharpInstance.jpeg({ 
        quality,
        mozjpeg: true
      });
    }

    await sharpInstance.toFile(outputPath);
    cleanupFile(outputPath);

    const compressedStats = fs.statSync(outputPath);

    res.json({
      success: true,
      taskId,
      filename: outputFilename,
      url: `/outputs/${outputFilename}`,
      originalSize: originalStats.size,
      compressedSize: compressedStats.size,
      compressionRatio: ((1 - compressedStats.size / originalStats.size) * 100).toFixed(1)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Redimensionar imagem
app.post('/api/resize/image', async (req, res) => {
  const { fileId, width, height, fit = 'cover', format } = req.body;
  
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const file = files.find(f => f.startsWith(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const inputPath = path.join(UPLOAD_DIR, file);
    const taskId = uuidv4();
    const outputFormat = format || path.extname(file).slice(1);
    const outputFilename = `${taskId}_resized.${outputFormat}`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    await sharp(inputPath)
      .resize(width, height, { fit, background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFormat(outputFormat)
      .toFile(outputPath);

    cleanupFile(outputPath);

    const metadata = await sharp(outputPath).metadata();

    res.json({
      success: true,
      taskId,
      filename: outputFilename,
      url: `/outputs/${outputFilename}`,
      width: metadata.width,
      height: metadata.height
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Aplicar filtros na imagem
app.post('/api/filter/image', async (req, res) => {
  const { fileId, filters = {} } = req.body;
  
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const file = files.find(f => f.startsWith(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const inputPath = path.join(UPLOAD_DIR, file);
    const taskId = uuidv4();
    const ext = path.extname(file);
    const outputFilename = `${taskId}_filtered${ext}`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    let sharpInstance = sharp(inputPath);

    // Aplicar filtros
    if (filters.grayscale) {
      sharpInstance = sharpInstance.grayscale();
    }
    if (filters.blur) {
      sharpInstance = sharpInstance.blur(filters.blur);
    }
    if (filters.sharpen) {
      sharpInstance = sharpInstance.sharpen(filters.sharpen);
    }
    if (filters.brightness) {
      sharpInstance = sharpInstance.modulate({ brightness: filters.brightness });
    }
    if (filters.saturation) {
      sharpInstance = sharpInstance.modulate({ saturation: filters.saturation });
    }
    if (filters.hue) {
      sharpInstance = sharpInstance.modulate({ hue: filters.hue });
    }
    if (filters.rotate) {
      sharpInstance = sharpInstance.rotate(filters.rotate);
    }
    if (filters.flip) {
      sharpInstance = sharpInstance.flip();
    }
    if (filters.flop) {
      sharpInstance = sharpInstance.flop();
    }
    if (filters.negate) {
      sharpInstance = sharpInstance.negate();
    }
    if (filters.tint) {
      sharpInstance = sharpInstance.tint(filters.tint);
    }

    await sharpInstance.toFile(outputPath);
    cleanupFile(outputPath);

    res.json({
      success: true,
      taskId,
      filename: outputFilename,
      url: `/outputs/${outputFilename}`
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crop de imagem
app.post('/api/crop/image', async (req, res) => {
  const { fileId, left, top, width, height } = req.body;
  
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const file = files.find(f => f.startsWith(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const inputPath = path.join(UPLOAD_DIR, file);
    const taskId = uuidv4();
    const ext = path.extname(file);
    const outputFilename = `${taskId}_cropped${ext}`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    await sharp(inputPath)
      .extract({ left: Math.round(left), top: Math.round(top), width: Math.round(width), height: Math.round(height) })
      .toFile(outputPath);

    cleanupFile(outputPath);

    res.json({
      success: true,
      taskId,
      filename: outputFilename,
      url: `/outputs/${outputFilename}`
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download de arquivo
app.get('/api/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(OUTPUT_DIR, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }

  res.download(filepath);
});

// Limpar arquivo
app.delete('/api/file/:fileId', (req, res) => {
  const { fileId } = req.params;
  
  try {
    // Limpar uploads
    const uploadFiles = fs.readdirSync(UPLOAD_DIR).filter(f => f.startsWith(fileId));
    uploadFiles.forEach(f => fs.unlinkSync(path.join(UPLOAD_DIR, f)));

    // Limpar outputs
    const outputFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.startsWith(fileId));
    outputFiles.forEach(f => fs.unlinkSync(path.join(OUTPUT_DIR, f)));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    ffmpeg: true,
    sharp: true
  });
});

// Preview de arquivo (servir arquivo original para preview)
app.get('/api/preview/:fileId', (req, res) => {
  const { fileId } = req.params;
  
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const file = files.find(f => f.startsWith(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const filepath = path.join(UPLOAD_DIR, file);
    const ext = path.extname(file).toLowerCase();
    
    // Define content-type baseado na extensão
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const stat = fs.statSync(filepath);

    // Suporte a range requests para streaming de vídeo
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });

      fs.createReadStream(filepath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': contentType
      });

      fs.createReadStream(filepath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gerar thumbnail de vídeo
app.get('/api/thumbnail/:fileId', async (req, res) => {
  const { fileId } = req.params;
  const { time = '00:00:01' } = req.query;
  
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const file = files.find(f => f.startsWith(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const filepath = path.join(UPLOAD_DIR, file);
    const thumbnailPath = path.join(OUTPUT_DIR, `${fileId}_thumb.jpg`);

    // Gera thumbnail se não existir
    if (!fs.existsSync(thumbnailPath)) {
      await new Promise((resolve, reject) => {
        ffmpeg(filepath)
          .screenshots({
            timestamps: [time],
            filename: `${fileId}_thumb.jpg`,
            folder: OUTPUT_DIR,
            size: '480x?'
          })
          .on('end', resolve)
          .on('error', reject);
      });
    }

    res.sendFile(thumbnailPath);
  } catch (error) {
    console.error('Thumbnail error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Uploads: ${UPLOAD_DIR}`);
  console.log(`📤 Outputs: ${OUTPUT_DIR}`);
});

import React, { useState, useEffect, useRef } from 'react';
import { 
  Film, Wand2, Music, Minimize2, Loader2, Download, CheckCircle2, 
  Scissors, Clock, AlertCircle
} from 'lucide-react';
import { formatFileSize, formatDuration } from '../utils/format';

export default function VideoPanel({ fileId, fileInfo, api }) {
  const [activeTab, setActiveTab] = useState('trim');
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const progressInterval = useRef(null);

  // Trim options
  const [trimOptions, setTrimOptions] = useState({
    startTime: 0,
    endTime: fileInfo?.duration || 10
  });

  // GIF options
  const [gifOptions, setGifOptions] = useState({
    fps: 15,
    width: 480,
    quality: 'high'
  });

  // Convert options
  const [convertOptions, setConvertOptions] = useState({
    format: 'mp4',
    quality: 'medium',
    resolution: ''
  });

  // Compress options
  const [compressOptions, setCompressOptions] = useState({
    quality: 'medium',
    targetSizeMB: ''
  });

  // Audio options
  const [audioOptions, setAudioOptions] = useState({
    format: 'mp3',
    bitrate: '192k'
  });

  // Update endTime when fileInfo loads
  useEffect(() => {
    if (fileInfo?.duration) {
      setTrimOptions(prev => ({
        ...prev,
        endTime: fileInfo.duration
      }));
    }
  }, [fileInfo?.duration]);

  // Poll progress
  useEffect(() => {
    if (taskId && processing) {
      progressInterval.current = setInterval(async () => {
        const progress = await api.getProgress(taskId);
        setProgressPercent(progress.percent || 0);
        setProgressStatus(progress.status);

        if (progress.status === 'completed') {
          clearInterval(progressInterval.current);
          setProcessing(false);
          setResult({
            success: true,
            taskId,
            url: progress.url,
            filename: progress.filename,
            size: progress.size
          });
        } else if (progress.status === 'error') {
          clearInterval(progressInterval.current);
          setProcessing(false);
          setResult({ error: progress.error });
        }
      }, 500);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [taskId, processing, api]);

  const startProcessing = (id, initialPercent = 0) => {
    setTaskId(id);
    setProgressPercent(initialPercent);
    setProgressStatus('processing');
    setProcessing(true);
    setResult(null);
  };

  const handleTrim = async () => {
    try {
      const res = await api.trimVideo(fileId, trimOptions.startTime, trimOptions.endTime);
      if (res.processing) {
        startProcessing(res.taskId);
      } else {
        setResult(res);
      }
    } catch (err) {
      console.error(err);
      setProcessing(false);
    }
  };

  const handleConvertToGif = async () => {
    startProcessing(null, 0);
    try {
      const res = await api.convertVideoToGif(fileId, {
        ...gifOptions,
        startTime: trimOptions.startTime,
        duration: trimOptions.endTime - trimOptions.startTime
      });
      setResult({ ...res, type: 'gif' });
      setProcessing(false);
    } catch (err) {
      console.error(err);
      setProcessing(false);
    }
  };

  const handleConvert = async () => {
    startProcessing(null, 0);
    try {
      const res = await api.convertVideo(fileId, convertOptions);
      if (res.taskId) {
        setTaskId(res.taskId);
      } else {
        setResult({ ...res, type: 'video' });
        setProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setProcessing(false);
    }
  };

  const handleCompress = async () => {
    startProcessing(null, 0);
    try {
      const opts = { ...compressOptions };
      if (opts.targetSizeMB) {
        opts.targetSizeMB = parseFloat(opts.targetSizeMB);
      } else {
        delete opts.targetSizeMB;
      }
      const res = await api.compressVideo(fileId, opts);
      if (res.taskId) {
        setTaskId(res.taskId);
      } else {
        setResult({ ...res, type: 'compress' });
        setProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setProcessing(false);
    }
  };

  const handleExtractAudio = async () => {
    startProcessing(null, 0);
    try {
      const res = await api.extractAudio(fileId, audioOptions);
      if (res.taskId) {
        setTaskId(res.taskId);
      } else {
        setResult({ ...res, type: 'audio' });
        setProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setProcessing(false);
    }
  };

  const tabs = [
    { id: 'trim', label: 'Cortar', icon: <Scissors className="w-4 h-4" /> },
    { id: 'gif', label: 'Vídeo → GIF', icon: <Wand2 className="w-4 h-4" /> },
    { id: 'convert', label: 'Converter', icon: <Film className="w-4 h-4" /> },
    { id: 'compress', label: 'Comprimir', icon: <Minimize2 className="w-4 h-4" /> },
    { id: 'audio', label: 'Extrair Áudio', icon: <Music className="w-4 h-4" /> }
  ];

  const duration = fileInfo?.duration || 0;

  return (
    <div className="glass-card p-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setResult(null);
              setProcessing(false);
              setProgressPercent(0);
            }}
            disabled={processing}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl font-display text-sm font-medium
              transition-all duration-200 whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 text-white border border-neon-blue/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }
              ${processing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Processing Indicator */}
      {processing && (
        <div className="mb-6 p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-neon-blue animate-spin" />
            <span className="font-display font-semibold text-white">
              A converter... {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill transition-all duration-300" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Por favor aguarde, isto pode demorar alguns minutos...
          </p>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {/* Trim Tab */}
        {activeTab === 'trim' && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Defina o ponto de início e fim para cortar o vídeo.
            </p>

            {/* Time Range Selector */}
            <div className="bg-dark-700/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Duração total:</span>
                  <span className="text-sm text-white font-mono">{formatDuration(duration)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Selecionado: </span>
                  <span className="text-neon-blue font-mono">
                    {formatDuration(trimOptions.endTime - trimOptions.startTime)}
                  </span>
                </div>
              </div>

              {/* Visual Range */}
              <div className="relative h-12 bg-dark-600 rounded-lg mb-4 overflow-hidden">
                {/* Selected range highlight */}
                <div 
                  className="absolute top-0 bottom-0 bg-neon-blue/30 border-x-2 border-neon-blue"
                  style={{
                    left: `${(trimOptions.startTime / duration) * 100}%`,
                    right: `${100 - (trimOptions.endTime / duration) * 100}%`
                  }}
                />
                
                {/* Time markers */}
                <div className="absolute inset-0 flex items-center justify-between px-2">
                  <span className="text-xs text-white font-mono bg-dark-800/80 px-1 rounded">
                    {formatDuration(trimOptions.startTime)}
                  </span>
                  <span className="text-xs text-white font-mono bg-dark-800/80 px-1 rounded">
                    {formatDuration(trimOptions.endTime)}
                  </span>
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-text flex items-center justify-between">
                    <span>Início</span>
                    <span className="text-neon-blue font-mono">{formatDuration(trimOptions.startTime)}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={trimOptions.startTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < trimOptions.endTime) {
                        setTrimOptions({ ...trimOptions, startTime: val });
                      }
                    }}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="label-text flex items-center justify-between">
                    <span>Fim</span>
                    <span className="text-neon-blue font-mono">{formatDuration(trimOptions.endTime)}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={trimOptions.endTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val > trimOptions.startTime) {
                        setTrimOptions({ ...trimOptions, endTime: val });
                      }
                    }}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-xs text-gray-500">Presets:</span>
                {[
                  { label: 'Primeiros 10s', start: 0, end: Math.min(10, duration) },
                  { label: 'Primeiros 30s', start: 0, end: Math.min(30, duration) },
                  { label: 'Último minuto', start: Math.max(0, duration - 60), end: duration },
                  { label: 'Tudo', start: 0, end: duration }
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => setTrimOptions({ startTime: preset.start, endTime: preset.end })}
                    className="px-2 py-1 text-xs bg-dark-600 text-gray-400 rounded hover:bg-dark-500 hover:text-white transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleTrim}
              disabled={processing || trimOptions.startTime >= trimOptions.endTime}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scissors className="w-5 h-5" />}
              {processing ? `A cortar... ${Math.round(progressPercent)}%` : 'Cortar Vídeo'}
            </button>
          </div>
        )}

        {/* GIF Tab */}
        {activeTab === 'gif' && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Converta seu vídeo para GIF com alta qualidade. Usa a seleção de tempo do separador "Cortar".
            </p>

            {trimOptions.startTime > 0 || trimOptions.endTime < duration ? (
              <div className="flex items-center gap-2 p-2 bg-neon-blue/10 border border-neon-blue/20 rounded-lg text-sm">
                <Clock className="w-4 h-4 text-neon-blue" />
                <span className="text-gray-300">
                  Usando seleção: {formatDuration(trimOptions.startTime)} - {formatDuration(trimOptions.endTime)}
                </span>
              </div>
            ) : null}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label-text">FPS</label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={gifOptions.fps}
                  onChange={(e) => setGifOptions({ ...gifOptions, fps: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-sm text-neon-blue mt-1">{gifOptions.fps} fps</div>
              </div>

              <div>
                <label className="label-text">Largura</label>
                <select
                  value={gifOptions.width}
                  onChange={(e) => setGifOptions({ ...gifOptions, width: parseInt(e.target.value) })}
                  className="select-field"
                >
                  <option value={320}>320px</option>
                  <option value={480}>480px</option>
                  <option value={640}>640px</option>
                  <option value={720}>720px</option>
                  <option value={1080}>1080px</option>
                </select>
              </div>

              <div>
                <label className="label-text">Qualidade</label>
                <select
                  value={gifOptions.quality}
                  onChange={(e) => setGifOptions({ ...gifOptions, quality: e.target.value })}
                  className="select-field"
                >
                  <option value="low">Baixa (menor tamanho)</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta (melhor qualidade)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleConvertToGif}
              disabled={processing}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              {processing ? `A converter... ${Math.round(progressPercent)}%` : 'Converter para GIF'}
            </button>
          </div>
        )}

        {/* Convert Tab */}
        {activeTab === 'convert' && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Converta seu vídeo para diferentes formatos.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label-text">Formato</label>
                <select
                  value={convertOptions.format}
                  onChange={(e) => setConvertOptions({ ...convertOptions, format: e.target.value })}
                  className="select-field"
                >
                  <option value="mp4">MP4</option>
                  <option value="webm">WebM</option>
                  <option value="avi">AVI</option>
                  <option value="mkv">MKV</option>
                  <option value="mov">MOV</option>
                </select>
              </div>

              <div>
                <label className="label-text">Qualidade</label>
                <select
                  value={convertOptions.quality}
                  onChange={(e) => setConvertOptions({ ...convertOptions, quality: e.target.value })}
                  className="select-field"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="ultra">Ultra</option>
                </select>
              </div>

              <div>
                <label className="label-text">Resolução (opcional)</label>
                <select
                  value={convertOptions.resolution}
                  onChange={(e) => setConvertOptions({ ...convertOptions, resolution: e.target.value })}
                  className="select-field"
                >
                  <option value="">Original</option>
                  <option value="1920:1080">1080p</option>
                  <option value="1280:720">720p</option>
                  <option value="854:480">480p</option>
                  <option value="640:360">360p</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleConvert}
              disabled={processing}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Film className="w-5 h-5" />}
              {processing ? `A converter... ${Math.round(progressPercent)}%` : 'Converter Vídeo'}
            </button>
          </div>
        )}

        {/* Compress Tab */}
        {activeTab === 'compress' && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Reduza o tamanho do seu vídeo mantendo a melhor qualidade possível.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Qualidade</label>
                <select
                  value={compressOptions.quality}
                  onChange={(e) => setCompressOptions({ ...compressOptions, quality: e.target.value })}
                  className="select-field"
                >
                  <option value="low">Baixa (~500kbps)</option>
                  <option value="medium">Média (~1Mbps)</option>
                  <option value="high">Alta (~2Mbps)</option>
                </select>
              </div>

              <div>
                <label className="label-text">Tamanho alvo (MB) - opcional</label>
                <input
                  type="number"
                  value={compressOptions.targetSizeMB}
                  onChange={(e) => setCompressOptions({ ...compressOptions, targetSizeMB: e.target.value })}
                  placeholder="Ex: 10"
                  className="input-field"
                />
              </div>
            </div>

            <button
              onClick={handleCompress}
              disabled={processing}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Minimize2 className="w-5 h-5" />}
              {processing ? `A comprimir... ${Math.round(progressPercent)}%` : 'Comprimir Vídeo'}
            </button>
          </div>
        )}

        {/* Audio Tab */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Extraia a faixa de áudio do seu vídeo.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Formato</label>
                <select
                  value={audioOptions.format}
                  onChange={(e) => setAudioOptions({ ...audioOptions, format: e.target.value })}
                  className="select-field"
                >
                  <option value="mp3">MP3</option>
                  <option value="aac">AAC</option>
                  <option value="wav">WAV</option>
                  <option value="ogg">OGG</option>
                </select>
              </div>

              <div>
                <label className="label-text">Bitrate</label>
                <select
                  value={audioOptions.bitrate}
                  onChange={(e) => setAudioOptions({ ...audioOptions, bitrate: e.target.value })}
                  className="select-field"
                >
                  <option value="128k">128 kbps</option>
                  <option value="192k">192 kbps</option>
                  <option value="256k">256 kbps</option>
                  <option value="320k">320 kbps</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleExtractAudio}
              disabled={processing}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Music className="w-5 h-5" />}
              {processing ? `A extrair... ${Math.round(progressPercent)}%` : 'Extrair Áudio'}
            </button>
          </div>
        )}

        {/* Result */}
        {result && !result.error && (
          <div className="mt-6 p-4 bg-neon-green/10 border border-neon-green/30 rounded-xl animate-in">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-6 h-6 text-neon-green" />
              <span className="font-display font-semibold text-white">Processamento concluído!</span>
            </div>

            {result.compressionRatio && (
              <p className="text-sm text-gray-300 mb-3">
                Redução de <span className="text-neon-green font-semibold">{result.compressionRatio}%</span>
                {' '}({formatFileSize(result.originalSize)} → {formatFileSize(result.compressedSize)})
              </p>
            )}

            {result.size && (
              <p className="text-sm text-gray-300 mb-3">
                Tamanho: <span className="text-neon-blue font-semibold">{formatFileSize(result.size)}</span>
              </p>
            )}

            <a
              href={result.url}
              download={result.filename}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar {result.filename}
            </a>
          </div>
        )}

        {/* Error */}
        {result?.error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <span className="font-display font-semibold text-white">Erro no processamento</span>
            </div>
            <p className="text-sm text-gray-300 mt-2">{result.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

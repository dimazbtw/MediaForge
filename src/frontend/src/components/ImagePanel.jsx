import React, { useState } from 'react';
import { 
  Image, Minimize2, Maximize2, Palette, Loader2, Download, CheckCircle2,
  RotateCw, FlipHorizontal, FlipVertical, Sun, Contrast
} from 'lucide-react';
import { formatFileSize } from '../utils/format';

export default function ImagePanel({ fileId, fileInfo, api }) {
  const [activeTab, setActiveTab] = useState('convert');
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Convert options
  const [convertOptions, setConvertOptions] = useState({
    format: 'webp',
    quality: 80
  });

  // Compress options
  const [compressOptions, setCompressOptions] = useState({
    quality: 70,
    maxWidth: '',
    maxHeight: ''
  });

  // Resize options
  const [resizeOptions, setResizeOptions] = useState({
    width: fileInfo?.width || 800,
    height: fileInfo?.height || 600,
    fit: 'cover'
  });

  // Filter options
  const [filters, setFilters] = useState({
    grayscale: false,
    negate: false,
    flip: false,
    flop: false,
    rotate: 0,
    blur: 0,
    sharpen: 0,
    brightness: 1,
    saturation: 1
  });

  const handleConvert = async () => {
    setProcessing(true);
    setResult(null);
    try {
      const res = await api.convertImage(fileId, convertOptions);
      setResult({ ...res, type: 'convert' });
    } catch (err) {
      console.error(err);
    }
    setProcessing(false);
  };

  const handleCompress = async () => {
    setProcessing(true);
    setResult(null);
    try {
      const opts = { ...compressOptions };
      if (opts.maxWidth) opts.maxWidth = parseInt(opts.maxWidth);
      else delete opts.maxWidth;
      if (opts.maxHeight) opts.maxHeight = parseInt(opts.maxHeight);
      else delete opts.maxHeight;
      
      const res = await api.compressImage(fileId, opts);
      setResult({ ...res, type: 'compress' });
    } catch (err) {
      console.error(err);
    }
    setProcessing(false);
  };

  const handleResize = async () => {
    setProcessing(true);
    setResult(null);
    try {
      const res = await api.resizeImage(fileId, resizeOptions);
      setResult({ ...res, type: 'resize' });
    } catch (err) {
      console.error(err);
    }
    setProcessing(false);
  };

  const handleApplyFilters = async () => {
    setProcessing(true);
    setResult(null);
    try {
      const activeFilters = {};
      if (filters.grayscale) activeFilters.grayscale = true;
      if (filters.negate) activeFilters.negate = true;
      if (filters.flip) activeFilters.flip = true;
      if (filters.flop) activeFilters.flop = true;
      if (filters.rotate !== 0) activeFilters.rotate = filters.rotate;
      if (filters.blur > 0) activeFilters.blur = filters.blur;
      if (filters.sharpen > 0) activeFilters.sharpen = filters.sharpen;
      if (filters.brightness !== 1) activeFilters.brightness = filters.brightness;
      if (filters.saturation !== 1) activeFilters.saturation = filters.saturation;

      const res = await api.applyImageFilters(fileId, activeFilters);
      setResult({ ...res, type: 'filter' });
    } catch (err) {
      console.error(err);
    }
    setProcessing(false);
  };

  const tabs = [
    { id: 'convert', label: 'Converter', icon: <Image className="w-4 h-4" /> },
    { id: 'compress', label: 'Comprimir', icon: <Minimize2 className="w-4 h-4" /> },
    { id: 'resize', label: 'Redimensionar', icon: <Maximize2 className="w-4 h-4" /> },
    { id: 'filters', label: 'Filtros', icon: <Palette className="w-4 h-4" /> }
  ];

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
            }}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl font-display text-sm font-medium
              transition-all duration-200 whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 text-white border border-neon-purple/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Convert Tab */}
        {activeTab === 'convert' && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Converta sua imagem para diferentes formatos.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Formato</label>
                <select
                  value={convertOptions.format}
                  onChange={(e) => setConvertOptions({ ...convertOptions, format: e.target.value })}
                  className="select-field"
                >
                  <option value="webp">WebP (recomendado)</option>
                  <option value="jpg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="avif">AVIF</option>
                  <option value="gif">GIF</option>
                </select>
              </div>

              <div>
                <label className="label-text">Qualidade: {convertOptions.quality}%</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={convertOptions.quality}
                  onChange={(e) => setConvertOptions({ ...convertOptions, quality: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <button
              onClick={handleConvert}
              disabled={processing}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Image className="w-5 h-5" />}
              {processing ? 'Convertendo...' : 'Converter Imagem'}
            </button>
          </div>
        )}

        {/* Compress Tab */}
        {activeTab === 'compress' && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Reduza o tamanho do arquivo mantendo a qualidade visual.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label-text">Qualidade: {compressOptions.quality}%</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={compressOptions.quality}
                  onChange={(e) => setCompressOptions({ ...compressOptions, quality: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="label-text">Largura máx. (px)</label>
                <input
                  type="number"
                  value={compressOptions.maxWidth}
                  onChange={(e) => setCompressOptions({ ...compressOptions, maxWidth: e.target.value })}
                  placeholder="Original"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text">Altura máx. (px)</label>
                <input
                  type="number"
                  value={compressOptions.maxHeight}
                  onChange={(e) => setCompressOptions({ ...compressOptions, maxHeight: e.target.value })}
                  placeholder="Original"
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
              {processing ? 'Comprimindo...' : 'Comprimir Imagem'}
            </button>
          </div>
        )}

        {/* Resize Tab */}
        {activeTab === 'resize' && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Redimensione sua imagem para novas dimensões.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label-text">Largura (px)</label>
                <input
                  type="number"
                  value={resizeOptions.width}
                  onChange={(e) => setResizeOptions({ ...resizeOptions, width: parseInt(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text">Altura (px)</label>
                <input
                  type="number"
                  value={resizeOptions.height}
                  onChange={(e) => setResizeOptions({ ...resizeOptions, height: parseInt(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text">Modo</label>
                <select
                  value={resizeOptions.fit}
                  onChange={(e) => setResizeOptions({ ...resizeOptions, fit: e.target.value })}
                  className="select-field"
                >
                  <option value="cover">Cover (preenche)</option>
                  <option value="contain">Contain (mantém proporção)</option>
                  <option value="fill">Fill (estica)</option>
                  <option value="inside">Inside (cabe dentro)</option>
                  <option value="outside">Outside (cobre área)</option>
                </select>
              </div>
            </div>

            {/* Preset sizes */}
            <div>
              <label className="label-text">Presets</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { w: 1920, h: 1080, label: 'Full HD' },
                  { w: 1280, h: 720, label: 'HD' },
                  { w: 1080, h: 1080, label: 'Instagram' },
                  { w: 1200, h: 630, label: 'Facebook' },
                  { w: 800, h: 600, label: '800x600' },
                  { w: 400, h: 400, label: 'Thumbnail' }
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => setResizeOptions({ ...resizeOptions, width: preset.w, height: preset.h })}
                    className="px-3 py-1.5 text-xs font-medium bg-dark-700/50 text-gray-400 
                               rounded-lg hover:bg-dark-600 hover:text-white transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleResize}
              disabled={processing}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Maximize2 className="w-5 h-5" />}
              {processing ? 'Redimensionando...' : 'Redimensionar Imagem'}
            </button>
          </div>
        )}

        {/* Filters Tab */}
        {activeTab === 'filters' && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Aplique filtros e ajustes à sua imagem.
            </p>

            {/* Quick toggles */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters({ ...filters, grayscale: !filters.grayscale })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filters.grayscale 
                    ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30' 
                    : 'bg-dark-700/50 text-gray-400 hover:text-white'
                }`}
              >
                Preto e Branco
              </button>
              <button
                onClick={() => setFilters({ ...filters, negate: !filters.negate })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filters.negate 
                    ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30' 
                    : 'bg-dark-700/50 text-gray-400 hover:text-white'
                }`}
              >
                Inverter Cores
              </button>
              <button
                onClick={() => setFilters({ ...filters, flip: !filters.flip })}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filters.flip 
                    ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30' 
                    : 'bg-dark-700/50 text-gray-400 hover:text-white'
                }`}
              >
                <FlipVertical className="w-4 h-4" />
                Flip Vertical
              </button>
              <button
                onClick={() => setFilters({ ...filters, flop: !filters.flop })}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filters.flop 
                    ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30' 
                    : 'bg-dark-700/50 text-gray-400 hover:text-white'
                }`}
              >
                <FlipHorizontal className="w-4 h-4" />
                Flip Horizontal
              </button>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-text flex items-center gap-2">
                  <RotateCw className="w-4 h-4" />
                  Rotação: {filters.rotate}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="90"
                  value={filters.rotate}
                  onChange={(e) => setFilters({ ...filters, rotate: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="label-text flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  Brilho: {filters.brightness.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={filters.brightness}
                  onChange={(e) => setFilters({ ...filters, brightness: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="label-text flex items-center gap-2">
                  <Contrast className="w-4 h-4" />
                  Saturação: {filters.saturation.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={filters.saturation}
                  onChange={(e) => setFilters({ ...filters, saturation: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="label-text">Desfoque: {filters.blur}</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={filters.blur}
                  onChange={(e) => setFilters({ ...filters, blur: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <button
              onClick={handleApplyFilters}
              disabled={processing}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Palette className="w-5 h-5" />}
              {processing ? 'Aplicando...' : 'Aplicar Filtros'}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 p-4 bg-neon-green/10 border border-neon-green/30 rounded-xl">
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

            {result.width && result.height && (
              <p className="text-sm text-gray-300 mb-3">
                Novas dimensões: <span className="text-neon-blue font-semibold">{result.width} x {result.height}</span>
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
      </div>
    </div>
  );
}

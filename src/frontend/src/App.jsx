import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Github, Zap, Shield, Clock, 
  FileVideo, FileImage, ArrowRight
} from 'lucide-react';
import FileUpload from './components/FileUpload';
import FileInfo from './components/FileInfo';
import VideoPanel from './components/VideoPanel';
import ImagePanel from './components/ImagePanel';
import MediaPreview from './components/MediaPreview';
import { useApi } from './hooks/useApi';

function App() {
  const [file, setFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const api = useApi();

  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    setUploadedFile(null);
    setFileInfo(null);

    try {
      const result = await api.uploadFile(selectedFile);
      setUploadedFile(result);

      const info = await api.getFileInfo(result.fileId);
      
      // Fallback: se info não tiver type, usa o type do upload ou detecta pelo MIME
      if (!info.type || info.type === 'unknown') {
        if (result.type && result.type !== 'unknown') {
          info.type = result.type;
        } else if (selectedFile.type.startsWith('video/')) {
          info.type = 'video';
        } else if (selectedFile.type.startsWith('image/')) {
          info.type = 'image';
        }
      }
      
      console.log('File info:', info);
      setFileInfo(info);
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const handleClear = () => {
    if (uploadedFile?.fileId) {
      api.deleteFile(uploadedFile.fileId);
    }
    setFile(null);
    setUploadedFile(null);
    setFileInfo(null);
  };

  return (
    <div className="min-h-screen">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] 
                        bg-gradient-radial from-neon-pink/5 to-transparent rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Media<span className="text-gradient">Forge</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">
                Recursos
              </a>
              <a href="#convert" className="text-gray-400 hover:text-white transition-colors text-sm">
                Converter
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        {!uploadedFile && (
          <section className="py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                                bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-sm mb-6">
                  <Zap className="w-4 h-4" />
                  Conversão em alta qualidade
                </div>
                
                <h1 className="font-display font-bold text-4xl md:text-6xl text-white mb-6 leading-tight">
                  Converta e edite suas
                  <span className="block text-gradient">mídias com facilidade</span>
                </h1>
                
                <p className="text-lg text-gray-400 leading-relaxed">
                  Transforme vídeos em GIFs de alta qualidade, comprima arquivos sem perder qualidade,
                  converta formatos e muito mais. Tudo isso direto no seu navegador.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                <FeatureCard
                  icon={<Zap className="w-6 h-6" />}
                  title="Processamento Rápido"
                  description="Conversões otimizadas com FFmpeg e Sharp para máxima performance"
                  color="blue"
                />
                <FeatureCard
                  icon={<Shield className="w-6 h-6" />}
                  title="Qualidade Preservada"
                  description="Algoritmos avançados que mantêm a qualidade original dos seus arquivos"
                  color="purple"
                />
                <FeatureCard
                  icon={<Clock className="w-6 h-6" />}
                  title="Sem Registro"
                  description="Use imediatamente sem criar conta. Seus arquivos são deletados automaticamente"
                  color="pink"
                />
              </div>

              {/* Upload Area */}
              <div id="convert" className="max-w-2xl mx-auto">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  loading={api.loading}
                  progress={api.progress}
                  currentFile={file}
                  onClear={handleClear}
                />
              </div>

              {/* Supported Formats */}
              <div className="mt-12 text-center">
                <p className="text-sm text-gray-500 mb-4">Formatos suportados</p>
                <div className="flex flex-wrap justify-center gap-4">
                  <FormatGroup 
                    icon={<FileVideo className="w-4 h-4" />}
                    label="Vídeo"
                    formats={['MP4', 'AVI', 'MOV', 'MKV', 'WEBM']}
                  />
                  <FormatGroup 
                    icon={<FileImage className="w-4 h-4" />}
                    label="Imagem"
                    formats={['JPG', 'PNG', 'WEBP', 'GIF', 'AVIF']}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Editor Section */}
        {uploadedFile && (
          <section className="py-8 md:py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <button 
                  onClick={handleClear}
                  className="hover:text-white transition-colors"
                >
                  Início
                </button>
                <ArrowRight className="w-4 h-4" />
                <span className="text-white">
                  {fileInfo?.type === 'video' ? 'Editor de Vídeo' : 'Editor de Imagem'}
                </span>
              </div>

              <div className="space-y-6">
                {/* File Info */}
                <FileInfo info={fileInfo} />

                {/* Media Preview */}
                {uploadedFile?.fileId && fileInfo?.type && (
                  <MediaPreview 
                    fileId={uploadedFile.fileId}
                    fileInfo={fileInfo}
                    type={fileInfo.type}
                  />
                )}

                {/* Editor Panels */}
                {fileInfo?.type === 'video' ? (
                  <VideoPanel 
                    fileId={uploadedFile.fileId} 
                    fileInfo={fileInfo}
                    api={api}
                  />
                ) : fileInfo?.type === 'image' ? (
                  <ImagePanel 
                    fileId={uploadedFile.fileId} 
                    fileInfo={fileInfo}
                    api={api}
                  />
                ) : null}

                {/* Back button */}
                <div className="pt-4">
                  <button
                    onClick={handleClear}
                    className="btn-secondary"
                  >
                    ← Converter outro arquivo
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-neon-blue" />
              <span className="font-display font-semibold text-white">MediaForge</span>
            </div>
            
            <p className="text-sm text-gray-500">
              Conversor e editor de mídia de alta qualidade
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Feito com ❤️</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }) {
  const colorClasses = {
    blue: 'from-neon-blue/20 to-transparent border-neon-blue/20 text-neon-blue',
    purple: 'from-neon-purple/20 to-transparent border-neon-purple/20 text-neon-purple',
    pink: 'from-neon-pink/20 to-transparent border-neon-pink/20 text-neon-pink'
  };

  return (
    <div className="glass-card-hover p-6 group">
      <div className={`
        inline-flex p-3 rounded-xl mb-4 bg-gradient-to-br ${colorClasses[color]}
        border transition-all duration-300 group-hover:scale-110
      `}>
        {icon}
      </div>
      <h3 className="font-display font-semibold text-white text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function FormatGroup({ icon, label, formats }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-dark-800/50 rounded-xl border border-white/5">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-sm font-medium">{label}:</span>
      </div>
      <div className="flex gap-1.5">
        {formats.map(format => (
          <span key={format} className="px-2 py-0.5 bg-dark-700 rounded text-xs text-gray-300">
            {format}
          </span>
        ))}
      </div>
    </div>
  );
}

export default App;

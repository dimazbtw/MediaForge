import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileVideo, FileImage, X, Loader2 } from 'lucide-react';
import { formatFileSize } from '../utils/format';

export default function FileUpload({ onFileSelect, loading, progress, currentFile, onClear }) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
    setDragActive(false);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.wmv', '.flv']
    },
    maxFiles: 1,
    disabled: loading
  });

  const getFileIcon = () => {
    if (!currentFile) return <Upload className="w-12 h-12" />;
    
    const isVideo = currentFile.type?.startsWith('video/') || 
      ['mp4', 'avi', 'mov', 'mkv', 'webm'].some(ext => currentFile.name?.toLowerCase().endsWith(ext));
    
    return isVideo ? 
      <FileVideo className="w-12 h-12 text-neon-blue" /> : 
      <FileImage className="w-12 h-12 text-neon-purple" />;
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative w-full min-h-[280px] p-8 rounded-2xl border-2 border-dashed
          transition-all duration-300 cursor-pointer
          flex flex-col items-center justify-center gap-4
          ${isDragActive || dragActive
            ? 'border-neon-blue bg-neon-blue/5 scale-[1.02]'
            : 'border-dark-500 hover:border-dark-400 bg-dark-800/30'
          }
          ${loading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-neon-blue/30 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-neon-purple/30 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-neon-purple/30 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-neon-blue/30 rounded-br-lg" />

        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-neon-blue animate-spin" />
            <div className="w-64">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Enviando...</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : currentFile ? (
          <div className="flex flex-col items-center gap-3">
            {getFileIcon()}
            <div className="text-center">
              <p className="font-display font-semibold text-white truncate max-w-[300px]">
                {currentFile.name}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {formatFileSize(currentFile.size)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="mt-2 flex items-center gap-2 px-4 py-2 text-sm text-gray-400 
                         hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
            >
              <X className="w-4 h-4" />
              Remover arquivo
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 rounded-full bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 
                            border border-white/5">
              <Upload className="w-10 h-10 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-white text-lg">
                Arraste seu arquivo aqui
              </p>
              <p className="text-gray-400 mt-1">
                ou <span className="text-neon-blue hover:underline">clique para selecionar</span>
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              <span className="tag">MP4</span>
              <span className="tag">AVI</span>
              <span className="tag">MOV</span>
              <span className="tag-purple">PNG</span>
              <span className="tag-purple">JPG</span>
              <span className="tag-purple">WEBP</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Máximo: 500MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { FileVideo, FileImage, Clock, Maximize2, Layers, Zap } from 'lucide-react';
import { formatFileSize, formatDuration, formatResolution } from '../utils/format';

export default function FileInfo({ info }) {
  if (!info) return null;

  const isVideo = info.type === 'video';

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        {isVideo ? (
          <FileVideo className="w-6 h-6 text-neon-blue" />
        ) : (
          <FileImage className="w-6 h-6 text-neon-purple" />
        )}
        <h3 className="font-display font-semibold text-white">
          Informações do Arquivo
        </h3>
        <span className={`tag ${isVideo ? '' : 'tag-purple'} ml-auto`}>
          {isVideo ? 'Vídeo' : 'Imagem'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <InfoItem 
          icon={<Layers className="w-4 h-4" />}
          label="Tamanho"
          value={formatFileSize(info.size)}
        />
        
        <InfoItem 
          icon={<Maximize2 className="w-4 h-4" />}
          label="Resolução"
          value={formatResolution(info.width, info.height)}
        />

        {isVideo && (
          <>
            <InfoItem 
              icon={<Clock className="w-4 h-4" />}
              label="Duração"
              value={formatDuration(info.duration)}
            />
            
            <InfoItem 
              icon={<Zap className="w-4 h-4" />}
              label="FPS"
              value={info.fps ? `${Math.round(info.fps)} fps` : 'N/A'}
            />
            
            <InfoItem 
              label="Codec"
              value={info.codec?.toUpperCase() || 'N/A'}
            />
            
            <InfoItem 
              label="Bitrate"
              value={info.bitrate ? `${Math.round(info.bitrate / 1000)} kbps` : 'N/A'}
            />
          </>
        )}

        {!isVideo && (
          <>
            <InfoItem 
              label="Formato"
              value={info.format?.toUpperCase() || 'N/A'}
            />
            
            <InfoItem 
              label="Transparência"
              value={info.hasAlpha ? 'Sim' : 'Não'}
            />
          </>
        )}
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="bg-dark-700/30 rounded-xl p-3">
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-white font-medium truncate">{value}</p>
    </div>
  );
}

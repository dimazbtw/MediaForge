import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw,
  ZoomIn, ZoomOut, Move
} from 'lucide-react';
import { formatDuration } from '../utils/format';

export default function MediaPreview({ fileId, fileInfo, type }) {
  const previewUrl = `/api/preview/${fileId}`;
  
  if (type === 'video') {
    return <VideoPreview url={previewUrl} fileInfo={fileInfo} />;
  }
  
  if (type === 'image') {
    return <ImagePreview url={previewUrl} fileInfo={fileInfo} />;
  }
  
  return null;
}

function VideoPreview({ url, fileInfo }) {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    videoRef.current.volume = value;
    setVolume(value);
    setIsMuted(value === 0);
  };

  const handleProgressClick = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleFullscreen = () => {
    const container = videoRef.current.parentElement.parentElement;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const restart = () => {
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-white text-sm">Preview do Vídeo</h3>
        <span className="text-xs text-gray-400">
          {fileInfo?.width}x{fileInfo?.height} • {fileInfo?.codec?.toUpperCase()}
        </span>
      </div>

      <div 
        className="relative bg-black rounded-xl overflow-hidden group"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={url}
          className="w-full max-h-[400px] object-contain"
          onClick={togglePlay}
          playsInline
        />

        {/* Play overlay */}
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center
                            hover:bg-white/30 transition-colors">
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className={`
          absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent
          transition-opacity duration-300
          ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}
        `}>
          {/* Progress bar */}
          <div 
            ref={progressRef}
            className="h-1 bg-white/20 rounded-full mb-3 cursor-pointer group/progress"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-neon-blue rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full 
                              opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                onClick={togglePlay}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>

              <button 
                onClick={restart}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-white" />
              </button>

              <div className="flex items-center gap-1 group/volume">
                <button 
                  onClick={toggleMute}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-white" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/volume:w-16 transition-all duration-200 h-1 accent-neon-blue"
                />
              </div>

              <span className="text-xs text-white/80 ml-2 font-mono">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>
            </div>

            <button 
              onClick={handleFullscreen}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImagePreview({ url, fileInfo }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
    if (zoom <= 1) setPosition({ x: 0, y: 0 });
  };
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(prev + 0.1, 3));
    } else {
      setZoom(prev => {
        const newZoom = Math.max(prev - 0.1, 0.5);
        if (newZoom <= 1) setPosition({ x: 0, y: 0 });
        return newZoom;
      });
    }
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-white text-sm">Preview da Imagem</h3>
        <span className="text-xs text-gray-400">
          {fileInfo?.width}x{fileInfo?.height} • {fileInfo?.format?.toUpperCase()}
        </span>
      </div>

      <div 
        ref={containerRef}
        className="relative bg-[#1a1a1a] rounded-xl overflow-hidden"
        style={{ 
          backgroundImage: 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <img
          src={url}
          alt="Preview"
          className="w-full max-h-[400px] object-contain transition-transform duration-200"
          style={{ 
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          draggable={false}
        />

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg p-1">
          <button 
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Diminuir zoom"
          >
            <ZoomOut className="w-4 h-4 text-white" />
          </button>
          
          <span className="text-xs text-white/80 px-2 min-w-[3rem] text-center font-mono">
            {Math.round(zoom * 100)}%
          </span>
          
          <button 
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4 text-white" />
          </button>

          {zoom !== 1 && (
            <button 
              onClick={handleReset}
              className="p-1.5 hover:bg-white/10 rounded transition-colors ml-1 border-l border-white/10"
              title="Resetar zoom"
            >
              <RotateCcw className="w-4 h-4 text-white" />
            </button>
          )}
        </div>

        {/* Drag indicator */}
        {zoom > 1 && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
            <Move className="w-3 h-3 text-white/60" />
            <span className="text-xs text-white/60">Arraste para mover</span>
          </div>
        )}
      </div>
    </div>
  );
}

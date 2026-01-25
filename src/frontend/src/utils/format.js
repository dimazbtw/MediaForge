export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatResolution(width, height) {
  if (!width || !height) return 'Desconhecido';
  
  const resolutions = {
    '3840x2160': '4K UHD',
    '2560x1440': '2K QHD',
    '1920x1080': 'Full HD',
    '1280x720': 'HD',
    '854x480': 'SD',
    '640x360': '360p'
  };
  
  const key = `${width}x${height}`;
  return resolutions[key] || `${width}x${height}`;
}

export function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

export function isVideoFile(filename) {
  const videoExtensions = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'wmv', 'flv'];
  return videoExtensions.includes(getFileExtension(filename));
}

export function isImageFile(filename) {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'];
  return imageExtensions.includes(getFileExtension(filename));
}

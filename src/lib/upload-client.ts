// Client-side upload utilities (no Node.js modules)

// Configuration
export const UPLOAD_CONFIG = {
  maxFileSize: 100 * 1024 * 1024, // 100MB in bytes
  maxDuration: 600, // 10 minutes in seconds
  allowedFormats: [
    'mp4', 'webm', 'mov', 'avi', 'mkv',
    'flv', 'mpeg', 'mpg', 'wmv', '3gp'
  ],
  allowedMimeTypes: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/x-flv',
    'video/mpeg',
    'video/x-ms-wmv',
    'video/3gpp',
    'application/octet-stream' // For some video formats
  ]
};

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
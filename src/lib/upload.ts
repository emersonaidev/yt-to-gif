import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
  ],
  uploadDir: '/tmp/uploads'
};

// Ensure upload directory exists
export async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_CONFIG.uploadDir);
  } catch {
    await fs.mkdir(UPLOAD_CONFIG.uploadDir, { recursive: true });
  }
}

// Validate file extension
export function validateFileExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase().substring(1);
  return UPLOAD_CONFIG.allowedFormats.includes(ext);
}

// Validate MIME type
export function validateMimeType(mimeType: string): boolean {
  return UPLOAD_CONFIG.allowedMimeTypes.includes(mimeType);
}

// Validate file size
export function validateFileSize(size: number): boolean {
  return size > 0 && size <= UPLOAD_CONFIG.maxFileSize;
}

// Get video duration using ffprobe
export async function getVideoDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    return parseFloat(stdout.trim());
  } catch (error) {
    console.error('Error getting video duration:', error);
    throw new Error('Failed to analyze video duration');
  }
}

// Validate video duration
export async function validateVideoDuration(filePath: string): Promise<boolean> {
  const duration = await getVideoDuration(filePath);
  return duration > 0 && duration <= UPLOAD_CONFIG.maxDuration;
}

// Verify file is actually a video using ffprobe
export async function verifyVideoFile(filePath: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=codec_type -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    return stdout.trim() === 'video';
  } catch {
    return false;
  }
}

// Generate safe filename
export function generateSafeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const uuid = uuidv4();
  return `upload_${uuid}${ext}`;
}

// Save uploaded file
export async function saveUploadedFile(
  buffer: Buffer,
  originalName: string
): Promise<{ filePath: string; filename: string }> {
  await ensureUploadDir();

  const filename = generateSafeFilename(originalName);
  const filePath = path.join(UPLOAD_CONFIG.uploadDir, filename);

  await fs.writeFile(filePath, buffer);

  return { filePath, filename };
}

// Clean up old uploaded files (older than 1 hour)
export async function cleanupOldUploads(): Promise<void> {
  try {
    await ensureUploadDir();
    const files = await fs.readdir(UPLOAD_CONFIG.uploadDir);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(UPLOAD_CONFIG.uploadDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtimeMs < oneHourAgo) {
        await fs.unlink(filePath);
        console.log(`Cleaned up old upload: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up uploads:', error);
  }
}

// Validation result type
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Complete file validation
export async function validateUploadedFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ValidationResult> {
  // Check file size
  if (!validateFileSize(buffer.length)) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB`
    };
  }

  // Check file extension
  if (!validateFileExtension(filename)) {
    return {
      valid: false,
      error: `File type not allowed. Supported formats: ${UPLOAD_CONFIG.allowedFormats.join(', ')}`
    };
  }

  // Check MIME type
  if (!validateMimeType(mimeType)) {
    return {
      valid: false,
      error: 'Invalid file MIME type'
    };
  }

  return { valid: true };
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
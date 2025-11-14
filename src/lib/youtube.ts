import { z } from 'zod';

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractVideoId(url: string): string | null {
  // Remove whitespace
  const cleanUrl = url.trim();

  // Standard watch URL
  const watchMatch = cleanUrl.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  // Short URL
  const shortMatch = cleanUrl.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];

  // Embed URL
  const embedMatch = cleanUrl.match(/embed\/([^?]+)/);
  if (embedMatch) return embedMatch[1];

  return null;
}

/**
 * Validate YouTube URL
 */
export const YouTubeUrlSchema = z.string().refine(
  (url) => extractVideoId(url) !== null,
  { message: 'Invalid YouTube URL' }
);

/**
 * Validate and extract video ID
 */
export function validateYouTubeUrl(url: string): {
  isValid: boolean;
  videoId: string | null;
  error?: string
} {
  const videoId = extractVideoId(url);

  if (!videoId) {
    return {
      isValid: false,
      videoId: null,
      error: 'Invalid YouTube URL. Please use a valid YouTube link.',
    };
  }

  return {
    isValid: true,
    videoId,
  };
}

/**
 * Format seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse MM:SS to seconds
 */
export function parseTime(timeString: string): number | null {
  const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const mins = parseInt(match[1], 10);
  const secs = parseInt(match[2], 10);

  if (secs >= 60) return null;

  return mins * 60 + secs;
}

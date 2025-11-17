import ffmpeg from 'fluent-ffmpeg';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

/**
 * Download YouTube video using yt-dlp
 */
export async function downloadYouTubeVideo(
  videoId: string,
  outputDir: string
): Promise<string> {
  const outputPath = path.join(outputDir, `${videoId}.mp4`);

  // Check if already downloaded
  if (existsSync(outputPath)) {
    return outputPath;
  }

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Download video using yt-dlp with full YouTube URL and updated options
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Add user-agent and other options to bypass YouTube restrictions
  // Using simplified format selector that works with current YouTube restrictions
  const ytDlpCommand = `yt-dlp \
    --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
    --extractor-args "youtube:player_client=android,web" \
    --no-check-certificate \
    -f "best[height<=720][ext=mp4]" \
    -o "${outputPath}" \
    "${youtubeUrl}"`;

  try {
    await execAsync(ytDlpCommand, { maxBuffer: 50 * 1024 * 1024 }); // 50MB buffer
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to download video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert video segment to GIF using ffmpeg
 */
export async function convertToGif(
  inputPath: string,
  outputPath: string,
  startTime: number,
  duration: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .size('480x?') // 480p width, auto height
      .fps(15) // 15 frames per second for reasonable file size
      .outputOptions([
        '-vf',
        'fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5',
      ])
      .on('end', () => resolve())
      .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .save(outputPath);
  });
}

/**
 * Optimize GIF using gifski (if available)
 * Falls back to standard conversion if gifski is not available
 */
export async function optimizeWithGifski(
  inputPath: string,
  outputPath: string,
  startTime: number,
  duration: number
): Promise<void> {
  try {
    // Check if gifski is available
    await execAsync('which gifski');

    // Extract frames from video
    const framesDir = path.join(path.dirname(outputPath), 'frames');
    await fs.mkdir(framesDir, { recursive: true });

    // Extract frames using ffmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .fps(15)
        .size('480x?')
        .output(path.join(framesDir, 'frame-%04d.png'))
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    // Use gifski to create optimized GIF
    const gifskiCommand = `gifski -o "${outputPath}" --fps 15 --quality 90 "${framesDir}"/frame-*.png`;
    await execAsync(gifskiCommand);

    // Cleanup frames
    await fs.rm(framesDir, { recursive: true, force: true });
  } catch (error) {
    // Fallback to standard ffmpeg conversion if gifski fails
    console.warn('Gifski not available or failed, using standard ffmpeg conversion');
    await convertToGif(inputPath, outputPath, startTime, duration);
  }
}

/**
 * Generate GIF from YouTube video
 */
export async function generateGif(
  videoId: string,
  startTime: number,
  duration: number
): Promise<{
  gifPath: string;
  gifBuffer: Buffer;
  fileSize: number;
}> {
  const tempDir = path.join(process.cwd(), 'temp');
  const outputDir = path.join(process.cwd(), 'public', 'gifs');

  // Ensure directories exist
  await fs.mkdir(tempDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  try {
    // Download video
    const videoPath = await downloadYouTubeVideo(videoId, tempDir);

    // Generate unique filename for GIF
    const timestamp = Date.now();
    const gifFilename = `${videoId}_${startTime}_${duration}_${timestamp}.gif`;
    const gifPath = path.join(outputDir, gifFilename);

    // Convert to GIF with optimization
    await optimizeWithGifski(videoPath, gifPath, startTime, duration);

    // Read GIF file
    const gifBuffer = await fs.readFile(gifPath);
    const stats = await fs.stat(gifPath);

    return {
      gifPath: `/gifs/${gifFilename}`,
      gifBuffer,
      fileSize: stats.size,
    };
  } catch (error) {
    throw new Error(`GIF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate GIF from uploaded video file
 */
export async function generateGifFromFile(
  videoPath: string,
  startTime: number,
  duration: number
): Promise<{
  gifPath: string;
  gifBuffer: Buffer;
  fileSize: number;
}> {
  const outputDir = path.join(process.cwd(), 'public', 'gifs');

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  try {
    // Generate unique filename for GIF
    const timestamp = Date.now();
    const videoBasename = path.basename(videoPath, path.extname(videoPath));
    const gifFilename = `upload_${videoBasename}_${startTime}_${duration}_${timestamp}.gif`;
    const gifPath = path.join(outputDir, gifFilename);

    // Convert to GIF with optimization
    await optimizeWithGifski(videoPath, gifPath, startTime, duration);

    // Read GIF file
    const gifBuffer = await fs.readFile(gifPath);
    const stats = await fs.stat(gifPath);

    return {
      gifPath: `/gifs/${gifFilename}`,
      gifBuffer,
      fileSize: stats.size,
    };
  } catch (error) {
    throw new Error(`GIF generation from file failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clean up old temporary files
 */
export async function cleanupTempFiles(maxAgeHours: number = 24): Promise<void> {
  const tempDir = path.join(process.cwd(), 'temp');
  const gifsDir = path.join(process.cwd(), 'public', 'gifs');

  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000;

  for (const dir of [tempDir, gifsDir]) {
    try {
      const files = await fs.readdir(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          console.log(`Deleted old file: ${file}`);
        }
      }
    } catch (error) {
      console.error(`Error cleaning up ${dir}:`, error);
    }
  }
}

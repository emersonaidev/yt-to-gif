import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateGif, generateGifFromFile } from '@/lib/ffmpeg';
import {
  validateUploadedFile,
  saveUploadedFile,
  verifyVideoFile,
  validateVideoDuration,
  cleanupOldUploads,
  formatFileSize
} from '@/lib/upload';

// Schema for YouTube URL conversion
const YouTubeConvertSchema = z.object({
  videoId: z.string().min(1, 'Video ID is required'),
  startTime: z.number().min(0, 'Start time must be positive'),
  duration: z.number().min(1, 'Duration must be at least 1 second').max(30, 'Duration cannot exceed 30 seconds'),
});

// Schema for file upload conversion
const FileUploadSchema = z.object({
  startTime: z.number().min(0, 'Start time must be positive'),
  duration: z.number().min(1, 'Duration must be at least 1 second').max(30, 'Duration cannot exceed 30 seconds'),
});

export async function POST(request: NextRequest) {
  try {
    // Clean up old uploads periodically
    cleanupOldUploads().catch(console.error);

    const contentType = request.headers.get('content-type') || '';

    // Handle multipart form data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const startTime = parseFloat(formData.get('startTime') as string);
      const duration = parseFloat(formData.get('duration') as string);

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      // Validate request parameters
      const validation = FileUploadSchema.safeParse({ startTime, duration });
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Invalid request',
            details: validation.error.issues,
          },
          { status: 400 }
        );
      }

      // Convert File to Buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Validate file
      const fileValidation = await validateUploadedFile(
        buffer,
        file.name,
        file.type
      );

      if (!fileValidation.valid) {
        return NextResponse.json(
          { error: fileValidation.error },
          { status: 400 }
        );
      }

      // Save file
      const { filePath, filename } = await saveUploadedFile(buffer, file.name);

      try {
        // Verify it's actually a video
        const isVideo = await verifyVideoFile(filePath);
        if (!isVideo) {
          // Clean up invalid file
          const fs = await import('fs').then(m => m.promises);
          await fs.unlink(filePath);
          return NextResponse.json(
            { error: 'File is not a valid video' },
            { status: 400 }
          );
        }

        // Validate duration
        const durationValid = await validateVideoDuration(filePath);
        if (!durationValid) {
          // Clean up file
          const fs = await import('fs').then(m => m.promises);
          await fs.unlink(filePath);
          return NextResponse.json(
            { error: 'Video duration exceeds 10 minutes maximum' },
            { status: 400 }
          );
        }

        // Generate GIF from uploaded file
        const result = await generateGifFromFile(
          filePath,
          validation.data.startTime,
          validation.data.duration
        );

        // Clean up uploaded file after processing
        const fs = await import('fs').then(m => m.promises);
        await fs.unlink(filePath).catch(console.error);

        return NextResponse.json({
          success: true,
          gifUrl: result.gifPath,
          fileSize: result.fileSize,
          source: 'upload',
        });
      } catch (error) {
        // Clean up on error
        const fs = await import('fs').then(m => m.promises);
        await fs.unlink(filePath).catch(console.error);
        throw error;
      }
    }
    // Handle JSON (YouTube URL)
    else if (contentType.includes('application/json')) {
      const body = await request.json();

      // Validate request
      const validation = YouTubeConvertSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Invalid request',
            details: validation.error.issues,
          },
          { status: 400 }
        );
      }

      const { videoId, startTime, duration } = validation.data;

      // Generate GIF from YouTube video
      const result = await generateGif(videoId, startTime, duration);

      return NextResponse.json({
        success: true,
        gifUrl: result.gifPath,
        fileSize: result.fileSize,
        source: 'youtube',
      });
    }
    else {
      return NextResponse.json(
        { error: 'Invalid content type. Use multipart/form-data for file upload or application/json for YouTube URL' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Conversion error:', error);

    // Check if it's a YouTube bot detection error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const isYouTubeBlocked = errorMessage.includes('Sign in to confirm') ||
                             errorMessage.includes('bot') ||
                             errorMessage.includes('ERROR: [youtube]');

    if (isYouTubeBlocked) {
      return NextResponse.json(
        {
          error: 'YouTube blocked the request',
          message: 'YouTube is blocking downloads from this server. Please use the "Upload Video" option instead. You can download the video locally and then upload it.',
          suggestion: 'Use the Upload Video option for reliable GIF generation',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'GIF generation failed',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'YouTube to GIF Converter API',
      version: '2.0.0',
      endpoints: {
        'POST /api/convert': {
          description: 'Convert video to GIF',
          options: [
            {
              type: 'YouTube URL',
              contentType: 'application/json',
              body: {
                videoId: 'string (YouTube video ID)',
                startTime: 'number (seconds)',
                duration: 'number (seconds, 1-30)',
              },
            },
            {
              type: 'File Upload',
              contentType: 'multipart/form-data',
              formData: {
                file: 'File (video file, max 100MB)',
                startTime: 'number (seconds)',
                duration: 'number (seconds, 1-30)',
              },
              supportedFormats: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'mpeg', 'wmv', '3gp'],
              maxFileSize: '100MB',
              maxVideoDuration: '10 minutes',
            },
          ],
        },
      },
    },
    { status: 200 }
  );
}
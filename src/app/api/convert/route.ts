import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateGif } from '@/lib/ffmpeg';

const ConvertRequestSchema = z.object({
  videoId: z.string().min(1, 'Video ID is required'),
  startTime: z.number().min(0, 'Start time must be positive'),
  duration: z.number().min(1, 'Duration must be at least 1 second').max(30, 'Duration cannot exceed 30 seconds'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request
    const validation = ConvertRequestSchema.safeParse(body);

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

    // Generate GIF
    const result = await generateGif(videoId, startTime, duration);

    return NextResponse.json({
      success: true,
      gifUrl: result.gifPath,
      fileSize: result.fileSize,
    });
  } catch (error) {
    console.error('Conversion error:', error);

    return NextResponse.json(
      {
        error: 'GIF generation failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'YouTube to GIF Converter API',
      version: '1.0.0',
      endpoints: {
        POST: {
          path: '/api/convert',
          body: {
            videoId: 'string (YouTube video ID)',
            startTime: 'number (seconds)',
            duration: 'number (seconds, 1-30)',
          },
        },
      },
    },
    { status: 200 }
  );
}

'use client';

import { useRef, useEffect, useState } from 'react';
import YouTube, { YouTubeProps, YouTubePlayer } from 'react-youtube';
import { Label } from '@/components/ui/label';
import { Play } from 'lucide-react';
import { formatTime } from '@/lib/youtube';

interface GifPreviewLiveProps {
  videoId: string;
  startTime: number;
  duration: number;
}

export function GifPreviewLive({ videoId, startTime, duration }: GifPreviewLiveProps) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isLooping, setIsLooping] = useState(false);

  useEffect(() => {
    if (!playerRef.current) return;

    const interval = setInterval(() => {
      if (playerRef.current && isLooping) {
        const currentTime = playerRef.current.getCurrentTime();

        // Loop back to start when reaching end of segment
        if (currentTime >= startTime + duration) {
          playerRef.current.seekTo(startTime, true);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, duration, isLooping]);

  const opts: YouTubeProps['opts'] = {
    height: '180',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      start: Math.floor(startTime),
      mute: 1, // Mute preview
      fs: 0,
      iv_load_policy: 3,
    },
  };

  const handleReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    event.target.seekTo(startTime, true);
    event.target.playVideo();
    setIsLooping(true);
  };

  return (
    <div className="border-t border-zinc-800 pt-5 pb-2">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm text-gray-300 flex items-center gap-2">
          <Play className="h-4 w-4 text-pink-500" />
          GIF Preview
        </Label>
        <span className="text-xs text-gray-500">
          {formatTime(startTime)} → {formatTime(startTime + duration)}
        </span>
      </div>

      <div className="rounded-lg overflow-hidden border border-zinc-700 bg-black">
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={handleReady}
          className="aspect-video w-full"
          iframeClassName="w-full h-full"
        />
      </div>

      <p className="text-xs text-gray-500 mt-2 text-center">
        Auto-repeating preview • Muted
      </p>
    </div>
  );
}

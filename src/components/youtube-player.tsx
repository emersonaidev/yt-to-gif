'use client';

import { useRef, useEffect, useState } from 'react';
import YouTube, { YouTubeProps, YouTubePlayer } from 'react-youtube';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { formatTime } from '@/lib/youtube';

interface YouTubePlayerComponentProps {
  videoId: string;
  onReady?: (player: YouTubePlayer) => void;
  onPause?: (currentTime: number) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  currentTime: number;
  videoDuration: number;
  onSeek?: (time: number) => void;
  previewMode?: boolean;
  previewStartTime?: number;
  previewDuration?: number;
  onExitPreview?: () => void;
}

export function YouTubePlayerComponent({
  videoId,
  onReady,
  onPause,
  onTimeUpdate,
  onPlayStateChange,
  currentTime,
  videoDuration,
  onSeek,
  previewMode = false,
  previewStartTime = 0,
  previewDuration = 5,
  onExitPreview,
}: YouTubePlayerComponentProps) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopCountdown, setLoopCountdown] = useState(previewDuration);
  const [isMuted, setIsMuted] = useState(false);

  // Update current time every 100ms when playing
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && onTimeUpdate) {
        const time = playerRef.current.getCurrentTime();
        onTimeUpdate(time);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [onTimeUpdate]);

  // GIF Preview Loop - Auto-repeat segment with countdown
  useEffect(() => {
    if (!playerRef.current || !previewMode) return;

    const interval = setInterval(() => {
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        const endTime = previewStartTime + previewDuration;

        // Calculate countdown: time remaining in loop
        const timeInLoop = currentTime - previewStartTime;
        const remaining = previewDuration - timeInLoop;
        setLoopCountdown(Math.max(0, Math.ceil(remaining)));

        // Loop back to start when reaching end of preview segment
        if (currentTime >= endTime || currentTime < previewStartTime) {
          playerRef.current.seekTo(previewStartTime, true);
          playerRef.current.playVideo();
          setLoopCountdown(previewDuration);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [previewMode, previewStartTime, previewDuration]);

  // Start preview when entering preview mode
  useEffect(() => {
    if (playerRef.current && previewMode) {
      // Only mute on first preview activation if not already muted by user
      if (!isMuted) {
        playerRef.current.mute();
        setIsMuted(true);
      }
      playerRef.current.seekTo(previewStartTime, true);
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  }, [previewMode, previewStartTime]);

  const opts: YouTubeProps['opts'] = {
    height: '360',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 0, // Disable YouTube controls
      modestbranding: 1,
      rel: 0,
      fs: 1,
      iv_load_policy: 3,
      color: 'white',
    },
  };

  const handleReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    setIsLoading(false);
    setError(null);

    if (onReady) {
      onReady(event.target);
    }
  };

  const handleStateChange: YouTubeProps['onStateChange'] = (event) => {
    const playerState = event.data;
    // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: cued
    const playing = playerState === 1;
    setIsPlaying(playing);

    if (onPlayStateChange) {
      onPlayStateChange(playing);
    }

    if (playerState === 2 && onPause && playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      onPause(currentTime);
    }
  };

  const handleError: YouTubeProps['onError'] = (event) => {
    setIsLoading(false);

    const errorMessages: Record<number, string> = {
      2: 'Invalid video ID',
      5: 'HTML5 player error',
      100: 'Video not found or private',
      101: 'Video cannot be embedded',
      150: 'Video cannot be embedded',
    };

    setError(
      errorMessages[event.data] ||
        'An error occurred while loading the video'
    );
  };

  // Control functions
  const handlePlayPause = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      // In preview mode, play continues the loop
      // In normal mode, play from current position
      playerRef.current.playVideo();
    }
  };

  const handleSkipBackward = () => {
    if (!playerRef.current) return;
    const currentTime = playerRef.current.getCurrentTime();
    const newTime = Math.max(0, currentTime - 5);
    playerRef.current.seekTo(newTime, true);
    if (onSeek) onSeek(newTime);
  };

  const handleSkipForward = () => {
    if (!playerRef.current) return;
    const currentTime = playerRef.current.getCurrentTime();
    const duration = playerRef.current.getDuration();
    const newTime = Math.min(duration, currentTime + 5);
    playerRef.current.seekTo(newTime, true);
    if (onSeek) onSeek(newTime);
  };

  const handleSliderChange = (value: number[]) => {
    const time = value[0];
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
    }
    if (onSeek) onSeek(time);
  };

  const handleToggleMute = () => {
    if (!playerRef.current) return;

    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  if (error) {
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden">
      {isLoading && (
        <div className="flex items-center justify-center h-[360px] bg-zinc-900">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent"></div>
            <p className="mt-2 text-sm text-gray-400">
              Loading video...
            </p>
          </div>
        </div>
      )}

      {/* Video Container */}
      <div className={isLoading ? 'hidden' : 'block'}>
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={handleReady}
          onStateChange={handleStateChange}
          onError={handleError}
          className="aspect-video w-full overflow-hidden bg-black"
          iframeClassName="w-full h-full"
        />
      </div>

      {/* Custom Controls with Slider */}
      {!isLoading && !error && (
        <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-4 space-y-4">
          {/* Preview Mode Indicator - Always visible when in preview */}
          <div className="flex items-center justify-center gap-3 pb-2">
            {previewMode && (
              <div className="flex items-center gap-2 px-3 py-1 bg-pink-500/10 border border-pink-500/30 rounded-full">
                <div className="h-2 w-2 bg-pink-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-pink-400 font-bold font-mono tabular-nums">
                  GIF {loopCountdown}s
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleMute}
              className="h-8 w-8 text-gray-400 hover:text-white"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>

          {/* Timeline Slider - Above Controls */}
          <div className="space-y-3">
            <Slider
              value={[currentTime]}
              onValueChange={handleSliderChange}
              max={videoDuration}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-center">
              <div className="bg-zinc-800/50 px-6 py-2 rounded-lg">
                <span className="text-4xl font-mono font-bold text-purple-400 tabular-nums tracking-wider">
                  {formatTime(currentTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Playback Controls - Below Slider */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSkipBackward}
              title="Voltar 5 segundos"
              className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="lg"
              onClick={handlePlayPause}
              className="w-28 bg-purple-600 hover:bg-purple-700"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Play
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleSkipForward}
              title="Avançar 5 segundos"
              className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { YouTubePlayer } from 'react-youtube';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { YouTubePlayerComponent } from '@/components/youtube-player';
import { GifPreview } from '@/components/gif-preview';
import { validateYouTubeUrl } from '@/lib/youtube';
import { Film, AlertCircle, Sparkles, Timer } from 'lucide-react';

export default function Home() {
  // URL state
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Player state
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(true);

  // GIF parameters
  const [startTime, setStartTime] = useState(0);
  const [duration, setDuration] = useState(5);
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGif, setGeneratedGif] = useState<{
    url: string;
    fileSize: number;
  } | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateYouTubeUrl(url);

    if (!validation.isValid) {
      setUrlError(validation.error || 'Invalid URL');
      setVideoId(null);
      return;
    }

    setVideoId(validation.videoId);
    setUrlError(null);
    setGeneratedGif(null);
    setGenerationError(null);
  };

  const handlePlayerReady = (player: YouTubePlayer) => {
    playerRef.current = player;
    setVideoDuration(player.getDuration());
  };

  const handlePlayerPause = (time: number) => {
    setIsPaused(true);
    setCurrentTime(time);
    setStartTime(time);
  };

  const handleTimeChange = (time: number) => {
    setStartTime(time);
    setShowLivePreview(true);
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
    }
  };

  const handleGenerateGif = async () => {
    if (!videoId) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          startTime,
          duration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate GIF');
      }

      setGeneratedGif({
        url: data.gifUrl,
        fileSize: data.fileSize,
      });
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setVideoId(null);
    setUrlError(null);
    setGeneratedGif(null);
    setGenerationError(null);
    setStartTime(0);
    setDuration(5);
    setShowLivePreview(false);
  };

  const actualMaxDuration = Math.min(30, videoDuration - startTime);
  const presets = [3, 5, 10, 15];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-3">
            YouTube to GIF
          </h1>
          <p className="text-gray-400 text-sm">
            Created by EMERSON FERREIRA
          </p>
        </div>

        {/* Single Console - Always Same Structure */}
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">

            {/* Video Area - URL Input or Video Player */}
            {!videoId ? (
              <>
                <div className="aspect-video w-full bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center">
                  <div className="w-full max-w-2xl px-8">
                    <form onSubmit={handleUrlSubmit} className="space-y-4">
                      <div className="text-center mb-6">
                        <Film className="h-16 w-16 text-purple-500/30 mx-auto mb-4" />
                        <p className="text-gray-400 text-sm">Paste a YouTube URL to get started</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            id="youtube-url"
                            type="text"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="flex-1 bg-zinc-950 border-zinc-700 text-white placeholder:text-gray-600 h-12 text-base"
                            autoFocus
                          />
                          <Button type="submit" size="lg" className="bg-purple-600 hover:bg-purple-700 h-12 px-8">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Load
                          </Button>
                        </div>
                        {urlError && (
                          <Alert variant="destructive" className="bg-red-950/50 border-red-900">
                            <AlertDescription className="text-xs">{urlError}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
                {/* Placeholder Controls - Disabled */}
                <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-4 space-y-4 opacity-30 pointer-events-none">
                  <div className="flex items-center justify-center gap-3 pb-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-pink-500/10 border border-pink-500/30 rounded-full">
                      <div className="h-2 w-2 bg-pink-500 rounded-full"></div>
                      <span className="text-sm text-pink-400 font-bold font-mono tabular-nums">
                        GIF 5s
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" disabled className="h-8 w-8 text-gray-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828 2.828" />
                      </svg>
                    </Button>
                  </div>

                  {/* GIF Duration Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <Button variant="outline" size="sm" disabled className="bg-zinc-800 border-zinc-700">3s</Button>
                    <Button variant="default" size="sm" disabled className="bg-pink-600">5s</Button>
                    <Button variant="outline" size="sm" disabled className="bg-zinc-800 border-zinc-700">10s</Button>
                    <Button variant="outline" size="sm" disabled className="bg-zinc-800 border-zinc-700">15s</Button>
                  </div>

                  <div className="space-y-3">
                    <Slider value={[0]} max={100} disabled className="w-full" />
                    <div className="flex justify-center">
                      <div className="bg-zinc-800/50 px-6 py-2 rounded-lg">
                        <span className="text-4xl font-mono font-bold text-purple-400 tabular-nums tracking-wider">
                          00:00
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="icon" disabled className="bg-zinc-800 border-zinc-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </Button>
                    <Button size="lg" disabled className="w-28 bg-purple-600">
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Play
                    </Button>
                    <Button variant="outline" size="icon" disabled className="bg-zinc-800 border-zinc-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <YouTubePlayerComponent
                videoId={videoId}
                onReady={handlePlayerReady}
                onPause={handlePlayerPause}
                onTimeUpdate={(time) => {
                  setCurrentTime(time);
                }}
                onPlayStateChange={(playing) => {
                  setIsPaused(!playing);
                }}
                currentTime={currentTime}
                videoDuration={videoDuration}
                onSeek={handleTimeChange}
                previewMode={showLivePreview}
                previewStartTime={startTime}
                previewDuration={duration}
                onExitPreview={() => setShowLivePreview(false)}
                duration={duration}
                onDurationChange={(newDuration) => {
                  setDuration(newDuration);
                  setShowLivePreview(true);
                }}
              />
            )}

            {/* GIF Controls - Only Generate Button */}
            <div className="border-t border-zinc-800 p-6">
              {/* Generate Button */}
              <div className="flex gap-3">
                {!generatedGif ? (
                  <Button
                    onClick={handleGenerateGif}
                    disabled={isGenerating || !videoId}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        {videoId ? 'Generate GIF' : 'Load a video first'}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleReset}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg h-12"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Create Another GIF
                  </Button>
                )}
              </div>

              {/* Error Display */}
              {generationError && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{generationError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* GIF Preview - Separated Below */}
          {(isGenerating || generatedGif) && videoId && (
            <GifPreview
              gifUrl={generatedGif?.url || ''}
              fileSize={generatedGif?.fileSize || 0}
              isGenerating={isGenerating}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-xs text-gray-500">
            For personal and educational use only. You are solely responsible for respecting copyright laws and YouTube's Terms of Service.
          </p>
          <p className="text-xs text-gray-600">
            Powered by EMERSON FERREIRA
          </p>
        </div>
      </div>
    </div>
  );
}

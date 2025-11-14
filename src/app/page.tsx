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
import { validateYouTubeUrl, formatTime } from '@/lib/youtube';
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
    setStartTime(time); // Auto-set start time when pausing
  };

  const handleTimeChange = (time: number) => {
    setStartTime(time); // Auto-set start time when seeking
    setShowLivePreview(true); // Show preview when slider is released
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

        {/* URL Input */}
        {!videoId && (
          <div className="mb-8 bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtube-url" className="text-sm text-gray-300">YouTube URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="youtube-url"
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 bg-zinc-950 border-zinc-700 text-white"
                  />
                  <Button type="submit" size="lg" className="bg-purple-600 hover:bg-purple-700">
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
        )}

        {/* Main Content */}
        {videoId && (
          <div className="space-y-6">
            {/* Video Player + GIF Controls - Integrated Console */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                {/* Video Player */}
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
                />

                {/* GIF Settings - Integrated in Console */}
                <div className="border-t border-zinc-800 p-6 space-y-5">
                  {/* Duration */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-300 flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        GIF Duration
                      </Label>
                      <span className="text-xl font-mono font-bold text-pink-400">
                        {duration}s
                      </span>
                    </div>
                    <Slider
                      value={[duration]}
                      onValueChange={(value) => {
                        setDuration(Math.min(value[0], actualMaxDuration));
                        setShowLivePreview(true);
                      }}
                      max={Math.floor(actualMaxDuration)}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="grid grid-cols-4 gap-2">
                      {presets.map((preset) => (
                        <Button
                          key={preset}
                          variant={duration === preset ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setDuration(Math.min(preset, actualMaxDuration));
                            setShowLivePreview(true);
                          }}
                          disabled={preset > actualMaxDuration}
                          className={duration === preset ? 'bg-pink-600 hover:bg-pink-700' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700'}
                        >
                          {preset}s
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleGenerateGif}
                      disabled={isGenerating}
                      size="lg"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg h-12"
                    >
                      {isGenerating ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Generate GIF
                        </>
                      )}
                    </Button>
                    <Button onClick={handleReset} variant="outline" size="lg" className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700">
                      Reset
                    </Button>
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
            </div>

            {/* GIF Preview - Separated Below */}
            {(isGenerating || generatedGif) && (
              <div className="max-w-3xl mx-auto">
                <GifPreview
                  gifUrl={generatedGif?.url || ''}
                  fileSize={generatedGif?.fileSize || 0}
                  isGenerating={isGenerating}
                />
              </div>
            )}
          </div>
        )}

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

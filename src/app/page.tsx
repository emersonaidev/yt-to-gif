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
import { FileUpload } from '@/components/file-upload';
import { validateYouTubeUrl } from '@/lib/youtube';
import {
  Film,
  AlertCircle,
  Sparkles,
  Timer,
  Youtube,
  Upload,
  Loader2
} from 'lucide-react';

type InputMode = 'youtube' | 'upload';

export default function Home() {
  // Input mode state
  const [inputMode, setInputMode] = useState<InputMode>('youtube');

  // URL state
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadedVideoDuration, setUploadedVideoDuration] = useState(0);

  // Player state
  const playerRef = useRef<YouTubePlayer | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
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
    setUploadedFile(null);
    setUploadedVideoUrl(null);
  };

  const handleFileSelect = (file: File | null) => {
    setUploadedFile(file);
    setGeneratedGif(null);
    setGenerationError(null);
    setVideoId(null);
    setUrl('');
    setUrlError(null);

    if (file) {
      // Create object URL for preview
      const url = URL.createObjectURL(file);
      setUploadedVideoUrl(url);
    } else {
      setUploadedVideoUrl(null);
    }
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
    if (inputMode === 'youtube' && playerRef.current) {
      playerRef.current.seekTo(time, true);
    } else if (inputMode === 'upload' && videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleGenerateGif = async () => {
    if (!videoId && !uploadedFile) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      let response;

      if (inputMode === 'youtube' && videoId) {
        // YouTube mode
        response = await fetch('/api/convert', {
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
      } else if (inputMode === 'upload' && uploadedFile) {
        // Upload mode
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('startTime', startTime.toString());
        formData.append('duration', duration.toString());

        response = await fetch('/api/convert', {
          method: 'POST',
          body: formData,
        });
      } else {
        throw new Error('No video selected');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate GIF');
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
    setUploadedFile(null);
    setUploadedVideoUrl(null);
    setGeneratedGif(null);
    setGenerationError(null);
    setStartTime(0);
    setDuration(5);
    setShowLivePreview(false);
  };

  const hasVideo = videoId || uploadedFile;
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

        {/* Input Mode Selector */}
        <div className="max-w-3xl mx-auto mb-6">
          <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg">
            <button
              onClick={() => {
                setInputMode('youtube');
                handleReset();
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all ${
                inputMode === 'youtube'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Youtube className="h-4 w-4" />
              YouTube URL
            </button>
            <button
              onClick={() => {
                setInputMode('upload');
                handleReset();
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all ${
                inputMode === 'upload'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload Video
            </button>
          </div>
        </div>

        {/* Single Console - Always Same Structure */}
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">

            {/* Video Area - URL Input, File Upload, or Video Player */}
            {!hasVideo ? (
              <>
                <div className="aspect-video w-full bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center">
                  <div className="w-full max-w-2xl px-8">
                    {inputMode === 'youtube' ? (
                      <form onSubmit={handleUrlSubmit} className="space-y-4">
                        <div className="text-center mb-6">
                          <Youtube className="h-16 w-16 text-purple-500/30 mx-auto mb-4" />
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
                    ) : (
                      <div className="space-y-4">
                        <FileUpload
                          onFileSelect={handleFileSelect}
                          disabled={isGenerating}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Placeholder Controls - Disabled */}
                <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-4 space-y-4 opacity-30 pointer-events-none">
                  {/* ... rest of disabled controls ... */}
                </div>
              </>
            ) : (
              <>
                {inputMode === 'youtube' ? (
                  <YouTubePlayerComponent
                    videoId={videoId!}
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
                  />
                ) : (
                  // Video player for uploaded file
                  <div className="relative aspect-video bg-black">
                    <video
                      ref={videoRef}
                      src={uploadedVideoUrl || ''}
                      className="w-full h-full"
                      controls
                      onLoadedMetadata={(e) => {
                        const video = e.target as HTMLVideoElement;
                        setVideoDuration(video.duration);
                        setUploadedVideoDuration(video.duration);
                      }}
                      onTimeUpdate={(e) => {
                        const video = e.target as HTMLVideoElement;
                        setCurrentTime(video.currentTime);
                      }}
                    />
                    <Button
                      onClick={handleReset}
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-white bg-black/50 hover:bg-black/70"
                    >
                      Reset
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Control Panel - Only show when video is loaded */}
          {hasVideo && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Start Time: {startTime.toFixed(1)}s</Label>
                  <Label>Duration: {duration}s</Label>
                </div>
                <Slider
                  value={[startTime]}
                  max={videoDuration}
                  step={0.1}
                  onValueChange={([value]) => handleTimeChange(value)}
                  className="w-full"
                />
                <div className="grid grid-cols-4 gap-2">
                  {presets.map((preset) => (
                    <Button
                      key={preset}
                      variant={duration === preset ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDuration(preset)}
                      disabled={preset > actualMaxDuration}
                      className={duration === preset ? 'bg-pink-600' : 'bg-zinc-800 border-zinc-700'}
                    >
                      {preset}s
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleGenerateGif}
                  disabled={isGenerating || (!videoId && !uploadedFile)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate GIF
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="bg-zinc-800 border-zinc-700"
                >
                  Reset
                </Button>
              </div>

              {generationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{generationError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Generated GIF Preview */}
          {generatedGif && (
            <GifPreview
              gifUrl={generatedGif.url}
              fileSize={generatedGif.fileSize}
            />
          )}
        </div>
      </div>
    </div>
  );
}
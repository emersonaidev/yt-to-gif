'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GifPreviewProps {
  gifUrl: string;
  fileSize: number;
  isGenerating?: boolean;
}

export function GifPreview({ gifUrl, fileSize, isGenerating = false }: GifPreviewProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1048576) {
      return `${(bytes / 1048576).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = gifUrl;
    link.download = `youtube-gif-${Date.now()}.gif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const response = await fetch(gifUrl);
        const blob = await response.blob();
        const file = new File([blob], 'gif.gif', { type: 'image/gif' });

        await navigator.share({
          files: [file],
          title: 'Check out this GIF!',
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.origin + gifUrl);
      alert('GIF link copied to clipboard!');
    }
  };

  if (isGenerating) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent mb-4"></div>
          <p className="text-sm text-gray-400">
            Generating your GIF...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 space-y-4">
      {/* Success Message */}
      <div className="flex items-center gap-2 text-green-400 mb-4">
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">GIF Ready! ({formatFileSize(fileSize)})</span>
      </div>

      {/* GIF Preview */}
      <div className="border border-zinc-700 rounded-lg overflow-hidden bg-black">
        <img
          src={gifUrl}
          alt="Generated GIF"
          className="w-full h-auto"
          loading="lazy"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleDownload}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          size="lg"
        >
          <Download className="mr-2 h-4 w-4" />
          Download GIF
        </Button>
        <Button
          onClick={handleShare}
          variant="outline"
          size="lg"
          className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </div>

      {/* File Info */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-800/50 rounded-lg text-sm">
        <div>
          <span className="text-gray-400">File Size:</span>
          <p className="font-medium text-white">{formatFileSize(fileSize)}</p>
        </div>
        <div>
          <span className="text-gray-400">Format:</span>
          <p className="font-medium text-white">GIF</p>
        </div>
        <div>
          <span className="text-gray-400">Resolution:</span>
          <p className="font-medium text-white">480p</p>
        </div>
        <div>
          <span className="text-gray-400">Frame Rate:</span>
          <p className="font-medium text-white">15 FPS</p>
        </div>
      </div>
    </div>
  );
}

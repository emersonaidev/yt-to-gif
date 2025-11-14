'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Timer, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DurationPickerProps {
  maxDuration?: number;
  onDurationChange: (duration: number) => void;
  videoDuration: number;
  startTime: number;
}

export function DurationPicker({
  maxDuration = 30,
  onDurationChange,
  videoDuration,
  startTime,
}: DurationPickerProps) {
  const [duration, setDuration] = useState<number>(5);

  // Calculate actual max duration based on video length and start time
  const actualMaxDuration = Math.min(
    maxDuration,
    videoDuration - startTime
  );

  // Preset durations
  const presets = [3, 5, 10, 15];

  const handleDurationChange = (value: number[]) => {
    const newDuration = Math.min(value[0], actualMaxDuration);
    setDuration(newDuration);
    onDurationChange(newDuration);
  };

  const handlePresetClick = (preset: number) => {
    const newDuration = Math.min(preset, actualMaxDuration);
    setDuration(newDuration);
    onDurationChange(newDuration);
  };

  const handleManualInput = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0 && num <= actualMaxDuration) {
      setDuration(num);
      onDurationChange(num);
    }
  };

  // Estimate file size (rough estimate: ~200KB per second at 15fps, 480p)
  const estimatedSize = Math.round(duration * 200);
  const sizeDisplay = estimatedSize > 1000
    ? `${(estimatedSize / 1000).toFixed(1)} MB`
    : `${estimatedSize} KB`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          GIF Duration
        </CardTitle>
        <CardDescription>
          Choose how long your GIF should be (1-{Math.floor(actualMaxDuration)} seconds)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning if max duration is limited by video length */}
        {actualMaxDuration < maxDuration && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Maximum duration limited to {Math.floor(actualMaxDuration)}s based on video length and start time
            </AlertDescription>
          </Alert>
        )}

        {/* Preset Buttons */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Select</Label>
          <div className="grid grid-cols-4 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset}
                variant={duration === preset ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetClick(preset)}
                disabled={preset > actualMaxDuration}
              >
                {preset}s
              </Button>
            ))}
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Custom Duration</Label>
          <Slider
            value={[duration]}
            onValueChange={handleDurationChange}
            max={Math.floor(actualMaxDuration)}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1s</span>
            <span className="font-medium text-primary">{duration}s</span>
            <span>{Math.floor(actualMaxDuration)}s</span>
          </div>
        </div>

        {/* Manual Input */}
        <div className="space-y-2">
          <Label htmlFor="duration-input" className="text-sm font-medium">
            Or Enter Manually
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="duration-input"
              type="number"
              value={duration}
              onChange={(e) => handleManualInput(e.target.value)}
              min={1}
              max={Math.floor(actualMaxDuration)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">seconds</span>
          </div>
        </div>

        {/* Info Display */}
        <div className="space-y-3 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">GIF Duration:</span>
            <span className="text-lg font-bold">{duration}s</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimated Size:</span>
            <span className="font-medium">{sizeDisplay}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Frame Rate:</span>
            <span className="font-medium">15 FPS</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Resolution:</span>
            <span className="font-medium">480p</span>
          </div>
        </div>

        {/* Helpful tip */}
        <p className="text-xs text-muted-foreground">
          💡 Tip: Shorter GIFs (3-5 seconds) are easier to share and have smaller file sizes
        </p>
      </CardContent>
    </Card>
  );
}

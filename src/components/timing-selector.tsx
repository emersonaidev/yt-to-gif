'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { formatTime, parseTime } from '@/lib/youtube';
import { Clock, Play, Pause } from 'lucide-react';

interface TimingSelectorProps {
  currentTime: number;
  videoDuration: number;
  onTimeChange: (time: number) => void;
  isPaused: boolean;
}

export function TimingSelector({
  currentTime,
  videoDuration,
  onTimeChange,
  isPaused,
}: TimingSelectorProps) {
  const [manualInput, setManualInput] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<number>(0);
  const [activeMethod, setActiveMethod] = useState<'pause' | 'slider' | 'manual'>('pause');

  // Update selected time when current time changes
  useEffect(() => {
    setSelectedTime(currentTime);
  }, [currentTime]);

  // Update manual input when selected time changes
  useEffect(() => {
    setManualInput(formatTime(selectedTime));
  }, [selectedTime]);

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    const time = value[0];
    setSelectedTime(time);
    setActiveMethod('slider');
    onTimeChange(time);
  };

  // Handle manual input change
  const handleManualInputChange = (value: string) => {
    setManualInput(value);

    const parsedTime = parseTime(value);
    if (parsedTime !== null && parsedTime <= videoDuration) {
      setSelectedTime(parsedTime);
      setActiveMethod('manual');
      onTimeChange(parsedTime);
    }
  };

  // Handle pause button (capture current time)
  const handleCaptureTime = () => {
    setSelectedTime(currentTime);
    setActiveMethod('pause');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Select Start Time
        </CardTitle>
        <CardDescription>
          Choose when your GIF should start using one of the three methods below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Method 1: Pause Video */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Method 1: Pause Video
          </Label>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleCaptureTime}
              variant={activeMethod === 'pause' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              {isPaused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              Capture Current Time
            </Button>
            <span className="text-sm text-muted-foreground">
              Current: {formatTime(currentTime)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Play the video and click "Capture Current Time" when you reach the desired moment
          </p>
        </div>

        {/* Method 2: Timeline Slider */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Method 2: Timeline Slider
          </Label>
          <div className="space-y-4">
            <Slider
              value={[selectedTime]}
              onValueChange={handleSliderChange}
              max={videoDuration}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0:00</span>
              <span
                className={`font-medium ${
                  activeMethod === 'slider' ? 'text-primary' : ''
                }`}
              >
                {formatTime(selectedTime)}
              </span>
              <span>{formatTime(videoDuration)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Drag the slider to select the exact moment
          </p>
        </div>

        {/* Method 3: Manual Input */}
        <div className="space-y-2">
          <Label htmlFor="manual-time" className="text-sm font-medium">
            Method 3: Manual Input
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="manual-time"
              type="text"
              value={manualInput}
              onChange={(e) => handleManualInputChange(e.target.value)}
              placeholder="MM:SS"
              className={`w-32 ${activeMethod === 'manual' ? 'border-primary' : ''}`}
              maxLength={5}
            />
            <span className="text-sm text-muted-foreground">
              (Format: MM:SS, max: {formatTime(videoDuration)})
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter time manually in MM:SS format (e.g., 1:23)
          </p>
        </div>

        {/* Selected Time Display */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Selected Start Time:</span>
            <span className="text-lg font-bold">{formatTime(selectedTime)}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Method: {activeMethod === 'pause' && 'Pause Video'}
            {activeMethod === 'slider' && 'Timeline Slider'}
            {activeMethod === 'manual' && 'Manual Input'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

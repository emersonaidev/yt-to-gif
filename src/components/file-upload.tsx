'use client';

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Upload, X, FileVideo, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatFileSize } from '@/lib/upload-client';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

const ALLOWED_FORMATS = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'mpeg', 'mpg', 'wmv', '3gp'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 100MB limit (current: ${formatFileSize(file.size)})`;
    }

    // Check file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_FORMATS.includes(ext)) {
      return `Invalid file format. Supported: ${ALLOWED_FORMATS.join(', ')}`;
    }

    // Check MIME type
    if (!file.type.startsWith('video/')) {
      return 'Please select a valid video file';
    }

    return null;
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setError(null);
      onFileSelect(null);
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      onFileSelect(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0] || null;
    handleFileSelect(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.webm,.mov,.avi,.mkv,.flv,.mpeg,.mpg,.wmv,.3gp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      <Card
        className={`relative overflow-hidden transition-all ${
          isDragging ? 'border-purple-500 bg-purple-500/10' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-purple-400'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={selectedFile ? undefined : triggerFileInput}
      >
        {selectedFile ? (
          <div className="p-6">
            <div className="flex items-start gap-4">
              <FileVideo className="h-10 w-10 text-purple-500 flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{selectedFile.name}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Size: {formatFileSize(selectedFile.size)}
                </p>
                <p className="text-sm text-gray-400">
                  Type: {selectedFile.type || 'Unknown'}
                </p>
              </div>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                variant="ghost"
                size="icon"
                disabled={disabled}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-white font-medium mb-2">
              Drop your video here or click to browse
            </p>
            <p className="text-sm text-gray-400">
              Supports: {ALLOWED_FORMATS.join(', ')}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Max size: 100MB • Max duration: 10 minutes
            </p>
          </div>
        )}
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
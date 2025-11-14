#!/bin/bash

# Script to verify all required tools are installed

echo "Checking required tools..."
echo ""

# Function to check if command exists
check_tool() {
    if command -v $1 &> /dev/null; then
        echo "✅ $1 is installed: $(command -v $1)"
        return 0
    else
        echo "❌ $1 is NOT installed"
        return 1
    fi
}

# Check all tools
check_tool ffmpeg
check_tool yt-dlp
check_tool gifski

echo ""
echo "Tool versions:"
echo "- ffmpeg: $(ffmpeg -version | head -n 1)"
echo "- yt-dlp: $(yt-dlp --version)"
echo "- gifski: $(gifski --version)"

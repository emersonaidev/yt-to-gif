# YouTube to GIF Converter

A modern web application that converts YouTube videos into high-quality GIFs with precise timing control.

![YouTube to GIF Converter](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwind-css)

## Features

✨ **Three Timing Selection Methods:**
- **Pause Video**: Play the video and click to capture the exact moment
- **Timeline Slider**: Drag a slider for precise frame selection
- **Manual Input**: Enter timestamp in MM:SS format

🎬 **Customizable GIF Settings:**
- Duration: 1-30 seconds
- Resolution: 480p (optimized for file size)
- Frame Rate: 15 FPS
- High-quality conversion using gifski optimization

🎨 **Beautiful UI:**
- Modern, responsive design with shadcn/ui
- Real-time preview of YouTube videos
- Loading states and error handling
- Gradient backgrounds and smooth animations

📦 **Features:**
- Download generated GIFs instantly
- Share GIFs directly from the app
- Estimated file size before generation
- Clean, intuitive interface

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + TypeScript
- **UI**: TailwindCSS + shadcn/ui components
- **Video Processing**: ffmpeg + yt-dlp + gifski
- **Player**: react-youtube (YouTube IFrame API)
- **Validation**: Zod

## Prerequisites

Before running this project, make sure you have the following installed:

```bash
# Node.js 18+
node --version

# ffmpeg
ffmpeg -version

# yt-dlp
yt-dlp --version

# gifski
gifski --version
```

### Installing Prerequisites

**macOS (Homebrew):**
```bash
brew install ffmpeg yt-dlp gifski
```

**Ubuntu/Debian:**
```bash
sudo apt install ffmpeg
pip3 install yt-dlp
cargo install gifski
```

**Windows:**
- Download ffmpeg from [ffmpeg.org](https://ffmpeg.org/download.html)
- Install yt-dlp: `pip install yt-dlp`
- Install gifski: `cargo install gifski`

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gifs
```

2. Install dependencies:
```bash
npm install
```

3. Create required directories:
```bash
mkdir -p temp public/gifs
```

4. Verify tools are installed:
```bash
./scripts/check-tools.sh
```

## Usage

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

Build and start the production server:
```bash
npm run build
npm start
```

## How It Works

1. **User inputs YouTube URL**: The app validates and extracts the video ID
2. **YouTube player loads**: Embedded player using YouTube IFrame API
3. **User selects timing**: Choose start time using one of three methods
4. **User sets duration**: Select GIF length (1-30 seconds)
5. **Generate GIF**:
   - Backend downloads video segment using yt-dlp
   - Converts to GIF using ffmpeg pipeline
   - Optimizes with gifski for best quality
   - Returns GIF URL and file info
6. **Download**: User can download or share the generated GIF

## API Endpoints

### `POST /api/convert`

Generate a GIF from a YouTube video.

**Request Body:**
```json
{
  "videoId": "string",
  "startTime": number,
  "duration": number
}
```

**Response:**
```json
{
  "success": true,
  "gifUrl": "/gifs/video-id_start_duration_timestamp.gif",
  "fileSize": 1234567
}
```

### `GET /api/convert`

Get API information.

## Project Structure

```
gifs/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── convert/
│   │   │       └── route.ts       # GIF conversion API
│   │   ├── layout.tsx
│   │   └── page.tsx               # Main application page
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── youtube-player.tsx     # YouTube embed component
│   │   ├── timing-selector.tsx    # 3 timing methods
│   │   ├── duration-picker.tsx    # GIF duration selector
│   │   └── gif-preview.tsx        # Preview and download
│   └── lib/
│       ├── youtube.ts             # YouTube utilities
│       ├── ffmpeg.ts              # Video conversion logic
│       └── utils.ts               # General utilities
├── public/
│   └── gifs/                      # Generated GIFs directory
├── temp/                          # Temporary video files
├── scripts/
│   └── check-tools.sh             # Tool verification script
└── package.json
```

## Configuration

### Customizing GIF Settings

Edit `/src/lib/ffmpeg.ts`:

```typescript
// Change resolution (default: 480p width)
.size('480x?')

// Change frame rate (default: 15 FPS)
.fps(15)

// Change quality (gifski --quality, default: 90)
quality 90
```

### Changing Max Duration

Edit `/src/components/duration-picker.tsx`:

```typescript
maxDuration={30}  // Change max duration in seconds
```

## Legal Disclaimer

⚠️ **Important**: This tool is for personal and educational use only. Users are responsible for:
- Respecting copyright laws
- Following YouTube's Terms of Service
- Only converting content they have permission to use

YouTube's ToS prohibits downloading videos unless a download button is provided by YouTube. This project operates in a legal gray area similar to other YouTube-to-GIF converters.

## Troubleshooting

### "yt-dlp failed to download video"
- Video might be private or age-restricted
- Video might have download restrictions
- Update yt-dlp: `pip install -U yt-dlp`

### "FFmpeg error"
- Check ffmpeg is installed: `which ffmpeg`
- Verify video file permissions
- Check disk space in `temp/` directory

### "Gifski not available"
- App will fall back to standard ffmpeg conversion
- Install gifski for better quality: `brew install gifski`

### Build errors
- Clear `.next` cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Performance Tips

- Shorter GIFs (3-5 seconds) generate faster
- Lower resolution = smaller file sizes
- Clear old files from `temp/` and `public/gifs/` periodically

## Future Improvements

- [ ] Add rate limiting to prevent abuse
- [ ] Implement caching for repeated conversions
- [ ] Add quality presets (low/medium/high)
- [ ] Support for custom resolution
- [ ] Batch conversion
- [ ] Animated thumbnail preview
- [ ] Cloud storage integration

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Powered by [ffmpeg](https://ffmpeg.org/), [yt-dlp](https://github.com/yt-dlp/yt-dlp), and [gifski](https://gif.ski/)

---

Made with ❤️ using Claude Code

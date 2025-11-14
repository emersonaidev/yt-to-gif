# Deployment Guide - Render.com

## Why Render instead of Vercel?

This application requires system binaries (ffmpeg, yt-dlp, gifski) which are not available in Vercel's serverless environment. Render provides full Docker container support, allowing us to install all necessary tools.

## Prerequisites

- GitHub account with repository: https://github.com/emersonaidev/yt-to-gif
- Render account: https://render.com (free tier available)

## Deployment Steps

### 1. Create Render Account

Go to https://render.com and sign up with your GitHub account.

### 2. Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `emersonaidev/yt-to-gif`
3. Render will auto-detect the Dockerfile

### 3. Configure Service

**Basic Settings:**
- Name: `yt-to-gif`
- Region: Choose closest to your location (e.g., Frankfurt, Oregon)
- Branch: `main`
- Environment: `Docker`

**Instance Settings:**
- Instance Type: `Free` (or `Starter` for better performance)
- Dockerfile Path: `./Dockerfile`

**Environment Variables:**
- `NODE_ENV`: `production`
- `PORT`: `3000`

### 4. Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Pull your code from GitHub
   - Build Docker image (installs ffmpeg, yt-dlp, gifski)
   - Deploy the application
   - Provide you with a URL: `https://yt-to-gif.onrender.com`

**Build time:** ~5-10 minutes (first deployment)

### 5. Verify Deployment

Once deployed, visit your app URL and test:
1. Paste a YouTube URL
2. Select timing
3. Generate GIF
4. Verify download works

## Auto-Deploy

Render automatically deploys when you push to `main` branch:

```bash
git add .
git commit -m "your changes"
git push origin main
```

Render will detect the push and redeploy automatically.

## Troubleshooting

### Build Fails

**Problem:** Docker build timeout or fails
**Solution:**
- Check Render build logs
- Verify Dockerfile syntax
- Ensure all dependencies are available in Alpine Linux

### yt-dlp 403 Errors

**Problem:** YouTube blocks downloads
**Solution:**
- Update yt-dlp: Already handled in Dockerfile (installs latest)
- YouTube may block certain videos (age-restricted, private)

### Out of Memory

**Problem:** Free tier (512MB RAM) may be insufficient
**Solution:**
- Upgrade to Starter plan ($7/month, 2GB RAM)
- Optimize GIF settings (lower resolution, shorter duration)

### Slow Performance

**Problem:** Free tier spins down after 15 minutes of inactivity
**Solution:**
- First request after spin-down takes ~30-60 seconds
- Upgrade to paid plan for always-on instances

## Free Tier Limitations

Render Free Tier includes:
- ✅ 512 MB RAM
- ✅ Shared CPU
- ✅ Auto-spin down after 15 minutes inactivity
- ✅ Automatic SSL certificate
- ⚠️ First request after sleep is slow
- ⚠️ 750 hours/month (then sleeps)

## Cost Optimization

**Free Tier is sufficient for:**
- Personal use
- Testing and development
- Low traffic (< 100 conversions/day)

**Upgrade to Starter ($7/month) for:**
- Always-on instance (no spin down)
- 2 GB RAM (better performance)
- Higher traffic capacity
- Faster conversion times

## Alternative: Railway

If Render doesn't work, try Railway.app:

1. Go to https://railway.app
2. Create new project from GitHub repo
3. Railway auto-detects Dockerfile
4. Deploy (similar process to Render)

## Monitoring

**Check Application Health:**
- Visit: `https://your-app.onrender.com/api/convert`
- Should return API information

**Check Logs:**
- Render Dashboard → Your Service → Logs
- Monitor conversion requests and errors

## Environment Variables (Optional)

Add these in Render dashboard if needed:

```
MAX_GIF_DURATION=30
MAX_VIDEO_SIZE_MB=100
CLEANUP_INTERVAL_HOURS=24
```

## Security Recommendations

1. **Rate Limiting:** Consider adding rate limiting to prevent abuse
2. **File Size Limits:** Already configured (720p max)
3. **Duration Limits:** Already configured (30s max)
4. **CORS:** Configure if needed for specific domains

## Support

For deployment issues:
- Render Docs: https://render.com/docs
- GitHub Issues: https://github.com/emersonaidev/yt-to-gif/issues

---

**Ready to deploy!** Just connect your GitHub repo to Render and it will handle everything automatically using the Dockerfile.

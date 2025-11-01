# SaveTracker - Deployment Guide

## Deploy to Render

This project is configured to deploy automatically to Render using the `render.yaml` file.

### Quick Deploy

1. **Connect to GitHub**
   - Push your code to a GitHub repository
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Automatic Detection**
   - Render will automatically detect the `render.yaml` file
   - The configuration will be applied automatically

3. **Manual Configuration** (if needed)
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`
   - **Auto-Deploy**: Yes (recommended)

### Environment Variables

The following environment variables are pre-configured:
- `NODE_ENV=production`
- `VITE_APP_NAME=SaveTracker`
- `VITE_APP_VERSION=1.0.0`

### Custom Domain (Optional)

1. Go to your service settings in Render
2. Navigate to "Custom Domains"
3. Add your domain (e.g., `savetracker.yourdomain.com`)
4. Update your DNS records as instructed

### Features Included in Deployment

✅ **Optimized Build**: Production-ready Vite build
✅ **SPA Routing**: All routes redirect to index.html
✅ **Security Headers**: X-Frame-Options, X-Content-Type-Options
✅ **Static Caching**: Long-term caching for assets
✅ **Health Checks**: Automatic health monitoring
✅ **Free Tier**: Configured for Render's free plan

### Post-Deployment

- Your app will be available at: `https://savetracker-app.onrender.com`
- Build logs are available in the Render dashboard
- Automatic deploys on every push to main branch

### Troubleshooting

**Build Fails**: Check the build logs in Render dashboard
**Routing Issues**: Ensure `routes` configuration in render.yaml is correct
**Assets Not Loading**: Verify `staticPublishPath` is set to `./dist`

### Production Checklist

- [ ] Environment variables configured
- [ ] Custom domain set up (optional)
- [ ] SSL certificate (automatic with Render)
- [ ] Performance monitoring enabled
- [ ] Error tracking configured (optional)

---

**Need Help?** Check the [Render Documentation](https://render.com/docs) or [contact support](https://render.com/support).
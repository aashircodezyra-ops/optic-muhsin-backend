# 🚀 Backend Deployment Guide - Vercel

## ✅ Git Setup Complete

Backend ko GitHub repository mein push kar diya gaya hai:
- Repository: `https://github.com/aashircodezyra-ops/optic-muhsin-backend.git`
- Branch: `main`

---

## 📦 Vercel Deployment Steps

### Method 1: Vercel Dashboard (Recommended)

1. **Vercel Account**
   - https://vercel.com par sign up/login karein

2. **New Project**
   - Dashboard se "Add New Project" click karein
   - GitHub repository select karein: `aashircodezyra-ops/optic-muhsin-backend`
   - Import karein

3. **Project Settings**
   - **Framework Preset**: Other
   - **Root Directory**: `backend` (agar monorepo ho)
   - **Build Command**: (leave empty - Vercel auto-detect karega)
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`

4. **Environment Variables**
   - Add karein sabhi required variables:
     ```
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     API_FOOTBALL_KEY=your_api_football_key
     NEWSAPI_KEY=c9c9168f747e47af8b72472d9ce3faf8
     NEWS_API_KEY_1=your_news_api_key_1
     NEWS_API_KEY_2=your_news_api_key_2
     TRT_RSS_URL=https://www.trthaber.com/spor_articles.rss
     FRONTEND_URL=https://your-frontend-domain.vercel.app
     PORT=5000
     NODE_ENV=production
     ```

5. **Deploy**
   - "Deploy" button click karein
   - Wait for deployment to complete

---

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from backend directory
cd backend
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? optic-muhsin-backend
# - Directory? ./
# - Override settings? No
```

---

## ⚙️ Vercel Configuration

### vercel.json (Already Created)

File `backend/vercel.json` already created hai with proper configuration.

### Important Settings

1. **Node.js Version**
   - Vercel automatically detects from `package.json`
   - Ensure Node.js 18+ in `package.json`:
     ```json
     "engines": {
       "node": ">=18.0.0"
     }
     ```

2. **Serverless Functions**
   - Vercel uses serverless functions
   - `server.js` will be deployed as serverless function
   - All routes will work automatically

3. **Environment Variables**
   - Add all required variables in Vercel dashboard
   - Never commit `.env` file

---

## 🔧 Post-Deployment Configuration

### 1. Update CORS

After deployment, update `backend/server.js` CORS settings:

```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://your-frontend-domain.vercel.app', // Add your frontend URL
  // ... other origins
];
```

### 2. Update Frontend API URL

Frontend `.env` file mein:
```env
VITE_API_URL=https://your-backend.vercel.app
```

### 3. MongoDB Atlas

- Ensure MongoDB Atlas allows connections from Vercel IPs
- Add `0.0.0.0/0` to IP whitelist (or specific Vercel IPs)

### 4. Test Deployment

```bash
# Test health endpoint
curl https://your-backend.vercel.app/api/health

# Test API status
curl https://your-backend.vercel.app/api/status
```

---

## 📝 Deployment Checklist

- [x] Git repository initialized
- [x] Code pushed to GitHub
- [x] vercel.json created
- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] CORS updated for production
- [ ] Frontend API URL updated
- [ ] MongoDB Atlas whitelist updated
- [ ] All endpoints tested

---

## 🚨 Common Issues

### Issue 1: Build Fails

**Error**: Build command failed

**Solution**:
- Check `package.json` scripts
- Ensure all dependencies are in `dependencies` (not `devDependencies`)
- Check Node.js version compatibility

### Issue 2: Environment Variables Missing

**Error**: API calls fail

**Solution**:
- Add all environment variables in Vercel dashboard
- Redeploy after adding variables

### Issue 3: CORS Errors

**Error**: CORS policy blocking requests

**Solution**:
- Update CORS in `server.js` to allow frontend domain
- Add frontend URL to `allowedOrigins`

### Issue 4: MongoDB Connection Fails

**Error**: Cannot connect to MongoDB

**Solution**:
- Check MongoDB Atlas IP whitelist
- Add `0.0.0.0/0` to allow all IPs (or Vercel IPs)
- Verify connection string in environment variables

### Issue 5: Serverless Function Timeout

**Error**: Function execution timeout

**Solution**:
- Vercel free tier: 10 seconds max
- Optimize long-running operations
- Use background jobs for cron tasks
- Consider Vercel Pro for longer timeouts

---

## 🔄 Continuous Deployment

Vercel automatically deploys on:
- Push to `main` branch
- Pull requests (preview deployments)

**No manual deployment needed!**

---

## 📊 Monitoring

### Vercel Dashboard
- View deployments
- Check logs
- Monitor performance
- View analytics

### Logs
```bash
# View logs via CLI
vercel logs

# Or in Vercel dashboard
# Project → Deployments → Click deployment → Logs
```

---

## 🔐 Security Notes

1. ✅ **Never commit `.env` file**
2. ✅ **Use Vercel environment variables**
3. ✅ **Keep API keys secure**
4. ✅ **Use HTTPS only**
5. ✅ **Enable CORS properly**

---

## 📚 Additional Resources

- Vercel Docs: https://vercel.com/docs
- Node.js on Vercel: https://vercel.com/docs/concepts/functions/serverless-functions
- Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables

---

## ✅ Next Steps

1. **Push to GitHub** (if not done):
   ```bash
   cd backend
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Use Vercel dashboard (Method 1) - Easiest
   - Or use Vercel CLI (Method 2)

3. **Configure Environment Variables**:
   - Add all required variables in Vercel dashboard

4. **Update Frontend**:
   - Update `VITE_API_URL` to Vercel backend URL

5. **Test**:
   - Test all endpoints
   - Verify CORS
   - Check MongoDB connection

---

**Status: ✅ Ready for Vercel Deployment!**

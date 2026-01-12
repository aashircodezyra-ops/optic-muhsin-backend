# 🚀 Vercel Deployment - Quick Guide

## ✅ Git Setup Complete

Backend code GitHub par push ho chuka hai:
- Repository: `https://github.com/aashircodezyra-ops/optic-muhsin-backend.git`
- Branch: `main`

---

## 📦 Vercel Deployment (3 Steps)

### Step 1: Vercel Account & Import

1. **Vercel par jayein**: https://vercel.com
2. **Sign up/Login** karein (GitHub se connect karein)
3. **"Add New Project"** click karein
4. **Repository select karein**: `aashircodezyra-ops/optic-muhsin-backend`
5. **Import** button click karein

### Step 2: Project Configuration

**Settings:**
- **Framework Preset**: Other
- **Root Directory**: `./` (root directory)
- **Build Command**: (leave empty)
- **Output Directory**: (leave empty)
- **Install Command**: `npm install`

**Environment Variables** (Important!):
Click "Environment Variables" aur add karein:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
API_FOOTBALL_KEY=your_api_football_key
NEWSAPI_KEY=c9c9168f747e47af8b72472d9ce3faf8
NEWS_API_KEY_1=your_news_api_key_1
NEWS_API_KEY_2=your_news_api_key_2
TRT_RSS_URL=https://www.trthaber.com/spor_articles.rss
FRONTEND_URL=https://your-frontend-domain.vercel.app
PORT=5000
NODE_ENV=production
```

### Step 3: Deploy

1. **"Deploy"** button click karein
2. Wait for deployment (2-3 minutes)
3. Deployment URL mil jayega: `https://your-backend.vercel.app`

---

## 🔧 Post-Deployment

### 1. Update CORS

After deployment, `backend/server.js` mein CORS update karein:

```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://your-frontend-domain.vercel.app', // Add your frontend URL
];
```

### 2. Update Frontend

Frontend `.env` file mein:
```env
VITE_API_URL=https://your-backend.vercel.app
```

### 3. Test Deployment

```bash
# Health check
curl https://your-backend.vercel.app/api/health

# API status
curl https://your-backend.vercel.app/api/status
```

---

## ⚠️ Important Notes

1. **Cron Jobs**: Vercel serverless functions mein cron jobs kaam nahi karenge. Alternative solutions:
   - External cron service (cron-job.org)
   - Vercel Cron (Pro plan)
   - API endpoints manually trigger karein

2. **MongoDB Atlas**: 
   - IP whitelist mein `0.0.0.0/0` add karein (all IPs allow)
   - Ya Vercel IPs add karein

3. **Environment Variables**:
   - Sabhi variables Vercel dashboard mein add karein
   - `.env` file commit mat karein

4. **Serverless Functions**:
   - Vercel free tier: 10 seconds max execution time
   - Long operations ke liye optimize karein

---

## 🚀 Push to GitHub

Agar abhi push nahi hua:

```bash
cd backend
git push -u origin main
```

---

## ✅ Deployment Checklist

- [x] Git repository initialized
- [x] Code committed
- [x] Branch set to main
- [x] Remote added
- [x] vercel.json created
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] CORS updated
- [ ] Frontend API URL updated

---

**Status: ✅ Ready to Push & Deploy!**

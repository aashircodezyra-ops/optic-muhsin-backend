# OptikGoal Backend API

Complete backend system for OptikGoal sports prediction platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials

# Run development server
npm run dev

# Run production server
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Database, JWT config
│   ├── controllers/     # Business logic
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middlewares/     # Auth, validation, rate limiting
│   ├── services/        # External services (OneSignal, API-Football, RSS)
│   ├── utils/           # Helpers and translations
│   └── rss/             # RSS cron jobs
├── server.js            # Main entry point
├── package.json
└── .env.example         # Environment variables template
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users` - Get all users (Admin)

### VIP
- `GET /api/vip/plans` - Get VIP plans
- `POST /api/vip/payment` - Create payment intent
- `POST /api/vip/activate` - Activate VIP
- `GET /api/vip/status` - Get VIP status

### Predictions
- `POST /api/predictions` - Create prediction (VIP only)
- `GET /api/predictions` - Get all predictions
- `GET /api/predictions/my` - Get my predictions
- `GET /api/predictions/:id` - Get single prediction
- `PUT /api/predictions/:id` - Update prediction
- `DELETE /api/predictions/:id` - Delete prediction

### Live Scores
- `GET /api/live-scores/today` - Get today's matches
- `GET /api/live-scores/live` - Get live matches
- `GET /api/live-scores/match/:fixtureId` - Get match details
- `GET /api/live-scores/leagues` - Get leagues

### Bulletin
- `GET /api/bulletin` - Get matches
- `GET /api/bulletin/:id` - Get single match
- `POST /api/bulletin` - Create/Update match (Admin)

### Comments
- `POST /api/comments` - Create comment
- `GET /api/comments` - Get comments
- `POST /api/comments/:id/like` - Like comment
- `DELETE /api/comments/:id` - Delete comment

### News
- `GET /api/news` - Get all news
- `GET /api/news/:id` - Get single news
- `POST /api/news/refresh` - Refresh news (Admin)

### Notifications
- `POST /api/notifications/vip` - Notify VIP users (Admin)
- `POST /api/notifications/users` - Notify specific users (Admin)

### Ads
- `GET /api/ads` - Get all ads
- `GET /api/ads/slot/:slot` - Get ad by slot
- `POST /api/ads` - Create ad (Admin)
- `PUT /api/ads/:id` - Update ad (Admin)
- `DELETE /api/ads/:id` - Delete ad (Admin)
- `POST /api/ads/:id/click` - Track ad click

## 🔐 Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## 📝 Environment Variables

See `.env.example` for all required variables.

## 🛠️ Features

- ✅ JWT Authentication
- ✅ VIP Membership System
- ✅ Predictions (VIP only)
- ✅ Live Scores (API-Football)
- ✅ Match Bulletin
- ✅ Comments with spam protection
- ✅ RSS News Feeds (Goal.com, TRT)
- ✅ Push Notifications (OneSignal)
- ✅ Ad Management
- ✅ Multi-language support (EN, TR, AR)
- ✅ Rate Limiting
- ✅ Input Validation
- ✅ Cron Jobs (RSS, VIP expiry)

## 📦 Dependencies

- express - Web framework
- mongoose - MongoDB ODM
- jsonwebtoken - JWT authentication
- bcryptjs - Password hashing
- axios - HTTP client
- cors - CORS middleware
- dotenv - Environment variables
- node-cron - Cron jobs
- xml2js - RSS parsing
- onesignal-node - Push notifications
- morgan - HTTP logger
- express-validator - Input validation
- express-rate-limit - Rate limiting

## 🎯 User Roles

- `normal` - Regular user
- `vip` - VIP member
- `admin` - Administrator

## 📊 VIP Plans

- `monthly` - 1 month
- `3months` - 3 months
- `yearly` - 1 year

## 🔄 Cron Jobs

- RSS News Fetch: Every 5 minutes
- VIP Expiry Check: Daily at midnight

## 🚨 Rate Limits

- General API: 100 requests per 15 minutes
- Auth: 5 requests per 15 minutes
- Comments: 1 request per 10 seconds
- Predictions: 20 requests per hour

## 📝 Notes

- All dates use ISO 8601 format
- All responses follow consistent JSON structure
- Error messages support multi-language
- VIP predictions limited per day (configurable)


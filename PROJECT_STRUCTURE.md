# OptikGoal Backend - Project Structure

This document describes the organization and structure of the OptikGoal backend codebase.

## 📁 Directory Structure

```
backend/
├── server.js                    # Main application entry point
├── package.json                 # Dependencies and scripts
├── .env                        # Environment variables (not in repo)
│
├── src/
│   ├── config/                 # Configuration files
│   │   ├── database.js         # MongoDB connection configuration
│   │   └── jwt.js              # JWT token configuration
│   │
│   ├── controllers/            # Request handlers (business logic)
│   │   ├── authController.js           # Authentication (login, register)
│   │   ├── userController.js           # User profile management
│   │   ├── adminController.js          # Admin authentication
│   │   ├── adminUsersController.js     # Admin user management
│   │   ├── adminPredictionsController.js # Admin prediction management
│   │   ├── adminCommentsController.js   # Admin comment management
│   │   ├── adminDashboardController.js  # Admin dashboard stats
│   │   ├── adminReportsController.js    # Admin reports & analytics
│   │   ├── adminSettingsController.js   # Admin settings
│   │   ├── predictionController.js     # User predictions
│   │   ├── commentsController.js        # User comments
│   │   ├── vipController.js             # VIP membership management
│   │   ├── newsController.js            # News articles
│   │   ├── notificationController.js    # Push notifications
│   │   ├── bulletinController.js        # Match bulletins
│   │   ├── footballController.js        # Football API endpoints
│   │   ├── basketballController.js      # Basketball API endpoints
│   │   ├── liveScoresController.js     # Legacy live scores (deprecated)
│   │   ├── adController.js              # Advertisement management
│   │   └── adConfigurationController.js # Ad configuration
│   │
│   ├── models/                 # MongoDB/Mongoose models
│   │   ├── User.js                      # User model
│   │   ├── Prediction.js                 # Prediction model
│   │   ├── Comment.js                    # Comment model
│   │   ├── News.js                       # News article model
│   │   ├── Membership.js                 # VIP membership model
│   │   ├── Bulletin.js                  # Match bulletin model
│   │   ├── Ad.js                         # Advertisement model
│   │   ├── AdConfiguration.js            # Ad configuration model
│   │   ├── PredictionCache.js            # Prediction cache model
│   │   │
│   │   # Football models
│   │   ├── FootballLiveMatch.js
│   │   ├── FootballUpcomingMatch.js
│   │   ├── FootballLeague.js
│   │   ├── FootballTeam.js
│   │   └── FootballStanding.js
│   │   │
│   │   # Basketball models
│   │   ├── BasketballLiveMatch.js
│   │   ├── BasketballUpcomingMatch.js
│   │   ├── BasketballLeague.js
│   │   ├── BasketballTeam.js
│   │   └── BasketballStanding.js
│   │   │
│   │   # TheSportsDB models
│   │   ├── SportsDBTeam.js
│   │   └── SportsDBLeague.js
│   │
│   ├── routes/                 # API route definitions
│   │   ├── auth.js                     # /api/auth
│   │   ├── userRoutes.js               # /api/user (user profile)
│   │   ├── users.js                    # /api/users (admin user management)
│   │   ├── admin.js                    # /api/admin (admin routes)
│   │   ├── adminComments.js            # /api/admin/comments
│   │   ├── predictions.js              # /api/predictions
│   │   ├── comments.js                 # /api/comments
│   │   ├── vip.js                      # /api/vip
│   │   ├── news.js                     # /api/news
│   │   ├── notifications.js            # /api/notifications
│   │   ├── bulletin.js                 # /api/bulletin
│   │   ├── football.js                 # /api/football
│   │   ├── basketball.js               # /api/basketball
│   │   ├── liveScores.js               # /api/live-scores (legacy)
│   │   ├── ads.js                      # /api/ads
│   │   └── setup.js                    # /api/setup (dev only)
│   │
│   ├── middlewares/            # Express middlewares
│   │   ├── auth.js                     # User authentication
│   │   ├── adminAuth.js                # Admin authentication
│   │   ├── rateLimiter.js              # Rate limiting
│   │   └── validator.js                 # Request validation
│   │
│   ├── services/               # Business logic & external services
│   │   ├── apiFootball.js              # API-Football integration
│   │   ├── cacheService.js             # In-memory caching
│   │   ├── newsService.js               # News fetching & processing
│   │   ├── rssService.js                # RSS feed parsing
│   │   ├── predictionEngine.js         # Prediction generation logic
│   │   ├── sportsCron.js                # Sports data cron jobs
│   │   ├── sportsDB.js                  # TheSportsDB integration
│   │   └── oneSignal.js                 # Push notification service
│   │
│   ├── cron/                   # Scheduled cron jobs
│   │   ├── newsCron.js                 # News fetching cron (every 5 min)
│   │   └── predictionsCron.js          # Prediction generation cron (every 6 hours)
│   │
│   └── utils/                  # Utility functions
│       ├── helpers.js                  # General helper functions
│       ├── spamFilter.js               # Comment spam detection
│       └── translations.js             # Translation utilities
│
└── scripts/                    # Utility scripts
    ├── createAdmin.js                  # Create admin user script
    └── fixVipPlan.js                   # Fix VIP plan script
```

## 🔄 Data Flow

### Request Flow
1. **Request** → `server.js` (entry point)
2. **Route** → `routes/*.js` (route definition)
3. **Middleware** → `middlewares/*.js` (auth, rate limiting, validation)
4. **Controller** → `controllers/*.js` (business logic)
5. **Service** → `services/*.js` (external APIs, complex logic)
6. **Model** → `models/*.js` (database operations)
7. **Response** → JSON response to client

### Cron Jobs Flow
1. **Cron Schedule** → `cron/*.js` (scheduled tasks)
2. **Service** → `services/*.js` (business logic)
3. **Model** → `models/*.js` (database operations)

## 📝 Key Components

### Controllers
- Handle HTTP requests and responses
- Validate input data
- Call services for business logic
- Return JSON responses

### Services
- Contain complex business logic
- Interact with external APIs
- Handle data processing
- Can be reused across controllers

### Models
- Define database schemas
- Handle database operations
- Include validation rules

### Routes
- Define API endpoints
- Map URLs to controllers
- Apply middlewares

### Middlewares
- Authentication & authorization
- Rate limiting
- Request validation
- Error handling

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/me` - Get admin info
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List users
- `GET /api/admin/predictions` - List predictions
- `GET /api/admin/comments` - List comments

### Predictions
- `GET /api/predictions` - Get predictions
- `POST /api/predictions` - Create prediction (VIP only)
- `GET /api/predictions/:id` - Get prediction details

### Sports Data
- `GET /api/football/live` - Live football matches
- `GET /api/football/match/:id` - Football match details
- `GET /api/basketball/live` - Live basketball matches
- `GET /api/basketball/match/:id` - Basketball match details

## 🔧 Configuration

### Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT token secret
- `API_FOOTBALL_KEY` - API-Football API key
- `FRONTEND_URL` - Frontend URL for CORS
- `PORT` - Server port (default: 5000)

## 📦 Dependencies

### Core
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `dotenv` - Environment variables

### External APIs
- `axios` - HTTP client for API calls
- `rss-parser` - RSS feed parsing

### Utilities
- `express-rate-limit` - Rate limiting
- `node-cron` - Cron job scheduling
- `morgan` - HTTP request logger

## 🧪 Testing

After making changes, verify:
1. All routes are accessible
2. Authentication works correctly
3. Database operations succeed
4. External API integrations function
5. Cron jobs run as scheduled

## 📚 Best Practices

1. **Separation of Concerns**: Controllers handle requests, services handle logic, models handle data
2. **Error Handling**: Always wrap async operations in try/catch
3. **Validation**: Validate input at route/controller level
4. **Documentation**: Add JSDoc comments to functions
5. **Caching**: Use cache service for frequently accessed data
6. **Rate Limiting**: Apply rate limits to prevent abuse

## 🔄 Future Improvements

- [ ] Add Redis for production caching
- [ ] Implement WebSocket for real-time updates
- [ ] Add comprehensive test suite
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement request logging
- [ ] Add monitoring and health checks


# Sports API Integration Setup Guide

This document describes the complete integration of API-Football (Football + Basketball) into the OptikGoal backend system.

## Overview

The system implements a **caching architecture** where:
- Backend cron jobs fetch data from API-Football
- Data is stored in MongoDB collections
- Frontend always reads from our database (never calls external API directly)
- This minimizes API requests and ensures fast response times

## Environment Setup

### Required Environment Variables

Add the following to your `backend/.env` file:

```env
# API-Football Key (REQUIRED)
API_FOOTBALL_KEY=7835372e534573da0c6a75bf6effa651

# MongoDB Connection (if not already set)
MONGO_URI=your_mongodb_connection_string

# Server Configuration
PORT=5000
NODE_ENV=development
```

**⚠️ IMPORTANT:** Never commit the `.env` file to version control. The API key must remain secure.

## Database Collections

The following MongoDB collections are created:

### Football Collections
- `footballlivematches` - Live football matches
- `footballupcomingmatches` - Upcoming football fixtures
- `footballleagues` - Football leagues information
- `footballteams` - Football teams data
- `footballstandings` - League standings

### Basketball Collections
- `basketballlivematches` - Live basketball matches
- `basketballupcomingmatches` - Upcoming basketball games
- `basketballleagues` - Basketball leagues information
- `basketballteams` - Basketball teams data
- `basketballstandings` - League standings

## Cron Jobs

### Every 1 Minute
- Fetches live football matches
- Fetches live basketball matches
- Updates database with latest scores, goals, cards, time
- Cleans up old live matches (older than 2 hours)

### Every 12 Hours
- Fetches leagues (football & basketball)
- Fetches teams (for major leagues)
- Fetches standings (for major leagues)
- Fetches upcoming fixtures (next 7 days)

## API Endpoints

### Football Endpoints

All endpoints read from MongoDB (cached data):

- `GET /api/football/live` - Get live football matches
- `GET /api/football/upcoming?date=YYYY-MM-DD&leagueId=123` - Get upcoming matches
- `GET /api/football/leagues?country=England` - Get leagues
- `GET /api/football/teams?leagueId=39&search=Arsenal` - Get teams
- `GET /api/football/standings?leagueId=39&season=2024` - Get standings
- `GET /api/football/match/:id` - Get match details

### Basketball Endpoints

- `GET /api/basketball/live` - Get live basketball matches
- `GET /api/basketball/upcoming?date=YYYY-MM-DD&leagueId=12` - Get upcoming games
- `GET /api/basketball/leagues?country=USA` - Get leagues
- `GET /api/basketball/teams?leagueId=12&search=Lakers` - Get teams
- `GET /api/basketball/standings?leagueId=12&season=2024` - Get standings
- `GET /api/basketball/match/:id` - Get game details

## Frontend Integration

The frontend components have been updated to use the new endpoints:

### Home Page (`src/components/Home.jsx`)
- Live matches: `/api/football/live`
- Upcoming matches: `/api/football/upcoming`
- Featured sports: Counts from both football and basketball

### Live Scores Page (`src/components/LiveScores.jsx`)
- Real-time data: `/api/football/live`
- Auto-refreshes every minute

### Bulletin Page (`src/components/MatchBulletin.jsx`)
- Today's fixtures: `/api/football/upcoming?date=YYYY-MM-DD`

## API Response Format

All endpoints return data in this format:

```json
{
  "success": true,
  "data": {
    "matches": [...],
    // or "leagues": [...], "teams": [...], etc.
  },
  "count": 10
}
```

## Error Handling

- All API calls include error handling
- Rate limiting protection via `apiLimiter` middleware
- Logging for debugging
- Graceful fallbacks if API is unavailable

## Rate Limiting

The system includes rate limiting to protect the API:
- Uses `express-rate-limit` middleware
- Limits requests per IP address
- Prevents abuse of the free API plan

## Major Leagues Tracked

### Football
- Premier League (39)
- La Liga (140)
- Serie A (135)
- Ligue 1 (61)
- Bundesliga (78)

### Basketball
- NBA (12)
- Euroleague (13)

## Troubleshooting

### Cron Jobs Not Running
1. Check server logs for cron initialization
2. Verify `node-cron` is installed
3. Ensure MongoDB connection is active

### No Data in Database
1. Verify `API_FOOTBALL_KEY` is set correctly in `.env`
2. Check cron job logs for errors
3. Wait for cron jobs to run (1 min for live, 12 hours for other data)

### API Errors
1. Check API key validity
2. Verify rate limits haven't been exceeded
3. Check network connectivity

## Security Notes

- ✅ API key is stored in `.env` (never in code)
- ✅ API key is never exposed to frontend
- ✅ All endpoints use rate limiting
- ✅ Database queries are sanitized
- ✅ Error messages don't leak sensitive info

## Next Steps

1. Add `API_FOOTBALL_KEY` to your `.env` file
2. Restart the backend server
3. Wait for cron jobs to populate initial data
4. Test endpoints using Postman or curl
5. Verify frontend displays data correctly

## Support

For issues or questions:
- Check server logs: `npm run dev` (backend)
- Verify MongoDB connection
- Test API endpoints directly
- Review cron job output in console



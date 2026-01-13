# 🔑 API Key Update

## New API Key
```
9ad61eb6-dab4-4968-82cc-2eca2a2b9453
```

## ⚠️ IMPORTANT: Update Environment Variable

### For Local Development:
Add to `backend/.env`:
```env
API_FOOTBALL_KEY=9ad61eb6-dab4-4968-82cc-2eca2a2b9453
```

### For Vercel Deployment:
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Update `API_FOOTBALL_KEY` with: `9ad61eb6-dab4-4968-82cc-2eca2a2b9453`
5. Redeploy the application

## ✅ What's Updated

1. ✅ Players endpoints added for football and basketball
2. ✅ Player statistics endpoints added
3. ✅ All existing endpoints verified
4. ✅ Error handling improved

## 📋 New Endpoints

### Football Players
- `GET /api/football/players?teamId=123&leagueId=39&season=2024&search=ronaldo`
- `GET /api/football/player/:id/stats?season=2024&leagueId=39`

### Basketball Players
- `GET /api/basketball/players?teamId=123&leagueId=12&season=2024&search=james`
- `GET /api/basketball/player/:id/stats?season=2024&leagueId=12`

## 🧪 Testing

After updating the API key, test all endpoints:
1. Live matches
2. Upcoming matches
3. Leagues
4. Teams
5. Standings
6. Match details
7. Players (NEW)
8. Player stats (NEW)

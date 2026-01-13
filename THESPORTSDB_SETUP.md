# 🏆 TheSportsDB API Setup

## ✅ API Information

**Base URL:**
- v1: `https://www.thesportsdb.com/api/v1/json`
- v2: `https://www.thesportsdb.com/api/v2/json` (Premium only)

**Free API Key:** `123`

**Documentation:** https://www.thesportsdb.com/documentation#base_url

---

## 🔑 Authentication

### V1 API (Free & Premium)
Authentication URL mein `/123/` ya premium key add karte hain:

**Free Key Example:**
```
https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=Arsenal
```

**Premium Key Example:**
```
https://www.thesportsdb.com/api/v1/json/YOUR_PREMIUM_KEY/searchteams.php?t=Arsenal
```

### V2 API (Premium Only)
Header mein `X-API-KEY` use karte hain:
```
X-API-KEY: YOUR_PREMIUM_KEY
```

---

## 📋 Available Endpoints

### V1 API Endpoints (Free Tier)

#### Search
- **Search Teams**: `/123/searchteams.php?t=TeamName`
- **Search Events**: `/123/searchevents.php?e=EventName`
- **Search Players**: `/123/searchplayers.php?p=PlayerName`

#### Lookup
- **Lookup Team**: `/123/lookupteam.php?id=TeamID`
- **Lookup League**: `/123/lookupleague.php?id=LeagueID`
- **Lookup Player**: `/123/lookupplayer.php?id=PlayerID`
- **Lookup Event**: `/123/lookupevent.php?id=EventID`

#### List
- **All Leagues**: `/123/all_leagues.php`
- **All Teams in League**: `/123/lookup_all_teams.php?id=LeagueID`
- **All Seasons**: `/123/search_all_seasons.php?id=LeagueID`

#### Schedule
- **Next Events**: `/123/eventsnext.php?id=TeamID`
- **Last Events**: `/123/eventslast.php?id=TeamID`
- **League Schedule**: `/123/eventsseason.php?id=LeagueID&s=Season`

### V2 API Endpoints (Premium Only)

#### Livescores
- **Livescore All**: `/api/v2/json/livescore/all`
- **Livescore Sport**: `/api/v2/json/livescore/soccer`
- **Livescore League**: `/api/v2/json/livescore/4399`

#### Schedule
- **Next Events**: `/api/v2/json/schedule/next/team/133612`
- **Previous Events**: `/api/v2/json/schedule/previous/team/133612`

---

## ⚠️ Important Notes

1. **Free Tier Limits:**
   - 30 requests per minute
   - Limited endpoints
   - No live scores
   - No V2 API access

2. **Premium Tier ($9/month):**
   - 100 requests per minute
   - All V1 endpoints
   - Live scores access
   - V2 API access
   - Video highlights

3. **Rate Limits:**
   - Free: 30/min
   - Premium: 100/min
   - Business: 120/min
   - 429 error if limit exceeded

---

## 🔧 Current Implementation

### TheSportsDB Service (`sportsDB.js`)
- ✅ Using v1 API
- ✅ Free key `123` as default
- ✅ Premium key from `THE_SPORTS_DB_KEY` env var
- ✅ Proper endpoint formatting

### API-Football Service (`apiFootball.js`)
- ⚠️ Currently configured for API-Sports.io
- ⚠️ Needs different API key format
- ⚠️ Different base URLs

---

## 🎯 Recommendation

**For Live Scores & Real-time Data:**
- Use API-Sports.io (requires valid API key)
- Or TheSportsDB Premium (has live scores)

**For Static Data (Teams, Leagues, Players):**
- TheSportsDB Free tier works well
- Use free key `123`

---

## 📝 Environment Variables

```env
# TheSportsDB (Free tier uses '123', premium uses custom key)
THE_SPORTS_DB_KEY=123

# API-Sports.io (if using for live data)
API_FOOTBALL_KEY=your_api_sports_io_key
```

---

**Status:** ✅ TheSportsDB service properly configured with free key `123`

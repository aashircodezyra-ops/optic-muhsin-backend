# 🔧 API Header Fix

## ❌ Problem
API was returning 403 error:
```
token: 'Method not supported, please check your request and credentials.'
```

## ✅ Solution
Changed headers from RapidAPI format to API-Sports.io format:

### Before (Wrong):
```javascript
headers: {
  'x-rapidapi-key': API_KEY,
  'x-rapidapi-host': 'v3.football.api-sports.io',
}
```

### After (Correct):
```javascript
headers: {
  'x-apisports-key': API_KEY,
}
```

## 📝 Notes
- API-Sports.io uses `x-apisports-key` header (NOT `x-rapidapi-key`)
- No `x-rapidapi-host` header needed
- API key format: `9ad61eb6-dab4-4968-82cc-2eca2a2b9453` ✅

## ✅ Status
- Headers fixed for both Football and Basketball APIs
- Server restart required for changes to take effect

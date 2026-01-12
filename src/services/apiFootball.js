const axios = require('axios');

const API_KEY = process.env.API_FOOTBALL_KEY;

// Football API (v3)
const FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';

// Basketball API (v1)
const BASKETBALL_BASE_URL = 'https://v1.basketball.api-sports.io';

// Create axios instances with proper headers
// API-Football uses RapidAPI format headers
const footballClient = axios.create({
  baseURL: FOOTBALL_BASE_URL,
  headers: {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': 'v3.football.api-sports.io',
  },
  timeout: 30000,
});

const basketballClient = axios.create({
  baseURL: BASKETBALL_BASE_URL,
  headers: {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': 'v1.basketball.api-sports.io',
  },
  timeout: 30000,
});

// Error handler
const handleError = (error, context) => {
  console.error(`API-Football ${context} error:`, error.message);
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response data:', error.response.data);
  }
  return {
    success: false,
    message: error.response?.data?.message || error.message || 'API request failed',
    data: null,
  };
};

// ============================================
// FOOTBALL API FUNCTIONS
// ============================================

// Get live football matches
const getFootballLiveMatches = async () => {
  try {
    if (!API_KEY) {
      throw new Error('API-Football key not configured');
    }

    const response = await footballClient.get('/fixtures?live=all');
    return {
      success: true,
      data: response.data.response || [],
    };
  } catch (error) {
    return handleError(error, 'getFootballLiveMatches');
  }
};

// Get football fixtures (upcoming or by date)
const getFootballFixtures = async (date = null, leagueId = null) => {
  try {
    if (!API_KEY) {
      throw new Error('API-Football key not configured');
    }

    let endpoint = '/fixtures';
    const params = new URLSearchParams();
    
    if (date) {
      params.append('date', date);
    } else {
      // Get today's date if not specified
      const today = new Date().toISOString().split('T')[0];
      params.append('date', today);
    }
    
    if (leagueId) {
      params.append('league', leagueId);
    }

    const response = await footballClient.get(`${endpoint}?${params.toString()}`);
    return {
      success: true,
      data: response.data.response || [],
    };
  } catch (error) {
    return handleError(error, 'getFootballFixtures');
  }
};

// Get football match details with events, statistics, lineups
const getFootballMatchDetails = async (fixtureId) => {
  try {
    if (!API_KEY) {
      throw new Error('API-Football key not configured');
    }

    const [fixtureResponse, eventsResponse, statsResponse, lineupsResponse] = await Promise.all([
      footballClient.get(`/fixtures?id=${fixtureId}`),
      footballClient.get(`/fixtures/events?fixture=${fixtureId}`),
      footballClient.get(`/fixtures/statistics?fixture=${fixtureId}`),
      footballClient.get(`/fixtures/lineups?fixture=${fixtureId}`),
    ]);

    return {
      success: true,
      data: {
        fixture: fixtureResponse.data.response?.[0] || null,
        events: eventsResponse.data.response || [],
        statistics: statsResponse.data.response || [],
        lineups: lineupsResponse.data.response || [],
      },
    };
  } catch (error) {
    return handleError(error, 'getFootballMatchDetails');
  }
};

// Get football leagues
const getFootballLeagues = async () => {
  try {
    if (!API_KEY) {
      throw new Error('API-Football key not configured');
    }

    const response = await footballClient.get('/leagues?current=true');
    return {
      success: true,
      data: response.data.response || [],
    };
  } catch (error) {
    return handleError(error, 'getFootballLeagues');
  }
};

// Get football teams
const getFootballTeams = async (leagueId = null, season = null) => {
  try {
    if (!API_KEY) {
      throw new Error('API-Football key not configured');
    }

    let endpoint = '/teams';
    const params = new URLSearchParams();
    
    if (leagueId) {
      params.append('league', leagueId);
    }
    
    if (season) {
      params.append('season', season);
    } else {
      // Use current season
      const currentYear = new Date().getFullYear();
      params.append('season', currentYear);
    }

    const response = await footballClient.get(`${endpoint}?${params.toString()}`);
    return {
      success: true,
      data: response.data.response || [],
    };
  } catch (error) {
    return handleError(error, 'getFootballTeams');
  }
};

// Get football standings
const getFootballStandings = async (leagueId, season = null) => {
  try {
    if (!API_KEY) {
      throw new Error('API-Football key not configured');
    }

    if (!leagueId) {
      throw new Error('League ID is required');
    }

    const params = new URLSearchParams();
    params.append('league', leagueId);
    
    if (season) {
      params.append('season', season);
    } else {
      const currentYear = new Date().getFullYear();
      params.append('season', currentYear);
    }

    const response = await footballClient.get(`/standings?${params.toString()}`);
    return {
      success: true,
      data: response.data.response || [],
    };
  } catch (error) {
    return handleError(error, 'getFootballStandings');
  }
};

// ============================================
// BASKETBALL API FUNCTIONS
// ============================================

// Get live basketball matches
const getBasketballLiveMatches = async () => {
  try {
    if (!API_KEY) {
      throw new Error('API-Football key not configured');
    }

    const response = await basketballClient.get('/games?live=all');
    return {
      success: true,
      data: response.data.response || [],
    };
  } catch (error) {
    return handleError(error, 'getBasketballLiveMatches');
  }
};

// Get basketball fixtures (upcoming or by date)
const getBasketballFixtures = async (date = null, leagueId = null) => {
  try {
    if (!API_KEY) {
      throw new Error('API-Football key not configured');
    }

    let endpoint = '/games';
    const params = new URLSearchParams();
    
    if (date) {
      params.append('date', date);
    } else {
      const today = new Date().toISOString().split('T')[0];
      params.append('date', today);
    }
    
    if (leagueId) {
      params.append('league', leagueId);
    }

    const response = await basketballClient.get(`${endpoint}?${params.toString()}`);
    return {
      success: true,
      data: response.data.response || [],
    };
  } catch (error) {
    return handleError(error, 'getBasketballFixtures');
  }
};

// Get basketball match details
const getBasketballMatchDetails = async (gameId) => {
  try {
    if (!API_KEY) {
      throw new Error('API-Football key not configured');
    }

    const [gameResponse, eventsResponse, statsResponse] = await Promise.all([
      basketballClient.get(`/games?id=${gameId}`),
      basketballClient.get(`/games/events?game=${gameId}`),
      basketballClient.get(`/games/statistics?game=${gameId}`),
    ]);

    return {
      success: true,
      data: {
        game: gameResponse.data.response?.[0] || null,
        events: eventsResponse.data.response || [],
        statistics: statsResponse.data.response || [],
      },
    };
  } catch (error) {
    return handleError(error, 'getBasketballMatchDetails');
  }
};

// Get basketball leagues
const getBasketballLeagues = async () => {
  try {
    if (!API_KEY) {
      throw new Error('API-Football key not configured');
    }

    const response = await basketballClient.get('/leagues?current=true');
    return {
      success: true,
      data: response.data.response || [],
    };
  } catch (error) {
    return handleError(error, 'getBasketballLeagues');
  }
};

// Get basketball teams
const getBasketballTeams = async (leagueId = null, season = null) => {
  try {
    if (!API_KEY) {
      throw new Error('API-Football key not configured');
    }

    let endpoint = '/teams';
    const params = new URLSearchParams();
    
    if (leagueId) {
      params.append('league', leagueId);
    }
    
    if (season) {
      params.append('season', season);
    } else {
      const currentYear = new Date().getFullYear();
      params.append('season', currentYear);
    }

    const response = await basketballClient.get(`${endpoint}?${params.toString()}`);
    return {
      success: true,
      data: response.data.response || [],
    };
  } catch (error) {
    return handleError(error, 'getBasketballTeams');
  }
};

// Get basketball standings
const getBasketballStandings = async (leagueId, season = null) => {
  try {
    if (!API_KEY) {
      throw new Error('API-Football key not configured');
    }

    if (!leagueId) {
      throw new Error('League ID is required');
    }

    const params = new URLSearchParams();
    params.append('league', leagueId);
    
    if (season) {
      params.append('season', season);
    } else {
      const currentYear = new Date().getFullYear();
      params.append('season', currentYear);
    }

    const response = await basketballClient.get(`/standings?${params.toString()}`);
    return {
      success: true,
      data: response.data.response || [],
    };
  } catch (error) {
    return handleError(error, 'getBasketballStandings');
  }
};

// ============================================
// LEGACY FUNCTIONS (for backward compatibility)
// ============================================

const getTodayMatches = async (leagueId = null) => {
  const today = new Date().toISOString().split('T')[0];
  return await getFootballFixtures(today, leagueId);
};

const getLiveMatches = async () => {
  return await getFootballLiveMatches();
};

const getMatchDetails = async (fixtureId) => {
  return await getFootballMatchDetails(fixtureId);
};

const getLeagues = async () => {
  return await getFootballLeagues();
};

module.exports = {
  // Football
  getFootballLiveMatches,
  getFootballFixtures,
  getFootballMatchDetails,
  getFootballLeagues,
  getFootballTeams,
  getFootballStandings,
  
  // Basketball
  getBasketballLiveMatches,
  getBasketballFixtures,
  getBasketballMatchDetails,
  getBasketballLeagues,
  getBasketballTeams,
  getBasketballStandings,
  
  // Legacy (for backward compatibility)
  getTodayMatches,
  getLiveMatches,
  getMatchDetails,
  getLeagues,
};

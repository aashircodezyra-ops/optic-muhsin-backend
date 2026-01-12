const axios = require('axios');

// TheSportsDB API - Free tier (no key required, but can use key for higher limits)
// Using V1 API format for simplicity
const SPORTS_DB_BASE_URL = 'https://www.thesportsdb.com/api/v1/json';

// Optional API key from environment (for higher rate limits)
const API_KEY = process.env.THE_SPORTS_DB_KEY || '1'; // Default to '1' for free tier

// Create axios instance
const sportsDBClient = axios.create({
  baseURL: SPORTS_DB_BASE_URL,
  timeout: 30000,
});

// Error handler
const handleError = (error, context) => {
  console.error(`TheSportsDB ${context} error:`, error.message);
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
// TEAM FUNCTIONS
// ============================================

/**
 * Fetch teams by name or league ID
 * @param {string|number} query - Team name or league ID
 * @param {string} sport - 'soccer' or 'basketball'
 * @returns {Promise<Object>}
 */
const fetchTeams = async (query, sport = 'soccer') => {
  try {
    let endpoint = '';
    
    // If query is a number, treat as league ID
    if (typeof query === 'number' || /^\d+$/.test(query)) {
      endpoint = `/${API_KEY}/lookup_all_teams.php?id=${query}`;
    } else {
      // Search by team name
      endpoint = `/${API_KEY}/searchteams.php?t=${encodeURIComponent(query)}`;
    }

    const response = await sportsDBClient.get(endpoint);
    
    // TheSportsDB returns { teams: [...] } or { teams: null }
    const teams = response.data.teams || [];
    
    // Filter by sport if needed
    let filteredTeams = teams;
    if (sport === 'basketball') {
      filteredTeams = teams.filter(team => 
        team.strSport && team.strSport.toLowerCase() === 'basketball'
      );
    } else if (sport === 'soccer') {
      filteredTeams = teams.filter(team => 
        team.strSport && team.strSport.toLowerCase() === 'soccer'
      );
    }

    return {
      success: true,
      data: Array.isArray(filteredTeams) ? filteredTeams : [],
    };
  } catch (error) {
    return handleError(error, 'fetchTeams');
  }
};

/**
 * Fetch team details by team ID
 * @param {number|string} teamId - TheSportsDB team ID
 * @returns {Promise<Object>}
 */
const fetchTeamDetails = async (teamId) => {
  try {
    const endpoint = `/${API_KEY}/lookupteam.php?id=${teamId}`;
    const response = await sportsDBClient.get(endpoint);
    
    const team = response.data.teams?.[0] || null;
    
    return {
      success: true,
      data: team,
    };
  } catch (error) {
    return handleError(error, 'fetchTeamDetails');
  }
};

// ============================================
// LEAGUE FUNCTIONS
// ============================================

/**
 * Fetch leagues by country or sport
 * @param {string} country - Country name (optional)
 * @param {string} sport - 'soccer' or 'basketball' (optional)
 * @returns {Promise<Object>}
 */
const fetchLeagues = async (country = null, sport = null) => {
  try {
    let endpoint = '';
    
    if (country) {
      // Search leagues by country
      endpoint = `/${API_KEY}/search_all_leagues.php?c=${encodeURIComponent(country)}`;
    } else if (sport) {
      // Search leagues by sport
      endpoint = `/${API_KEY}/search_all_leagues.php?s=${encodeURIComponent(sport)}`;
    } else {
      // Get all leagues (limited results)
      endpoint = `/${API_KEY}/all_leagues.php`;
    }

    const response = await sportsDBClient.get(endpoint);
    
    // TheSportsDB returns { leagues: [...] } or { leagues: null }
    const leagues = response.data.leagues || [];
    
    // Filter by sport if provided
    let filteredLeagues = leagues;
    if (sport) {
      filteredLeagues = leagues.filter(league => 
        league.strSport && league.strSport.toLowerCase() === sport.toLowerCase()
      );
    }

    return {
      success: true,
      data: Array.isArray(filteredLeagues) ? filteredLeagues : [],
    };
  } catch (error) {
    return handleError(error, 'fetchLeagues');
  }
};

/**
 * Fetch league details by league ID
 * @param {number|string} leagueId - TheSportsDB league ID
 * @returns {Promise<Object>}
 */
const fetchLeagueDetails = async (leagueId) => {
  try {
    const endpoint = `/${API_KEY}/lookupleague.php?id=${leagueId}`;
    const response = await sportsDBClient.get(endpoint);
    
    const league = response.data.leagues?.[0] || null;
    
    return {
      success: true,
      data: league,
    };
  } catch (error) {
    return handleError(error, 'fetchLeagueDetails');
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Search for teams in a specific league
 * @param {number|string} leagueId - TheSportsDB league ID
 * @returns {Promise<Object>}
 */
const fetchTeamsByLeague = async (leagueId) => {
  return await fetchTeams(leagueId);
};

/**
 * Get popular leagues for a sport
 * @param {string} sport - 'soccer' or 'basketball'
 * @returns {Promise<Object>}
 */
const fetchPopularLeagues = async (sport = 'soccer') => {
  try {
    // Popular league IDs for soccer
    const soccerLeagueIds = [
      4328,  // English Premier League
      4335,  // Spanish La Liga
      4331,  // German Bundesliga
      4332,  // Italian Serie A
      4334,  // French Ligue 1
    ];
    
    // Popular league IDs for basketball
    const basketballLeagueIds = [
      4387,  // NBA
      4388,  // Euroleague
    ];
    
    const leagueIds = sport === 'basketball' ? basketballLeagueIds : soccerLeagueIds;
    const allLeagues = [];
    
    // Fetch each league
    for (const leagueId of leagueIds) {
      try {
        const result = await fetchLeagueDetails(leagueId);
        if (result.success && result.data) {
          allLeagues.push(result.data);
        }
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        // Silent fail for individual leagues
      }
    }
    
    return {
      success: true,
      data: allLeagues,
    };
  } catch (error) {
    return handleError(error, 'fetchPopularLeagues');
  }
};

module.exports = {
  fetchTeams,
  fetchTeamDetails,
  fetchLeagues,
  fetchLeagueDetails,
  fetchTeamsByLeague,
  fetchPopularLeagues,
};


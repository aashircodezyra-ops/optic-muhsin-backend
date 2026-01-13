const axios = require('axios');

// TheSportsDB API - Free tier uses key '123'
// Documentation: https://www.thesportsdb.com/documentation#base_url
const SPORTS_DB_BASE_URL = 'https://www.thesportsdb.com/api/v1/json';
const API_KEY = process.env.THE_SPORTS_DB_KEY || '123'; // Free key is '123'

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
// FOOTBALL API FUNCTIONS (Using TheSportsDB)
// ============================================

// Get live football matches (Note: Free tier doesn't have live scores, using recent events)
const getFootballLiveMatches = async () => {
  try {
    // Free tier doesn't have live scores, so we'll get today's events
    const today = new Date().toISOString().split('T')[0];
    const endpoint = `/${API_KEY}/eventsday.php?d=${today}&s=Soccer`;
    
    const response = await sportsDBClient.get(endpoint);
    const events = response.data.events || [];
    
    // Filter for events that might be live (checking time)
    const now = new Date();
    const liveEvents = events.filter(event => {
      if (!event.dateEvent || !event.strTime) return false;
      const eventDate = new Date(`${event.dateEvent}T${event.strTime}`);
      const eventEnd = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours after start
      return now >= eventDate && now <= eventEnd;
    });

    // Transform to match expected format
    const transformed = liveEvents.map(event => ({
      fixture: {
        id: event.idEvent,
        date: `${event.dateEvent}T${event.strTime}`,
        status: {
          short: 'LIVE',
          elapsed: Math.floor((now - new Date(`${event.dateEvent}T${event.strTime}`)) / 60000),
        },
      },
      league: {
        id: event.idLeague,
        name: event.strLeague || 'Unknown League',
      },
      teams: {
        home: {
          id: event.idHomeTeam,
          name: event.strHomeTeam || 'TBD',
        },
        away: {
          id: event.idAwayTeam,
          name: event.strAwayTeam || 'TBD',
        },
      },
      goals: {
        home: parseInt(event.intHomeScore) || 0,
        away: parseInt(event.intAwayScore) || 0,
      },
    }));

    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    return handleError(error, 'getFootballLiveMatches');
  }
};

// Get football fixtures (upcoming or by date)
const getFootballFixtures = async (date = null, leagueId = null) => {
  try {
    const requestedDate = date || new Date().toISOString().split('T')[0];
    let endpoint = '';
    
    if (leagueId) {
      // Get events for a specific league
      endpoint = `/${API_KEY}/eventsseason.php?id=${leagueId}&s=${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    } else {
      // Get events for a specific date
      endpoint = `/${API_KEY}/eventsday.php?d=${requestedDate}&s=Soccer`;
    }

    const response = await sportsDBClient.get(endpoint);
    const events = response.data.events || [];

    // Filter for upcoming events
    const now = new Date();
    const upcomingEvents = events.filter(event => {
      if (!event.dateEvent || !event.strTime) return false;
      const eventDate = new Date(`${event.dateEvent}T${event.strTime}`);
      return eventDate > now;
    });

    // Transform to match expected format
    const transformed = upcomingEvents.map(event => ({
      fixture: {
        id: event.idEvent,
        date: `${event.dateEvent}T${event.strTime}`,
        status: {
          short: 'NS',
        },
      },
      league: {
        id: event.idLeague,
        name: event.strLeague || 'Unknown League',
      },
      teams: {
        home: {
          id: event.idHomeTeam,
          name: event.strHomeTeam || 'TBD',
        },
        away: {
          id: event.idAwayTeam,
          name: event.strAwayTeam || 'TBD',
        },
      },
      goals: {
        home: 0,
        away: 0,
      },
    }));

    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    return handleError(error, 'getFootballFixtures');
  }
};

// Get football match details
const getFootballMatchDetails = async (fixtureId) => {
  try {
    const endpoint = `/${API_KEY}/lookupevent.php?id=${fixtureId}`;
    const response = await sportsDBClient.get(endpoint);
    const event = response.data.events?.[0];

    if (!event) {
      return {
        success: false,
        data: null,
        message: 'Event not found',
      };
    }

    // Get additional data
    const [lineupResponse, statsResponse] = await Promise.all([
      sportsDBClient.get(`/${API_KEY}/lookuplineup.php?id=${fixtureId}`).catch(() => ({ data: { lineups: [] } })),
      sportsDBClient.get(`/${API_KEY}/lookupeventstats.php?id=${fixtureId}`).catch(() => ({ data: { eventstats: [] } })),
    ]);

    return {
      success: true,
      data: {
        fixture: {
          id: event.idEvent,
          date: `${event.dateEvent}T${event.strTime}`,
          status: {
            short: event.strStatus || 'NS',
          },
        },
        league: {
          id: event.idLeague,
          name: event.strLeague || 'Unknown League',
        },
        teams: {
          home: {
            id: event.idHomeTeam,
            name: event.strHomeTeam || 'TBD',
          },
          away: {
            id: event.idAwayTeam,
            name: event.strAwayTeam || 'TBD',
          },
        },
        goals: {
          home: parseInt(event.intHomeScore) || 0,
          away: parseInt(event.intAwayScore) || 0,
        },
        events: [],
        statistics: statsResponse.data.eventstats || [],
        lineups: lineupResponse.data.lineups || [],
      },
    };
  } catch (error) {
    return handleError(error, 'getFootballMatchDetails');
  }
};

// Get football leagues
const getFootballLeagues = async () => {
  try {
    const endpoint = `/${API_KEY}/search_all_leagues.php?s=Soccer`;
    const response = await sportsDBClient.get(endpoint);
    const leagues = response.data.leagues || [];

    const transformed = leagues.map(league => ({
      league: {
        id: league.idLeague,
        name: league.strLeague || 'Unknown League',
        country: league.strCountry || '',
        logo: league.strLogo || '',
      },
      country: {
        name: league.strCountry || '',
      },
    }));

    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    return handleError(error, 'getFootballLeagues');
  }
};

// Get football teams
const getFootballTeams = async (leagueId = null, season = null) => {
  try {
    let endpoint = '';
    
    if (leagueId) {
      endpoint = `/${API_KEY}/lookup_all_teams.php?id=${leagueId}`;
    } else {
      // Get popular teams
      endpoint = `/${API_KEY}/searchteams.php?t=Arsenal`; // Default search
    }

    const response = await sportsDBClient.get(endpoint);
    const teams = response.data.teams || [];

    const transformed = teams
      .filter(team => team.strSport?.toLowerCase() === 'soccer')
      .map(team => ({
        team: {
          id: team.idTeam,
          name: team.strTeam || 'Unknown Team',
          logo: team.strTeamBadge || '',
        },
      }));

    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    return handleError(error, 'getFootballTeams');
  }
};

// Get football standings
const getFootballStandings = async (leagueId, season = null) => {
  try {
    if (!leagueId) {
      throw new Error('League ID is required');
    }

    const endpoint = `/${API_KEY}/lookuptable.php?l=${leagueId}`;
    const response = await sportsDBClient.get(endpoint);
    const table = response.data.table || [];

    return {
      success: true,
      data: [{
        league: {
          id: leagueId,
        },
        standings: [table.map((team, index) => ({
          rank: index + 1,
          team: {
            id: team.idTeam,
            name: team.strTeam || 'Unknown Team',
          },
          points: parseInt(team.intPoints) || 0,
          goalsDiff: parseInt(team.intGoalsDifference) || 0,
        }))],
      }],
    };
  } catch (error) {
    return handleError(error, 'getFootballStandings');
  }
};

// Get football players
const getFootballPlayers = async (teamId = null, leagueId = null, season = null, search = null) => {
  try {
    if (teamId) {
      const endpoint = `/${API_KEY}/lookup_all_players.php?id=${teamId}`;
      const response = await sportsDBClient.get(endpoint);
      const players = response.data.player || [];

      return {
        success: true,
        data: players.map(player => ({
          player: {
            id: player.idPlayer,
            name: player.strPlayer || 'Unknown Player',
            position: player.strPosition || '',
            nationality: player.strNationality || '',
            thumb: player.strThumb || '',
          },
        })),
      };
    }

    if (search) {
      const endpoint = `/${API_KEY}/searchplayers.php?p=${encodeURIComponent(search)}`;
      const response = await sportsDBClient.get(endpoint);
      const players = response.data.player || [];

      return {
        success: true,
        data: players.map(player => ({
          player: {
            id: player.idPlayer,
            name: player.strPlayer || 'Unknown Player',
            position: player.strPosition || '',
            nationality: player.strNationality || '',
            thumb: player.strThumb || '',
          },
        })),
      };
    }

    return {
      success: true,
      data: [],
    };
  } catch (error) {
    return handleError(error, 'getFootballPlayers');
  }
};

// Get football player statistics
const getFootballPlayerStats = async (playerId, season = null, leagueId = null) => {
  try {
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    const endpoint = `/${API_KEY}/lookupplayer.php?id=${playerId}`;
    const response = await sportsDBClient.get(endpoint);
    const player = response.data.players?.[0];

    if (!player) {
      return {
        success: false,
        data: null,
        message: 'Player not found',
      };
    }

    return {
      success: true,
      data: [{
        player: {
          id: player.idPlayer,
          name: player.strPlayer || 'Unknown Player',
          position: player.strPosition || '',
          nationality: player.strNationality || '',
          thumb: player.strThumb || '',
        },
        statistics: [],
      }],
    };
  } catch (error) {
    return handleError(error, 'getFootballPlayerStats');
  }
};

// ============================================
// BASKETBALL API FUNCTIONS (Using TheSportsDB)
// ============================================

// Get live basketball matches
const getBasketballLiveMatches = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const endpoint = `/${API_KEY}/eventsday.php?d=${today}&s=Basketball`;
    
    const response = await sportsDBClient.get(endpoint);
    const events = response.data.events || [];
    
    const now = new Date();
    const liveEvents = events.filter(event => {
      if (!event.dateEvent || !event.strTime) return false;
      const eventDate = new Date(`${event.dateEvent}T${event.strTime}`);
      const eventEnd = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);
      return now >= eventDate && now <= eventEnd;
    });

    const transformed = liveEvents.map(event => ({
      id: event.idEvent,
      date: `${event.dateEvent}T${event.strTime}`,
      status: {
        short: 'LIVE',
      },
      league: {
        id: event.idLeague,
        name: event.strLeague || 'Unknown League',
      },
      teams: {
        home: {
          id: event.idHomeTeam,
          name: event.strHomeTeam || 'TBD',
        },
        away: {
          id: event.idAwayTeam,
          name: event.strAwayTeam || 'TBD',
        },
      },
      scores: {
        home: {
          total: parseInt(event.intHomeScore) || 0,
        },
        away: {
          total: parseInt(event.intAwayScore) || 0,
        },
      },
    }));

    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    return handleError(error, 'getBasketballLiveMatches');
  }
};

// Get basketball fixtures
const getBasketballFixtures = async (date = null, leagueId = null) => {
  try {
    const requestedDate = date || new Date().toISOString().split('T')[0];
    let endpoint = '';
    
    if (leagueId) {
      endpoint = `/${API_KEY}/eventsseason.php?id=${leagueId}&s=${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    } else {
      endpoint = `/${API_KEY}/eventsday.php?d=${requestedDate}&s=Basketball`;
    }

    const response = await sportsDBClient.get(endpoint);
    const events = response.data.events || [];

    const now = new Date();
    const upcomingEvents = events.filter(event => {
      if (!event.dateEvent || !event.strTime) return false;
      const eventDate = new Date(`${event.dateEvent}T${event.strTime}`);
      return eventDate > now;
    });

    const transformed = upcomingEvents.map(event => ({
      id: event.idEvent,
      date: `${event.dateEvent}T${event.strTime}`,
      status: {
        short: 'NS',
      },
      league: {
        id: event.idLeague,
        name: event.strLeague || 'Unknown League',
      },
      teams: {
        home: {
          id: event.idHomeTeam,
          name: event.strHomeTeam || 'TBD',
        },
        away: {
          id: event.idAwayTeam,
          name: event.strAwayTeam || 'TBD',
        },
      },
      scores: {
        home: {
          total: 0,
        },
        away: {
          total: 0,
        },
      },
    }));

    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    return handleError(error, 'getBasketballFixtures');
  }
};

// Get basketball match details
const getBasketballMatchDetails = async (gameId) => {
  try {
    const endpoint = `/${API_KEY}/lookupevent.php?id=${gameId}`;
    const response = await sportsDBClient.get(endpoint);
    const event = response.data.events?.[0];

    if (!event) {
      return {
        success: false,
        data: null,
        message: 'Event not found',
      };
    }

    return {
      success: true,
      data: {
        game: {
          id: event.idEvent,
          date: `${event.dateEvent}T${event.strTime}`,
          status: {
            short: event.strStatus || 'NS',
          },
        },
        league: {
          id: event.idLeague,
          name: event.strLeague || 'Unknown League',
        },
        teams: {
          home: {
            id: event.idHomeTeam,
            name: event.strHomeTeam || 'TBD',
          },
          away: {
            id: event.idAwayTeam,
            name: event.strAwayTeam || 'TBD',
          },
        },
        scores: {
          home: {
            total: parseInt(event.intHomeScore) || 0,
          },
          away: {
            total: parseInt(event.intAwayScore) || 0,
          },
        },
        events: [],
        statistics: [],
      },
    };
  } catch (error) {
    return handleError(error, 'getBasketballMatchDetails');
  }
};

// Get basketball leagues
const getBasketballLeagues = async () => {
  try {
    const endpoint = `/${API_KEY}/search_all_leagues.php?s=Basketball`;
    const response = await sportsDBClient.get(endpoint);
    const leagues = response.data.leagues || [];

    const transformed = leagues.map(league => ({
      league: {
        id: league.idLeague,
        name: league.strLeague || 'Unknown League',
        country: league.strCountry || '',
        logo: league.strLogo || '',
      },
      country: {
        name: league.strCountry || '',
      },
    }));

    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    return handleError(error, 'getBasketballLeagues');
  }
};

// Get basketball teams
const getBasketballTeams = async (leagueId = null, season = null) => {
  try {
    let endpoint = '';
    
    if (leagueId) {
      endpoint = `/${API_KEY}/lookup_all_teams.php?id=${leagueId}`;
    } else {
      endpoint = `/${API_KEY}/searchteams.php?t=Lakers`;
    }

    const response = await sportsDBClient.get(endpoint);
    const teams = response.data.teams || [];

    const transformed = teams
      .filter(team => team.strSport?.toLowerCase() === 'basketball')
      .map(team => ({
        team: {
          id: team.idTeam,
          name: team.strTeam || 'Unknown Team',
          logo: team.strTeamBadge || '',
        },
      }));

    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    return handleError(error, 'getBasketballTeams');
  }
};

// Get basketball standings
const getBasketballStandings = async (leagueId, season = null) => {
  try {
    if (!leagueId) {
      throw new Error('League ID is required');
    }

    // TheSportsDB doesn't have basketball standings in free tier
    // Return empty or use alternative
    return {
      success: true,
      data: [],
    };
  } catch (error) {
    return handleError(error, 'getBasketballStandings');
  }
};

// Get basketball players
const getBasketballPlayers = async (teamId = null, leagueId = null, season = null, search = null) => {
  try {
    if (teamId) {
      const endpoint = `/${API_KEY}/lookup_all_players.php?id=${teamId}`;
      const response = await sportsDBClient.get(endpoint);
      const players = response.data.player || [];

      return {
        success: true,
        data: players.map(player => ({
          player: {
            id: player.idPlayer,
            name: player.strPlayer || 'Unknown Player',
            position: player.strPosition || '',
            nationality: player.strNationality || '',
            thumb: player.strThumb || '',
          },
        })),
      };
    }

    if (search) {
      const endpoint = `/${API_KEY}/searchplayers.php?p=${encodeURIComponent(search)}`;
      const response = await sportsDBClient.get(endpoint);
      const players = response.data.player || [];

      return {
        success: true,
        data: players.map(player => ({
          player: {
            id: player.idPlayer,
            name: player.strPlayer || 'Unknown Player',
            position: player.strPosition || '',
            nationality: player.strNationality || '',
            thumb: player.strThumb || '',
          },
        })),
      };
    }

    return {
      success: true,
      data: [],
    };
  } catch (error) {
    return handleError(error, 'getBasketballPlayers');
  }
};

// Get basketball player statistics
const getBasketballPlayerStats = async (playerId, season = null, leagueId = null) => {
  try {
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    const endpoint = `/${API_KEY}/lookupplayer.php?id=${playerId}`;
    const response = await sportsDBClient.get(endpoint);
    const player = response.data.players?.[0];

    if (!player) {
      return {
        success: false,
        data: null,
        message: 'Player not found',
      };
    }

    return {
      success: true,
      data: [{
        player: {
          id: player.idPlayer,
          name: player.strPlayer || 'Unknown Player',
          position: player.strPosition || '',
          nationality: player.strNationality || '',
          thumb: player.strThumb || '',
        },
        statistics: [],
      }],
    };
  } catch (error) {
    return handleError(error, 'getBasketballPlayerStats');
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
  getFootballPlayers,
  getFootballPlayerStats,
  
  // Basketball
  getBasketballLiveMatches,
  getBasketballFixtures,
  getBasketballMatchDetails,
  getBasketballLeagues,
  getBasketballTeams,
  getBasketballStandings,
  getBasketballPlayers,
  getBasketballPlayerStats,
  
  // Legacy (for backward compatibility)
  getTodayMatches,
  getLiveMatches,
  getMatchDetails,
  getLeagues,
};

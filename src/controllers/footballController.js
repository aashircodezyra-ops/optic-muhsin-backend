const FootballLiveMatch = require('../models/FootballLiveMatch');
const FootballUpcomingMatch = require('../models/FootballUpcomingMatch');
const FootballLeague = require('../models/FootballLeague');
const FootballTeam = require('../models/FootballTeam');
const FootballStanding = require('../models/FootballStanding');
const { getFootballMatchDetails, getFootballFixtures, getFootballPlayers, getFootballPlayerStats } = require('../services/apiFootball');
const SportsDBTeam = require('../models/SportsDBTeam');
const SportsDBLeague = require('../models/SportsDBLeague');
const cacheService = require('../services/cacheService');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
} = require('../utils/responseHandler');

// Get live football matches
const getLive = async (req, res) => {
  try {
    const matches = await FootballLiveMatch.find()
      .sort({ 'fixture.date': -1 })
      .limit(100);

    // If no matches in DB, try fetching from API
    if (matches.length === 0) {
      console.log('[FootballController] No live matches in DB, attempting API fetch...');
      try {
        const { getFootballLiveMatches } = require('../services/apiFootball');
        const apiResult = await getFootballLiveMatches();
        
        if (apiResult.success && apiResult.data && apiResult.data.length > 0) {
          console.log(`[FootballController] Fetched ${apiResult.data.length} live matches from API`);
          // Return API data directly (matches will be saved by cron)
          return res.json({
            success: true,
            data: {
              matches: apiResult.data,
              count: apiResult.data.length,
            },
            message: 'Live football matches retrieved successfully',
          });
        } else {
          console.warn('[FootballController] API returned no live matches:', apiResult.message);
        }
      } catch (apiError) {
        console.error('[FootballController] API fetch error:', apiError.message);
      }
    }

    // Ensure consistent response format
    return res.json({
      success: true,
      data: {
        matches: matches,
        count: matches.length,
      },
      message: 'Live football matches retrieved successfully',
    });
  } catch (error) {
    console.error('[FootballController] Error fetching live matches:', error);
    return sendError(res, 'Failed to fetch live football matches', 500);
  }
};

// Helper function to save football match
const saveFootballMatch = async (matchData) => {
  try {
    const matchId = matchData.fixture?.id;
    if (!matchId) return;

    const transformedData = {
      match_id: matchId,
      fixture: matchData.fixture,
      league: matchData.league,
      teams: matchData.teams,
      goals: matchData.goals,
      score: matchData.score,
      events: Array.isArray(matchData.events) ? matchData.events : [],
      statistics: Array.isArray(matchData.statistics) ? matchData.statistics : [],
      lineups: Array.isArray(matchData.lineups) ? matchData.lineups : [],
      lastUpdated: new Date(),
    };

    await FootballUpcomingMatch.findOneAndUpdate(
      { match_id: matchId },
      transformedData,
      { upsert: true, new: true }
    );
  } catch (error) {
    // Silent fail for individual match saves
  }
};

// Get upcoming football matches
const getUpcoming = async (req, res) => {
  try {
    const { date, leagueId } = req.query;
    const query = {};
    const requestedDate = date || new Date().toISOString().split('T')[0];

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query['fixture.date'] = { $gte: startDate, $lte: endDate };
    } else {
      // Default to today and future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query['fixture.date'] = { $gte: today };
    }

    if (leagueId) {
      query['league.id'] = parseInt(leagueId);
    }

    let matches = await FootballUpcomingMatch.find(query)
      .sort({ 'fixture.date': 1 })
      .limit(200);

    // If database is empty and requesting today's date, try fetching from API
    if (matches.length === 0 && (!date || date === new Date().toISOString().split('T')[0])) {
      try {
        const apiResult = await getFootballFixtures(requestedDate, leagueId ? parseInt(leagueId) : null);
        if (apiResult.success && apiResult.data && apiResult.data.length > 0) {
          // Save matches to database for future use
          for (const match of apiResult.data) {
            // Only save upcoming matches (not live or finished)
            if (match.fixture?.status?.short === 'NS' || match.fixture?.status?.short === 'TBD') {
              await saveFootballMatch(match);
            }
          }
          // Re-query database to get saved matches
          matches = await FootballUpcomingMatch.find(query)
            .sort({ 'fixture.date': 1 })
            .limit(200);
        }
      } catch (apiError) {
        // If API fetch fails, just return empty array
        console.error('Error fetching from API-Football:', apiError.message);
      }
    }

    res.json({
      success: true,
      data: {
        matches: matches,
        count: matches.length,
      },
    });
  } catch (error) {
    console.error('Error fetching upcoming football matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming football matches',
      error: error.message,
    });
  }
};

// Get football leagues
const getLeagues = async (req, res) => {
  try {
    const { country } = req.query;
    const query = {};

    if (country) {
      query['country.name'] = new RegExp(country, 'i');
    }

    const leagues = await FootballLeague.find(query)
      .sort({ 'league.name': 1 });

    res.json({
      success: true,
      data: { leagues },
      count: leagues.length,
    });
  } catch (error) {
    console.error('Error fetching football leagues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch football leagues',
      error: error.message,
    });
  }
};

// Get football teams
const getTeams = async (req, res) => {
  try {
    const { leagueId, search } = req.query;
    const query = {};

    if (leagueId) {
      // Note: This would require a different approach if teams are stored per league
      // For now, we'll return all teams or filter by name
    }

    if (search) {
      query['team.name'] = new RegExp(search, 'i');
    }

    const teams = await FootballTeam.find(query)
      .sort({ 'team.name': 1 })
      .limit(500);

    res.json({
      success: true,
      data: { teams },
      count: teams.length,
    });
  } catch (error) {
    console.error('Error fetching football teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch football teams',
      error: error.message,
    });
  }
};

// Get football standings
const getStandings = async (req, res) => {
  try {
    const { leagueId, season } = req.query;

    if (!leagueId) {
      return res.status(400).json({
        success: false,
        message: 'League ID is required',
      });
    }

    const query = {
      league_id: parseInt(leagueId),
    };

    if (season) {
      query.season = parseInt(season);
    } else {
      // Default to current season
      const currentYear = new Date().getFullYear();
      query.season = currentYear;
    }

    const standings = await FootballStanding.find(query);

    if (standings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Standings not found for this league and season',
      });
    }

    res.json({
      success: true,
      data: standings[0],
    });
  } catch (error) {
    console.error('Error fetching football standings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch football standings',
      error: error.message,
    });
  }
};

// Get football match details with full data (goals, cards, lineups, timelines)
const getMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const matchId = parseInt(id);

    if (!id || isNaN(matchId)) {
      return sendValidationError(res, 'Valid Match ID is required');
    }

    // Determine cache TTL based on match status
    const getCacheTTL = (status) => {
      if (status === 'LIVE' || status === 'HT' || status === '1H' || status === '2H') {
        return 1 * 60 * 1000; // 1 minute for live matches
      }
      return 5 * 60 * 1000; // 5 minutes for finished/upcoming matches
    };

    // Try to get from cache first
    const cachedData = await cacheService.getMatchDetails('football', matchId, async () => {
      // Check database first
      let match = await FootballLiveMatch.findOne({ match_id: matchId });
      if (!match) {
        match = await FootballUpcomingMatch.findOne({ match_id: matchId });
      }

      // If in database, return it
      if (match) {
        const status = match.fixture?.status?.short || 'NS';
        const ttl = getCacheTTL(status);
        
        // For live matches, always fetch fresh data from API
        if (status === 'LIVE' || status === 'HT' || status === '1H' || status === '2H') {
          try {
            const apiResult = await getFootballMatchDetails(matchId);
            if (apiResult.success && apiResult.data) {
              return {
                ...apiResult.data,
                cached: false,
                ttl,
              };
            }
          } catch (error) {
            console.error('Error fetching live match from API, using DB data:', error.message);
          }
        }

        return {
          fixture: match.fixture,
          league: match.league,
          teams: match.teams,
          goals: match.goals,
          score: match.score,
          events: match.events || [],
          statistics: match.statistics || [],
          lineups: match.lineups || [],
          cached: true,
          ttl: getCacheTTL(status),
        };
      }

      // Not in database, fetch from API
      const apiResult = await getFootballMatchDetails(matchId);
      if (apiResult.success && apiResult.data) {
        return {
          ...apiResult.data,
          cached: false,
          ttl: getCacheTTL(apiResult.data.fixture?.status?.short || 'NS'),
        };
      }

      return null;
    }, getCacheTTL('NS'));

    if (!cachedData) {
      return sendNotFound(res, 'Match not found');
    }

    // Process events to extract goals, cards, and timeline
    const goals = (cachedData.events || []).filter(e => 
      e.type === 'Goal' || e.detail === 'Normal Goal' || e.detail === 'Penalty' || e.detail === 'Own Goal'
    );
    const cards = (cachedData.events || []).filter(e => 
      e.type === 'Card' || e.detail === 'Yellow Card' || e.detail === 'Red Card'
    );
    const substitutions = (cachedData.events || []).filter(e => 
      e.type === 'subst' || e.detail === 'Substitution'
    );

    // Sort events by time for timeline
    const timeline = (cachedData.events || [])
      .map(event => ({
        time: event.time?.elapsed || 0,
        player: event.player?.name || 'Unknown',
        assist: event.assist?.name || null,
        type: event.type || 'unknown',
        detail: event.detail || '',
        team: event.team?.id === cachedData.teams?.home?.id ? 'home' : 'away',
        comments: event.comments || null,
      }))
      .sort((a, b) => a.time - b.time);

    return sendSuccess(
      res,
      {
        fixture: cachedData.fixture,
        league: cachedData.league,
        teams: cachedData.teams,
        goals: cachedData.goals,
        score: cachedData.score,
        events: cachedData.events || [],
        statistics: cachedData.statistics || [],
        lineups: cachedData.lineups || [],
        // Processed data
        goalsList: goals,
        cardsList: cards,
        substitutionsList: substitutions,
        timeline: timeline,
        // Metadata
        source: cachedData.cached ? 'cache' : 'api',
        cached: cachedData.cached || false,
      },
      'Football match details retrieved successfully'
    );
  } catch (error) {
    console.error('[FootballController] Error fetching match details:', error);
    return sendError(res, 'Failed to fetch football match details', 500);
  }
};

// Get SportsDB teams (static data from TheSportsDB)
const getSportsDBTeams = async (req, res) => {
  try {
    const { search, leagueId } = req.query;
    const query = { sport: 'soccer' };

    if (search) {
      query['team.strTeam'] = new RegExp(search, 'i');
    }

    if (leagueId) {
      query['team.idLeague'] = leagueId;
    }

    const teams = await SportsDBTeam.find(query)
      .sort({ 'team.strTeam': 1 })
      .limit(500);

    res.json({
      success: true,
      data: { teams },
      count: teams.length,
      source: 'thesportsdb',
    });
  } catch (error) {
    console.error('Error fetching SportsDB teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SportsDB teams',
      error: error.message,
    });
  }
};

// Get SportsDB leagues (static data from TheSportsDB)
const getSportsDBLeagues = async (req, res) => {
  try {
    const { country, search } = req.query;
    const query = { sport: 'soccer' };

    if (country) {
      query['league.strCountry'] = new RegExp(country, 'i');
    }

    if (search) {
      query['league.strLeague'] = new RegExp(search, 'i');
    }

    const leagues = await SportsDBLeague.find(query)
      .sort({ 'league.strLeague': 1 })
      .limit(200);

    res.json({
      success: true,
      data: { leagues },
      count: leagues.length,
      source: 'thesportsdb',
    });
  } catch (error) {
    console.error('Error fetching SportsDB leagues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SportsDB leagues',
      error: error.message,
    });
  }
};

// Get football players
const getPlayers = async (req, res) => {
  try {
    const { teamId, leagueId, season, search } = req.query;
    
    const apiResult = await getFootballPlayers(
      teamId ? parseInt(teamId) : null,
      leagueId ? parseInt(leagueId) : null,
      season ? parseInt(season) : null,
      search || null
    );

    if (!apiResult.success) {
      return sendError(res, apiResult.message || 'Failed to fetch players', 500);
    }

    return sendSuccess(
      res,
      {
        players: apiResult.data || [],
        count: apiResult.data?.length || 0,
      },
      'Football players retrieved successfully'
    );
  } catch (error) {
    console.error('[FootballController] Error fetching players:', error);
    return sendError(res, 'Failed to fetch football players', 500);
  }
};

// Get football player statistics
const getPlayerStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { season, leagueId } = req.query;
    
    if (!id) {
      return sendValidationError(res, 'Player ID is required');
    }

    const apiResult = await getFootballPlayerStats(
      parseInt(id),
      season ? parseInt(season) : null,
      leagueId ? parseInt(leagueId) : null
    );

    if (!apiResult.success) {
      return sendError(res, apiResult.message || 'Failed to fetch player statistics', 500);
    }

    return sendSuccess(
      res,
      {
        player: apiResult.data?.[0] || null,
        statistics: apiResult.data || [],
      },
      'Football player statistics retrieved successfully'
    );
  } catch (error) {
    console.error('[FootballController] Error fetching player stats:', error);
    return sendError(res, 'Failed to fetch football player statistics', 500);
  }
};

module.exports = {
  getLive,
  getUpcoming,
  getLeagues,
  getTeams,
  getStandings,
  getMatch,
  getPlayers,
  getPlayerStats,
  getSportsDBTeams,
  getSportsDBLeagues,
};



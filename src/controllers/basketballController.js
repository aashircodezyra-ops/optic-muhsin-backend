const BasketballLiveMatch = require('../models/BasketballLiveMatch');
const BasketballUpcomingMatch = require('../models/BasketballUpcomingMatch');
const BasketballLeague = require('../models/BasketballLeague');
const BasketballTeam = require('../models/BasketballTeam');
const BasketballStanding = require('../models/BasketballStanding');
const { getBasketballMatchDetails, getBasketballFixtures, getBasketballPlayers, getBasketballPlayerStats } = require('../services/apiFootball');
const SportsDBTeam = require('../models/SportsDBTeam');
const SportsDBLeague = require('../models/SportsDBLeague');
const cacheService = require('../services/cacheService');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
} = require('../utils/responseHandler');

// Get live basketball matches
const getLive = async (req, res) => {
  try {
    const matches = await BasketballLiveMatch.find()
      .sort({ 'fixture.date': -1 })
      .limit(100);

    // If no matches in DB, try fetching from API
    if (matches.length === 0) {
      console.log('[BasketballController] No live matches in DB, attempting API fetch...');
      try {
        const { getBasketballLiveMatches } = require('../services/apiFootball');
        const apiResult = await getBasketballLiveMatches();
        
        if (apiResult.success && apiResult.data && apiResult.data.length > 0) {
          console.log(`[BasketballController] Fetched ${apiResult.data.length} live matches from API`);
          // Return API data directly (matches will be saved by cron)
          return res.json({
            success: true,
            data: {
              matches: apiResult.data,
              count: apiResult.data.length,
            },
            message: 'Live basketball matches retrieved successfully',
          });
        } else {
          console.warn('[BasketballController] API returned no live matches:', apiResult.message);
        }
      } catch (apiError) {
        console.error('[BasketballController] API fetch error:', apiError.message);
      }
    }

    // Ensure consistent response format
    return res.json({
      success: true,
      data: {
        matches: matches,
        count: matches.length,
      },
      message: 'Live basketball matches retrieved successfully',
    });
  } catch (error) {
    console.error('[BasketballController] Error fetching live matches:', error);
    return sendError(res, 'Failed to fetch live basketball matches', 500);
  }
};

// Helper function to save basketball match
const saveBasketballMatch = async (matchData) => {
  try {
    const matchId = matchData.id;
    if (!matchId) return;

    const events = Array.isArray(matchData.events) 
      ? matchData.events
          .filter(e => e && typeof e === 'object' && !Array.isArray(e))
          .map(e => ({
            time: {
              elapsed: e.time?.elapsed || 0,
              extra: e.time?.extra || null,
            },
            team: {
              id: e.team?.id || null,
              name: e.team?.name || '',
              logo: e.team?.logo || '',
            },
            player: {
              id: e.player?.id || null,
              name: e.player?.name || '',
            },
            assist: {
              id: e.assist?.id || null,
              name: e.assist?.name || '',
            },
            type: e.type || '',
            detail: e.detail || '',
            comments: e.comments || '',
          }))
      : [];
    
    const transformedData = {
      match_id: matchId,
      fixture: {
        id: matchData.id,
        date: matchData.date,
        timezone: matchData.timezone,
        timestamp: matchData.timestamp,
        periods: matchData.periods,
        venue: matchData.venue,
        status: matchData.status,
      },
      league: matchData.league,
      teams: matchData.teams,
      scores: matchData.scores,
      events: events,
      statistics: Array.isArray(matchData.statistics) ? matchData.statistics : [],
      lastUpdated: new Date(),
    };

    await BasketballUpcomingMatch.findOneAndUpdate(
      { match_id: matchId },
      transformedData,
      { upsert: true, new: true }
    );
  } catch (error) {
    // Silent fail for individual match saves
  }
};

// Get upcoming basketball matches
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

    let matches = await BasketballUpcomingMatch.find(query)
      .sort({ 'fixture.date': 1 })
      .limit(200);

    // If database is empty and requesting today's date, try fetching from API
    if (matches.length === 0 && (!date || date === new Date().toISOString().split('T')[0])) {
      try {
        const apiResult = await getBasketballFixtures(requestedDate, leagueId ? parseInt(leagueId) : null);
        if (apiResult.success && apiResult.data && apiResult.data.length > 0) {
          // Save matches to database for future use
          for (const match of apiResult.data) {
            // Only save upcoming matches (not live or finished)
            if (match.status?.short === 'NS' || match.status?.short === 'TBD') {
              await saveBasketballMatch(match);
            }
          }
          // Re-query database to get saved matches
          matches = await BasketballUpcomingMatch.find(query)
            .sort({ 'fixture.date': 1 })
            .limit(200);
        }
      } catch (apiError) {
        // If API fetch fails, just return empty array
        console.error('Error fetching from API-Football (Basketball):', apiError.message);
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
    console.error('Error fetching upcoming basketball matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming basketball matches',
      error: error.message,
    });
  }
};

// Get basketball leagues
const getLeagues = async (req, res) => {
  try {
    const { country } = req.query;
    const query = {};

    if (country) {
      query['country.name'] = new RegExp(country, 'i');
    }

    const leagues = await BasketballLeague.find(query)
      .sort({ 'league.name': 1 });

    res.json({
      success: true,
      data: { leagues },
      count: leagues.length,
    });
  } catch (error) {
    console.error('Error fetching basketball leagues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch basketball leagues',
      error: error.message,
    });
  }
};

// Get basketball teams
const getTeams = async (req, res) => {
  try {
    const { leagueId, search } = req.query;
    const query = {};

    if (search) {
      query['team.name'] = new RegExp(search, 'i');
    }

    const teams = await BasketballTeam.find(query)
      .sort({ 'team.name': 1 })
      .limit(500);

    res.json({
      success: true,
      data: { teams },
      count: teams.length,
    });
  } catch (error) {
    console.error('Error fetching basketball teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch basketball teams',
      error: error.message,
    });
  }
};

// Get basketball standings
const getStandings = async (req, res) => {
  try {
    const { leagueId, season } = req.query;

    if (!leagueId) {
      return sendValidationError(res, 'League ID is required');
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

    const standings = await BasketballStanding.find(query);

    if (standings.length === 0) {
      return sendNotFound(res, 'Standings not found for this league and season');
    }

    return sendSuccess(res, standings[0], 'Basketball standings retrieved successfully');
  } catch (error) {
    console.error('[BasketballController] Error fetching standings:', error);
    return sendError(res, 'Failed to fetch basketball standings', 500);
  }
};

// Get basketball match details with full data (scores, stats, events, timeline)
const getMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const matchId = parseInt(id);

    if (!id || isNaN(matchId)) {
      return sendValidationError(res, 'Valid Match ID is required');
    }

    // Determine cache TTL based on match status
    const getCacheTTL = (status) => {
      if (status === 'LIVE' || status === 'HT' || status === 'Q1' || status === 'Q2' || status === 'Q3' || status === 'Q4') {
        return 1 * 60 * 1000; // 1 minute for live matches
      }
      return 5 * 60 * 1000; // 5 minutes for finished/upcoming matches
    };

    // Try to get from cache first
    const cachedData = await cacheService.getMatchDetails('basketball', matchId, async () => {
      // Check database first
      let match = await BasketballLiveMatch.findOne({ match_id: matchId });
      if (!match) {
        match = await BasketballUpcomingMatch.findOne({ match_id: matchId });
      }

      // If in database, return it
      if (match) {
        const status = match.status?.short || match.fixture?.status?.short || 'NS';
        const ttl = getCacheTTL(status);
        
        // For live matches, always fetch fresh data from API
        if (status === 'LIVE' || status === 'HT' || status === 'Q1' || status === 'Q2' || status === 'Q3' || status === 'Q4') {
          try {
            const apiResult = await getBasketballMatchDetails(matchId);
            if (apiResult.success && apiResult.data) {
              return {
                ...apiResult.data,
                cached: false,
                ttl,
              };
            }
          } catch (error) {
            console.error('Error fetching live basketball match from API, using DB data:', error.message);
          }
        }

        return {
          game: match,
          fixture: match.fixture,
          teams: match.teams,
          scores: match.scores,
          events: match.events || [],
          statistics: match.statistics || [],
          cached: true,
          ttl: getCacheTTL(status),
        };
      }

      // Not in database, fetch from API
      const apiResult = await getBasketballMatchDetails(matchId);
      if (apiResult.success && apiResult.data) {
        return {
          ...apiResult.data,
          cached: false,
          ttl: getCacheTTL(apiResult.data.game?.status?.short || 'NS'),
        };
      }

      return null;
    }, getCacheTTL('NS'));

    if (!cachedData) {
      return sendNotFound(res, 'Match not found');
    }

    // Process events for basketball (points, fouls, timeouts, etc.)
    const points = (cachedData.events || []).filter(e => 
      e.type === 'Point' || e.type === '2pt' || e.type === '3pt' || e.type === 'Free Throw'
    );
    const fouls = (cachedData.events || []).filter(e => 
      e.type === 'Foul' || e.type === 'Personal Foul' || e.type === 'Technical Foul'
    );
    const timeouts = (cachedData.events || []).filter(e => 
      e.type === 'Timeout'
    );

    // Sort events by time for timeline
    const timeline = (cachedData.events || [])
      .map(event => ({
        time: event.time?.elapsed || 0,
        quarter: event.period || event.quarter || 1,
        player: event.player?.name || 'Unknown',
        type: event.type || 'unknown',
        detail: event.detail || '',
        team: event.team?.id === cachedData.teams?.home?.id ? 'home' : 'away',
        comments: event.comments || null,
      }))
      .sort((a, b) => {
        // Sort by quarter first, then time
        if (a.quarter !== b.quarter) return a.quarter - b.quarter;
        return a.time - b.time;
      });

    // Extract quarter scores if available
    const quarterScores = cachedData.scores?.quarters || [];

    return sendSuccess(
      res,
      {
        game: cachedData.game || cachedData.fixture,
        teams: cachedData.teams,
        scores: cachedData.scores,
        events: cachedData.events || [],
        statistics: cachedData.statistics || [],
        // Processed data
        pointsList: points,
        foulsList: fouls,
        timeoutsList: timeouts,
        timeline: timeline,
        quarterScores: quarterScores,
        // Metadata
        source: cachedData.cached ? 'cache' : 'api',
        cached: cachedData.cached || false,
      },
      'Basketball match details retrieved successfully'
    );
  } catch (error) {
    console.error('[BasketballController] Error fetching match details:', error);
    return sendError(res, 'Failed to fetch basketball match details', 500);
  }
};

// Get SportsDB teams (static data from TheSportsDB)
const getSportsDBTeams = async (req, res) => {
  try {
    const { search, leagueId } = req.query;
    const query = { sport: 'basketball' };

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
    const query = { sport: 'basketball' };

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

// Get basketball players
const getPlayers = async (req, res) => {
  try {
    const { teamId, leagueId, season, search } = req.query;
    
    const apiResult = await getBasketballPlayers(
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
      'Basketball players retrieved successfully'
    );
  } catch (error) {
    console.error('[BasketballController] Error fetching players:', error);
    return sendError(res, 'Failed to fetch basketball players', 500);
  }
};

// Get basketball player statistics
const getPlayerStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { season, leagueId } = req.query;
    
    if (!id) {
      return sendValidationError(res, 'Player ID is required');
    }

    const apiResult = await getBasketballPlayerStats(
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
      'Basketball player statistics retrieved successfully'
    );
  } catch (error) {
    console.error('[BasketballController] Error fetching player stats:', error);
    return sendError(res, 'Failed to fetch basketball player statistics', 500);
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



const cron = require('node-cron');
const {
  getFootballLiveMatches,
  getFootballFixtures,
  getFootballLeagues,
  getFootballTeams,
  getFootballStandings,
  getBasketballLiveMatches,
  getBasketballFixtures,
  getBasketballLeagues,
  getBasketballTeams,
  getBasketballStandings,
} = require('./apiFootball');

const FootballLiveMatch = require('../models/FootballLiveMatch');
const FootballUpcomingMatch = require('../models/FootballUpcomingMatch');
const FootballLeague = require('../models/FootballLeague');
const FootballTeam = require('../models/FootballTeam');
const FootballStanding = require('../models/FootballStanding');

const BasketballLiveMatch = require('../models/BasketballLiveMatch');
const BasketballUpcomingMatch = require('../models/BasketballUpcomingMatch');
const BasketballLeague = require('../models/BasketballLeague');
const BasketballTeam = require('../models/BasketballTeam');
const BasketballStanding = require('../models/BasketballStanding');

// TheSportsDB models
const SportsDBTeam = require('../models/SportsDBTeam');
const SportsDBLeague = require('../models/SportsDBLeague');
const {
  fetchTeams,
  fetchLeagues,
  fetchPopularLeagues,
  fetchTeamsByLeague,
} = require('./sportsDB');

// Helper function to transform and save football match
const saveFootballMatch = async (matchData, isLive = false) => {
  try {
    const matchId = matchData.fixture?.id;
    if (!matchId) return;

    // Ensure events are always arrays of objects with proper structure
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
      fixture: matchData.fixture,
      league: matchData.league,
      teams: matchData.teams,
      goals: matchData.goals,
      score: matchData.score,
      events: events,
      statistics: Array.isArray(matchData.statistics) ? matchData.statistics : [],
      lineups: Array.isArray(matchData.lineups) ? matchData.lineups : [],
      cards: {
        home: events.filter(e => e.team?.id === matchData.teams?.home?.id && (e.type === 'Card' || e.detail?.includes('Yellow') || e.detail?.includes('Red'))),
        away: events.filter(e => e.team?.id === matchData.teams?.away?.id && (e.type === 'Card' || e.detail?.includes('Yellow') || e.detail?.includes('Red'))),
      },
      lastUpdated: new Date(),
    };

    if (isLive) {
      await FootballLiveMatch.findOneAndUpdate(
        { match_id: matchId },
        transformedData,
        { upsert: true, new: true }
      );
    } else {
      await FootballUpcomingMatch.findOneAndUpdate(
        { match_id: matchId },
        transformedData,
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    // Silent fail - log only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error saving football match:', error.message);
    }
  }
};

// Helper function to transform and save basketball match
const saveBasketballMatch = async (matchData, isLive = false) => {
  try {
    const matchId = matchData.id;
    if (!matchId) return;

    // Ensure events are always arrays of objects with proper structure
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

    if (isLive) {
      await BasketballLiveMatch.findOneAndUpdate(
        { match_id: matchId },
        transformedData,
        { upsert: true, new: true }
      );
    } else {
      await BasketballUpcomingMatch.findOneAndUpdate(
        { match_id: matchId },
        transformedData,
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    // Silent fail - log only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error saving basketball match:', error.message);
    }
  }
};

// ============================================
// CRON JOB: Fetch Live Matches (Every 1 minute)
// ============================================

cron.schedule('* * * * *', async () => {
  try {
    // Fetch Football Live Matches
    const footballResult = await getFootballLiveMatches();
    if (footballResult.success && footballResult.data) {
      for (const match of footballResult.data) {
        await saveFootballMatch(match, true);
      }
      
      // Clean up old live matches (older than 2 hours)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      await FootballLiveMatch.deleteMany({
        'fixture.status.short': { $nin: ['LIVE', 'HT', 'FT', 'PEN'] },
        lastUpdated: { $lt: twoHoursAgo },
      });
    }

    // Fetch Basketball Live Matches
    const basketballResult = await getBasketballLiveMatches();
    if (basketballResult.success && basketballResult.data) {
      for (const match of basketballResult.data) {
        await saveBasketballMatch(match, true);
      }
      
      // Clean up old live matches
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      await BasketballLiveMatch.deleteMany({
        'fixture.status.short': { $nin: ['LIVE', 'HT', 'FT', 'OT'] },
        lastUpdated: { $lt: twoHoursAgo },
      });
    }
  } catch (error) {
    // Silent fail - log only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in live matches cron job:', error.message);
    }
  }
});

// ============================================
// CRON JOB: Fetch Leagues, Teams, Standings, Upcoming (Every 12 hours)
// ============================================

cron.schedule('0 */12 * * *', async () => {
  try {
    // ========== FOOTBALL ==========
    
    // Fetch Football Leagues
    const footballLeaguesResult = await getFootballLeagues();
    if (footballLeaguesResult.success && footballLeaguesResult.data) {
      for (const item of footballLeaguesResult.data) {
        const leagueData = {
          league_id: item.league.id,
          league: item.league,
          country: item.country,
          seasons: item.seasons || [],
          lastUpdated: new Date(),
        };
        await FootballLeague.findOneAndUpdate(
          { league_id: item.league.id },
          leagueData,
          { upsert: true, new: true }
        );
      }
    }

    // Fetch Football Teams (for major leagues)
    const majorFootballLeagues = [39, 140, 135, 61, 78]; // Premier League, La Liga, Serie A, Ligue 1, Bundesliga
    const currentYear = new Date().getFullYear();
    
    for (const leagueId of majorFootballLeagues) {
      try {
        const teamsResult = await getFootballTeams(leagueId, currentYear);
        if (teamsResult.success && teamsResult.data) {
          for (const item of teamsResult.data) {
            const teamData = {
              team_id: item.team.id,
              team: item.team,
              venue: item.venue || {},
              lastUpdated: new Date(),
            };
            await FootballTeam.findOneAndUpdate(
              { team_id: item.team.id },
              teamData,
              { upsert: true, new: true }
            );
          }
        }
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        // Silent fail
      }
    }

    // Fetch Football Standings (for major leagues)
    for (const leagueId of majorFootballLeagues) {
      try {
        const standingsResult = await getFootballStandings(leagueId, currentYear);
        if (standingsResult.success && standingsResult.data) {
          for (const item of standingsResult.data) {
            const standingData = {
              league_id: item.league.id,
              season: item.league.season,
              league: item.league,
              lastUpdated: new Date(),
            };
            await FootballStanding.findOneAndUpdate(
              { league_id: item.league.id, season: item.league.season },
              standingData,
              { upsert: true, new: true }
            );
          }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        // Silent fail
      }
    }

    // Fetch Football Upcoming Matches (next 7 days)
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      try {
        const fixturesResult = await getFootballFixtures(dateStr);
        if (fixturesResult.success && fixturesResult.data) {
          let savedCount = 0;
          for (const match of fixturesResult.data) {
            // Only save upcoming matches (not live or finished)
            if (match.fixture.status.short === 'NS' || match.fixture.status.short === 'TBD') {
              await saveFootballMatch(match, false);
              savedCount++;
            }
          }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        // Silent fail
      }
    }

    // ========== BASKETBALL ==========
    
    // Fetch Basketball Leagues
    const basketballLeaguesResult = await getBasketballLeagues();
    if (basketballLeaguesResult.success && basketballLeaguesResult.data) {
      for (const item of basketballLeaguesResult.data) {
        const leagueData = {
          league_id: item.league.id,
          league: item.league,
          country: item.country,
          seasons: item.seasons || [],
          lastUpdated: new Date(),
        };
        await BasketballLeague.findOneAndUpdate(
          { league_id: item.league.id },
          leagueData,
          { upsert: true, new: true }
        );
      }
    }

    // Fetch Basketball Teams (for major leagues)
    const majorBasketballLeagues = [12, 13]; // NBA, Euroleague
    for (const leagueId of majorBasketballLeagues) {
      try {
        const teamsResult = await getBasketballTeams(leagueId, currentYear);
        if (teamsResult.success && teamsResult.data) {
          for (const item of teamsResult.data) {
            // Handle different response structures
            const teamId = item.id || item.team?.id;
            const teamInfo = item.team || item;
            
            const teamData = {
              team_id: teamId,
              team: teamInfo,
              venue: item.venue || {},
              lastUpdated: new Date(),
            };
            await BasketballTeam.findOneAndUpdate(
              { team_id: teamId },
              teamData,
              { upsert: true, new: true }
            );
          }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        // Silent fail
      }
    }

    // Fetch Basketball Standings
    for (const leagueId of majorBasketballLeagues) {
      try {
        const standingsResult = await getBasketballStandings(leagueId, currentYear);
        if (standingsResult.success && standingsResult.data) {
          for (const item of standingsResult.data) {
            const standingData = {
              league_id: item.league.id,
              season: item.league.season,
              league: item.league,
              lastUpdated: new Date(),
            };
            await BasketballStanding.findOneAndUpdate(
              { league_id: item.league.id, season: item.league.season },
              standingData,
              { upsert: true, new: true }
            );
          }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        // Silent fail
      }
    }

    // Fetch Basketball Upcoming Matches (next 7 days)
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      try {
        const fixturesResult = await getBasketballFixtures(dateStr);
        if (fixturesResult.success && fixturesResult.data) {
          for (const match of fixturesResult.data) {
            // Only save upcoming matches
            if (match.status.short === 'NS' || match.status.short === 'TBD') {
              await saveBasketballMatch(match, false);
            }
          }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        // Silent fail
      }
    }

    // ========== THESPORTSDB INTEGRATION (ADDITIVE) ==========
    // Fetch teams and leagues from TheSportsDB (static data only)
    
    try {
      // Fetch popular soccer leagues from TheSportsDB
      const soccerLeaguesResult = await fetchPopularLeagues('soccer');
      if (soccerLeaguesResult.success && soccerLeaguesResult.data) {
        for (const league of soccerLeaguesResult.data) {
          if (league.idLeague) {
            const leagueData = {
              league_id: league.idLeague,
              league: league,
              sport: 'soccer',
              source: 'thesportsdb',
              lastUpdated: new Date(),
            };
            await SportsDBLeague.findOneAndUpdate(
              { league_id: league.idLeague },
              leagueData,
              { upsert: true, new: true }
            );
          }
        }
      }
      
      // Fetch teams for popular soccer leagues
      const soccerLeagueIds = ['4328', '4335', '4331', '4332', '4334']; // Premier League, La Liga, Bundesliga, Serie A, Ligue 1
      for (const leagueId of soccerLeagueIds) {
        try {
          const teamsResult = await fetchTeamsByLeague(leagueId);
          if (teamsResult.success && teamsResult.data) {
            for (const team of teamsResult.data) {
              if (team.idTeam) {
                const teamData = {
                  team_id: team.idTeam,
                  team: team,
                  sport: 'soccer',
                  source: 'thesportsdb',
                  lastUpdated: new Date(),
                };
                await SportsDBTeam.findOneAndUpdate(
                  { team_id: team.idTeam },
                  teamData,
                  { upsert: true, new: true }
                );
              }
            }
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          // Silent fail
        }
      }
    } catch (error) {
      // Silent fail - log only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching TheSportsDB soccer data:', error.message);
      }
    }

    try {
      // Fetch popular basketball leagues from TheSportsDB
      const basketballLeaguesResult = await fetchPopularLeagues('basketball');
      if (basketballLeaguesResult.success && basketballLeaguesResult.data) {
        for (const league of basketballLeaguesResult.data) {
          if (league.idLeague) {
            const leagueData = {
              league_id: league.idLeague,
              league: league,
              sport: 'basketball',
              source: 'thesportsdb',
              lastUpdated: new Date(),
            };
            await SportsDBLeague.findOneAndUpdate(
              { league_id: league.idLeague },
              leagueData,
              { upsert: true, new: true }
            );
          }
        }
      }
      
      // Fetch teams for popular basketball leagues
      const basketballLeagueIds = ['4387', '4388']; // NBA, Euroleague
      for (const leagueId of basketballLeagueIds) {
        try {
          const teamsResult = await fetchTeamsByLeague(leagueId);
          if (teamsResult.success && teamsResult.data) {
            for (const team of teamsResult.data) {
              if (team.idTeam) {
                const teamData = {
                  team_id: team.idTeam,
                  team: team,
                  sport: 'basketball',
                  source: 'thesportsdb',
                  lastUpdated: new Date(),
                };
                await SportsDBTeam.findOneAndUpdate(
                  { team_id: team.idTeam },
                  teamData,
                  { upsert: true, new: true }
                );
              }
            }
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          // Silent fail
        }
      }
    } catch (error) {
      // Silent fail - log only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching TheSportsDB basketball data:', error.message);
      }
    }

    // Also fetch general leagues by sport (for broader coverage)
    try {
      const allSoccerLeagues = await fetchLeagues(null, 'soccer');
      if (allSoccerLeagues.success && allSoccerLeagues.data) {
        // Limit to first 50 to avoid overwhelming the database
        const limitedLeagues = allSoccerLeagues.data.slice(0, 50);
        for (const league of limitedLeagues) {
          if (league.idLeague) {
            await SportsDBLeague.findOneAndUpdate(
              { league_id: league.idLeague },
              {
                league_id: league.idLeague,
                league: league,
                sport: 'soccer',
                source: 'thesportsdb',
                lastUpdated: new Date(),
              },
              { upsert: true, new: true }
            );
          }
        }
      }
    } catch (error) {
      // Silent fail
    }

    try {
      const allBasketballLeagues = await fetchLeagues(null, 'basketball');
      if (allBasketballLeagues.success && allBasketballLeagues.data) {
        // Limit to first 20
        const limitedLeagues = allBasketballLeagues.data.slice(0, 20);
        for (const league of limitedLeagues) {
          if (league.idLeague) {
            await SportsDBLeague.findOneAndUpdate(
              { league_id: league.idLeague },
              {
                league_id: league.idLeague,
                league: league,
                sport: 'basketball',
                source: 'thesportsdb',
                lastUpdated: new Date(),
              },
              { upsert: true, new: true }
            );
          }
        }
      }
    } catch (error) {
      // Silent fail
    }
  } catch (error) {
    // Silent fail - log only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in data fetch cron job:', error.message);
    }
  }
});

module.exports = {};


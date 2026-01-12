const { getFootballFixtures, getFootballMatchDetails, getFootballStandings, getFootballTeams } = require('./apiFootball');
const Prediction = require('../models/Prediction');

/**
 * Prediction Engine Service
 * Generates predictions based on API-Football data and statistical analysis
 */

// Helper: Calculate average goals for a team
const calculateAverageGoals = (matches) => {
  if (!matches || matches.length === 0) return { home: 1.0, away: 1.0, total: 2.0 };
  
  let homeGoals = 0;
  let awayGoals = 0;
  let totalGoals = 0;
  let count = 0;

  matches.forEach(match => {
    if (match.goals && typeof match.goals.home === 'number' && typeof match.goals.away === 'number') {
      homeGoals += match.goals.home;
      awayGoals += match.goals.away;
      totalGoals += match.goals.home + match.goals.away;
      count++;
    }
  });

  if (count === 0) return { home: 1.0, away: 1.0, total: 2.0 };

  return {
    home: homeGoals / count,
    away: awayGoals / count,
    total: totalGoals / count,
  };
};

// Helper: Get team form (last 5 matches)
const getTeamForm = async (teamId, leagueId, season) => {
  try {
    // For free plan, we'll use simplified logic
    // In a paid plan, we could fetch actual last 5 matches
    return {
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      matches: [],
    };
  } catch (error) {
    console.error(`[PredictionEngine] Error getting team form for ${teamId}:`, error.message);
    return { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matches: [] };
  }
};

// Helper: Get H2H history (simplified for free plan)
const getH2HHistory = async (homeTeamId, awayTeamId) => {
  try {
    // For free plan, we'll use simplified logic
    // In a paid plan, we could fetch actual H2H matches
    return {
      homeWins: 0,
      draws: 0,
      awayWins: 0,
      totalGoals: 0,
      matches: [],
    };
  } catch (error) {
    console.error(`[PredictionEngine] Error getting H2H history:`, error.message);
    return { homeWins: 0, draws: 0, awayWins: 0, totalGoals: 0, matches: [] };
  }
};

// Helper: Calculate win probability based on standings
const calculateWinProbability = (homeStanding, awayStanding) => {
  if (!homeStanding || !awayStanding) return { home: 0.33, draw: 0.33, away: 0.34 };

  // Simple probability based on position (lower position = better)
  const homePosition = homeStanding.rank || 10;
  const awayPosition = awayStanding.rank || 10;

  // Calculate points if available
  const homePoints = homeStanding.points || 0;
  const awayPoints = awayStanding.points || 0;

  // Weighted probability
  const totalPoints = homePoints + awayPoints || 1;
  const homeProb = homePoints / totalPoints;
  const awayProb = awayPoints / totalPoints;
  const drawProb = 0.25; // Base draw probability

  // Normalize
  const sum = homeProb + awayProb + drawProb;
  return {
    home: homeProb / sum,
    draw: drawProb / sum,
    away: awayProb / sum,
  };
};

/**
 * Generate prediction for a single fixture
 */
const generatePredictionForFixture = async (fixture) => {
  try {
    const matchId = fixture.fixture?.id || fixture.id;
    if (!matchId) {
      console.warn('[PredictionEngine] Fixture missing ID, skipping');
      return null;
    }

    const homeTeam = fixture.teams?.home?.name || 'TBD';
    const awayTeam = fixture.teams?.away?.name || 'TBD';
    const league = fixture.league?.name || 'Unknown League';
    const leagueId = fixture.league?.id;
    const matchTime = fixture.fixture?.date ? new Date(fixture.fixture.date) : new Date();
    const season = fixture.league?.season || new Date().getFullYear();

    // Get match details if available (may fail on free plan)
    let matchDetails = null;
    try {
      const detailsResult = await getFootballMatchDetails(matchId);
      if (detailsResult.success && detailsResult.data) {
        matchDetails = detailsResult.data;
      }
    } catch (error) {
      // Silent fail for free plan
      console.log(`[PredictionEngine] Could not fetch details for match ${matchId} (may be free plan limitation)`);
    }

    // Get statistics (goals, shots, etc.)
    const statistics = matchDetails?.statistics || [];
    const events = matchDetails?.events || [];
    const lineups = matchDetails?.lineups || [];

    // Calculate averages from available data
    const avgGoals = calculateAverageGoals([fixture]);
    
    // Get standings if league ID is available
    let standings = null;
    if (leagueId) {
      try {
        const standingsResult = await getFootballStandings(leagueId, season);
        if (standingsResult.success && standingsResult.data && standingsResult.data.length > 0) {
          standings = standingsResult.data[0];
        }
      } catch (error) {
        // Silent fail for free plan
      }
    }

    // Generate predictions based on rules
    const predictions = [];

    // Rule 1: Over/Under 2.5 Goals
    if (avgGoals.total >= 1.5) {
      const confidence = Math.min(85, Math.max(55, Math.round(avgGoals.total * 20)));
      predictions.push({
        matchId: matchId.toString(),
        league,
        homeTeam,
        awayTeam,
        predictionType: avgGoals.total >= 2.5 ? 'banker' : 'all',
        tip: avgGoals.total >= 2.5 ? 'Over 2.5' : 'Under 2.5',
        confidence,
        matchTime,
        source: 'api-football',
        notes: `Average goals: ${avgGoals.total.toFixed(1)}`,
      });
    }

    // Rule 2: Banker - Home Win (if favorite wins >70%)
    if (standings && standings.standings && standings.standings.length > 0) {
      const homeStanding = standings.standings[0]?.find(s => s.team?.id === fixture.teams?.home?.id);
      const awayStanding = standings.standings[0]?.find(s => s.team?.id === fixture.teams?.away?.id);

      if (homeStanding && awayStanding) {
        const winProb = calculateWinProbability(homeStanding, awayStanding);
        if (winProb.home > 0.70) {
          predictions.push({
            matchId: matchId.toString(),
            league,
            homeTeam,
            awayTeam,
            predictionType: 'banker',
            tip: 'Home Win',
            confidence: Math.min(90, Math.round(winProb.home * 100)),
            matchTime,
            source: 'api-football',
            notes: `Home team win probability: ${(winProb.home * 100).toFixed(1)}%`,
          });
        } else if (winProb.away > 0.70) {
          predictions.push({
            matchId: matchId.toString(),
            league,
            homeTeam,
            awayTeam,
            predictionType: 'banker',
            tip: 'Away Win',
            confidence: Math.min(90, Math.round(winProb.away * 100)),
            matchTime,
            source: 'api-football',
            notes: `Away team win probability: ${(winProb.away * 100).toFixed(1)}%`,
          });
        }
      }
    }

    // Rule 3: BTTS (Both Teams To Score)
    if (avgGoals.home >= 1.0 && avgGoals.away >= 1.0) {
      const bttsConfidence = Math.min(80, Math.max(60, Math.round((avgGoals.home + avgGoals.away) * 15)));
      predictions.push({
        matchId: matchId.toString(),
        league,
        homeTeam,
        awayTeam,
        predictionType: bttsConfidence >= 70 ? 'banker' : 'all',
        tip: 'BTTS',
        confidence: bttsConfidence,
        matchTime,
        source: 'api-football',
        notes: `Both teams average ${avgGoals.home.toFixed(1)} and ${avgGoals.away.toFixed(1)} goals`,
      });
    }

    // Rule 4: Surprise pick (underdog with improving form)
    if (standings && standings.standings && standings.standings.length > 0) {
      const homeStanding = standings.standings[0]?.find(s => s.team?.id === fixture.teams?.home?.id);
      const awayStanding = standings.standings[0]?.find(s => s.team?.id === fixture.teams?.away?.id);

      if (homeStanding && awayStanding) {
        const homeRank = homeStanding.rank || 10;
        const awayRank = awayStanding.rank || 10;
        
        // If away team is lower ranked but close, it's a surprise pick
        if (awayRank > homeRank && awayRank - homeRank <= 3) {
          predictions.push({
            matchId: matchId.toString(),
            league,
            homeTeam,
            awayTeam,
            predictionType: 'surprise',
            tip: 'Away Win or Draw',
            confidence: Math.min(75, Math.max(55, 60 + (awayRank - homeRank) * 2)),
            matchTime,
            source: 'api-football',
            notes: `Underdog pick: Away team ranked ${awayRank} vs Home ${homeRank}`,
          });
        }
      }
    }

    // Rule 5: VIP picks (highest statistical confidence)
    // Select predictions with confidence >= 80 as VIP
    const vipPredictions = predictions
      .filter(p => p.confidence >= 80)
      .map(p => ({
        ...p,
        predictionType: 'vip',
        isVIP: true,
      }));

    // Combine all predictions
    const allPredictions = [...predictions, ...vipPredictions];

    // If no predictions generated, create a default one
    if (allPredictions.length === 0) {
      allPredictions.push({
        matchId: matchId.toString(),
        league,
        homeTeam,
        awayTeam,
        predictionType: 'all',
        tip: 'Over 1.5',
        confidence: 60,
        matchTime,
        source: 'api-football',
        notes: 'Default prediction based on available data',
      });
    }

    return allPredictions;
  } catch (error) {
    console.error('[PredictionEngine] Error generating prediction for fixture:', error.message);
    return null;
  }
};

/**
 * Generate predictions for today's fixtures
 */
const generatePredictions = async (date = null) => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    console.log(`[PredictionEngine] Generating predictions for ${targetDate}`);

    // Fetch fixtures for the date
    const fixturesResult = await getFootballFixtures(targetDate);
    
    if (!fixturesResult.success || !fixturesResult.data || fixturesResult.data.length === 0) {
      console.log(`[PredictionEngine] No fixtures found for ${targetDate}`);
      return {
        success: true,
        total: 0,
        generated: 0,
        skipped: 0,
        errors: 0,
      };
    }

    const fixtures = fixturesResult.data;
    console.log(`[PredictionEngine] Found ${fixtures.length} fixtures for ${targetDate}`);

    let generated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each fixture
    for (const fixture of fixtures) {
      try {
        // Only process upcoming matches (not live or finished)
        const status = fixture.fixture?.status?.short;
        if (status && status !== 'NS' && status !== 'TBD') {
          skipped++;
          continue;
        }

        const predictions = await generatePredictionForFixture(fixture);
        
        if (!predictions || predictions.length === 0) {
          skipped++;
          continue;
        }

        // Save each prediction to database (overwrite existing for same matchId)
        for (const pred of predictions) {
          try {
            await Prediction.findOneAndUpdate(
              { matchId: pred.matchId, tip: pred.tip },
              {
                ...pred,
                matchStart: pred.matchTime,
                prediction: pred.tip, // Set prediction field for backward compatibility
                isPublic: true, // Ensure predictions are public by default
                sport: 'football', // Default sport
                updatedAt: new Date(),
              },
              { upsert: true, new: true }
            );
            generated++;
          } catch (saveError) {
            console.error(`[PredictionEngine] Error saving prediction for match ${pred.matchId}:`, saveError.message);
            errors++;
          }
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[PredictionEngine] Error processing fixture:`, error.message);
        errors++;
      }
    }

    console.log(`[PredictionEngine] Completed: Generated ${generated}, Skipped ${skipped}, Errors ${errors}`);

    return {
      success: true,
      total: fixtures.length,
      generated,
      skipped,
      errors,
      date: targetDate,
    };
  } catch (error) {
    console.error('[PredictionEngine] Fatal error generating predictions:', error.message);
    return {
      success: false,
      error: error.message,
      total: 0,
      generated: 0,
      skipped: 0,
      errors: 1,
    };
  }
};

module.exports = {
  generatePredictions,
  generatePredictionForFixture,
};


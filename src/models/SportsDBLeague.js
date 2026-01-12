const mongoose = require('mongoose');

const sportsDBLeagueSchema = new mongoose.Schema({
  league_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  // TheSportsDB league data
  league: {
    idLeague: String,
    idSoccerXML: String,
    idAPIfootball: String,
    strSport: String,
    strLeague: String,
    strLeagueAlternate: String,
    strDivision: String,
    idCup: String,
    strCurrentSeason: String,
    intFormedYear: String,
    dateFirstEvent: String,
    strGender: String,
    strCountry: String,
    strWebsite: String,
    strFacebook: String,
    strTwitter: String,
    strInstagram: String,
    strDescriptionEN: String,
    strDescriptionDE: String,
    strDescriptionFR: String,
    strDescriptionIT: String,
    strDescriptionCN: String,
    strDescriptionJP: String,
    strDescriptionRU: String,
    strDescriptionES: String,
    strDescriptionPT: String,
    strDescriptionSE: String,
    strDescriptionNL: String,
    strDescriptionHU: String,
    strDescriptionNO: String,
    strDescriptionIL: String,
    strDescriptionPL: String,
    strTvRights: String,
    strFanart1: String,
    strFanart2: String,
    strFanart3: String,
    strFanart4: String,
    strBanner: String,
    strBadge: String,
    strLogo: String,
    strPoster: String,
    strTrophy: String,
    strNaming: String,
    strComplete: String,
    strLocked: String,
  },
  // Metadata
  sport: {
    type: String,
    enum: ['soccer', 'basketball'],
    index: true,
  },
  source: {
    type: String,
    default: 'thesportsdb',
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for faster searches
sportsDBLeagueSchema.index({ 'league.strLeague': 'text', 'league.strCountry': 'text' });
sportsDBLeagueSchema.index({ sport: 1, 'league.strCountry': 1 });

module.exports = mongoose.model('SportsDBLeague', sportsDBLeagueSchema);


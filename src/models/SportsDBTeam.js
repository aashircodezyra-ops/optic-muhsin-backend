const mongoose = require('mongoose');

const sportsDBTeamSchema = new mongoose.Schema({
  team_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  // TheSportsDB team data
  team: {
    idTeam: String,
    idSoccerXML: String,
    idAPIfootball: String,
    strTeam: String,
    strTeamShort: String,
    strAlternate: String,
    intFormedYear: String,
    strSport: String,
    strLeague: String,
    idLeague: String,
    strLeague2: String,
    idLeague2: String,
    strLeague3: String,
    idLeague3: String,
    strLeague4: String,
    idLeague4: String,
    strLeague5: String,
    idLeague5: String,
    strLeague6: String,
    idLeague6: String,
    strLeague7: String,
    idLeague7: String,
    strDivision: String,
    strManager: String,
    strStadium: String,
    strKeywords: String,
    strRSS: String,
    strStadiumThumb: String,
    strStadiumDescription: String,
    strStadiumLocation: String,
    intStadiumCapacity: String,
    strWebsite: String,
    strFacebook: String,
    strTwitter: String,
    strInstagram: String,
    strDescriptionEN: String,
    strDescriptionDE: String,
    strDescriptionFR: String,
    strDescriptionCN: String,
    strDescriptionIT: String,
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
    strGender: String,
    strCountry: String,
    strTeamBadge: String,
    strTeamJersey: String,
    strTeamLogo: String,
    strTeamFanart1: String,
    strTeamFanart2: String,
    strTeamFanart3: String,
    strTeamFanart4: String,
    strTeamBanner: String,
    strYoutube: String,
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
sportsDBTeamSchema.index({ 'team.strTeam': 'text', 'team.strCountry': 'text' });
sportsDBTeamSchema.index({ sport: 1, 'team.strLeague': 1 });

module.exports = mongoose.model('SportsDBTeam', sportsDBTeamSchema);


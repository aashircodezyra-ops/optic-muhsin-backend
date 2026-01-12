/**
 * API Connectivity Test Script
 * Tests all external APIs to verify they are working
 * 
 * Usage: node scripts/testAPIs.js
 */

require('dotenv').config();
const {
  getFootballLiveMatches,
  getBasketballLiveMatches,
  getFootballFixtures,
  getBasketballFixtures,
} = require('../src/services/apiFootball');
const { fetchAllNews } = require('../src/services/newsService');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testAPIKey() {
  logSection('🔑 API Key Configuration');
  
  const apiFootballKey = process.env.API_FOOTBALL_KEY;
  const newsApiKey1 = process.env.NEWS_API_KEY_1;
  const newsApiKey2 = process.env.NEWS_API_KEY_2;
  const trtRssUrl = process.env.TRT_RSS_URL;
  
  if (apiFootballKey) {
    log(`✅ API_FOOTBALL_KEY: ${apiFootballKey.substring(0, 10)}...`, 'green');
  } else {
    log('❌ API_FOOTBALL_KEY: NOT SET', 'red');
  }
  
  if (newsApiKey1) {
    log(`✅ NEWS_API_KEY_1: ${newsApiKey1.substring(0, 10)}...`, 'green');
  } else {
    log('⚠️  NEWS_API_KEY_1: NOT SET', 'yellow');
  }
  
  if (newsApiKey2) {
    log(`✅ NEWS_API_KEY_2: ${newsApiKey2.substring(0, 10)}...`, 'green');
  } else {
    log('⚠️  NEWS_API_KEY_2: NOT SET', 'yellow');
  }
  
  if (trtRssUrl) {
    log(`✅ TRT_RSS_URL: ${trtRssUrl}`, 'green');
  } else {
    log('⚠️  TRT_RSS_URL: NOT SET (using default)', 'yellow');
  }
}

async function testFootballAPI() {
  logSection('⚽ Football API Test');
  
  try {
    log('Testing live matches...', 'blue');
    const liveResult = await getFootballLiveMatches();
    
    if (liveResult.success) {
      const count = liveResult.data?.length || 0;
      log(`✅ Live matches fetched: ${count} matches`, 'green');
      
      if (count > 0) {
        log('Sample match:', 'blue');
        const sample = liveResult.data[0];
        console.log(`   ${sample.teams?.home?.name} vs ${sample.teams?.away?.name}`);
        console.log(`   Status: ${sample.fixture?.status?.short}`);
        console.log(`   Score: ${sample.goals?.home || 0} - ${sample.goals?.away || 0}`);
      } else {
        log('⚠️  No live matches currently (this is normal if no matches are live)', 'yellow');
      }
    } else {
      log(`❌ Failed: ${liveResult.message}`, 'red');
      
      // Check for specific error codes
      if (liveResult.message?.includes('401') || liveResult.message?.includes('Unauthorized')) {
        log('   → API key may be invalid or expired', 'yellow');
      } else if (liveResult.message?.includes('429') || liveResult.message?.includes('rate limit')) {
        log('   → Rate limit exceeded. Wait a few minutes and try again.', 'yellow');
      } else if (liveResult.message?.includes('403') || liveResult.message?.includes('Forbidden')) {
        log('   → API key may be suspended or invalid', 'yellow');
      }
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
  
  try {
    log('\nTesting upcoming matches (today)...', 'blue');
    const today = new Date().toISOString().split('T')[0];
    const fixturesResult = await getFootballFixtures(today);
    
    if (fixturesResult.success) {
      const count = fixturesResult.data?.length || 0;
      log(`✅ Upcoming matches fetched: ${count} matches`, 'green');
    } else {
      log(`❌ Failed: ${fixturesResult.message}`, 'red');
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
}

async function testBasketballAPI() {
  logSection('🏀 Basketball API Test');
  
  try {
    log('Testing live matches...', 'blue');
    const liveResult = await getBasketballLiveMatches();
    
    if (liveResult.success) {
      const count = liveResult.data?.length || 0;
      log(`✅ Live matches fetched: ${count} matches`, 'green');
      
      if (count > 0) {
        log('Sample match:', 'blue');
        const sample = liveResult.data[0];
        console.log(`   ${sample.teams?.home?.name} vs ${sample.teams?.away?.name}`);
        console.log(`   Status: ${sample.status?.short || sample.fixture?.status?.short}`);
        console.log(`   Score: ${sample.scores?.home?.total || 0} - ${sample.scores?.away?.total || 0}`);
      } else {
        log('⚠️  No live matches currently (this is normal if no matches are live)', 'yellow');
      }
    } else {
      log(`❌ Failed: ${liveResult.message}`, 'red');
      
      if (liveResult.message?.includes('401') || liveResult.message?.includes('Unauthorized')) {
        log('   → API key may be invalid or expired', 'yellow');
      } else if (liveResult.message?.includes('429')) {
        log('   → Rate limit exceeded', 'yellow');
      } else if (liveResult.message?.includes('403')) {
        log('   → API key may be suspended', 'yellow');
      }
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
  
  try {
    log('\nTesting upcoming matches (today)...', 'blue');
    const today = new Date().toISOString().split('T')[0];
    const fixturesResult = await getBasketballFixtures(today);
    
    if (fixturesResult.success) {
      const count = fixturesResult.data?.length || 0;
      log(`✅ Upcoming matches fetched: ${count} matches`, 'green');
    } else {
      log(`❌ Failed: ${fixturesResult.message}`, 'red');
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
}

async function testNewsAPI() {
  logSection('📰 News API Test');
  
  try {
    log('Testing news fetch (all sources)...', 'blue');
    const result = await fetchAllNews();
    
    if (result.success) {
      log(`✅ News fetched successfully`, 'green');
      log(`   API1: ${result.api1?.fetched || 0} fetched, ${result.api1?.count || 0} unique`, 'blue');
      log(`   API2: ${result.api2?.fetched || 0} fetched, ${result.api2?.count || 0} unique`, 'blue');
      log(`   TRT: ${result.trt?.fetched || 0} fetched, ${result.trt?.count || 0} unique`, 'blue');
      log(`   Total inserted: ${result.inserted || 0}`, 'green');
      log(`   Skipped (duplicates): ${result.skipped || 0}`, 'blue');
      
      if (result.trt?.fetched === 0) {
        log('⚠️  TRT RSS feed returned 0 items. Checking URL...', 'yellow');
        const trtUrl = process.env.TRT_RSS_URL || 'https://www.trthaber.com/spor_articles.rss';
        log(`   TRT URL: ${trtUrl}`, 'blue');
      }
    } else {
      log(`❌ Failed: ${result.message}`, 'red');
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

async function testTRTRSS() {
  logSection('📡 TRT RSS Feed Test');
  
  try {
    const axios = require('axios');
    const xml2js = require('xml2js');
    const trtUrl = process.env.TRT_RSS_URL || 'https://www.trthaber.com/spor_articles.rss';
    
    log(`Fetching from: ${trtUrl}`, 'blue');
    
    const response = await axios.get(trtUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (response.status === 200) {
      log('✅ RSS feed accessible', 'green');
      
      // Try to parse
      const parser = new xml2js.Parser({ explicitArray: false });
      parser.parseString(response.data, (err, result) => {
        if (err) {
          log(`⚠️  RSS parsing error: ${err.message}`, 'yellow');
        } else {
          let items = [];
          if (result.rss && result.rss.channel) {
            const channel = Array.isArray(result.rss.channel) ? result.rss.channel[0] : result.rss.channel;
            items = Array.isArray(channel.item) ? channel.item : (channel.item ? [channel.item] : []);
          }
          
          log(`✅ RSS parsed successfully: ${items.length} items found`, 'green');
          
          if (items.length > 0) {
            log('Sample article:', 'blue');
            const sample = items[0];
            console.log(`   Title: ${sample.title || sample.title?._ || 'N/A'}`);
            console.log(`   Link: ${sample.link || sample.link?.href || 'N/A'}`);
            console.log(`   Published: ${sample.pubDate || sample.published || 'N/A'}`);
          }
        }
      });
    } else {
      log(`❌ HTTP ${response.status}`, 'red');
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    
    if (error.code === 'ENOTFOUND') {
      log('   → DNS resolution failed. Check internet connection.', 'yellow');
    } else if (error.code === 'ECONNREFUSED') {
      log('   → Connection refused. Server may be down.', 'yellow');
    } else if (error.code === 'ETIMEDOUT') {
      log('   → Request timeout. Server may be slow or unreachable.', 'yellow');
    } else if (error.response) {
      log(`   → HTTP ${error.response.status}: ${error.response.statusText}`, 'yellow');
    }
  }
}

async function main() {
  log('\n🚀 API Connectivity Test', 'cyan');
  log('='.repeat(60), 'cyan');
  
  await testAPIKey();
  await testFootballAPI();
  await testBasketballAPI();
  await testNewsAPI();
  await testTRTRSS();
  
  logSection('📊 Summary');
  log('Test completed! Check the results above.', 'blue');
  log('\n💡 Tips:', 'yellow');
  log('1. If API keys are missing, add them to backend/.env', 'blue');
  log('2. If APIs return 401/403, your API key may be invalid or suspended', 'blue');
  log('3. If APIs return 429, you\'ve hit rate limits. Wait and try again.', 'blue');
  log('4. If TRT RSS returns 0 items, the feed may be empty or URL may be wrong', 'blue');
  log('5. Live matches will be 0 if no matches are currently live (this is normal)', 'blue');
  
  process.exit(0);
}

// Run tests
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});

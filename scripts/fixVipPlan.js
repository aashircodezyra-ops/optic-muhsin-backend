/**
 * Fix VIP Plan Script
 * 
 * This script fixes existing users with null or missing vipPlan values.
 * 
 * USAGE:
 *   node scripts/fixVipPlan.js
 * 
 * ENVIRONMENT VARIABLES REQUIRED:
 *   MONGO_URI - MongoDB connection string (from .env)
 * 
 * SECURITY:
 *   - Only run this script in development/testing environments
 *   - Delete this script after fixing existing records
 *   - This is a one-time migration script
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ Error: MONGO_URI must be set in .env file');
  process.exit(1);
}

async function fixVipPlan() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find users with null or missing vipPlan
    console.log('🔍 Searching for users with null or missing vipPlan...');
    const usersToFix = await User.find({
      $or: [
        { vipPlan: null },
        { vipPlan: { $exists: false } }
      ]
    });

    if (usersToFix.length === 0) {
      console.log('✅ No users found with null or missing vipPlan. All users are up to date!');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`📊 Found ${usersToFix.length} user(s) to fix`);

    // Update users
    console.log('🔧 Updating users...');
    const result = await User.updateMany(
      {
        $or: [
          { vipPlan: null },
          { vipPlan: { $exists: false } }
        ]
      },
      {
        $set: {
          vipPlan: 'none',
          isVIP: false
        }
      }
    );

    console.log(`\n✅ Successfully updated ${result.modifiedCount} user(s)`);
    console.log('📋 Changes applied:');
    console.log('   - vipPlan set to "none"');
    console.log('   - isVIP set to false');
    console.log('\n🔒 Security Reminder:');
    console.log('   - Delete this script after use');
    console.log('   - This was a one-time migration');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing vipPlan:');
    console.error(error.message);
    console.error(error.stack);
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run the script
fixVipPlan();


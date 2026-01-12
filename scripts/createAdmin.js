/**
 * Safe Admin Seeding Script
 * 
 * This script creates an admin user in the database.
 * 
 * USAGE:
 *   node scripts/createAdmin.js
 * 
 * ENVIRONMENT VARIABLES REQUIRED:
 *   ADMIN_EMAIL - Email for the admin account
 *   ADMIN_PASSWORD - Password for the admin account
 *   ADMIN_USERNAME - Username for the admin account (optional, defaults to 'admin')
 *   MONGO_URI - MongoDB connection string (from .env)
 * 
 * SECURITY:
 *   - Only run this script in development/testing environments
 *   - Delete this script after creating the admin account
 *   - Never commit admin credentials to version control
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file');
  console.error('\nExample .env entries:');
  console.error('ADMIN_EMAIL=admin@example.com');
  console.error('ADMIN_PASSWORD=SecurePassword123!');
  console.error('ADMIN_USERNAME=admin (optional)');
  process.exit(1);
}

if (!MONGO_URI) {
  console.error('❌ Error: MONGO_URI must be set in .env file');
  process.exit(1);
}

async function createAdmin() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { email: ADMIN_EMAIL },
        { username: ADMIN_USERNAME },
        { role: 'admin' }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log('\n💡 To create a new admin, use a different email/username or delete the existing admin first.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      isVIP: false,
      vipPlan: 'none',
      vipExpiryDate: null,
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('📋 Admin Details:');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   VIP Plan: ${admin.vipPlan}`);
    console.log(`   ID: ${admin._id}`);
    console.log('\n🔒 Security Reminder:');
    console.log('   - Delete this script after use');
    console.log('   - Never commit admin credentials to version control');
    console.log('   - Change the default password after first login');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:');
    console.error(error.message);
    
    if (error.code === 11000) {
      console.error('\n💡 A user with this email or username already exists');
    }
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run the script
createAdmin();


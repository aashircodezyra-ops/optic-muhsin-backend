/**
 * Migration Script: Remove Username Index
 * 
 * This script removes the old 'username' unique index from the users collection.
 * The User model was updated to use 'name' instead of 'username', but the old
 * index may still exist in the database, causing "Username already exists" errors.
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Use same URI as backend - try MONGO_URI first, then MONGODB_URI
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/opticgoal';

async function removeUsernameIndex() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected successfully!');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Get all indexes
        console.log('\nCurrent indexes on users collection:');
        const indexes = await usersCollection.indexes();
        indexes.forEach(index => {
            console.log(`  - ${index.name}:`, Object.keys(index.key));
        });

        // Check if username index exists
        const usernameIndexExists = indexes.some(index =>
            index.key.hasOwnProperty('username')
        );

        if (usernameIndexExists) {
            console.log('\n❌ Found username index! Dropping it...');
            await usersCollection.dropIndex('username_1');
            console.log('✅ Username index dropped successfully!');
        } else {
            console.log('\n✅ No username index found. Database is clean!');
        }

        // Show final indexes
        console.log('\nFinal indexes on users collection:');
        const finalIndexes = await usersCollection.indexes();
        finalIndexes.forEach(index => {
            console.log(`  - ${index.name}:`, Object.keys(index.key));
        });

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        if (error.code === 27) {
            console.log('Note: Index might not exist, which is fine.');
        }
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

// Run the migration
removeUsernameIndex();

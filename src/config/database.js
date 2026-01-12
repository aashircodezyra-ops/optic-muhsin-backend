const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined. Please set MONGO_URI in your .env file');
    }

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB connected successfully`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.error(`   Please check your MONGO_URI in the .env file`);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB connection error: ${err.message}`);
});

module.exports = connectDB;


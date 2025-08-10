const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cey08bg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

async function connectDB() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    return client.db('libriSphere');
  } catch (err) {
    console.error('❌ MongoDB connection failed', err);
    process.exit(1);
  }
}

module.exports = connectDB;

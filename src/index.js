const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'https://libri-sphere.web.app'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

(async () => {
  const db = await connectDB();

  // Attach db instance to every request
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  // Routes
  app.use('/subscriptions', require('./routes/subscriptions'));
  app.use('/books', require('./routes/books'));
  app.use('/borrowed-books', require('./routes/borrowedBooks'));
  app.use('/auth', require('./routes/auth'));

  app.get('/', (req, res) => res.send('📚 Library API Running'));

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
})();

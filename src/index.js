// const express = require('express');
// const cors = require('cors');
// const cookieParser = require('cookie-parser');
// require('dotenv').config();

// const connectDB = require('./config/db');

// const app = express();
// app.use(cors({
//   origin: ['http://localhost:5173', 'https://libri-sphere.web.app'],
//   credentials: true
// }));
// app.use(express.json());
// app.use(cookieParser());

// (async () => {
//   const db = await connectDB();

//   // Attach db instance to every request
//   app.use((req, res, next) => {
//     req.db = db;
//     next();
//   });

//   // Routes
//   app.use('/subscriptions', require('./routes/subscriptions'));
//   app.use('/books', require('./routes/books'));
//   app.use('/borrowed-books', require('./routes/borrowedBooks'));
//   app.use('/auth', require('./routes/auth'));

//   app.get('/', (req, res) => res.send('📚 Library API Running'));

//   const port = process.env.PORT || 3000;
//   app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
// })();


const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://libri-sphere.web.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) return res.status(401).send({ message: 'unauthorized access' });

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ message: 'unauthorized access' });
    req.decoded = decoded;
    next();
  });
};

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cey08bg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const booksCollection = client.db('libriSphere').collection('books');
    const borrowedBooksCollection = client.db('libriSphere').collection('borrowed-books');
    const subscriptionsCollection = client.db('libriSphere').collection('subscriptions');

    // Create text index for search
    await booksCollection.createIndex({ name: 'text', author: 'text', category: 'text' }).catch(() => {});

    // JWT Token API
    app.post('/jwt', (req, res) => {
      const { email } = req.body;
      const token = jwt.sign({ email }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1d' });
      res.cookie('token', token, cookieOptions).send({ success: true });
    });

    // Books APIs
    app.get('/books', async (req, res) => {
      res.send(await booksCollection.find().toArray());
    });

    app.post('/books', async (req, res) => {
      res.send(await booksCollection.insertOne(req.body));
    });

    app.get('/books/search', async (req, res) => {
      try {
        const q = (req.query.q || '').trim();
        if (!q) return res.send([]);
        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const projection = { name: 1, author: 1, category: 1, image: 1, display_url: 1 };
        const result = await booksCollection
          .find({ $or: [{ name: regex }, { author: regex }, { category: regex }] })
          .project(projection)
          .limit(50)
          .toArray();
        res.send(result);
      } catch {
        res.status(500).send({ message: 'Search failed' });
      }
    });

    app.get('/books/:category', async (req, res) => {
      res.send(await booksCollection.find({ category: req.params.category }).toArray());
    });

    app.get('/books/:category/:id', async (req, res) => {
      res.send(await booksCollection.findOne({ _id: new ObjectId(req.params.id) }));
    });

    app.patch('/books/:category/:id', async (req, res) => {
      res.send(await booksCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { quantity: req.body.quantity } },
        { upsert: true }
      ));
    });

    app.put('/books/:category/:id', async (req, res) => {
      res.send(await booksCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body },
        { upsert: true }
      ));
    });

    // Subscriptions
    app.post('/subscriptions', async (req, res) => {
      const { name, email } = req.body;
      if (!name || !email) return res.status(400).send({ message: 'Name and email are required' });
      if (await subscriptionsCollection.findOne({ email })) {
        return res.status(409).send({ message: 'Email is already subscribed' });
      }
      const result = await subscriptionsCollection.insertOne({ name, email, subscribedAt: new Date() });
      res.send({ success: true, insertedId: result.insertedId });
    });

    // Borrowed books
    app.get('/borrowed-books', async (req, res) => {
      res.send(await borrowedBooksCollection.find().toArray());
    });

    app.get('/borrowed-books/:email', verifyToken, async (req, res) => {
      if (req.params.email !== req.decoded.email) return res.status(403).send({ message: 'access denied' });
      res.send(await borrowedBooksCollection.find({ email: req.params.email }).toArray());
    });

    app.get('/borrowed-books/:email/:id', verifyToken, async (req, res) => {
      if (req.params.email !== req.decoded.email) return res.status(403).send({ message: 'access denied' });
      res.send(await borrowedBooksCollection.findOne({ _id: new ObjectId(req.params.id) }));
    });

    app.post('/borrowed-books', async (req, res) => {
      res.send(await borrowedBooksCollection.insertOne(req.body));
    });

    app.delete('/borrowed-books/:email/:id', async (req, res) => {
      res.send(await borrowedBooksCollection.deleteOne({ _id: new ObjectId(req.params.id) }));
    });

    console.log("Connected to MongoDB successfully.");
  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send("Library Data is loading...");
});

app.listen(port, () => {
  console.log(`Library Server running at http://localhost:${port}`);
});

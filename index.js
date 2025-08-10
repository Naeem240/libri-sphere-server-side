const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config()


// middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://libri-sphere.web.app'
  ],
  credentials: true // Allow Cookie
}));
app.use(express.json())
app.use(cookieParser())

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};
//localhost:5000 and localhost:5173 are treated as same site.  so sameSite value must be strict in development server.  in production sameSite will be none
// in development server secure will false .  in production secure will be true

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log('Cookie from middleware', token);
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }

  // verify token
  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })


  // next();
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cey08bg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const booksCollection = client.db('libriSphere').collection('books');

    const borrowedBooksCollection = client.db('libriSphere').collection('borrowed-books');

    const subscriptionsCollection = client.db('libriSphere').collection('subscriptions');


    // create a text index (safe to call multiple times)
    try {
      await booksCollection.createIndex({ name: 'text', author: 'text', category: 'text' });
    } catch (err) {
      console.warn('Could not create text index (it may already exist):', err.message);
    }

    // JWT Token APIs
    app.post('/jwt', async (req, res) => {
      const { email } = req.body;
      const user = { email };
      const token = jwt.sign(user, process.env.JWT_ACCESS_SECRET, { expiresIn: '1d' });

      // Set the Cookies:

      res.cookie('token', token, {
        httpOnly: true,
        secure: false
      })

      res.send({ success: true });
    })

    // All Books API
    app.get('/books', async (req, res) => {
      const result = await booksCollection.find().toArray();
      res.send(result)
    })

    // New Book Post
    app.post('/books', async (req, res) => {
      const newBook = req.body;
      // const options = { upsert: true };
      const result = await booksCollection.insertOne(newBook);
      res.send(result);
    })

    // Get all subscriptions
    // app.get('/subscriptions', async (req, res) => {
    //   try {
    //     const result = await subscriptionsCollection
    //       .find({})
    //       .project({ name: 1, email: 1, subscribedAt: 1 }) // only return necessary fields
    //       .sort({ subscribedAt: -1 }) // newest first
    //       .toArray();

    //     res.send(result);
    //   } catch (err) {
    //     console.error('Error fetching subscriptions:', err);
    //     res.status(500).send({ message: 'Internal server error' });
    //   }
    // });

    // Save new subscription
    app.post('/subscriptions', async (req, res) => {
      try {
        const { name, email } = req.body;

        if (!name || !email) {
          return res.status(400).send({ message: 'Name and email are required' });
        }

        // Optional: prevent duplicate subscriptions
        const existing = await subscriptionsCollection.findOne({ email: email });
        if (existing) {
          return res.status(409).send({ message: 'Email is already subscribed' });
        }

        const result = await subscriptionsCollection.insertOne({
          name,
          email,
          subscribedAt: new Date()
        });

        res.send({ success: true, insertedId: result.insertedId });
      } catch (err) {
        console.error('Subscription error:', err);
        res.status(500).send({ message: 'Internal server error' });
      }
    });


    // Search API
    app.get('/books/search', async (req, res) => {
      try {
        const q = (req.query.q || '').trim();
        if (!q) return res.send([]);

        // simple case-insensitive regex search across three fields
        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

        const projection = { name: 1, author: 1, category: 1, image: 1, display_url: 1 };

        const result = await booksCollection
          .find({
            $or: [
              { name: { $regex: regex } },
              { author: { $regex: regex } },
              { category: { $regex: regex } }
            ]
          })
          .project(projection)
          .limit(50)
          .toArray();

        res.send(result);
      } catch (err) {
        console.error('Search error:', err);
        res.status(500).send({ message: 'Search failed' });
      }
    });

    // Books By Category
    app.get('/books/:category', async (req, res) => {
      const category = req.params.category;
      const query = { category: category };
      const result = await booksCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    })

    // Find Single Book by ID
    app.get('/books/:category/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query)
      const result = await booksCollection.findOne(query);
      res.send(result);
    })

    // Update Quantity
    app.patch('/books/:category/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          quantity: req.body.quantity
        }
      }
      const result = await booksCollection.updateOne(filter, updatedDoc, options)
      res.send(result)
    })

    // Update Book Data
    app.put('/books/:category/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: req.body
      }
      const result = await booksCollection.updateOne(filter, updatedDoc, options)
      res.send(result)
    })

    // Borrowed Books API
    app.get('/borrowed-books', async (req, res) => {
      const result = await borrowedBooksCollection.find().toArray();
      res.send(result)
    })

    // Borrowed Books By email
    app.get('/borrowed-books/:email', verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'access denied' })
      }

      const query = { email: email };
      const result = await borrowedBooksCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    })

    // Single Borrowed Books By ID
    app.get('/borrowed-books/:email/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'access denied' })
      }
      const query = { _id: new ObjectId(id) }; //Why not {_id: new ObjectId(id)}??      
      console.log(query)
      // console.log(booksCollection)      
      const result = await borrowedBooksCollection.findOne(query);
      // console.log(result)
      res.send(result);
    })

    // Post Borrowed Books
    app.post('/borrowed-books', async (req, res) => {
      const updatedDoc = req.body;
      // const options = { upsert: true };
      const result = await borrowedBooksCollection.insertOne(updatedDoc);
      res.send(result);
    })



    // Delete from Borrowed Book
    app.delete('/borrowed-books/:email/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await borrowedBooksCollection.deleteOne(query);
      res.send(result);
    })








    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send("Library Data is loadings")
})

app.listen(port, () => {
  console.log(`Library Server is running at the port: ${port}`)
})

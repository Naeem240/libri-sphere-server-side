const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db'); // adjust path if needed

async function getAllBooks(req, res) {
    try {
        const books = await req.db.collection('books').find().toArray();
        res.send(books);
    } catch (err) {
        res.status(500).send({ message: 'Internal server error' });
    }
}

async function getBooksByCategory(req, res) {
    try {
        const category = req.params.category;
        const books = await req.db.collection('books').find({ category }).toArray();
        res.send(books);
    } catch (err) {
        console.error('Error fetching books by category:', err);
        res.status(500).send({ message: 'Internal server error' });
    }
}
async function getBookById(req, res) {
    try {
        const id = req.params.id;
        const book = await req.db.collection('books').findOne({ _id: new ObjectId(id) });
        if (!book) return res.status(404).send({ message: 'Book not found' });
        res.send(book);
    } catch (err) {
        res.status(500).send({ message: 'Internal server error' });
    }
}

async function getBookByCategoryAndId(req, res) {
    try {
        const { category, bookId } = req.params;
        const book = await req.db.collection('books').findOne({
            _id: new ObjectId(bookId),
            category
        });

        if (!book) {
            return res.status(404).send({ message: 'Book not found' });
        }

        res.send(book);
    } catch (err) {
        console.error('Error fetching book by category and ID:', err);
        res.status(500).send({ message: 'Internal server error' });
    }
}

async function searchBooks(req, res) {
    try {
        const q = (req.query.q || '').trim();
        if (!q) return res.send([]);

        // Escape regex special chars & create case-insensitive regex
        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

        const projection = { name: 1, author: 1, category: 1, image: 1, display_url: 1 };

        const books = await req.db.collection('books')
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

        res.send(books);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).send({ message: 'Search failed' });
    }
}


async function addBook(req, res) {
    try {
        const result = await req.db.collection('books').insertOne(req.body);
        res.send(result);
    } catch (err) {
        res.status(500).send({ message: 'Internal server error' });
    }
}

async function updateBook(req, res) {
    try {
        const id = req.params.id;
        const updatedData = req.body;
        const result = await req.db.collection('books').updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedData }
        );
        res.send(result);
    } catch (err) {
        res.status(500).send({ message: 'Internal server error' });
    }
}

async function deleteBook(req, res) {
    try {
        const id = req.params.id;
        const result = await req.db.collection('books').deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    } catch (err) {
        res.status(500).send({ message: 'Internal server error' });
    }
}

// PATCH: Update book quantity
async function updateBookQuantity(req, res) {
  try {
    const id = req.params.id;
    const db = getDb();
    const booksCollection = db.collection('books');

    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const updatedDoc = {
      $set: { quantity: req.body.quantity }
    };

    const result = await booksCollection.updateOne(filter, updatedDoc, options);
    res.send(result);
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({ message: 'Failed to update quantity' });
  }
}

module.exports = {
  updateBookQuantity
};

module.exports = { getAllBooks, getBookById, addBook, updateBook, deleteBook, getBooksByCategory, getBookByCategoryAndId, searchBooks, updateBookQuantity };

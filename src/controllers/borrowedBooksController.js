async function getBorrowedBooks(req, res) {
  try {
    const borrowed = await req.db.collection('borrowedBooks').find().toArray();
    res.send(borrowed);
  } catch (err) {
    res.status(500).send({ message: 'Internal server error' });
  }
}

async function borrowBook(req, res) {
  try {
    const result = await req.db.collection('borrowedBooks').insertOne(req.body);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: 'Internal server error' });
  }
}

async function returnBook(req, res) {
  try {
    const id = req.params.id;
    const result = await req.db.collection('borrowedBooks').deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: 'Internal server error' });
  }
}

module.exports = { getBorrowedBooks, borrowBook, returnBook };

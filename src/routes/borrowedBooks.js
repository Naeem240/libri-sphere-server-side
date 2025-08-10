const express = require('express');
const { ObjectId } = require('mongodb');
const { getBorrowedBooks, borrowBook, returnBook } = require('../controllers/borrowedBooksController');

const router = express.Router();

router.get('/', getBorrowedBooks);
router.post('/', borrowBook);
router.delete('/:id', returnBook);

module.exports = router;

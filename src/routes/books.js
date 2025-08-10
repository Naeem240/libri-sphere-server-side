const express = require('express');
const {
  getAllBooks,
  getBooksByCategory,
  getBookByCategoryAndId,
  addBook,
  updateBook,
  deleteBook,
  searchBooks,
  updateBookQuantity// import here
} = require('../controllers/booksController');

const router = express.Router();

// Search route - **place it before** other param routes to avoid conflicts
router.get('/search', searchBooks);

// Other routes
router.get('/', getAllBooks);
router.get('/:category', getBooksByCategory);
router.get('/:category/:bookId', getBookByCategoryAndId);

router.post('/', addBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);
// PATCH /books/:category/:id
router.patch('/:category/:id', updateBookQuantity);

module.exports = router;

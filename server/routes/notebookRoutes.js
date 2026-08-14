const express = require('express');
const {
  getNotebooks,
  createNotebook,
  updateNotebook,
  deleteNotebook,
} = require('../controllers/notebookController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getNotebooks);
router.post('/', createNotebook);
router.put('/:id', updateNotebook);
router.delete('/:id', deleteNotebook);

module.exports = router;

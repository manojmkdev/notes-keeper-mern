const express = require('express');
const {
  getNotes,
  createNote,
  updateNote,
  toggleArchive,
  togglePin,
  restoreNote,
  deleteNote,
  clearTrash,
  resetUserData,
} = require('../controllers/noteController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Static/collection routes must come before "/:id" routes
router.delete('/trash/clear', clearTrash);
router.delete('/reset-data', resetUserData);

router.get('/', getNotes);
router.post('/', createNote);
router.put('/:id', updateNote);
router.patch('/:id/archive', toggleArchive);
router.patch('/:id/pin', togglePin);
router.patch('/:id/restore', restoreNote);
router.delete('/:id', deleteNote);

module.exports = router;

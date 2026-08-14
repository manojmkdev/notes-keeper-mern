const Note = require('../models/Note');
const Notebook = require('../models/Notebook');
const Tag = require('../models/Tag');
const { asyncHandler } = require('../middleware/errorHandler');

//GET /api/notes
const getNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({ user: req.user.id }).sort({ updatedAt: -1 });
  res.json(notes.map((n) => n.toJSON()));
});

//POST /api/notes
const createNote = asyncHandler(async (req, res) => {
  const { title, content, notebookId, tags, color } = req.body;

  if (!(title && title.trim()) && !(content && content.trim())) {
    return res.status(400).json({ message: 'Note is empty.' });
  }

  const note = await Note.create({
    title: (title && title.trim()) || 'Untitled',
    content: content || '',
    notebookId: notebookId || '',
    tags: Array.isArray(tags) ? tags : [],
    color: color || '#ffffff',
    user: req.user.id,
  });

  res.status(201).json(note.toJSON());
});

//PUT /api/notes/:id
const updateNote = asyncHandler(async (req, res) => {
  const { title, content, notebookId, tags, color } = req.body;

  const update = { updatedAt: new Date() };
  if (title !== undefined) update.title = title.trim() || 'Untitled';
  if (content !== undefined) update.content = content;
  if (notebookId !== undefined) update.notebookId = notebookId;
  if (tags !== undefined) update.tags = Array.isArray(tags) ? tags : [];
  if (color !== undefined) update.color = color;

  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    update,
    { new: true, runValidators: true }
  );
  if (!note) return res.status(404).json({ message: 'Note not found.' });

  res.json(note.toJSON());
});

//PATCH /api/notes/:id/archive  (toggles archived)
const toggleArchive = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
  if (!note) return res.status(404).json({ message: 'Note not found.' });

  note.archived = !note.archived;
  await note.save();
  res.json(note.toJSON());
});

//PATCH /api/notes/:id/pin  (toggles pinned)
const togglePin = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
  if (!note) return res.status(404).json({ message: 'Note not found.' });

  note.pinned = !note.pinned;
  await note.save();
  res.json(note.toJSON());
});

// PATCH /api/notes/:id/restore  (clears deleted flag)
const restoreNote = asyncHandler(async (req, res) => {
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { deleted: false },
    { new: true }
  );
  if (!note) return res.status(404).json({ message: 'Note not found.' });
  res.json(note.toJSON());
});

// DELETE /api/notes/:id
// Soft-deletes (moves to Trash) unless ?permanent=true, in which case it's removed for good.
const deleteNote = asyncHandler(async (req, res) => {
  if (req.query.permanent === 'true') {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found.' });
    return res.json({ message: 'Note permanently deleted', id: req.params.id });
  }

  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { deleted: true },
    { new: true }
  );
  if (!note) return res.status(404).json({ message: 'Note not found.' });
  res.json(note.toJSON());
});

// DELETE /api/notes/trash/clear
const clearTrash = asyncHandler(async (req, res) => {
  await Note.deleteMany({ user: req.user.id, deleted: true });
  res.json({ message: 'Trash cleared' });
});

// DELETE /api/notes/reset-data  (wipes notes, notebooks, tags for the user)
const resetUserData = asyncHandler(async (req, res) => {
  await Promise.all([
    Note.deleteMany({ user: req.user.id }),
    Notebook.deleteMany({ user: req.user.id }),
    Tag.deleteMany({ user: req.user.id }),
  ]);
  res.json({ message: 'Your data has been cleared.' });
});

module.exports = {
  getNotes,
  createNote,
  updateNote,
  toggleArchive,
  togglePin,
  restoreNote,
  deleteNote,
  clearTrash,
  resetUserData,
};

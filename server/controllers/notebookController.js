const Notebook = require('../models/Notebook');
const Note = require('../models/Note');
const { asyncHandler } = require('../middleware/errorHandler');

// @route  GET /api/notebooks
const getNotebooks = asyncHandler(async (req, res) => {
  const notebooks = await Notebook.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(notebooks.map((nb) => nb.toJSON()));
});

// @route  POST /api/notebooks
const createNotebook = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Notebook name cannot be empty.' });
  }

  const exists = await Notebook.findOne({
    user: req.user.id,
    name: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  });
  if (exists) {
    return res.status(409).json({ message: 'A notebook with this name already exists.' });
  }

  const notebook = await Notebook.create({ name: name.trim(), user: req.user.id });
  res.status(201).json(notebook.toJSON());
});

// @route  PUT /api/notebooks/:id
const updateNotebook = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Notebook name cannot be empty.' });
  }

  const exists = await Notebook.findOne({
    _id: { $ne: req.params.id },
    user: req.user.id,
    name: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  });
  if (exists) {
    return res.status(409).json({ message: 'A notebook with this name already exists.' });
  }

  const notebook = await Notebook.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { name: name.trim() },
    { new: true, runValidators: true }
  );
  if (!notebook) return res.status(404).json({ message: 'Notebook not found.' });

  res.json(notebook.toJSON());
});

// @route  DELETE /api/notebooks/:id
const deleteNotebook = asyncHandler(async (req, res) => {
  const notebook = await Notebook.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!notebook) return res.status(404).json({ message: 'Notebook not found.' });

  // Uncategorize notes that referenced this notebook
  await Note.updateMany(
    { user: req.user.id, notebookId: req.params.id },
    { notebookId: '' }
  );

  res.json({ message: 'Notebook deleted.', id: req.params.id });
});

module.exports = { getNotebooks, createNotebook, updateNotebook, deleteNotebook };

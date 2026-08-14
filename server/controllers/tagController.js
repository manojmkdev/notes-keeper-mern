const Tag = require('../models/Tag');
const Note = require('../models/Note');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/tags
const getTags = asyncHandler(async (req, res) => {
  const tags = await Tag.find({ user: req.user.id }).sort({ createdAt: 1 });
  res.json(tags.map((t) => t.toJSON()));
});

// @route  POST /api/tags
const createTag = asyncHandler(async (req, res) => {
  const { name, color } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Tag name cannot be empty.' });
  }

  const exists = await Tag.findOne({
    user: req.user.id,
    name: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  });
  if (exists) {
    return res.status(409).json({ message: 'A tag with this name already exists.' });
  }

  const tag = await Tag.create({ name: name.trim(), color: color || '#3b82f6', user: req.user.id });
  res.status(201).json(tag.toJSON());
});

// @route  PUT /api/tags/:id
const updateTag = asyncHandler(async (req, res) => {
  const { name, color } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Tag name cannot be empty.' });
  }

  const exists = await Tag.findOne({
    _id: { $ne: req.params.id },
    user: req.user.id,
    name: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  });
  if (exists) {
    return res.status(409).json({ message: 'A tag with this name already exists.' });
  }

  const tag = await Tag.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { name: name.trim(), ...(color ? { color } : {}) },
    { new: true, runValidators: true }
  );
  if (!tag) return res.status(404).json({ message: 'Tag not found.' });

  res.json(tag.toJSON());
});

// @route  DELETE /api/tags/:id
const deleteTag = asyncHandler(async (req, res) => {
  const tag = await Tag.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!tag) return res.status(404).json({ message: 'Tag not found.' });

  // Remove the tag reference from all notes
  await Note.updateMany(
    { user: req.user.id, tags: req.params.id },
    { $pull: { tags: req.params.id } }
  );

  res.json({ message: 'Tag deleted.', id: req.params.id });
});

module.exports = { getTags, createTag, updateTag, deleteTag };

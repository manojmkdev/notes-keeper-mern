import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  fetchTags,
  createTagRequest,
  updateTagRequest,
  deleteTagRequest,
  fetchNotes,
} from '../utils/notesApi';
import { getErrorMessage } from '../utils/api';
import './TagsPage.css';

const TAG_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
];

export default function TagsPage() {
  const [tags, setTags] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [tagsData, notesData] = await Promise.all([fetchTags(), fetchNotes()]);
      setTags(tagsData);
      setNotes(notesData);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) {
      toast.warning('Tag name cannot be empty.');
      return;
    }
    try {
      await createTagRequest({ name: newTagName.trim(), color: selectedColor });
      setNewTagName('');
      setSelectedColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
      await loadData();
      toast.success('Tag created successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleStartEdit = (tag) => {
    setEditingId(tag.id);
    setEditingName(tag.name);
    setEditingColor(tag.color);
  };

  const handleSaveEdit = async (id) => {
    if (!editingName.trim()) {
      toast.warning('Tag name cannot be empty.');
      return;
    }
    try {
      await updateTagRequest(id, { name: editingName.trim(), color: editingColor });
      setEditingId(null);
      setEditingName('');
      await loadData();
      toast.success('Tag updated!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tag? It will be removed from all your notes.')) {
      try {
        await deleteTagRequest(id);
        await loadData();
        toast.success('Tag deleted.');
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    }
  };

  const getNoteCount = (tagId) => {
    return notes.filter((n) => n.tags && n.tags.includes(tagId) && !n.deleted).length;
  };

  if (loading) {
    return (
      <div className="tags-container">
        <p className="tags-subtitle">Loading tags...</p>
      </div>
    );
  }

  return (
    <div className="tags-container">
      <div className="tags-header-row">
        <div>
          <h2 className="tags-title">Tags</h2>
          <p className="tags-subtitle">Label your notes with descriptive tags for quick filtering.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="tag-create-form">
        <div className="tag-inputs-group">
          <input
            type="text"
            className="tag-input form-control"
            placeholder="Enter tag name... (e.g. Important, Ideas, Receipt)"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
          />
          <div className="tag-color-picker">
            <label className="tag-color-label">Tag Color:</label>
            <div className="tag-colors-grid">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`tag-color-dot ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>
        </div>
        <button type="submit" className="tag-create-btn">
          Create Tag
        </button>
      </form>

      <div className="tags-grid">
        {tags.map((tag) => {
          const count = getNoteCount(tag.id);
          const isEditing = editingId === tag.id;

          return (
            <div key={tag.id} className="tag-card" style={{ borderLeft: `4px solid ${tag.color}` }}>
              <div className="tag-card-content">
                {isEditing ? (
                  <div className="tag-edit-container">
                    <input
                      type="text"
                      className="tag-input-edit form-control"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                    <div className="tag-edit-colors">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`tag-color-dot-small ${editingColor === color ? 'selected' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditingColor(color)}
                        />
                      ))}
                    </div>
                    <div className="tag-edit-actions">
                      <button
                        className="tag-icon-btn tag-save-btn"
                        onClick={() => handleSaveEdit(tag.id)}
                        title="Save"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                      <button
                        className="tag-icon-btn tag-cancel-btn"
                        onClick={() => setEditingId(null)}
                        title="Cancel"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="tag-view-row">
                    <div className="tag-display">
                      <span
                        className="tag-badge-preview"
                        style={{
                          backgroundColor: tag.color + '22',
                          color: tag.color,
                          borderColor: tag.color + '55',
                        }}
                      >
                        {tag.name}
                      </span>
                      <span className="tag-card-count">
                        {count} {count === 1 ? 'note' : 'notes'}
                      </span>
                    </div>
                    <div className="tag-card-actions">
                      <button
                        className="tag-action-btn"
                        onClick={() => handleStartEdit(tag)}
                        title="Edit Tag"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="tag-action-btn tag-action-btn--delete"
                        onClick={() => handleDelete(tag.id)}
                        title="Delete Tag"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {tags.length === 0 && (
        <div className="tags-empty-state">
          <p>No tags created yet. Label your thoughts by creating one above!</p>
        </div>
      )}
    </div>
  );
}

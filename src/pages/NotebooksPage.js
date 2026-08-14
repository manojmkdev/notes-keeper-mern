import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  fetchNotebooks,
  createNotebookRequest,
  updateNotebookRequest,
  deleteNotebookRequest,
  fetchNotes,
} from '../utils/notesApi';
import { getErrorMessage } from '../utils/api';
import { v4 as uuidv4 } from 'uuid';
import './NotebooksPage.css';

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [nbData, notesData] = await Promise.all([fetchNotebooks(), fetchNotes()]);
      setNotebooks(nbData);
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
    if (!newNotebookName.trim()) {
      toast.warning('Notebook name cannot be empty.');
      return;
    }
    try {
      await createNotebookRequest({ name: newNotebookName.trim() });
      setNewNotebookName('');
      await loadData();
      toast.success('Notebook created successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleStartEdit = (nb) => {
    setEditingId(nb.id);
    setEditingName(nb.name);
  };

  const handleSaveEdit = async (id) => {
    if (!editingName.trim()) {
      toast.warning('Notebook name cannot be empty.');
      return;
    }
    try {
      await updateNotebookRequest(id, { name: editingName.trim() });
      setEditingId(null);
      setEditingName('');
      await loadData();
      toast.success('Notebook renamed!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notebook? Notes in this notebook will not be deleted but will be uncategorized.')) {
      try {
        await deleteNotebookRequest(id);
        await loadData();
        toast.success('Notebook deleted.');
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    }
  };

  // Helper to count notes in notebook
  const getNoteCount = (nbId) => {
    return notes.filter((n) => n.notebookId === nbId && !n.deleted).length;
  };

  if (loading) {
    return (
      <div className="notebooks-container">
        <p className="notebooks-subtitle">Loading notebooks...</p>
      </div>
    );
  }

  return (
    <div className="notebooks-container">
      <div className="notebooks-header-row">
        <div>
          <h2 className="notebooks-title">Notebooks</h2>
          <p className="notebooks-subtitle">Organise your notes into logical collections.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="notebook-create-form">
        <input
          type="text"
          className="notebook-input form-control"
          placeholder="Enter notebook name... (e.g. Work, Personal, Studies)"
          value={newNotebookName}
          onChange={(e) => setNewNotebookName(e.target.value)}
        />
        <button type="submit" className="notebook-create-btn">
          Create Notebook
        </button>
      </form>

      <div className="notebooks-grid">
        {notebooks.map((nb) => {
          const count = getNoteCount(nb.id);
          const isEditing = editingId === nb.id;

          return (
            <div key={nb.id || uuidv4()} className="notebook-card">
              <div className="notebook-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                    stroke="#5c4ee5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                    stroke="#5c4ee5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="notebook-card-content">
                {isEditing ? (
                  <div className="notebook-edit-row">
                    <input
                      type="text"
                      className="notebook-input-edit form-control"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                    <div className="notebook-edit-actions">
                      <button
                        className="notebook-icon-btn notebook-save-btn"
                        onClick={() => handleSaveEdit(nb.id)}
                        title="Save"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                      <button
                        className="notebook-icon-btn notebook-cancel-btn"
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
                  <>
                    <h3 className="notebook-card-name">{nb.name}</h3>
                    <span className="notebook-card-count">
                      {count} {count === 1 ? 'note' : 'notes'}
                    </span>
                  </>
                )}
              </div>

              {!isEditing && (
                <div className="notebook-card-actions">
                  <button
                    className="notebook-action-btn"
                    onClick={() => handleStartEdit(nb)}
                    title="Rename Notebook"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    className="notebook-action-btn notebook-action-btn--delete"
                    onClick={() => handleDelete(nb.id)}
                    title="Delete Notebook"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {notebooks.length === 0 && (
        <div className="notebooks-empty-state">
          <p>No notebooks created yet. Create one above to begin organising your thoughts!</p>
        </div>
      )}
    </div>
  );
}

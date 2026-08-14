import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  fetchNotes,
  fetchNotebooks,
  fetchTags,
  toggleArchiveRequest,
  togglePinRequest,
  restoreNoteRequest,
  deleteNoteRequest,
  clearTrashRequest,
  resetUserDataRequest,
} from '../utils/notesApi';
import { getErrorMessage } from '../utils/api';
import NoteCard from '../components/NoteCard';
import NoteEditor from '../components/NoteEditor';
import NoteViewer from '../components/NoteViewer';
import './AllNotes.css';

export default function AllNotes() {
  const { searchQuery } = useOutletContext() || { searchQuery: '' };
  const location = useLocation();
  const path = location.pathname;

  const [notes, setNotes] = useState([]);
  const [notebooks, setNotebooks] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(localStorage.getItem('nk_view') || 'grid');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [viewNoteId, setViewNoteId] = useState(null);
  const [showNewEditor, setShowNewEditor] = useState(false);
  const [sortBy, setSortBy] = useState('updated');

  const [stats, setStats] = useState({ total: 0, active: 0, archived: 0, deleted: 0 });

  const loadNotes = useCallback(async () => {
    try {
      const [allNotes, nbData, tagsData] = await Promise.all([
        fetchNotes(),
        fetchNotebooks(),
        fetchTags(),
      ]);
      setNotes(allNotes);
      setNotebooks(nbData);
      setTags(tagsData);
      setStats({
        total: allNotes.length,
        active: allNotes.filter((n) => !n.archived && !n.deleted).length,
        archived: allNotes.filter((n) => n.archived && !n.deleted).length,
        deleted: allNotes.filter((n) => n.deleted).length,
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
    if (location.state?.newNote) {
      setShowNewEditor(true);
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    const handleOpenNewEditor = () => {
      setShowNewEditor(true);
    };
    window.addEventListener('open-new-note-editor', handleOpenNewEditor);
    return () => {
      window.removeEventListener('open-new-note-editor', handleOpenNewEditor);
    };
  }, []);

  const handleArchive = async (id) => {
    try {
      const updated = await toggleArchiveRequest(id);
      await loadNotes();
      toast.success(updated.archived ? 'Note archived' : 'Note restored from Archive');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    if (path === '/trash') {
      if (window.confirm('Are you sure you want to permanently delete this note? This action cannot be undone.')) {
        try {
          await deleteNoteRequest(id, true);
          await loadNotes();
          toast.success('Note permanently deleted');
        } catch (err) {
          toast.error(getErrorMessage(err));
        }
      }
    } else {
      try {
        await deleteNoteRequest(id, false);
        await loadNotes();
        toast.success('Note moved to Trash');
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreNoteRequest(id);
      await loadNotes();
      toast.success('Note restored');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handlePin = async (id) => {
    try {
      const updated = await togglePinRequest(id);
      await loadNotes();
      toast.success(updated.pinned ? 'Note pinned' : 'Note unpinned');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleClearTrash = async () => {
    if (window.confirm('Are you sure you want to permanently delete all your notes in Trash?')) {
      try {
        await clearTrashRequest();
        await loadNotes();
        toast.success('Trash cleared');
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    }
  };

  const handleResetApp = async () => {
    if (window.confirm('Warning: This will clear all your notes, notebooks, and tags. Are you sure?')) {
      try {
        await resetUserDataRequest();
        await loadNotes();
        toast.success('Your data has been cleared.');
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    }
  };

  // Determine filtering based on current page path
  const getFilteredNotes = () => {
    let filtered = [...notes];

    // 1. Path categorization
    if (path === '/notes') {
      filtered = filtered.filter(n => !n.archived && !n.deleted);
    } else if (path === '/archive') {
      filtered = filtered.filter(n => n.archived && !n.deleted);
    } else if (path === '/trash') {
      filtered = filtered.filter(n => n.deleted);
    }

    // 2. Search filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        n =>
          (n.title || '').toLowerCase().includes(q) ||
          (n.content || '').toLowerCase().includes(q)
      );
    }

    // 3. Sorting (pinned notes always sorted to the top)
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'created') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });

    return filtered;
  };

  const filteredNotes = getFilteredNotes();

  // Helper to render section title / controls
  const getPageInfo = () => {
    switch (path) {
      case '/notes':
        return { title: 'All Notes', sub: 'Capture ideas and draft thoughts' };
      case '/archive':
        return { title: 'Archive', sub: 'Archived notes that are kept for reference' };
      case '/trash':
        return { title: 'Trash', sub: 'Deleted notes (permanently delete or restore here)' };
      case '/settings':
        return { title: 'Settings', sub: 'Manage application preferences and data' };
      default:
        return { title: 'Notes', sub: '' };
    }
  };

  const pageInfo = getPageInfo();

  if (loading) {
    return (
      <div className="allnotes-container">
        <p className="allnotes-sub">Loading your notes...</p>
      </div>
    );
  }

  if (path === '/settings') {
    return (
      <div className="settings-container">
        <h2 className="allnotes-title">{pageInfo.title}</h2>
        <p className="allnotes-sub">{pageInfo.sub}</p>

        <div className="settings-grid">
          <div className="settings-card">
            <h3 className="settings-card-title">Application Stats</h3>
            <div className="settings-stats-list">
              <div className="settings-stat-item">
                <span>Total Notes</span>
                <strong>{stats.total}</strong>
              </div>
              <div className="settings-stat-item">
                <span>Active Notes</span>
                <strong>{stats.active}</strong>
              </div>
              <div className="settings-stat-item">
                <span>Archived Notes</span>
                <strong>{stats.archived}</strong>
              </div>
              <div className="settings-stat-item">
                <span>Deleted Notes</span>
                <strong>{stats.deleted}</strong>
              </div>
            </div>
          </div>

          <div className="settings-card settings-card--danger">
            <h3 className="settings-card-title">Data Actions</h3>
            <p className="settings-card-desc">Be careful! These actions are permanent.</p>
            <div className="settings-actions-btn-group">
              <button className="settings-btn settings-btn--danger" onClick={handleResetApp}>
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="allnotes-container">
      <div className="allnotes-header-row">
        <div>
          <h2 className="allnotes-title">{pageInfo.title}</h2>
          <p className="allnotes-sub">{pageInfo.sub}</p>
        </div>

        {filteredNotes.length > 0 && (
          <div className="allnotes-toolbar">
            {path === '/trash' && (
              <button className="trash-clear-btn" onClick={handleClearTrash}>
                Empty Trash
              </button>
            )}
            <select
              className="notes-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="updated">Recently Updated</option>
              <option value="title">Title</option>
              <option value="created">Date Created</option>
            </select>
            <div className="view-toggle-group">
              <button 
                className={`view-toggle-btn ${view === 'grid' ? 'active' : ''}`} 
                onClick={() => { setView('grid'); localStorage.setItem('nk_view', 'grid'); }}
                title="Grid view"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
              </button>
              <button 
                className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`} 
                onClick={() => { setView('list'); localStorage.setItem('nk_view', 'list'); }}
                title="List view"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {filteredNotes.length === 0 ? (
        <div className="allnotes-empty">
          <div className="allnotes-empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h3 className="allnotes-empty-title">
            {searchQuery ? 'No notes match search' : path === '/archive' ? 'No archived notes' : path === '/trash' ? 'Trash is empty' : 'No notes yet'}
          </h3>
          <p className="allnotes-empty-sub">
            {searchQuery ? 'Try matching title or text content keywords' : path === '/archive' ? 'Archive important notes to hide them from the main list' : path === '/trash' ? 'Notes you delete will appear here' : 'Start capturing your thoughts by creating your first note'}
          </p>
          {path === '/notes' && !searchQuery && (
            <button className="allnotes-create-btn" onClick={() => setShowNewEditor(true)}>
              <span>+</span> Create your first note
            </button>
          )}
        </div>
      ) : (
        <div className="notes-list-wrapper">
          <div className="notes-section">
            <div className={view === 'grid' ? 'notes-grid' : 'notes-list'}>
              {filteredNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  view={view}
                  onView={setViewNoteId}
                  onEdit={setEditingNoteId}
                  onDelete={handleDelete}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                  onPin={handlePin}
                  searchQuery={searchQuery}
                  notebooks={notebooks}
                  tags={tags}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Note Editor Modal */}
      {(showNewEditor || editingNoteId) && (
        <NoteEditor
          noteId={editingNoteId}
          onClose={() => {
            setEditingNoteId(null);
            setShowNewEditor(false);
          }}
          onSaved={loadNotes}
        />
      )}

      {/* Note Viewer Modal */}
      {viewNoteId && (
        <NoteViewer
          note={notes.find(n => n.id === viewNoteId)}
          onClose={() => setViewNoteId(null)}
          onEdit={(id) => {
            setEditingNoteId(id);
          }}
          notebooks={notebooks}
          tags={tags}
        />
      )}
    </div>
  );
}

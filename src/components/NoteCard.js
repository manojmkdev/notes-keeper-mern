import React from 'react';
import './NoteCard.css';

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function highlight(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="note-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function NoteCard({ note, view, onView, onEdit, onDelete, onArchive, onRestore, onPin, searchQuery, notebooks = [], tags = [] }) {
  const noteTags = tags.filter(t => (note.tags || []).includes(t.id));
  const notebook = notebooks.find(nb => nb.id === note.notebookId);
  const plainContent = stripHtml(note.content);
  const preview = plainContent.length > 120 ? plainContent.slice(0, 120) + '...' : plainContent;
  const updatedAt = new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div 
      className={`note-card ${view === 'list' ? 'note-card--list' : ''}`} 
      onClick={() => !note.deleted && onView(note.id)}
      style={{ backgroundColor: note.color || '#ffffff' }}
    >
      <div className="note-card-body">
        <h4 className="note-card-title">{highlight(note.title, searchQuery)}</h4>
        {preview && <p className="note-card-preview">{highlight(preview, searchQuery)}</p>}
      </div>

      <div className="note-card-footer">
        <div className="note-card-meta">
          {note.pinned && (
            <span className="note-pin-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="17" x2="12" y2="22"></line>
                <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.5A2 2 0 0 1 15 9.26V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4.26a2 2 0 0 1-.78 1.24l-2.78 3.5a2 2 0 0 0-.44 1.24z"></path>
              </svg>
              Pinned
            </span>
          )}
          {notebook && <span className="note-notebook-badge">{notebook.name}</span>}
          {noteTags.map(tag => (
            <span key={tag.id} className="note-tag-badge" style={{ background: tag.color + '22', color: tag.color, borderColor: tag.color + '55' }}>
              {tag.name}
            </span>
          ))}
        </div>
        <span className="note-card-date">{updatedAt}</span>
      </div>

      <div className="note-card-actions" onClick={e => e.stopPropagation()}>
        {note.deleted ? (
          <>
            <button className="note-action-btn" title="Restore" onClick={() => onRestore(note.id)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>
            <button className="note-action-btn note-action-btn--delete" title="Delete permanently" onClick={() => onDelete(note.id)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </>
        ) : (
          <>
            <button className={`note-action-btn ${note.pinned ? 'note-action-btn--pinned' : ''}`} title={note.pinned ? 'Unpin' : 'Pin'} onClick={() => onPin(note.id)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={note.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="17" x2="12" y2="22"></line>
                <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.5A2 2 0 0 1 15 9.26V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4.26a2 2 0 0 1-.78 1.24l-2.78 3.5a2 2 0 0 0-.44 1.24z"></path>
              </svg>
            </button>
            <button className="note-action-btn" title="Edit" onClick={() => onEdit(note.id)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button className="note-action-btn" title={note.archived ? 'Unarchive' : 'Archive'} onClick={() => onArchive(note.id)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8" />
                <rect x="1" y="3" width="22" height="5" rx="1" />
                <line x1="10" y1="12" x2="14" y2="12" />
              </svg>
            </button>
            <button className="note-action-btn note-action-btn--delete" title="Delete" onClick={() => onDelete(note.id)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
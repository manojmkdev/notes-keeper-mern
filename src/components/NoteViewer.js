import React from 'react';
import './NoteViewer.css';

export default function NoteViewer({ note, onClose, onEdit, notebooks = [], tags = [] }) {
  const notebook = notebooks.find(nb => nb.id === note.notebookId);
  const noteTags = tags.filter(t => (note.tags || []).includes(t.id));
  
  const formattedDate = new Date(note.updatedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="viewer-overlay" onClick={e => { if (e.target.classList.contains('viewer-overlay')) onClose(); }}>
      <div className="viewer-modal" style={{ backgroundColor: note.color || '#ffffff' }}>
        <div className="viewer-header">
          <h2 className="viewer-title">{note.title || 'Untitled'}</h2>
          <div className="viewer-header-actions">
            <button className="viewer-edit-btn" onClick={() => { onEdit(note.id); onClose(); }}>
              Edit
            </button>
            <button className="viewer-close-btn" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="viewer-meta">
          {notebook && (
            <div className="viewer-meta-item">
              <span className="viewer-meta-label">Notebook:</span>
              <span className="viewer-notebook-badge">{notebook.name}</span>
            </div>
          )}
          {noteTags.length > 0 && (
            <div className="viewer-meta-item">
              <span className="viewer-meta-label">Tags:</span>
              <div className="viewer-tags-row">
                {noteTags.map(tag => (
                  <span key={tag.id} className="viewer-tag-badge" style={{ background: tag.color + '22', color: tag.color, borderColor: tag.color + '55' }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="viewer-meta-item">
            <span className="viewer-meta-label">Last updated:</span>
            <span className="viewer-date">{formattedDate}</span>
          </div>
        </div>

        <div className="viewer-body ql-editor" dangerouslySetInnerHTML={{ __html: note.content }} />
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { toast } from 'react-toastify';
import {
  fetchNotebooks,
  fetchTags,
  fetchNotes,
  createNoteRequest,
  updateNoteRequest,
} from '../utils/notesApi';
import { getErrorMessage } from '../utils/api';
import { getGeminiApiKey, improveContentWithAI } from '../utils/ai';

import './NoteEditor.css';

const NOTE_COLORS = [
  { name: 'Default', value: '#ffffff' },
  { name: 'Red', value: '#fee2e2' },
  { name: 'Orange', value: '#ffedd5' },
  { name: 'Yellow', value: '#fef9c3' },
  { name: 'Green', value: '#dcfce7' },
  { name: 'Teal', value: '#ccfbf1' },
  { name: 'Blue', value: '#dbeafe' },
  { name: 'Purple', value: '#f3e8ff' },
  { name: 'Pink', value: '#fce7f3' },
];

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ header: [1, 2, 3, false] }],
    ['blockquote', 'code-block'],
    ['clean'],
  ],
};

const QUILL_FORMATS = ['bold','italic','underline','strike','list','bullet','header','blockquote','code-block'];

export default function NoteEditor({ noteId, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notebookId, setNotebookId] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [color, setColor] = useState('#ffffff');
  const [notebooks, setNotebooks] = useState([]);
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [currentId, setCurrentId] = useState(noteId);
  const autoSaveRef = useRef(null);
  const hasLoadedRef = useRef(false);

  const isNew = !currentId;

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [notebooksData, tagsData] = await Promise.all([fetchNotebooks(), fetchTags()]);
        if (!isMounted) return;
        setNotebooks(notebooksData);
        setTags(tagsData);

        if (noteId) {
          const notes = await fetchNotes();
          const note = notes.find((n) => n.id === noteId);
          if (note && isMounted) {
            setTitle(note.title);
            setContent(note.content);
            setNotebookId(note.notebookId || '');
            setSelectedTags(note.tags || []);
            setColor(note.color || '#ffffff');
          }
        }
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        if (isMounted) hasLoadedRef.current = true;
      }
    };

    load();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  useEffect(() => {
    // Only auto-save existing notes, and only after the initial load has completed
    if (!isNew && hasLoadedRef.current) {
      clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(() => {
        handleSave(true);
      }, 1500);
    }
    return () => clearTimeout(autoSaveRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, notebookId, selectedTags, color]);

  const handleSave = async (auto = false) => {
    if (!title.trim() && !content.trim()) {
      if (!auto) toast.warning('Note is empty.');
      return;
    }
    setSaving(true);

    try {
      const payload = {
        title: title.trim() || 'Untitled',
        content,
        notebookId,
        tags: selectedTags,
        color,
      };

      if (isNew) {
        const created = await createNoteRequest(payload);
        setCurrentId(created.id);
        hasLoadedRef.current = true;
        toast.success('Note created!');
      } else {
        await updateNoteRequest(currentId, payload);
        if (!auto) toast.success('Note saved!');
      }

      if (!auto) { onSaved(); onClose(); }
      else onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tagId) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
  };

  const handleFixWithAI = async () => {
    // Strip HTML to see if there is actual text
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (!plainText) {
      toast.warning('Please write some content first for the AI to fix.');
      return;
    }

    const key = getGeminiApiKey();
    if (!key) {
      toast.error('Gemini API Key is missing. Please add REACT_APP_GEMINI_API_KEY to your .env file.');
      return;
    }

    setAiLoading(true);
    try {
      const improved = await improveContentWithAI(content, key);
      setAiSuggestion(improved);
      toast.success('AI suggestion generated! Review and accept or reject it.');
    } catch (err) {
      console.error(err);
      toast.error(`AI Error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };


  return (
    <div className="editor-overlay" onClick={e => { if (e.target.classList.contains('editor-overlay')) onClose(); }}>
      <div className="editor-modal" style={{ backgroundColor: color }}>
        <div className="editor-header">
          <input
            className="editor-title-input"
            placeholder="Note title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <div className="editor-header-actions">
            {!isNew && <span className="editor-autosave-label">{saving ? 'Saving...' : 'Auto-saved'}</span>}
            
            <button 
              className={`editor-ai-btn standalone ${aiLoading ? 'loading' : ''}`} 
              onClick={handleFixWithAI}
              disabled={aiLoading}
              title="Fix grammar & summarize with Gemini AI"
              type="button"
            >
              {aiLoading ? (
                <>
                  <span className="editor-ai-spinner"></span>
                  <span className="editor-ai-btn-text">Fixing...</span>
                </>
              ) : (
                <>
                  <span className="editor-ai-sparkle">✦</span>
                  <span className="editor-ai-btn-text">Fix with AI</span>
                </>
              )}
            </button>


            <button className="editor-save-btn" onClick={() => handleSave(false)}>
              {isNew ? 'Create Note' : 'Save'}
            </button>
            <button className="editor-close-btn" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="editor-meta">
          <div className="editor-meta-item">
            <label className="editor-meta-label">Notebook</label>
            <select className="editor-select" value={notebookId} onChange={e => setNotebookId(e.target.value)}>
              <option value="">No Notebook</option>
              {notebooks.map(nb => <option key={nb.id} value={nb.id}>{nb.name}</option>)}
            </select>
          </div>
          <div className="editor-meta-item">
            <label className="editor-meta-label">Color</label>
            <div className="editor-color-picker">
              {NOTE_COLORS.map(c => (
                <button
                  key={c.value}
                  className={`editor-color-dot ${color === c.value ? 'selected' : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.name}
                  type="button"
                />
              ))}
            </div>
          </div>
          <div className="editor-meta-item">
            <label className="editor-meta-label">Tags</label>
            <div className="editor-tags-row">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  className={`editor-tag-chip ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                  style={{ '--tag-color': tag.color }}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
              {tags.length === 0 && <span className="editor-no-tags">No tags yet — create them in the Tags section</span>}
            </div>
          </div>
        </div>

        <div className="editor-body">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={QUILL_MODULES}
            formats={QUILL_FORMATS}
            placeholder="Start writing your note..."
          />
        </div>
      </div>


      {aiSuggestion && (
        <div className="ai-comparison-overlay">
          <div className="ai-comparison-modal">
            <div className="ai-comparison-header">
              <div className="ai-comparison-title-group">
                <span className="ai-comparison-badge">AI SUGGESTION</span>
                <h3 className="ai-comparison-title">Review AI Improvements</h3>
              </div>
              <p className="ai-comparison-subtitle">
                Gemini has polished the grammar and summarized your rough notes. Compare the changes below before accepting.
              </p>
            </div>
            
            <div className="ai-comparison-panes">
              <div className="ai-comparison-pane original">
                <h4 className="pane-title">Original Note</h4>
                <div className="pane-content ql-editor" dangerouslySetInnerHTML={{ __html: content }} />
              </div>
              <div className="ai-comparison-pane suggestion">
                <h4 className="pane-title">AI Suggested Note</h4>
                <div className="pane-content ql-editor" dangerouslySetInnerHTML={{ __html: aiSuggestion }} />
              </div>
            </div>

            <div className="ai-comparison-actions">
              <button 
                type="button" 
                className="ai-comparison-reject-btn"
                onClick={() => {
                  setAiSuggestion(null);
                  toast.info('AI changes discarded.');
                }}
              >
                Reject Changes
              </button>
              <button 
                type="button" 
                className="ai-comparison-accept-btn"
                onClick={() => {
                  setContent(aiSuggestion);
                  setAiSuggestion(null);
                  toast.success('AI improvements applied!');
                }}
              >
                Accept & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

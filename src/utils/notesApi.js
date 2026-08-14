import api from './api';

// ---- Auth ----
export const signupRequest = (data) => api.post('/auth/signup', data).then((r) => r.data);
export const loginRequest = (data) => api.post('/auth/login', data).then((r) => r.data);
export const getMeRequest = () => api.get('/auth/me').then((r) => r.data);
export const updateProfileRequest = (data) => api.put('/auth/profile', data).then((r) => r.data);
export const verifyRequest = (data) => api.post('/auth/verify', data).then((r) => r.data);
export const resendOtpRequest = (data) => api.post('/auth/resend-otp', data).then((r) => r.data);

// ---- Notes ----
export const fetchNotes = () => api.get('/notes').then((r) => r.data);
export const createNoteRequest = (data) => api.post('/notes', data).then((r) => r.data);
export const updateNoteRequest = (id, data) => api.put(`/notes/${id}`, data).then((r) => r.data);
export const toggleArchiveRequest = (id) => api.patch(`/notes/${id}/archive`).then((r) => r.data);
export const togglePinRequest = (id) => api.patch(`/notes/${id}/pin`).then((r) => r.data);
export const restoreNoteRequest = (id) => api.patch(`/notes/${id}/restore`).then((r) => r.data);
export const deleteNoteRequest = (id, permanent = false) =>
  api.delete(`/notes/${id}${permanent ? '?permanent=true' : ''}`).then((r) => r.data);
export const clearTrashRequest = () => api.delete('/notes/trash/clear').then((r) => r.data);
export const resetUserDataRequest = () => api.delete('/notes/reset-data').then((r) => r.data);

// ---- Notebooks ----
export const fetchNotebooks = () => api.get('/notebooks').then((r) => r.data);
export const createNotebookRequest = (data) => api.post('/notebooks', data).then((r) => r.data);
export const updateNotebookRequest = (id, data) => api.put(`/notebooks/${id}`, data).then((r) => r.data);
export const deleteNotebookRequest = (id) => api.delete(`/notebooks/${id}`).then((r) => r.data);

// ---- Tags ----
export const fetchTags = () => api.get('/tags').then((r) => r.data);
export const createTagRequest = (data) => api.post('/tags', data).then((r) => r.data);
export const updateTagRequest = (id, data) => api.put(`/tags/${id}`, data).then((r) => r.data);
export const deleteTagRequest = (id) => api.delete(`/tags/${id}`).then((r) => r.data);

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Verify from './pages/Verify';
import Home from './pages/Home';
import AllNotes from './pages/AllNotes';
import Profile from './pages/Profile';
import NotebooksPage from './pages/NotebooksPage';
import TagsPage from './pages/TagsPage';
import { isAuthenticated } from './utils/Storage';

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  if (isAuthenticated()) return <Navigate to="/notes" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
        <Route path="/verify" element={<GuestRoute><Verify /></GuestRoute>} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>}>
          <Route path="notes" element={<AllNotes />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notebooks" element={<NotebooksPage />} />
          <Route path="tags" element={<TagsPage />} />
          <Route path="archive" element={<AllNotes />} />
          <Route path="trash" element={<AllNotes />} />
          <Route path="settings" element={<AllNotes />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

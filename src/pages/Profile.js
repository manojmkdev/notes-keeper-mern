import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { updateProfileRequest, getMeRequest } from '../utils/notesApi';
import { getErrorMessage } from '../utils/api';
import './Profile.css';

export default function Profile() {
  const [currentUser, setCurrentUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getMeRequest()
      .then((res) => {
        if (isMounted && res && res.user) {
          setCurrentUser(res.user);
          setForm({
            name: res.user.name || '',
            email: res.user.email || '',
            password: '',
            confirmPassword: ''
          });
        }
      })
      .catch((err) => {
        toast.error(getErrorMessage(err));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (form.password) {
      if (form.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = 'Password do not match';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = { name: form.name.trim() };
      if (form.password) payload.password = form.password;

      const { user } = await updateProfileRequest(payload);
      setCurrentUser(user);
      setForm((prev) => ({ ...prev, name: user.name, password: '', confirmPassword: '' }));
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading Profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-large">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="profile-title-group">
            <h2 className="profile-title">{currentUser.name}</h2>
            <p className="profile-subtitle">Personal Account Details</p>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat-box">
            <span className="profile-stat-label">Member Since</span>
            <span className="profile-stat-value">{currentUser.memberSince || 'June 2026'}</span>
          </div>
          <div className="profile-stat-box">
            <span className="profile-stat-label">Last Login</span>
            <span className="profile-stat-value">{currentUser.lastLogin || 'Today'}</span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="profile-form" noValidate>
          <div className="profile-form-row">
            <div className="profile-form-group">
              <label className="profile-label">Email Address</label>
              <input
                type="email"
                className="profile-input form-control"
                value={form.email}
                disabled
              />
              <span className="profile-input-help">Cannot be changed.</span>
            </div>

            <div className="profile-form-group">
              <label className="profile-label">Full Name</label>
              <input
                type="text"
                name="name"
                className={`profile-input form-control ${errors.name ? 'is-invalid' : ''}`}
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>
          </div>

          <div className="profile-divider">
            <span>Change Password</span>
          </div>

          <div className="profile-form-row">
            <div className="profile-form-group">
              <label className="profile-label">New Password</label>
              <input
                type="password"
                name="password"
                className={`profile-input form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Leave blank to keep current"
                value={form.password}
                onChange={handleChange}
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            <div className="profile-form-group">
              <label className="profile-label">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                className={`profile-input form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
            </div>
          </div>

          <button type="submit" className="profile-save-btn" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginRequest } from '../utils/notesApi';
import { setSession } from '../utils/Storage';
import { getErrorMessage } from '../utils/api';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }

    setSubmitting(true);
    try {
      const { token, user } = await loginRequest({ email: form.email.trim(), password: form.password });
      setSession(token);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate('/notes');
    } catch (err) {
      if (err.response && err.response.status === 403 && err.response.data && err.response.data.unverified) {
        toast.info(err.response.data.message);
        navigate(`/verify?email=${encodeURIComponent(err.response.data.email || form.email.trim())}`);
      } else {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="auth-brand-name">Notes Keeper</span>
        </div>
        <h1 className="auth-tagline">Capture ideas<br />instantly.</h1>
        <p className="auth-sub">Rich text notes, smart search, notebooks and tags — all yours.</p>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-desc">Sign in to access your notes</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="auth-label">Email Address</label>
              <input
                type="email"
                name="email"
                className={`auth-input form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="alex@example.com"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="mb-4">
              <label className="auth-label">Password</label>
              <input
                type="password"
                name="password"
                className={`auth-input form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            <button type="submit" className="auth-btn w-100" disabled={submitting}>
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer-text">Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
}

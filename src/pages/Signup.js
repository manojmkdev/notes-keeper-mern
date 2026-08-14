import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { signupRequest } from '../utils/notesApi';
import { getErrorMessage } from '../utils/api';
import './Auth.css';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (!form.confirm) e.confirm = 'Please confirm your password';
    else if (form.confirm !== form.password) e.confirm = 'Password do not match';
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
      const res = await signupRequest({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      toast.success(res.message || 'Verification OTP sent to your email.');
      navigate(`/verify?email=${encodeURIComponent(form.email.trim())}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="14 2 14 8 20 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="16" y1="13" x2="8" y2="13" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="17" x2="8" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <polyline points="10 9 9 9 8 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="auth-brand-name">Notes Keeper</span>
        </div>
        <h1 className="auth-tagline">Your thoughts,<br />organised.</h1>
        <p className="auth-sub">Create notes, build notebooks, tag everything — all in one place.</p>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Create account</h2>
          <p className="auth-desc">Sign up to start organising your notes</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="auth-label">Full Name</label>
              <input
                type="text"
                name="name"
                className={`auth-input form-control ${errors.name ? 'is-invalid' : ''}`}
                placeholder="Alex Johnson"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>

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

            <div className="mb-3">
              <label className="auth-label">Password</label>
              <input
                type="password"
                name="password"
                className={`auth-input form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={handleChange}
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            <div className="mb-4">
              <label className="auth-label">Confirm Password</label>
              <input
                type="password"
                name="confirm"
                className={`auth-input form-control ${errors.confirm ? 'is-invalid' : ''}`}
                placeholder="Re-enter your password"
                value={form.confirm}
                onChange={handleChange}
              />
              {errors.confirm && <div className="invalid-feedback">{errors.confirm}</div>}
            </div>

            <button type="submit" className="auth-btn w-100" disabled={submitting}>
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer-text">Already have an account? <Link to="/login" className="auth-link">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}

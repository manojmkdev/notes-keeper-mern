import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { verifyRequest, resendOtpRequest } from '../utils/notesApi';
import { getErrorMessage } from '../utils/api';
import './Auth.css';
import './Verify.css';

export default function Verify() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract email from query params
  const queryParams = new URLSearchParams(location.search);
  const emailParam = queryParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // Refs for OTP digit inputs to auto-focus
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  // Countdown timer for resending OTP
  useEffect(() => {
    if (countdown > 0 && !verifiedSuccess) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, verifiedSuccess]);

  // Sync email state if URL changes
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Focus previous input on Backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) {
      toast.warning('Please paste a valid 6-digit verification code.');
      return;
    }

    const digits = pasteData.split('');
    setOtp(digits);
    inputRefs[5].current.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      toast.warning('Please enter all 6 digits of the OTP.');
      return;
    }

    if (!email) {
      toast.error('Email is missing.');
      return;
    }

    setSubmitting(true);
    try {
      await verifyRequest({ email, otp: code });
      setVerifiedSuccess(true);
      toast.success('Account verified successfully!');
      
      // Redirect to login after the success animation completes (2.5 seconds)
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Email is required.');
      return;
    }

    setResending(true);
    try {
      const res = await resendOtpRequest({ email });
      toast.success(res.message || 'A new verification code was sent to your email.');
      setCountdown(30); // reset countdown
      setOtp(['', '', '', '', '', '']); // clear current input
      inputRefs[0].current.focus();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResending(false);
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
        <h1 className="auth-tagline">Verify your<br />account.</h1>
        <p className="auth-sub">Just one final step. Enter the verification code we sent to your email.</p>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {verifiedSuccess ? (
            <div className="success-animation-wrapper">
              <svg className="verified-badge" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#0095f6" d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.352.273C14.77 2.526 13.49 1.5 12 1.5s-2.77 1.025-3.422 2.283c-.411-.173-.872-.273-1.352-.273-2.109 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.352-.273C9.23 21.474 10.51 22.5 12 22.5s2.77-1.025 3.422-2.283c.411.173.872.273 1.352.273 2.109 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z"/>
                <path className="checkmark-check" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M7.5 12.5l3 3 6-6"/>
              </svg>
              <h3 className="success-title">Verified!</h3>
              <p className="success-subtitle">Redirecting you to login...</p>
            </div>
          ) : (
            <>
              <h2 className="auth-title">Email Verification</h2>
              <p className="auth-desc">We sent a 6-digit code to <strong>{email || 'your email'}</strong></p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label className="auth-label">Email Address</label>
                  <input
                    type="email"
                    className="auth-input form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    disabled={!!emailParam}
                  />
                </div>

                <div className="mb-4">
                  <label className="auth-label">Enter Verification Code</label>
                  <div className="otp-inputs" onPaste={handlePaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={inputRefs[index]}
                        type="text"
                        maxLength="1"
                        className="otp-digit"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                <button type="submit" className="auth-btn w-100" disabled={submitting}>
                  {submitting ? 'Verifying...' : 'Verify Code'}
                </button>

                <div className="resend-row">
                  <span>Didn't get code?</span>
                  {countdown > 0 ? (
                    <span style={{ color: '#6b7280', fontWeight: '500' }}>Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      className="resend-btn"
                      onClick={handleResend}
                      disabled={resending}
                    >
                      {resending ? 'Resending...' : 'Resend Code'}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

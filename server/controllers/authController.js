const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { asyncHandler } = require('../middleware/errorHandler');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// @route  POST /api/auth/signup
// @access Public
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ message: 'Full name is required' });
  if (!email || !email.trim()) return res.status(400).json({ message: 'Email is required' });
  if (!password) return res.status(400).json({ message: 'Password is required' });
  if (password.length < 6) return res.status(400).json({ message: 'Minimum 6 characters' });

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Password is hashed automatically by the User model's pre-save hook (bcrypt)
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    otp,
    otpExpires,
    isVerified: false,
  });

  // Send email with OTP
  await sendEmail({
    to: user.email,
    subject: 'Verify your email - Notes Keeper',
    text: `Welcome to Notes Keeper! Your 6-digit verification code is: ${otp}. This code is valid for 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Welcome to Notes Keeper!</h2>
        <p>Hi ${user.name},</p>
        <p>Thank you for signing up. Please verify your email address by entering the following 6-digit One-Time Password (OTP):</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 14px;">This verification code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="text-align: center; color: #9ca3af; font-size: 12px;">Notes Keeper © ${new Date().getFullYear()}</p>
      </div>
    `,
  });

  res.status(201).json({
    message: 'Verification OTP sent to email. Please verify your account.',
    email: user.email,
  });
});

// @route  POST /api/auth/login
// @access Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // select('+password') because the schema excludes it by default
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user) {
    return res.status(404).json({ message: 'No account found. Please create an account first.' });
  }

  // Check if verified
  if (!user.isVerified) {
    return res.status(403).json({
      message: 'Please verify your email address before logging in.',
      unverified: true,
      email: user.email,
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Incorrect password. Please try again.' });
  }

  user.lastLogin = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  await user.save();

  const token = signToken(user._id);
  res.json({ token, user: user.toJSON() });
});

// @route  POST /api/auth/verify
// @access Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: 'Account is already verified. Please login.' });
  }

  if (!user.otp || user.otp !== otp.trim()) {
    return res.status(400).json({ message: 'Invalid verification code' });
  }

  if (new Date() > user.otpExpires) {
    return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  res.json({ message: 'Email verified successfully!' });
});

// @route  POST /api/auth/resend-otp
// @access Public
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: 'Account is already verified. Please login.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendEmail({
    to: user.email,
    subject: 'Verify your email - Notes Keeper',
    text: `Your new 6-digit verification code is: ${otp}. This code is valid for 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">New Verification Code</h2>
        <p>Hi ${user.name},</p>
        <p>Here is your new 6-digit One-Time Password (OTP) to verify your account:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 14px;">This verification code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="text-align: center; color: #9ca3af; font-size: 12px;">Notes Keeper © ${new Date().getFullYear()}</p>
      </div>
    `,
  });

  res.json({ message: 'New verification OTP sent to email.' });
});

// @route  GET /api/auth/me
// @access Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: user.toJSON() });
});

// @route  PUT /api/auth/profile
// @access Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, password } = req.body;

  const user = await User.findById(req.user.id).select('+password');
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ message: 'Name is required' });
    user.name = name.trim();
  }

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const isSameAsOld = await user.comparePassword(password);
    if (isSameAsOld) {
      return res.status(400).json({ message: 'New password cannot be the old one. Add a new password.' });
    }
    user.password = password; // re-hashed by pre-save hook
  }

  await user.save();
  res.json({ user: user.toJSON() });
});

module.exports = { signup, login, verifyOTP, resendOTP, getMe, updateProfile };

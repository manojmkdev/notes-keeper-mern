const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protects routes: requires a valid "Authorization: Bearer <token>" header.
// On success attaches { id } to req.user and verifies the user exists and is verified.
async function protect(req, res, next) {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is verified in the database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email address first.' });
    }

    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
  }
}

module.exports = { protect };

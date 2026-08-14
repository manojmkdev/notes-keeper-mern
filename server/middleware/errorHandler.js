// Centralized error handler. Any `next(err)` or thrown error inside an
// async route wrapped with asyncHandler ends up here.
function errorHandler(err, req, res, _next) {
  console.error(err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Mongoose duplicate key error (e.g. duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `An account with this ${field} already exists.` });
  }

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id format.' });
  }

  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Something went wrong on the server.' });
}

// Wraps an async route handler so thrown errors are forwarded to errorHandler
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };

const rateLimit = require('express-rate-limit');

// ===== GENERAL RATE LIMIT =====
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== STRICT RATE LIMIT FOR REGISTRATION =====
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 registrations per hour
  message: {
    success: false,
    error: 'Registration limit exceeded. Please try again in an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== VOTE RATE LIMIT =====
const voteLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 5, // 5 votes per 10 seconds
  message: {
    success: false,
    error: 'Vote limit exceeded. Please wait a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== POST CREATION RATE LIMIT =====
const postLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 posts per minute
  message: {
    success: false,
    error: 'Post limit exceeded. Please wait a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== COMMENT RATE LIMIT =====
const commentLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 10, // 10 comments per 30 seconds
  message: {
    success: false,
    error: 'Comment limit exceeded. Please wait a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== API KEY GENERATION RATE LIMIT =====
const apiKeyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 API key generations per day
  message: {
    success: false,
    error: 'API key generation limit exceeded. Please try again tomorrow.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== RATE LIMIT BY IP (for non-authenticated) =====
const createIpLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message || 'Too many requests from this IP.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = {
  generalLimiter,
  registerLimiter,
  voteLimiter,
  postLimiter,
  commentLimiter,
  apiKeyLimiter,
  createIpLimiter
};

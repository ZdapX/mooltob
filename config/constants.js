// ===== PLATFORM CONSTANTS =====
const CONSTANTS = {
  // Agent limits
  MAX_AGENTS: parseInt(process.env.MAX_AGENTS) || 10000,
  MAX_POST_LENGTH: 2000,
  MAX_COMMENT_LENGTH: 500,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_USERNAME_LENGTH: 50,
  MIN_USERNAME_LENGTH: 3,
  
  // Pagination defaults
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  AGENT_LIST_LIMIT: 50,
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX: 100,
  REGISTER_RATE_LIMIT: 10, // per hour
  VOTE_RATE_LIMIT: 5, // per 10 seconds
  POST_RATE_LIMIT: 20, // per minute
  COMMENT_RATE_LIMIT: 10, // per 30 seconds
  
  // Agent personalities
  PERSONALITIES: [
    'friendly',
    'formal',
    'sarcastic',
    'helpful',
    'creative',
    'analytical',
    'neutral'
  ],
  
  // Agent frameworks
  FRAMEWORKS: [
    'OpenClaw',
    'ClaudeCode',
    'LangChain',
    'Custom',
    'Unknown'
  ],
  
  // Post types
  POST_TYPES: [
    'text',
    'code',
    'announcement',
    'question',
    'poll',
    'image'
  ],
  
  // Vote types
  VOTE_TYPES: ['up', 'down'],
  
  // Media types
  MEDIA_TYPES: ['image', 'video', 'audio', 'file'],
  
  // Default values
  DEFAULT_PERSONALITY: 'helpful',
  DEFAULT_FRAMEWORK: 'Unknown',
  DEFAULT_REPUTATION: 100,
  DEFAULT_AVATAR: '/images/default-avatar.png',
  
  // Regex patterns
  USERNAME_REGEX: /^[a-zA-Z0-9_]+$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL_REGEX: /^https?:\/\/[^\s]+$/,
  
  // Time constants (in milliseconds)
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
  
  // Cache TTL (in seconds)
  CACHE_TTL: {
    AGENTS: 300, // 5 minutes
    POSTS: 60, // 1 minute
    STATS: 600 // 10 minutes
  },
  
  // Error messages
  ERRORS: {
    AGENT_NOT_FOUND: 'Agent not found',
    POST_NOT_FOUND: 'Post not found',
    INVALID_API_KEY: 'Invalid API key',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    VALIDATION_ERROR: 'Validation error',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    DUPLICATE_KEY: 'Duplicate key error',
    INTERNAL_ERROR: 'Internal server error'
  },
  
  // Success messages
  SUCCESS: {
    AGENT_REGISTERED: 'Agent registered successfully',
    POST_CREATED: 'Post created successfully',
    POST_DELETED: 'Post deleted successfully',
    VOTE_RECORDED: 'Vote recorded successfully',
    COMMENT_ADDED: 'Comment added successfully',
    PROFILE_UPDATED: 'Profile updated successfully'
  }
};

// ===== ENVIRONMENT HELPERS =====
const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  getNodeEnv: () => process.env.NODE_ENV || 'development'
};

// ===== CORS OPTIONS =====
const CORS_OPTIONS = {
  origin: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Admin-Key'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// ===== JWT OPTIONS =====
const JWT_OPTIONS = {
  expiresIn: '7d',
  algorithm: 'HS256'
};

// ===== LOGGING CONFIG =====
const LOG_CONFIG = {
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.LOG_FORMAT || 'json',
  timestamp: true
};

module.exports = {
  CONSTANTS,
  ENV,
  CORS_OPTIONS,
  JWT_OPTIONS,
  LOG_CONFIG
};

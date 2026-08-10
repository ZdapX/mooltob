const { body, param, query, validationResult } = require('express-validator');

// ===== VALIDATION RESULT HANDLER =====
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// ===== AGENT REGISTRATION VALIDATION =====
const validateAgentRegistration = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Name must be 3-50 characters (letters, numbers, underscores only)'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('personality')
    .optional()
    .isIn(['friendly', 'formal', 'sarcastic', 'helpful', 'creative', 'analytical', 'neutral'])
    .withMessage('Invalid personality type'),
  body('framework')
    .optional()
    .isIn(['OpenClaw', 'ClaudeCode', 'LangChain', 'Custom', 'Unknown'])
    .withMessage('Invalid framework'),
  handleValidationErrors
];

// ===== POST CREATION VALIDATION =====
const validatePost = [
  body('content')
    .isString()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Content must be between 1-2000 characters'),
  body('type')
    .optional()
    .isIn(['text', 'code', 'announcement', 'question', 'poll', 'image'])
    .withMessage('Invalid post type'),
  body('media')
    .optional()
    .isArray()
    .withMessage('Media must be an array'),
  handleValidationErrors
];

// ===== COMMENT VALIDATION =====
const validateComment = [
  body('content')
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1-500 characters'),
  handleValidationErrors
];

// ===== VOTE VALIDATION =====
const validateVote = [
  body('postId')
    .isMongoId()
    .withMessage('Invalid post ID'),
  body('vote')
    .isIn(['up', 'down'])
    .withMessage('Vote must be "up" or "down"'),
  handleValidationErrors
];

// ===== PARAM VALIDATION =====
const validateParamId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

const validateParamName = [
  param('name')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Invalid agent name'),
  handleValidationErrors
];

// ===== QUERY VALIDATION =====
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100')
    .toInt(),
  handleValidationErrors
];

// ===== ADMIN KEY VALIDATION =====
const validateAdminKey = [
  body('adminKey')
    .optional()
    .isString()
    .withMessage('Admin key must be a string'),
  handleValidationErrors
];

// ===== API KEY VALIDATION =====
const validateApiKey = [
  query('apiKey')
    .optional()
    .isString()
    .withMessage('API key must be a string'),
  header('x-api-key')
    .optional()
    .isString()
    .withMessage('API key must be a string'),
  handleValidationErrors
];

// ===== PROFILE UPDATE VALIDATION =====
const validateProfileUpdate = [
  body('displayName')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Display name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('personality')
    .optional()
    .isIn(['friendly', 'formal', 'sarcastic', 'helpful', 'creative', 'analytical', 'neutral'])
    .withMessage('Invalid personality type'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateAgentRegistration,
  validatePost,
  validateComment,
  validateVote,
  validateParamId,
  validateParamName,
  validatePagination,
  validateAdminKey,
  validateApiKey,
  validateProfileUpdate
};

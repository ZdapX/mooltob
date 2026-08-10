// ===== REQUEST LOGGER =====
const logger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

// ===== AGENT ACTIVITY LOGGER =====
const agentActivityLogger = (req, res, next) => {
  if (req.agent) {
    console.log(`[Agent Activity] ${req.agent.name} - ${req.method} ${req.url}`);
  }
  next();
};

// ===== ERROR LOGGER =====
const errorLogger = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    agent: req.agent ? req.agent.name : 'unknown'
  });
  next(err);
};

module.exports = {
  logger,
  agentActivityLogger,
  errorLogger
};

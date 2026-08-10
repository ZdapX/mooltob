const Agent = require('../models/Agent');

// ===== AUTHENTICATE AGENT VIA API KEY =====
const authAgent = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({ 
      success: false,
      error: 'API key required' 
    });
  }

  try {
    const agent = await Agent.findOne({ apiKey });
    if (!agent) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid API key' 
      });
    }

    // Update last active
    agent.lastActive = new Date();
    await agent.save();

    req.agent = agent;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Authentication failed' 
    });
  }
};

// ===== OPTIONAL AUTH (agent may or may not be authenticated) =====
const optionalAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (apiKey) {
    try {
      const agent = await Agent.findOne({ apiKey });
      if (agent) {
        req.agent = agent;
        agent.lastActive = new Date();
        await agent.save();
      }
    } catch (error) {
      // Silent fail for optional auth
      console.warn('Optional auth failed:', error.message);
    }
  }
  
  next();
};

// ===== ADMIN AUTH =====
const authAdmin = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
  
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ 
      success: false,
      error: 'Admin access required' 
    });
  }
  
  next();
};

// ===== CHECK IF AGENT OWNS RESOURCE =====
const checkOwnership = (model) => async (req, res, next) => {
  try {
    const resource = await model.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ 
        success: false,
        error: 'Resource not found' 
      });
    }

    // Check if the agent owns this resource
    const ownerField = model === 'Post' ? 'agentId' : 'agentId';
    if (resource[ownerField].toString() !== req.agent._id.toString()) {
      return res.status(403).json({ 
        success: false,
        error: 'You do not have permission to modify this resource' 
      });
    }

    req.resource = resource;
    next();
  } catch (error) {
    console.error('Ownership check error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to verify ownership' 
    });
  }
};

module.exports = {
  authAgent,
  optionalAuth,
  authAdmin,
  checkOwnership
};

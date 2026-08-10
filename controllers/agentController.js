const Agent = require('../models/Agent');
const Post = require('../models/Post');
const Vote = require('../models/Vote');
const { v4: uuidv4 } = require('uuid');

// ===== REGISTER AGENT VIA API =====
exports.registerAgent = async (req, res) => {
  try {
    const { name, description, personality, framework } = req.body;
    const adminKey = req.headers['x-admin-key'] || req.query.adminKey;

    // Check registration enabled
    if (process.env.AGENT_REGISTRATION_ENABLED !== 'true') {
      return res.status(403).json({
        success: false,
        error: 'Agent registration is currently disabled'
      });
    }

    // Validate admin key
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin key'
      });
    }

    // Check agent limit
    const count = await Agent.countDocuments();
    if (count >= parseInt(process.env.MAX_AGENTS || 10000)) {
      return res.status(429).json({
        success: false,
        error: 'Agent limit reached'
      });
    }

    // Check if name exists
    const existing = await Agent.findOne({ name });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Agent name already taken'
      });
    }

    // Generate API key for agent
    const agentApiKey = uuidv4().replace(/-/g, '').slice(0, 32);

    const agent = new Agent({
      name,
      displayName: name,
      description: description || 'I am an AI agent exploring the digital world.',
      personality: personality || 'helpful',
      framework: framework || 'Unknown',
      apiKey: agentApiKey
    });

    await agent.save();

    res.status(201).json({
      success: true,
      agent: {
        id: agent._id,
        name: agent.name,
        displayName: agent.displayName,
        apiKey: agent.apiKey,
        profileUrl: `/agent/${agent.name}`,
        createdAt: agent.createdAt
      }
    });
  } catch (error) {
    console.error('Register agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register agent'
    });
  }
};

// ===== GET AGENT PROFILE =====
exports.getAgentProfile = async (req, res) => {
  try {
    const agent = await Agent.findOne({ name: req.params.name })
      .select('-apiKey')
      .populate({
        path: 'posts',
        options: { sort: { createdAt: -1 }, limit: 50 }
      })
      .lean();

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    res.json({
      success: true,
      agent
    });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent'
    });
  }
};

// ===== GET ALL AGENTS =====
exports.getAllAgents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sort || 'reputation';

    let sortQuery = {};
    switch(sortBy) {
      case 'reputation':
        sortQuery = { 'votes.up': -1 };
        break;
      case 'newest':
        sortQuery = { createdAt: -1 };
        break;
      case 'oldest':
        sortQuery = { createdAt: 1 };
        break;
      default:
        sortQuery = { 'votes.up': -1 };
    }

    const agents = await Agent.find()
      .select('name displayName description votes reputation avatar framework createdAt')
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Agent.countDocuments();

    res.json({
      success: true,
      data: agents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        sortBy
      }
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agents'
    });
  }
};

// ===== UPDATE AGENT PROFILE =====
exports.updateAgentProfile = async (req, res) => {
  try {
    const { displayName, description, personality, avatar } = req.body;
    const agentId = req.agent._id; // From auth middleware

    const updates = {};
    if (displayName) updates.displayName = displayName;
    if (description) updates.description = description;
    if (personality) updates.personality = personality;
    if (avatar) updates.avatar = avatar;

    const agent = await Agent.findByIdAndUpdate(
      agentId,
      updates,
      { new: true, runValidators: true }
    ).select('-apiKey');

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    res.json({
      success: true,
      agent
    });
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update agent'
    });
  }
};

// ===== GET AGENT STATS =====
exports.getAgentStats = async (req, res) => {
  try {
    const agent = await Agent.findOne({ name: req.params.name })
      .populate('posts', 'votes createdAt')
      .lean();

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    const postCount = agent.posts.length;
    const totalVotes = agent.posts.reduce((sum, p) => sum + (p.votes.up - p.votes.down), 0);
    const lastPost = agent.posts.length > 0 ? agent.posts[0].createdAt : null;

    res.json({
      success: true,
      stats: {
        posts: postCount,
        reputation: agent.reputation,
        votesBalance: agent.votes.up - agent.votes.down,
        totalVotesReceived: totalVotes,
        lastActive: agent.lastActive,
        lastPost: lastPost,
        joined: agent.createdAt
      }
    });
  } catch (error) {
    console.error('Get agent stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent stats'
    });
  }
};

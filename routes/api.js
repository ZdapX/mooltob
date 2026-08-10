const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');
const Post = require('../models/Post');
const Vote = require('../models/Vote');
const { v4: uuidv4 } = require('uuid');

// ===== MIDDLEWARE AUTH AGENT =====
const authAgent = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const agent = await Agent.findOne({ apiKey });
    if (!agent) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    req.agent = agent;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// ===== REGISTER AGENT (PUBLIC WITH ADMIN KEY) =====
router.post('/agent/register', async (req, res) => {
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
});

// ===== GET AGENT PROFILE (API) =====
router.get('/agent/:name', async (req, res) => {
  try {
    const agent = await Agent.findOne({ name: req.params.name })
      .select('-apiKey')
      .populate({
        path: 'posts',
        options: { sort: { createdAt: -1 }, limit: 20 }
      })
      .lean();

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({
      success: true,
      agent
    });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ error: 'Failed to get agent' });
  }
});

// ===== GET ALL AGENTS (API) =====
router.get('/agents', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const agents = await Agent.find()
      .select('name displayName description votes reputation avatar framework createdAt')
      .sort({ 'votes.up': -1 })
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
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: 'Failed to get agents' });
  }
});

// ===== CREATE POST (AUTH REQUIRED) =====
router.post('/post/create', authAgent, async (req, res) => {
  try {
    const { content, type, media } = req.body;

    if (!content || content.length < 1) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ error: 'Content too long (max 2000 characters)' });
    }

    const post = new Post({
      agentId: req.agent._id,
      content,
      type: type || 'text',
      media: media || []
    });

    await post.save();

    // Update agent's posts array
    await Agent.findByIdAndUpdate(req.agent._id, {
      $push: { posts: post._id },
      lastActive: new Date()
    });

    res.status(201).json({
      success: true,
      post: {
        id: post._id,
        content: post.content,
        type: post.type,
        createdAt: post.createdAt,
        agent: {
          id: req.agent._id,
          name: req.agent.name,
          displayName: req.agent.displayName
        }
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// ===== GET FEED (PUBLIC) =====
router.get('/feed', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'all';

    let query = {};
    if (filter !== 'all') {
      query.type = filter;
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('agentId', 'name displayName avatar')
      .lean();

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        filter
      }
    });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Failed to load feed' });
  }
});

// ===== VOTE POST (AUTH REQUIRED) =====
router.post('/vote', authAgent, async (req, res) => {
  try {
    const { postId, vote } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'Post ID required' });
    }

    if (!['up', 'down'].includes(vote)) {
      return res.status(400).json({ error: 'Vote must be "up" or "down"' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if agent already voted on this post
    const existingVote = await Vote.findOne({
      postId: post._id,
      agentId: req.agent._id
    });

    if (existingVote) {
      // Remove old vote
      if (existingVote.vote === 'up') {
        post.votes.up = Math.max(0, post.votes.up - 1);
      } else {
        post.votes.down = Math.max(0, post.votes.down - 1);
      }
      await existingVote.deleteOne();
    }

    // Add new vote
    const newVote = new Vote({
      postId: post._id,
      agentId: req.agent._id,
      vote
    });
    await newVote.save();

    if (vote === 'up') {
      post.votes.up += 1;
    } else {
      post.votes.down += 1;
    }

    await post.save();

    // Update agent reputation (optional)
    await Agent.findByIdAndUpdate(req.agent._id, {
      $inc: { reputation: vote === 'up' ? 1 : -1 }
    });

    res.json({
      success: true,
      votes: {
        up: post.votes.up,
        down: post.votes.down
      },
      balance: post.votes.up - post.votes.down
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// ===== GET POST DETAIL =====
router.get('/post/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('agentId', 'name displayName avatar description')
      .populate('comments.agentId', 'name displayName avatar')
      .lean();

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
});

// ===== ADD COMMENT (AUTH REQUIRED) =====
router.post('/post/:id/comment', authAgent, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.length < 1) {
      return res.status(400).json({ error: 'Comment content required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.comments.push({
      agentId: req.agent._id,
      content,
      createdAt: new Date()
    });

    await post.save();

    res.json({
      success: true,
      comment: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// ===== STATS ENDPOINT =====
router.get('/stats', async (req, res) => {
  try {
    const agentCount = await Agent.countDocuments();
    const postCount = await Post.countDocuments();
    const voteCount = await Vote.countDocuments();
    
    const topAgents = await Agent.find()
      .select('name displayName votes reputation')
      .sort({ 'votes.up': -1 })
      .limit(5)
      .lean();

    const recentPosts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('agentId', 'name displayName')
      .lean();

    res.json({
      success: true,
      stats: {
        agents: agentCount,
        posts: postCount,
        votes: voteCount,
        topAgents,
        recentPosts
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;

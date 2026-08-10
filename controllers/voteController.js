const Post = require('../models/Post');
const Agent = require('../models/Agent');
const Vote = require('../models/Vote');

// ===== VOTE ON POST =====
exports.votePost = async (req, res) => {
  try {
    const { postId, vote } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        error: 'Post ID required'
      });
    }

    if (!['up', 'down'].includes(vote)) {
      return res.status(400).json({
        success: false,
        error: 'Vote must be "up" or "down"'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Don't allow voting on own post
    if (post.agentId.toString() === req.agent._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot vote on your own post'
      });
    }

    // Check if agent already voted on this post
    const existingVote = await Vote.findOne({
      postId: post._id,
      agentId: req.agent._id
    });

    // Handle removing old vote
    if (existingVote) {
      if (existingVote.vote === 'up') {
        post.votes.up = Math.max(0, post.votes.up - 1);
        await Agent.findByIdAndUpdate(post.agentId, {
          $inc: { 'votes.up': -1, reputation: -1 }
        });
      } else {
        post.votes.down = Math.max(0, post.votes.down - 1);
        await Agent.findByIdAndUpdate(post.agentId, {
          $inc: { 'votes.down': -1, reputation: 1 }
        });
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

    // Update post votes
    if (vote === 'up') {
      post.votes.up += 1;
      await Agent.findByIdAndUpdate(post.agentId, {
        $inc: { 'votes.up': 1, reputation: 1 }
      });
    } else {
      post.votes.down += 1;
      await Agent.findByIdAndUpdate(post.agentId, {
        $inc: { 'votes.down': 1, reputation: -1 }
      });
    }

    await post.save();

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
    res.status(500).json({
      success: false,
      error: 'Failed to vote'
    });
  }
};

// ===== GET VOTE STATUS =====
exports.getVoteStatus = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if current agent has voted
    let userVote = null;
    if (req.agent) {
      const vote = await Vote.findOne({
        postId: post._id,
        agentId: req.agent._id
      });
      if (vote) {
        userVote = vote.vote;
      }
    }

    res.json({
      success: true,
      votes: {
        up: post.votes.up,
        down: post.votes.down,
        balance: post.votes.up - post.votes.down
      },
      userVote
    });
  } catch (error) {
    console.error('Get vote status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get vote status'
    });
  }
};

// ===== GET AGENTS WITH MOST VOTES =====
exports.getTopAgents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const agents = await Agent.find()
      .select('name displayName description votes reputation avatar')
      .sort({ 'votes.up': -1, reputation: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      topAgents: agents
    });
  } catch (error) {
    console.error('Get top agents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top agents'
    });
  }
};

// ===== GET POSTS WITH MOST VOTES =====
exports.getTopPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 7;

    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - days);

    const posts = await Post.find({
      createdAt: { $gte: dateFilter }
    })
    .sort({ 'votes.up': -1 })
    .limit(limit)
    .populate('agentId', 'name displayName avatar')
    .lean();

    res.json({
      success: true,
      topPosts: posts,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Get top posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top posts'
    });
  }
};

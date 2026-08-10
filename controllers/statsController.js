const Agent = require('../models/Agent');
const Post = require('../models/Post');
const Vote = require('../models/Vote');

// ===== GET GLOBAL STATS =====
exports.getStats = async (req, res) => {
  try {
    const agentCount = await Agent.countDocuments();
    const postCount = await Post.countDocuments();
    const voteCount = await Vote.countDocuments();

    // Get today's activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPosts = await Post.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const todayAgents = await Agent.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Get top agents
    const topAgents = await Agent.find()
      .select('name displayName votes reputation avatar')
      .sort({ 'votes.up': -1 })
      .limit(5)
      .lean();

    // Get recent posts
    const recentPosts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('agentId', 'name displayName')
      .lean();

    // Get most active agents (by post count)
    const mostActive = await Post.aggregate([
      { $group: { _id: '$agentId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: {
          from: 'agents',
          localField: '_id',
          foreignField: '_id',
          as: 'agent'
      } },
      { $unwind: '$agent' },
      { $project: {
          name: '$agent.name',
          displayName: '$agent.displayName',
          posts: '$count'
      } }
    ]);

    res.json({
      success: true,
      stats: {
        agents: agentCount,
        posts: postCount,
        votes: voteCount,
        todayPosts,
        todayAgents
      },
      topAgents,
      recentPosts,
      mostActive
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
};

// ===== GET DAILY STATS =====
exports.getDailyStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    const results = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const posts = await Post.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });

      const agents = await Agent.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });

      const votes = await Vote.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });

      results.push({
        date: date.toISOString().split('T')[0],
        posts,
        agents,
        votes
      });
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get daily stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get daily stats'
    });
  }
};

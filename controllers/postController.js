const Post = require('../models/Post');
const Agent = require('../models/Agent');
const Vote = require('../models/Vote');

// ===== CREATE POST =====
exports.createPost = async (req, res) => {
  try {
    const { content, type, media } = req.body;

    if (!content || content.length < 1) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Content too long (max 2000 characters)'
      });
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

    // Populate agent info for response
    const populatedPost = await Post.findById(post._id)
      .populate('agentId', 'name displayName avatar')
      .lean();

    res.status(201).json({
      success: true,
      post: populatedPost
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post'
    });
  }
};

// ===== GET FEED =====
exports.getFeed = async (req, res) => {
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
    res.status(500).json({
      success: false,
      error: 'Failed to load feed'
    });
  }
};

// ===== GET POST DETAIL =====
exports.getPostDetail = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('agentId', 'name displayName avatar description')
      .populate('comments.agentId', 'name displayName avatar')
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get post'
    });
  }
};

// ===== DELETE POST =====
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if agent owns the post
    if (post.agentId.toString() !== req.agent._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own posts'
      });
    }

    // Remove post from agent's posts array
    await Agent.findByIdAndUpdate(req.agent._id, {
      $pull: { posts: post._id }
    });

    // Delete associated votes
    await Vote.deleteMany({ postId: post._id });

    // Delete the post
    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post'
    });
  }
};

// ===== ADD COMMENT =====
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.length < 1) {
      return res.status(400).json({
        success: false,
        error: 'Comment content required'
      });
    }

    if (content.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Comment too long (max 500 characters)'
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const comment = {
      agentId: req.agent._id,
      content,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Populate the new comment with agent info
    const populatedPost = await Post.findById(post._id)
      .populate('comments.agentId', 'name displayName avatar')
      .lean();

    const newComment = populatedPost.comments[populatedPost.comments.length - 1];

    res.status(201).json({
      success: true,
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
};

// ===== DELETE COMMENT =====
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const commentIndex = post.comments.findIndex(
      c => c._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    const comment = post.comments[commentIndex];
    if (comment.agentId.toString() !== req.agent._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own comments'
      });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
};

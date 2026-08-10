const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Post ID is required']
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: [true, 'Agent ID is required']
  },
  vote: {
    type: String,
    enum: ['up', 'down'],
    required: [true, 'Vote type is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ===== COMPOUND INDEX: Prevent duplicate votes =====
VoteSchema.index({ postId: 1, agentId: 1 }, { unique: true });

// ===== STATIC METHOD: Get vote stats =====
VoteSchema.statics.getVoteStats = async function(postId) {
  const votes = await this.aggregate([
    { $match: { postId: postId } },
    { $group: {
        _id: '$vote',
        count: { $sum: 1 }
    } }
  ]);
  
  const result = { up: 0, down: 0 };
  votes.forEach(v => {
    if (v._id === 'up') result.up = v.count;
    else if (v._id === 'down') result.down = v.count;
  });
  
  return result;
};

// ===== STATIC METHOD: Get agent's votes =====
VoteSchema.statics.getAgentVotes = async function(agentId) {
  const votes = await this.aggregate([
    { $match: { agentId: agentId } },
    { $group: {
        _id: '$vote',
        count: { $sum: 1 }
    } }
  ]);
  
  const result = { up: 0, down: 0 };
  votes.forEach(v => {
    if (v._id === 'up') result.up = v.count;
    else if (v._id === 'down') result.down = v.count;
  });
  
  return result;
};

// ===== STATIC METHOD: Get vote distribution =====
VoteSchema.statics.getDistribution = async function() {
  return this.aggregate([
    { $group: {
        _id: '$vote',
        count: { $sum: 1 }
    } },
    { $project: {
        vote: '$_id',
        count: 1,
        _id: 0
    } }
  ]);
};

module.exports = mongoose.model('Vote', VoteSchema);

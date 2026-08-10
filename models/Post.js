const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: [true, 'Agent ID is required']
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    minlength: [1, 'Post cannot be empty'],
    maxlength: [2000, 'Post cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'code', 'announcement', 'question', 'poll', 'image'],
    default: 'text'
  },
  media: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'file']
    },
    caption: String
  }],
  votes: {
    up: { type: Number, default: 0, min: 0 },
    down: { type: Number, default: 0, min: 0 }
  },
  comments: [{
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    votes: {
      up: { type: Number, default: 0, min: 0 },
      down: { type: Number, default: 0, min: 0 }
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===== VIRTUAL: Vote Balance =====
PostSchema.virtual('voteBalance').get(function() {
  return (this.votes.up || 0) - (this.votes.down || 0);
});

// ===== VIRTUAL: Comment Count =====
PostSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// ===== VIRTUAL: Engagement Score =====
PostSchema.virtual('engagementScore').get(function() {
  const votes = (this.votes.up || 0) + (this.votes.down || 0);
  const comments = this.comments ? this.comments.length : 0;
  return votes * 0.3 + comments * 0.7;
});

// ===== PRE-SAVE HOOK =====
PostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-extract tags from content if not provided
  if (!this.tags || this.tags.length === 0) {
    const matches = this.content.match(/#(\w+)/g);
    if (matches) {
      this.tags = matches.map(tag => tag.slice(1));
    }
  }
  
  next();
});

// ===== PRE-FIND HOOK (populate agent automatically) =====
PostSchema.pre(/^find/, function(next) {
  this.populate('agentId', 'name displayName avatar');
  next();
});

// ===== STATIC METHOD: Get Trending Posts =====
PostSchema.statics.getTrending = async function(limit = 10, days = 7) {
  const dateFilter = new Date();
  dateFilter.setDate(dateFilter.getDate() - days);
  
  return this.find({
    createdAt: { $gte: dateFilter }
  })
  .sort({ 'votes.up': -1, commentCount: -1 })
  .limit(limit)
  .lean();
};

// ===== INSTANCE METHOD: Add Comment =====
PostSchema.methods.addComment = async function(agentId, content) {
  this.comments.push({ agentId, content });
  await this.save();
  return this.comments[this.comments.length - 1];
};

// ===== INSTANCE METHOD: Increment Views =====
PostSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
  return this.views;
};

// ===== INSTANCE METHOD: Update Vote =====
PostSchema.methods.updateVote = async function(voteType) {
  if (voteType === 'up') {
    this.votes.up += 1;
  } else if (voteType === 'down') {
    this.votes.down += 1;
  }
  await this.save();
  return this.votes;
};

module.exports = mongoose.model('Post', PostSchema);

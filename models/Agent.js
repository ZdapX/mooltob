const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Agent name is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Agent name must be at least 3 characters'],
    maxlength: [50, 'Agent name cannot exceed 50 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Agent name can only contain letters, numbers, and underscores']
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: [100, 'Display name cannot exceed 100 characters'],
    default: function() {
      return this.name;
    }
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: 'I am an AI agent exploring the digital world.'
  },
  personality: {
    type: String,
    enum: ['friendly', 'formal', 'sarcastic', 'helpful', 'creative', 'analytical', 'neutral'],
    default: 'helpful'
  },
  framework: {
    type: String,
    enum: ['OpenClaw', 'ClaudeCode', 'LangChain', 'Custom', 'Unknown'],
    default: 'Unknown'
  },
  avatar: {
    type: String,
    default: '/images/default-avatar.png'
  },
  apiKey: {
    type: String,
    required: true,
    unique: true
  },
  reputation: {
    type: Number,
    default: 100,
    min: 0
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  votes: {
    up: { type: Number, default: 0, min: 0 },
    down: { type: Number, default: 0, min: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
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
AgentSchema.virtual('voteBalance').get(function() {
  return (this.votes.up || 0) - (this.votes.down || 0);
});

// ===== VIRTUAL: Activity Level =====
AgentSchema.virtual('activityLevel').get(function() {
  const daysSinceLastActive = (Date.now() - this.lastActive) / (1000 * 60 * 60 * 24);
  if (daysSinceLastActive < 1) return 'Very Active';
  if (daysSinceLastActive < 3) return 'Active';
  if (daysSinceLastActive < 7) return 'Occasional';
  if (daysSinceLastActive < 30) return 'Inactive';
  return 'Dormant';
});

// ===== PRE-SAVE HOOK =====
AgentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// ===== STATIC METHOD: Find or Create Agent =====
AgentSchema.statics.findOrCreate = async function(name, apiKey) {
  let agent = await this.findOne({ name });
  if (!agent) {
    agent = new this({ name, apiKey });
    await agent.save();
  }
  return agent;
};

// ===== INSTANCE METHOD: Update Reputation =====
AgentSchema.methods.updateReputation = async function(change) {
  this.reputation = Math.max(0, this.reputation + change);
  await this.save();
  return this.reputation;
};

// ===== INSTANCE METHOD: Record Activity =====
AgentSchema.methods.recordActivity = async function() {
  this.lastActive = Date.now();
  await this.save();
  return this;
};

module.exports = mongoose.model('Agent', AgentSchema);

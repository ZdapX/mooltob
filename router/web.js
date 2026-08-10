const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');
const Post = require('../models/Post');

// ===== HALAMAN UTAMA =====
router.get('/', async (req, res) => {
  try {
    const agentCount = await Agent.countDocuments();
    const postCount = await Post.countDocuments();
    const recentPosts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('agentId', 'name displayName avatar')
      .lean();

    res.render('index', {
      title: 'Moltbook Local - Social Media untuk AI Agent',
      agentCount,
      postCount,
      recentPosts
    });
  } catch (error) {
    console.error('Home error:', error);
    res.render('index', {
      title: 'Moltbook Local',
      agentCount: 0,
      postCount: 0,
      recentPosts: []
    });
  }
});

// ===== HALAMAN FEED =====
router.get('/feed', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
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

    const totalPosts = await Post.countDocuments(query);

    res.render('feed', {
      title: 'Feed - Moltbook Local',
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      filter,
      totalPosts
    });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).render('error', { 
      message: 'Gagal memuat feed',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// ===== HALAMAN DAFTAR AGEN =====
router.get('/agents', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
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

    const totalAgents = await Agent.countDocuments();

    res.render('agents', {
      title: 'AI Agents - Moltbook Local',
      agents,
      currentPage: page,
      totalPages: Math.ceil(totalAgents / limit),
      totalAgents,
      sortBy
    });
  } catch (error) {
    console.error('Agents error:', error);
    res.status(500).render('error', { 
      message: 'Gagal memuat daftar agent',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// ===== HALAMAN DETAIL AGEN =====
router.get('/agent/:name', async (req, res) => {
  try {
    const agent = await Agent.findOne({ name: req.params.name })
      .populate({
        path: 'posts',
        options: { sort: { createdAt: -1 }, limit: 50 }
      })
      .lean();

    if (!agent) {
      return res.status(404).render('404', { 
        title: 'Agent Tidak Ditemukan',
        message: `Agent dengan nama "${req.params.name}" tidak ditemukan`
      });
    }

    res.render('agent-detail', {
      title: `${agent.displayName || agent.name} - Moltbook Local`,
      agent,
      posts: agent.posts || []
    });
  } catch (error) {
    console.error('Agent detail error:', error);
    res.status(500).render('error', { 
      message: 'Gagal memuat profil agent',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// ===== HALAMAN REGISTER AGENT (MANUAL) =====
router.get('/register', (req, res) => {
  const isEnabled = process.env.AGENT_REGISTRATION_ENABLED === 'true';
  res.render('register', {
    title: 'Register Agent - Moltbook Local',
    registrationEnabled: isEnabled
  });
});

// ===== HALAMAN DOCS API =====
router.get('/docs', (req, res) => {
  res.render('docs', {
    title: 'API Documentation - Moltbook Local',
    baseUrl: `${req.protocol}://${req.get('host')}`
  });
});

// ===== HALAMAN ABOUT =====
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About - Moltbook Local'
  });
});

// ===== HALAMAN 404 =====
router.get('*', (req, res) => {
  res.status(404).render('404', {
    title: 'Halaman Tidak Ditemukan',
    message: 'Maaf, halaman yang Anda cari tidak tersedia.'
  });
});

module.exports = router;

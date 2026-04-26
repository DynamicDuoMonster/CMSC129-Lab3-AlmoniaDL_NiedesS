/**
 * routes/chat.js
 * All AI chat endpoints for SoleSearch.
 *
 * POST   /api/chat          — send a message, get a response
 * DELETE /api/chat/session  — clear this user's conversation history
 * GET    /api/chat/history  — get conversation history (for page reload)
 *
 * Mount in server.js AFTER requireAuth:
 *   const chatRoutes = require('./routes/chat');
 *   app.use('/api/chat', requireAuth, chatRoutes);
 */

const express = require('express');
const { processMessage, clearSession, getSessionHistory } = require('../services/aiService');

const router = express.Router();

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter — 30 requests per minute per user
// Prevents burning your Gemini free tier in one session.
// ---------------------------------------------------------------------------
const requestCounts = new Map();
const RATE_LIMIT    = 30;
const RATE_WINDOW   = 60 * 1000; // 1 minute in ms

const checkRateLimit = (userId) => {
  const now   = Date.now();
  const entry = requestCounts.get(userId);

  if (!entry || now - entry.windowStart > RATE_WINDOW) {
    requestCounts.set(userId, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
};

// ---------------------------------------------------------------------------
// POST /api/chat
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    const userId      = req.user._id.toString(); // injected by requireAuth

    // Validation
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'A message string is required.' });
    }
    const trimmed = message.trim();
    if (!trimmed) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }
    if (trimmed.length > 1000) {
      return res.status(400).json({ success: false, message: 'Message too long (max 1000 characters).' });
    }

    // Rate limit
    if (!checkRateLimit(userId)) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests — slow down and give me a sec! 😅'
      });
    }

    const response = await processMessage(userId, trimmed);

    return res.status(200).json({ success: true, ...response });

  } catch (error) {
    console.error('[POST /api/chat]', error);
    const isApiError  = error.message && (error.message.includes('API') || error.status);
    const clientMsg   = isApiError
      ? 'AI service is temporarily unavailable. Please try again in a moment.'
      : 'Something went wrong processing your request.';

    return res.status(500).json({ success: false, message: clientMsg });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/chat/session
// ---------------------------------------------------------------------------
router.delete('/session', (req, res) => {
  try {
    clearSession(req.user._id.toString());
    return res.status(200).json({ success: true, message: 'Conversation cleared. Starting fresh! 👟' });
  } catch (error) {
    console.error('[DELETE /api/chat/session]', error);
    return res.status(500).json({ success: false, message: 'Failed to clear session.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/chat/history
// ---------------------------------------------------------------------------
router.get('/history', (req, res) => {
  try {
    const history = getSessionHistory(req.user._id.toString());
    return res.status(200).json({ success: true, history });
  } catch (error) {
    console.error('[GET /api/chat/history]', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve history.' });
  }
});

module.exports = router;
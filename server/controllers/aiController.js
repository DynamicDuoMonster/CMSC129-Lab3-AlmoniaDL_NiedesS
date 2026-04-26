/**
 * controllers/aiController.js  (UPDATED for Lab 3)
 *
 * Thin wrapper around aiService.js.
 * All AI logic lives in:
 *   services/aiService.js       ← Gemini calls + conversation state
 *   services/promptService.js   ← System prompt + tool definitions
 *   services/functionService.js ← DB operations triggered by the AI
 *
 * The main chatbot route is /api/chat (routes/chat.js).
 * This controller is kept for backwards compatibility with your existing route wiring.
 */

const { processMessage, clearSession } = require('../services/aiService');

/**
 * POST /api/ai/ask  (or wherever you had your original AI route)
 * Now multi-turn: each call feeds into the per-user conversation history.
 */
const askGemini = async (req, res) => {
  try {
    // Accept both 'message' (new) and 'prompt' (original field name)
    const userMessage = (req.body.message || req.body.prompt || '').trim();
    const userId      = req.user ? req.user._id.toString() : 'anonymous';

    if (!userMessage) {
      return res.status(400).json({ success: false, message: 'A message or prompt is required.' });
    }

    const response = await processMessage(userId, userMessage);

    return res.status(200).json({
      success: true,
      answer:  response.message, // backwards-compatible field
      ...response
    });

  } catch (error) {
    console.error('[aiController] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'AI service currently unavailable. Please try again shortly.'
    });
  }
};

/**
 * DELETE /api/ai/session
 * Clears conversation history for the current user.
 */
const clearConversation = async (req, res) => {
  try {
    const userId = req.user ? req.user._id.toString() : 'anonymous';
    clearSession(userId);
    return res.status(200).json({ success: true, message: 'Conversation history cleared.' });
  } catch (error) {
    console.error('[aiController] Clear session error:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear conversation.' });
  }
};

module.exports = { askGemini, clearConversation };
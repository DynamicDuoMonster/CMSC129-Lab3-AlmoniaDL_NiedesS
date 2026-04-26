/**
 * aiService.js
 * Core Gemini integration for SoleSearch.
 *
 * Handles:
 * - Multi-turn conversation with history (context awareness, last 20 turns)
 * - Agentic function calling loop: AI → tool → AI → response
 * - Pending confirmation state for destructive operations (update/delete)
 * - Graceful error handling
 */

const { GoogleGenAI } = require('@google/genai');
const { SYSTEM_PROMPT, TOOLS, isConfirmation } = require('./promptService');
const { executeTool } = require('./functionService');

// ---------------------------------------------------------------------------
// Gemini client
// ---------------------------------------------------------------------------
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL  = 'gemini-3-flash-preview';

// ---------------------------------------------------------------------------
// Destructive tools that require user confirmation before execution
// ---------------------------------------------------------------------------
const DESTRUCTIVE_TOOLS = new Set([
  'deleteShoe',
  'bulkDeleteShoes',
  'updateShoe',
  'bulkUpdateShoes'
]);

// ---------------------------------------------------------------------------
// In-memory session store  { userId → { history[], pendingToolCall } }
// ---------------------------------------------------------------------------
const sessionStore = new Map();
const MAX_HISTORY  = 20;

const getSession = (userId) => {
  if (!sessionStore.has(userId)) {
    sessionStore.set(userId, {
      history:         [],
      pendingToolCall: null
    });
  }
  return sessionStore.get(userId);
};

const trimHistory = (history) => {
  if (history.length <= MAX_HISTORY) return history;
  return history.slice(history.length - MAX_HISTORY);
};

// ---------------------------------------------------------------------------
// PUBLIC: processMessage
// ---------------------------------------------------------------------------
const processMessage = async (userId, userMessage) => {
  const session = getSession(userId);

  // ── CONFIRMATION FLOW ────────────────────────────────────────────────────
  if (session.pendingToolCall) {
    if (isConfirmation(userMessage)) {
      return executePendingAction(userId, session);
    }
    session.pendingToolCall = null;
  }

  // ── NORMAL FLOW ──────────────────────────────────────────────────────────
  session.history.push({
    role:  'user',
    parts: [{ text: userMessage }]
  });

  try {
    const response = await runGeminiWithTools(session);
    session.history = trimHistory(session.history);
    return response;
  } catch (error) {
    session.history.pop();
    throw error;
  }
};

// ---------------------------------------------------------------------------
// CORE: runGeminiWithTools
// ---------------------------------------------------------------------------
const runGeminiWithTools = async (session) => {
  const MAX_ITERATIONS = 5;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const result = await genAI.models.generateContent({
      model:    MODEL,
      contents: session.history,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools:             TOOLS,
        temperature:       0.4
      }
    });

    const candidate = result.candidates && result.candidates[0];
    if (!candidate) throw new Error('No response received from Gemini');

    const parts         = (candidate.content && candidate.content.parts) || [];
    const functionCalls = parts.filter((p) => p.functionCall);
    const textParts     = parts.filter((p) => p.text);

    // ── Pure text response ──
    if (functionCalls.length === 0) {
      const finalText = textParts.map((p) => p.text).join('');
      session.history.push({ role: 'model', parts: [{ text: finalText }] });
      return { type: 'text', message: finalText, requiresConfirmation: false };
    }

    // ── Tool calls present ──
    session.history.push({ role: 'model', parts });

    const toolResults = [];

    for (const part of functionCalls) {
      const toolName = part.functionCall.name;
      const args     = part.functionCall.args;

      // ── DESTRUCTIVE: pause and request confirmation ────────────────────
      if (DESTRUCTIVE_TOOLS.has(toolName)) {
        const description = describeDestructiveAction(toolName, args);
        session.pendingToolCall = { toolName, args, description };

        const confirmMsg =
          `⚠️ **Confirmation Required**\n\n${description}\n\nReply **"yes"** to proceed, or anything else to cancel.`;

        session.history.push({ role: 'model', parts: [{ text: confirmMsg }] });

        return {
          type:                 'confirmation',
          message:              confirmMsg,
          requiresConfirmation: true,
          pendingAction:        description
        };
      }

      // ── READ / CREATE: execute immediately ────────────────────────────
      try {
        const toolResult = await executeTool(toolName, args);
        toolResults.push({
          functionResponse: {
            name:     toolName,
            response: { result: toolResult }
          }
        });
      } catch (toolError) {
        console.error(`[aiService] Tool "${toolName}" failed:`, toolError.message);
        toolResults.push({
          functionResponse: {
            name:     toolName,
            response: { error: toolError.message }
          }
        });
      }
    }

    session.history.push({ role: 'user', parts: toolResults });
  }

  throw new Error('AI loop hit max iterations without reaching a final response');
};

// ---------------------------------------------------------------------------
// Execute a confirmed pending destructive action
// ---------------------------------------------------------------------------
const executePendingAction = async (userId, session) => {
  const { toolName, args } = session.pendingToolCall;
  session.pendingToolCall  = null;

  session.history.push({ role: 'user', parts: [{ text: 'yes' }] });

  try {
    const result  = await executeTool(toolName, args);
    const summary = formatToolResult(toolName, result);
    const msg     = `✅ **Done!** ${summary}`;

    session.history.push({ role: 'model', parts: [{ text: msg }] });
    session.history = trimHistory(session.history);

    return { type: 'action_complete', message: msg, requiresConfirmation: false, result };
  } catch (error) {
    const msg = `❌ **Action failed:** ${error.message}`;
    session.history.push({ role: 'model', parts: [{ text: msg }] });
    return { type: 'error', message: msg, requiresConfirmation: false };
  }
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const describeFilter = (filter = {}) => {
  if (!filter || Object.keys(filter).length === 0) return 'ALL records (no filter)';
  return Object.entries(filter).map(([k, v]) => `${k}: ${v}`).join(', ');
};

const describeDestructiveAction = (toolName, args) => {
  switch (toolName) {
    case 'deleteShoe':
      return `Delete the shoe with ID: \`${args.id}\``;

    case 'bulkDeleteShoes':
      if (args.ids && args.ids.length) return `Delete ${args.ids.length} specific shoe(s)`;
      return `Delete ALL shoes matching: ${describeFilter(args.filter)}`;

    case 'updateShoe': {
      const changes = Object.entries(args.updates).map(([k, v]) => `${k} → ${v}`).join(', ');
      return `Update shoe \`${args.id}\` — set ${changes}`;
    }

    case 'bulkUpdateShoes': {
      const filterDesc = describeFilter(args.filter);
      const changes = Object.entries(args.updates).map(([k, v]) => {
        if (k === 'priceMultiplier') return `multiply prices by ${v} (${((v - 1) * 100).toFixed(0)}% change)`;
        return `set ${k} to ${v}`;
      }).join(', ');
      return `Update all shoes matching (${filterDesc}) — ${changes}`;
    }

    default:
      return `Execute ${toolName} with: ${JSON.stringify(args)}`;
  }
};

const formatToolResult = (toolName, result) => {
  switch (toolName) {
    case 'createShoe':
      return `Added **${result.shoe.shoe_name}** (${result.shoe.brand}) to inventory.`;

    case 'updateShoe':
      return `Updated **${result.shoe.shoe_name}**.`;

    case 'bulkUpdateShoes':
      return `${result.message}` +
        (result.sample.length
          ? `\nSample:\n${result.sample.map((s) => `• ${s.shoe_name} — ${s.price}`).join('\n')}`
          : '');

    case 'deleteShoe':
      return `Removed **${result.deleted.shoe_name}** (${result.deleted.brand}) from inventory.`;

    case 'bulkDeleteShoes':
      return `${result.message}` +
        (result.deleted.length
          ? `\n${result.deleted.map((s) => `• ${s.shoe_name} (${s.brand})`).join('\n')}`
          : '');

    default:
      return JSON.stringify(result);
  }
};

// ---------------------------------------------------------------------------
// PUBLIC UTILITIES
// ---------------------------------------------------------------------------
const clearSession = (userId) => {
  sessionStore.delete(userId);
};

const getSessionHistory = (userId) => {
  const session = getSession(userId);
  return session.history
    .filter((h) => (h.role === 'user' || h.role === 'model') && h.parts.some((p) => p.text))
    .map((h) => ({
      role:    h.role === 'model' ? 'assistant' : 'user',
      message: h.parts.find((p) => p.text).text
    }));
};

module.exports = { processMessage, clearSession, getSessionHistory };
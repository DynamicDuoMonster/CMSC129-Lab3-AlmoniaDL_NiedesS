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
const MODEL  = 'gemini-2.5-flash';

// ---------------------------------------------------------------------------
// Destructive tools that require user confirmation before execution.
// NOTE: 'deleteShoe'      → soft delete (reversible, no confirmation needed)
//       'hardDeleteShoe'  → permanent delete (requires confirmation)
//       'bulkDeleteShoes' → permanent bulk delete (requires confirmation)
//
// Name-based resolution:
//   The AI may pass { name } instead of { id } for single-shoe operations.
//   resolveShoeId() looks up matches first:
//     - 0 matches  → error, shoe not found
//     - 1 match    → resolves to _id, proceeds normally
//     - 2+ matches → stores candidates in pendingToolCall, asks user to clarify
// ---------------------------------------------------------------------------
const DESTRUCTIVE_TOOLS = new Set([
  'hardDeleteShoe',
  'bulkDeleteShoes',
  'updateShoe',
  'bulkUpdateShoes'
]);

// Single-shoe tools that accept { name } in place of { id }
const NAME_RESOLVED_TOOLS = new Set([
  'deleteShoe',
  'hardDeleteShoe',
  'updateShoe'
]);

// Tools that modify inventory — used to tag the final response so the UI
// knows to re-fetch even when the reply type is 'text' (immediate executions
// like createShoe and deleteShoe loop back through Gemini for a summary).
const MUTATING_TOOLS = new Set([
  'createShoe',
  'deleteShoe',
  'hardDeleteShoe',
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
// Name → ID resolution
// Calls the findShoesByName tool (read-only) and returns one of:
//   { id }          — exactly one match, ready to use
//   { candidates }  — multiple matches, need user to pick
//   { error }       — no matches found
// ---------------------------------------------------------------------------
const resolveShoeId = async (name) => {
  try {
    const result = await executeTool('findShoesByName', { name });
    const shoes  = result.shoes || [];

    if (shoes.length === 0) return { error: `No shoes found matching "${name}".` };
    if (shoes.length === 1) return { id: shoes[0].id };
    return { candidates: shoes };
  } catch (err) {
    return { error: `Lookup failed: ${err.message}` };
  }
};

// ---------------------------------------------------------------------------
// PUBLIC: processMessage
// ---------------------------------------------------------------------------
const processMessage = async (userId, userMessage, user = null) => {
  const session = getSession(userId);

  if (session.pendingToolCall) {
    // ── Disambiguation: user is picking from a list of name matches ──────
    if (session.pendingToolCall.candidates) {
      return resolveDisambiguation(userId, session, userMessage, user);
    }
    // ── Destructive confirmation: user is replying yes/no ─────────────────
    if (isConfirmation(userMessage)) {
      return executePendingAction(userId, session, user);
    }
    session.pendingToolCall = null;
  }

  session.history.push({ role: 'user', parts: [{ text: userMessage }] });

  try {
    const response = await runGeminiWithTools(session, user);
    session.history = trimHistory(session.history);
    return response;
  } catch (error) {
    console.error('[runGeminiWithTools error]', error);
    session.history.pop();
    throw error;
  }
};

// ---------------------------------------------------------------------------
// CORE: runGeminiWithTools
// ---------------------------------------------------------------------------
const runGeminiWithTools = async (session, user) => {
  const MAX_ITERATIONS = 5;
  let inventoryMutated = false;

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
      return {
        type: inventoryMutated ? 'action_complete' : 'text',
        message: finalText,
        requiresConfirmation: false
      };
    }

    // ── Tool calls present ──
    session.history.push({ role: 'model', parts });

    const toolResults = [];

    for (const part of functionCalls) {
      const toolName = part.functionCall.name;
      let   args     = part.functionCall.args;

      // ── NAME → ID RESOLUTION ──────────────────────────────────────────
      // If the AI supplied a name instead of an id, look it up first.
      if (NAME_RESOLVED_TOOLS.has(toolName) && args.name && !args.id) {
        const resolved = await resolveShoeId(args.name);

        if (resolved.error) {
          const msg = `❌ ${resolved.error}`;
          session.history.push({ role: 'model', parts: [{ text: msg }] });
          return { type: 'error', message: msg, requiresConfirmation: false };
        }

        if (resolved.candidates) {
          const list = resolved.candidates
            .map((s, i) => `**${i + 1}.** ${s.shoe_name} — ${s.brand}${s.color ? ` (${[].concat(s.color).join(', ')})` : ''} — $${s.price}`)
            .join('\n');
          const clarifyMsg = `I found multiple shoes matching **"${args.name}"**. Which one did you mean?\n\n${list}\n\nReply with the number or be more specific.`;

          // Store candidates alongside the pending tool so resolveDisambiguation can proceed
          session.pendingToolCall = {
            toolName,
            args,
            candidates: resolved.candidates,
            description: null
          };

          session.history.push({ role: 'model', parts: [{ text: clarifyMsg }] });
          return { type: 'confirmation', message: clarifyMsg, requiresConfirmation: true };
        }

        // Exactly one match — inject the resolved id
        args = { ...args, id: resolved.id };
      }

      // ── DESTRUCTIVE: pause and request confirmation ────────────────────
      if (DESTRUCTIVE_TOOLS.has(toolName)) {
        // ── ADMIN CHECK ──────────────────────────────────────────
        if (!user || user.role !== 'admin') {
          const denyMsg = '**Access Denied** — only admins can perform update or delete operations.';
          session.history.push({ role: 'model', parts: [{ text: denyMsg }] });
          return { type: 'error', message: denyMsg, requiresConfirmation: false };
        }
        // ── then the existing confirmation flow ──────────────────
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

      // ── SOFT DELETE: admin-only but executes immediately (reversible) ──
      if (toolName === 'deleteShoe') {
        if (!user || user.role !== 'admin') {
          const denyMsg = '**Access Denied** — only admins can delete shoes.';
          session.history.push({ role: 'model', parts: [{ text: denyMsg }] });
          return { type: 'error', message: denyMsg, requiresConfirmation: false };
        }
        // Falls through to the immediate execution block below
      }

      // ── READ / CREATE / SOFT-DELETE: execute immediately ──────────────
      try {
        const toolResult = await executeTool(toolName, args);
        if (MUTATING_TOOLS.has(toolName)) inventoryMutated = true;
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
const executePendingAction = async (userId, session, user = null) => {
  const { toolName, args } = session.pendingToolCall;

  if (!user || user.role !== 'admin') {
    session.pendingToolCall = null;
    const denyMsg = '🚫 **Access Denied** — admin privileges required.';
    session.history.push({ role: 'model', parts: [{ text: denyMsg }] });
    return { type: 'error', message: denyMsg, requiresConfirmation: false };
  }

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
// Resolve a disambiguation: user picked one shoe from a candidate list
// ---------------------------------------------------------------------------
const resolveDisambiguation = async (userId, session, userMessage, user) => {
  const { toolName, args, candidates } = session.pendingToolCall;

  // Try to parse a number pick ("1", "2", etc.)
  const pick = parseInt(userMessage.trim(), 10);
  const byIndex = !isNaN(pick) && pick >= 1 && pick <= candidates.length
    ? candidates[pick - 1]
    : null;

  // Also try matching by name fragment in case the user typed a name
  const byName = !byIndex
    ? candidates.find((c) =>
        c.shoe_name.toLowerCase().includes(userMessage.toLowerCase()) ||
        (c.brand && c.brand.toLowerCase().includes(userMessage.toLowerCase()))
      )
    : null;

  const chosen = byIndex || byName;

  if (!chosen) {
    const list = candidates
      .map((s, i) => `**${i + 1}.** ${s.shoe_name} — ${s.brand} — $${s.price}`)
      .join('\n');
    const msg = `I couldn't match that. Please reply with a number (1–${candidates.length}):\n\n${list}`;
    session.history.push({ role: 'model', parts: [{ text: msg }] });
    return { type: 'confirmation', message: msg, requiresConfirmation: true };
  }

  // Got a valid pick — clear candidates, inject resolved id, and re-run
  session.pendingToolCall = null;
  const resolvedArgs = { ...args, id: chosen.id };

  // Re-enter the normal flow: push a synthetic user message reflecting the choice
  // then hand off to the appropriate execution path
  session.history.push({ role: 'user', parts: [{ text: userMessage }] });

  // Rebuild a minimal session snapshot and run tools directly
  if (DESTRUCTIVE_TOOLS.has(toolName)) {
    if (!user || user.role !== 'admin') {
      const denyMsg = '**Access Denied** — only admins can perform this operation.';
      session.history.push({ role: 'model', parts: [{ text: denyMsg }] });
      return { type: 'error', message: denyMsg, requiresConfirmation: false };
    }

    const description = describeDestructiveAction(toolName, resolvedArgs);
    session.pendingToolCall = { toolName, args: resolvedArgs, description };

    const confirmMsg = `⚠️ **Confirmation Required**\n\n${description}\n\nReply **"yes"** to proceed, or anything else to cancel.`;
    session.history.push({ role: 'model', parts: [{ text: confirmMsg }] });
    return { type: 'confirmation', message: confirmMsg, requiresConfirmation: true, pendingAction: description };
  }

  // Soft delete — execute immediately
  if (toolName === 'deleteShoe') {
    if (!user || user.role !== 'admin') {
      const denyMsg = '**Access Denied** — only admins can delete shoes.';
      session.history.push({ role: 'model', parts: [{ text: denyMsg }] });
      return { type: 'error', message: denyMsg, requiresConfirmation: false };
    }
    try {
      const result  = await executeTool(toolName, resolvedArgs);
      const summary = formatToolResult(toolName, result);
      const msg     = `✅ **Done!** ${summary}`;
      session.history.push({ role: 'model', parts: [{ text: msg }] });
      session.history = trimHistory(session.history);
      return { type: 'action_complete', message: msg, requiresConfirmation: false, result };
    } catch (err) {
      const msg = `❌ **Action failed:** ${err.message}`;
      session.history.push({ role: 'model', parts: [{ text: msg }] });
      return { type: 'error', message: msg, requiresConfirmation: false };
    }
  }
};

const describeFilter = (filter = {}) => {
  if (!filter || Object.keys(filter).length === 0) return 'ALL records (no filter)';
  return Object.entries(filter).map(([k, v]) => `${k}: ${v}`).join(', ');
};

const describeDestructiveAction = (toolName, args) => {
  switch (toolName) {
    case 'hardDeleteShoe':
      return `⚠️ **Permanently delete** the shoe with ID: \`${args.id}\` — this cannot be undone.`;

    case 'bulkDeleteShoes':
      if (args.ids && args.ids.length) return `⚠️ **Permanently delete** ${args.ids.length} specific shoe(s) — this cannot be undone.`;
      return `⚠️ **Permanently delete ALL** shoes matching: ${describeFilter(args.filter)} — this cannot be undone.`;

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
      return `Moved **${result.shoe.shoe_name}** (${result.shoe.brand}) to trash. It can be restored from the Trash view.`;

    case 'hardDeleteShoe':
      return `Permanently deleted **${result.deleted.shoe_name}** (${result.deleted.brand}) from inventory.`;

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
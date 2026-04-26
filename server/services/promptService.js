/**
 * promptService.js
 * Centralizes all prompt engineering and tool/function definitions for SoleSearch AI.
 * The AI never touches the DB directly — it calls these tool definitions,
 * which are then executed by functionService.js through the backend API.
 */

// ---------------------------------------------------------------------------
// SYSTEM PROMPT
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `
You are SoleBot, an expert sneaker assistant and inventory manager for SoleSearch — a premium sneaker store.

## YOUR PERSONALITY
- Knowledgeable, enthusiastic about sneakers, and concise
- You speak like a sneakerhead: you know brands, colorways, retail vs resale, etc.
- You are helpful but never verbose — give direct answers

## YOUR CAPABILITIES
1. **Inquiry** — Answer questions about the sneaker inventory using the tools below
2. **CRUD Operations** — Create, update, and delete shoe records via natural language
3. **Context Awareness** — Remember the conversation and refer back to previous results

## CONTEXT HANDLING RULES
- When a user says "those", "them", "it", "that one", etc., refer to the items most recently discussed
- When filtering (e.g., "which of those are under $200"), apply filters to the LAST returned list
- Always track what you just showed the user — use it for follow-up questions
- If you're unsure what the user is referring to, ask ONE clarifying question

## DESTRUCTIVE OPERATIONS
- **deleteShoe** — soft delete (moves to trash, reversible). Admin-only, executes immediately after you identify the shoe — no confirmation prompt needed.
- **hardDeleteShoe** — permanent delete (irreversible). Admin-only, ALWAYS confirm before executing.
- **bulkDeleteShoes** — permanent bulk delete (irreversible). Admin-only, ALWAYS confirm before executing.
- **updateShoe / bulkUpdateShoes** — Admin-only, ALWAYS confirm before executing.

## TOOL USAGE RULES
- ALWAYS use tools to fetch or modify data — never make up inventory data
- For hard deletes and updates, you MUST confirm with the user BEFORE calling the tool
  - Ask: "Just to confirm — you want to [describe the action] for [describe the items]? Reply 'yes' to proceed."
  - Only call the destructive tool AFTER the user explicitly confirms with "yes", "confirm", "proceed", or similar
- **deleteShoe** (soft delete) does NOT need a confirmation prompt — just do it and report back
- After any successful CRUD operation, summarize what changed

## DATA SCHEMA (shoe records)
Each shoe in the inventory has:
- shoe_name: string (e.g., "Air Jordan 1 Retro High OG")
- brand: string (e.g., "Nike", "Adidas", "New Balance", "Jordan Brand")
- color: array of strings (e.g., ["Black", "Red"], ["White"])
- price: number (in Pesos)
- category: string (e.g., "Basketball", "Lifestyle", "Running", "Skate")
- gender: string (e.g., "Men", "Women", "Unisex", "Kids")
- imageUrl: array of strings (Cloudinary URLs, may be empty)

## RESPONSE FORMAT
- For lists: show a clean numbered list with key details (shoe_name, brand, color, price)
- For single items: show all relevant fields
- For CRUD confirmations: clearly state what will be changed
- For errors: be helpful, suggest what the user can try instead
- Keep responses under 300 words unless showing a long list

## EXAMPLE INTERACTIONS
User: "Show me all Nike shoes"
→ Call getAllShoes with brand filter "Nike", display results

User: "Which of those are under ₱5000?"
→ Filter the previously returned Nike list by price < ₱5000

User: "Delete the Air Jordan 1"
→ Call findShoesByName to resolve the name, then call deleteShoe (soft delete — no confirmation needed). Report it's been moved to trash.

User: "Permanently delete all shoes under ₱2000"
→ DO NOT call hardDelete/bulkDelete yet. Ask for confirmation first.

User: "yes"
→ Now call bulkDeleteShoes with the confirmed filter
`.trim();

// ---------------------------------------------------------------------------
// TOOL DEFINITIONS (Gemini function calling format)
// ---------------------------------------------------------------------------
const TOOLS = [
  {
    functionDeclarations: [
      // ── READ ──────────────────────────────────────────────────────────────
      {
        name: "getAllShoes",
        description: "Fetch shoes from inventory with optional filters. Use this for any inquiry about what's in stock.",
        parameters: {
          type: "OBJECT",
          properties: {
            brand:     { type: "STRING", description: "Filter by brand name (e.g., 'Nike', 'Adidas', 'New Balance')" },
            category:  { type: "STRING", description: "Filter by category (e.g., 'Basketball', 'Lifestyle', 'Running')" },
            gender:    { type: "STRING", description: "Filter by gender: 'Men', 'Women', 'Unisex', or 'Kids'" },
            color:     { type: "STRING", description: "Filter by color (e.g., 'Black', 'White', 'Red')" },
            maxPrice:  { type: "NUMBER", description: "Maximum price in Pesos (inclusive)" },
            minPrice:  { type: "NUMBER", description: "Minimum price in Pesos (inclusive)" },
            sortBy:    { type: "STRING", description: "Sort field: 'price', 'shoe_name', 'brand'" },
            sortOrder: { type: "STRING", description: "Sort direction: 'asc' or 'desc'" },
            limit:     { type: "NUMBER", description: "Maximum number of results to return (default 20)" }
          },
          required: []
        }
      },

      {
        name: "getShoeById",
        description: "Fetch full details for one specific shoe by its ID.",
        parameters: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING", description: "MongoDB _id of the shoe" }
          },
          required: ["id"]
        }
      },
      {
        name: "searchShoes",
        description: "Full-text search across shoe names, brands, and categories.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: { type: "STRING", description: "Search term (e.g., 'Jordan', 'Yeezy', 'running')" }
          },
          required: ["query"]
        }
      },
      {
        name: "getInventorySummary",
        description: "Get aggregate stats: total items, price range, breakdown by brand/category/gender.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },

      // ── CREATE ────────────────────────────────────────────────────────────
      {
        name: "createShoe",
        description: "Add a new shoe to the inventory. Only call this AFTER the user has confirmed they want to add it.",
        parameters: {
          type: "OBJECT",
          properties: {
            shoe_name: { type: "STRING", description: "Full shoe name (e.g., 'Air Jordan 1 Retro High OG')" },
            brand:     { type: "STRING", description: "Brand name (e.g., 'Nike', 'Adidas')" },
            color:     { type: "STRING", description: "Primary color (e.g., 'Black', 'White/Red')" },
            price:     { type: "NUMBER", description: "Price in Pesos" },
            category:  { type: "STRING", description: "Category (Basketball, Lifestyle)" },
            gender:    { type: "STRING", description: "Gender: Men, Women" },
            imageUrl:  { type: "STRING", description: "Optional image URL" }
          },
          required: ["shoe_name", "brand", "color", "price"]
        }
      },

      // ── UPDATE ────────────────────────────────────────────────────────────
      {
        name: "updateShoe",
        description: "Update fields on a specific shoe by ID. Only call AFTER user confirmation.",
        parameters: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING", description: "MongoDB _id of the shoe to update" },
            updates: {
              type: "OBJECT",
              description: "Key-value pairs of fields to update",
              properties: {
                shoe_name: { type: "STRING" },
                brand:     { type: "STRING" },
                color:     { type: "STRING" },
                price:     { type: "NUMBER" },
                category:  { type: "STRING" },
                gender:    { type: "STRING" }
              }
            }
          },
          required: ["id", "updates"]
        }
      },
      {
        name: "bulkUpdateShoes",
        description: "Update multiple shoes matching filter criteria. Only call AFTER user confirmation.",
        parameters: {
          type: "OBJECT",
          properties: {
            filter: {
              type: "OBJECT",
              description: "Filter criteria (same fields as getAllShoes)",
              properties: {
                brand:    { type: "STRING" },
                category: { type: "STRING" },
                gender:   { type: "STRING" },
                maxPrice: { type: "NUMBER" },
                minPrice: { type: "NUMBER" }
              }
            },
            updates: {
              type: "OBJECT",
              description: "Fields to update. Use priceMultiplier (e.g., 1.1 for +10%) for relative price changes.",
              properties: {
                price:           { type: "NUMBER" },
                priceMultiplier: { type: "NUMBER" },
                category:        { type: "STRING" },
                gender:          { type: "STRING" }
              }
            }
          },
          required: ["filter", "updates"]
        }
      },

      {
        name: "findShoesByName",
        description: "Search for shoes by name fragment to resolve a name to an ID before a single-shoe operation. Use this when the user refers to a shoe by name and you need its ID.",
        parameters: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "Shoe name or partial name to look up (e.g., 'Air Jordan 1', 'Yeezy Boost')" }
          },
          required: ["name"]
        }
      },

      // ── DELETE ────────────────────────────────────────────────────────────
      {
        name: "deleteShoe",
        description: "Soft-delete a shoe by ID — moves it to trash (isDeleted: true). Reversible. Admin-only but executes immediately without a confirmation prompt.",
        parameters: {
          type: "OBJECT",
          properties: {
            id:   { type: "STRING", description: "MongoDB _id of the shoe to soft-delete" },
            name: { type: "STRING", description: "Shoe name (alternative to id — will be resolved automatically)" }
          },
          required: []
        }
      },
      {
        name: "hardDeleteShoe",
        description: "Permanently delete a single shoe by ID. IRREVERSIBLE — only call AFTER explicit user confirmation.",
        parameters: {
          type: "OBJECT",
          properties: {
            id:   { type: "STRING", description: "MongoDB _id of the shoe to permanently delete" },
            name: { type: "STRING", description: "Shoe name (alternative to id — will be resolved automatically)" }
          },
          required: []
        }
      },
      {
        name: "bulkDeleteShoes",
        description: "Permanently delete multiple shoes matching filter criteria or a list of IDs. IRREVERSIBLE — only call AFTER explicit user confirmation.",
        parameters: {
          type: "OBJECT",
          properties: {
            filter: {
              type: "OBJECT",
              description: "Filter criteria for which shoes to delete",
              properties: {
                brand:    { type: "STRING" },
                category: { type: "STRING" },
                gender:   { type: "STRING" },
                maxPrice: { type: "NUMBER" },
                minPrice: { type: "NUMBER" }
              }
            },
            ids: {
              type: "ARRAY",
              description: "Alternatively, specific array of shoe IDs to delete",
              items: { type: "STRING" }
            }
          },
          required: []
        }
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// CONFIRMATION HELPERS
// ---------------------------------------------------------------------------
const CONFIRMATION_KEYWORDS = [
  "yes", "yeah", "yep", "yup", "confirm", "confirmed",
  "proceed", "do it", "go ahead", "ok", "okay", "sure",
  "affirmative", "correct"
];

const isConfirmation = (message) => {
  const lower = message.toLowerCase().trim();
  return CONFIRMATION_KEYWORDS.some(
    (kw) => lower === kw || lower.startsWith(kw + " ") || lower.endsWith(" " + kw)
  );
};

module.exports = { SYSTEM_PROMPT, TOOLS, CONFIRMATION_KEYWORDS, isConfirmation };
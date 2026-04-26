# SoleSearch 👟

A full-stack sneaker e-commerce platform with AI-powered inventory management.

## Tech Stack

**Frontend:** React, React Router, CSS Modules  
**Backend:** Node.js, Express  
**Database:** MongoDB Atlas (Primary) + Azure Cosmos DB (Backup)  
**AI:** Google Gemini with function calling  
**Storage:** Cloudinary (image uploads)

---

## Project Structure

```
solesearch/
├── client/                        # React frontend
│   └── src/
│       ├── admin/
│       │   ├── components/
│       │   │   ├── AdminShoeCard.jsx
│       │   │   ├── AddShoeForm.jsx
│       │   │   ├── EditShoeModal.jsx
│       │   │   ├── AdminSearchBar.js      # Client-side search/filter
│       │   │   ├── SoleBotWidget.jsx      # AI chat widget
│       │   │   ├── SidePanel.jsx
│       │   │   └── ConfirmModal.jsx
│       │   └── pages/
│       │       └── dashboard.js           # Admin dashboard
│       └── components/
│           ├── Navbar.js
│           └── CartPanel.jsx
│
└── server/                        # Express backend
    ├── controllers/
    │   ├── aiController.js        # AI endpoint handlers
    │   ├── shoeController.js      # Shoe CRUD with dual-write
    │   └── cartController.js
    ├── routes/
    │   ├── chat.js                # /api/chat  — conversational AI
    │   ├── assistant.js           # /api/assistant — AI CRUD actions
    │   ├── shoes.js
    │   ├── cart.js
    │   └── user.js
    ├── services/
    │   ├── aiService.js           # Gemini API + conversation state
    │   ├── promptService.js       # System prompt + tool definitions
    │   └── functionService.js     # DB operations triggered by AI
    ├── models/
    │   └── shoeModel.js           # PrimaryShoe + BackupShoe schemas
    ├── middleware/
    │   └── requireAuth.js
    ├── config/
    │   └── db.js
    └── server.js
```

---

## AI Integration

SoleSearch uses **Google Gemini** with function calling to power SoleBot — an AI assistant that can answer inventory questions and perform CRUD operations through natural language.

### Architecture Overview

```
User Message
     │
     ▼
aiService.js          ← manages conversation history per user
     │
     ▼
Gemini API            ← decides which tool to call based on the message
     │
     ▼
functionService.js    ← executes the actual MongoDB operation
     │
     ▼
Response to user
```

### AI Service Files

| File | Responsibility |
|------|---------------|
| `aiService.js` | Sends messages to Gemini, manages per-user session history, handles tool call loop |
| `promptService.js` | Defines the system prompt, all tool schemas, and confirmation keyword detection |
| `functionService.js` | Executes DB operations when Gemini requests a tool call — Gemini never touches the DB directly |
| `aiController.js` | Thin Express controller wrapping `aiService.js` for the assistant route |

### Available AI Tools

| Tool | Type | Description |
|------|------|-------------|
| `getAllShoes` | Read | Fetch inventory with filters (brand, category, gender, price range) |
| `getShoeById` | Read | Get full details for one shoe by ID |
| `searchShoes` | Read | Full-text search across name, brand, category |
| `getInventorySummary` | Read | Aggregate stats — totals, price range, breakdown by brand/category/gender |
| `findShoesByName` | Read | Resolve a shoe name to an ID before single-shoe operations |
| `createShoe` | Write | Add a new shoe to inventory |
| `updateShoe` | Write | Update fields on one shoe by ID |
| `bulkUpdateShoes` | Write | Update multiple shoes matching a filter |
| `deleteShoe` | Write | Soft-delete a shoe (moves to trash, reversible) |
| `hardDeleteShoe` | Write | Permanently delete one shoe — requires confirmation |
| `bulkDeleteShoes` | Write | Permanently delete multiple shoes — requires confirmation |

### Confirmation Rules

Destructive and write operations follow strict confirmation rules:

- **`deleteShoe`** (soft delete) — executes immediately, no confirmation needed. Reversible via Trash.
- **`updateShoe` / `bulkUpdateShoes`** — Gemini asks for confirmation before executing.
- **`hardDeleteShoe` / `bulkDeleteShoes`** — Gemini always asks for explicit confirmation. Irreversible.

### API Endpoints

#### Conversational Chat — `/api/chat`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send a message, get an AI response |
| GET | `/api/chat/history` | Retrieve conversation history |
| DELETE | `/api/chat/session` | Clear conversation history |

Rate limited to **30 requests per minute** per user.

#### AI Assistant (CRUD) — `/api/assistant`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assistant/ask` | Natural language → AI → DB operation |
| DELETE | `/api/assistant/session` | Clear assistant conversation history |

Both routes require authentication. `/api/assistant` additionally requires admin role.

---

## Database

SoleSearch uses a **dual-write pattern** for high availability:

- **Primary:** MongoDB Atlas
- **Backup:** Azure Cosmos DB (MongoDB-compatible)

All writes (`create`, `update`, `delete`) are executed on both clusters simultaneously via `dualWrite()` in `shoeController.js`. All reads attempt the primary first and fall back to the backup automatically if Atlas is unavailable.

### Shoe Schema

```js
{
  shoe_name: String,
  brand:     String,
  color:     [String],
  price:     Number,          // in Philippine Peso (₱)
  category:  String,          // "Lifestyle" | "Sports" | "Basketball" | ...
  gender:    String,          // "Mens" | "Womens" | "Unisex" | "Kids"
  imageUrl:  [String],        // Cloudinary URLs
  isDeleted: Boolean,         // soft delete flag
  deletedAt: Date             // set on soft delete
}
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Gemini API key
- Cloudinary account

### Environment Variables

Create a `.env` file in `/server`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
BACKUP_MONGO_URI=your_azure_cosmos_connection_string
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
JWT_SECRET=your_jwt_secret
```

### Installation

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### Running the App

```bash
# Start backend (from /server)
npm run dev

# Start frontend (from /client)
npm start
```

App runs at `http://localhost:3000`, API at `http://localhost:5000`.

---

## Key Features

- **Dual-database resilience** — automatic failover from Atlas to Azure
- **Soft delete + Trash** — shoes can be recovered after deletion
- **AI inventory assistant** — natural language CRUD via SoleBot
- **Multi-turn conversation** — SoleBot remembers context across messages
- **Rate limiting** — 30 AI requests/min per user to protect API quota
- **Image uploads** — multi-image support via Cloudinary
- **Cart system** — per-user persistent cart with quantity management
- **JWT authentication** — protected routes for users and admins
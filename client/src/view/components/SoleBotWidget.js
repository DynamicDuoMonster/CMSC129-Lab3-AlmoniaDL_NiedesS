import api from "../../api";
const { useState, useEffect, useRef, useCallback } = require("react");

// ─────────────────────────────────────────────────────────────────────────────
// Tiny markdown → React renderer (bold, inline-code, line-breaks only)
// Avoids pulling in a full markdown library
// ─────────────────────────────────────────────────────────────────────────────
const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts = [];
    let remaining = line;
    let key = 0;
    while (remaining.length) {
      // **bold**
      const bold = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)/s);
      // `code`
      const code = remaining.match(/^(.*?)`(.+?)`(.*)/s);
      if (bold && (!code || bold.index <= code.index)) {
        if (bold[1]) parts.push(<span key={key++}>{bold[1]}</span>);
        parts.push(<strong key={key++}>{bold[2]}</strong>);
        remaining = bold[3];
      } else if (code) {
        if (code[1]) parts.push(<span key={key++}>{code[1]}</span>);
        parts.push(
          <code
            key={key++}
            style={{
              background: "#f5f5f5",
              border: "0.5px solid #e5e5e5",
              borderRadius: 4,
              padding: "1px 5px",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
            }}
          >
            {code[2]}
          </code>
        );
        remaining = code[3];
      } else {
        parts.push(<span key={key++}>{remaining}</span>);
        remaining = "";
      }
    }
    return (
      <span key={li}>
        {parts}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Message bubble
// ─────────────────────────────────────────────────────────────────────────────
const Bubble = ({ msg }) => {
  const isUser = msg.role === "user";
  const isError = msg.type === "error";
  const isConfirm = msg.type === "confirmation";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 8,
        animation: "fadeSlideIn 0.18s ease-out",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#1a1a1a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginRight: 8,
            marginTop: 2,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
              fill="white"
              opacity="0.9"
            />
          </svg>
        </div>
      )}
      <div
        style={{
          maxWidth: "78%",
          padding: "9px 13px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
          background: isUser
            ? "#1a1a1a"
            : isError
            ? "#fef2f2"
            : isConfirm
            ? "#fffbeb"
            : "#f5f5f5",
          color: isUser
            ? "#ffffff"
            : isError
            ? "#b91c1c"
            : isConfirm
            ? "#92400e"
            : "#1a1a1a",
          border: isUser
            ? "none"
            : isError
            ? "0.5px solid #fca5a5"
            : isConfirm
            ? "0.5px solid #fcd34d"
            : "0.5px solid #e5e5e5",
          fontSize: 13.5,
          lineHeight: 1.55,
          wordBreak: "break-word",
        }}
      >
        {renderMarkdown(msg.content)}
        {msg.timestamp && (
          <div
            style={{
              fontSize: 10,
              marginTop: 4,
              opacity: 0.45,
              textAlign: isUser ? "right" : "left",
            }}
          >
            {msg.timestamp}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Typing indicator
// ─────────────────────────────────────────────────────────────────────────────
const TypingDots = () => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 8 }}>
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "#1a1a1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
          fill="white"
          opacity="0.9"
        />
      </svg>
    </div>
    <div
      style={{
        padding: "10px 14px",
        borderRadius: "4px 16px 16px 16px",
        background: "#f5f5f5",
        border: "0.5px solid #e5e5e5",
        display: "flex",
        gap: 5,
        alignItems: "center",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#666666",
            animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Quick-action chips
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  "What's in stock?",
  "Show me Nikes",
  "Inventory summary",
  "Cheapest shoes",
  "New arrivals",
];

const QuickChip = ({ label, onClick }) => (
  <button
    onClick={() => onClick(label)}
    style={{
      background: "#ffffff",
      border: "0.5px solid #d4d4d4",
      borderRadius: 20,
      padding: "5px 12px",
      fontSize: 12,
      color: "#666666",
      cursor: "pointer",
      whiteSpace: "nowrap",
      flexShrink: 0,
      transition: "all 0.15s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "#f5f5f5";
      e.currentTarget.style.color = "#1a1a1a";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "#ffffff";
      e.currentTarget.style.color = "#666666";
    }}
  >
    {label}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main widget
// ─────────────────────────────────────────────────────────────────────────────
const CRUD_TYPES = new Set(["action_complete", "confirmation"]);

const SoleBotWidget = ({ onInventoryChange }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ── Load history on first open ─────────────────────────────────────────
  useEffect(() => {
    if (open && !hasLoaded) {
      setHasLoaded(true);
      api
        .get("/api/chat/history")
        .then((res) => {
          if (res.data.success && res.data.history.length) {
            const hydrated = res.data.history.map((h) => ({
              id: Math.random(),
              role: h.role === "assistant" ? "assistant" : "user",
              content: h.message,
              type: "text",
            }));
            setMessages(hydrated);
          } else {
            setMessages([
              {
                id: 0,
                role: "assistant",
                content:
                  "Yo! I'm **SoleBot** — your sneaker expert. Ask me anything about the inventory, or tell me to add, update, or delete shoes. What can I do for you? 👟",
                type: "text",
              },
            ]);
          }
        })
        .catch(() => {
          setMessages([
            {
              id: 0,
              role: "assistant",
              content:
                "Yo! I'm **SoleBot** — your sneaker expert. Ask me anything about the inventory, or tell me to add, update, or delete shoes. What can I do for you? 👟",
              type: "text",
            },
          ]);
        });
    }
  }, [open, hasLoaded]);

  // ── Scroll to bottom ───────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (open) setUnread(0);
  }, [messages, open]);

  // ── Focus input on open ────────────────────────────────────────────────
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // ── Send message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || input).trim();
      if (!trimmed || loading) return;

      const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const userMsg = { id: Date.now(), role: "user", content: trimmed, type: "text", timestamp: ts };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await api.post("/api/chat", { message: trimmed });
        const data = res.data;

        if (!data.success) throw new Error(data.message || "Unknown error");

        const botMsg = {
          id: Date.now() + 1,
          role: "assistant",
          content: data.message,
          type: data.type || "text",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, botMsg]);

        // If it was a successful CRUD op, tell the parent to re-fetch
        if (data.type === "action_complete" && typeof onInventoryChange === "function") {
          onInventoryChange();
        }

        if (!open) setUnread((n) => n + 1);
      } catch (err) {
        const errMsg = {
          id: Date.now() + 1,
          role: "assistant",
          content:
            err.response?.status === 429
              ? "Slow down a bit — you're hitting the rate limit. Give me a sec! 😅"
              : err.response?.data?.message ||
                "Something went wrong. Please try again.",
          type: "error",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [input, loading, open, onInventoryChange]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    api
      .delete("/api/chat/session")
      .then(() => {
        setMessages([
          {
            id: Date.now(),
            role: "assistant",
            content: "Conversation cleared. Fresh start! What do you need? 👟",
            type: "text",
          },
        ]);
      })
      .catch(() => {});
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Keyframe animations injected once ── */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-5px); }
        }
        @keyframes widgetOpen {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.06); }
        }
        .solebot-input::placeholder { color: #999999; }
        .solebot-send:hover { background: #f5f5f5 !important; }
        .solebot-send:active { transform: scale(0.95); }
      `}</style>

      {/* ── FAB trigger button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close SoleBot chat" : "Open SoleBot chat"}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "#1a1a1a",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
          transition: "transform 0.18s, box-shadow 0.18s",
          animation: !open && unread > 0 ? "pulse 2s ease-in-out infinite" : "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.22)";
        }}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
              fill="white"
            />
          </svg>
        )}
        {unread > 0 && !open && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              background: "#e24b4a",
              color: "white",
              borderRadius: "50%",
              width: 18,
              height: 18,
              fontSize: 10,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid white",
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {/* ── Chat window ── */}
      {open && (
        <div
          role="dialog"
          aria-label="SoleBot chat"
          style={{
            position: "fixed",
            bottom: 86,
            right: 24,
            zIndex: 9998,
            width: 360,
            maxWidth: "calc(100vw - 48px)",
            height: 540,
            maxHeight: "calc(100vh - 120px)",
            background: "#ffffff",
            border: "0.5px solid #d4d4d4",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
            animation: "widgetOpen 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              background: "#1a1a1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
                    fill="white"
                  />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: "#fff", lineHeight: 1.2 }}>
                  SoleBot
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: loading ? "#f0c040" : "#4ade80",
                      display: "inline-block",
                    }}
                  />
                  {loading ? "Thinking..." : "Online"}
                </div>
              </div>
            </div>
            <button
              onClick={clearChat}
              title="Clear conversation"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                borderRadius: 8,
                padding: "5px 8px",
                cursor: "pointer",
                color: "rgba(255,255,255,0.6)",
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 4l16 16M4 20L20 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Clear
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px 14px 4px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messages.map((msg) => (
              <Bubble key={msg.id} msg={msg} />
            ))}
            {loading && <TypingDots />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions (shown only when chat is "fresh") */}
          {messages.length <= 1 && !loading && (
            <div
              style={{
                padding: "6px 14px",
                display: "flex",
                gap: 6,
                overflowX: "auto",
                flexShrink: 0,
                borderTop: "0.5px solid #e5e5e5",
                scrollbarWidth: "none",
              }}
            >
              {QUICK_ACTIONS.map((q) => (
                <QuickChip key={q} label={q} onClick={sendMessage} />
              ))}
            </div>
          )}

          {/* Input area */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "0.5px solid #e5e5e5",
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              flexShrink: 0,
            }}
          >
            <textarea
              ref={inputRef}
              className="solebot-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about shoes, or give a command..."
              rows={1}
              disabled={loading}
              style={{
                flex: 1,
                resize: "none",
                border: "0.5px solid #d4d4d4",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 13.5,
                fontFamily: "var(--font-sans)",
                color: "#1a1a1a",
                background: "#f5f5f5",
                outline: "none",
                lineHeight: 1.5,
                overflow: "hidden",
                minHeight: 36,
                transition: "border 0.15s",
                opacity: loading ? 0.6 : 1,
              }}
              onFocus={(e) => (e.target.style.border = "0.5px solid #a3a3a3")}
              onBlur={(e) => (e.target.style.border = "0.5px solid #d4d4d4")}
            />
            <button
              className="solebot-send"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: input.trim() && !loading ? "#1a1a1a" : "#f5f5f5",
                border: "0.5px solid #d4d4d4",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.15s, transform 0.1s",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                style={{ transform: "rotate(90deg)" }}
              >
                <path
                  d="M12 4l8 8-8 8M4 12h16"
                  stroke={input.trim() && !loading ? "white" : "#999999"}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SoleBotWidget;
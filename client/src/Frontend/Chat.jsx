import { useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const WELCOME = "Assalam-o-Alaikum! Welcome to our restaurant. What would you like to order?";

const SUGGESTIONS = [
  { label: "View menu", message: "Bhai menu dikhao" },
  { label: "Order 2 Zinger burgers", message: "Bhai 2 Zinger burgers laga do" },
  { label: "Check order status", message: "What is the status of my order?" },
];

/* ---------------------------------------------------------------
 * Small markdown renderer. It builds React elements (no
 * dangerouslySetInnerHTML), so bot text can never inject HTML.
 * --------------------------------------------------------------- */
const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const UL = /^\s*[-*•]\s+/;
const OL = /^\s*\d+[.)]\s+/;
const HEADING = /^#{1,4}\s+/;

function renderInline(text) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*)/g).map((part, i) => {
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function parseBlocks(md) {
  const lines = md.replace(/\r/g, "").split("\n");
  const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // table
    if (line.includes("|") && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) {
        rows.push(cells(lines[i]));
        i++;
      }
      blocks.push({ type: "table", head, rows });
      continue;
    }

    // heading
    if (HEADING.test(line)) {
      blocks.push({ type: "heading", text: line.replace(HEADING, "") });
      i++;
      continue;
    }

    // list
    if (UL.test(line) || OL.test(line)) {
      const ordered = OL.test(line);
      const re = ordered ? OL : UL;
      const items = [];
      while (i < lines.length && re.test(lines[i])) {
        items.push(lines[i].replace(re, ""));
        i++;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    // paragraph (always consumes at least one line)
    const para = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !HEADING.test(lines[i]) &&
      !UL.test(lines[i]) &&
      !OL.test(lines[i]) &&
      !(lines[i].includes("|") && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1]))
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push({ type: "paragraph", lines: para });
  }

  return blocks;
}

function Markdown({ text }) {
  return parseBlocks(text).map((block, i) => {
    switch (block.type) {
      case "table":
        return (
          <div className="tablewrap" key={i}>
            <table>
              <thead>
                <tr>
                  {block.head.map((h, j) => (
                    <th key={j}>{renderInline(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((c, j) => (
                      <td key={j}>{renderInline(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "heading":
        return (
          <p className="h" key={i}>
            {renderInline(block.text)}
          </p>
        );
      case "list": {
        const Tag = block.ordered ? "ol" : "ul";
        return (
          <Tag key={i}>
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item)}</li>
            ))}
          </Tag>
        );
      }
      default:
        return (
          <p key={i}>
            {block.lines.map((l, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {renderInline(l)}
              </span>
            ))}
          </p>
        );
    }
  });
}

/* --------------------------------------------------------------- */

export default function Chat() {
  const [messages, setMessages] = useState([{ id: 0, role: "bot", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const history = useRef([]); // what we send to the backend
  const nextId = useRef(1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const addMessage = (role, text, error = false) =>
    setMessages((prev) => [...prev, { id: nextId.current++, role, text, error }]);

  // keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  // auto-grow the textarea (max ~5 lines)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [input]);

  // give focus back after the bot replies
  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  async function sendMessage(raw) {
    const text = raw.trim();
    if (busy || !text) return;

    addMessage("user", text);
    setInput("");
    setBusy(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history.current }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");

      const reply = data.reply || "No reply received.";
      addMessage("bot", reply);
      history.current = [
        ...history.current,
        { role: "user", content: text },
        { role: "assistant", content: reply },
      ];
    } catch (err) {
      addMessage("bot", `Something went wrong: ${err.message}. Please try again.`, true);
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  // Enter = send, Shift + Enter = new line
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function startNewChat() {
    history.current = [];
    nextId.current = 1;
    setMessages([{ id: 0, role: "bot", text: WELCOME }]);
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="chat-page">
      <main className="chat">
        <header>
          <div className="logo" aria-hidden="true">R</div>
          <div className="title">
            <h1>Restaurant AI</h1>
            <p>Ask about the menu, place an order, or check an order</p>
          </div>
          <button id="newChat" type="button" onClick={startNewChat}>
            New chat
          </button>
        </header>

        <section id="messages" aria-live="polite">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`message ${m.role}${m.error ? " error" : ""}`}
            >
              {m.role === "bot" ? <Markdown text={m.text} /> : m.text}
            </div>
          ))}

          {busy && (
            <div className="message bot typing" aria-label="Assistant is typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
          <div ref={bottomRef} />
        </section>

        <div className="suggestions">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              disabled={busy}
              onClick={() => sendMessage(s.message)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="composer">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message"
              aria-label="Message"
              disabled={busy}
            />
            <button id="send" type="submit" aria-label="Send message" disabled={busy || !input.trim()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2 11 13" />
                <path d="M22 2 15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
          <p className="hint">Enter sends your message. Shift + Enter adds a new line.</p>
        </form>
      </main>
    </div>
  );
}

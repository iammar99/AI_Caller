// Usage: npm run chat   (server must be running)
const readline = require("readline");
const URL = process.env.AGENT_URL || "http://localhost:5000/api/agent/chat";
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let conversationId;

const ask = () =>
  rl.question("You: ", async (message) => {
    if (!message.trim()) return ask();
    try {
      const res = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      conversationId = data.conversationId;
      (data.toolLog || []).forEach((t) => console.log(`   [tool] ${t.tool}(${t.args})`));
      console.log(`Bot: ${data.reply}\n`);
    } catch (err) {
      console.log("Error:", err.message, "\n");
    }
    ask();
  });

console.log("Restaurant agent chat. Ctrl+C to quit.\n");
ask();

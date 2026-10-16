const { chatWithAI } = require("../services/aiService");

async function chat(req, res, next) {
  try {
    const { message, history = [] } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "A message is required",
      });
    }

    const reply = await chatWithAI(message, history);

    res.json({ reply });
  } catch (error) {
    next(error);
  }
}

module.exports = { chat };
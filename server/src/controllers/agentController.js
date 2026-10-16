const { runAgent } = require("../services/aiService");

exports.chat = async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }
    const result = await runAgent({ message, previousResponseId: conversationId });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

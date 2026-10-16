require("dotenv").config();
const { chatWithAI } = require("./services/aiService");

(async () => {
  const reply = await chatWithAI("Bhai, kya haal hai?");
  console.log(reply);
})();

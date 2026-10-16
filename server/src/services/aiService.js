const Groq = require("groq-sdk");
const { toolDefinitions, toolHandlers } = require("./toolService");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


const groqTools = toolDefinitions.map((tool) => ({
  type: "function",
  function: {
    name: tool.name,
    description: tool.description,
    parameters: {
      ...tool.parameters,
      additionalProperties: false,
    },
  },
}));

async function chatWithAI(message, history = []) {
  const messages = [
    {
      role: "system",
      content: `
        You are a friendly restaurant ordering assistant.
        Understand English and Roman Urdu.
        Keep replies short.

        Use tools for actual menu information.
        Before placing an order, collect the customer's name,
        phone, order type, and delivery address if applicable.
        Show the items and total and obtain explicit confirmation.
        Never claim an order was placed unless create_order succeeds.
      `,
    },
    ...history,
    { role: "user", content: message },
  ];

  for (let turn = 0; turn < 5; turn++) {
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages,
      tools: groqTools,
      tool_choice: "auto",
    });

    const assistantMessage = response.choices[0].message;
    messages.push(assistantMessage);

    if (!assistantMessage.tool_calls?.length) {
      return assistantMessage.content || "Sorry, please try again.";
    }

    for (const toolCall of assistantMessage.tool_calls) {
      const name = toolCall.function.name;
      const handler = toolHandlers[name];

      if (!handler) {
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: "Unknown tool" }),
        });
        continue;
      }

      try {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await handler(args);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      } catch (error) {
        console.error(`Tool "${name}" failed:`, error.message);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error: error.message || "Tool execution failed",
          }),
        });
      }
    }
  }

  return "Please try a simpler request.";
}

module.exports = { chatWithAI };
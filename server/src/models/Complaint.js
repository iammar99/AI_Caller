const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    customerName: { type: String, default: "" },
    phone: { type: String, required: true, trim: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
    source: { type: String, enum: ["ai_chat", "call", "manual"], default: "ai_chat" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);

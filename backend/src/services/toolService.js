const mongoose = require("mongoose");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const Complaint = require("../models/Complaint");
const orderService = require("./orderService");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const slimItem = (i) => ({
  id: String(i._id),
  name: i.name,
  price: i.price,
  category: i.category,
  description: i.description,
  available: i.available,
});

/* ------------------------------------------------------------------ *
 * 1. TOOL DEFINITIONS - this is all the AI ever sees.
 *    The description is what tells the model WHEN to use each tool.
 * ------------------------------------------------------------------ */
const toolDefinitions = [
  {
    type: "function",
    name: "get_menu",
    description:
      "Get the list of currently available menu items with prices. Use when the customer asks what is available, or you need to browse a category.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Optional category filter: Burgers, Sides, Pizza, Drinks, Desserts",
        },
      },
    },
  },
  {
    type: "function",
    name: "get_item_details",
    description:
      "Search the menu by item name (partial match, any case) and return matching items with id, price and availability. ALWAYS use this to find the item id and price before creating an order.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Item name or part of it, e.g. 'zinger' or 'coke'" },
      },
      required: ["query"],
    },
  },
  {
    type: "function",
    name: "check_availability",
    description: "Check whether one specific menu item is currently available.",
    parameters: {
      type: "object",
      properties: { item_id: { type: "string", description: "Menu item id from get_item_details/get_menu" } },
      required: ["item_id"],
    },
  },
  {
    type: "function",
    name: "create_order",
    description:
      "Place the order. Call this ONLY after the customer has explicitly confirmed the items, quantities, total, name, phone and (for delivery) address.",
    parameters: {
      type: "object",
      properties: {
        customer_name: { type: "string" },
        phone: { type: "string" },
        order_type: { type: "string", enum: ["delivery", "pickup"] },
        address: { type: "string", description: "Required for delivery" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              menu_item_id: { type: "string" },
              quantity: { type: "integer", minimum: 1 },
            },
            required: ["menu_item_id", "quantity"],
          },
        },
      },
      required: ["customer_name", "phone", "order_type", "items"],
    },
  },
  {
    type: "function",
    name: "get_order_status",
    description:
      "Look up an order's status. Provide the order id if the customer has it, otherwise the phone number to get their most recent order.",
    parameters: {
      type: "object",
      properties: {
        order_id: { type: "string" },
        phone: { type: "string" },
      },
    },
  },
  {
    type: "function",
    name: "create_complaint",
    description: "Record a customer complaint (wrong item, late delivery, quality, etc.) for the restaurant staff.",
    parameters: {
      type: "object",
      properties: {
        customer_name: { type: "string" },
        phone: { type: "string" },
        order_id: { type: "string", description: "Optional related order id" },
        message: { type: "string", description: "What went wrong, in the customer's words" },
      },
      required: ["phone", "message"],
    },
  },
];

/* ------------------------------------------------------------------ *
 * 2. TOOL HANDLERS - real code that talks to MongoDB.
 *    The AI never touches the DB; it only requests these by name.
 * ------------------------------------------------------------------ */
const toolHandlers = {
  async get_menu({ category } = {}) {
    const filter = { available: true };
    if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    return { items: items.map(slimItem) };
  },

  async get_item_details({ query }) {
    if (!query) throw new Error("query is required");
    const items = await MenuItem.find({ name: new RegExp(escapeRegex(query), "i") });
    if (items.length === 0) return { items: [], note: "No matching item on the menu" };
    return { items: items.map(slimItem) };
  },

  async check_availability({ item_id }) {
    if (!mongoose.isValidObjectId(item_id)) throw new Error("Invalid item_id");
    const item = await MenuItem.findById(item_id);
    if (!item) throw new Error("Item not found");
    return { id: String(item._id), name: item.name, available: item.available };
  },

  async create_order({ customer_name, phone, order_type, address, items }) {
    // Backend does ALL validation + pricing (see orderService). The AI can't fake prices.
    const order = await orderService.createOrder({
      customerName: customer_name,
      phone,
      orderType: order_type,
      address,
      source: "ai_chat",
      items: (items || []).map((i) => ({ menuItem: i.menu_item_id, quantity: i.quantity })),
    });
    return {
      order_id: String(order._id),
      status: order.status,
      total: order.total,
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
    };
  },

  async get_order_status({ order_id, phone }) {
    let order;
    if (order_id) {
      if (!mongoose.isValidObjectId(order_id)) throw new Error("Invalid order_id");
      order = await Order.findById(order_id);
    } else if (phone) {
      order = await Order.findOne({ phone }).sort({ createdAt: -1 });
    } else {
      throw new Error("Provide order_id or phone");
    }
    if (!order) return { found: false };
    return {
      found: true,
      order_id: String(order._id),
      status: order.status,
      total: order.total,
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity })),
      placed_at: order.createdAt,
    };
  },

  async create_complaint({ customer_name, phone, order_id, message }) {
    const complaint = await Complaint.create({
      customerName: customer_name || "",
      phone,
      order: mongoose.isValidObjectId(order_id) ? order_id : null,
      message,
    });
    return { complaint_id: String(complaint._id), status: complaint.status };
  },
};

module.exports = { toolDefinitions, toolHandlers };

const mongoose = require("mongoose");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

// Prices are always read from the DB, never trusted from the client.
async function createOrder({ customerName, phone, address, orderType, items, source }) {
  if (!customerName || !phone) throw badRequest("customerName and phone are required");
  if (!Array.isArray(items) || items.length === 0) throw badRequest("items must be a non-empty array");
  if ((orderType || "delivery") === "delivery" && !address) throw badRequest("address is required for delivery");

  const lines = [];
  let total = 0;

  for (const { menuItem, quantity } of items) {
    const qty = Number(quantity);
    if (!mongoose.isValidObjectId(menuItem)) throw badRequest(`Invalid menuItem id: ${menuItem}`);
    if (!Number.isInteger(qty) || qty < 1) throw badRequest("quantity must be a positive integer");

    const dbItem = await MenuItem.findById(menuItem);
    if (!dbItem) throw badRequest(`Menu item not found: ${menuItem}`);
    if (!dbItem.available) throw badRequest(`${dbItem.name} is currently unavailable`);

    lines.push({ menuItem: dbItem._id, name: dbItem.name, price: dbItem.price, quantity: qty });
    total += dbItem.price * qty;
  }

  return Order.create({ customerName, phone, address, orderType, items: lines, total, source });
}

module.exports = { createOrder };

const Order = require("../models/Order");
const orderService = require("../services/orderService");
const mongoose = require("mongoose");

exports.createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  } 
};

exports.getOrders = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.phone) filter.phone = req.query.phone;
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};
 

// exports.getOrderItem = async (req, res, next) => {
//   try {
    
//     const item = await Order.findById(req.params.id);
//     if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
//     if (!item) return res.status(404).json({ error: "Order  not found" });
//     res.json(item);
//   } catch (err) {
//     next(err);
//   }
// };


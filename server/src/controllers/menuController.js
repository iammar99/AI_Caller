const mongoose = require("mongoose");
const MenuItem = require("../models/MenuItem");

exports.getMenu = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.available !== undefined) filter.available = req.query.available === "true";
    if (req.query.category) filter.category = req.query.category;
    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.getMenuItem = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Menu item not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

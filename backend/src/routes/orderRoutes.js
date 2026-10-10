const router = require("express").Router();
const { createOrder, getOrders , getOrderItem} = require("../controllers/orderController");

router.post("/", createOrder);
router.get("/", getOrders);
// router.get("/:id", getOrderItem);


module.exports = router;

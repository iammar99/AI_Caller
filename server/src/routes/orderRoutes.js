const router = require("express").Router();
const { createOrder, getOrders } = require("../controllers/orderController");

router.post("/", createOrder);
router.get("/", getOrders);
// router.get("/:id", getOrderItem);


module.exports = router;

const router = require("express").Router();
const { getMenu, getMenuItem } = require("../controllers/menuController");

router.get("/", getMenu);
router.get("/:id", getMenuItem);

module.exports = router;

const express = require("express");
const controller = require("../controllers/transactionController");

const router = express.Router();

router.post("/", controller.addTransaction);
router.post("/feedback", controller.feedback);
router.get("/", controller.getAll);
router.get("/recent", controller.getRecent);

module.exports = router;
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");

const sauceCTRL = require("../controllers/sauce");

router.get("/", auth, sauceCTRL.getAllItems);
router.get("/:id", auth, sauceCTRL.getOneItem);
router.post("/", auth, multer, sauceCTRL.createItem);
router.put("/:id", auth, multer, sauceCTRL.updateItem);
router.post("/:id/like", auth, sauceCTRL.usersLikes);
router.delete("/:id", auth, sauceCTRL.deleteItem);

module.exports = router;

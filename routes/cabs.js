const express = require("express");
const router = express.Router();
const multer = require("multer");
const cabs = require("../controllers/cabs");
const { isLoggedIn } = require("../middleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.route("/")
  .get(cabs.index)
  .post(isLoggedIn, upload.single("image"), cabs.createCab);

router.get("/new", isLoggedIn, cabs.renderNewForm);
router.get("/:id", cabs.showCab);

module.exports = router;

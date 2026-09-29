const express = require("express");
const router = express.Router();

// Bus home page
router.get("/", (req, res) => {
  res.render("buses/index");
});

// Bus search
router.get("/search", (req, res) => {
  res.render("buses/index");
});

module.exports = router;

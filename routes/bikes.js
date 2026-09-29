const express = require("express");
const router = express.Router();

// Bike home page
router.get("/", (req, res) => {
  res.render("bikes/index");
});

// Bike search
router.get("/search", (req, res) => {
  res.render("bikes/index");
});

module.exports = router;

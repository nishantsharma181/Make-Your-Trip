const express = require("express");
const router = express.Router();


// ===============================
// BIKE HOME PAGE
// ===============================

router.get("/", (req, res) => {

  res.render("bikes/index", {
    selectedType: ""
  });

});


// ===============================
// BIKE SEARCH
// ===============================

router.get("/search", (req, res) => {

  const selectedType = req.query.type || "";

  res.render("bikes/index", {
    selectedType: selectedType
  });

});


module.exports = router;

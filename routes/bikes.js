const express = require("express");
const router = express.Router();

const Bike = require("../models/Bike");


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


// ===============================
// BIKE DETAIL PAGE
// ===============================

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const bike = await Bike.findById(id);

    if (!bike) {
      const err = new Error("Bike not found");
      err.statusCode = 404;
      return next(err);
    }

    res.render("bikes/show", {
      bike
    });

  } catch (err) {
    next(err);
  }
});


module.exports = router;

const express = require("express");
const router = express.Router();

const Bike = require("../models/Bike");


// ===============================
// BIKE HOME PAGE
// ===============================

router.get("/", async (req, res, next) => {
  try {
    const bikes = await Bike.find({});

    res.render("bikes/index", {
      bikes,
      selectedType: ""
    });

  } catch (err) {
    next(err);
  }
});


// ===============================
// BIKE SEARCH
// ===============================

router.get("/search", async (req, res, next) => {
  try {
    const selectedType = req.query.type || "";

    const bikes = await Bike.find({});

    res.render("bikes/index", {
      bikes,
      selectedType
    });

  } catch (err) {
    next(err);
  }
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

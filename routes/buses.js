const express = require("express");
const router = express.Router();

const Bus = require("../models/Bus");


// ===============================
// ALL BUSES
// ===============================

router.get("/", async (req, res, next) => {
  try {
    const buses = await Bus.find({});

    res.render("buses/index", {
      buses,
      selectedType: "",
      from: "",
      to: ""
    });
  } catch (err) {
    next(err);
  }
});


// ===============================
// SEARCH BUSES
// ===============================

router.get("/search", async (req, res, next) => {
  try {
    const from = req.query.from || "";
    const to = req.query.to || "";
    const selectedType = req.query.type || "";

    const query = {};

    if (from) {
      query.from = {
        $regex: from,
        $options: "i"
      };
    }

    if (to) {
      query.to = {
        $regex: to,
        $options: "i"
      };
    }

    if (selectedType) {
      query.busType = selectedType;
    }

    const buses = await Bus.find(query);

    res.render("buses/index", {
      buses,
      selectedType,
      from,
      to
    });
  } catch (err) {
    next(err);
  }
});


// ===============================
// BUS DETAILS
// ===============================

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const bus = await Bus.findById(id);

    if (!bus) {
      const err = new Error("Bus not found");
      err.statusCode = 404;
      return next(err);
    }

    res.render("buses/show", {
      bus
    });
  } catch (err) {
    next(err);
  }
});


module.exports = router;

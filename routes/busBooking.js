const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");
const busBookingController = require("../controllers/busBooking");

// Booking form
router.get(
  "/new/:busId",
  isLoggedIn,
  wrapAsync(busBookingController.newBooking)
);

module.exports = router;

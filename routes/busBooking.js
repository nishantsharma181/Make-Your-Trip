const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, requirePhone } = require("../middleware");
const busBookingController = require("../controllers/busBooking");

// ===============================
// Show Booking Form
// ===============================
router.get(
  "/new/:busId",
  isLoggedIn,
  requirePhone,
  wrapAsync(busBookingController.newBooking)
);

// ===============================
// Create Bus Booking
// ===============================
router.post(
  "/:busId",
  isLoggedIn,
  requirePhone,
  wrapAsync(busBookingController.createBooking)
);

module.exports = router;

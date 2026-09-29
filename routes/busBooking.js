const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");
const busBookingController = require("../controllers/busBooking");

// ===============================
// Show Booking Form
// ===============================
router.get(
  "/new/:busId",
  isLoggedIn,
  wrapAsync(busBookingController.newBooking)
);

// ===============================
// Create Bus Booking
// ===============================
router.post(
  "/:busId",
  isLoggedIn,
  wrapAsync(busBookingController.createBooking)
);

module.exports = router;

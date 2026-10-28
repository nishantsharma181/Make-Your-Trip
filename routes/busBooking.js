const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync");
const { bookingLimiter } = require("../middleware");
const busBookingController = require("../controllers/busBooking");

// ===============================
// Show Booking Form (bina login ke)
// ===============================
router.get(
  "/new/:busId",
  wrapAsync(busBookingController.newBooking)
);

// ===============================
// Create Bus Booking (bina login ke, spam limiter ke saath)
// ===============================
router.post(
  "/:busId",
  bookingLimiter,
  wrapAsync(busBookingController.createBooking)
);

module.exports = router;

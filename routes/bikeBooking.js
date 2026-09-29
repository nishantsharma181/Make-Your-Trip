const express = require("express");
const router = express.Router();

const bikeBookings = require("../controllers/bikeBooking");
const { isLoggedIn } = require("../middleware");


// ===============================
// MY BIKE BOOKINGS
// ===============================

router.get(
  "/my-bookings",
  isLoggedIn,
  bikeBookings.myBookings
);


// ===============================
// BOOKING FORM
// ===============================

router.get(
  "/new/:bikeId",
  isLoggedIn,
  bikeBookings.renderBookingForm
);


// ===============================
// CREATE BOOKING
// ===============================

router.post(
  "/",
  isLoggedIn,
  bikeBookings.createBooking
);


// ===============================
// BOOKING DETAILS
// ===============================

router.get(
  "/:id",
  isLoggedIn,
  bikeBookings.showBooking
);


// ===============================
// CANCEL BOOKING
// ===============================

router.put(
  "/:id/cancel",
  isLoggedIn,
  bikeBookings.cancelBooking
);


module.exports = router;

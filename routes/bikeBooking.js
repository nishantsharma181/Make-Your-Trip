const express = require("express");
const router = express.Router();

const bikeBookings = require("../controllers/bikeBooking");

// My Bike Bookings
router.get("/my-bookings", bikeBookings.myBookings);

// Booking Form
router.get("/new/:bikeId", bikeBookings.renderBookingForm);

// Create Booking
router.post("/", bikeBookings.createBooking);

// Booking Details
router.get("/:id", bikeBookings.showBooking);

// Cancel Booking
router.put("/:id/cancel", bikeBookings.cancelBooking);

module.exports = router;

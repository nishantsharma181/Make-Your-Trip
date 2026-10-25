const express = require("express");
const router = express.Router();
const cabBookings = require("../controllers/cabBooking");
const { isLoggedIn, requirePhone } = require("../middleware");

router.get("/my-bookings", isLoggedIn, cabBookings.myBookings);
router.get("/new/:cabId", isLoggedIn, requirePhone, cabBookings.renderBookingForm);
router.post("/", isLoggedIn, requirePhone, cabBookings.createBooking);

router.route("/:id")
  .get(isLoggedIn, cabBookings.showBooking);

router.put("/:id/cancel", isLoggedIn, cabBookings.cancelBooking);

module.exports = router;

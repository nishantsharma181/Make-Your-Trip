const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, requirePhone } = require("../middleware");
const flightController =
require("../controllers/flights");

router.get("/", wrapAsync(flightController.index));

router.get("/search",
 wrapAsync(flightController.search));

router.get(
    "/my-bookings",
    isLoggedIn,
    wrapAsync(
        flightController.myBookings
    )
);

router.get("/:id",
 wrapAsync(flightController.show));

router.post(
 "/book/:id",
 isLoggedIn,
 requirePhone,
 wrapAsync(flightController.bookFlight)
);

router.delete(
    "/booking/:bookingId",
    isLoggedIn,
    wrapAsync(
        flightController.cancelBooking
    )
);

module.exports = router;

const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isAdmin } = require("../middleware");
const admin = require("../controllers/admin");

// Everything under /admin is only for the organization.
router.use(isLoggedIn, isAdmin);

router.get("/", wrapAsync(admin.dashboard));

router.get("/bookings", wrapAsync(admin.bookings));
router.get("/bookings.csv", wrapAsync(admin.exportCsv));

router.put("/bookings/:type/:id/status", wrapAsync(admin.updateStatus));
router.put("/bookings/:type/:id/paid", wrapAsync(admin.markPaid));

router.post("/seed-flights", wrapAsync(admin.seedFlights));

module.exports = router;

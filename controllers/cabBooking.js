const Cab = require("../models/Cab");
const CabBooking = require("../models/cabBooking");
const { canAccessBooking } = require("../middleware");
const { setStatus } = require("../utils/bookingStatus");

const PAYMENT_METHODS = ["Card", "UPI", "NetBanking", "Cash On Pickup", "Wallet"];

// 1. Render Booking Screen
module.exports.renderBookingForm = async (req, res, next) => {
  try {
    const { cabId } = req.params;
    const cab = await Cab.findById(cabId);

    if (!cab) {
      const err = new Error("Cab not found for booking");
      err.statusCode = 404;
      return next(err);
    }

    if (!cab.isAvailable) {
      req.flash("error", "This cab is currently not available.");
      return res.redirect(`/cabs/${cab._id}`);
    }

    res.render("cabs/book", { cab });
  } catch (err) {
    next(err);
  }
};

// 2. Process Booking Creation
module.exports.createBooking = async (req, res, next) => {
  try {
    const { cabId, pickup, drop, departureTime, distanceKm, tripType, paymentMethod } = req.body;

    const cab = await Cab.findById(cabId);
    if (!cab) {
      const err = new Error("Cab not found");
      err.statusCode = 404;
      return next(err);
    }

    const backToForm = `/bookings/cabs/new/${cab._id}`;

    if (!cab.isAvailable) {
      req.flash("error", "This cab is currently not available.");
      return res.redirect(`/cabs/${cab._id}`);
    }

    const departure = new Date(departureTime);
    // small grace period so "now" is accepted
    if (isNaN(departure.getTime()) || departure.getTime() < Date.now() - 5 * 60 * 1000) {
      req.flash("error", "Please choose a valid pickup date and time in the future.");
      return res.redirect(backToForm);
    }

    const distance = Number(distanceKm);
    if (!Number.isFinite(distance) || distance <= 0 || distance > 3000) {
      req.flash("error", "Please enter the trip distance in km (between 1 and 3000).");
      return res.redirect(backToForm);
    }

    const pickupAddress = String(pickup || "").trim();
    const dropAddress = String(drop || "").trim();
    if (!pickupAddress || !dropAddress) {
      req.flash("error", "Pickup and drop addresses are required.");
      return res.redirect(backToForm);
    }

    // Price is always calculated here on the server, never trusted from the form
    const baseFare = cab.pricing.baseFare;
    const distanceFare = distance * cab.pricing.pricePerKm;
    const tollAndTaxes = Math.round((baseFare + distanceFare) * 0.05); // 5% GST/Toll
    const totalFare = baseFare + distanceFare + tollAndTaxes;

    const booking = new CabBooking({
      cab: cab._id,
      user: req.user._id,
      tripType: cab.serviceTypes.includes(tripType) ? tripType : "One-Way",
      pickup: { address: pickupAddress },
      drop: { address: dropAddress },
      departureTime: departure,
      distanceKm: distance,
      fareDetails: {
        baseFare,
        distanceFare,
        tollAndTaxes,
        totalFare,
      },
      // No payment gateway yet, so payment stays "Pending" until the
      // organization marks it as received.
      payment: {
        method: PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : "UPI",
        status: "Pending",
      },
    });

    await booking.save();
    res.redirect(`/bookings/cabs/${booking._id}`);
  } catch (err) {
    next(err);
  }
};

// 3. Show Booking Confirmation / Receipt
module.exports.showBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await CabBooking.findById(id)
      .populate("cab")
      .populate("user", "username email phone");

    // Only the person who booked (or the organization) can open it
    if (!booking || !canAccessBooking(req.user, booking.user)) {
      const err = new Error("Booking confirmation not found");
      err.statusCode = 404;
      return next(err);
    }

    res.render("cabs/bookingConfirmation", { booking });
  } catch (err) {
    next(err);
  }
};

// 4. View Logged-in User's Bookings
module.exports.myBookings = async (req, res, next) => {
  try {
    const bookings = await CabBooking.find({ user: req.user._id })
      .populate("cab")
      .sort({ createdAt: -1 });

    // Skip bookings whose cab was removed, the page cannot show them
    res.render("cabs/myBookings", {
      bookings: bookings.filter((booking) => booking.cab),
    });
  } catch (err) {
    next(err);
  }
};

// 5. Cancel Booking
module.exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await CabBooking.findById(id);
    if (!booking || !canAccessBooking(req.user, booking.user)) {
      const err = new Error("Booking not found");
      err.statusCode = 404;
      return next(err);
    }

    if (["Completed", "Ongoing"].includes(booking.rideStatus)) {
      req.flash("error", "This ride can no longer be cancelled.");
      return res.redirect(`/bookings/cabs/${id}`);
    }

    if (booking.rideStatus !== "Cancelled") {
      await setStatus("cabs", booking, "Cancelled", {
        cancelledBy: "User",
        reason: reason || "Cancelled by passenger",
      });
    }

    res.redirect(`/bookings/cabs/${id}`);
  } catch (err) {
    next(err);
  }
};

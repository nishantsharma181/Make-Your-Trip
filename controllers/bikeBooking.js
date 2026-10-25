const Bike = require("../models/Bike");
const BikeBooking = require("../models/bikeBooking");
const { canAccessBooking } = require("../middleware");
const { setStatus } = require("../utils/bookingStatus");

// 1. Render Bike Booking Form
module.exports.renderBookingForm = async (req, res, next) => {
  try {
    const { bikeId } = req.params;

    const bike = await Bike.findById(bikeId);

    if (!bike) {
      const err = new Error("Bike not found for booking");
      err.statusCode = 404;
      return next(err);
    }

    res.render("bikes/book", { bike });
  } catch (err) {
    next(err);
  }
};

// 2. Create Bike Booking
module.exports.createBooking = async (req, res, next) => {
  try {
    const {
      bikeId,
      pickupDate,
      returnDate,
      paymentMethod,
    } = req.body;

    const bike = await Bike.findById(bikeId);

    if (!bike) {
      const err = new Error("Bike not found");
      err.statusCode = 404;
      return next(err);
    }

    const backToForm = `/bookings/bikes/new/${bike._id}`;

    if (!bike.isAvailable) {
      req.flash("error", "This bike is currently not available.");
      return res.redirect(backToForm);
    }

    const pickup = new Date(pickupDate);
    const returnDateObj = new Date(returnDate);

    if (
      isNaN(pickup.getTime()) ||
      isNaN(returnDateObj.getTime())
    ) {
      req.flash("error", "Please select valid pickup and return dates");
      return res.redirect(backToForm);
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (pickup < today) {
      req.flash("error", "Pickup date cannot be in the past");
      return res.redirect(backToForm);
    }

    if (returnDateObj <= pickup) {
      req.flash("error", "Return date must be after pickup date");
      return res.redirect(backToForm);
    }

    // Do not let the same bike be booked twice for overlapping dates
    const clash = await BikeBooking.exists({
      bike: bike._id,
      bookingStatus: { $ne: "Cancelled" },
      pickupDate: { $lt: returnDateObj },
      returnDate: { $gt: pickup },
    });

    if (clash) {
      req.flash("error", "This bike is already booked for those dates. Please choose other dates.");
      return res.redirect(backToForm);
    }

    // Calculate number of rental days
    const difference =
      returnDateObj.getTime() - pickup.getTime();

    const numberOfDays = Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

    // Price calculation
    const pricePerDay = bike.pricePerDay;
    const securityDeposit = bike.securityDeposit || 0;

    const rentalAmount = pricePerDay * numberOfDays;

    const totalAmount = rentalAmount + securityDeposit;

    const booking = new BikeBooking({
      bike: bike._id,
      user: req.user._id,

      pickupDate: pickup,
      returnDate: returnDateObj,

      pricePerDay,
      numberOfDays,

      securityDeposit,
      totalAmount,

      bookingStatus: "Confirmed",

      // No payment gateway yet, so payment stays "Pending" until the
      // organization marks it as received.
      payment: {
        method: paymentMethod || "UPI",
        status: "Pending",
      },
    });

    await booking.save();

    res.redirect(`/bookings/bikes/${booking._id}`);
  } catch (err) {
    next(err);
  }
};

// 3. Show Booking Confirmation
module.exports.showBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await BikeBooking.findById(id)
      .populate("bike")
      .populate("user", "username email phone");

    // Only the person who booked (or the organization) can open it
    if (!booking || !canAccessBooking(req.user, booking.user)) {
      const err = new Error("Bike booking not found");
      err.statusCode = 404;
      return next(err);
    }

    res.render("bikes/bookingConfirmation", { booking });
  } catch (err) {
    next(err);
  }
};

// 4. User's Bike Bookings
module.exports.myBookings = async (req, res, next) => {
  try {
    const bookings = await BikeBooking.find({
      user: req.user._id,
    })
      .populate("bike")
      .sort({ createdAt: -1 });

    // Skip bookings whose bike was removed, the page cannot show them
    res.render("bikes/myBookings", {
      bookings: bookings.filter((booking) => booking.bike),
    });
  } catch (err) {
    next(err);
  }
};

// 5. Cancel Bike Booking
module.exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await BikeBooking.findById(id);

    if (!booking || !canAccessBooking(req.user, booking.user)) {
      const err = new Error("Bike booking not found");
      err.statusCode = 404;
      return next(err);
    }

    if (booking.bookingStatus === "Completed") {
      req.flash("error", "A completed booking cannot be cancelled.");
      return res.redirect(`/bookings/bikes/${id}`);
    }

    if (booking.bookingStatus !== "Cancelled") {
      await setStatus("bikes", booking, "Cancelled", {
        cancelledBy: "User",
        reason: reason || "Cancelled by user",
      });
    }

    res.redirect(`/bookings/bikes/${id}`);
  } catch (err) {
    next(err);
  }
};

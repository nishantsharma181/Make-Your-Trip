const Bike = require("../models/Bike");
const BikeBooking = require("../models/bikeBooking");

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

    const pickup = new Date(pickupDate);
    const returnDateObj = new Date(returnDate);

    if (
      isNaN(pickup.getTime()) ||
      isNaN(returnDateObj.getTime())
    ) {
      const err = new Error("Please select valid pickup and return dates");
      err.statusCode = 400;
      return next(err);
    }

    if (returnDateObj <= pickup) {
      const err = new Error("Return date must be after pickup date");
      err.statusCode = 400;
      return next(err);
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

      payment: {
        method: paymentMethod || "UPI",
        status: "Paid",
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

    if (!booking) {
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

    res.render("bikes/myBookings", { bookings });
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

    if (!booking) {
      const err = new Error("Bike booking not found");
      err.statusCode = 404;
      return next(err);
    }

    booking.bookingStatus = "Cancelled";
    booking.cancelledBy = "User";
    booking.cancellationReason =
      reason || "Cancelled by user";

    await booking.save();

    res.redirect(`/bookings/bikes/${id}`);
  } catch (err) {
    next(err);
  }
};

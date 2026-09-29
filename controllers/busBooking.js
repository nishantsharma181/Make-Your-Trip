const Bus = require("../models/Bus");
const BusBooking = require("../models/busBooking");


// Show booking form
module.exports.newBooking = async (req, res) => {
  const { busId } = req.params;

  const bus = await Bus.findById(busId);

  if (!bus) {
    req.flash("error", "Bus not found.");
    return res.redirect("/buses");
  }

  if (!bus.isAvailable || bus.seatsAvailable <= 0) {
    req.flash("error", "This bus is currently unavailable.");
    return res.redirect(`/buses/${busId}`);
  }

  res.render("buses/book", { bus });
};


// Create booking
module.exports.createBooking = async (req, res) => {
  const { busId } = req.params;

  const {
    passengerName,
    passengerAge,
    passengerGender,
    travelDate,
    seatsBooked,
    boardingPoint,
    droppingPoint
  } = req.body;

  const bus = await Bus.findById(busId);

  if (!bus) {
    req.flash("error", "Bus not found.");
    return res.redirect("/buses");
  }

  const seats = Number(seatsBooked);

  if (!Number.isInteger(seats) || seats < 1) {
    req.flash("error", "Please select a valid number of seats.");
    return res.redirect(`/bookings/buses/new/${busId}`);
  }

  if (seats > bus.seatsAvailable) {
    req.flash(
      "error",
      `Only ${bus.seatsAvailable} seats are available.`
    );

    return res.redirect(`/bookings/buses/new/${busId}`);
  }

  const totalAmount = bus.price * seats;

  const booking = await BusBooking.create({
    bus: bus._id,
    user: req.user._id,
    passengerName,
    passengerAge: Number(passengerAge),
    passengerGender,
    travelDate,
    seatsBooked: seats,
    totalAmount,
    boardingPoint,
    droppingPoint,
    bookingStatus: "Confirmed",
    paymentStatus: "Pending"
  });

  bus.seatsAvailable -= seats;

  if (bus.seatsAvailable === 0) {
    bus.isAvailable = false;
  }

  await bus.save();

  res.render("buses/bookingConfirmation", {
    booking,
    bus
  });
};

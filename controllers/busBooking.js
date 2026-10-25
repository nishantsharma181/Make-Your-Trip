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

  // Travel date must be today or later
  const travel = new Date(travelDate);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (isNaN(travel.getTime()) || travel < today) {
    req.flash("error", "Please choose a valid travel date.");
    return res.redirect(`/bookings/buses/new/${busId}`);
  }

  // Take the seats in one atomic step, so the same seat can never be
  // sold twice when two people book at the same moment.
  const reserved = await Bus.findOneAndUpdate(
    { _id: bus._id, isAvailable: true, seatsAvailable: { $gte: seats } },
    { $inc: { seatsAvailable: -seats } },
    { new: true }
  );

  if (!reserved) {
    req.flash(
      "error",
      `Only ${Math.max(bus.seatsAvailable, 0)} seats are available.`
    );

    return res.redirect(`/bookings/buses/new/${busId}`);
  }

  let booking;

  try {
    booking = await BusBooking.create({
      bus: bus._id,
      user: req.user._id,
      passengerName,
      passengerAge: Number(passengerAge),
      passengerGender,
      travelDate: travel,
      seatsBooked: seats,
      totalAmount: bus.price * seats,
      boardingPoint,
      droppingPoint,
      bookingStatus: "Confirmed",
      paymentStatus: "Pending"
    });
  } catch (err) {
    // Booking was not saved, so give the seats back.
    await Bus.updateOne({ _id: bus._id }, { $inc: { seatsAvailable: seats } });
    throw err;
  }

  if (reserved.seatsAvailable === 0) {
    await Bus.updateOne({ _id: bus._id }, { isAvailable: false });
  }

  res.render("buses/bookingConfirmation", {
    booking,
    bus: reserved
  });
};

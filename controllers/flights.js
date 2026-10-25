const Flight = require("../models/flight");
const FlightBooking = require("../models/flightBooking");
const escapeRegex = require("../utils/escapeRegex");
const { setStatus } = require("../utils/bookingStatus");

// All flights
module.exports.index = async (req, res) => {
    const flights = await Flight.find({}).sort({ departureTime: 1 });
    res.render("flights/index", { flights });
};

// Search flights by source / destination (either one can be left empty)
module.exports.search = async (req, res) => {
    const source = typeof req.query.source === "string" ? req.query.source.trim() : "";
    const destination =
        typeof req.query.destination === "string" ? req.query.destination.trim() : "";

    const filter = {};

    if (source) {
        filter.source = { $regex: escapeRegex(source), $options: "i" };
    }

    if (destination) {
        filter.destination = { $regex: escapeRegex(destination), $options: "i" };
    }

    const flights = await Flight.find(filter).sort({ departureTime: 1 });

    res.render("flights/index", { flights });
};

// Show Single Flight
module.exports.show = async (req, res) => {

    const flight = await Flight.findById(req.params.id);

    if (!flight) {
        req.flash("error", "Flight not found");
        return res.redirect("/flights");
    }

    res.render("flights/show", { flight });
};

// Book Flight
module.exports.bookFlight = async (req, res) => {

    const flight = await Flight.findById(req.params.id);

    if (!flight) {
        req.flash("error", "Flight not found");
        return res.redirect("/flights");
    }

    const passengerName = String(req.body.passengerName || "").trim();
    const passengerAge = Number(req.body.passengerAge);

    if (
        !passengerName ||
        passengerName.length > 100 ||
        !Number.isInteger(passengerAge) ||
        passengerAge < 1 ||
        passengerAge > 120
    ) {
        req.flash("error", "Please enter the passenger's name and a valid age.");
        return res.redirect(`/flights/${flight._id}`);
    }

    if (flight.departureTime && flight.departureTime < new Date()) {
        req.flash("error", "This flight has already departed.");
        return res.redirect(`/flights/${flight._id}`);
    }

    // Take one seat in a single atomic step, so two people can never
    // book the last seat at the same time.
    const reserved = await Flight.findOneAndUpdate(
        { _id: flight._id, seatsAvailable: { $gte: 1 } },
        { $inc: { seatsAvailable: -1 } },
        { new: true }
    );

    if (!reserved) {
        req.flash("error", "Flight Sold Out");
        return res.redirect(`/flights/${flight._id}`);
    }

    try {
        await FlightBooking.create({
            user: req.user._id,
            flight: flight._id,
            passengers: [{ name: passengerName, age: passengerAge }],
            totalAmount: flight.price
        });
    } catch (err) {
        // Booking was not saved, so give the seat back.
        await Flight.updateOne({ _id: flight._id }, { $inc: { seatsAvailable: 1 } });
        throw err;
    }

    req.flash("success", "Flight booked successfully!");

    res.redirect("/flights/my-bookings");
};

module.exports.myBookings = async (req, res) => {

    const bookings = await FlightBooking
        .find({ user: req.user._id })
        .populate("flight")
        .sort({ bookingDate: -1 });

    // Skip bookings whose flight was removed, the page cannot show them.
    res.render("flights/bookings", {
        bookings: bookings.filter((booking) => booking.flight)
    });
};

module.exports.cancelBooking = async (req, res) => {

    const { bookingId } = req.params;

    const booking = await FlightBooking.findById(bookingId);

    // Only the person who booked can cancel.
    if (!booking || String(booking.user) !== String(req.user._id)) {
        req.flash("error", "Booking not found");
        return res.redirect("/flights/my-bookings");
    }

    if (booking.status === "Cancelled") {
        req.flash("error", "This booking is already cancelled");
        return res.redirect("/flights/my-bookings");
    }

    await setStatus("flights", booking, "Cancelled", { cancelledBy: "User" });

    req.flash("success", "Booking Cancelled");

    res.redirect("/flights/my-bookings");
};

const Flight = require("../models/flight");
const Bus = require("../models/Bus");
const ExpressError = require("./ExpressError");

// Which field holds the status for each kind of booking.
const STATUS_FIELD = {
  flights: "status",
  buses: "bookingStatus",
  cabs: "rideStatus",
  bikes: "bookingStatus",
};

// Statuses the organization (admin) is allowed to set.
const STATUS_OPTIONS = {
  flights: ["Booked", "Cancelled"],
  buses: ["Confirmed", "Cancelled"],
  cabs: [
    "Pending",
    "Confirmed",
    "Driver Assigned",
    "Arrived",
    "Ongoing",
    "Completed",
    "Cancelled",
  ],
  bikes: ["Confirmed", "Completed", "Cancelled"],
};

// Changes a booking's status. "Cancelled" is final, and cancelling gives
// the seats back to the flight / bus exactly once.
async function setStatus(type, booking, newStatus, { cancelledBy, reason } = {}) {
  const options = STATUS_OPTIONS[type];
  if (!options) throw new ExpressError(400, "Unknown booking type");
  if (!options.includes(newStatus)) throw new ExpressError(400, "Invalid status");

  const field = STATUS_FIELD[type];
  const current = booking[field];

  if (current === newStatus) return booking;
  if (current === "Cancelled") {
    throw new ExpressError(400, "A cancelled booking cannot be changed.");
  }

  if (newStatus === "Cancelled") {
    if (type === "flights") {
      const seats = (booking.passengers && booking.passengers.length) || 1;
      await Flight.updateOne(
        { _id: booking.flight },
        { $inc: { seatsAvailable: seats } }
      );
    }

    if (type === "buses") {
      await Bus.updateOne(
        { _id: booking.bus },
        { $inc: { seatsAvailable: booking.seatsBooked }, $set: { isAvailable: true } }
      );
    }

    if (cancelledBy && booking.schema.path("cancelledBy")) {
      booking.cancelledBy = cancelledBy;
    }
    if (reason && booking.schema.path("cancellationReason")) {
      booking.cancellationReason = reason;
    }
  }

  booking[field] = newStatus;
  await booking.save();
  return booking;
}

module.exports = { STATUS_FIELD, STATUS_OPTIONS, setStatus };

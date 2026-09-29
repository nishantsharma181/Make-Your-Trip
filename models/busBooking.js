const mongoose = require("mongoose");

const busBookingSchema = new mongoose.Schema(
  {
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    passengerName: {
      type: String,
      required: true,
      trim: true
    },

    passengerAge: {
      type: Number,
      required: true
    },

    passengerGender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true
    },

    travelDate: {
      type: Date,
      required: true
    },

    seatsBooked: {
      type: Number,
      required: true,
      min: 1
    },

    totalAmount: {
      type: Number,
      required: true
    },

    boardingPoint: {
      type: String,
      required: true
    },

    droppingPoint: {
      type: String,
      required: true
    },

    bookingStatus: {
      type: String,
      enum: ["Confirmed", "Cancelled"],
      default: "Confirmed"
    },

    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BusBooking", busBookingSchema);

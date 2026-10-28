const mongoose = require("mongoose");

const busBookingSchema = new mongoose.Schema(
  {
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: true
    },

    // Ab optional: guest booking mein login nahi hota
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },

    // Naya: guest ka contact (route mein check karenge)
    contactPhone: {
      type: String,
      trim: true
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true
    },

    // Naya: guest is ID se booking track karega
    bookingCode: {
      type: String,
      unique: true,
      sparse: true
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

    // Naya: Pending (admin ka intezaar), Rejected
    bookingStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Rejected", "Cancelled"],
      default: "Pending"
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

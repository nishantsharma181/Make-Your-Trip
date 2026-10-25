const mongoose = require("mongoose");

const flightBookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  flight: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Flight",
    required: true
  },

  passengers: [{
    name: String,
    age: Number
  }],

  totalAmount: Number,

  // The organization marks this as "Paid" once the money is received
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending"
  },

  status:{
    type:String,
    enum:["Booked","Cancelled"],
    default:"Booked"
},

  bookingDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

flightBookingSchema.index({ user: 1, bookingDate: -1 });

module.exports = mongoose.model(
  "FlightBooking",
  flightBookingSchema
);

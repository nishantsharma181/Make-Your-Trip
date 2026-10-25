const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bikeBookingSchema = new Schema(
  {
    // Public booking reference (e.g. BIKE-482913)
    bookingId: {
      type: String,
      unique: true,
      default: () => "BIKE-" + Math.floor(100000 + Math.random() * 900000),
    },

    bike: {
      type: Schema.Types.ObjectId,
      ref: "Bike",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    pickupDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      required: true,
    },

    pricePerDay: {
      type: Number,
      required: true,
    },
    numberOfDays: {
      type: Number,
      required: true,
      min: 1,
    },
    securityDeposit: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },

    bookingStatus: {
      type: String,
      enum: ["Confirmed", "Completed", "Cancelled"],
      default: "Confirmed",
    },

    payment: {
      method: {
        type: String,
        enum: ["Card", "UPI", "NetBanking", "Cash On Pickup", "Wallet"],
        default: "UPI",
      },
      status: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending",
      },
    },

    cancellationReason: String,
    cancelledBy: {
      type: String,
      enum: ["User", "Admin"],
    },
  },
  { timestamps: true }
);

bikeBookingSchema.index({ user: 1, createdAt: -1 });
bikeBookingSchema.index({ bike: 1, pickupDate: 1, returnDate: 1 });

module.exports = mongoose.model("BikeBooking", bikeBookingSchema);

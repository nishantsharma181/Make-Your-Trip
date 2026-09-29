const mongoose = require("mongoose");

const bikeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["Scooter", "Bike", "Sports", "Cruiser"],
      required: true,
    },

    modelYear: {
      type: Number,
      default: 2024,
    },

    registrationNumber: {
      type: String,
      default: "UP-00-XX-0000",
    },

    location: {
      type: String,
      required: true,
    },

    image: {
      url: String,
      filename: String,
    },

    pricePerDay: {
      type: Number,
      required: true,
    },

    securityDeposit: {
      type: Number,
      default: 1500,
    },

    hourlyExtension: {
      type: Number,
      default: 110,
    },

    extraKmCharge: {
      type: Number,
      default: 5,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Bike", bikeSchema);

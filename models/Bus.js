const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    operator: {
      type: String,
      required: true,
      trim: true
    },

    busType: {
      type: String,
      enum: [
        "AC Sleeper",
        "Non-AC Sleeper",
        "AC Seater",
        "Non-AC Seater",
        "AC Seater/Sleeper"
      ],
      required: true
    },

    from: {
      type: String,
      required: true,
      trim: true
    },

    to: {
      type: String,
      required: true,
      trim: true
    },

    departureTime: {
      type: String,
      required: true
    },

    arrivalTime: {
      type: String,
      required: true
    },

    duration: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    totalSeats: {
      type: Number,
      default: 40
    },

    seatsAvailable: {
      type: Number,
      default: 40
    },

    boardingPoint: {
      type: String,
      required: true
    },

    droppingPoint: {
      type: String,
      required: true
    },

    image: {
      url: String,
      filename: String
    },

    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Bus", busSchema);

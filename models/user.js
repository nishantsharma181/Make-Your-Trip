const mongoose = require("mongoose");
const passportLocalMongoose =
  require("passport-local-mongoose").default;

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    image: {
      url: {
        type: String,
        default:
          "https://png.pngtree.com/png-clipart/20230927/original/pngtree-man-avatar-image-for-profile-png-image_13001877.png",
      },

      filename: String,
    },

    bio: {
      type: String,
      default: "",
    },

    phone: String,

    city: String,

    // Naya: Google login ke liye
    googleId: String,

    // Naya: admin ya normal user
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FlightBooking",
      },
    ],

    listings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);

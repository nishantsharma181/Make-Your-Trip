const User = require("../models/user.js");
const Listing = require("../models/listing");
const FlightBooking = require("../models/flightBooking");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const { isValidPhone } = require("../utils/phone");

module.exports.renderSignup = (req, res) => {
  res.render("users/signup");
};

module.exports.Signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const newUser = new User({
      username,
      email,
    });

    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) return next(err);

      req.flash("success", "Welcome to Make Your Trip!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

module.exports.renderLogin = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.Login = async (req, res) => {
  req.flash("success", "Welcome back!");
  let redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

module.exports.Logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "you are logged out!");
    res.redirect("/listings");
  });
};

module.exports.profile = async (req, res) => {
  const user = await User.findById(req.user._id);

  const listingsCount = await Listing.countDocuments({
    owner: req.user._id,
  });

  const allBookings = await FlightBooking.find({
    user: req.user._id,
  })
    .populate("flight")
    .sort({ bookingDate: -1 });

  // Skip bookings whose flight was removed, the page cannot show them
  const bookings = allBookings.filter((b) => b.flight);

  const bookingsCount = bookings.length;

  const cancelledBookings = bookings.filter(
    (b) => b.status === "Cancelled"
  ).length;

  res.render("users/profile", {
    user,
    listingsCount,
    bookingsCount,
    cancelledBookings,
    bookings,
  });
};

module.exports.renderEditProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  res.render("users/editProfile", { user });
};

module.exports.updateProfile = async (req, res) => {
  const { bio, phone, city } = req.body;

  const cleanPhone = String(phone || "").trim();

  if (cleanPhone && !isValidPhone(cleanPhone)) {
    req.flash("error", "Please enter a valid phone number (7 to 15 digits).");
    return res.redirect("/profile/edit");
  }

  const updateData = {
    bio,
    phone: cleanPhone,
    city,
  };

  if (req.file) {
    const result = await uploadToCloudinary(req.file);

    updateData.image = {
      url: result.secure_url,
      filename: result.public_id,
    };
  }

  await User.findByIdAndUpdate(req.user._id, updateData);

  req.flash("success", "Profile Updated");

  res.redirect("/profile");
};

const Listing = require("./models/listing");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl =
      req.method === "GET"
        ? req.originalUrl
        : req.get("Referer") || "/listings";
    req.flash("error", "you must be logged in");
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;

  let listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  if (!listing.owner.equals(res.locals.currUser._id)) {
    req.flash("error", "You are not the Owner of this Listing");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);

  if (error) {
    throw new ExpressError(400, error.message);
  }

  next();
};

module.exports.validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);

  if (error) {
    throw new ExpressError(400, error.message);
  }

  next();
};

// ---------- Naya: sirf admin ke liye ----------
module.exports.isAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "Admin dashboard ke liye login karo");
    return res.redirect("/login");
  }
  if (req.user.role !== "admin") {
    req.flash("error", "Ye page sirf admin ke liye hai");
    return res.redirect("/listings");
  }
  next();
};

// ---------- Naya: guest booking par spam rokne ke liye ----------
// 15 minute mein ek IP se maximum 10 booking requests
const bookingHits = new Map();

module.exports.bookingLimiter = (req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const limit = 10;

  const recent = (bookingHits.get(key) || []).filter(
    (t) => now - t < windowMs
  );

  if (recent.length >= limit) {
    req.flash("error", "Bahut zyada requests. Kuch der baad try karo.");
    return res.redirect(req.get("Referer") || "/listings");
  }

  recent.push(now);
  bookingHits.set(key, recent);
  next();
};

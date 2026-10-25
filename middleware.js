const Listing=require("./models/listing");
const ExpressError=require("./utils/ExpressError.js");
const {listingSchema,reviewSchema}=require("./schema.js");

module.exports.isLoggedIn=(req,res,next)=>{
if(!req.isAuthenticated()){
  req.session.redirectUrl=req.method === "GET" ? req.originalUrl : req.get("Referer") || "/listings";
    req.flash("error","you must be logged in");
    return res.redirect("/login");
  }
next();}
module.exports.saveRedirectUrl=(req,res,next)=>{
  if(req.session.redirectUrl){
    res.locals.redirectUrl=req.session.redirectUrl;
  }next();
};

// ---------------------------------------------------------------------
// Organization (admin) access
// A user is an admin if their role is "admin" OR their email is listed in
// the ADMIN_EMAILS environment variable (comma separated).
// ---------------------------------------------------------------------
const adminEmails = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const userIsAdmin = (user) =>
  !!user &&
  (user.role === "admin" ||
    adminEmails().includes(String(user.email || "").toLowerCase()));

module.exports.userIsAdmin = userIsAdmin;

module.exports.isAdmin = (req, res, next) => {
  if (!userIsAdmin(req.user)) {
    req.flash("error", "Only the organization (admin) can open this page.");
    return res.redirect("/listings");
  }
  next();
};

// A booking can be opened/changed by the person who made it, or by an admin.
module.exports.canAccessBooking = (user, bookingUser) => {
  if (!user || !bookingUser) return false;
  const ownerId = bookingUser._id || bookingUser;
  return userIsAdmin(user) || String(ownerId) === String(user._id);
};

// The organization needs a way to contact the traveller, so a phone number
// must be saved in the profile before booking.
module.exports.requirePhone = (req, res, next) => {
  if (!req.user.phone) {
    req.flash(
      "error",
      "Please add your phone number to your profile first, so the organization can contact you about your booking."
    );
    return res.redirect("/profile/edit");
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

    if (!listing.owner || !listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the Owner of this Listing");
        return res.redirect(`/listings/${id}`);
    }next();
};
module.exports.validateListing = (req,res,next)=>{
    let { error } = listingSchema.validate(req.body);

    if(error){
        throw new ExpressError(400, error.message);
    }

    next();
};

module.exports.validateReview = (req,res,next)=>{
    let { error } = reviewSchema.validate(req.body);

    if(error){
        throw new ExpressError(400, error.message);
    }

    next();
};

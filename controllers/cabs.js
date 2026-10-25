const Cab = require("../models/Cab");
const escapeRegex = require("../utils/escapeRegex");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// 1. Index & Search Cabs
module.exports.index = async (req, res, next) => {
  try {
    const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
    const vehicleType =
      typeof req.query.vehicleType === "string" ? req.query.vehicleType : "";
    let filter = { isAvailable: true };

    if (city) {
      filter.operatingCity = { $regex: escapeRegex(city), $options: "i" };
    }
    if (vehicleType) {
      filter.vehicleType = vehicleType;
    }

    const cabs = await Cab.find(filter).populate("owner", "username email");
    res.render("cabs/index", { cabs, searchCity: city });
  } catch (err) {
    next(err);
  }
};

// 2. Render New Form
module.exports.renderNewForm = (req, res) => {
  res.render("cabs/new");
};

// 3. Create Cab
module.exports.createCab = async (req, res, next) => {
  try {
    const input = req.body.cab || {};

    // Only take the fields the form is allowed to set
    const newCab = new Cab({
      vehicleName: input.vehicleName,
      vehicleType: input.vehicleType,
      registrationNumber: input.registrationNumber,
      capacity: input.capacity,
      hasAC: input.hasAC === "on" || input.hasAC === "true",
      fuelType: input.fuelType,
      driver: input.driver && {
        name: input.driver.name,
        phone: input.driver.phone,
      },
      operatingCity: input.operatingCity,
      serviceTypes: input.serviceTypes,
      pricing: input.pricing,
    });
    newCab.owner = req.user._id;

    if (req.file) {
      const result = await uploadToCloudinary(req.file);
      newCab.image = {
        url: result.secure_url,
        filename: result.public_id,
      };
    }

    await newCab.save();
    req.flash("success", "Cab listed successfully!");
    res.redirect(`/cabs/${newCab._id}`);
  } catch (err) {
    // Show form mistakes (missing field, duplicate registration) on the form
    if (err.name === "ValidationError" || err.code === 11000) {
      req.flash(
        "error",
        err.code === 11000
          ? "A cab with this registration number already exists."
          : err.message
      );
      return res.redirect("/cabs/new");
    }
    next(err);
  }
};

// 4. Show Single Cab Details
module.exports.showCab = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cab = await Cab.findById(id).populate("owner", "username email");

    if (!cab) {
      const err = new Error("Cab not found");
      err.statusCode = 404;
      return next(err);
    }

    res.render("cabs/show", { cab });
  } catch (err) {
    next(err);
  }
};

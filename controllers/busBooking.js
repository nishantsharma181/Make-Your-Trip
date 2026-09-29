const Bus = require("../models/Bus");
const BusBooking = require("../models/busBooking");

module.exports.newBooking = async (req, res) => {
  const { busId } = req.params;

  const bus = await Bus.findById(busId);

  if (!bus) {
    req.flash("error", "Bus not found.");
    return res.redirect("/buses");
  }

  res.render("buses/book", { bus });
};

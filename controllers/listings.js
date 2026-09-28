const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError.js");
const cloudinary = require("../cloudConfig.js");
const UPLOAD_TIMEOUT_MS = 120_000;

const allowedCategories = [
  "trending",
  "rooms",
  "cities",
  "mountains",
  "flights",
  "swimming",
  "camping",
  "farms",
  "arctic",
  "bus",
  "taxi",
  "bike",
  "train",
];

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      reject(new ExpressError(500, "Image storage is not configured."));
      return;
    }
    const stream = cloudinary.uploader.upload_stream(
      { folder: "wanderlust_DEV", resource_type: "auto", timeout: UPLOAD_TIMEOUT_MS },
      (error, result) => {
        if (error) {
          if (error.name === "TimeoutError" || error.http_code === 499) {
            return reject(new ExpressError(
              503,
              "Image storage did not respond. Check that this server can reach api.cloudinary.com, then try again."
            ));
          }
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};

module.exports.index = async (req, res) => {
  const { category } = req.query;
  const isValidCategory = allowedCategories.includes(category);
  const filter = isValidCategory ? { category } : {};
  const allListings = await Listing.find(filter);
  res.render("listings/index.ejs", {
    allListings,
    selectedCategory: isValidCategory ? category : "",
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showRoute = async (req, res) => {
  let { id } = req.params;

  const listing = await

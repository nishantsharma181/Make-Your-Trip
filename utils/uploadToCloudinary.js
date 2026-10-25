const cloudinary = require("../cloudConfig");
const ExpressError = require("./ExpressError");

const UPLOAD_TIMEOUT_MS = 120_000;

// Uploads a multer memory-storage file to Cloudinary and resolves with the result.
module.exports = (file) => {
  return new Promise((resolve, reject) => {
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      reject(new ExpressError(500, "Image storage is not configured."));
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "wanderlust_DEV",
        resource_type: "auto",
        timeout: UPLOAD_TIMEOUT_MS,
      },
      (error, result) => {
        if (error) {
          if (error.name === "TimeoutError" || error.http_code === 499) {
            return reject(
              new ExpressError(
                503,
                "Image storage did not respond. Check that this server can reach api.cloudinary.com, then try again."
              )
            );
          }
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};

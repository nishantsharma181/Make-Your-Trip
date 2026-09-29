const mongoose = require("mongoose");
const Flight = require("../models/flight.js");
const flightData = require("./flightData.js");

const MONGO_URL = process.env.ATLASDB_URL;

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("connected to DB");

  await Flight.deleteMany({});
  await Flight.insertMany(flightData);

  console.log("flight data was initialized");

  await mongoose.connection.close();
}

main().catch((err) => {
  console.log(err);
});

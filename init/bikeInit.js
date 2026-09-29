const mongoose = require("mongoose");
const Bike = require("../models/Bike");
const bikeData = require("./bikeData");

const dbUrl = process.env.ATLASDB_URL;

async function initDB() {
  try {
    await mongoose.connect(dbUrl);

    console.log("Connected to MongoDB");

    await Bike.deleteMany({});
    await Bike.insertMany(bikeData);

    console.log("Bike data was initialized successfully");

    await mongoose.connection.close();
  } catch (err) {
    console.error("Bike initialization failed:", err);
    process.exit(1);
  }
}

initDB();

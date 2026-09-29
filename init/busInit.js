const mongoose = require("mongoose");
const Bus = require("../models/Bus");
const busData = require("./busData");

const dbUrl = process.env.ATLASDB_URL;

async function initDB() {
  try {
    await mongoose.connect(dbUrl);

    console.log("Connected to MongoDB");

    await Bus.deleteMany({});

    await Bus.insertMany(busData);

    console.log("Bus data was initialized successfully");

    await mongoose.connection.close();

    process.exit(0);
  } catch (err) {
    console.error("Bus initialization failed:", err);

    process.exit(1);
  }
}

initDB();

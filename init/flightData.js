const flightData = [
  {
    flightNumber: "AI101",
    airline: "Air India",
    source: "Delhi",
    destination: "Mumbai",
    departureTime: new Date("2026-10-01T08:00:00"),
    arrivalTime: new Date("2026-10-01T10:15:00"),
    price: 5500,
    seatsAvailable: 80
  },
  {
    flightNumber: "6E202",
    airline: "IndiGo",
    source: "Delhi",
    destination: "Bengaluru",
    departureTime: new Date("2026-10-01T11:00:00"),
    arrivalTime: new Date("2026-10-01T13:45:00"),
    price: 6200,
    seatsAvailable: 90
  },
  {
    flightNumber: "UK303",
    airline: "Vistara",
    source: "Mumbai",
    destination: "Delhi",
    departureTime: new Date("2026-10-01T15:30:00"),
    arrivalTime: new Date("2026-10-01T17:35:00"),
    price: 5800,
    seatsAvailable: 75
  }
];

module.exports = flightData;

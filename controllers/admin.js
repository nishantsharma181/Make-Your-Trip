// Organization (admin) side: every booking made by users shows up here.

const Flight = require("../models/flight");
const FlightBooking = require("../models/flightBooking");
const BusBooking = require("../models/busBooking");
const CabBooking = require("../models/cabBooking");
const BikeBooking = require("../models/bikeBooking");
const ExpressError = require("../utils/ExpressError");
const { STATUS_FIELD, STATUS_OPTIONS, setStatus } = require("../utils/bookingStatus");

const LIMIT_PER_TYPE = 300;
const USER_FIELDS = "username email phone";

const fmtDate = (d, withTime = false) => {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "-";
  const options = { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" };
  if (withTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }
  return date.toLocaleString("en-IN", options);
};

// How each kind of booking is turned into one common "row" for the tables.
const TYPES = {
  flights: {
    label: "Flights",
    icon: "fa-plane",
    Model: FlightBooking,
    populate: ["flight", { path: "user", select: USER_FIELDS }],
    amountPath: "$totalAmount",
    amount: (b) => b.totalAmount,
    summary: (b) =>
      b.flight
        ? `${b.flight.airline} ${b.flight.flightNumber} · ${b.flight.source} → ${b.flight.destination}`
        : "Flight removed",
    details: (b) =>
      (b.passengers || []).map((p) => `${p.name} (age ${p.age})`).join(", "),
    when: (b) => b.flight && b.flight.departureTime,
    payment: (b) => b.paymentStatus || "Pending",
    markPaid: (b) => { b.paymentStatus = "Paid"; },
  },
  buses: {
    label: "Buses",
    icon: "fa-bus",
    Model: BusBooking,
    populate: ["bus", { path: "user", select: USER_FIELDS }],
    amountPath: "$totalAmount",
    amount: (b) => b.totalAmount,
    summary: (b) =>
      b.bus ? `${b.bus.operator} · ${b.bus.from} → ${b.bus.to}` : "Bus removed",
    details: (b) =>
      `${b.passengerName} (${b.passengerAge}, ${b.passengerGender}) · ${b.seatsBooked} seat(s) · ${b.boardingPoint} → ${b.droppingPoint}`,
    when: (b) => b.travelDate,
    payment: (b) => b.paymentStatus || "Pending",
    markPaid: (b) => { b.paymentStatus = "Paid"; },
  },
  cabs: {
    label: "Cabs",
    icon: "fa-taxi",
    Model: CabBooking,
    populate: ["cab", { path: "user", select: USER_FIELDS }],
    amountPath: "$fareDetails.totalFare",
    amount: (b) => b.fareDetails && b.fareDetails.totalFare,
    summary: (b) =>
      b.cab
        ? `${b.cab.vehicleName} · ${b.pickup.address} → ${b.drop.address}`
        : "Cab removed",
    details: (b) =>
      `${b.tripType} · ${b.distanceKm} km · driver: ${b.cab && b.cab.driver ? b.cab.driver.name : "-"}`,
    when: (b) => b.departureTime,
    payment: (b) => (b.payment && b.payment.status) || "Pending",
    markPaid: (b) => { b.payment.status = "Paid"; },
  },
  bikes: {
    label: "Bikes",
    icon: "fa-motorcycle",
    Model: BikeBooking,
    populate: ["bike", { path: "user", select: USER_FIELDS }],
    amountPath: "$totalAmount",
    amount: (b) => b.totalAmount,
    summary: (b) =>
      b.bike ? `${b.bike.name} · ${b.bike.location}` : "Bike removed",
    details: (b) =>
      `${b.numberOfDays} day(s), return ${fmtDate(b.returnDate)} · deposit ₹${b.securityDeposit || 0}`,
    when: (b) => b.pickupDate,
    payment: (b) => (b.payment && b.payment.status) || "Pending",
    markPaid: (b) => { b.payment.status = "Paid"; },
  },
};

const TYPE_KEYS = Object.keys(TYPES);

const allStatuses = (type) =>
  type === "all"
    ? [...new Set(TYPE_KEYS.flatMap((key) => STATUS_OPTIONS[key]))]
    : STATUS_OPTIONS[type];

function toRow(type, booking) {
  const t = TYPES[type];
  const user = booking.user || {};

  return {
    id: String(booking._id),
    type,
    typeLabel: t.label,
    icon: t.icon,
    ref: booking.bookingId || String(booking._id).slice(-6).toUpperCase(),
    customer: {
      name: user.username || "Deleted user",
      email: user.email || "",
      phone: user.phone || "",
    },
    summary: t.summary(booking),
    details: t.details(booking),
    when: t.when(booking),
    amount: Number(t.amount(booking)) || 0,
    payment: t.payment(booking),
    status: booking[STATUS_FIELD[type]],
    options: STATUS_OPTIONS[type],
    createdAt:
      booking.createdAt || booking.bookingDate || booking._id.getTimestamp(),
  };
}

async function fetchType(type, status) {
  const t = TYPES[type];
  const filter = status ? { [STATUS_FIELD[type]]: status } : {};

  const docs = await t.Model.find(filter)
    .populate(t.populate)
    .sort({ _id: -1 })
    .limit(LIMIT_PER_TYPE);

  return docs.map((doc) => toRow(type, doc));
}

// Reads ?type=&status=&q= from the page and returns the matching rows.
async function queryRows(query) {
  const type = TYPES[query.type] ? query.type : "all";

  const status =
    typeof query.status === "string" && allStatuses(type).includes(query.status)
      ? query.status
      : "";

  const q = typeof query.q === "string" ? query.q.trim() : "";

  const keys = type === "all" ? TYPE_KEYS : [type];
  const lists = await Promise.all(keys.map((key) => fetchType(key, status)));

  let rows = lists.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((row) =>
      [row.ref, row.customer.name, row.customer.email, row.customer.phone, row.summary, row.details]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }

  return { type, status, q, rows };
}

// ---------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------
module.exports.dashboard = async (req, res) => {
  const stats = await Promise.all(
    TYPE_KEYS.map(async (type) => {
      const t = TYPES[type];
      const statusField = STATUS_FIELD[type];

      const groups = await t.Model.aggregate([
        {
          $group: {
            _id: `$${statusField}`,
            count: { $sum: 1 },
            revenue: { $sum: t.amountPath },
          },
        },
      ]);

      let total = 0;
      let cancelled = 0;
      let revenue = 0;

      groups.forEach((group) => {
        total += group.count;
        if (group._id === "Cancelled") {
          cancelled += group.count;
        } else {
          revenue += group.revenue;
        }
      });

      return {
        type,
        label: t.label,
        icon: t.icon,
        total,
        active: total - cancelled,
        cancelled,
        revenue,
      };
    })
  );

  const recent = (await Promise.all(TYPE_KEYS.map((type) => fetchType(type, ""))))
    .flat()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  const totals = stats.reduce(
    (sum, s) => ({
      bookings: sum.bookings + s.total,
      active: sum.active + s.active,
      revenue: sum.revenue + s.revenue,
    }),
    { bookings: 0, active: 0, revenue: 0 }
  );

  res.render("admin/dashboard", { stats, totals, recent, fmtDate });
};

// ---------------------------------------------------------------------
// All bookings table
// ---------------------------------------------------------------------
module.exports.bookings = async (req, res) => {
  const { type, status, q, rows } = await queryRows(req.query);

  res.render("admin/bookings", {
    rows,
    type,
    status,
    q,
    types: TYPE_KEYS.map((key) => ({ key, label: TYPES[key].label })),
    statusChoices: allStatuses(type),
    limit: LIMIT_PER_TYPE,
    fmtDate,
  });
};

// ---------------------------------------------------------------------
// CSV download (opens in Excel / Google Sheets)
// ---------------------------------------------------------------------
const csvCell = (value) => {
  let text = value === null || value === undefined ? "" : String(value);

  // Stop spreadsheet formulas from running (=, +, -, @ at the start)
  if (/^[=+\-@\t\r]/.test(text)) {
    text = "'" + text;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

module.exports.exportCsv = async (req, res) => {
  const { type, rows } = await queryRows(req.query);

  const header = [
    "Reference", "Type", "Customer", "Email", "Phone", "Booking",
    "Details", "Travel date", "Amount (INR)", "Payment", "Status", "Booked on",
  ];

  const lines = [header.map(csvCell).join(",")];

  rows.forEach((row) => {
    lines.push(
      [
        row.ref,
        row.typeLabel,
        row.customer.name,
        row.customer.email,
        row.customer.phone,
        row.summary,
        row.details,
        fmtDate(row.when, true),
        row.amount,
        row.payment,
        row.status,
        fmtDate(row.createdAt, true),
      ]
        .map(csvCell)
        .join(",")
    );
  });

  const day = new Date().toISOString().slice(0, 10);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="bookings-${type}-${day}.csv"`
  );
  // ﻿ makes Excel read the file as UTF-8 (₹, arrows, names)
  res.send("﻿" + lines.join("\r\n"));
};

// ---------------------------------------------------------------------
// Change booking status (cancelling gives flight / bus seats back)
// ---------------------------------------------------------------------
module.exports.updateStatus = async (req, res) => {
  const { type, id } = req.params;

  if (!TYPES[type]) {
    throw new ExpressError(404, "Unknown booking type");
  }

  const booking = await TYPES[type].Model.findById(id);

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect(`/admin/bookings?type=${type}`);
  }

  try {
    await setStatus(type, booking, req.body.status, {
      cancelledBy: "Admin",
      reason: "Cancelled by the organization",
    });
    req.flash("success", `Booking updated to "${req.body.status}".`);
  } catch (err) {
    if (err instanceof ExpressError) {
      req.flash("error", err.message);
    } else {
      throw err;
    }
  }

  res.redirect(`/admin/bookings?type=${type}`);
};

// ---------------------------------------------------------------------
// Mark a booking as paid
// ---------------------------------------------------------------------
module.exports.markPaid = async (req, res) => {
  const { type, id } = req.params;

  if (!TYPES[type]) {
    throw new ExpressError(404, "Unknown booking type");
  }

  const booking = await TYPES[type].Model.findById(id);

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect(`/admin/bookings?type=${type}`);
  }

  TYPES[type].markPaid(booking);
  await booking.save();

  req.flash("success", "Payment marked as received.");
  res.redirect(`/admin/bookings?type=${type}`);
};

// ---------------------------------------------------------------------
// Sample flights (replaces the old public /seed page). Safe to run again:
// it only refreshes dates and prices, it never deletes flights or bookings.
// ---------------------------------------------------------------------
const at = (daysFromNow, hour, minute) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date;
};

module.exports.seedFlights = async (req, res) => {
  const samples = [
    { flightNumber: "AI101", airline: "Air India", source: "Delhi", destination: "Mumbai", dep: at(2, 9, 0), arr: at(2, 11, 15), price: 5500, seats: 45 },
    { flightNumber: "6E202", airline: "IndiGo", source: "Delhi", destination: "Bangalore", dep: at(2, 12, 0), arr: at(2, 14, 30), price: 4800, seats: 70 },
    { flightNumber: "UK303", airline: "Vistara", source: "Mumbai", destination: "Goa", dep: at(3, 8, 0), arr: at(3, 9, 10), price: 3200, seats: 30 },
  ];

  await Flight.bulkWrite(
    samples.map((f) => ({
      updateOne: {
        filter: { flightNumber: f.flightNumber },
        update: {
          $set: {
            airline: f.airline,
            source: f.source,
            destination: f.destination,
            departureTime: f.dep,
            arrivalTime: f.arr,
            price: f.price,
          },
          $setOnInsert: { seatsAvailable: f.seats },
        },
        upsert: true,
      },
    }))
  );

  req.flash("success", "Sample flights are ready.");
  res.redirect("/admin");
};

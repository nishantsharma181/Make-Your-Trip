// Makes user input safe to put inside a MongoDB $regex / RegExp.
module.exports = (value = "") =>
  String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Accepts digits with optional + ( ) - and spaces, 7 to 15 characters.
const PHONE_RE = /^[0-9+()\-\s]{7,15}$/;

module.exports.isValidPhone = (phone) => PHONE_RE.test(String(phone || "").trim());

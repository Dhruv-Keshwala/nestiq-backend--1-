/**
 * NESTIQ — Validation Utilities
 */

function isValidEmail(email) {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidIndianPhone(phone) {
  if (!phone) return true; // optional at signup
  return /^(\+91[-\s]?)?[6-9]\d{9}$/.test(phone);
}

/**
 * Password strength scoring: weak / fair / good / strong
 */
function passwordStrength(password) {
  if (!password || password.length < 8) return "weak";

  let score = 0;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score >= 4) return "strong";
  if (score >= 3) return "good";
  if (score >= 2) return "fair";
  return "weak";
}

function validateSignup(body) {
  const errors = {};

  if (!body.name || body.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }
  if (!isValidEmail(body.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (body.phone && !isValidIndianPhone(body.phone)) {
    errors.phone = "Enter a valid Indian phone number.";
  }
  if (!body.password || body.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (body.role && !["renter", "buyer", "agent"].includes(body.role)) {
    errors.role = "Role must be renter, buyer, or agent.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

function validateLogin(body) {
  const errors = {};
  if (!isValidEmail(body.email)) errors.email = "Enter a valid email address.";
  if (!body.password) errors.password = "Password is required.";
  return { valid: Object.keys(errors).length === 0, errors };
}

module.exports = {
  isValidEmail,
  isValidIndianPhone,
  passwordStrength,
  validateSignup,
  validateLogin,
};

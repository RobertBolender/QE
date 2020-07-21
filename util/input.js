const words = require("naughty-words/en.json");

function sanitizeNumericInput(input) {
  const parsed = parseInt(input);
  if (isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

function sanitizeStringInput(input) {
  const substring = input.substring(0, 16);
  if (words.some((word) => word === substring.toLowerCase())) {
    return "";
  }
  return substring;
}

module.exports = {
  sanitizeNumericInput,
  sanitizeStringInput,
};

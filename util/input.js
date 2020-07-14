function sanitizeNumericInput(input) {
  const parsed = parseInt(input);
  if (isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

function sanitizeStringInput(input) {
  return input;
}

module.exports = {
  sanitizeNumericInput,
  sanitizeStringInput,
};

function sanitizeNumericInput(input) {
  const parsed = parseInt(input);
  if (isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

module.exports = {
  sanitizeNumericInput,
};

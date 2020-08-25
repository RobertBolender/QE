const threeOrFourPlayerCountries = ["US", "CN", "JP", "EU"];

const fivePlayerCountries = ["UK", "US", "CN", "JP", "EU"];

const countriesByPlayerCount = {
  3: threeOrFourPlayerCountries,
  4: threeOrFourPlayerCountries,
  5: fivePlayerCountries,
};

module.exports = {
  countriesByPlayerCount,
};

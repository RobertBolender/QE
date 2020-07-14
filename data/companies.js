const fivePlayerCompanies = [
  { country: "UK", value: 2, sector: "GOV" },
  { country: "UK", value: 3, sector: "AGR" },
  { country: "UK", value: 4, sector: "FIN" },
  { country: "US", value: 2, sector: "FIN" },
  { country: "US", value: 3, sector: "MAN" },
  { country: "US", value: 4, sector: "AGR" },
  { country: "CN", value: 2, sector: "AGR" },
  { country: "CN", value: 3, sector: "HOU" },
  { country: "CN", value: 4, sector: "GOV" },
  { country: "JP", value: 2, sector: "MAN" },
  { country: "JP", value: 3, sector: "GOV" },
  { country: "JP", value: 4, sector: "HOU" },
  { country: "EU", value: 2, sector: "HOU" },
  { country: "EU", value: 3, sector: "FIN" },
  { country: "EU", value: 4, sector: "MAN" },
];

const threeOrFourPlayerCompanies = [
  { country: "US", value: 1, sector: "HOU" },
  { country: "US", value: 2, sector: "FIN" },
  { country: "US", value: 3, sector: "MAN" },
  { country: "US", value: 4, sector: "AGR" },
  { country: "CN", value: 1, sector: "MAN" },
  { country: "CN", value: 2, sector: "AGR" },
  { country: "CN", value: 3, sector: "HOU" },
  { country: "CN", value: 4, sector: "FIN" },
  { country: "JP", value: 1, sector: "FIN" },
  { country: "JP", value: 2, sector: "MAN" },
  { country: "JP", value: 3, sector: "AGR" },
  { country: "JP", value: 4, sector: "HOU" },
  { country: "EU", value: 1, sector: "AGR" },
  { country: "EU", value: 2, sector: "HOU" },
  { country: "EU", value: 3, sector: "FIN" },
  { country: "EU", value: 4, sector: "MAN" },
];

const companiesByPlayerCount = {
  3: threeOrFourPlayerCompanies,
  4: threeOrFourPlayerCompanies,
  5: fivePlayerCompanies,
};

module.exports = {
  companiesByPlayerCount,
};

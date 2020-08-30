const threeOrFourPlayerSectors = ["AGR", "FIN", "HOU", "MAN"];

const fivePlayerSectors = ["GOV", "AGR", "FIN", "HOU", "MAN"];

const sectorsByPlayerCount = {
  3: threeOrFourPlayerSectors,
  4: threeOrFourPlayerSectors,
  5: fivePlayerSectors,
};

module.exports = {
  sectorsByPlayerCount,
};

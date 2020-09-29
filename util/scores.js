function getPlayerScores(gameState) {
  const { players, gameOver } = gameState;
  const results = players.reduce((result, player) => {
    result[player.id] = getScoresForPlayer(gameState, player);
    return result;
  }, {});
  const winner = !gameOver
    ? false
    : players.reduce((incumbent, contender) => {
        const contenderResults = results[contender.id];
        if (contenderResults.highestSpender) {
          return incumbent;
        }

        if (!incumbent) {
          return contender;
        }

        const incumbentResults = results[incumbent.id];
        if (contenderResults.totalScore > incumbentResults.totalScore) {
          return contender;
        }

        if (
          contenderResults.totalScore === incumbentResults.totalScore &&
          contenderResults.totalSpend < incumbentResults.totalSpend
        ) {
          return contender;
        }

        return incumbent;
      }, false);
  results.winner = winner;
  return results;
}

function getPlayerSpending(gameState) {
  const { auctions, players } = gameState;
  const playerSpending = auctions.reduce(
    (result, auction) => {
      if (auction.winner) {
        if (!result[auction.winner]) {
          result[auction.winner] = auction[auction.winner];
        } else {
          result[auction.winner] =
            result[auction.winner] + auction[auction.winner];
        }
      }
      return result;
    },
    players.reduce((result, player) => {
      result[player.id] = 0;
      return result;
    }, {})
  );
  let lowest = Number.MAX_SAFE_INTEGER;
  let highest = 0;
  const spendersBySpending = {};
  Object.entries(playerSpending).forEach(([playerId, total]) => {
    if (!spendersBySpending[total]) {
      spendersBySpending[total] = [];
    }
    spendersBySpending[total].push(playerId);
    if (total > highest) {
      highest = total;
    }
    if (total < lowest) {
      lowest = total;
    }
  });

  const lowestSpenders = spendersBySpending[lowest]
    ? spendersBySpending[lowest]
    : [];
  const highestSpenders = spendersBySpending[highest]
    ? spendersBySpending[highest]
    : [];
  return {
    playerSpending,
    lowestSpenders,
    highestSpenders,
  };
}

function getScoresForPlayer(gameState, player) {
  const { auctions, players, gameOver } = gameState;

  const auctionsForPlayer = auctions.filter(
    (auction) => auction.winner === player.id
  );

  const totalAuctionCount = auctionsForPlayer.length;

  const totalSpend = auctionsForPlayer.reduce(
    (total, auction) =>
      Number.isInteger(auction[player.id]) ? total + auction[player.id] : total,
    0
  );

  const { playerSpending, lowestSpenders, highestSpenders } = getPlayerSpending(
    gameState
  );

  const lowestSpenderBonusByPlayerCount = {
    3: 6,
    4: 6,
    5: 7,
  };

  const lowestSpenderBonus =
    gameOver && lowestSpenders.includes(player.id)
      ? lowestSpenderBonusByPlayerCount[players.length]
      : 0;

  const totalValue = auctionsForPlayer.reduce(
    (total, auction) => total + auction.value,
    0
  );

  const auctionsByRound = auctions.reduce(
    (result, auction) => {
      if (typeof auction.round !== "undefined") {
        result[auction.round].push(auction);
      }
      return result;
    },
    [[], [], [], [], []]
  );

  const pointsForZeros =
    players.length === 3
      ? 0
      : auctionsByRound.reduce(
          (total, round) =>
            round.some((auction) => auction[player.id] === 0)
              ? total + 2
              : total,
          0
        );

  const naturalizationCountries = auctionsForPlayer.filter(
    (auction) => auction.country === player.country
  ).length;

  const naturalizationScoresByPlayerCount = {
    3: [0, 1, 3, 6, 10],
    4: [0, 1, 3, 6, 10],
    5: [0, 3, 6, 10],
  };

  const naturalizationTotal =
    naturalizationScoresByPlayerCount[players.length][naturalizationCountries];

  const auctionsBySector = [
    { sector: player.sector },
    ...auctionsForPlayer,
  ].reduce((result, auction) => {
    if (!result[auction.sector]) {
      result[auction.sector] = 1;
    } else {
      result[auction.sector] = result[auction.sector] + 1;
    }
    return result;
  }, {});

  const monopolizationScoresByPlayerCount = {
    3: [0, 0, 3, 6, 10, 10],
    4: [0, 0, 3, 6, 10, 10],
    5: [0, 0, 6, 10, 16, 16],
  };

  const sectors = ["AGR", "FIN", "GOV", "HOU", "MAN"];

  const monopolizationTotal = sectors.reduce(
    (total, sector) =>
      total +
      monopolizationScoresByPlayerCount[players.length][
        auctionsBySector[sector] ? auctionsBySector[sector] : 0
      ],
    0
  );

  const diversificationSets = auctionsForPlayer.reduce((result, auction) => {
    for (var i = 0, found = false; !found; i++) {
      if (!result[i]) {
        result[i] = new Set([auction.country]);
        found = true;
        return result;
      }
      if (!result[i].has(auction.country)) {
        result[i].add(auction.country);
        found = true;
        return result;
      }
    }
    return result;
  }, []);

  const diversificationScoresByPlayerCount = {
    3: [0, 0, 0, 6, 10],
    4: [0, 0, 0, 6, 10],
    5: [0, 0, 10, 15, 21, 21],
  };

  const diversificationTotal = diversificationSets.reduce(
    (result, set) =>
      (result += diversificationScoresByPlayerCount[players.length][set.size]),
    0
  );

  const highestSpender = gameOver && highestSpenders.includes(player.id);

  const totalScore =
    totalValue +
    pointsForZeros +
    naturalizationTotal +
    monopolizationTotal +
    diversificationTotal +
    lowestSpenderBonus;

  return {
    totalAuctionCount,
    totalSpend,
    totalValue,
    pointsForZeros,
    naturalizationTotal,
    monopolizationTotal,
    diversificationTotal,
    lowestSpenderBonus,
    highestSpender,
    totalScore,
  };
}

module.exports = {
  getPlayerScores,
};

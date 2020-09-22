const { shuffle } = require("../util/shuffle");
const { companiesByPlayerCount } = require("./companies");
const { countriesByPlayerCount } = require("./countries");
const { sectorsByPlayerCount } = require("./sectors");

function createNewGame(gameId, name, player) {
  return {
    id: gameId,
    name,
    url: `/game/${gameId}`,
    status: "Waiting for players",
    round: 0,
    auctions: [],
    players: [player],
    turn: 0,
  };
}

function reduce(state, action) {
  if (state.errorMessage) {
    return state;
  }

  switch (action.type) {
    case "JOIN":
      return {
        ...state,
        players: [...state.players, action.player],
      };
    case "QUIT":
      return {
        ...state,
        players: [
          ...state.players.filter((player) => player.id !== action.userId),
        ],
      };
    case "START":
      const shuffledPlayers = action.shuffle
        ? shuffle(state.players)
        : state.players;

      // TODO: decide if I care about the performance of parse/stringify for a deep clone
      const companies = JSON.parse(
        JSON.stringify(companiesByPlayerCount[shuffledPlayers.length])
      );
      const countries = JSON.parse(
        JSON.stringify(countriesByPlayerCount[shuffledPlayers.length])
      );
      const sectors = JSON.parse(
        JSON.stringify(sectorsByPlayerCount[shuffledPlayers.length])
      );
      const shuffledCompanies = action.shuffle ? shuffle(companies) : companies;
      const shuffledCountries = action.shuffle ? shuffle(countries) : countries;
      const shuffledSectors = action.shuffle ? shuffle(sectors) : sectors;
      for (var i = 0; i < shuffledPlayers.length; i++) {
        shuffledPlayers[i].country = shuffledCountries[i];
        shuffledPlayers[i].sector = shuffledSectors[i];
      }

      let startingState = {
        ...state,
        players: shuffledPlayers,
        status: `Starting bid: ${shuffledPlayers[0].player}`,
        round: 1,
        turn: 0,
        startTime: new Date().toISOString(),
        auctions: shuffledCompanies.slice(0, 1),
        tutorial: action.tutorial,
        privateData: {
          upcomingAuctions: shuffledCompanies.slice(1),
        },
      };

      // Check for bot bids, in case the first starting player is a bot
      return reduce(startingState, { type: "BOT" });
    case "BID":
      const priorBidsThisRound = getNumberOfBidsInCurrentAuction(state);
      if (priorBidsThisRound === 0 && action.bid === 0) {
        return {
          errorMessage: "You can't set a starting bid at 0.",
        };
      }

      const startingPlayer = state.players[state.turn];
      const startingBid =
        startingPlayer &&
        state.auctions[state.auctions.length - 1][startingPlayer.id];
      if (action.bid === startingBid) {
        return {
          errorMessage: "You can't bid equal to starting bid.",
        };
      }

      const newAuctions = [...state.auctions];
      const newUpcomingAuctions = [...state.privateData.upcomingAuctions];

      // Record this bid
      newAuctions[newAuctions.length - 1][action.userId] = action.bid;
      if (action.userId === startingPlayer.id) {
        newAuctions[newAuctions.length - 1].startingPlayer = startingPlayer.id;
      }

      const isLastBidOfRound = priorBidsThisRound === state.players.length - 1;
      const isFinalRound = state.privateData.upcomingAuctions.length === 0;
      const currentAuction = newAuctions[newAuctions.length - 1];
      const isThreePlayerGame = state.players.length === 3;
      const isPenultimateAuction =
        state.privateData.upcomingAuctions.length === 1;

      const [highestBid, highestBidders] = state.players.reduce(
        (highest, currentPlayer) => {
          const currentBid = currentAuction[currentPlayer.id];
          if (currentBid > highest[0]) {
            return [currentBid, [currentPlayer]];
          }
          if (currentBid === highest[0]) {
            return [currentBid, [...highest[1], currentPlayer]];
          }
          return highest;
        },
        [0, []]
      );

      let nextTurn = state.turn;
      let newStatus = state.status;
      let nextRound = state.round;

      if (
        isLastBidOfRound &&
        highestBidders.length > 1 &&
        (!currentAuction.rebid || currentAuction.rebid < 2) &&
        !(isThreePlayerGame && isFinalRound)
      ) {
        const tiedPlayerNames = highestBidders
          .map((player) => player.player)
          .join(", ");
        newStatus = `There was a tie. Waiting for ${tiedPlayerNames} to rebid.`;
        const rebidAuction = { ...currentAuction };
        rebidAuction.rebid = rebidAuction.rebid ? rebidAuction.rebid + 1 : 1;
        highestBidders.forEach((player) => {
          rebidAuction[player.id] = undefined;
        });
        newAuctions.push(rebidAuction);
        const rebidState = {
          ...state,
          status: newStatus,
          auctions: newAuctions,
        };
        return reduce(rebidState, { type: "BOT" });
      }

      if (isLastBidOfRound && highestBidders.length === 1) {
        newAuctions[newAuctions.length - 1].winner = highestBidders[0].id;
      }

      if (
        isLastBidOfRound &&
        highestBidders.length > 1 &&
        currentAuction.rebid === 2 &&
        !(isThreePlayerGame && isFinalRound)
      ) {
        const sorted = getSortedBidsForCurrentAuction(
          state.players,
          newAuctions[newAuctions.length - 1]
        );
        const winningBid = sorted.find((bid) => bid.bidders.length === 1);
        newAuctions[newAuctions.length - 1].winner = winningBid.bidders[0].id;
      }

      if (isLastBidOfRound && isFinalRound) {
        newStatus = "Game over!";
        return {
          ...state,
          status: newStatus,
          auctions: newAuctions,
          gameOver: true,
        };
      }

      if (isLastBidOfRound) {
        newAuctions.push(newUpcomingAuctions.pop());
      }

      if (isLastBidOfRound && isThreePlayerGame && isPenultimateAuction) {
        newStatus = `Final round`;
        nextTurn = "final";
        nextRound = "final";
      }

      if (isLastBidOfRound && !(isThreePlayerGame && isPenultimateAuction)) {
        nextTurn = (state.turn + 1) % state.players.length;
        newStatus = `Starting bid: ${state.players[nextTurn].player}`;
        if (nextTurn === 0) {
          nextRound++;
        }
      }

      if (priorBidsThisRound === 0) {
        newStatus = `Starting bid: ${action.bid}`;
      }

      newAuctions[newAuctions.length - 1].round = nextRound;

      let bidState = {
        ...state,
        status: newStatus,
        auctions: newAuctions,
        privateData: {
          ...state.privateData,
          upcomingAuctions: newUpcomingAuctions,
        },
        turn: nextTurn,
        round: nextRound,
      };

      if (action.userId.substring(0, 4) !== "bot-") {
        // If the current bid is not a bot, check for bot bids
        return reduce(bidState, { type: "BOT" });
      }

      if (nextTurn !== state.turn) {
        // If the next round has started, check for bot bids
        return reduce(bidState, { type: "BOT" });
      }

      return bidState;
    case "BOT":
      const bots = state.players.filter((x) => x.id.substring(0, 4) === "bot-");
      if (!bots.length) {
        // There are no bots in this game
        return state;
      }

      let thisAuction = state.auctions[state.auctions.length - 1];
      if (bots.every((bot) => typeof thisAuction[bot.id] !== "undefined")) {
        // All bots have already bid in this round
        return state;
      }

      const priorBids = getNumberOfBidsInCurrentAuction(state);
      const startingPlayerIsBot =
        Number.isInteger(state.turn) &&
        bots.find((bot) => state.players[state.turn].id === bot.id);
      if (priorBids === 0 && !startingPlayerIsBot) {
        // Waiting for a non-bot player to set a starting bid
        return state;
      }

      let botState = { ...state };
      if (priorBids === 0 && startingPlayerIsBot) {
        // Set a starting bid for a bot
        botState = reduce(botState, {
          type: "BID",
          userId: startingPlayerIsBot.id,
          bid: 1,
        });
      }

      thisAuction = botState.auctions[botState.auctions.length - 1];
      const thisStartingBid = thisAuction[thisAuction.startingPlayer];
      bots.forEach((bot) => {
        if (!thisAuction[bot.id]) {
          // Bid for each non-starting bot who hasn't bid yet
          let randomBid = botState.tutorial ? Math.ceil(Math.random() * 10) : 0;
          if (randomBid === thisStartingBid) {
            randomBid++;
          }
          botState = reduce(botState, {
            type: "BID",
            userId: bot.id,
            bid: randomBid,
          });
        }
      });

      return botState;
  }
  return state;
}

function getNumberOfBidsInCurrentAuction(gameState) {
  return gameState.players.reduce((total, player) => {
    const currentAuction = gameState.auctions[gameState.auctions.length - 1];
    if (typeof currentAuction[player.id] !== "undefined") {
      return total + 1;
    }
    return total;
  }, 0);
}

function getSortedBidsForCurrentAuction(players, auction) {
  const bids = {};
  players.forEach((player) => {
    bids[auction[player.id]] = bids[auction[player.id]]
      ? [...bids[auction[player.id]], player]
      : [player];
  });
  return Object.entries(bids)
    .map((entry) => ({ bid: entry[0], bidders: entry[1] }))
    .sort((a, b) => b.bid - a.bid);
}

module.exports = {
  reduce,
  createNewGame,
};

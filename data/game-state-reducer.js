const { shuffle } = require("../util/shuffle");
const { companiesByPlayerCount } = require("./companies");

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
      const companies = companiesByPlayerCount[shuffledPlayers.length];
      const shuffledCompanies = action.shuffle ? shuffle(companies) : companies;

      let startingState = {
        ...state,
        players: shuffledPlayers,
        status: `Waiting for ${shuffledPlayers[0].player} to set a starting bid`,
        round: 1,
        turn: 0,
        auctions: [shuffledCompanies.slice(0, 1)],
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
      newAuctions[newAuctions.length - 1][action.userId] = action.bid;

      const isLastBidOfRound = priorBidsThisRound === state.players.length - 1;
      const isFinalRound = state.privateData.upcomingAuctions.length === 0;

      let nextTurn = state.turn;
      let newStatus = state.status;
      if (priorBidsThisRound === 0) {
        newStatus = `Starting bid: ${action.bid}`;
      } else if (isLastBidOfRound) {
        if (isFinalRound) {
          newStatus = "Game over!";
        } else {
          const isThreePlayerGame = state.players.length === 3;
          const isPenultimateAuction =
            state.privateData.upcomingAuctions.length === 1;

          if (isThreePlayerGame && isPenultimateAuction) {
            newStatus = `Final round`;
            newAuctions.push(newUpcomingAuctions.pop());
            nextTurn = "final";
          } else {
            newStatus = `Waiting for ${state.players[nextTurn].player} to make a starting bid.`;
            newAuctions.push(newUpcomingAuctions.pop());
            nextTurn = (state.turn + 1) % state.players.length;
          }
        }
      }

      let bidState = {
        ...state,
        status: newStatus,
        auctions: newAuctions,
        privateData: {
          ...state.privateData,
          upcomingAuctions: newUpcomingAuctions,
        },
        turn: nextTurn,
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

      let currentAuction = state.auctions[state.auctions.length - 1];
      if (bots.every((bot) => typeof currentAuction[bot.id] !== "undefined")) {
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

      currentAuction = botState.auctions[botState.auctions.length - 1];
      bots.forEach((bot) => {
        if (!currentAuction[bot.id]) {
          // Bid for each non-starting bot who hasn't bid yet
          botState = reduce(botState, { type: "BID", userId: bot.id, bid: 0 });
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

module.exports = {
  reduce,
  createNewGame,
};

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
      const shuffledPlayers = shuffle(state.players);
      const shuffledCompanies = shuffle(
        companiesByPlayerCount[
          shuffledPlayers.length < 3 ? 3 : shuffledPlayers.length
        ]
      );

      return {
        ...state,
        players: shuffledPlayers,
        status: `Waiting for ${shuffledPlayers[0].player} to set a starting bid`,
        round: 1,
        turn: 0,
        auctions: [shuffledCompanies.pop()],
        privateData: {
          upcomingAuctions: shuffledCompanies,
        },
      };
    case "BID":
      const priorBidsThisRound = getNumberOfBidsInCurrentAuction(state);
      const startingBid = !priorBidsThisRound;
      const finalBid = priorBidsThisRound === state.players.length - 1;
      const nextTurn = finalBid
        ? (state.turn + 1) % state.players.length
        : state.turn;

      const newAuctions = [...state.auctions];
      newAuctions[newAuctions.length - 1][action.userId] = action.bid;

      let newStatus = state.status;
      if (startingBid) {
        newStatus = `Starting bid: ${action.bid}`;
      } else if (finalBid) {
        if (state.privateData.upcomingAuctions.length === 0) {
          newStatus = "Game over!";
        } else {
          newStatus = `Waiting for ${state.players[nextTurn].player} to make a starting bid.`;
          newAuctions.push(state.privateData.upcomingAuctions.pop());
        }
      }

      return {
        ...state,
        status: newStatus,
        auctions: newAuctions,
        turn: nextTurn,
      };
  }
  return state;
}

function getNumberOfBidsInCurrentAuction(gameState) {
  return gameState.players.reduce((total, player) => {
    const currentAuction = gameState.auctions[gameState.auctions.length - 1];
    if (currentAuction[player.id]) {
      total++;
    }
    return total;
  }, 0);
}

module.exports = {
  reduce,
  createNewGame,
};

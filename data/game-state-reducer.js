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
  }
  return state;
}

module.exports = {
  reduce,
  createNewGame,
};

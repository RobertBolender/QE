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
  }
  return state;
}

module.exports = {
  reduce,
  createNewGame,
};

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
};

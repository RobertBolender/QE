const { createNewGame, reduce } = require("./game-state-reducer");
const { createUserId } = require("../util/crypto");

test("Can create, join, and start a game", () => {
  let game = createNewGame("testGameId", "testGameName", createBot());
  expect(game.players.length).toBe(1);

  game = reduce(game, { type: "JOIN", createBot() });
  expect(game.players.length).toBe(2);

  game = reduce(game, { type: "JOIN", createBot() });
  expect(game.players.length).toBe(3);

  game = reduce(game, { type: "START" });
  expect(game.round).toBe(1);
});

function createBot() {
  return {
    id: createUserId(),
    player: "Computer",
  };
}

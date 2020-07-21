const { createNewGame, reduce } = require("./game-state-reducer");
const { createUserId } = require("../util/crypto");

test("Can create, join, and start a game", () => {
  let game = createNewGame("testGameId", "testGameName", createBot());
  expect(game.players.length).toBe(1);

  game = reduce(game, { type: "JOIN", player: createBot() });
  expect(game.players.length).toBe(2);

  game = reduce(game, { type: "JOIN", player: createBot() });
  expect(game.players.length).toBe(3);

  game = reduce(game, { type: "START" });
  expect(game.round).toBe(1);
});

test("Can't bid equal to starting bid", () => {
  const player1 = createBot();
  const player2 = createBot();
  const player3 = createBot();

  let game = createNewGame("testGameId", "testGameName", player1);
  game = reduce(game, { type: "JOIN", player: player2 });
  game = reduce(game, { type: "JOIN", player: player3 });
  game = reduce(game, { type: "START" });

  const firstPlayer = game.players[game.turn];
  const secondPlayer = game.players[game.turn + 1];
  game = reduce(game, { type: "BID", userId: firstPlayer.id, bid: 5 });
  expect(game.auctions[0][firstPlayer.id]).toBe(5);
  game = reduce(game, { type: "BID", userId: secondPlayer.id, bid: 5 });
  expect(game.errorMessage).toBeDefined();
});

function createBot() {
  return {
    id: createUserId(),
    player: "Computer",
  };
}

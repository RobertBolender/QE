const { createNewGame, reduce } = require("./game-state-reducer");
const { createUserId } = require("../util/crypto");

test("Can create, join, and start a game", () => {
  let game = createNewGame("testGameId", "testGameName", createBot());
  expect(game.players.length).toBe(1);

  game = reduce(game, { type: "JOIN", player: createBot() });
  expect(game.players.length).toBe(2);

  game = reduce(game, { type: "JOIN", player: createBot() });
  expect(game.players.length).toBe(3);

  expect(game.round).toBe(0);
  game = reduce(game, { type: "START" });
  expect(game.round).toBe(1);
});

test("Can't bid 0 for starting bid", () => {
  const player1 = createTestUser();
  const player2 = createTestUser();
  const player3 = createTestUser();

  let game = createNewGame("testGameId", "testGameName", player1);
  game = reduce(game, { type: "JOIN", player: player2 });
  game = reduce(game, { type: "JOIN", player: player3 });
  game = reduce(game, { type: "START", shuffle: false });

  game = reduce(game, { type: "BID", userId: player1.id, bid: 0 });
  expect(game.errorMessage).toBeDefined();
});

test("Can't bid equal to starting bid", () => {
  const player1 = createTestUser();
  const player2 = createTestUser();
  const player3 = createTestUser();

  let game = createNewGame("testGameId", "testGameName", player1);
  game = reduce(game, { type: "JOIN", player: player2 });
  game = reduce(game, { type: "JOIN", player: player3 });
  game = reduce(game, { type: "START", shuffle: false });

  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.auctions[0][player1.id]).toBe(5);
  game = reduce(game, { type: "BID", userId: player2.id, bid: 5 });
  expect(game.errorMessage).toBeDefined();
});

test("3 player game ends after 16 bids", () => {
  const player1 = createTestUser();
  const player2 = createBot();
  const player3 = createBot();

  let game = createNewGame("testGameId", "testGameName", player1);
  game = reduce(game, { type: "JOIN", player: player2 });
  game = reduce(game, { type: "JOIN", player: player3 });

  expect(game.auctions).toHaveLength(0);
  expect(game.privateData).toBeUndefined();
  game = reduce(game, { type: "START", shuffle: false });
  expect(game.auctions).toHaveLength(1);
  expect(game.privateData.upcomingAuctions).toHaveLength(15);

  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe("final");
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });

  expect(game.status).toBe("Game over!");
});

test("4 player game ends after 16 bids", () => {
  const player1 = createTestUser();
  const player2 = createBot();
  const player3 = createBot();
  const player4 = createBot();

  let game = createNewGame("testGameId", "testGameName", player1);
  game = reduce(game, { type: "JOIN", player: player2 });
  game = reduce(game, { type: "JOIN", player: player3 });
  game = reduce(game, { type: "JOIN", player: player4 });

  expect(game.auctions).toHaveLength(0);
  expect(game.privateData).toBeUndefined();
  game = reduce(game, { type: "START", shuffle: false });
  expect(game.auctions).toHaveLength(1);
  expect(game.privateData.upcomingAuctions).toHaveLength(15);

  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(3);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(3);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(3);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(3);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });

  expect(game.status).toBe("Game over!");
});

// test("5 player game ends after 3 rounds", () => {
//   const player1 = createTestUser();
//   const player2 = createBot();
//   const player3 = createBot();
//   const player4 = createBot();
//   const player5 = createBot();

//   let game = createNewGame("testGameId", "testGameName", player1);
//   game = reduce(game, { type: "JOIN", player: player2 });
//   game = reduce(game, { type: "JOIN", player: player3 });
//   game = reduce(game, { type: "JOIN", player: player4 });
//   game = reduce(game, { type: "JOIN", player: player5 });
//   game = reduce(game, { type: "START", shuffle: false });

//   game = reduce(game, { type: "BID", userId: player1.id, bid: 1 });
//   game = reduce(game, { type: "BID", userId: player1.id, bid: 2 });
//   game = reduce(game, { type: "BID", userId: player1.id, bid: 3 });
//   expect(game.status).toBe("Game over!");
// });

function createTestUser() {
  return {
    id: createUserId(),
    player: "Test User",
  };
}

function createBot() {
  return {
    id: `bot-${createUserId()}`,
    player: "Computer",
  };
}

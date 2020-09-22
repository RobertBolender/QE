const { createNewGame, reduce } = require("./game-state-reducer");
const { createUserId } = require("../util/crypto");

test("Can create, join, and start a game", () => {
  let game = createNewGame(createTestGameId(), "testGameName", createBot());
  expect(game.players.length).toBe(1);

  game = reduce(game, { type: "JOIN", player: createBot() });
  expect(game.players.length).toBe(2);

  game = reduce(game, { type: "JOIN", player: createBot() });
  expect(game.players.length).toBe(3);

  expect(game.round).toBe(0);
  game = reduce(game, { type: "START" });
  // let the bots play
  expect(game.gameOver).toBe(true);
});

test("Can't bid 0 for starting bid", () => {
  const player1 = createTestUser();
  const player2 = createTestUser();
  const player3 = createTestUser();

  let game = createNewGame(createTestGameId(), "testGameName", player1);
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

  let game = createNewGame(createTestGameId(), "testGameName", player1);
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

  let game = createNewGame(createTestGameId(), "testGameName", player1);
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

  let game = createNewGame(createTestGameId(), "testGameName", player1);
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

test("5 player game ends after 15 bids", () => {
  const player1 = createTestUser();
  const player2 = createBot();
  const player3 = createBot();
  const player4 = createBot();
  const player5 = createBot();

  let game = createNewGame(createTestGameId(), "testGameName", player1);
  game = reduce(game, { type: "JOIN", player: player2 });
  game = reduce(game, { type: "JOIN", player: player3 });
  game = reduce(game, { type: "JOIN", player: player4 });
  game = reduce(game, { type: "JOIN", player: player5 });

  expect(game.auctions).toHaveLength(0);
  expect(game.privateData).toBeUndefined();
  game = reduce(game, { type: "START", shuffle: false });
  expect(game.auctions).toHaveLength(1);
  expect(game.privateData.upcomingAuctions).toHaveLength(14);

  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(3);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(4);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(3);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(4);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(3);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  expect(game.turn).toBe(4);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });

  expect(game.status).toBe("Game over!");
});

test("All bids are re-evaluated after a re-bid", () => {
  const player1 = createTestUser();
  const player2 = createTestUser();
  const player3 = createTestUser();
  const player4 = createTestUser();

  let game = createNewGame(createTestGameId(), "testGameName", player1);
  game = reduce(game, { type: "JOIN", player: player2 });
  game = reduce(game, { type: "JOIN", player: player3 });
  game = reduce(game, { type: "JOIN", player: player4 });
  game = reduce(game, { type: "START", shuffle: false });

  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 1 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player3.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player4.id, bid: 4 });
  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player2.id, bid: 3 });
  game = reduce(game, { type: "BID", userId: player3.id, bid: 4 });
  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player3.id, bid: 6 });
  game = reduce(game, { type: "BID", userId: player4.id, bid: 3 });
  expect(game.turn).toBe(1);
  expect(game.auctions[0].winner).toBeUndefined();
  expect(game.auctions[1].winner).toBeUndefined();
  expect(game.auctions[2].winner).toBe(player3.id);
});

test("After a 3rd consecutive tie, the highest non-tied bid wins", () => {
  const player1 = createTestUser();
  const player2 = createTestUser();
  const player3 = createTestUser();

  let game = createNewGame(createTestGameId(), "testGameName", player1);
  game = reduce(game, { type: "JOIN", player: player2 });
  game = reduce(game, { type: "JOIN", player: player3 });
  game = reduce(game, { type: "START", shuffle: false });

  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 1 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player3.id, bid: 5 });
  expect(game.turn).toBe(0);
  expect(game.auctions.length).toBe(2);
  game = reduce(game, { type: "BID", userId: player2.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player3.id, bid: 5 });
  expect(game.turn).toBe(0);
  expect(game.auctions.length).toBe(3);
  game = reduce(game, { type: "BID", userId: player2.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player3.id, bid: 5 });
  expect(game.turn).toBe(1);
  expect(game.auctions.length).toBe(4);
  expect(game.auctions[0].rebid).toBeUndefined();
  expect(game.auctions[0].winner).toBeUndefined();
  expect(game.auctions[1].rebid).toBe(1);
  expect(game.auctions[1].winner).toBeUndefined();
  expect(game.auctions[2].rebid).toBe(2);
  expect(game.auctions[2].winner).toBe(player1.id);
});

test("Ties are not re-bid in final round of 3-player game", () => {
  const player1 = createTestUser();
  const player2 = createTestUser();
  const player3 = createBot();

  let game = createNewGame(createTestGameId(), "testGameName", player1);
  game = reduce(game, { type: "JOIN", player: player2 });
  game = reduce(game, { type: "JOIN", player: player3 });

  expect(game.auctions).toHaveLength(0);
  expect(game.privateData).toBeUndefined();
  game = reduce(game, { type: "START", shuffle: false });
  expect(game.auctions).toHaveLength(1);
  expect(game.privateData.upcomingAuctions).toHaveLength(15);

  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 6 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 6 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 6 });
  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 6 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 6 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 6 });
  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 6 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 6 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 6 });
  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 6 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 6 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 6 });
  expect(game.turn).toBe(0);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 6 });
  expect(game.turn).toBe(1);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 6 });
  expect(game.turn).toBe(2);
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 6 });
  expect(game.turn).toBe("final");
  game = reduce(game, { type: "BID", userId: player1.id, bid: 5 });
  game = reduce(game, { type: "BID", userId: player2.id, bid: 5 });

  expect(game.auctions[game.auctions.length - 1].winner).toBeUndefined;
  expect(game.status).toBe("Game over!");
});

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

let testGameId = 0;
function createTestGameId() {
  testGameId++;
  return `test-game-${testGameId}`;
}

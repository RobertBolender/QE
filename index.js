// Server setup
const express = require("express");
const app = express();
const port = 3131;

app.use(express.json());
app.use(express.static("public"));

// Utilities
const hash = require("object-hash");
const { createGameId, createUserId } = require("./util/crypto");
const { sanitizeNumericInput, sanitizeStringInput } = require("./util/input");
const { sessionHandler, getUserId } = require("./util/session-handler");
app.use(sessionHandler);

// Game data
const { createNewGame, reduce } = require("./data/game-state-reducer");
function createBot() {
  return {
    id: `bot-${createUserId()}`,
    player: "Computer",
  };
}

// Game state
const activeGames = new Map();
const pendingGames = new Map();
const activePlayers = new Map();

/**
 * Get the game state information the current user is allowed to see.
 */
function getGameState(userId, gameId) {
  let game = pendingGames.get(gameId);
  if (game) {
    const gameState = { ...game };
    gameState.currentUser = userId;
    return { ...gameState, hash: hash(gameState) };
  }

  game = activeGames.get(gameId);
  if (!game) {
    return {};
  }

  const { privateData, ...gameState } = game;
  gameState.currentUser = userId;

  const visibleAuctionData = gameState.gameOver
    ? privateData.auctions
    : privateData.auctions.map((auction, index) => {
        const visibleData = {
          country: auction.country,
          value: auction.value,
          sector: auction.sector,
          winner: auction.winner,
          startingPlayer: auction.startingPlayer,
        };
        gameState.players.forEach((player) => {
          if (
            player.id === userId ||
            auction.startingPlayer === player.id ||
            auction.startingPlayer === userId
          ) {
            visibleData[player.id] = auction[player.id];
          } else if (
            gameState.players.length !== 3 &&
            auction[player.id] === 0
          ) {
            visibleData[player.id] = 0;
          } else if (auction.winner === player.id) {
            visibleData[player.id] = `> ${auction[userId]}`;
          } else {
            visibleData[player.id] = auction[player.id] ? "?" : null;
          }
        });
        if (gameState.peeks[userId] === index) {
          visibleData[auction.winner] = auction[auction.winner];
        }
        return visibleData;
      });

  const visiblePlayerData = gameState.gameOver
    ? privateData.playersWithSectors
    : gameState.players.map((player, index) => {
        if (player.id === userId) {
          player.sector = privateData.playersWithSectors[index].sector;
        }
        return player;
      });

  const visibleGameState = {
    ...gameState,
    auctions: visibleAuctionData,
    players: visiblePlayerData,
  };

  return { ...visibleGameState, hash: hash(visibleGameState) };
}

/**
 * GET /game/current
 *
 * Get the current game, if you are in one
 */
app.get("/game/current", (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.json({});
  }

  const gameId = activePlayers.get(userId);
  return res.json(getGameState(userId, gameId));
});

/**
 * GET /game/:id
 *
 * Get the current game state.
 */
app.get("/game/:id", (req, res) => {
  const gameId = req.params.id;
  const userId = getUserId(req);
  const gameState = getGameState(userId, gameId);

  if (!gameState.id) {
    return res.status(400).send("Game not found.");
  }

  return res.json(gameState);
});

/**
 * POST /game/:id/join
 *
 * Join the selected game as a player.
 */
app.post("/game/:id/join", (req, res) => {
  const gameId = req.params.id;
  if (!pendingGames.has(gameId)) {
    return res.status(404).send("Game not found.");
  }

  const player = sanitizeStringInput(req.body.player);
  if (!player) {
    return res.status(400).send("You need a name to create a game.");
  }

  const bid = sanitizeNumericInput(req.body.bid);
  if (!bid) {
    return res.status(400).send("You need a bid to join a game.");
  }

  const userId = getUserId(req);
  if (activePlayers.has(userId)) {
    return res.status(400).send("You are already playing a game!");
  }
  activePlayers.set(userId, gameId);

  const oldState = pendingGames.get(gameId);
  const newState = reduce(oldState, {
    type: "JOIN",
    player: { id: getUserId(req), bid, player },
  });

  pendingGames.set(gameId, newState);
  return res.json(getGameState(userId, gameId));
});

/**
 * POST /game/:id/quit
 *
 * Quit the selected game.
 */
app.post("/game/:id/quit", (req, res) => {
  const gameId = req.params.id;
  if (activeGames.has(gameId)) {
    return res.status(400).send("Can't leave an active game.");
  }

  if (!pendingGames.has(gameId)) {
    return res.status(404).send("Game not found.");
  }

  const userId = getUserId(req);
  if (activePlayers.get(userId) !== gameId) {
    return res.status(400).send("You aren't even playing this game!");
  }

  activePlayers.delete(userId);

  const oldState = pendingGames.get(gameId);
  const newState = reduce(oldState, { type: "QUIT", userId });

  if (newState.players.length === 0) {
    pendingGames.delete(gameId);
  } else {
    pendingGames.set(gameId, newState);
  }

  return res.json({});
});

/**
 * POST /game/:id/start
 *
 * Start the selected game.
 */
app.post("/game/:id/start", (req, res) => {
  const gameId = req.params.id;
  const game = pendingGames.get(gameId);
  if (!game) {
    return res.status(404).send("Game not found.");
  }

  const userId = getUserId(req);
  if (activePlayers.get(userId) !== gameId) {
    return res.status(400).send("You aren't even playing this game!");
  }

  if (game.players.length < 3) {
    return res.status(400).send("You need at least 3 players to play.");
  }

  // TODO: split the players into multiple games instead
  if (game.players.length > 5) {
    return res.status(400).send("You can't play with more than 5 players.");
  }

  const newState = reduce(game, { type: "START", shuffle: true });

  activeGames.set(gameId, newState);
  pendingGames.delete(gameId);

  return res.json(getGameState(userId, gameId));
});

/**
 * POST /game/quickstart
 *
 * Start a new game with bots
 */
app.post("/game/quickstart", (req, res) => {
  const gameId = createGameId();
  const userId = getUserId(req);

  let newGame = createNewGame(gameId, "Quick game", {
    id: userId,
    bid: 4,
    player: "Human",
  });
  newGame = reduce(newGame, { type: "JOIN", player: createBot() });
  newGame = reduce(newGame, { type: "JOIN", player: createBot() });
  newGame = reduce(newGame, { type: "JOIN", player: createBot() });
  newGame = reduce(newGame, { type: "JOIN", player: createBot() });
  newGame = reduce(newGame, { type: "START", shuffle: true, tutorial: true });

  activeGames.set(gameId, newGame);
  activePlayers.set(userId, gameId);

  return res.json(getGameState(userId, gameId));
});

/**
 * POST /game/:id/bid
 *
 * Attempt to place a bid.
 */
app.post("/game/:id/bid", (req, res) => {
  const gameId = req.params.id;
  const game = activeGames.get(gameId);
  if (!game) {
    return res.status(404).send("Game not found.");
  }

  const currentAuction =
    game.privateData.auctions[game.privateData.auctions.length - 1];
  const userId = getUserId(req);
  if (currentAuction[userId]) {
    return res.status(400).send("You already bid this round.");
  }

  const bid = sanitizeNumericInput(req.body.bid);
  const newState = reduce(game, { type: "BID", userId, bid });
  if (newState.errorMessage) {
    return res.status(400).send(newState.errorMessage);
  }

  activeGames.set(gameId, newState);
  return res.json(getGameState(userId, gameId));
});

/**
 * POST /game/:id/peek
 *
 * Attempt to peek at the last winning bid
 */
app.post("/game/:id/peek", (req, res) => {
  const gameId = req.params.id;
  const game = activeGames.get(gameId);
  if (!game) {
    return res.status(404).send("Game not found.");
  }

  const userId = getUserId(req);
  const newState = reduce(game, { type: "PEEK", userId });
  if (newState.errorMessage) {
    return res.status(400).send(newState.errorMessage);
  }

  activeGames.set(gameId, newState);
  return res.json(getGameState(userId, gameId));
});

/**
 * POST /game/:id/flip
 *
 * Flip the table and end the selected game. How rude.
 */
app.post("/game/:id/flip", (req, res) => {
  const gameId = req.params.id;
  if (pendingGames.has(gameId)) {
    return res.status(400).send("Can't end a game before it starts.");
  }

  const game = activeGames.get(gameId);
  if (!game) {
    return res.status(404).send("Game not found.");
  }

  const userId = getUserId(req);
  if (activePlayers.get(userId) !== gameId) {
    return res.status(400).send("You aren't even playing this game!");
  }

  game.players.forEach((player) => activePlayers.delete(player.id));
  activeGames.delete(gameId);

  return res.json({});
});

/**
 * GET /games
 *
 * Get a list of games with links to each game.
 */
app.get("/games", (req, res) => {
  if (!req.accepts("html")) {
    return res.json(Array.from(pendingGames.values()));
  }

  const pendingGameCount = pendingGames.size;
  if (!pendingGameCount) {
    return res.send("No pending games.");
  }

  const pendingGamesToJoin = Array.from(
    pendingGames,
    ([key, value]) => `<li><a href="${value.url}">${value.name}</a></li>`
  ).join("");

  return res.send(`<p>Pending Games:</p><ul>${pendingGamesToJoin}</ul>`);
});

/**
 * POST /games
 *
 * Create a new pending game.
 */
app.post("/games", (req, res) => {
  const name = sanitizeStringInput(req.body.name);
  if (!name) {
    return res.status(400).send("The game needs a name.");
  }

  const player = sanitizeStringInput(req.body.player);
  if (!player) {
    return res.status(400).send("You need a name to create a game.");
  }

  const bid = sanitizeNumericInput(req.body.bid);
  if (!bid) {
    return res.status(400).send("You need a bid to create a game.");
  }

  const gameId = createGameId();
  const userId = getUserId(req);

  const newGame = createNewGame(gameId, name, { id: userId, bid, player });

  pendingGames.set(gameId, newGame);
  activePlayers.set(userId, gameId);

  return res.json(getGameState(userId, gameId));
});

// Here we go
app.listen(port, () =>
  console.log(`QE game server listening at http://localhost:${port}`)
);

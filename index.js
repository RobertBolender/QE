// Server setup
const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static("public"));

// Utilities
const hash = require("object-hash");
const { createGameId } = require("./util/crypto");
const { shuffle } = require("./util/shuffle");
const { sanitizeNumericInput } = require("./util/input");
const { sessionHandler, getUserId } = require("./util/session-handler");
app.use(sessionHandler);

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

  /**
   * TODO: return game state as should be seen by the current user
   * game.publicInfo
   *  peeks, auctions, winners
   * game.privateInfo {
   *  userId: { bids, advantage }
   * }
   */

  return { ...gameState, hash: hash(gameState) };
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

  if (!req.body.player) {
    return res.status(400).send("You need a name to create a game.");
  }

  if (!req.body.bid) {
    return res.status(400).send("You need a bid to join a game.");
  }

  const userId = getUserId(req);
  if (activePlayers.has(userId)) {
    return res.status(400).send("You are already playing a game!");
  }
  activePlayers.set(userId, gameId);

  const game = pendingGames.get(gameId);
  const bid = sanitizeNumericInput(req.body.bid);
  game.players = [
    ...game.players,
    { id: getUserId(req), bid, player: req.body.player },
  ];

  return res.json(pendingGames.get(gameId));
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

  const game = pendingGames.get(gameId);
  game.players = [...game.players.filter((player) => player.id !== userId)];

  if (game.players.length === 0) {
    pendingGames.delete(gameId);
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

  // TODO: require 3 players to play
  if (game.players.length < 1) {
    return res.status(400).send("You need at least 3 players to play.");
  }

  const shuffledPlayers = shuffle(game.players);

  activeGames.set(gameId, {
    ...game,
    players: shuffledPlayers,
    status: `Waiting for ${shuffledPlayers[0].player} to set a starting bid`,
    round: 1,
    turn: 0,
    auctions: [{}],
  });
  pendingGames.delete(gameId);

  return res.json(activeGames.get(gameId));
});

function getNumberOfBidsInCurrentAuction(gameState) {
  return gameState.players.reduce((total, player) => {
    const currentAuction = gameState.auctions[gameState.auctions.length - 1];
    if (currentAuction[player.id]) {
      total++;
    }
    return total;
  }, 0);
}

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

  const currentAuction = game.auctions[game.auctions.length - 1];
  const userId = getUserId(req);
  if (currentAuction[userId]) {
    return res.status(400).send("You already bid this round.");
  }

  const priorBidsThisRound = getNumberOfBidsInCurrentAuction(game);
  const startingBid = !priorBidsThisRound;
  const finalBid = priorBidsThisRound === game.players.length - 1;
  const nextTurn = finalBid ? (game.turn + 1) % game.players.length : game.turn;

  const newAuctions = [...game.auctions];
  const bid = sanitizeNumericInput(req.body.bid);
  newAuctions[newAuctions.length - 1][userId] = bid;

  let newStatus = game.status;
  if (startingBid) {
    newStatus = `Starting bid: ${bid}`;
  } else if (finalBid) {
    if (game.round === "last") {
      newStatus = "Game over!";
    } else {
      newStatus = `Waiting for ${game.players[nextTurn].player} to make a starting bid.`;
      newAuctions.push({});
    }
  }

  activeGames.set(gameId, {
    ...game,
    status: newStatus,
    auctions: newAuctions,
    turn: nextTurn,
  });

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

  if (!activeGames.has(gameId)) {
    return res.status(404).send("Game not found.");
  }

  const userId = getUserId(req);
  if (activePlayers.get(userId) !== gameId) {
    return res.status(400).send("You aren't even playing this game!");
  }

  activePlayers.delete(userId);
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
  if (!req.body.name) {
    return res.status(400).send("The game needs a name.");
  }

  if (!req.body.player) {
    return res.status(400).send("You need a name to create a game.");
  }

  if (!req.body.bid) {
    return res.status(400).send("You need a bid to create a game.");
  }

  const gameId = createGameId();
  const userId = getUserId(req);
  const bid = sanitizeNumericInput(req.body.bid);
  const newGame = {
    id: gameId,
    name: req.body.name, // TODO: Sanitize name input
    url: `/game/${gameId}`,
    status: "Waiting for players",
    round: 0,
    auctions: [],
    players: [{ id: userId, bid, player: req.body.player }],
    turn: 0,
  };
  pendingGames.set(gameId, newGame);
  activePlayers.set(userId, gameId);
  return res.json(newGame);
});

// Here we go
app.listen(port, () =>
  console.log(`QE game server listening at http://localhost:${port}`)
);

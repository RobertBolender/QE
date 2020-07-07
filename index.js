// Server setup
const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static("public"));

// Utilities
const { createGameId } = require("./util/crypto");
const { sessionHandler, getUserId } = require("./util/session-handler");
app.use(sessionHandler);

// Game state
const activeGames = new Map();
const pendingGames = new Map();

/**
 * GET /game/:id
 *
 * Get the current game state.
 */
app.get("/game/:id", (req, res) => {
  const gameId = req.params.id;
  if (activeGames.has(gameId)) {
    return res.json(activeGames.get(gameId));
  }

  if (pendingGames.has(gameId)) {
    return res.json(pendingGames.get(gameId));
  }

  return res.status(400).send("Game not found.");
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

  const game = pendingGames.get(gameId);
  game.players = [
    ...game.players,
    { id: getUserId(req), bid: req.body.bid, player: req.body.player },
  ];

  return res.json(pendingGames.get(gameId));
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
 * Start a new game.
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

  const newId = createGameId();
  const newGame = {
    id: newId,
    name: req.body.name, // TODO: Sanitize name input
    url: `/game/${newId}`,
    players: [
      { id: getUserId(req), bid: req.body.bid, player: req.body.player },
    ],
  };
  pendingGames.set(newId, newGame);
  return res.json(newGame);
});

// Here we go
app.listen(port, () =>
  console.log(`QE game server listening at http://localhost:${port}`)
);

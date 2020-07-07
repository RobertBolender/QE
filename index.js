// Server setup
const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static("public"));

// Game state
const { sessionHandler, getUserId } = require("./util/session-handler");
app.use(sessionHandler);
const { createGameId } = require("./util/crypto");
const games = new Map();

/**
 * GET /game/:id
 *
 * Get the current game state.
 */
app.get("/game/:id", (req, res) => {
  const gameId = req.params.id;
  if (!games.has(gameId)) {
    return res.status(400).send("Game not found.");
  }

  return res.json(games.get(gameId));
});

/**
 * POST /game/:id/join
 *
 * Join the selected game as a player.
 */
app.post("/game/:id/join", (req, res) => {
  const gameId = req.params.id;
  if (!games.has(gameId)) {
    return res.status(404).send("Game not found.");
  }

  if (!req.body.player) {
    return res.status(400).send("You need a name to create a game.");
  }

  if (!req.body.bid) {
    return res.status(400).send("You need a bid to join a game.");
  }

  const game = games.get(gameId);
  game.players = [
    ...game.players,
    { id: getUserId(req), bid: req.body.bid, player: req.body.player },
  ];

  return res.json(games.get(gameId));
});

/**
 * GET /games
 *
 * Get a list of games with links to each game.
 */
app.get("/games", (req, res) => {
  if (!req.accepts("html")) {
    return res.json(Array.from(games.values()));
  }

  const activeGameCount = games.size;
  if (!activeGameCount) {
    return res.send("No active games.");
  }

  const activeGames = Array.from(
    games,
    ([key, value]) => `<li><a href="${value.url}">${value.name}</a></li>`
  ).join("");

  return res.send(`<p>Active games:</p><ul>${activeGames}</ul>`);
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
  games.set(newId, newGame);
  return res.json(newGame);
});

// Here we go
app.listen(port, () =>
  console.log(`QE game server listening at http://localhost:${port}`)
);

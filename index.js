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
 * GET /games
 *
 * Get a list of games with links to each game.
 */
app.get("/games", (req, res) => {
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
    return res.status(400).send("You need a name to create a game.");
  }

  const newId = createGameId();
  const newGame = {
    id: newId,
    name: req.body.name, // TODO: Sanitize name input
    url: `/game/${newId}`,
    players: [getUserId(req)],
  };
  games.set(newId, newGame);
  return res.json(newGame);
});

// Here we go
app.listen(port, () =>
  console.log(`QE game server listening at http://localhost:${port}`)
);

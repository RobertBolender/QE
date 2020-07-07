import {
  React,
  useCallback,
  useEffect,
  useState,
} from "https://unpkg.com/es-react";
import htm from "https://unpkg.com/htm?module";
const html = htm.bind(React.createElement);

export default function App() {
  const [gameId, setGameId] = useState();

  if (!gameId) {
    return html`<${NewGame} setGameId=${setGameId} />`;
  }

  return html`<${Game} gameId=${gameId} />`;
}

function useExistingGames() {
  const [existingGames, setExistingGames] = useState(false);
  const fetchExistingGames = useCallback(async () => {
    const data = await fetchJson("/games");
    setTimeout(() => setExistingGames(data), 1500);
  }, []);
  useEffect(() => {
    fetchExistingGames();
  }, []);
  return existingGames;
}

function ExistingGames({ games, setGameId }) {
  const [id, setId] = useState();
  const [player, setPlayer] = useState();
  const [bid, setBid] = useState();

  const handleSetPlayer = (event) => setPlayer(event.target.value);
  const handleSetBid = (event) => setBid(event.target.value);

  const handleSelect = useCallback(
    (event) => {
      setId(event.target.value);
    },
    [setId]
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const data = await fetchJson(`/game/${id}/join`, "POST", {
        player,
        bid,
      });
      setGameId(data.id);
    },
    [id, player, bid]
  );

  if (!games || !games.length) {
    return null;
  }

  return html`<div>
    <h2>Join a Game</h2>
    <form onSubmit=${handleSubmit}>
      <label for="game">Pick a Game</label>
      <select
        id="game"
        onChange=${handleSelect}
        disabled=${games.length === 0}
        required
      >
        ${games.length === 0 &&
        html`<option value="">No existing games</option>`}
        ${games.length === 1 && html`<option value="">1 existing game</option>`}
        ${games.length > 1 &&
        html`<option value="">${games.length} existing games</option>`}
        ${games.map(
          (game) =>
            html`<option value=${game.id}
              >${game.name} (${game.players.length})</option
            >`
        )}
      </select>
      <label for="player">Your name</label>
      <input
        id="player"
        name="player"
        type="text"
        required
        onChange=${handleSetPlayer}
      />
      <label for="bid">Opening bid</label>
      <input
        id="bid"
        name="bid"
        type="number"
        min="0"
        step="1"
        required
        onChange=${handleSetBid}
      />
      <p>
        If more than 5 players try to join the game, the highest bid will be
        eliminated and the next 5 highest bids will join the game.
      </p>
      <button type="submit">Join</button>
    </form>
  </div>`;
}

function NewGame({ setGameId }) {
  const loadedGames = useExistingGames();

  const [name, setName] = useState();
  const [player, setPlayer] = useState();
  const [bid, setBid] = useState();

  const handleSetName = (event) => setName(event.target.value);
  const handleSetPlayer = (event) => setPlayer(event.target.value);
  const handleSetBid = (event) => setBid(event.target.value);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const data = await fetchJson("/games", "POST", { name, player, bid });
      setGameId(data.id);
    },
    [name, player, bid]
  );

  return html`<div>
    <h1>QE: Create a Game</h1>
    <${ExistingGames} games=${loadedGames} setGameId=${setGameId} />
    <form method="POST" action="/games" onSubmit=${handleSubmit}>
      <label for="name">Game name</label>
      <input
        id="name"
        name="name"
        type="text"
        required
        onChange=${handleSetName}
      />
      <label for="player">Your name</label>
      <input
        id="player"
        name="player"
        type="text"
        required
        onChange=${handleSetPlayer}
      />
      <label for="bid">Opening bid</label>
      <input
        id="bid"
        name="bid"
        type="number"
        min="0"
        step="1"
        required
        onChange=${handleSetBid}
      />
      <p>
        If more than 5 players try to join the game, the highest bid will be
        eliminated and the next 5 highest bids will join the game.
      </p>
      <button type="submit">Create</button>
    </form>
  </div>`;
}

function Game({ gameId }) {
  return html`<div>
    <h1>QE: Game</h1>
    <p>${gameId}</p>
  </div>`;
}

async function fetchJson(url, method = "GET", body = null) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : null,
  });
  return await response.json();
}

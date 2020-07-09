import {
  React,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "https://unpkg.com/es-react";
import htm from "https://unpkg.com/htm?module";
const html = htm.bind(React.createElement);

export default function App() {
  const [gameState, setGameState] = useState();

  useEffect(async () => {
    const data = await getJson("/game/current");
    setGameState(data);
  }, []);

  if (!gameState) {
    return "Loading...";
  }

  if (!gameState.id) {
    return html`<${JoinOrCreateGame} setGameState=${setGameState} />`;
  }

  return html`<${Game} gameState=${gameState} setGameState=${setGameState} />`;
}

function JoinOrCreateGame({ setGameState }) {
  const [isCreating, setIsCreating] = useState(false);

  const existingGames = useExistingGames();
  useEffect(() => {
    if (existingGames && existingGames.length === 0) {
      setIsCreating(true);
    }
  }, [existingGames]);

  if (!existingGames) {
    return "Loading...";
  }

  return html`<div>
    <div className="radio-set">
      <input
        id="join"
        type="radio"
        name="mode"
        disabled=${existingGames.length === 0}
        checked=${!isCreating}
        onChange=${() => setIsCreating(false)}
      />
      <label for="join"
        >${existingGames.length === 0 ? "No games to join" : "Join Game"}</label
      >
      <input
        id="create"
        type="radio"
        name="mode"
        checked=${isCreating}
        onChange=${() => setIsCreating(true)}
      />
      <label for="create">Create Game</label>
    </div>
    ${isCreating
      ? html`<${NewGame} setGameState="${setGameState}" />`
      : html`<${ExistingGames}
          setGameState=${setGameState}
          games=${existingGames}
        />`}
  </div>`;
}

function useExistingGames() {
  const [existingGames, setExistingGames] = useState(false);
  const fetchExistingGames = useCallback(async () => {
    const data = await getJson("/games");
    setTimeout(() => setExistingGames(data), 150);
  }, []);
  useEffect(() => {
    fetchExistingGames();
  }, []);
  return existingGames;
}

function ExistingGames({ games, setGameState }) {
  const [gameId, setGameId] = useState(
    games && games.length > 0 ? games[0].id : null
  );
  const [player, setPlayer] = useState();
  const [bid, setBid] = useState();

  const handleSetPlayer = (event) => setPlayer(event.target.value);
  const handleSetBid = (event) => setBid(event.target.value);

  const handleSetGameId = useCallback(
    (event) => {
      setGameId(event.target.value);
    },
    [setGameId]
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const data = await postJson(`/game/${gameId}/join`, {
        player,
        bid,
      });
      setGameState(data);
    },
    [gameId, player, bid]
  );

  if (!games || !games.length) {
    return null;
  }

  return html`<div>
    <h1>QE: Join a Game</h1>
    <form onSubmit=${handleSubmit}>
      <label for="game">Pick a Game</label>
      ${games.map(
        (game, index) =>
          html`<label
            ><input
              type="radio"
              name="game"
              value=${game.id}
              onChange=${handleSetGameId}
              checked=${game.id === gameId}
            />${game.name} (${game.players.length})</label
          >`
      )}
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

function NewGame({ setGameState }) {
  const [name, setName] = useState();
  const [player, setPlayer] = useState();
  const [bid, setBid] = useState();

  const handleSetName = (event) => setName(event.target.value);
  const handleSetPlayer = (event) => setPlayer(event.target.value);
  const handleSetBid = (event) => setBid(event.target.value);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const data = await postJson("/games", { name, player, bid });
      setGameState(data);
    },
    [name, player, bid]
  );

  return html`<div>
    <h1>QE: Create a Game</h1>
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

function Game({ gameState = {}, setGameState }) {
  const { hash, id, name, status, round, players } = gameState;

  const lastSeenHash = useRef(hash);
  useEffect(() => {
    const timer = setInterval(async () => {
      const data = await getJson(`/game/current`);
      if (data.errorMessage) {
        console.error(data.errorMessage);
        return;
      }
      if (lastSeenHash.current !== data.hash) {
        lastSeenHash.current = data.hash;
        setGameState(data);
      }
    }, 2000);
    return () => {
      clearInterval(timer);
    };
  }, [lastSeenHash, setGameState]);

  const handleQuit = useCallback(async () => {
    if (!id) {
      return;
    }
    const data = await postJson(`game/${id}/quit`);
    if (data.errorMessage) {
      console.error(data.errorMessage);
      return;
    }
    setGameState(data);
  }, [gameState]);
  const handleStart = useCallback(async () => {
    if (!id) {
      return;
    }
    const data = await postJson(`game/${id}/start`);
    if (data.errorMessage) {
      console.error(data.errorMessage);
      return;
    }
    setGameState(data);
  }, [gameState]);
  const handleFlip = useCallback(async () => {
    if (!id) {
      return;
    }
    const data = await postJson(`game/${id}/flip`);
    if (data.errorMessage) {
      console.error(data.errorMessage);
      return;
    }
    setGameState(data);
  }, [gameState]);
  return html`<div className="game">
    <div className="status-bar">
      <span className="status-message">${status}</span>
      <span className="animate-flicker">🕑</span>
    </div>
    <h1>QE: ${name}</h1>
    <p>Players:</p>
    <ul>
      ${players.map((player) => html`<li>${player.player}</li>`)}
    </ul>
    ${round === 0 &&
    html`<div className="button-set">
      <button onClick=${handleQuit}>Quit</button>
      <button onClick=${handleStart}>Start Game</button>
    </div>`}
    ${round !== 0 &&
    html`<div className="button-set">
      <button onClick=${handleFlip}>Flip the table</button>
    </div>`}
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
  if (response.status === 200) {
    return await response.json();
  } else {
    return {
      status: response.status,
      errorMessage: await response.text(),
    };
  }
}

async function getJson(url) {
  return await fetchJson(url);
}

async function postJson(url, body) {
  return await fetchJson(url, "POST", body);
}

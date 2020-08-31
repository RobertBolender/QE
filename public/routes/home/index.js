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

  return html`<div className="game-lobby">
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

  const handleQuickstart = useCallback(async (event) => {
    event.preventDefault();
    const data = await postJson("/game/quickstart");
    setGameState(data);
  }, []);

  return html`<div>
    <h1>QE: Create a Game</h1>
    <button className="quickstart" onClick=${handleQuickstart}>
      Play a Tutorial Game
    </button>
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

function useCurrentGameState(setGameState, initialGameStateHash) {
  const lastSeenHash = useRef(initialGameStateHash);
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
}

function Game({ gameState = {}, setGameState }) {
  const {
    hash,
    currentUser,
    id,
    name,
    startTime,
    auctions,
    players,
    status,
    round,
    turn,
  } = gameState;

  const currentPlayer = players.find((player) => player.id === currentUser);

  useCurrentGameState(setGameState, hash);

  const handleQuit = useCallback(async () => {
    if (!id) {
      return;
    }
    const data = await postJson(`/game/${id}/quit`);
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
    const data = await postJson(`/game/${id}/start`);
    if (data.errorMessage) {
      console.error(data.errorMessage);
      return;
    }
    setGameState(data);
  }, [gameState]);
  const handleFlip = useCallback(async () => {
    if (
      !id ||
      !confirm("This will end the game. Are you sure you want to do this?")
    ) {
      return;
    }
    const data = await postJson(`/game/${id}/flip`);
    if (data.errorMessage) {
      console.error(data.errorMessage);
      return;
    }
    setGameState(data);
  }, [gameState]);

  const [viewKind, setViewKind] = useState("history");

  const currentAuction = auctions[auctions.length - 1];
  const hasBid =
    currentUser &&
    currentAuction &&
    typeof currentAuction[currentUser] !== "undefined";
  const startingPlayer = players[turn].id;
  const isStartingBid = startingPlayer === currentUser;
  const startingBid = currentAuction && currentAuction[startingPlayer];
  const waitingForStartBid =
    currentAuction && !isStartingBid && typeof startingBid === "undefined";

  const [bid, setBid] = useState();
  const formRef = useRef();
  const bidRef = useRef();
  const handleSetBid = (event) => setBid(event.target.value);
  const handleBid = async (event) => {
    event.preventDefault();
    const data = await postJson(`/game/${id}/bid`, { bid });
    if (data.errorMessage) {
      console.error(data.errorMessage);
      return;
    }
    setGameState(data);
    if (formRef.current) {
      formRef.current.reset();
      if (bidRef.current) {
        bidRef.current.focus();
      }
    }
  };

  return html`<div className="game">
    <div className="status-bar">
      <h1>QE</h1>
      <span className="player-info">
        ${renderFlag(currentPlayer.country, true)}
        ${renderSector(currentPlayer.sector)}
      </span>
      <span className="status-message">${status}</span>
      <span className="animate-flicker">🕑</span>
    </div>
    ${round === 0 &&
    html`<div className="button-set">
      <button onClick=${handleQuit}>Quit</button>
      <button onClick=${handleStart}>Start Game</button>
    </div>`}
    ${round !== 0 &&
    !hasBid &&
    !waitingForStartBid &&
    html`<form onSubmit=${handleBid} ref=${formRef}>
      ${currentAuction.country &&
      html`<div className="auction-row">
        <div className="auction-item">
          ${renderFlag(currentAuction.country)}
          ${renderSector(currentAuction.sector)}
          ${renderValue(currentAuction.value)}
        </div>
        <div className="auction-details">
          ${renderBids(gameState)}
          <input
            type="number"
            min=${isStartingBid ? "1" : "0"}
            step="1"
            required
            onChange=${handleSetBid}
            ref=${bidRef}
          />
          <button type="submit">Bid</button>
        </div>
      </div>`}
    </form>`}
    ${round !== 0 &&
    html`<div className="radio-set">
      <input
        id="history"
        type="radio"
        name="viewKind"
        checked=${viewKind === "history"}
        onChange=${() => setViewKind("history")}
      />
      <label for="history">Auctions</label>
      <input
        id="scores"
        type="radio"
        name="viewKind"
        checked=${viewKind === "scores"}
        onChange=${() => setViewKind("scores")}
      />
      <label for="scores">Scoreboard</label>
    </div>`}
    ${round !== 0 &&
    viewKind === "history" &&
    html`<${AuctionHistory} gameState=${gameState} />`}
    ${round !== 0 &&
    viewKind === "scores" &&
    html`<${Scoreboard} gameState=${gameState} />`}
    <details className="game-details">
      <summary>Game Details: (${name})</summary>
      <ul className="game-players">
        ${players.map(
          (player) =>
            html`<li>${renderFlag(player.country, true)} ${player.player}</li>`
        )}
      </ul>
      <p>Start time: ${startTime}</p>
    </details>
    ${round !== 0 &&
    html`<div className="button-set">
      <button onClick=${handleFlip}>Flip the table</button>
    </div>`}
  </div>`;
}

function renderBids(gameState) {
  const { auctions, players, turn } = gameState;
  const currentAuction = auctions[auctions.length - 1];
  const playersInTurnOrder = [...players, ...players].slice(
    turn,
    turn + players.length
  );
  return html`
    <div className="bids-row">
      ${playersInTurnOrder.map((player) =>
        renderFlag(
          player.country,
          typeof currentAuction[player.id] !== "undefined"
        )
      )}
    </div>
  `;
}

function Scoreboard({ gameState }) {
  const { auctions, players, currentUser } = gameState;
  const currentPlayerIndex = players.findIndex(
    (player) => player.id === currentUser
  );
  const currentPlayer = players[currentPlayerIndex];
  const [viewCountry, setViewCountry] = useState(currentPlayer.country);
  const playersWithCurrentPlayerFirst = [...players, ...players].slice(
    currentPlayerIndex,
    currentPlayerIndex + players.length
  );
  const playerForViewCountry = players.find(
    (player) => player.country === viewCountry
  );
  const auctionsForViewCountry = auctions.filter(
    (auction) => auction.winner === playerForViewCountry.id
  );
  return html`
    <div className="scoreboard">
      <div className="radio-set">
        ${playersWithCurrentPlayerFirst.map(
          (player) => html`<input
              id="scoreboard-${player.country}"
              type="radio"
              name="scoreboardViewKind"
              checked=${viewCountry === player.country}
              onChange=${() => setViewCountry(player.country)}
            />
            <label for="scoreboard-${player.country}"
              >${renderFlag(
                player.country,
                viewCountry === player.country
              )}</label
            >`
        )}
      </div>
      <div className="score-details">
        Auctions won: ${auctionsForViewCountry.length}
      </div>
    </div>
  `;
}

function AuctionHistory({ gameState }) {
  const { auctions, players, currentUser } = gameState;
  const reversedAuctionHistory = [...auctions]
    .reverse()
    .filter((auction) => typeof auction[currentUser] !== "undefined");

  if (!reversedAuctionHistory.length) {
    return html`<div className="auction-history text-center">
      Waiting for first auction results
    </div>`;
  }

  return html`
    <div className="auction-history">
      <table>
        <tr>
          <th>Company</th>
          ${players.map((player) => html`<th>${player.country}</th>`)}
        </tr>
        ${reversedAuctionHistory.map(
          (auction) => html`
            <tr>
              <td>
                ${renderFlag(auction.country, true)}${renderSector(
                  auction.sector
                )}${renderValue(auction.value)}
              </td>
              ${players.map(
                (player) =>
                  html`<td
                    className="${auction.winner === player.id
                      ? "auction-winner"
                      : ""}"
                  >
                    ${auction[player.id]}
                    ${auction.startingPlayer === player.id && "*"}
                  </td>`
              )}
            </tr>
          `
        )}
        <caption>
          <span>* Starting Bid</span>
          <span className="bg-green">Winning Bid</span>
        </caption>
      </table>
    </div>
  `;
}

function renderFlag(country, isOpaque = false) {
  let countryCode = "";
  switch (country) {
    case "US":
      countryCode = "us";
      break;
    case "UK":
      countryCode = "gb";
      break;
    case "JP":
      countryCode = "jp";
      break;
    case "EU":
      countryCode = "eu";
      break;
    case "CN":
      countryCode = "cn";
      break;
  }
  if (!countryCode) {
    return null;
  }
  return html`<span
    className="flag-icon flag-icon-squared flag-icon-${countryCode} ${isOpaque
      ? "flag-icon-opaque"
      : "flag-icon-transparent"}"
  ></span>`;
}

function renderSector(sector) {
  let sectorCode = "";
  switch (sector) {
    case "AGR":
      sectorCode = "agriculture";
      break;
    case "FIN":
      sectorCode = "financial";
      break;
    case "GOV":
      sectorCode = "government";
      break;
    case "HOU":
      sectorCode = "housing";
      break;
    case "MAN":
      sectorCode = "manufacturing";
      break;
  }
  if (!sectorCode) {
    return null;
  }
  return html`<span
    className="flag-icon sector-icon icon-${sectorCode}"
  ></span>`;
}

function renderValue(value) {
  return html`<span className="value-icon">${value}</span>`;
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

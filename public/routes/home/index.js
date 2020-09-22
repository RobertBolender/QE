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
    <form className="join-or-create-form" onSubmit=${handleSubmit}>
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
    <form
      className="join-or-create-form"
      method="POST"
      action="/games"
      onSubmit=${handleSubmit}
    >
      <button className="quickstart" onClick=${handleQuickstart}>
        Play a Tutorial Game
      </button>
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

  const currentPlayer = getCurrentPlayer(gameState);

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
  const previousAuction = auctions.length > 1 && auctions[auctions.length - 2];
  const previousWinner =
    previousAuction &&
    previousAuction.winner &&
    players.find((player) => player.id === previousAuction.winner);
  const hasBid =
    currentUser &&
    currentAuction &&
    typeof currentAuction[currentUser] !== "undefined";
  const startingPlayer = players[turn].id;
  const isStartingBid = startingPlayer === currentUser && !hasBid;
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

  const handlePeek = async (event) => {
    event.preventDefault();
    const data = await postJson(`/game/${id}/peek`);
    if (data.errorMessage) {
      console.error(data.errorMessage);
      return;
    }
    setGameState(data);
    if (bidRef.current) {
      bidRef.current.focus();
    }
  };

  const handleFocus = async (event) => {
    event.preventDefault();
    if (bidRef.current) {
      bidRef.current.focus();
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
        <div className="auction-item" onClick=${handleFocus}>
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
          ${previousAuction &&
          previousWinner &&
          html`
            <div className="previous-auction">
              <div>Previous Auction</div>
              <div>
                ${renderFlag(previousWinner.country, true)}
                ${previousAuction[previousAuction.winner] === "bid"
                  ? previousAuction[previousAuction.winner]
                  : html`<button onClick=${handlePeek}>Peek</button>`}
              </div>
            </div>
          `}
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
  const { auctions } = gameState;
  const currentAuction = auctions[auctions.length - 1];
  const players = getPlayersInTurnOrder(gameState);
  return html`
    <div className="bids-row">
      ${players.map((player) =>
        renderFlag(
          player.country,
          typeof currentAuction[player.id] !== "undefined"
        )
      )}
    </div>
  `;
}

function getCurrentPlayer({ players, currentUser }) {
  return players.find((player) => player.id === currentUser);
}

function getPlayerForCountry({ players }, country) {
  return players.find((player) => player.country === country);
}

function getPlayersInOrder({ players }, getIndex) {
  const index = players.findIndex(getIndex);
  return [...players, ...players].slice(index, index + players.length);
}

function getPlayersInTurnOrder(gameState) {
  return getPlayersInOrder(gameState, (_, i) => i === gameState.turn);
}

function getPlayersWithCurrentUserFirst(gameState) {
  return getPlayersInOrder(gameState, (p) => p.id === gameState.currentUser);
}

function getPlayerScores(gameState) {
  const { players, gameOver } = gameState;
  const results = players.reduce((result, player) => {
    result[player.id] = getScoresForPlayer(gameState, player);
    return result;
  }, {});
  const winner = !gameOver
    ? false
    : players.reduce((incumbent, contender) => {
        const contenderResults = results[contender.id];
        if (contenderResults.highestSpender) {
          return incumbent;
        }

        if (!incumbent) {
          return contender;
        }

        const incumbentResults = results[incumbent.id];
        if (contenderResults.totalScore > incumbentResults.totalScore) {
          return contender;
        }

        if (
          contenderResults.totalScore === incumbentResults.totalScore &&
          contenderResults.totalSpend < incumbentResults.totalSpend
        ) {
          return contender;
        }

        return incumbent;
      }, false);
  results.winner = winner;
  return results;
}

function getPlayerSpending(gameState) {
  const { auctions, players } = gameState;
  const playerSpending = auctions.reduce(
    (result, auction) => {
      if (auction.winner) {
        result[auction.winner] =
          (result[auction.winner] ?? 0) + auction[auction.winner];
      }
      return result;
    },
    players.reduce((result, player) => {
      result[player.id] = 0;
      return result;
    }, {})
  );
  let lowest = Number.MAX_SAFE_INTEGER;
  let highest = 0;
  const spendersBySpending = {};
  Object.entries(playerSpending).forEach(([playerId, total]) => {
    if (!spendersBySpending[total]) {
      spendersBySpending[total] = [];
    }
    spendersBySpending[total].push(playerId);
    if (total > highest) {
      highest = total;
    }
    if (total < lowest) {
      lowest = total;
    }
  });

  const lowestSpenders = spendersBySpending[lowest] ?? [];
  const highestSpenders = spendersBySpending[highest] ?? [];
  return {
    playerSpending,
    lowestSpenders,
    highestSpenders,
  };
}

function getScoresForPlayer(gameState, player) {
  const { auctions, players } = gameState;

  const auctionsForPlayer = auctions.filter(
    (auction) => auction.winner === player.id
  );

  const totalAuctionCount = auctionsForPlayer.length;

  const totalSpend = auctionsForPlayer.reduce(
    (total, auction) =>
      Number.isInteger(auction[player.id]) ? total + auction[player.id] : total,
    0
  );

  const { playerSpending, lowestSpenders, highestSpenders } = getPlayerSpending(
    gameState
  );

  const lowestSpenderBonusByPlayerCount = {
    3: 6,
    4: 6,
    5: 7,
  };

  const lowestSpenderBonus = lowestSpenders.includes(player.id)
    ? lowestSpenderBonusByPlayerCount[players.length]
    : 0;

  const totalValue = auctionsForPlayer.reduce(
    (total, auction) => total + auction.value,
    0
  );

  const auctionsByRound = auctions.reduce(
    (result, auction) => {
      if (typeof auction.round !== "undefined") {
        result[auction.round].push(auction);
      }
      return result;
    },
    [[], [], [], [], []]
  );

  const pointsForZeros =
    players.length === 3
      ? 0
      : auctionsByRound.reduce(
          (total, round) =>
            round.some((auction) => auction[player.id] === 0)
              ? total + 2
              : total,
          0
        );

  const naturalizationCountries = auctionsForPlayer.filter(
    (auction) => auction.country === player.country
  ).length;

  const naturalizationScoresByPlayerCount = {
    3: [0, 1, 3, 6, 10],
    4: [0, 1, 3, 6, 10],
    5: [0, 3, 6, 10],
  };

  const naturalizationTotal =
    naturalizationScoresByPlayerCount[players.length][naturalizationCountries];

  const auctionsBySector = [
    { sector: player.sector },
    ...auctionsForPlayer,
  ].reduce((result, auction) => {
    result[auction.sector] = (result[auction.sector] ?? 0) + 1;
    return result;
  }, {});

  const monopolizationScoresByPlayerCount = {
    3: [0, 0, 3, 6, 10, 10],
    4: [0, 0, 3, 6, 10, 10],
    5: [0, 0, 6, 10, 16, 16],
  };

  const sectors = ["AGR", "FIN", "GOV", "HOU", "MAN"];

  const monopolizationTotal = sectors.reduce(
    (total, sector) =>
      total +
      monopolizationScoresByPlayerCount[players.length][
        auctionsBySector[sector] ?? 0
      ],
    0
  );

  const diversificationSets = auctionsForPlayer.reduce((result, auction) => {
    for (var i = 0, found = false; !found; i++) {
      if (!result[i]) {
        result[i] = new Set([auction.country]);
        found = true;
        return result;
      }
      if (!result[i].has(auction.country)) {
        result[i].add(auction.country);
        found = true;
        return result;
      }
    }
    return result;
  }, []);

  const diversificationScoresByPlayerCount = {
    3: [0, 0, 0, 6, 10],
    4: [0, 0, 0, 6, 10],
    5: [0, 0, 10, 15, 21],
  };

  const diversificationTotal = diversificationSets.reduce(
    (result, set) =>
      (result += diversificationScoresByPlayerCount[players.length][set.size]),
    0
  );

  const highestSpender = highestSpenders.includes(player.id);

  const totalScore =
    totalValue +
    pointsForZeros +
    naturalizationTotal +
    monopolizationTotal +
    diversificationTotal +
    lowestSpenderBonus;

  return {
    totalAuctionCount,
    totalSpend,
    totalValue,
    pointsForZeros,
    naturalizationTotal,
    monopolizationTotal,
    diversificationTotal,
    lowestSpenderBonus,
    highestSpender,
    totalScore,
  };
}

function Scoreboard({ gameState }) {
  const currentPlayer = getCurrentPlayer(gameState);
  const [viewCountry, setViewCountry] = useState(currentPlayer.country);
  const playerForCountry = getPlayerForCountry(gameState, viewCountry);
  const playersStartingWithCurrent = getPlayersWithCurrentUserFirst(gameState);

  const playerScores = getPlayerScores(gameState);

  const {
    totalAuctionCount,
    totalSpend,
    totalValue,
    pointsForZeros,
    naturalizationTotal,
    monopolizationTotal,
    diversificationTotal,
    lowestSpenderBonus,
    highestSpender,
    totalScore,
  } = playerScores[playerForCountry.id];

  const winner = playerScores.winner.id === playerForCountry.id;

  return html`
    <div className="scoreboard">
      <div className="radio-set">
        ${playersStartingWithCurrent.map(
          (player) => html`<input
              id="scoreboard-${player.country}"
              type="radio"
              name="scoreboardViewKind"
              checked=${viewCountry === player.country}
              onChange=${() => setViewCountry(player.country)}
            />
            <label for="scoreboard-${player.country}">
              ${renderFlag(player.country, viewCountry === player.country)}
              ${playerScores[player.id].highestSpender
                ? html`<span className="highest-spender"
                    >$${playerScores[player.id].totalSpend}</span
                  >`
                : playerScores.winner.id === player.id
                ? html`<span className="winner"
                    >${playerScores[player.id].totalScore}</span
                  >`
                : playerScores[player.id].totalScore}
            </label>`
        )}
      </div>
      <div className="score-details">
        <table>
          <tr>
            <td>Total Spend</td>
            <td>$${totalSpend}</td>
          </tr>
          <tr>
            <td>Auctions Won</td>
            <td>${totalAuctionCount}</td>
          </tr>
          <tr>
            <td>Private Sector</td>
            <td>${renderSector(playerForCountry.sector)}</td>
          </tr>
          <tr className="border-top">
            <td>Company Values</td>
            <td>${totalValue}</td>
          </tr>
          <tr>
            <td>Zero Bids</td>
            <td>${pointsForZeros}</td>
          </tr>
          <tr>
            <td>Naturalization</td>
            <td>${naturalizationTotal}</td>
          </tr>
          <tr>
            <td>Monopolization</td>
            <td>${monopolizationTotal}</td>
          </tr>
          <tr>
            <td>Diversification</td>
            <td>${diversificationTotal}</td>
          </tr>
          <tr>
            <td>Lowest Spender Bonus</td>
            <td>${lowestSpenderBonus}</td>
          </tr>
          <tr className="border-top">
            <td>Total Score</td>
            <td>${totalScore}</td>
          </tr>
          ${highestSpender &&
          html`
            <tr>
              <td>Highest Spender</td>
              <td><span className="highest-spender">$${totalSpend}</span></td>
            </tr>
          `}
          ${winner &&
          html`
            <tr>
              <td>Winner</td>
              <td className="winner">$$$</td>
            </tr>
          `}
        </table>
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

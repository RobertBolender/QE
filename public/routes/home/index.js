import { React, useCallback, useState } from "https://unpkg.com/es-react";
import htm from "https://unpkg.com/htm?module";
const html = htm.bind(React.createElement);

export default function App() {
  const [gameId, setGameId] = useState();

  if (!gameId) {
    return html`<${NewGame} setGameId=${setGameId} />`;
  }

  return html`<${Game} gameId=${gameId} />`;
}

function NewGame({ setGameId }) {
  const [name, setName] = useState();
  const [player, setPlayer] = useState();
  const [bid, setBid] = useState();

  const handleSetName = (event) => setName(event.target.value);
  const handleSetPlayer = (event) => setPlayer(event.target.value);
  const handleSetBid = (event) => setBid(event.target.value);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const response = await fetch("/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          player,
          bid,
        }),
      });

      if (response.status === 200) {
        const data = await response.json();
        setGameId(data.id);
      }
    },
    [name, player, bid]
  );

  return html`<div>
    <h1>QE: New Game</h1>
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

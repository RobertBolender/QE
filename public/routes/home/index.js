import { React } from "https://unpkg.com/es-react";
import htm from "https://unpkg.com/htm?module";
const html = htm.bind(React.createElement);

export default function NewGame() {
  return html`<div>
    <h1>QE: New Game</h1>
    <form method="POST" action="/games">
      <label for="name">Game name</label>
      <input id="name" name="name" type="text" required />
      <label for="player">Your name</label>
      <input id="player" name="player" type="text" required />
      <label for="bid">Opening bid</label>
      <input id="bid" name="bid" type="number" min="0" step="1" required />
      <p>
        If more than 5 players try to join the game, the highest bid will be
        eliminated and the next 5 highest bids will join the game.
      </p>
      <button type="submit">Create</button>
    </form>
  </div>`;
}

import { React } from "https://unpkg.com/es-react";
import htm from "https://unpkg.com/htm?module";
const html = htm.bind(React.createElement);

export default function () {
  return html`<p>
    Not all who wander are lost, although you appear to be so.
  </p>`;
}

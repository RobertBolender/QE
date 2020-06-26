import { React } from "https://unpkg.com/es-react";
import htm from "https://unpkg.com/htm?module";
const html = htm.bind(React.createElement);

export default function () {
  return html`<${Test} title="QE!" />`;
}

function Test({ title }) {
  return html`<div><h1>${title}</h1></div>`;
}

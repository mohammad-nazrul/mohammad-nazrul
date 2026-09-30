import { C, card, doc, esc, icon, textWidth } from "../lib/svg.mjs";

/** "Principles" strip: three numbered statements side by side. */
export function renderPrinciples(principles, { location, timezone }) {
  const WIDTH = 860;
  const HEIGHT = 96;
  const PAD = 24;
  const colW = (WIDTH - PAD * 2 - 170) / principles.length;
  const cols = principles
    .map(
      (p, i) => `
    <text x="${PAD + i * colW}" y="66" class="m" font-size="11" fill="${C.accent}" fill-opacity="0.85">0${i + 1}</text>
    <text x="${PAD + i * colW + 24}" y="66" class="t" font-size="14" fill="${C.fg}" fill-opacity="0.9">${esc(p)}</text>`,
    )
    .join("");
  const loc = `${location} · ${timezone}`;
  return doc({
    width: WIDTH,
    height: HEIGHT,
    title: `Principles: ${principles.join(" ")}`,
    body: `
  <g class="enter">
  ${card(0, 0, WIDTH, HEIGHT)}
  <text x="${PAD}" y="36" class="m" font-size="10" letter-spacing="2.2" fill="${C.subtle}">PRINCIPLES</text>
  ${cols}
  ${icon("map-pin", WIDTH - PAD - textWidth(loc, 11, { mono: true }) - 18, 55, 13, C.subtle, 2)}
  <text x="${WIDTH - PAD}" y="66" text-anchor="end" class="m" font-size="11" fill="${C.subtle}">${esc(loc)}</text>
  </g>`,
  });
}

/** A standalone link button (each is wrapped in its own <a> in the README). */
export function renderLinkButton({ label, icon: iconName, primary }) {
  const H = 36;
  const w = Math.round(textWidth(label, 13, { weight: 500 }) + 16 + 24 + 16);
  const fill = primary ? "#2f6fe0" : C.surface2;
  const stroke = primary ? "#ffffff" : "#ffffff";
  return doc({
    width: w,
    height: H,
    title: label,
    body: `
  <rect x="0.5" y="0.5" width="${w - 1}" height="${H - 1}" rx="8" fill="${fill}" stroke="${stroke}" stroke-opacity="${primary ? 0.18 : 0.1}"/>
  ${icon(iconName, 16, 11, 14, primary ? "#ffffff" : C.muted, 2)}
  <text x="38" y="22.6" class="t" font-size="13" font-weight="500" fill="${primary ? "#ffffff" : C.fg}">${esc(label)}</text>`,
  });
}

import { C, card, doc, esc, pill, textWidth } from "../lib/svg.mjs";

const WIDTH = 860;
const HEIGHT = 262;

// Abstract service topology (edge → gateway → services → data plane), drawn
// inside a 340×150 box on the right of the hero and faded in from the left.
const NW = 68;
const NH = 22;
const nodes = {
  client: { x: 34, y: 75, label: "client" },
  gateway: { x: 124, y: 75, label: "gateway", live: true },
  auth: { x: 214, y: 22, label: "auth" },
  payments: { x: 214, y: 75, label: "payments", live: true },
  workflows: { x: 214, y: 128, label: "workflows" },
  oracle: { x: 304, y: 22, label: "oracle" },
  kafka: { x: 304, y: 75, label: "kafka", live: true },
  redis: { x: 304, y: 128, label: "redis" },
};
const edges = [
  ["client", "gateway", true],
  ["gateway", "auth"],
  ["gateway", "payments", true],
  ["gateway", "workflows"],
  ["auth", "oracle"],
  ["payments", "oracle"],
  ["payments", "kafka", true],
  ["payments", "redis"],
  ["workflows", "redis"],
];

function curve(a, b) {
  const x1 = a.x + NW / 2;
  const x2 = b.x - NW / 2;
  const mx = (x1 + x2) / 2;
  return `M${x1} ${a.y} C${mx} ${a.y} ${mx} ${b.y} ${x2} ${b.y}`;
}

function topology() {
  const lines = edges.map(([a, b]) => `<path d="${curve(nodes[a], nodes[b])}"/>`).join("");
  const flows = edges
    .filter(([, , hot]) => hot)
    .map(([a, b], i) => `<path class="flow" style="animation-delay:${(-i * 0.9).toFixed(1)}s" d="${curve(nodes[a], nodes[b])}"/>`)
    .join("");
  const boxes = Object.values(nodes)
    .map(
      (n) => `
    <g transform="translate(${n.x - NW / 2} ${n.y - NH / 2})">
      <rect width="${NW}" height="${NH}" rx="6" fill="#0b0e13" stroke="#ffffff" stroke-opacity="0.12"/>
      ${n.live ? `<circle cx="10" cy="${NH / 2}" r="2.3" fill="${C.success}" fill-opacity="0.9"/>` : ""}
      <text x="${n.live ? 17 : NW / 2}" y="${NH / 2 + 3.3}" ${n.live ? "" : 'text-anchor="middle"'} class="m" font-size="9.5" fill="${C.muted}" fill-opacity="0.9">${n.label}</text>
    </g>`,
    )
    .join("");
  return `
  <g fill="none" stroke="#94b2e2" stroke-opacity="0.18">${lines}</g>
  <g fill="none" stroke="${C.accent}" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="2 18" stroke-opacity="0.8">${flows}</g>
  ${boxes}`;
}

export function renderHero(config, { status }) {
  const pad = 36;
  const firstLine = "Welcome to ";
  const headSize = 40;

  let tagsX = pad;
  const tags = config.hero.tags
    .map((t) => {
      const p = pill(tagsX, 188, t, { size: 12, color: C.muted });
      tagsX += p.width + 7;
      return p.svg;
    })
    .join("");
  const live = pill(tagsX, 188, status.label, {
    size: 12,
    color: status.active ? C.successText : C.muted,
    dot: status.active ? C.success : C.subtle,
    border: status.active ? C.success : "#ffffff",
    borderOpacity: status.active ? 0.3 : 0.09,
    fill: status.active ? C.success : C.surface2,
    fillOpacity: status.active ? 0.08 : 0.6,
  });

  const loc = `${config.location} · ${config.timezone}`;
  const locW = textWidth(loc, 10.5, { mono: true }) + 30;

  const body = `
  <defs>
    <clipPath id="clip"><rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="12"/></clipPath>
    <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" fill="none" stroke="#ffffff" stroke-opacity="0.04"/>
    </pattern>
    <radialGradient id="gridFade" cx="0.74" cy="0.42" r="0.55">
      <stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <mask id="gridMask"><rect width="${WIDTH}" height="${HEIGHT}" fill="url(#gridFade)"/></mask>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${C.accent}" stop-opacity="0.17"/>
      <stop offset="1" stop-color="${C.accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="topoFade" x1="470" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/>
    </linearGradient>
    <mask id="topoMask"><rect width="${WIDTH}" height="${HEIGHT}" fill="url(#topoFade)"/></mask>
    <linearGradient id="headGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#78b1ff"/><stop offset="1" stop-color="${C.accent}"/>
    </linearGradient>
    <linearGradient id="topLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${C.accent}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${C.accent}" stop-opacity="0.45"/>
      <stop offset="1" stop-color="${C.accent}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  ${card(0, 0, WIDTH, HEIGHT)}

  <g clip-path="url(#clip)">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)" mask="url(#gridMask)"/>
    <ellipse class="drift" cx="700" cy="30" rx="330" ry="210" fill="url(#glow)"/>
    <g mask="url(#topoMask)"><g transform="translate(480 70)" opacity="0.85">${topology()}</g></g>
    <rect x="0" y="0" width="${WIDTH}" height="1" fill="url(#topLine)"/>
  </g>

  <g class="enter">
    <text x="${pad}" y="50" class="m" font-size="11" font-weight="500" letter-spacing="2.6" fill="${C.subtle}">${esc(config.hero.eyebrow.toUpperCase())}</text>

    <g transform="translate(${WIDTH - pad - locW} 34)">
      <rect x="0.5" y="0.5" width="${locW - 1}" height="23" rx="11.5" fill="#08090c" fill-opacity="0.6" stroke="#ffffff" stroke-opacity="0.09"/>
      <circle cx="12" cy="12" r="3" fill="${C.accent}"/>
      <text x="21" y="15.6" class="m" font-size="10.5" fill="${C.muted}">${esc(loc)}</text>
    </g>

    <text x="${pad}" y="114" class="t" font-size="${headSize}" font-weight="600" letter-spacing="-1.3">
      <tspan fill="${C.fg}">${esc(firstLine)}</tspan><tspan fill="url(#headGrad)">${esc(config.shortName)}'s Hub</tspan>
    </text>
    ${config.hero.subtitle
      .map((line, i) => `<text x="${pad}" y="${148 + i * 21}" class="t" font-size="15" fill="${C.muted}">${esc(line)}</text>`)
      .join("")}
    ${tags}
    ${live.svg}
  </g>

  <text x="${WIDTH - pad}" y="236" text-anchor="end" class="m" font-size="10" letter-spacing="2.4" fill="${C.subtle}">CODE / SYSTEMS / IMPACT</text>
  <rect x="${WIDTH - pad - 40}" y="244" width="40" height="1.5" fill="${C.accent}" fill-opacity="0.8"/>`;

  return doc({
    width: WIDTH,
    height: HEIGHT,
    title: `Welcome to ${config.shortName}'s Hub — ${config.hero.tags.join(", ")}`,
    body,
    css: `
    .drift { animation: drift 16s ease-in-out infinite alternate; }
    .flow { animation: flow 2.8s linear infinite; }
    @keyframes drift { from { transform: translate(-18px, -10px); } to { transform: translate(22px, 14px); } }
    @keyframes flow { to { stroke-dashoffset: -40; } }`,
  });
}

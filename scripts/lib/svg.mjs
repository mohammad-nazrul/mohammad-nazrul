// Shared primitives for the README cards.
//
// GitHub serves README images as sandboxed <img>: no JavaScript, no web fonts,
// no external resources. Everything here is self-contained SVG with system
// font stacks, and text widths are estimated from font metrics because the
// browser can't be asked.

import { ICONS } from "./icons.mjs";

export const C = {
  surface: "#0e1116",
  surface2: "#13171e",
  surface3: "#1a1f28",
  fg: "#e6edf3",
  muted: "#9aa3ad",
  subtle: "#6b737e",
  accent: "#4f94f7",
  accentSoft: "#7cb0fb",
  success: "#3fb950",
  successText: "#56d364",
  heat: ["#1a1f26", "#0e4429", "#006d32", "#26a641", "#39d353"],
};

export const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif`;
export const MONO = `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace`;

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Helvetica advance widths (1/1000 em) — close enough to Segoe UI / SF for layout.
const W = {
  " ": 278, "!": 278, '"': 355, "#": 556, $: 556, "%": 889, "&": 667, "'": 191, "(": 333, ")": 333, "*": 389,
  "+": 584, ",": 278, "-": 333, ".": 278, "/": 278, ":": 278, ";": 278, "?": 556, "@": 1015, "·": 278, "→": 1000,
  "—": 1000, "–": 556, "|": 260, _: 556,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556, M: 833, N: 722,
  O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222, m: 833, n: 556,
  o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500,
};

/** Estimated rendered width of `str` in px. `mono` uses a fixed 0.6em advance. */
export function textWidth(str, size, { weight = 400, mono = false, tracking = 0 } = {}) {
  const chars = [...String(str)];
  if (mono) return chars.length * size * 0.6 + chars.length * tracking;
  const em = chars.reduce((s, ch) => s + (W[ch] ?? (/\d/.test(ch) ? 556 : 560)), 0) / 1000;
  return em * size * (weight >= 600 ? 1.05 : 1) + chars.length * tracking;
}

/** A Lucide icon drawn at (x, y) with the given pixel size. */
export function icon(name, x, y, size, color, stroke = 2) {
  const body = ICONS[name];
  if (!body) throw new Error(`Unknown icon: ${name}`);
  const k = size / 24;
  return `<g transform="translate(${x} ${y}) scale(${k})" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
}

/** The TypeScript "TS" tile, which Lucide doesn't have. */
export function tsGlyph(x, y, size, color) {
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="3" fill="${color}"/><text x="${x + size / 2}" y="${y + size * 0.72}" text-anchor="middle" font-family="${MONO}" font-size="${size * 0.55}" font-weight="700" fill="#0b1220">TS</text>`;
}

let uid = 0;
export const nextId = (p = "g") => `${p}${++uid}`;

/**
 * Card surface: hairline border, faint top-lit gradient and a 1px highlight
 * along the top edge — the same recipe as the web dashboard's <Card>.
 */
export function card(x, y, w, h, { r = 12 } = {}) {
  const g = nextId("cg");
  const hl = nextId("hl");
  return `
  <defs>
    <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.025"/>
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${hl}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.09"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${r}" fill="${C.surface}"/>
  <rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${r}" fill="url(#${g})" stroke="#ffffff" stroke-opacity="0.08"/>
  <line x1="${x + r}" y1="${y + 1}" x2="${x + w - r}" y2="${y + 1}" stroke="url(#${hl})"/>`;
}

/** Icon tile + title + optional subtitle, anchored at the card's top-left padding. */
export function cardHeader(x, y, { iconName, title, subtitle, iconSvg }) {
  return `
  <rect x="${x + 0.5}" y="${y + 0.5}" width="29" height="29" rx="7.5" fill="${C.surface2}" stroke="#ffffff" stroke-opacity="0.08"/>
  ${iconSvg ?? icon(iconName, x + 7, y + 7, 16, C.muted, 1.9)}
  <text x="${x + 42}" y="${subtitle ? y + 13 : y + 20}" class="t" font-size="15" font-weight="600" fill="${C.fg}" letter-spacing="-0.15">${esc(title)}</text>
  ${subtitle ? `<text x="${x + 42}" y="${y + 30}" class="t" font-size="12" fill="${C.subtle}">${esc(subtitle)}</text>` : ""}`;
}

/** Pill with hairline border; returns { svg, width }. */
export function pill(x, y, label, { h = 24, size = 12, color = C.muted, border = "#ffffff", borderOpacity = 0.09, fill = C.surface2, fillOpacity = 0.6, dot, mono = false, padX = 10 } = {}) {
  const tw = textWidth(label, size, { weight: 500, mono });
  const dotW = dot ? 12 : 0;
  const w = Math.round(tw + padX * 2 + dotW);
  const svg = `
  <rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${h / 2}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${border}" stroke-opacity="${borderOpacity}"/>
  ${dot ? `<circle cx="${x + padX + 3}" cy="${y + h / 2}" r="3" fill="${dot}"${dot === C.success ? ' class="pulse"' : ""}/>` : ""}
  <text x="${x + padX + dotW}" y="${y + h / 2 + size * 0.36}" class="${mono ? "m" : "t"}" font-size="${size}" font-weight="500" fill="${color}">${esc(label)}</text>`;
  return { svg, width: w };
}

/** Wraps an SVG body into a standalone document with the shared stylesheet. */
export function doc({ width, height, title, body, css = "" }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
  <title>${esc(title)}</title>
  <style>
    .t { font-family: ${FONT}; }
    .m { font-family: ${MONO}; }
    .tab { font-variant-numeric: tabular-nums; }
    .enter { animation: enter .6s cubic-bezier(.25,1,.5,1) both; }
    .pulse { animation: pulse 2.4s ease-in-out infinite; }
    @keyframes enter { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    @keyframes pulse { 50% { opacity: .4; } }
    ${css}
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  </style>
  ${body}
</svg>
`;
}

/** Greedy word wrap using the metric table. */
export function wrap(text, size, maxWidth, opts) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (textWidth(next, size, opts) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export function compact(n) {
  if (n < 1000) return String(n);
  return `${(Math.round(n / 100) / 10).toString().replace(/\.0$/, "")}k`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthShort = (i) => MONTHS[i];

export function relativeDays(iso, now) {
  const days = Math.max(0, Math.round((now - Date.parse(iso)) / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  const y = Math.round(days / 365);
  return `${y}y ago`;
}

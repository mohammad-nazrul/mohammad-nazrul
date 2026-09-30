import { C, card, compact, doc, esc, icon, pill, relativeDays, textWidth, wrap } from "../lib/svg.mjs";

const W = 420;
const H = 178;
const PAD = 20;

// Repository glyph in the spirit of GitHub's "repo" octicon (16px grid).
const repoGlyph = (x, y, color) => `
  <g transform="translate(${x} ${y})" fill="none" stroke="${color}" stroke-width="1.3" stroke-linejoin="round">
    <path d="M3 13.25V2.75C3 2.06 3.56 1.5 4.25 1.5H13v10H4.25C3.56 11.5 3 12.06 3 12.75s.56 1.25 1.25 1.25H6"/>
    <path d="M8 12.5v3l1.25-.9 1.25.9v-3"/><path d="M13 11.5v2.5h-1.5"/>
  </g>`;

/**
 * One repository card. Public projects carry live stars/forks/language/updated;
 * private ones carry a status line instead.
 */
export function renderProject(p, { languageColor, now }) {
  const isPublic = !!p.live;
  const nameW = textWidth(p.name, 15.5, { weight: 600 });
  const badge = pill(PAD + 26 + nameW + 10, 21, isPublic ? "Public" : "Private", {
    h: 20,
    size: 11,
    padX: 8,
    color: C.muted,
    borderOpacity: 0.15,
    fillOpacity: 0,
  });

  // Top-right: GitHub-style split Star button for public repos, lock tile for private.
  let action = "";
  if (isPublic) {
    const count = compact(p.live.stars);
    const cw = textWidth(count, 11, { mono: true }) + 16;
    const bw = 62 + cw;
    const bx = W - PAD - bw;
    action = `
    <g transform="translate(${bx} 18)">
      <rect x="0.5" y="0.5" width="${bw - 1}" height="25" rx="6" fill="${C.surface2}" stroke="#ffffff" stroke-opacity="0.13"/>
      ${icon("star", 10, 6, 13, C.muted, 2)}
      <text x="28" y="16.6" class="t" font-size="12" font-weight="500" fill="${C.muted}">Star</text>
      <line x1="61.5" y1="1" x2="61.5" y2="25" stroke="#ffffff" stroke-opacity="0.13"/>
      <text x="${62 + cw / 2}" y="16.8" text-anchor="middle" class="m tab" font-size="11" fill="${C.muted}">${count}</text>
    </g>`;
  } else {
    action = `
    <g transform="translate(${W - PAD - 26} 18)">
      <rect x="0.5" y="0.5" width="25" height="25" rx="6" fill="${C.surface2}" stroke="#ffffff" stroke-opacity="0.1"/>
      ${icon("lock", 6.5, 6.5, 12, C.subtle, 2)}
    </g>`;
  }

  // Description: two lines max, ellipsized.
  let lines = wrap(p.description, 13, W - PAD * 2);
  if (lines.length > 2) {
    lines = lines.slice(0, 2);
    while (textWidth(`${lines[1]}…`, 13) > W - PAD * 2) lines[1] = lines[1].replace(/\s*\S+$/, "");
    lines[1] += "…";
  }
  const desc = lines
    .map((l, i) => `<text x="${PAD}" y="${66 + i * 19.5}" class="t" font-size="13" fill="${C.muted}">${esc(l)}</text>`)
    .join("");

  // Topics, dropped (not wrapped) if they'd overflow.
  let tx = PAD;
  const topics = p.topics
    .map((t) => {
      const w = Math.round(textWidth(t, 10.5, { mono: true }) + 16);
      if (tx + w > W - PAD) return "";
      const s = `<rect x="${tx}" y="106" width="${w}" height="20" rx="10" fill="${C.accent}" fill-opacity="0.1"/>
        <text x="${tx + 8}" y="119.6" class="m" font-size="10.5" fill="${C.accentSoft}">${esc(t)}</text>`;
      tx += w + 6;
      return s;
    })
    .join("");

  // Footer
  const fy = 161;
  let footer = "";
  if (isPublic) {
    const lang = p.language ?? p.live.language ?? "—";
    let x = PAD;
    const parts = [];
    parts.push(`<circle cx="${x + 5}" cy="${fy - 4}" r="5" fill="${languageColor(lang)}"/>
      <text x="${x + 15}" y="${fy}" class="t" font-size="12" fill="${C.muted}">${esc(lang)}</text>`);
    x += 15 + textWidth(lang, 12) + 16;
    parts.push(`${icon("star", x, fy - 11, 13, C.subtle, 2)}<text x="${x + 17}" y="${fy}" class="t tab" font-size="12" fill="${C.muted}">${compact(p.live.stars)}</text>`);
    x += 17 + textWidth(compact(p.live.stars), 12) + 14;
    parts.push(`${icon("git-fork", x, fy - 11, 13, C.subtle, 2)}<text x="${x + 17}" y="${fy}" class="t tab" font-size="12" fill="${C.muted}">${p.live.forks}</text>`);
    x += 17 + textWidth(String(p.live.forks), 12) + 14;
    parts.push(`<text x="${x}" y="${fy}" class="m" font-size="11" fill="${C.subtle}">Updated ${relativeDays(p.live.pushedAt, now)}</text>`);
    footer = parts.join("");
  } else {
    const prod = /production/i.test(p.status ?? "");
    footer = `
      <circle cx="${PAD + 4}" cy="${fy - 4}" r="4" fill="${prod ? C.success : "#d29922"}"/>
      <text x="${PAD + 15}" y="${fy}" class="t" font-size="12" fill="${C.muted}">${esc(p.status ?? "Private")}</text>`;
  }

  const body = `
  ${card(0, 0, W, H)}
  ${repoGlyph(PAD, 22, C.subtle)}
  <text x="${PAD + 26}" y="36" class="t" font-size="15.5" font-weight="600" letter-spacing="-0.15" fill="${C.accent}">${esc(p.name)}</text>
  ${badge.svg}
  ${action}
  ${desc}
  ${topics}
  <line x1="${PAD}" y1="140" x2="${W - PAD}" y2="140" stroke="#ffffff" stroke-opacity="0.07"/>
  ${footer}`;

  const alt = isPublic
    ? `${p.name} — ${p.description} (${p.live.stars} stars, ${p.live.forks} forks)`
    : `${p.name} — ${p.description} (private · ${p.status ?? ""})`;
  return { svg: doc({ width: W, height: H, title: alt, body: `<g class="enter">${body}</g>` }), alt };
}

export function renderSectionHeader({ title, count, action }) {
  const WIDTH = 860;
  const tw = textWidth(title, 17, { weight: 600 });
  const aw = textWidth(action, 12, { weight: 500 }) + 40;
  const body = `
  ${icon("folder-git-2", 2, 11, 18, C.muted, 1.9)}
  <text x="30" y="26" class="t" font-size="17" font-weight="600" letter-spacing="-0.25" fill="${C.fg}">${esc(title)}</text>
  <rect x="${38 + tw + 0.5}" y="11.5" width="${String(count).length * 7 + 15}" height="19" rx="9.5" fill="${C.surface2}" stroke="#ffffff" stroke-opacity="0.08"/>
  <text x="${38 + tw + 8}" y="25" class="m tab" font-size="11" fill="${C.muted}">${count}</text>
  <g transform="translate(${WIDTH - aw - 1} 7)">
    <rect x="0.5" y="0.5" width="${aw}" height="27" rx="6.5" fill="${C.surface2}" fill-opacity="0.7" stroke="#ffffff" stroke-opacity="0.09"/>
    <text x="11" y="18" class="t" font-size="12" font-weight="500" fill="${C.muted}">${esc(action)}</text>
    ${icon("arrow-up-right", aw - 24, 7.5, 13, C.muted, 2)}
  </g>`;
  return doc({ width: WIDTH, height: 42, title: `${title} (${count}) — ${action}`, body });
}

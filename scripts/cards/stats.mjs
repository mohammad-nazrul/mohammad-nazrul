import { C, card, doc, esc, icon } from "../lib/svg.mjs";

const WIDTH = 860;
const HEIGHT = 132;
const GAP = 12;
const CW = (WIDTH - GAP * 3) / 4;

function sparkline(data, x, y, w, h) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [x + (i / (data.length - 1)) * w, y + 2 + (1 - (v - min) / span) * (h - 4)]);
  const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
  const [lx, ly] = pts.at(-1);
  return `
    <path d="${line} L${x + w} ${y + h} L${x} ${y + h} Z" fill="url(#spark)"/>
    <path d="${line}" fill="none" stroke="${C.accent}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.85"/>
    <circle cx="${lx - 1}" cy="${ly}" r="2.3" fill="${C.accent}"/>`;
}

function yearTrack(since, until, x, y, w) {
  const years = until - since + 1;
  const gap = 3;
  const bw = (w - gap * (years - 1)) / years;
  const bars = Array.from({ length: years }, (_, i) => {
    const last = i === years - 1;
    const h = last ? 20 : 12;
    return `<rect x="${(x + i * (bw + gap)).toFixed(1)}" y="${y + 20 - h}" width="${bw.toFixed(1)}" height="${h}" rx="2" fill="${C.accent}" fill-opacity="${last ? 0.8 : 0.25}"/>`;
  }).join("");
  return `${bars}
    <text x="${x}" y="${y + 34}" class="m" font-size="9.5" fill="${C.subtle}">${since}</text>
    <text x="${x + w}" y="${y + 34}" text-anchor="end" class="m" font-size="9.5" fill="${C.subtle}">${until}</text>`;
}

/** Small stacked "papers", one per publication. */
function papers(count, x, y) {
  return Array.from({ length: Math.min(count, 5) }, (_, i) => {
    const px = x + i * 17;
    return `<g transform="translate(${px} ${y})">
      <rect x="0.5" y="0.5" width="13" height="17" rx="2" fill="${C.surface2}" stroke="${C.accent}" stroke-opacity="0.45"/>
      <rect x="3" y="4.5" width="8" height="1.3" rx=".6" fill="${C.accent}" fill-opacity="0.7"/>
      <rect x="3" y="8" width="8" height="1.3" rx=".6" fill="${C.muted}" fill-opacity="0.35"/>
      <rect x="3" y="11.5" width="5" height="1.3" rx=".6" fill="${C.muted}" fill-opacity="0.35"/>
    </g>`;
  }).join("");
}

/**
 * @param stats [{ icon, label, value, note, noteAccent?, visual: { kind, ... } }] × 4
 */
export function renderStats(stats) {
  const cards = stats
    .map((s, i) => {
      const x = i * (CW + GAP);
      let visual = "";
      if (s.visual?.kind === "spark") visual = sparkline(s.visual.data, CW - 18 - 70, 68, 70, 28);
      if (s.visual?.kind === "years") visual = yearTrack(s.visual.since, s.visual.until, CW - 18 - 74, 62, 74);
      if (s.visual?.kind === "papers") visual = papers(s.visual.count, CW - 18 - (Math.min(s.visual.count, 5) * 17 - 4), 72);

      return `
  <g transform="translate(${x.toFixed(1)} 0)">
    <g class="enter" style="animation-delay:${i * 80}ms">
      ${card(0, 0, CW, HEIGHT)}
      <rect x="18.5" y="18.5" width="25" height="25" rx="6.5" fill="${C.surface2}" stroke="#ffffff" stroke-opacity="0.08"/>
      ${icon(s.icon, 24, 24, 14, C.muted, 1.9)}
      <text x="54" y="35" class="t" font-size="13" font-weight="500" fill="${C.muted}">${esc(s.label)}</text>
      <text x="18" y="92" class="t tab" font-size="32" font-weight="600" letter-spacing="-1.3" fill="${C.fg}">${esc(s.value)}</text>
      <text x="18" y="115" class="${s.noteMono ? "m" : "t"}" font-size="${s.noteMono ? 11 : 12}" fill="${s.noteAccent ? C.successText : C.subtle}">${esc(s.note)}</text>
      ${visual}
    </g>
  </g>`;
    })
    .join("");

  return doc({
    width: WIDTH,
    height: HEIGHT,
    title: stats.map((s) => `${s.label}: ${s.value}`).join(" · "),
    body: `
  <defs>
    <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.accent}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${C.accent}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  ${cards}`,
  });
}

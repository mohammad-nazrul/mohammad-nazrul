import { C, card, cardHeader, doc, monthShort } from "../lib/svg.mjs";

const WIDTH = 860;
const PAD = 24;
const LABEL_W = 34;
const GRID_TOP = 104;

/**
 * GitHub-style calendar from real data. `days` are ascending YYYY-MM-DD with
 * GitHub's own 0–4 levels, so the colors match the native graph.
 */
export function renderContributions({ total, days, activeDays, longestStreak }) {
  const firstDow = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const cols = Math.ceil((days.length + firstDow) / 7);
  const pitch = (WIDTH - PAD * 2 - LABEL_W) / cols;
  const cell = Math.round((pitch - 3) * 10) / 10;
  const gridX = PAD + LABEL_W;
  const height = GRID_TOP + pitch * 7 + 52;

  // Group cells by column so each column can fade in on a small stagger.
  const columns = Array.from({ length: cols }, () => []);
  days.forEach((d, i) => {
    const idx = i + firstDow;
    const col = Math.floor(idx / 7);
    const row = idx % 7;
    columns[col].push(
      `<rect x="${(gridX + col * pitch).toFixed(1)}" y="${(GRID_TOP + row * pitch).toFixed(1)}" width="${cell}" height="${cell}" rx="2.5" fill="${C.heat[d.level]}"/>`,
    );
  });
  const grid = columns
    .map((c, i) => `<g class="enter" style="animation-delay:${150 + i * 10}ms">${c.join("")}</g>`)
    .join("");

  // Month labels where a column's first day starts a new month (GitHub's rule).
  const months = [];
  let prev = -1;
  for (let col = 0; col < cols; col++) {
    const idx = Math.max(0, col * 7 - firstDow);
    const m = Number(days[idx].date.slice(5, 7)) - 1;
    if (m !== prev) {
      if (!months.length || col - months.at(-1).col >= 3) months.push({ col, m });
      prev = m;
    }
  }
  if (months.length > 1 && months[1].col - months[0].col < 3) months.shift();
  const monthLabels = months
    .map(({ col, m }) => `<text x="${(gridX + col * pitch).toFixed(1)}" y="${GRID_TOP - 9}" class="t" font-size="11" fill="${C.subtle}">${monthShort(m)}</text>`)
    .join("");

  const dayLabels = [
    [1, "Mon"],
    [3, "Wed"],
    [5, "Fri"],
  ]
    .map(([r, l]) => `<text x="${PAD}" y="${(GRID_TOP + r * pitch + cell - 1.5).toFixed(1)}" class="t" font-size="11" fill="${C.subtle}">${l}</text>`)
    .join("");

  const fy = GRID_TOP + pitch * 7 + 26;
  const legend = C.heat
    .map((c, i) => `<rect x="${WIDTH - PAD - 36 - (5 - i) * 15}" y="${fy - 10}" width="11" height="11" rx="2.5" fill="${c}"/>`)
    .join("");

  const heatIcon = `
    <rect x="${PAD + 8}" y="30" width="6" height="6" rx="1.2" fill="${C.heat[2]}"/>
    <rect x="${PAD + 16}" y="30" width="6" height="6" rx="1.2" fill="${C.heat[4]}"/>
    <rect x="${PAD + 8}" y="38" width="6" height="6" rx="1.2" fill="${C.heat[1]}"/>
    <rect x="${PAD + 16}" y="38" width="6" height="6" rx="1.2" fill="${C.heat[3]}"/>`;

  const body = `
  ${card(0, 0, WIDTH, height)}
  ${cardHeader(PAD, 22, { title: "Contributions", subtitle: "Commits, pull requests, reviews and issues", iconSvg: heatIcon })}
  <text x="${WIDTH - PAD}" y="35" text-anchor="end" class="t" font-size="12" fill="${C.subtle}">Total contributions</text>
  <text x="${WIDTH - PAD}" y="60" text-anchor="end" class="t tab" font-size="22" font-weight="600" letter-spacing="-0.6" fill="${C.successText}">${total.toLocaleString("en-US")}</text>
  ${monthLabels}
  ${dayLabels}
  ${grid}
  <text x="${PAD}" y="${fy}" class="t" font-size="12" fill="${C.subtle}">Last 52 weeks of activity<tspan fill="${C.muted}" dx="10">·</tspan><tspan dx="10" class="m" font-size="11">${activeDays} active days · longest streak ${longestStreak}d</tspan></text>
  <text x="${WIDTH - PAD - 36 - 5 * 15 - 6}" y="${fy}" text-anchor="end" class="t" font-size="12" fill="${C.subtle}">Less</text>
  ${legend}
  <text x="${WIDTH - PAD}" y="${fy}" text-anchor="end" class="t" font-size="12" fill="${C.subtle}">More</text>`;

  return doc({
    width: WIDTH,
    height: Math.round(height),
    title: `${total} contributions in the last year · ${activeDays} active days · longest streak ${longestStreak} days`,
    body,
  });
}

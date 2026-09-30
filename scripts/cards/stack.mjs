import { C, card, cardHeader, doc, esc, icon, textWidth, tsGlyph } from "../lib/svg.mjs";

const WIDTH = 860;
const GAP = 12;
const TECH_W = 544;
const LANG_W = WIDTH - TECH_W - GAP;
const PAD = 22;

// Tech card layout
const LABEL_COL = 118;
const CHIP_H = 28;
const CHIP_GAP = 7;
const ROW_PAD = 12;

function chip(x, y, t) {
  const tw = textWidth(t.name, 12.5, { weight: 500 });
  const w = Math.round(9 + 14 + 8 + tw + 11);
  const glyph = t.icon === "ts" ? tsGlyph(x + 9, y + 7, 14, t.accent) : icon(t.icon, x + 9, y + 7, 14, t.accent, 2);
  return {
    width: w,
    svg: `
    <rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${CHIP_H - 1}" rx="7.5" fill="${t.accent}" fill-opacity="0.065" stroke="${t.accent}" stroke-opacity="0.3"/>
    ${glyph}
    <text x="${x + 31}" y="${y + 18.4}" class="t" font-size="12.5" font-weight="500" fill="${C.fg}" fill-opacity="0.92">${esc(t.name)}</text>`,
  };
}

function techCard(groups) {
  const chipsX = PAD + LABEL_COL;
  const maxX = TECH_W - PAD;
  let y = 74;
  const rows = groups.map((g, gi) => {
    let x = chipsX;
    let lineY = y + ROW_PAD;
    const chips = g.items.map((t) => {
      const probe = chip(0, 0, t);
      if (x + probe.width > maxX && x > chipsX) {
        x = chipsX;
        lineY += CHIP_H + CHIP_GAP;
      }
      const c = chip(x, lineY, t);
      x += c.width + CHIP_GAP;
      return c.svg;
    });
    const rowH = lineY + CHIP_H + ROW_PAD - y;
    const out = `
    ${gi ? `<line x1="${PAD}" y1="${y}" x2="${TECH_W - PAD}" y2="${y}" stroke="#ffffff" stroke-opacity="0.06"/>` : ""}
    <text x="${PAD}" y="${y + ROW_PAD + CHIP_H / 2 + 3.6}" class="m" font-size="10" letter-spacing="1.4" fill="${C.subtle}">${esc(g.group.toUpperCase())}</text>
    ${chips.join("")}`;
    y += rowH;
    return out;
  });
  const count = groups.reduce((s, g) => s + g.items.length, 0);
  return {
    height: y + 10,
    svg: (h) => `
    ${card(0, 0, TECH_W, h)}
    ${cardHeader(PAD, 22, { iconName: "code-xml", title: "Core Technologies", subtitle: `${count} technologies across production systems` })}
    ${rows.join("")}`,
  };
}

function arc(cx, cy, r0, r1, a0, a1) {
  const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(r1, a0);
  const [x1, y1] = p(r1, a1);
  const [x2, y2] = p(r0, a1);
  const [x3, y3] = p(r0, a0);
  const f = (n) => n.toFixed(2);
  return `M${f(x0)} ${f(y0)} A${r1} ${r1} 0 ${large} 1 ${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${r0} ${r0} 0 ${large} 0 ${f(x3)} ${f(y3)} Z`;
}

function languageCard(languages, repoCount, scope, height) {
  const cx = PAD + 62;
  const cy = 76 + (height - 76) / 2 - 4;
  const r1 = 62;
  const r0 = 45;
  let a = -Math.PI / 2;
  const slices = languages
    .map((l, i) => {
      const a1 = a + (l.percent / 100) * Math.PI * 2;
      const d = arc(cx, cy, r0, r1, a, a1);
      a = a1;
      // 2px surface-colored stroke doubles as the gap between slices.
      return `<path class="enter" style="animation-delay:${200 + i * 90}ms" d="${d}" fill="${l.color}" stroke="${C.surface}" stroke-width="2" stroke-linejoin="round"/>`;
    })
    .join("");

  const lx = cx + r1 + 26;
  const rw = LANG_W - PAD - lx;
  const rowH = 27;
  const ly = cy - (languages.length * rowH) / 2 + 4;
  const legend = languages
    .map((l, i) => {
      const y = ly + i * rowH;
      return `
      <circle cx="${lx + 5}" cy="${y + 9}" r="4.5" fill="${l.color}"/>
      <text x="${lx + 17}" y="${y + 13.3}" class="t" font-size="12.5" fill="${C.muted}">${esc(l.name)}</text>
      <text x="${lx + rw}" y="${y + 13.3}" text-anchor="end" class="m tab" font-size="11.5" fill="${C.fg}">${l.percent}%</text>`;
    })
    .join("");

  return `
    ${card(0, 0, LANG_W, height)}
    ${cardHeader(PAD, 22, { iconName: "chart-pie", title: "Top Languages", subtitle: `By bytes across ${repoCount} ${scope}` })}
    ${slices}
    <text x="${cx}" y="${cy + 6}" text-anchor="middle" class="t tab" font-size="30" font-weight="600" letter-spacing="-1.1" fill="${C.fg}">${repoCount}</text>
    <text x="${cx}" y="${cy + 24}" text-anchor="middle" class="m" font-size="9.5" letter-spacing="1.6" fill="${C.subtle}">REPOS</text>
    ${legend}`;
}

export function renderStack(config, { languages, repoCount, scope }) {
  const tech = techCard(config.technologies);
  const height = Math.max(tech.height, 290);
  return doc({
    width: WIDTH,
    height,
    title: `Core technologies: ${config.technologies.flatMap((g) => g.items.map((t) => t.name)).join(", ")}. Top languages: ${languages.map((l) => `${l.name} ${l.percent}%`).join(", ")}`,
    body: `
  <g class="enter">${tech.svg(height)}</g>
  <g transform="translate(${TECH_W + GAP} 0)"><g class="enter" style="animation-delay:80ms">${languageCard(languages, repoCount, scope, height)}</g></g>`,
  });
}

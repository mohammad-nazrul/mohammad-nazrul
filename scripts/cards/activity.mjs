import { C, card, cardHeader, doc, esc, icon, textWidth } from "../lib/svg.mjs";

const WIDTH = 860;
const PAD = 24;
const ITEM_H = 72;
const TOP = 82;

const KIND = {
  architecture: { label: "Architecture", icon: "network", color: "#4f94f7" },
  feature: { label: "Feature", icon: "git-pull-request", color: "#3fb950" },
  performance: { label: "Performance", icon: "gauge", color: "#d29922" },
  devops: { label: "CI/CD", icon: "workflow", color: "#8d73e6" },
  tooling: { label: "Tooling", icon: "wrench", color: "#1ea394" },
  research: { label: "Research", icon: "graduation-cap", color: "#e0823d" },
};

export function renderActivity(events) {
  const height = TOP + events.length * ITEM_H + 6;
  const railX = PAD + 14;

  const items = events
    .map((e, i) => {
      const k = KIND[e.kind] ?? KIND.feature;
      const y = TOP + i * ITEM_H;
      const last = i === events.length - 1;
      const tx = PAD + 44;
      const titleW = textWidth(e.title, 14, { weight: 500 });
      const kw = textWidth(k.label.toUpperCase(), 9.5, { mono: true, tracking: 0.8 }) + 24;
      return `
    <g class="enter" style="animation-delay:${i * 70}ms">
      ${last ? "" : `<line x1="${railX}" y1="${y + 30}" x2="${railX}" y2="${y + ITEM_H}" stroke="#ffffff" stroke-opacity="0.13"/>`}
      <circle cx="${railX}" cy="${y + 14}" r="14" fill="${C.surface2}" stroke="#ffffff" stroke-opacity="0.14"/>
      ${icon(k.icon, railX - 7, y + 7, 14, k.color, 2)}
      <text x="${tx}" y="${y + 13}" class="t" font-size="14" font-weight="500" fill="${C.fg}">${esc(e.title)}</text>
      <g transform="translate(${tx + titleW + 12} ${y})">
        <rect x="0.5" y="0.5" width="${kw}" height="18" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.1"/>
        <circle cx="10" cy="9.5" r="3" fill="${k.color}"/>
        <text x="18" y="13" class="m" font-size="9.5" letter-spacing="0.8" fill="${C.muted}">${esc(k.label.toUpperCase())}</text>
      </g>
      <text x="${tx}" y="${y + 34}" class="t" font-size="13" fill="${C.muted}">${esc(e.summary)}</text>
      <text x="${tx}" y="${y + 53}" class="m" font-size="11" fill="${C.subtle}">${esc(e.context)}</text>
    </g>`;
    })
    .join("");

  return doc({
    width: WIDTH,
    height,
    title: `Engineering activity: ${events.map((e) => e.title).join("; ")}`,
    body: `
  ${card(0, 0, WIDTH, height)}
  ${cardHeader(PAD, 22, { iconName: "git-commit-horizontal", title: "Engineering Activity", subtitle: "Selected engineering and research work" })}
  ${items}`,
  });
}

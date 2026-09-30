#!/usr/bin/env node
// Builds the profile README and its SVG cards from profile.config.mjs + live
// GitHub data. Zero dependencies; Node 20+.
//
//   node scripts/build.mjs            # anonymous API access is enough
//   GITHUB_TOKEN=… node scripts/build.mjs

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import config from "../profile.config.mjs";
import { renderActivity } from "./cards/activity.mjs";
import { renderContributions } from "./cards/contributions.mjs";
import { renderLinkButton, renderPrinciples } from "./cards/footer.mjs";
import { renderHero } from "./cards/hero.mjs";
import { renderProject, renderSectionHeader } from "./cards/projects.mjs";
import { renderStack } from "./cards/stack.mjs";
import { renderStats } from "./cards/stats.mjs";
import { fetchProfileData } from "./lib/github.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(ROOT, "assets");
const now = new Date();

// ── Data ─────────────────────────────────────────────────────────────────────

const data = await fetchProfileData(config.login, {
  token: process.env.GITHUB_TOKEN,
  ownerToken: process.env.PROFILE_TOKEN || undefined,
  languages: config.languages,
});
const { contributions: cal } = data;

// Contribution-derived stats
let longestStreak = 0;
let run = 0;
for (const d of cal.days) {
  run = d.count > 0 ? run + 1 : 0;
  longestStreak = Math.max(longestStreak, run);
}
const activeDays = cal.days.filter((d) => d.count > 0).length;
const lastWeek = cal.days.slice(-7).reduce((s, d) => s + d.count, 0);
const lastActive = [...cal.days].reverse().find((d) => d.count > 0)?.date;

const monthly = new Map();
for (const d of cal.days) monthly.set(d.date.slice(0, 7), (monthly.get(d.date.slice(0, 7)) ?? 0) + d.count);
const monthlySeries = [...monthly.values()].slice(-12);

// Years on GitHub + cumulative public repos per year
const sinceYear = new Date(data.user.createdAt).getUTCFullYear();
const thisYear = now.getUTCFullYear();
const reposByYear = [];
for (let y = sinceYear; y <= thisYear; y++)
  reposByYear.push(data.repos.filter((r) => new Date(r.createdAt).getUTCFullYear() <= y).length);

// Languages → top 5 + Others, percentages that sum to exactly 100.
const LANG_COLORS = { TypeScript: "#4c8dff", Java: "#c8702c", JavaScript: "#1ea394", Python: "#a38e1c", SQL: "#8d73e6", PLSQL: "#8d73e6" };
const SPARE = ["#8d73e6", "#1ea394", "#a38e1c", "#c8702c", "#4c8dff"];
const OTHERS = "#6e7681";
function buildLanguages(list) {
  const totalBytes = list.reduce((s, l) => s + l.bytes, 0) || 1;
  // Top five, and only if they're at least 1% — slivers fold into "Others".
  const top = list.slice(0, 5).filter((l) => l.bytes / totalBytes >= 0.01);
  const rest = totalBytes - top.reduce((s, l) => s + l.bytes, 0);
  const rows = [...top, ...(rest / totalBytes >= 0.005 ? [{ name: "Others", bytes: rest }] : [])];
  const raw = rows.map((r) => (r.bytes / totalBytes) * 100);
  const floored = raw.map(Math.floor);
  let left = 100 - floored.reduce((s, n) => s + n, 0);
  raw
    .map((v, i) => [v - Math.floor(v), i])
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => left-- > 0 && floored[i]++);
  const used = new Set(top.map((l) => LANG_COLORS[l.name]).filter(Boolean));
  const spare = SPARE.filter((c) => !used.has(c));
  return rows.map((r, i) => ({
    name: r.name,
    percent: floored[i],
    color: r.name === "Others" ? OTHERS : (LANG_COLORS[r.name] ?? spare.shift() ?? OTHERS),
  }));
}
const languages = buildLanguages(data.languages);
const languageColor = (name) => languages.find((l) => l.name === name)?.color ?? LANG_COLORS[name] ?? OTHERS;

// ── Render ───────────────────────────────────────────────────────────────────

mkdirSync(join(ASSETS, "projects"), { recursive: true });
mkdirSync(join(ASSETS, "links"), { recursive: true });
for (const dir of ["projects", "links"]) for (const f of readdirSync(join(ASSETS, dir))) rmSync(join(ASSETS, dir, f));
const out = (path, svg) => writeFileSync(join(ASSETS, path), svg);

const status = lastWeek > 0
  ? { active: true, label: "Active this week" }
  : { active: false, label: lastActive ? `Last active ${lastActive}` : "Quiet lately" };

out("hero.svg", renderHero(config, { status }));

const stats = [
  {
    icon: "activity",
    label: "Contributions",
    value: cal.total.toLocaleString("en-US"),
    note: "in the last 12 months",
    visual: { kind: "spark", data: monthlySeries },
  },
  {
    icon: "book-open",
    label: "Repositories",
    value: String(data.user.publicRepos),
    note: `${data.repos.filter((r) => !r.fork).length} original, rest forks`,
    visual: { kind: "spark", data: reposByYear },
  },
  {
    icon: "graduation-cap",
    label: "Publications",
    value: String(config.research.publications),
    note: `${config.research.citations} citations`,
    noteAccent: true,
    visual: { kind: "papers", count: config.research.publications },
  },
  {
    icon: "calendar-clock",
    label: "Years on GitHub",
    value: String(thisYear - sinceYear),
    note: `Since ${sinceYear}`,
    noteMono: true,
    visual: { kind: "years", since: sinceYear, until: thisYear },
  },
];
out("stats.svg", renderStats(stats));

out("contributions.svg", renderContributions({ total: cal.total, days: cal.days, activeDays, longestStreak }));
out(
  "stack.svg",
  renderStack(config, {
    languages,
    repoCount: data.languageRepoCount,
    scope: data.languagesIncludePrivate ? "repos, incl. private" : "original public repos",
  }),
);

const projects = config.projects.map((p) => {
  const live = p.repo ? data.repos.find((r) => r.name.toLowerCase() === p.repo.toLowerCase()) : null;
  if (p.repo && !live) console.warn(`⚠ repo "${p.repo}" not found or not public — rendering ${p.name} as private`);
  const { svg, alt } = renderProject({ ...p, live }, { languageColor, now });
  out(`projects/${p.slug}.svg`, svg);
  return { ...p, alt, href: live ? live.htmlUrl : config.links[0].href };
});
out("projects-header.svg", renderSectionHeader({ title: "Notable Projects", count: projects.length, action: "View all repositories" }));

out("activity.svg", renderActivity(config.activity));
out("principles.svg", renderPrinciples(config.principles, config));
config.links.forEach((l, i) => out(`links/${l.icon}.svg`, renderLinkButton({ ...l, primary: i === 0 })));

// ── README ───────────────────────────────────────────────────────────────────

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const profileUrl = `https://github.com/${config.login}`;
const img = (src, alt, width = "100%") => `<img src="${src}" width="${width}" alt="${esc(alt)}" />`;
const link = (href, inner) => `<a href="${href}">${inner}</a>`;

const rows = [];
for (let i = 0; i < projects.length; i += 2) {
  rows.push(
    `<p align="center">\n${projects
      .slice(i, i + 2)
      .map((p) => `  ${link(p.href, img(`assets/projects/${p.slug}.svg`, p.alt, "49%"))}`)
      .join("\n")}\n</p>`,
  );
}

const readme = `<!--
  Generated by scripts/build.mjs from profile.config.mjs and live GitHub data.
  Edit those files, not this one. Rebuilt daily by .github/workflows/profile.yml.
-->

${link(config.links[0].href, img("assets/hero.svg", `Welcome to ${config.shortName}'s Hub. ${config.hero.subtitle.join(" ")}`))}

${link(`${profileUrl}?tab=repositories`, img("assets/stats.svg", stats.map((s) => `${s.label}: ${s.value} (${s.note})`).join(" · ")))}

${link(profileUrl, img("assets/contributions.svg", `${cal.total} contributions in the last year`))}

${link(`${profileUrl}?tab=repositories`, img("assets/stack.svg", `Core technologies and top languages: ${languages.map((l) => `${l.name} ${l.percent}%`).join(", ")}`))}

${link(`${profileUrl}?tab=repositories`, img("assets/projects-header.svg", "Notable Projects — view all repositories"))}

${rows.join("\n\n")}

${link(config.links[0].href, img("assets/activity.svg", `Engineering activity: ${config.activity.map((a) => a.title).join("; ")}`))}

${link(config.links[0].href, img("assets/principles.svg", `Principles: ${config.principles.join(" ")}`))}

<p align="center">
${config.links.map((l) => `  ${link(l.href, `<img src="assets/links/${l.icon}.svg" height="36" alt="${esc(l.label)}" />`)}`).join("\n")}
</p>
`;
writeFileSync(join(ROOT, "README.md"), readme);

console.log(
  `✓ built · ${cal.total} contributions · ${data.user.publicRepos} public repos · ` +
    `${languages.map((l) => `${l.name} ${l.percent}%`).join(", ")}`,
);

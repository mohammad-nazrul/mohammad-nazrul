// Live data from GitHub. Works without a token (≈15 REST calls, well under the
// anonymous limit); in Actions the workflow's GITHUB_TOKEN is used when present.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://api.github.com";

function headers(token) {
  return {
    "User-Agent": "profile-readme-builder",
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Local development only: PROFILE_CACHE=1 memoizes API responses in .cache/
// so repeated builds don't burn the anonymous rate limit. Never set in CI.
const CACHE_DIR = process.env.PROFILE_CACHE ? join(dirname(fileURLToPath(import.meta.url)), "../../.cache") : null;
const cachePath = (url) => join(CACHE_DIR, `${createHash("sha1").update(url).digest("hex").slice(0, 16)}.json`);

async function getJson(url, token) {
  if (CACHE_DIR && existsSync(cachePath(url))) return JSON.parse(readFileSync(cachePath(url), "utf8"));
  const res = await fetch(url, { headers: headers(token) });
  if (!res.ok) {
    const hint = res.status === 403 || res.status === 429 ? " (rate limited — set GITHUB_TOKEN)" : "";
    throw new Error(`${res.status} ${res.statusText}${hint} — ${url}`);
  }
  const json = await res.json();
  if (CACHE_DIR) {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(cachePath(url), JSON.stringify(json));
  }
  return json;
}

/**
 * @param opts.token         any token (raises rate limits; optional)
 * @param opts.ownerToken    a token belonging to `login` with repo read access — when
 *                           set, private repos are included in the language breakdown
 * @param opts.languages     { excludeRepos: string[], hide: string[] }
 */
export async function fetchProfileData(login, { token, ownerToken, languages: langOpts = {} } = {}) {
  const [user, repos] = await Promise.all([
    getJson(`${API}/users/${login}`, token),
    getJson(`${API}/users/${login}/repos?per_page=100&type=owner&sort=pushed`, token),
  ]);

  // Language bytes across original (non-fork) repos — public only, unless an
  // owner token lets us see private ones too.
  const excluded = new Set((langOpts.excludeRepos ?? []).map((n) => n.toLowerCase()));
  const hidden = new Set(langOpts.hide ?? []);
  const langSource = ownerToken
    ? (await getJson(`${API}/user/repos?per_page=100&affiliation=owner&visibility=all`, ownerToken)).filter(
        (r) => r.owner.login.toLowerCase() === login.toLowerCase(),
      )
    : repos;
  const own = langSource.filter((r) => !r.fork && !r.archived && !excluded.has(r.name.toLowerCase()));

  const langTotals = {};
  // No catch: a partial fetch must fail the build rather than publish a wrong donut.
  const perRepo = await Promise.all(own.map((r) => getJson(r.languages_url, ownerToken ?? token)));
  for (const langs of perRepo)
    for (const [lang, bytes] of Object.entries(langs))
      if (!hidden.has(lang)) langTotals[lang] = (langTotals[lang] ?? 0) + bytes;

  const contributions = await fetchContributions(login, token);

  return {
    user: {
      login: user.login,
      name: user.name,
      createdAt: user.created_at,
      followers: user.followers,
      publicRepos: user.public_repos,
    },
    repos: repos.map((r) => ({
      name: r.name,
      fork: r.fork,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      pushedAt: r.pushed_at,
      createdAt: r.created_at,
      htmlUrl: r.html_url,
    })),
    languageRepoCount: own.length,
    languagesIncludePrivate: !!ownerToken,
    languages: Object.entries(langTotals)
      .map(([name, bytes]) => ({ name, bytes }))
      .sort((a, b) => b.bytes - a.bytes),
    contributions,
  };
}

/**
 * The public contribution calendar — the same numbers the profile page shows,
 * including private contributions if the profile is set to count them.
 * Falls back to GraphQL (public contributions only) if the HTML changes shape.
 */
async function fetchContributions(login, token) {
  try {
    return await scrapeCalendar(login);
  } catch (err) {
    if (!token) throw err;
    console.warn(`calendar scrape failed (${err.message}); falling back to GraphQL`);
    return graphqlCalendar(login, token);
  }
}

async function scrapeCalendar(login) {
  const res = await fetch(`https://github.com/users/${login}/contributions`, { headers: { "User-Agent": "profile-readme-builder" } });
  if (!res.ok) throw new Error(`contributions page ${res.status}`);
  const html = await res.text();

  const tips = new Map();
  for (const m of html.matchAll(/<tool-tip[^>]*\sfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) tips.set(m[1], m[2]);

  const days = [];
  for (const m of html.matchAll(/<td\b[^>]*ContributionCalendar-day[^>]*>/g)) {
    const tag = m[0];
    const date = tag.match(/data-date="([^"]+)"/)?.[1];
    const id = tag.match(/\sid="([^"]+)"/)?.[1];
    const level = Number(tag.match(/data-level="(\d)"/)?.[1] ?? 0);
    if (!date) continue;
    const tip = tips.get(id) ?? "";
    const n = tip.match(/^(\d[\d,]*) contribution/);
    days.push({ date, level, count: n ? Number(n[1].replace(/,/g, "")) : 0 });
  }
  if (days.length < 300) throw new Error(`parsed only ${days.length} days`);
  days.sort((a, b) => a.date.localeCompare(b.date));

  const heading = html.match(/([\d,]+)\s+contributions?\s+in the last year/);
  const total = heading ? Number(heading[1].replace(/,/g, "")) : days.reduce((s, d) => s + d.count, 0);
  return { total, days };
}

async function graphqlCalendar(login, token) {
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;
  const res = await fetch(`${API}/graphql`, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { login } }),
  });
  const json = await res.json();
  const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw new Error(`GraphQL calendar unavailable: ${JSON.stringify(json.errors ?? json)}`);
  const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
  const days = cal.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: LEVEL[d.contributionLevel] ?? 0 })),
  );
  return { total: cal.totalContributions, days };
}

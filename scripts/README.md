# Profile builder

`README.md` and everything in `assets/` are generated. To change the profile,
edit `profile.config.mjs` and push. The workflow in
`.github/workflows/profile.yml` rebuilds on every push to that file, and once a
day for live numbers.

```sh
node scripts/build.mjs                  # Node 20+, no dependencies
PROFILE_CACHE=1 node scripts/build.mjs  # local dev: caches API responses in .cache/
```

**Live data:**
- the contribution calendar (same numbers as the profile graph)
- public repo count and account age
- stars, forks, language and last push for each public project
- language bytes across your original repos

**From the config:**
- hero text and tags
- technologies
- project descriptions, plus the status of private projects
- the activity timeline
- the publication and citation counts
- links

**Why SVG:** GitHub strips CSS and JavaScript from READMEs, but it serves SVG
images as-is. So every card is a self-contained SVG that uses system fonts and
CSS-only motion (it respects `prefers-reduced-motion`). Text can't be measured
at build time, so it's laid out with Helvetica metrics in `scripts/lib/svg.mjs`.

**Private repos in Top Languages:** add a repository secret named
`PROFILE_TOKEN`: a fine-grained personal access token with read-only
*Contents* and *Metadata* access to your repositories. Without it, only public
repos are counted. `profile.config.mjs → languages` sets which repos and
languages are left out, such as tutorial projects and HTML/CSS.

Icons are from [Lucide](https://lucide.dev) (ISC).

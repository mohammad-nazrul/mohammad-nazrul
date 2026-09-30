// ─────────────────────────────────────────────────────────────────────────────
// Everything a human edits lives here. Live numbers (contributions, repos,
// stars, forks, languages, last-updated dates) are fetched from GitHub by
// scripts/build.mjs, so nothing in this file needs touching when they change.
//
// After editing, run `node scripts/build.mjs` (or just push; the workflow
// rebuilds the cards).
// ─────────────────────────────────────────────────────────────────────────────

export default {
  login: "mohammad-nazrul",
  shortName: "Nazrul",
  location: "Kuching, Sarawak",
  timezone: "UTC+8",

  hero: {
    eyebrow: "Developer profile",
    subtitle: ["Explore his engineering work, open-source projects,", "technology stack and contributions."],
    tags: ["Fintech", "Backend", "Full Stack", "AI / NLP"],
  },

  // "Top Languages" donut. Byte counts come from GitHub; these knobs keep it honest
  // about what you actually write. Set a PROFILE_TOKEN secret (a fine-grained token
  // with read access to your repos) to include private repos as well.
  languages: {
    excludeRepos: ["mohammad-nazrul", "UnityFPSTutos", "photonTest"], // this repo + tutorial projects
    hide: ["HTML", "CSS", "SCSS", "ShaderLab", "HLSL", "Mask", "Hack", "Objective-C", "Dockerfile", "Makefile"],
  },

  // Shown as a stat card. Not available from the GitHub API.
  research: { publications: 3, citations: 16 },

  links: [
    { label: "Portfolio", icon: "globe", href: "https://nazrulmornie.my" },
    { label: "ResearchGate", icon: "file-text", href: "https://www.researchgate.net/profile/Mohammad-Nazrul-Mornie" },
    { label: "Email", icon: "mail", href: "mailto:nazmnm5@gmail.com" },
  ],

  principles: ["Build useful systems.", "Learn continuously.", "Ship things that matter."],

  // Grouped chips on the "Core Technologies" card. `accent` is the chip hairline/icon tint.
  technologies: [
    { group: "Backend", items: [
      { name: "Java", icon: "coffee", accent: "#c8702c" },
      { name: "Spring Boot", icon: "leaf", accent: "#5fa04e" },
      { name: "Python", icon: "box", accent: "#a38e1c" },
    ] },
    { group: "Frontend", items: [
      { name: "TypeScript", icon: "ts", accent: "#4c8dff" },
      { name: "React", icon: "atom", accent: "#4fb3d9" },
      { name: "Next.js", icon: "triangle", accent: "#c9d1d9" },
      { name: "Flutter", icon: "smartphone", accent: "#4f9fe0" },
    ] },
    { group: "Data & Messaging", items: [
      { name: "Oracle", icon: "server", accent: "#d0544a" },
      { name: "PostgreSQL", icon: "database", accent: "#6a8fc7" },
      { name: "Redis", icon: "layers", accent: "#d05a4a" },
      { name: "Kafka", icon: "waypoints", accent: "#aab2bd" },
    ] },
    { group: "Platform", items: [
      { name: "Docker", icon: "container", accent: "#3f8fd8" },
      { name: "Kubernetes", icon: "ship-wheel", accent: "#5b82e0" },
    ] },
    { group: "AI", items: [{ name: "AI / NLP", icon: "brain-circuit", accent: "#9b85f0" }] },
  ],

  // Notable Projects, two per row, in this order.
  // `repo` → public repo: stars, forks, language and "updated" come from GitHub.
  // no `repo` → private/work project: shows a Private badge and `status` instead.
  projects: [
    {
      slug: "payment-infrastructure",
      name: "Payment Infrastructure",
      description: "Production financial infrastructure supporting payment processing, approval workflows and transaction management.",
      topics: ["java", "spring-boot", "oracle", "fintech"],
      status: "Production · work",
    },
    {
      slug: "tempahku",
      name: "TempahKu",
      description: "Multi-tenant booking SaaS for Malaysian service businesses: tenant isolation, recurring billing and a race-safe booking engine.",
      topics: ["spring-boot", "postgresql", "react", "saas"],
      status: "In development",
    },
    {
      slug: "rent-bro",
      name: "RentBro",
      repo: "rent-bro",
      description: "Rental property management with a ledger-first design: every balance traces back to the transaction that caused it.",
      topics: ["nextjs", "typescript", "tailwind"],
    },
    {
      slug: "mailify",
      name: "Mailify",
      description: "Personalized email composition and automation platform supporting templates, dynamic fields and multi-recipient workflows.",
      topics: ["react", "spring-boot", "email", "templating"],
      status: "In development",
    },
    {
      slug: "saveup",
      name: "SaveUp",
      description: "Gamified, goal-based savings tracker that uses the Anthropic API to turn vague intentions into structured, trackable goals.",
      topics: ["spring-boot", "react", "anthropic-api"],
      status: "In development",
    },
    {
      slug: "enelayan",
      name: "e-Nelayan",
      repo: "enelayan",
      language: "Java", // repo itself reports none; the app code is Java
      description: "Marketplace letting fishermen in Kota Samarahan sell catch directly to buyers. INTEX Silver Award and a published journal paper.",
      topics: ["java", "android", "firebase"],
    },
    {
      slug: "rep-forge",
      name: "Rep Forge",
      description: "Fitness tracking platform for workouts, body progress, nutrition and shareable fitness analytics.",
      topics: ["nextjs", "supabase", "analytics"],
      status: "In development",
    },
    {
      slug: "koda",
      name: "Koda",
      repo: "koda",
      description: "A custom Spotify player: your library, your layout.",
      topics: ["typescript", "spotify-api"],
    },
  ],

  // Engineering Activity timeline (newest first). `kind` picks the icon + label.
  activity: [
    { kind: "architecture", title: "Designed distributed audit logging architecture", summary: "Asynchronous audit logging for distributed services, built on Kafka and Redis.", context: "fintech · work" },
    { kind: "feature", title: "Built approval workflow engine", summary: "Multi-level approval flows for payment and transaction operations.", context: "fintech · work" },
    { kind: "performance", title: "Improved payment transaction processing", summary: "Performance and reliability work on the core payment path (Java, Oracle).", context: "fintech · work" },
    { kind: "feature", title: "Implemented Redis-based background processing", summary: "Background job processing on Redis for asynchronous workloads.", context: "fintech · work" },
    { kind: "devops", title: "Designed CI/CD workflows", summary: "Build, test and deployment pipelines for backend services.", context: "platform · work" },
    { kind: "tooling", title: "Built internal developer tooling", summary: "Internal tools for automation, observability and developer productivity.", context: "platform · work" },
    { kind: "research", title: "Published US2UCD", summary: "NLP pipeline (Stanza, CoreNLP) that generates UML use case diagrams from user stories.", context: "MSc research · UNIMAS" },
  ],
};

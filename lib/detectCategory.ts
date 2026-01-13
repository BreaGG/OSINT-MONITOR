type Category =
  | "conflict"
  | "disaster"
  | "health"
  | "economy"
  | "sports"
  | "politics";

export function detectCategory(text: string): Category {
  const t = text.toLowerCase();

  /* ===================== KEYWORDS ===================== */

  const CONFLICT = [
    // General
    "war",
    "armed",
    "attack",
    "strike",
    "airstrike",
    "missile",
    "rocket",
    "bomb",
    "explosion",
    "shelling",
    "killed",
    "casualties",
    "ceasefire",
    "frontline",
    "offensive",
    "defensive",
    "invasion",
    "occupation",

    // Forces & actors
    "army",
    "military",
    "troops",
    "soldiers",
    "forces",
    "security forces",
    "rebels",
    "militia",

    // Actions
    "fight",
    "fighting",
    "clash",
    "clashes",
    "combat",
    "skirmish",
    "raid",

    // Civil impact
    "civilians",
    "displaced",
    "evacuation",
    "areas secured",
    "after fighting",

    // Known actors (OSINT-specific)
    "sdf",
    "idf",
    "hamas",
    "hezbollah",
    "taliban",
    "wagner",
    "syrian army",
  ];

  const DISASTER = [
    "earthquake",
    "flood",
    "hurricane",
    "cyclone",
    "storm",
    "typhoon",
    "wildfire",
    "fire",
    "tsunami",
    "landslide",
    "disaster",
    "emergency",
    "evacuation",
    "collapsed",
  ];

  const HEALTH = [
    "health",
    "disease",
    "virus",
    "outbreak",
    "epidemic",
    "pandemic",
    "covid",
    "hospital",
    "vaccine",
    "vaccination",
    "patients",
    "medical",
    "doctors",
    "illness",
  ];

  // 💰 ECONOMY
  const ECONOMY = [
    "economy",
    "economic",
    "inflation",
    "recession",
    "interest rate",
    "rates hike",
    "central bank",
    "federal reserve",
    "ecb",
    "gdp",
    "growth",
    "markets",
    "stocks",
    "shares",
    "bonds",
    "debt",
    "currency",
    "forex",
    "trade",
    "exports",
    "imports",
    "sanctions",
    "tariffs",
    "oil prices",
    "gas prices",
    "unemployment",
    "jobs data",
    "layoffs",
    "bank",
    "banking",
    "financial",
  ];

  // 👟 SPORTS — detectamos pero no priorizamos
  const SPORTS = [
    "football",
    "soccer",
    "nba",
    "nfl",
    "fifa",
    "uefa",
    "olympics",
    "world cup",
    "tournament",
    "coach",
    "real madrid",
    "mbappe",
  ];

  /* ===================== DETECTION (PRIORITY ORDER) ===================== */

  if (CONFLICT.some((k) => t.includes(k))) return "conflict";
  if (DISASTER.some((k) => t.includes(k))) return "disaster";
  if (HEALTH.some((k) => t.includes(k))) return "health";
  if (ECONOMY.some((k) => t.includes(k))) return "economy";
  if (SPORTS.some((k) => t.includes(k))) return "sports";

  // 🟦 Política como fallback consciente
  return "politics";
}

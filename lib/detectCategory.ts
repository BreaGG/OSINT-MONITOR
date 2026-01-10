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
    "military",
    "troops",
    "soldiers",
    "killed",
    "casualties",
    "ceasefire",
    "frontline",
    "offensive",
    "defensive",
    "invasion",
    "occupation",
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
    "match",
    "tournament",
    "goal",
    "league",
    "coach",
    "player",
    "injury",
    "season",
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

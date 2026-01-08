export type StrategicChokepoint = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  summary: string;
  status: string;
};

export const strategicChokepoints: StrategicChokepoint[] = [
  {
    id: "panama",
    name: "Panama Canal",
    country: "Panama",
    lat: 9.08,
    lon: -79.68,
    summary:
      "Critical maritime chokepoint connecting the Atlantic and Pacific Oceans. Key for global trade.",
    status: "High strategic importance",
  },
  {
    id: "suez",
    name: "Suez Canal",
    country: "Egypt",
    lat: 30.8,
    lon: 32.35,
    summary:
      "Major shipping route between Europe and Asia. Frequent geopolitical and security risks.",
    status: "Global trade chokepoint",
  },
  {
    id: "hormuz",
    name: "Strait of Hormuz",
    country: "Iran",
    lat: 26.56,
    lon: 56.25,
    summary:
      "Primary oil transit chokepoint. Strategic leverage point in Middle East tensions.",
    status: "Extreme geopolitical sensitivity",
  },
  {
    id: "bosphorus",
    name: "Bosphorus Strait",
    country: "Turkey",
    lat: 41.12,
    lon: 29.08,
    summary:
      "Connects Black Sea to Mediterranean. Key military and commercial passage.",
    status: "Strategic maritime corridor",
  },
];

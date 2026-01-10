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
    {
    id: "strait-of-gibraltar",
    name: "Strait of Gibraltar",
    country: "Spain / Morocco",
    lat: 35.9780,
    lon: -5.6060,
    summary:
      "The Strait of Gibraltar is one of the world's most critical maritime chokepoints, controlling access between the Atlantic Ocean and the Mediterranean Sea. It is essential for global trade, energy transport, and NATO naval operations, and is sensitive to regional instability in North Africa and Southern Europe.",
    status: "Strategic maritime chokepoint linking the Atlantic Ocean and the Mediterranean Sea.",
    }
];

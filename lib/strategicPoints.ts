export type StrategicPoint = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  level: "LOW" | "MEDIUM" | "HIGH";
  summary: string;
  status: string;
  entities: string[];
};

export const strategicPoints: StrategicPoint[] = [
  {
    id: "washington",
    name: "Washington, D.C.",
    country: "United States",
    lat: 38.9,
    lon: -77.03,
    level: "HIGH",
    summary:
      "US political and military decision-making center. Global foreign policy, NATO leadership, intelligence agencies.",
    status: "Global power center",
    entities: ["CIA", "NSA", "Pentagon", "White House"],
  },
  {
    id: "caracas",
    name: "Caracas",
    country: "Venezuela",
    lat: 10.5,
    lon: -66.9,
    level: "HIGH",
    summary:
      "Venezuelan political crisis center. Maduro regime, opposition movements, oil politics.",
    status: "Political instability",
    entities: ["SEBIN", "DGCIM", "PDVSA"],
  },
  {
    id: "moscow",
    name: "Moscow",
    country: "Russia",
    lat: 55.75,
    lon: 37.62,
    level: "HIGH",
    summary:
      "Russian federal power center. Military command, intelligence services, foreign policy coordination.",
    status: "Active geopolitical conflict",
    entities: ["FSB", "GRU", "Kremlin"],
  },
  {
    id: "kyiv",
    name: "Kyiv",
    country: "Ukraine",
    lat: 50.45,
    lon: 30.52,
    level: "HIGH",
    summary:
      "Ukrainian government center during ongoing conflict. Military coordination and international diplomacy.",
    status: "Active conflict zone",
    entities: ["UAF", "MoD Ukraine"],
  },
  {
    id: "pyongyang",
    name: "Pyongyang",
    country: "North Korea",
    lat: 39.03,
    lon: 125.75,
    level: "HIGH",
    summary:
      "North Korean regime center. Nuclear program, military command, international sanctions.",
    status: "Closed authoritarian regime",
    entities: ["KPA", "WPK"],
  },
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    lat: 51.5,
    lon: -0.12,
    level: "MEDIUM",
    summary:
      "UK political and financial hub. Intelligence coordination, diplomacy, global finance.",
    status: "Stable power center",
    entities: ["MI6", "GCHQ", "HM Government"],
  },
  {
    id: "telaviv",
    name: "Tel Aviv",
    country: "Israel",
    lat: 32.08,
    lon: 34.78,
    level: "HIGH",
    summary:
      "Israeli security and military coordination hub. Regional conflicts and intelligence operations.",
    status: "Regional security hotspot",
    entities: ["IDF", "Mossad", "Shin Bet"],
  },
  {
    id: "tehran",
    name: "Tehran",
    country: "Iran",
    lat: 35.69,
    lon: 51.39,
    level: "HIGH",
    summary:
      "Iranian political and military leadership center. Regional influence, nuclear program.",
    status: "Geopolitical tension",
    entities: ["IRGC", "Supreme Council"],
  },
  {
    id: "greenland-strategic",
    name: "Greenland",
    country: "Greenland",
    lat: 59.7726,
    lon: -43.9160,
    level: "HIGH",
    summary:
      "Greenland has re-emerged as a strategic focal point due to renewed geopolitical interest from the United States. Its location between North America and Europe, control over Arctic access routes, and proximity to emerging polar shipping lanes significantly increase its military and strategic relevance.",
    status:
      "Strategic attention",
    entities: [
      "United States",
      "Donald Trump",
      "Denmark",
      "NATO",
      "Arctic Council",
      "Thule Air Base",
      "Russia",
      "China",
    ],
  },
];

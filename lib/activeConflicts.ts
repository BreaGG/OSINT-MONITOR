export type ActiveConflict = {
  id: string;
  name: string;
  level: "LOW" | "MEDIUM" | "HIGH";
  lat: number;
  lon: number;
  startDate: string;
  casualties: string;
  displaced: string;
  description: string;
  belligerents: string[];
  developments: string[];
};

export const activeConflicts: ActiveConflict[] = [
  {
    id: "sudan",
    name: "Sudan Civil War",
    level: "MEDIUM",
    lat: 15.0,
    lon: 32.5,
    startDate: "Apr 15, 2023",
    casualties: "15,000+ killed",
    displaced: "10M+ displaced",
    description:
      "Power struggle between SAF and RSF paramilitary forces. Fighting centered around Khartoum and Darfur. Major humanitarian catastrophe with famine conditions.",
    belligerents: ["Sudanese Armed Forces (SAF)", "Rapid Support Forces (RSF)"],
    developments: [
      "Khartoum battle",
      "Darfur massacres",
      "El Fasher siege",
      "Famine declared",
    ],
  },
  {
    id: "ukraine",
    name: "Ukraine War",
    level: "HIGH",
    lat: 49.0,
    lon: 32.0,
    startDate: "Feb 24, 2022",
    casualties: "100,000+ killed",
    displaced: "14M+ displaced",
    description:
      "Full-scale invasion by Russia against Ukraine. Ongoing high-intensity conflict with widespread destruction and civilian impact.",
    belligerents: ["Ukraine", "Russian Federation"],
    developments: [
      "Frontline attrition",
      "Missile strikes",
      "Western military aid",
    ],
  },
  {
    id: "gaza",
    name: "Gaza Conflict",
    level: "HIGH",
    lat: 31.5,
    lon: 34.5,
    startDate: "Oct 7, 2023",
    casualties: "30,000+ killed",
    displaced: "1.9M+ displaced",
    description:
      "Armed conflict between Israel and Hamas in the Gaza Strip. Large-scale civilian casualties and infrastructure destruction.",
    belligerents: ["Israel", "Hamas"],
    developments: [
      "Ground operations",
      "Air strikes",
      "Humanitarian corridors",
    ],
  },
  {
    id: "myanmar",
    name: "Myanmar Civil War",
    level: "MEDIUM",
    lat: 21.0,
    lon: 96.0,
    startDate: "Feb 1, 2021",
    casualties: "50,000+ killed",
    displaced: "2.5M+ displaced",
    description:
      "Multi-front civil war following military coup. Junta fighting ethnic armed organizations and resistance forces.",
    belligerents: ["Myanmar Junta", "Ethnic Armed Groups", "PDF"],
    developments: ["Operation 1027", "Junta airstrikes", "Border instability"],
  },
  {
    id: "taiwan",
    name: "Taiwan Strait Tensions",
    level: "HIGH",
    lat: 23.7,
    lon: 121.0,
    startDate: "Ongoing",
    casualties: "N/A",
    displaced: "N/A",
    description:
      "Military and political tensions between China and Taiwan. Frequent naval and air force maneuvers in the region.",
    belligerents: ["People's Republic of China", "Taiwan"],
    developments: ["PLA exercises", "Naval patrols", "US regional presence"],
  },
    {
    id: "iran",
    name: "Iran Regional Conflict",
    level: "HIGH",
    lat: 32.0,
    lon: 53.0,
    startDate: "Ongoing",
    casualties: "Thousands (regional, indirect)",
    displaced: "N/A",
    description:
      "Iran is engaged in a regional proxy conflict involving Israel, Hezbollah, the Houthis, and indirect confrontations with the United States. Escalations include missile strikes, drone attacks, maritime incidents, and cross-border engagements.",
    belligerents: [
      "Islamic Republic of Iran",
      "Israel",
      "Hezbollah",
      "Houthis",
      "United States (indirect)",
    ],
    developments: [
      "Missile and drone strikes",
      "Red Sea maritime attacks",
      "Israel–Hezbollah border clashes",
      "US–Iran naval incidents",
    ],
  },
];

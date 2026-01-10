export type StrategicMilitaryBase = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
  description: string;
  significance: string;
};

export const strategicMilitaryBases: StrategicMilitaryBase[] = [
  {
    id: "diego-garcia",
    name: "Diego Garcia Naval Base",
    lat: -7.3133,
    lon: 72.4111,
    country: "British Indian Ocean Territory",
    description:
      "Major US-UK joint military base used for power projection across the Indo-Pacific and Middle East.",
    significance: "US strategic bomber, naval and logistics hub",
  },
  {
    id: "djibouti",
    name: "Djibouti Military Hub",
    lat: 11.5473,
    lon: 43.1595,
    country: "Djibouti",
    description:
      "Hosts multiple foreign military bases including US, China, France and Japan.",
    significance: "Control of Bab el-Mandeb and Red Sea access",
  },
  {
    id: "kaliningrad",
    name: "Kaliningrad Military District",
    lat: 54.7104,
    lon: 20.4522,
    country: "Russia",
    description:
      "Heavily militarized Russian exclave with missile systems and naval forces.",
    significance: "A2/AD zone in the Baltic region",
  },
  {
    id: "hainan",
    name: "Hainan Naval Base",
    lat: 18.2528,
    lon: 109.5119,
    country: "China",
    description:
      "Key PLA Navy submarine and surface fleet base in the South China Sea.",
    significance: "South China Sea power projection",
  },
  {
    id: "ramstein",
    name: "Ramstein Air Base",
    lat: 49.4369,
    lon: 7.6003,
    country: "Germany",
    description:
      "Largest US Air Force base in Europe and key logistics hub for NATO operations.",
    significance: "US-NATO air operations and command hub in Europe",
  },
  {
    id: "guam",
    name: "Andersen Air Force Base (Guam)",
    lat: 13.5841,
    lon: 144.9308,
    country: "United States",
    description:
      "Forward-deployed US strategic bomber base in the Western Pacific.",
    significance: "Indo-Pacific power projection and bomber operations",
  },
  {
    id: "pearl-harbor",
    name: "Pearl Harbor–Hickam",
    lat: 21.344,
    lon: -157.959,
    country: "United States",
    description: "Primary US naval and air base in the Pacific.",
    significance: "US Pacific Fleet headquarters",
  },
  {
    id: "sevastopol",
    name: "Sevastopol Naval Base",
    lat: 44.6167,
    lon: 33.5254,
    country: "Crimea",
    description: "Major Russian naval base hosting the Black Sea Fleet.",
    significance: "Control of the Black Sea and regional naval dominance",
  },
  {
    id: "tartus",
    name: "Tartus Naval Facility",
    lat: 34.889,
    lon: 35.886,
    country: "Syria",
    description: "Russia’s only naval base in the Mediterranean.",
    significance: "Russian Mediterranean naval presence",
  },
  {
    id: "al-udeid",
    name: "Al Udeid Air Base",
    lat: 25.117,
    lon: 51.314,
    country: "Qatar",
    description: "Largest US military base in the Middle East.",
    significance: "CENTCOM forward headquarters and air operations hub",
  },
  {
    id: "incirlik",
    name: "Incirlik Air Base",
    lat: 37.002,
    lon: 35.425,
    country: "Turkey",
    description:
      "Key NATO air base with strategic access to Middle East and Eastern Europe.",
    significance: "NATO regional air power and nuclear sharing site",
  },
  {
    id: "okinawa",
    name: "Okinawa Military Complex",
    lat: 26.212,
    lon: 127.681,
    country: "Japan",
    description:
      "Dense concentration of US military bases near Taiwan and East China Sea.",
    significance: "First island chain defense and rapid response hub",
  },
  {
    id: "diego-suarez",
    name: "Diego Suarez Naval Base",
    lat: -12.2765,
    lon: 49.3115,
    country: "Madagascar",
    description:
      "Strategic deep-water port at the entrance of the Mozambique Channel.",
    significance: "Control of Indian Ocean maritime routes",
  },
  {
    id: "port-sudan",
    name: "Port Sudan Naval Facility",
    lat: 19.615,
    lon: 37.216,
    country: "Sudan",
    description: "Potential Russian naval logistics facility on the Red Sea.",
    significance: "Red Sea naval access and power projection",
  },
  {
    id: "svalbard",
    name: "Svalbard Strategic Zone",
    lat: 78.223,
    lon: 15.646,
    country: "Norway",
    description: "Arctic strategic zone with growing military relevance.",
    significance: "Arctic access and northern sea routes monitoring",
  },
  {
    id: "pangkalan-bun",
    name: "Natuna Islands Military Base",
    lat: 3.945,
    lon: 108.388,
    country: "Indonesia",
    description:
      "Indonesian military presence near South China Sea disputed waters.",
    significance: "South China Sea deterrence and EEZ enforcement",
  },
];

export type Country = {
  name: string;
  lat: number;
  lon: number;
  aliases: {
    strong: string[]; // lugares físicos inequívocos
    weak: string[]; // actores / gobierno (solo fallback)
  };
};

export const countries: Country[] = [
  /* ===================== NORTH AMERICA ===================== */

  {
    name: "United States",
    lat: 37.0902,
    lon: -95.7129,
    aliases: {
      strong: [
        "United States",
        "U.S.",
        "USA",
        "Washington DC",
        "New York",
        "Los Angeles",
        "Texas",
        "California",
        "Florida",
      ],
      weak: [
        "US government",
        "White House",
        "Pentagon",
        "State Department",
        "Biden administration",
        "Congress",
      ],
    },
  },

  /* ===================== EUROPE ===================== */

  {
    name: "United Kingdom",
    lat: 55.3781,
    lon: -3.436,
    aliases: {
      strong: [
        "United Kingdom",
        "UK",
        "U.K.",
        "Britain",
        "England",
        "Scotland",
        "Wales",
        "London",
        "Manchester",
      ],
      weak: ["British government", "Downing Street", "Prime Minister"],
    },
  },

  {
    name: "France",
    lat: 46.2276,
    lon: 2.2137,
    aliases: {
      strong: [
        "France",
        "Paris",
        "Marseille",
        "Lyon",
        "Nice",
        "French territory",
      ],
      weak: ["French government", "Elysée", "Macron"],
    },
  },

  {
    name: "Germany",
    lat: 51.1657,
    lon: 10.4515,
    aliases: {
      strong: ["Germany", "Berlin", "Munich", "Hamburg", "Frankfurt"],
      weak: ["German government", "Bundestag", "Scholz"],
    },
  },

  {
    name: "Spain",
    lat: 40.4637,
    lon: -3.7492,
    aliases: {
      strong: ["Spain", "Madrid", "Barcelona", "Valencia", "Seville"],
      weak: ["Spanish government", "Sanchez"],
    },
  },

  {
    name: "Italy",
    lat: 41.8719,
    lon: 12.5674,
    aliases: {
      strong: ["Italy", "Rome", "Milan", "Naples", "Sicily"],
      weak: ["Italian government", "Meloni"],
    },
  },

  {
    name: "European Union",
    lat: 50.8503,
    lon: 4.3517,
    aliases: {
      strong: ["European Union", "EU", "E.U.", "Brussels"],
      weak: ["European Commission", "EU leaders", "EU summit"],
    },
  },

  /* ===================== EASTERN EUROPE / RUSSIA ===================== */

  {
    name: "Ukraine",
    lat: 48.3794,
    lon: 31.1656,
    aliases: {
      strong: [
        "Ukraine",
        "Kyiv",
        "Kiev",
        "Kharkiv",
        "Donetsk",
        "Luhansk",
        "Crimea",
      ],
      weak: ["Ukrainian forces", "Zelensky"],
    },
  },

  {
    name: "Russia",
    lat: 61.524,
    lon: 105.3188,
    aliases: {
      strong: ["Russia", "Moscow", "Saint Petersburg", "Chechnya"],
      weak: ["Russian forces", "Kremlin", "Putin"],
    },
  },

  /* ===================== MIDDLE EAST ===================== */

  {
    name: "Syria",
    lat: 34.8021,
    lon: 38.9968,
    aliases: {
      strong: ["Syria", "Damascus", "Aleppo", "Homs", "Idlib", "Latakia"],
      weak: ["Syrian government", "Assad"],
    },
  },

  {
    name: "Israel",
    lat: 31.0461,
    lon: 34.8516,
    aliases: {
      strong: ["Israel", "Jerusalem", "Tel Aviv", "Haifa"],
      weak: ["Israeli army", "IDF", "Netanyahu"],
    },
  },

  {
    name: "Palestine",
    lat: 31.9522,
    lon: 35.2332,
    aliases: {
      strong: [
        "Palestine",
        "Gaza",
        "West Bank",
        "Ramallah",
        "Rafah",
        "Khan Younis",
      ],
      weak: ["Palestinian", "Hamas"],
    },
  },

  {
    name: "Iran",
    lat: 32.4279,
    lon: 53.688,
    aliases: {
      strong: ["Iran", "Tehran", "Isfahan"],
      weak: ["Iranian government", "IRGC", "Ayatollah"],
    },
  },

  {
    name: "Turkey",
    lat: 38.9637,
    lon: 35.2433,
    aliases: {
      strong: ["Turkey", "Ankara", "Istanbul"],
      weak: ["Turkish government", "Erdogan"],
    },
  },

  {
    name: "Saudi Arabia",
    lat: 23.8859,
    lon: 45.0792,
    aliases: {
      strong: ["Saudi Arabia", "Riyadh", "Jeddah"],
      weak: ["Saudi government", "MBS", "Crown Prince"],
    },
  },

  /* ===================== ASIA ===================== */

  {
    name: "China",
    lat: 35.8617,
    lon: 104.1954,
    aliases: {
      strong: ["China", "Beijing", "Shanghai", "Xinjiang", "Hong Kong"],
      weak: ["Chinese government", "Communist Party", "Xi Jinping"],
    },
  },

  {
    name: "Taiwan",
    lat: 23.6978,
    lon: 120.9605,
    aliases: {
      strong: ["Taiwan", "Taipei"],
      weak: ["Taiwanese authorities"],
    },
  },

  {
    name: "Japan",
    lat: 36.2048,
    lon: 138.2529,
    aliases: {
      strong: ["Japan", "Tokyo", "Osaka"],
      weak: ["Japanese government", "Kishida"],
    },
  },

  {
    name: "South Korea",
    lat: 35.9078,
    lon: 127.7669,
    aliases: {
      strong: ["South Korea", "Seoul"],
      weak: ["South Korean government"],
    },
  },

  {
    name: "North Korea",
    lat: 40.3399,
    lon: 127.5101,
    aliases: {
      strong: ["North Korea", "Pyongyang"],
      weak: ["Kim Jong Un"],
    },
  },

  /* ===================== LATIN AMERICA ===================== */

{
  name: "Mexico",
  lat: 19.43,
  lon: -99.13,
  aliases: {
    strong: ["Mexico", "Mexico City", "CDMX"],
    weak: ["cartel", "drug trafficking", "AMLO", "Mexican government"],
  },
},

{
  name: "Colombia",
  lat: 4.71,
  lon: -74.07,
  aliases: {
    strong: ["Colombia", "Bogotá"],
    weak: ["FARC", "ELN", "drug trafficking"],
  },
},

{
  name: "Venezuela",
  lat: 10.65,
  lon: -71.65, // Maracaibo
  aliases: {
    strong: ["Venezuela", "Maracaibo", "Zulia"],
    weak: ["Maduro", "PDVSA", "oil", "sanctions"],
  },
},

{
  name: "Brazil",
  lat: -23.55,
  lon: -46.63, // São Paulo > Brasilia para OSINT
  aliases: {
    strong: ["Brazil", "Brasil", "São Paulo"],
    weak: ["Lula", "Amazon", "deforestation", "organized crime"],
  },
},

{
  name: "Argentina",
  lat: -34.61,
  lon: -58.38,
  aliases: {
    strong: ["Argentina", "Buenos Aires"],
    weak: ["economic crisis", "inflation", "IMF"],
  },
},

{
  name: "Chile",
  lat: -33.45,
  lon: -70.66,
  aliases: {
    strong: ["Chile", "Santiago"],
    weak: ["protests", "constitutional reform"],
  },
},

{
  name: "Peru",
  lat: -12.05,
  lon: -77.04,
  aliases: {
    strong: ["Peru", "Lima"],
    weak: ["political crisis", "coup", "protests"],
  },
},
{
  name: "Venezuela",
  lat: 7.0,
  lon: -66.0,
  aliases: {
    strong: ["Venezuela", "Maracaibo", "Zulia"],
    weak: [
      "Venezuelan government",
      "Maduro",
      "Bolivarian",
      "PDVSA",
      "oil infrastructure",
    ],
  },
},
];

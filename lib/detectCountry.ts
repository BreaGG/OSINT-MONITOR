import { countries } from "./countries"

/* ===================== CONFIG ===================== */

const MEDIA_PATTERNS = [
  "france 24",
  "bbc",
  "reuters",
  "associated press",
  "ap news",
  "al jazeera",
  "dw",
  "deutsche welle",
  "cnn",
  "sky news",
  "the guardian",
  "new york times",
  "washington post",
]

const HIGH_CONFIDENCE_LOCATIONS: {
  keyword: string
  country: string
}[] = [
  { keyword: "aleppo", country: "Syria" },
  { keyword: "damascus", country: "Syria" },
  { keyword: "gaza", country: "Palestine" },
  { keyword: "rafah", country: "Palestine" },
  { keyword: "donetsk", country: "Ukraine" },
  { keyword: "luhansk", country: "Ukraine" },
  { keyword: "kyiv", country: "Ukraine" },
  { keyword: "kiev", country: "Ukraine" },
  { keyword: "kharkiv", country: "Ukraine" },
  { keyword: "tehran", country: "Iran" },
  { keyword: "baghdad", country: "Iraq" },
  { keyword: "beirut", country: "Lebanon" },
]

/* ===================== HELPERS ===================== */

function cleanEditorialNoise(text: string) {
  let clean = text.toLowerCase()

  clean = clean.replace(/'s\b/g, "")

  MEDIA_PATTERNS.forEach(pattern => {
    const re = new RegExp(`\\b${pattern}\\b`, "gi")
    clean = clean.replace(re, "")
  })

  return clean
}

/* ===================== DETECTOR ===================== */

export function detectCountry(text: string) {
  if (!text) return { name: "Global", lat: 0, lon: 0 }

  const cleaned = cleanEditorialNoise(text)

  /* ========= 1️⃣ CIUDADES / REGIONES (máxima prioridad) ========= */
  for (const loc of HIGH_CONFIDENCE_LOCATIONS) {
    if (cleaned.includes(loc.keyword)) {
      const country = countries.find(c => c.name === loc.country)
      if (country) return country
    }
  }

  /* ========= 2️⃣ PAÍSES – aliases STRONG ========= */
  for (const country of countries) {
    for (const alias of country.aliases.strong) {
      const re = new RegExp(`\\b${alias.toLowerCase()}\\b`, "i")
      if (re.test(cleaned)) {
        return country
      }
    }
  }

  /* ========= 3️⃣ PAÍSES – aliases WEAK (solo si no hay ciudad) ========= */
  for (const country of countries) {
    for (const alias of country.aliases.weak) {
      const re = new RegExp(`\\b${alias.toLowerCase()}\\b`, "i")
      if (re.test(cleaned)) {
        return country
      }
    }
  }

  /* ========= 4️⃣ FALLBACK ========= */
  return {
    name: "Global",
    lat: 0,
    lon: 0,
  }
}

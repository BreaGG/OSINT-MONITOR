import { countries } from "./countries"

/* ===================== TYPES ===================== */

type ResolvedCountry = {
  name: string
  lat: number | null
  lon: number | null
}

/* ===================== CONFIG ===================== */

const MEDIA_CONTEXT = [
  "said",
  "according to",
  "reported by",
  "speaking to",
  "told",
  "journalist",
  "correspondent",
  "channel",
  "news",
  "tv",
  "france 24",
  "reuters",
  "bbc",
  "al jazeera",
  "dw",
]

/* ===================== HELPERS ===================== */

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function hasMediaContext(text: string, index: number) {
  const window = text.slice(Math.max(0, index - 40), index + 40)
  return MEDIA_CONTEXT.some(w =>
    window.toLowerCase().includes(w)
  )
}

/* ===================== CORE ===================== */

export function resolveCountry(text: string): ResolvedCountry {
  const lower = text.toLowerCase()

  const scores: Map<
    string,
    { score: number; lat: number; lon: number }
  > = new Map()

  for (const country of countries) {
    let score = 0

    /* ===== STRONG ALIASES (lugares reales) ===== */
    for (const alias of country.aliases.strong) {
      const regex = new RegExp(`\\b${escapeRegex(alias)}\\b`, "gi")
      let match
      while ((match = regex.exec(lower)) !== null) {
        score += 3
      }
    }

    /* ===== WEAK ALIASES (medios, gentilicios, líderes) ===== */
    for (const alias of country.aliases.weak) {
      const regex = new RegExp(`\\b${escapeRegex(alias)}\\b`, "gi")
      let match
      while ((match = regex.exec(lower)) !== null) {
        if (hasMediaContext(lower, match.index)) continue
        score += 1
      }
    }

    if (score > 0) {
      scores.set(country.name, {
        score,
        lat: country.lat,
        lon: country.lon,
      })
    }
  }

  if (scores.size === 0) {
    return { name: "Global", lat: null, lon: null }
  }

  const sorted = [...scores.entries()].sort(
    (a, b) => b[1].score - a[1].score
  )

  // Ambiguo → Global
  if (
    sorted.length > 1 &&
    sorted[1][1].score >= sorted[0][1].score * 0.7
  ) {
    return { name: "Global", lat: null, lon: null }
  }

  const [name, data] = sorted[0]
  return { name, lat: data.lat, lon: data.lon }
}

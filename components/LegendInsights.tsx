import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"

type Props = {
  events: Event[]
}

type CategoryKey = keyof typeof categoryColors

/* ===================== CONFIG ===================== */

const HOURS_WINDOW = 72
const DOMINANCE_THRESHOLD = 0.4
const STORAGE_KEY = "osint-insights-snapshot"
const MAX_CHANGES = 4

const COUNTRY_LABELS: Record<string, string> = {
  "United States": "USA",
  "United Kingdom": "UK",
}

const ENTITY_ALIASES: Record<string, string[]> = {
  "Donald Trump": ["Trump", "President Donald Trump"],
  "White House": ["US Government", "Biden administration"],
}

const ENTITY_STOPWORDS = [
  "Breaking News",
  "Prime Minister",
  "President",
]

/* ===================== HELPERS ===================== */

function formatCountry(country: string) {
  return COUNTRY_LABELS[country] ?? country
}

function extractNames(text: string): string[] {
  return text.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)\b/g) ?? []
}

function normalizeEntity(name: string) {
  if (ENTITY_STOPWORDS.some(stop => name.includes(stop))) return null
  for (const [canonical, variants] of Object.entries(ENTITY_ALIASES)) {
    if (variants.includes(name)) return canonical
  }
  return name
}

function getEventTimestamp(e: Event): number | null {
  const date = [
    (e as any).published_at,
    (e as any).publishedAt,
    (e as any).created_at,
    (e as any).createdAt,
    (e as any).date,
    (e as any).published,
    (e as any).timestamp,
  ].find(Boolean)

  if (!date) return null
  const ts = new Date(date).getTime()
  return Number.isNaN(ts) ? null : ts
}

/* ===================== COMPONENT ===================== */

export default function LegendInsights({ events }: Props) {
  const now = Date.now()

  /* ===================== TIME WINDOW ===================== */

  const recentEvents =
    events.filter(e => {
      const ts = getEventTimestamp(e)
      return ts && (now - ts) / 36e5 <= HOURS_WINDOW
    }) || events

  /* ===================== ENTITIES ===================== */

  const nameCount: Record<string, number> = {}

  recentEvents.forEach(e => {
    extractNames(`${e.title} ${e.summary}`).forEach(raw => {
      const name = normalizeEntity(raw)
      if (!name) return
      nameCount[name] = (nameCount[name] ?? 0) + 1
    })
  })

  const sortedEntities = Object.entries(nameCount).sort((a, b) => b[1] - a[1])
  const keyFigure = sortedEntities[0]
  const trendingEntities = sortedEntities.slice(0, 3)

  /* ===================== COUNTRIES ===================== */

  const countryCount: Record<string, number> = {}

  recentEvents.forEach(e => {
    if (!e.country || e.country === "Unknown" || e.country === "Global") return
    countryCount[e.country] = (countryCount[e.country] ?? 0) + 1
  })

  const topCountry = Object.entries(countryCount).sort((a, b) => b[1] - a[1])[0]

  /* ===================== CATEGORIES ===================== */

  const categoryCount: Record<CategoryKey, number> = {
    conflict: 0,
    disaster: 0,
    politics: 0,
    health: 0,
  }

  recentEvents.forEach(e => categoryCount[e.category]++)

  const [topCategory, topCount] = Object.entries(categoryCount).sort(
    (a, b) => b[1] - a[1]
  )[0] as [CategoryKey, number]

  const dominantRatio = topCount / recentEvents.length
  const hasDominantCategory = dominantRatio >= DOMINANCE_THRESHOLD

  /* ===================== ACTIVITY ===================== */

  const eventsPerDay = recentEvents.length / (HOURS_WINDOW / 24)

  const activityLevel =
    eventsPerDay >= 15 ? "High" : eventsPerDay >= 7 ? "Medium" : "Low"

  /* ===================== WHAT CHANGED ===================== */

  const snapshot = {
    total: recentEvents.length,
    conflicts: recentEvents.filter(e => e.category === "conflict").length,
    activityLevel,
    countries: Object.keys(countryCount),
  }

  let previous: typeof snapshot | null = null

  if (typeof window !== "undefined") {
    try {
      previous = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")
    } catch {}
  }

  const changes: string[] = []

  if (previous) {
    const diff = snapshot.total - previous.total
    if (diff !== 0) changes.push(`${diff > 0 ? "+" : ""}${diff} events`)

    const diffConflict = snapshot.conflicts - previous.conflicts
    if (diffConflict > 0) changes.push(`+${diffConflict} conflicts`)

    if (snapshot.activityLevel !== previous.activityLevel) {
      changes.push(`Activity ${snapshot.activityLevel.toLowerCase()}`)
    }

    snapshot.countries.forEach(c => {
      if (!previous!.countries.includes(c)) {
        changes.push(`New country: ${formatCountry(c)}`)
      }
    })
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  }

  /* ===================== SOURCES ===================== */

  const sourceCount: Record<string, number> = {}
  recentEvents.forEach(e => {
    if (e.source) sourceCount[e.source] = (sourceCount[e.source] ?? 0) + 1
  })

  const dominantSource = Object.entries(sourceCount).sort((a, b) => b[1] - a[1])[0]
  const dominantSourceRatio = dominantSource
    ? dominantSource[1] / recentEvents.length
    : 0

  /* ===================== RENDER ===================== */

  return (
    <aside className="mt-1 space-y-1.5 text-xs text-gray-200">

      {/* WHAT CHANGED */}
      {changes.length > 0 && (
        <>
          <div>
            <div className="uppercase tracking-wide text-gray-400 mb-0.5">
              What changed
            </div>
            <ul className="space-y-0.5 text-gray-300">
              {changes.slice(0, MAX_CHANGES).map((c, i) => (
                <li key={i}>• {c}</li>
              ))}
            </ul>
          </div>
          <div className="border-t border-gray-800" />
        </>
      )}

      {/* KEY FIGURE */}
      <div>
        <div className="uppercase tracking-wide text-gray-400 mb-0.5">
          Key Figure (72h)
        </div>
        {keyFigure ? (
          <>
            <div className="font-medium">{keyFigure[0]}</div>
            <div className="text-gray-500">{keyFigure[1]} mentions</div>
          </>
        ) : (
          <div className="text-gray-500">No data</div>
        )}
      </div>

      <div className="border-t border-gray-800" />

      {/* TRENDING */}
      <div>
        <div className="uppercase tracking-wide text-gray-400 mb-0.5">
          Trending
        </div>
        {trendingEntities.map(([n, c]) => (
          <div key={n} className="flex justify-between">
            <span className="truncate">{n}</span>
            <span className="text-gray-500">{c}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-800" />

      {/* TOP COUNTRY */}
      <div>
        <div className="uppercase tracking-wide text-gray-400 mb-0.5">
          Top country
        </div>
        {topCountry ? (
          <>
            <div className="font-medium">{formatCountry(topCountry[0])}</div>
            <div className="text-gray-500">{topCountry[1]} events</div>
          </>
        ) : (
          <div className="text-gray-500">Multi-country</div>
        )}
      </div>

      <div className="border-t border-gray-800" />

      {/* DOMINANT TOPIC */}
      <div>
        <div className="uppercase tracking-wide text-gray-400 mb-0.5">
          Dominant topic
        </div>
        {hasDominantCategory ? (
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: categoryColors[topCategory].color }}
            />
            <span>{categoryColors[topCategory].label}</span>
            <span className="text-gray-500">
              {Math.round(dominantRatio * 100)}%
            </span>
          </div>
        ) : (
          <div className="text-gray-500">None</div>
        )}
      </div>

      <div className="border-t border-gray-800" />

      {/* ACTIVITY */}
      <div>
        <div className="uppercase tracking-wide text-gray-400 mb-0.5">
          Activity
        </div>
        <div className={`font-medium ${
          activityLevel === "High"
            ? "text-red-400"
            : activityLevel === "Medium"
            ? "text-yellow-400"
            : "text-green-400"
        }`}>
          {activityLevel}
        </div>
        <div className="text-gray-500">
          ≈ {eventsPerDay.toFixed(1)} / day
        </div>
      </div>

      <div className="border-t border-gray-800" />

      {/* SOURCE */}
      <div>
        <div className="uppercase tracking-wide text-gray-400 mb-0.5">
          Dominant source
        </div>
        {dominantSource ? (
          <>
            <div className="font-medium">{dominantSource[0]}</div>
            <div className="text-gray-500">
              {Math.round(dominantSourceRatio * 100)}%
            </div>
          </>
        ) : (
          <div className="text-gray-500">No data</div>
        )}
      </div>
    </aside>
  )
}

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

function extractNames(text: string): string[] {
    const matches = text.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)\b/g)
    return matches ?? []
}

function normalizeEntity(name: string) {
    for (const stop of ENTITY_STOPWORDS) {
        if (name.includes(stop)) return null
    }

    for (const [canonical, variants] of Object.entries(ENTITY_ALIASES)) {
        if (variants.includes(name)) return canonical
    }
    return name
}

function getEventTimestamp(e: Event): number | null {
    const possibleDates = [
        (e as any).published_at,
        (e as any).publishedAt,
        (e as any).created_at,
        (e as any).createdAt,
        (e as any).date,
        (e as any).published,
        (e as any).timestamp,
    ]

    const date = possibleDates.find(Boolean)
    if (!date) return null

    const ts = new Date(date).getTime()
    return Number.isNaN(ts) ? null : ts
}

/* ===================== COMPONENT ===================== */

export default function LegendInsights({ events }: Props) {
    const now = Date.now()

    /* ===================== TIME WINDOW ===================== */

    const recentEventsRaw = events.filter(e => {
        const ts = getEventTimestamp(e)
        if (!ts) return false
        return (now - ts) / 36e5 <= HOURS_WINDOW
    })

    const recentEvents =
        recentEventsRaw.length > 0 ? recentEventsRaw : events

    /* ===================== ENTITIES ===================== */

    const nameCount: Record<string, number> = {}

    recentEvents.forEach(e => {
        const text = `${e.title} ${e.summary}`
        extractNames(text).forEach(raw => {
            const name = normalizeEntity(raw)
            if (!name) return
            nameCount[name] = (nameCount[name] ?? 0) + 1
        })
    })

    const sortedEntities = Object.entries(nameCount).sort(
        (a, b) => b[1] - a[1]
    )

    const keyFigure = sortedEntities[0]
    const trendingEntities = sortedEntities.slice(0, 5)

    /* ===================== COUNTRIES ===================== */

    const countryCount: Record<string, number> = {}

    recentEvents.forEach(e => {
        if (!e.country || e.country === "Unknown" || e.country === "Global")
            return
        countryCount[e.country] = (countryCount[e.country] ?? 0) + 1
    })

    const topCountry = Object.entries(countryCount).sort(
        (a, b) => b[1] - a[1]
    )[0]

    /* ===================== CATEGORIES ===================== */

    const categoryCount: Record<CategoryKey, number> = {
        conflict: 0,
        disaster: 0,
        politics: 0,
        health: 0,
    }

    recentEvents.forEach(e => {
        categoryCount[e.category]++
    })

    const [topCategory, topCount] = (
        Object.entries(categoryCount) as [CategoryKey, number][]
    ).sort((a, b) => b[1] - a[1])[0]

    const dominantRatio =
        recentEvents.length > 0 ? topCount / recentEvents.length : 0

    const hasDominantCategory =
        dominantRatio >= DOMINANCE_THRESHOLD

    /* ===================== ACTIVITY ===================== */

    const eventsPerDay = recentEvents.length / (HOURS_WINDOW / 24)

    const activityLevel =
        eventsPerDay >= 15
            ? "High"
            : eventsPerDay >= 7
                ? "Medium"
                : "Low"

    /* ===================== WHAT CHANGED ===================== */

    const snapshot = {
        totalEvents: recentEvents.length,
        conflictEvents: recentEvents.filter(
            e => e.category === "conflict"
        ).length,
        activityLevel,
        topCountries: Object.keys(countryCount).slice(0, 3),
        dominantCategory: hasDominantCategory
            ? categoryColors[topCategory].label
            : null,
        timestamp: Date.now(),
    }

    let previousSnapshot: typeof snapshot | null = null
    if (typeof window !== "undefined") {
        try {
            previousSnapshot = JSON.parse(
                localStorage.getItem(STORAGE_KEY) || "null"
            )
        } catch {
            previousSnapshot = null
        }
    }

    const changes: string[] = []

    if (previousSnapshot) {
        const diffEvents =
            snapshot.totalEvents - previousSnapshot.totalEvents

        if (diffEvents !== 0) {
            changes.push(
                `${diffEvents > 0 ? "+" : ""}${diffEvents} events`
            )
        }

        const diffConflict =
            snapshot.conflictEvents -
            previousSnapshot.conflictEvents

        if (diffConflict > 0) {
            changes.push(`+${diffConflict} conflict events`)
        }

        if (
            snapshot.activityLevel !==
            previousSnapshot.activityLevel
        ) {
            changes.push(
                `Activity level ${snapshot.activityLevel === "High"
                    ? "increased"
                    : "decreased"
                }`
            )
        }

        snapshot.topCountries.forEach(c => {
            if (!previousSnapshot!.topCountries.includes(c)) {
                changes.push(`New country: ${c}`)
            }
        })
    }

    if (typeof window !== "undefined") {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(snapshot)
        )
    }

    /* ===================== SOURCES ===================== */

    const sourceCount: Record<string, number> = {}

    recentEvents.forEach(e => {
        if (!e.source) return
        sourceCount[e.source] = (sourceCount[e.source] ?? 0) + 1
    })

    const sortedSources = Object.entries(sourceCount).sort(
        (a, b) => b[1] - a[1]
    )

    const dominantSource = sortedSources[0]

    const dominantSourceRatio =
        dominantSource && recentEvents.length > 0
            ? dominantSource[1] / recentEvents.length
            : 0

    /* ===================== RENDER ===================== */

    return (
        <aside className="mt-1 space-y-2 text-xs text-gray-200">
            {/* WHAT CHANGED */}
            {changes.length > 0 && (
                <>
                    <div className="space-y-1">
                        <div className="uppercase tracking-wide text-gray-400">
                            What changed
                        </div>
                        <ul className="space-y-0.5 text-gray-300">
                            {changes.map((c, i) => (
                                <li key={i}>• {c}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="border-t border-gray-800" />
                </>
            )}

            {/* KEY FIGURE */}
            <div>
                <div className="uppercase tracking-wide text-gray-400 mb-1 inline-flex items-center">
                    <span>Key Figure</span>
                    <span className="ml-1 text-[10px] text-gray-500">
                        (last {HOURS_WINDOW}h)
                    </span>
                </div>
                {keyFigure ? (
                    <>
                        <div className="font-medium">{keyFigure[0]}</div>
                        <div className="text-gray-400">
                            {keyFigure[1]} mentions
                        </div>
                    </>
                ) : (
                    <div className="text-gray-500">No data</div>
                )}
            </div>

            <div className="border-t border-gray-800" />

            {/* TRENDING ENTITIES */}
            <div>
                <div className="uppercase tracking-wide text-gray-400 mb-1 inline-flex items-center">
                    <span>Trending Entities</span>
                    <span className="ml-1 text-[10px] text-gray-500">
                        (last {HOURS_WINDOW}h)
                    </span>
                </div>
                {trendingEntities.length > 0 ? (
                    <ul className="space-y-1">
                        {trendingEntities.map(([name, count]) => (
                            <li key={name} className="flex justify-between">
                                <span className="truncate">{name}</span>
                                <span className="text-gray-500">{count}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-gray-500">No data</div>
                )}
            </div>

            <div className="border-t border-gray-800" />

            {/* TOP COUNTRY */}
            <div>
                <div className="uppercase tracking-wide text-gray-400 mb-1 inline-flex items-center">
                    <span>Top Country</span>
                    <span className="ml-1 text-[10px] text-gray-500">
                        (last {HOURS_WINDOW}h)
                    </span>
                </div>
                {topCountry ? (
                    <>
                        <div className="font-medium">{topCountry[0]}</div>
                        <div className="text-gray-400">
                            {topCountry[1]} events
                        </div>
                    </>
                ) : (
                    <div className="text-gray-500">Multi-country</div>
                )}
            </div>

            <div className="border-t border-gray-800" />

            {/* DOMINANT CATEGORY */}
            <div>
                <div className="uppercase tracking-wide text-gray-400 mb-1 inline-flex items-center">
                    <span>Dominant Topic</span>
                    <span className="ml-1 text-[10px] text-gray-500">
                        (last {HOURS_WINDOW}h)
                    </span>
                </div>
                {hasDominantCategory ? (
                    <div className="flex items-center gap-2">
                        <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                                backgroundColor:
                                    categoryColors[topCategory].color,
                            }}
                        />
                        <span className="font-medium">
                            {categoryColors[topCategory].label}
                        </span>
                        <span className="text-gray-500">
                            ({Math.round(dominantRatio * 100)}%)
                        </span>
                    </div>
                ) : (
                    <div className="text-gray-500">
                        No dominant topic
                    </div>
                )}
            </div>

            <div className="border-t border-gray-800" />

            {/* ACTIVITY LEVEL */}
            <div>
                <div className="uppercase tracking-wide text-gray-400 mb-1 inline-flex items-center">
                    <span>Activity Level</span>
                    <span className="ml-1 text-[10px] text-gray-500">
                        (last {HOURS_WINDOW}h)
                    </span>
                </div>
                <div
                    className={`font-medium ${activityLevel === "High"
                        ? "text-red-400"
                        : activityLevel === "Medium"
                            ? "text-yellow-400"
                            : "text-green-400"
                        }`}
                >
                    {activityLevel}
                </div>
                <div className="text-gray-500">
                    ≈ {eventsPerDay.toFixed(1)} events / day
                </div>
            </div>
            <div className="border-t border-gray-800" />
            {/* DOMINANT SOURCE */}
            <div>
                <div className="uppercase tracking-wide text-gray-400 mb-1 inline-flex items-center">
                    <span>Dominant Source</span>
                    <span className="ml-1 text-[10px] text-gray-500">
                        (last {HOURS_WINDOW}h)
                    </span>
                </div>

                {dominantSource ? (
                    <>
                        <div className="font-medium">{dominantSource[0]}</div>
                        <div className="text-gray-500">
                            {Math.round(dominantSourceRatio * 100)}% of events
                        </div>
                    </>
                ) : (
                    <div className="text-gray-500">No data</div>
                )}
            </div>

        </aside>
    )
}

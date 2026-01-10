import { Event } from "@/lib/types"

/* ===================== CONFIG ===================== */

const HOURS_NEW = 24
const HOURS_BASELINE = 72

const MIN_EVENTS_ESCALATION = 3
const ESCALATION_FACTOR = 1.5

type Preset = "all" | "conflicts" | "strategic"

/* ===================== COUNTRY ACRONYMS ===================== */

const COUNTRY_ACRONYMS: Record<string, string> = {
    "United States": "USA",
    "United States of America": "USA",
    "United Kingdom": "UK",
    "Russian Federation": "RUS",
    "South Korea": "ROK",
    "North Korea": "DPRK",
    "European Union": "EU",
    "United Arab Emirates": "UAE",
}

/* ===================== HELPERS ===================== */

function formatRegion(region: string) {
    return COUNTRY_ACRONYMS[region] ?? region
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

function hoursAgo(ts: number) {
    return (Date.now() - ts) / 36e5
}

function confidenceLabel(score: number) {
    if (score >= 0.8) return "High"
    if (score >= 0.5) return "Medium"
    return "Low"
}

/* ===================== TYPES ===================== */

type Signal = {
    key: string            // full country name (used internally)
    label: string          // formatted label (UI)
    category: string
    delta?: number
    trend: "up" | "new"
    confidence: number
}

/* ===================== COMPONENT ===================== */

export default function NewAndEscalatingPanel({
    events,
    preset,
    onSelectRegion,
}: {
    events: Event[]
    preset: Preset
    onSelectRegion?: (region: string) => void
}) {
    /* ===================== PRESET FILTER ===================== */

    const filteredEvents = events.filter(e => {
        if (preset === "conflicts") return e.category === "conflict"
        if (preset === "strategic")
            return e.category === "conflict" || e.category === "politics"
        return true
    })

    /* ===================== GROUP EVENTS ===================== */

    const grouped: Record<
        string,
        { recent: number; baseline: number; category: string }
    > = {}

    filteredEvents.forEach(e => {
        const ts = getEventTimestamp(e)
        if (!ts) return

        const h = hoursAgo(ts)
        if (h > HOURS_BASELINE) return

        const key =
            e.country && e.country !== "Unknown" ? e.country : "Global"

        if (!grouped[key]) {
            grouped[key] = {
                recent: 0,
                baseline: 0,
                category: e.category,
            }
        }

        if (h <= HOURS_NEW) grouped[key].recent++
        else grouped[key].baseline++
    })

    /* ===================== DETECT SIGNALS ===================== */

    const escalating: Signal[] = []
    const newlyActive: Signal[] = []

    Object.entries(grouped).forEach(([key, data]) => {
        const { recent, baseline, category } = data
        const regionLabel = formatRegion(key)

        // NEW
        if (recent > 0 && baseline === 0) {
            newlyActive.push({
                key,
                label: `${regionLabel} — ${category}`,
                category,
                trend: "new",
                confidence: 1,
            })
            return
        }

        // ESCALATING
        if (
            recent >= MIN_EVENTS_ESCALATION &&
            baseline > 0 &&
            recent >= baseline * ESCALATION_FACTOR
        ) {
            const confidence = Math.min(1, recent / baseline)

            escalating.push({
                key,
                label: `${regionLabel} — ${category}`,
                category,
                delta: recent - baseline,
                trend: "up",
                confidence,
            })
        }
    })

    const escalatingSorted = escalating
        .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
        .slice(0, 4)

    const newSorted = newlyActive.slice(0, 4)

    const hasEscalation = escalatingSorted.length > 0

    /* ===================== RENDER ===================== */

    return (
        <section className="space-y-2 flex flex-col text-xs text-gray-200">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-2">
                <div className="uppercase tracking-wide text-gray-400">
                    New & Escalating
                    <span className="ml-1 text-[10px] text-gray-500">
                        ({preset.toUpperCase()})
                    </span>
                </div>
                <div className="text-[10px] text-gray-500">
                    Last {HOURS_BASELINE}h
                </div>
            </div>

            {/* STATUS */}
            <div
                className={`mb-3 rounded border px-2 py-1.5 text-[11px]
          ${hasEscalation
                        ? "border-red-900/40 bg-red-950/30 text-red-400"
                        : "border-green-900/40 bg-green-950/20 text-green-400"
                    }`}
            >
                {hasEscalation
                    ? "Escalating activity detected"
                    : "System stable · No escalation patterns"}
            </div>

            {/* CONTENT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0">

                {/* ESCALATING */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] text-red-400 uppercase">
                            Escalating
                        </span>
                        <span className="text-[10px] text-gray-500">
                            {escalatingSorted.length}
                        </span>
                    </div>

                    {escalatingSorted.length > 0 ? (
                        <ul className="space-y-1">
                            {escalatingSorted.map(item => (
                                <li
                                    key={item.key}
                                    onClick={() => onSelectRegion?.(item.key)}
                                    className="flex justify-between gap-2 cursor-pointer hover:text-white"
                                >
                                    <span className="truncate">
                                        <span className="mr-1 text-red-400">▲</span>
                                        {item.label}
                                    </span>
                                    <span className="text-right">
                                        <div className="text-red-300">+{item.delta}</div>
                                        <div className="text-[10px] text-gray-500">
                                            {confidenceLabel(item.confidence)}
                                        </div>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-gray-500 italic text-[11px]">
                            No regions exceeding baseline
                        </div>
                    )}
                </div>

                {/* NEW */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] text-amber-400 uppercase">
                            New
                        </span>
                        <span className="text-[10px] text-gray-500">
                            {newSorted.length}
                        </span>
                    </div>

                    {newSorted.length > 0 ? (
                        <ul className="space-y-1">
                            {newSorted.map(item => (
                                <li
                                    key={item.key}
                                    onClick={() => onSelectRegion?.(item.key)}
                                    className="cursor-pointer hover:text-white truncate"
                                >
                                    <span className="mr-1 text-amber-400">●</span>
                                    {item.label}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-gray-500 italic text-[11px]">
                            No new regions detected
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER */}
            <div className="mt-3 pt-2 border-t border-gray-800 text-[10px] text-gray-600">
                Monitoring {filteredEvents.length} events · auto-updating
            </div>
        </section>
    )
}

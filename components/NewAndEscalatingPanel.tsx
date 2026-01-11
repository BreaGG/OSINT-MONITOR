import { Event } from "@/lib/types"

/* ===================== CONFIG ===================== */

const HOURS_RECENT = 24
const HOURS_BASELINE = 72

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

function getTimestamp(e: Event): number | null {
    const date =
        (e as any).published_at ||
        (e as any).publishedAt ||
        (e as any).created_at ||
        (e as any).createdAt ||
        e.date ||
        e.timestamp

    if (!date) return null
    const ts = new Date(date).getTime()
    return Number.isNaN(ts) ? null : ts
}

function hoursAgo(ts: number) {
    return (Date.now() - ts) / 36e5
}

/* ===================== TYPES ===================== */

type FocusSignal = {
    region: string
    category: string
    recent: number
    reason: string
}

type NewSignal = {
    region: string
    category: string
    reason: string
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
        const ts = getTimestamp(e)
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

        if (h <= HOURS_RECENT) grouped[key].recent++
        else grouped[key].baseline++
    })

    /* ===================== BUILD FOCUS & NEW ===================== */

    const focus: FocusSignal[] = []
    const newlyActive: NewSignal[] = []

    Object.entries(grouped).forEach(([key, data]) => {
        const { recent, baseline, category } = data
        const regionLabel = formatRegion(key)

        // FOCUS & PRIORITY → where attention should go NOW
        if (
            recent >= 3 &&
            (category === "conflict" || category === "politics") &&
            key !== "Global"
        ) {
            focus.push({
                region: regionLabel,
                category,
                recent,
                reason: `${recent} relevant events in last 24h`,
            })
        }

        // NEW ACTIVITY → first appearance in window
        if (recent > 0 && baseline === 0 && key !== "Global") {
            newlyActive.push({
                region: regionLabel,
                category,
                reason: "First activity in last 72h",
            })
        }
    })

    const focusSorted = focus
        .sort((a, b) => b.recent - a.recent)
        .slice(0, 4)

    const newSorted = newlyActive.slice(0, 4)

    /* ===================== RENDER ===================== */

    return (
        <section className="flex flex-col space-y-2 text-xs text-gray-200">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div className="uppercase tracking-wide text-gray-400">
                    Focus & Signals
                    <span className="ml-1 text-[10px] text-gray-500">
                        [{preset.toUpperCase()}]
                    </span>
                </div>
                <div className="text-[10px] text-gray-500">
                    Decision support
                </div>
            </div>

            {/* TWO COLUMNS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">

                {/* LEFT — FOCUS & PRIORITY */}
                <div>
                    <div className="text-[11px] uppercase text-red-400 mb-1">
                        Focus & priority
                    </div>

                    {focusSorted.length > 0 ? (
                        <ul className="space-y-1">
                            {focusSorted.map(item => (
                                <li
                                    key={item.region}
                                    onClick={() => onSelectRegion?.(item.region)}
                                    className="cursor-pointer hover:text-white"
                                >
                                    {/* LINE 1 — REGION */}
                                    <div className="flex items-center gap-1 leading-tight">
                                        <span className="text-red-400">●</span>
                                        <span className="font-medium uppercase tracking-wide">
                                            {item.region}
                                        </span>
                                    </div>

                                    {/* LINE 2 — FIXED HEIGHT CONTEXT */}
                                    <div className="
    ml-4 text-[10px] text-gray-500
    truncate whitespace-nowrap overflow-hidden
  ">
                                        {item.category} · {item.recent} events · 24h
                                    </div>
                                </li>

                            ))}
                        </ul>
                    ) : (
                        <div className="text-[11px] text-gray-500 italic">
                            No immediate priority regions
                        </div>
                    )}
                </div>

                {/* RIGHT — NEW ACTIVITY */}
                <div>
                    <div className="text-[11px] uppercase text-amber-400 mb-1">
                        Newly active
                    </div>

                    {newSorted.length > 0 ? (
                        <ul className="space-y-1">
                            {newSorted.map(item => (
                                <li
                                    key={item.region}
                                    onClick={() => onSelectRegion?.(item.region)}
                                    className="cursor-pointer hover:text-white"
                                >
                                    {/* LINE 1 — REGION */}
                                    <div className="flex items-center gap-1 leading-tight">
                                        <span className="text-amber-400">●</span>
                                        <span className="font-medium uppercase tracking-wide">
                                            {item.region}
                                        </span>
                                    </div>

                                    {/* LINE 2 — FIXED HEIGHT CONTEXT */}
                                    <div className="
    ml-4 text-[10px] text-gray-500
    truncate whitespace-nowrap overflow-hidden
  ">
                                        {item.category} · first activity · 72h
                                    </div>
                                </li>

                            ))}
                        </ul>
                    ) : (
                        <div className="text-[11px] text-gray-500 italic">
                            No new regions detected
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER */}
            <div className="pt-2 border-t border-gray-800 text-[10px] text-gray-600">
                {/* Monitoring {filteredEvents.length} events · last {HOURS_BASELINE}h */}
            </div>
        </section>
    )
}

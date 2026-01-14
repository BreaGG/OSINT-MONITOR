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
    hideTitle = false,
}: {
    events: Event[]
    preset: Preset
    onSelectRegion?: (region: string) => void
    hideTitle?: boolean
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
        .slice(0, 3)

    const newSorted = newlyActive.slice(0, 3)

    /* ===================== RENDER ===================== */

    return (
        <section className="h-full flex flex-col text-[10px]">

            {/* HEADER NATO-STYLE */}
            {!hideTitle && (
                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-gray-500">
                            Priority Signals
                        </span>
                    </div>
                    <div className="px-1.5 py-0.5 bg-gray-900 border border-gray-800 rounded">
                        <span className="text-[8px] text-gray-600 uppercase tracking-wider font-bold">
                            {preset}
                        </span>
                    </div>
                </div>
            )}

            {/* TWO COLUMNS */}
            <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">

                {/* LEFT — FOCUS & PRIORITY */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-1 h-1 bg-red-500 rounded-full" />
                        <span className="text-[8px] uppercase tracking-[0.15em] font-bold text-red-400">
                            Priority AO
                        </span>
                    </div>

                    {focusSorted.length > 0 ? (
                        <ul className="space-y-1.5">
                            {focusSorted.map(item => (
                                <li
                                    key={item.region}
                                    onClick={() => onSelectRegion?.(item.region)}
                                    className="cursor-pointer group"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-red-500 text-[8px]">●</span>
                                        <span className="font-bold uppercase tracking-wider text-gray-300 group-hover:text-white transition">
                                            {item.region}
                                        </span>
                                    </div>
                                    <div className="ml-3 text-[9px] text-gray-600 truncate">
                                        {item.category} • {item.recent} • 24H
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-[9px] text-gray-700 italic">
                            No priority regions
                        </div>
                    )}
                </div>

                {/* RIGHT — NEW ACTIVITY */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-1 h-1 bg-amber-500 rounded-full" />
                        <span className="text-[8px] uppercase tracking-[0.15em] font-bold text-amber-400">
                            New Activity
                        </span>
                    </div>

                    {newSorted.length > 0 ? (
                        <ul className="space-y-1.5">
                            {newSorted.map(item => (
                                <li
                                    key={item.region}
                                    onClick={() => onSelectRegion?.(item.region)}
                                    className="cursor-pointer group"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-amber-500 text-[8px]">●</span>
                                        <span className="font-bold uppercase tracking-wider text-gray-300 group-hover:text-white transition">
                                            {item.region}
                                        </span>
                                    </div>
                                    <div className="ml-3 text-[9px] text-gray-600 truncate">
                                        {item.category} • NEW • 72H
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-[9px] text-gray-700 italic">
                            No new regions
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER */}
            <div className="mt-2 pt-1.5 border-t border-gray-800 flex items-center justify-between">
                <span className="text-[8px] text-gray-700 uppercase tracking-wider">
                    Decision Support
                </span>
                <span className="text-[8px] text-gray-800 font-mono">
                    {filteredEvents.length} EVT
                </span>
            </div>
        </section>
    )
}
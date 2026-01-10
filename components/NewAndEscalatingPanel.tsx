import { Event } from "@/lib/types"

/* ===================== CONFIG ===================== */

const HOURS_NEW = 24
const HOURS_BASELINE = 72

const MIN_EVENTS_ESCALATION = 3
const ESCALATION_FACTOR = 1.5

type Preset = "all" | "conflicts" | "strategic"

/* ===================== HELPERS ===================== */

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

function hoursAgo(ts: number) {
    return (Date.now() - ts) / 36e5
}

/* ===================== TYPES ===================== */

type Signal = {
    key: string
    label: string
    category: string
    delta?: number
}

/* ===================== COMPONENT ===================== */

export default function NewAndEscalatingPanel({
    events,
    preset,
}: {
    events: Event[]
    preset: Preset
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

        // NEW
        if (recent > 0 && baseline === 0) {
            newlyActive.push({
                key,
                label:
                    key === "Global"
                        ? `Global signals — ${category}`
                        : `${key} — ${category}`,
                category,
            })
            return
        }

        // ESCALATING
        if (
            recent >= MIN_EVENTS_ESCALATION &&
            baseline > 0 &&
            recent >= baseline * ESCALATION_FACTOR
        ) {
            escalating.push({
                key,
                label: `${key} — ${category}`,
                category,
                delta: recent - baseline,
            })
        }
    })

    /* ===================== SORT & LIMIT ===================== */

    const escalatingSorted = escalating
        .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
        .slice(0, 4)

    const newSorted = newlyActive.slice(0, 4)

    /* ===================== RENDER ===================== */

    return (
        <section className="h-full flex flex-col text-xs text-gray-200">
            {/* HEADER */}
            <div className="flex justify-between items-baseline mb-2">
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

            {/* SYSTEM STATUS */}
            <div className="mb-3 rounded border border-gray-800 bg-black/40 px-2 py-1.5">
                <div className="text-[11px] text-gray-400">
                    System status
                </div>
                {escalatingSorted.length > 0 ? (
                    <div className="text-[11px] text-red-400">
                        Active escalation detected
                    </div>
                ) : (
                    <div className="text-[11px] text-green-400">
                        No critical escalations detected
                    </div>
                )}
            </div>

            {/* ESCALATING */}
            <div className="mb-3">
                <div className="text-[11px] text-red-400 mb-1">
                    Escalating
                </div>

                {escalatingSorted.length > 0 ? (
                    <ul className="space-y-1">
                        {escalatingSorted.map(item => (
                            <li
                                key={item.key}
                                className="flex justify-between gap-2"
                            >
                                <span className="truncate">
                                    {item.label}
                                </span>
                                <span className="text-gray-400">
                                    +{item.delta}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-gray-500 text-[11px] italic">
                        Activity within baseline thresholds
                    </div>
                )}
            </div>

            {/* NEW */}
            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] text-amber-400">
                        New activity
                    </span>
                    <span className="text-[10px] text-gray-500">
                        {newSorted.length} region
                        {newSorted.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {newSorted.length > 0 ? (
                    <ul className="space-y-1">
                        {newSorted.map(item => (
                            <li key={item.key} className="truncate">
                                {item.label}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-gray-500 text-[11px] italic">
                        No new activity detected
                    </div>
                )}
            </div>

            {/* FOOTER / BASELINE */}
            <div className="mt-auto pt-2 border-t border-gray-800 text-[10px] text-gray-600">
                Monitoring {filteredEvents.length} events · auto-updated
            </div>
        </section>
    )
}

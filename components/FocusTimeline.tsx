import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"

/* ===================== CONFIG ===================== */

const BUCKETS = [
    { label: "6H", hours: 6 },
    { label: "12H", hours: 12 },
    { label: "24H", hours: 24 },
]

const MAX_ITEMS = 4

/* ===================== HELPERS ===================== */

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

function shortRegion(name?: string) {
    if (!name || name === "Unknown") return "Global"
    if (name === "United States") return "USA"
    if (name === "United Kingdom") return "UK"
    if (name === "Russian Federation") return "RUS"
    if (name === "South Korea") return "ROK"
    if (name === "North Korea") return "DPRK"
    return name
}

/* ===================== COMPONENT ===================== */

export default function FocusTimeline({
    events,
    onSelectRegion,
    hideTitle = false,
}: {
    events: Event[]
    onSelectRegion?: (region: string) => void
    hideTitle?: boolean
}) {
    const now = Date.now()

    const buckets = BUCKETS.map(b => {
        const filtered = events
            .map(e => {
                const ts = getEventTimestamp(e)
                if (!ts) return null
                const h = hoursAgo(ts)
                if (h > b.hours) return null
                return e
            })
            .filter(Boolean) as Event[]

        const grouped = new Map<string, Event>()

        for (const e of filtered) {
            const key = `${e.country}-${e.category}`
            if (!grouped.has(key)) grouped.set(key, e)
            if (grouped.size >= MAX_ITEMS) break
        }

        return {
            label: b.label,
            items: Array.from(grouped.values()),
        }
    })

    const hasContent = buckets.some(b => b.items.length > 0)

    return (
        <section className="h-full flex flex-col text-[10px]">

            {/* HEADER NATO-STYLE */}
            {!hideTitle && (
                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-800">
                    <div className="w-1 h-1 bg-cyan-500 rounded-full" />
                    <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-gray-500">
                        Activity Timeline
                    </span>
                </div>
            )}

            {!hasContent && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-2">
                        <div className="text-gray-800 text-2xl">━</div>
                        <div className="text-[9px] text-gray-700 italic">
                            No signals detected
                        </div>
                    </div>
                </div>
            )}

            {/* TIMELINE */}
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">

                {buckets.map(bucket =>
                    bucket.items.length > 0 ? (
                        <div key={bucket.label} className="flex gap-2">

                            {/* TIME AXIS */}
                            <div className="flex flex-col items-center pt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                                <div className="flex-1 w-px bg-gray-800 my-1" />
                            </div>

                            {/* CONTENT */}
                            <div className="flex-1 pb-2">
                                <div className="text-[8px] text-gray-600 uppercase tracking-wider font-bold mb-1.5">
                                    {bucket.label}
                                </div>

                                <ul className="space-y-1.5">
                                    {bucket.items.map(e => {
                                        const color =
                                            categoryColors[e.category]?.color ?? "#9ca3af"

                                        return (
                                            <li
                                                key={e.id}
                                                onClick={() =>
                                                    onSelectRegion?.(
                                                        e.country && e.country !== "Unknown"
                                                            ? e.country
                                                            : "Global"
                                                    )
                                                }
                                                className="cursor-pointer group"
                                            >
                                                <div className="flex items-start gap-1.5">
                                                    <span
                                                        className="mt-0.5 w-1 h-1 rounded-full shrink-0"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-gray-300 group-hover:text-white transition uppercase tracking-wide">
                                                                {shortRegion(e.country)}
                                                            </span>
                                                            <span className="text-gray-700">•</span>
                                                            <span className="text-gray-600 capitalize">
                                                                {e.category}
                                                            </span>
                                                        </div>
                                                        <div className="text-[9px] text-gray-700 truncate mt-0.5">
                                                            {e.title}
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        </div>
                    ) : null
                )}
            </div>

            {/* FOOTER */}
            <div className="mt-2 pt-1.5 border-t border-gray-800 flex items-center justify-between">
                <span className="text-[8px] text-gray-700 uppercase tracking-wider">
                    Recent Snapshot
                </span>
                <span className="text-[8px] text-gray-800 font-mono">
                    Click to focus
                </span>
            </div>
        </section>
    )
}
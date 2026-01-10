import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"

/* ===================== CONFIG ===================== */

const BUCKETS = [
    { label: "Last 6h", hours: 6 },
    { label: "Last 12h", hours: 12 },
    { label: "Last 24h", hours: 24 },
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
    return name
}

/* ===================== COMPONENT ===================== */

export default function FocusTimeline({
    events,
    onSelectRegion,
}: {
    events: Event[]
    onSelectRegion?: (region: string) => void
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
        <section className="h-full flex flex-col text-xs text-gray-200">

            {/* HEADER */}
            <div className="uppercase tracking-wide text-gray-400 mb-3">
                Focus timeline
            </div>

            {!hasContent && (
                <div className="text-gray-500 italic text-[11px]">
                    No recent signals detected
                </div>
            )}

            {/* TIMELINE */}
            <div className="space-y-4 flex-1">

                {buckets.map(bucket =>
                    bucket.items.length > 0 ? (
                        <div key={bucket.label} className="flex gap-3">

                            {/* TIME AXIS */}
                            <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-gray-600 mt-1" />
                                <div className="flex-1 w-px bg-gray-800 my-1" />
                            </div>

                            {/* CONTENT */}
                            <div className="flex-1">
                                <div className="text-[11px] text-gray-500 mb-1">
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
                                                <div className="flex items-start gap-2">
                                                    <span
                                                        className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                    <div className="leading-snug">
                                                        <span className="font-medium group-hover:text-white transition">
                                                            {shortRegion(e.country)}
                                                        </span>{" "}
                                                        <span className="text-gray-400">
                                                            — {e.category}
                                                        </span>
                                                        <div className="text-[10px] text-gray-500 truncate max-w-[260px]">
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
            <div className="mt-3 pt-2 border-t border-gray-800 text-[10px] text-gray-600">
                Recent activity snapshot · Click to focus
            </div>
        </section>
    )
}

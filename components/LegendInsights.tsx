import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"

type Props = {
    events: Event[]
}

type CategoryKey = keyof typeof categoryColors

function extractNames(text: string): string[] {
    const matches = text.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)\b/g)
    return matches ?? []
}

export default function LegendInsights({ events }: Props) {
    /* ===================== ENTITIES ===================== */

    const nameCount: Record<string, number> = {}

    events.forEach(e => {
        const text = `${e.title} ${e.summary}`
        extractNames(text).forEach(name => {
            nameCount[name] = (nameCount[name] ?? 0) + 1
        })
    })

    const sortedEntities = Object.entries(nameCount)
        .sort((a, b) => b[1] - a[1])

    const keyFigure = sortedEntities[0]
    const trendingEntities = sortedEntities.slice(0, 5)

    /* ===================== COUNTRIES ===================== */

    const countryCount: Record<string, number> = {}

    events.forEach(e => {
        if (!e.country || e.country === "Unknown") return
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

    events.forEach(e => {
        categoryCount[e.category]++
    })

    const dominantCategory = (
        Object.entries(categoryCount) as [CategoryKey, number][]
    ).sort((a, b) => b[1] - a[1])[0]

    /* ===================== ACTIVITY ===================== */

    const activityLevel =
        events.length > 30
            ? "High"
            : events.length > 15
                ? "Medium"
                : "Low"

    return (
        <aside className="mt-6 space-y-4 text-xs text-gray-200">
            {/* KEY FIGURE */}
            <div>
                <div className="uppercase tracking-wide text-gray-400 mb-1">
                    Key Figure
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

            <div className="border-t border-gray-800  " />

            {/* TRENDING ENTITIES */}
            <div>
                <div className="uppercase tracking-wide text-gray-400 mb-1">
                    Trending Entities
                </div>

                {trendingEntities.length > 0 ? (
                    <ul className="space-y-1">
                        {trendingEntities.map(([name, count]) => (
                            <li
                                key={name}
                                className="flex justify-between  gap-2"
                            >
                                <span className="truncate">{name}</span>
                                <span className="text-gray-500">
                                    {count}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-gray-500">No data</div>
                )}
            </div>

            <div className="border-t border-gray-800  " />

            {/* TOP COUNTRY */}
            <div>
                <div className="uppercase tracking-wide text-gray-400 mb-1">
                    Top Country
                </div>
                {topCountry ? (
                    <>
                        <div className="font-medium">{topCountry[0]}</div>
                        <div className="text-gray-400">
                            {topCountry[1]} events
                        </div>
                    </>
                ) : (
                    <div className="text-gray-500">No data</div>
                )}
            </div>

            <div className="border-t border-gray-800  " />

            {/* DOMINANT CATEGORY */}
            <div>
                <div className="uppercase tracking-wide text-gray-400 mb-1">
                    Dominant Topic
                </div>
                {dominantCategory ? (
                    <div className="flex items-center  gap-2">
                        <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                                backgroundColor:
                                    categoryColors[dominantCategory[0]].color,
                            }}
                        />
                        <span className="font-medium">
                            {categoryColors[dominantCategory[0]].label}
                        </span>
                    </div>
                ) : (
                    <div className="text-gray-500">No data</div>
                )}
            </div>

            <div className="border-t border-gray-800  " />

            {/* ACTIVITY LEVEL */}
            <div>
                <div className="uppercase tracking-wide text-gray-400 mb-1">
                    Activity Level
                </div>
                <div
                    className={`font-medium ${
                        activityLevel === "High"
                            ? "text-red-400"
                            : activityLevel === "Medium"
                                ? "text-yellow-400"
                                : "text-green-400"
                    }`}
                >
                    {activityLevel}
                </div>
            </div>
        </aside>
    )
}

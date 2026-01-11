type TimeWindow = "6h" | "24h" | "72h"

export function MapTimeControl({
    value,
    onChange,
}: {
    value: TimeWindow
    onChange: (v: TimeWindow) => void
}) {
    return (
        <div className="flex gap-1 text-xs">
            {(["6h", "24h", "72h"] as TimeWindow[]).map(v => (
                <button
                    key={v}
                    onClick={() => onChange(v)}
                    className={`px-2 py-1 rounded border ${value === v
                            ? "bg-black text-gray-200 border-gray-600"
                            : "bg-black/40 text-gray-500 border-gray-800 hover:text-gray-300"
                        }`}
                >
                    {v.toUpperCase()}
                </button>
            ))}
        </div>
    )
}

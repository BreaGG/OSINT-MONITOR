import { categoryColors } from "@/lib/categoryColors"

export default function MapLegend() {
  return (
    <div className="space-y-4 text-xs text-gray-200">
      {/* TITLE */}
      <div className="uppercase tracking-wide text-gray-400">
        Legend
      </div>

      {/* EVENT CATEGORIES */}
      <div className="space-y-2">
        {Object.entries(categoryColors).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-2"
          >
            <span>{value.label}</span>
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: value.color }}
            />
          </div>
        ))}
      </div>

      <div className="border-t border-gray-800" />

      {/* STRATEGIC & SPECIAL POINTS */}
      <div className="space-y-2">
        <div className="uppercase tracking-wide text-gray-400">
          Strategic Points
        </div>

        <div className="flex items-center justify-between">
          <span>Strategic capital</span>
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: "#7f1d1d" }} // steel blue
          />
        </div>

        <div className="flex items-center justify-between">
          <span>Chokepoint</span>
          <span
            className="w-2.5 h-2.5 rotate-45"
            style={{ backgroundColor: "#334155" }} // deep navy
          />
        </div>

        <div className="flex items-center justify-between">
          <span>Active conflict</span>
          <span
            className="px-2 py-0.5 rounded text-[10px] font-semibold"
            style={{
              backgroundColor: "#7f1d1d",
              color: "#fca5a5",
            }}
          >
            CONFLICT
          </span>
        </div>
      </div>

    </div>
  )
}

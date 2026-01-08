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

      {/* SPECIAL POINTS */}
      <div className="space-y-2">
        <div className="uppercase tracking-wide text-gray-400">
          Special Points
        </div>

        <div className="flex items-center justify-between">
          <span>Strategic capital</span>
          <span className="w-2.5 h-2.5 bg-red-600 rounded-sm" />
        </div>

        <div className="flex items-center justify-between">
          <span>Chokepoint</span>
          <span className="w-2.5 h-2.5 bg-blue-600 rotate-45" />
        </div>
      </div>
    </div>
  )
}

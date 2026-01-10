import { categoryColors } from "@/lib/categoryColors"

export default function MapLegend() {
  return (
    <div className="text-xs text-gray-200 space-y-1.5">

      {/* TITLE */}
      <div className="uppercase tracking-wide text-gray-400 text-[11px] mb-1">
        Legend
      </div>

      {/* EVENT CATEGORIES */}
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

      {/* STRATEGIC / SPECIAL — CONTINUATION */}
      <div className="flex items-center justify-between gap-2">
        <span>Strategic capital</span>
        <span
          className="w-2.5 h-2.5 rounded-sm"
          style={{ backgroundColor: "#365314" }}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span>Chokepoint</span>
        <span
          className="w-2.5 h-2.5 rotate-45"
          style={{ backgroundColor: "#334155" }}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span>Active conflict</span>
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide"
          style={{
            backgroundColor: "#7f1d1d",
            color: "#fecaca",
          }}
        >
          CONFLICT
        </span>
      </div>

      {/* FINAL BASELINE */}
      <div className="border-t border-gray-800 pt-1 mt-2" />
    </div>
  )
}

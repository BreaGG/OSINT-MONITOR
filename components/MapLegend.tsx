"use client"

import { usePathname } from "next/navigation"
import { categoryColors } from "@/lib/categoryColors"

export default function MapLegend() {
  const pathname = usePathname()
  const isFullscreenMap = pathname === "/map"

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
        <span>Military base</span>
        <span className="text-purple-400 text-sm leading-none">★</span>
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

      {/* TRAFFIC SECTION (solo en fullscreen) */}
      {isFullscreenMap && (
        <>
          <div className="border-t border-gray-800 pt-2 mt-2" />
          
          <div className="uppercase tracking-wide text-gray-400 text-[11px] mb-1">
            Live Traffic
          </div>

          {/* AIRCRAFT */}
          <div className="flex items-center justify-between gap-2">
            <span>Aircraft</span>
            <span className="text-yellow-400 text-[24px] text-base leading-none -mt-2">✈</span>
          </div>

          {/* VESSELS */}
          <div className="space-y-1 mt-1">
            <div className="flex items-center justify-between gap-2">
              <span>Commercial vessel</span>
              <div className="flex items-center gap-0.5">
                <span 
                  className="w-2 h-2 rounded-full border border-white"
                  style={{ backgroundColor: "#3b82f6" }}
                />
                <span className="text-blue-400 text-[10px] leading-none">▶</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Military vessel</span>
              <div className="flex items-center gap-0.5">
                <span 
                  className="w-2 h-2 rounded-full border border-white"
                  style={{ backgroundColor: "#dc2626" }}
                />
                <span className="text-red-600 text-[10px] leading-none">▶</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Cruise ship</span>
              <div className="flex items-center gap-0.5">
                <span 
                  className="w-2.5 h-2.5 rounded-full border border-white"
                  style={{ backgroundColor: "#8b5cf6" }}
                />
                <span className="text-purple-500 text-xs leading-none">▶</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* FINAL BASELINE */}
      <div className="border-t border-gray-800 pt-1 mt-2" />
    </div>
  )
}
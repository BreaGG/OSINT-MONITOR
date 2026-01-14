"use client"

import { usePathname } from "next/navigation"
import { categoryColors } from "@/lib/categoryColors"

export default function MapLegend() {
  const pathname = usePathname()
  const isFullscreenMap = pathname === "/map"

  return (
    <div className="text-[10px] space-y-2">

      {/* TITLE NATO-STYLE */}
      <div className="flex items-center gap-2 pb-1 border-b border-gray-800">
        <div className="w-1 h-1 bg-cyan-500 rounded-full" />
        <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-gray-500">
          Map Legend
        </span>
      </div>

      {/* EVENT CATEGORIES */}
      <div className="space-y-1">
        <div className="text-[8px] uppercase tracking-[0.15em] font-bold text-gray-600 mb-1">
          Event Categories
        </div>
        {Object.entries(categoryColors).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-2 group"
          >
            <span className="text-gray-400 group-hover:text-gray-300 transition">{value.label}</span>
            <div className="relative flex items-center justify-center w-4 h-4">
              {/* Halo */}
              <span
                className="absolute w-3 h-3 rounded-full opacity-40 group-hover:opacity-60 transition"
                style={{ backgroundColor: value.color }}
              />
              {/* Punto central */}
              <span
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: value.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* STRATEGIC MARKERS */}
      <div className="border-t border-gray-800 pt-2">
        <div className="text-[8px] uppercase tracking-[0.15em] font-bold text-gray-600 mb-1">
          Strategic Markers
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 group">
            <span className="text-gray-400 group-hover:text-gray-300 transition">Strategic capital</span>
            <div className="relative flex items-center justify-center w-4 h-4">
              <span
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: "#22c55e" }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 group">
            <span className="text-gray-400 group-hover:text-gray-300 transition">Chokepoint</span>
            <div className="relative flex items-center justify-center w-4 h-4">
              <span className="absolute text-lg leading-none" style={{ color: "#38bdf8" }}>◆</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2 group">
            <span className="text-gray-400 group-hover:text-gray-300 transition">Military base</span>
            <div className="relative flex items-center justify-center w-4 h-4">
              <span className="absolute text-purple-400 text-sm leading-none">★</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 group">
            <span className="text-gray-400 group-hover:text-gray-300 transition">Active conflict</span>
            <div className="relative flex items-center justify-center w-4 h-4">
              <span
                className="absolute px-1.5 py-0.5 rounded text-[7px] font-bold tracking-wider border"
                style={{
                  backgroundColor: "rgba(127, 29, 29, 0.75)",
                  borderColor: "#dc2626",
                  color: "#ffffff",
                }}
              >
                WAR
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN ONLY SECTIONS */}
      {isFullscreenMap && (
        <>
          {/* LIVE TRAFFIC */}
          <div className="border-t border-gray-800 pt-2">
            <div className="text-[8px] uppercase tracking-[0.15em] font-bold text-gray-600 mb-1">
              Live Traffic
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 group">
                <span className="text-gray-400 group-hover:text-gray-300 transition">Aircraft</span>
                <div className="relative flex items-center justify-center w-4 h-4">
                  <span className="absolute text-yellow-400 text-lg leading-none">✈</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 group">
                <span className="text-gray-400 group-hover:text-gray-300 transition">Commercial vessel</span>
                <div className="flex items-center gap-0.5">
                  <span 
                    className="w-1.5 h-1.5 rounded-full border border-white"
                    style={{ backgroundColor: "#3b82f6" }}
                  />
                  <span className="text-blue-400 text-[8px] leading-none">▶</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 group">
                <span className="text-gray-400 group-hover:text-gray-300 transition">Military vessel</span>
                <div className="flex items-center gap-0.5">
                  <span 
                    className="w-1.5 h-1.5 rounded-full border border-white"
                    style={{ backgroundColor: "#dc2626" }}
                  />
                  <span className="text-red-600 text-[8px] leading-none">▶</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 group">
                <span className="text-gray-400 group-hover:text-gray-300 transition">Cruise ship</span>
                <div className="flex items-center gap-0.5">
                  <span 
                    className="w-2 h-2 rounded-full border border-white"
                    style={{ backgroundColor: "#8b5cf6" }}
                  />
                  <span className="text-purple-500 text-[9px] leading-none">▶</span>
                </div>
              </div>
            </div>
          </div>

          {/* INFRASTRUCTURE */}
          <div className="border-t border-gray-800 pt-2">
            <div className="text-[8px] uppercase tracking-[0.15em] font-bold text-gray-600 mb-1">
              Infrastructure
            </div>

            <div className="flex items-center justify-between gap-2 group">
              <span className="text-gray-400 group-hover:text-gray-300 transition">Internet hub</span>
              <div className="relative flex items-center justify-center w-4 h-4">
                <span className="absolute text-purple-500 text-base leading-none">◉</span>
              </div>
            </div>
          </div>

          {/* CIVIL SIGNALS */}
          <div className="border-t border-gray-800 pt-2">
            <div className="text-[8px] uppercase tracking-[0.15em] font-bold text-gray-600 mb-1">
              Civil Signals
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 group">
                <span className="text-gray-400 group-hover:text-gray-300 transition">Conflict signal</span>
                <div className="relative flex items-center justify-center w-4 h-4">
                  <span className="text-red-500 text-sm leading-none">▲</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 group">
                <span className="text-gray-400 group-hover:text-gray-300 transition">Disaster signal</span>
                <div className="relative flex items-center justify-center w-4 h-4">
                  <span className="text-orange-500 text-sm leading-none">▲</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 group">
                <span className="text-gray-400 group-hover:text-gray-300 transition">Social signal</span>
                <div className="relative flex items-center justify-center w-4 h-4">
                  <span className="text-blue-500 text-sm leading-none">▲</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
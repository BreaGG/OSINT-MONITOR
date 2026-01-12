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

      {/* EVENT CATEGORIES - ESTILO OTAN */}
      {Object.entries(categoryColors).map(([key, value]) => (
        <div
          key={key}
          className="flex items-center justify-between gap-2"
        >
          <span className="text-gray-300">{value.label}</span>
          <div className="relative flex items-center justify-center w-5 h-5">
            {/* Halo translúcido */}
            <span
              className="absolute w-4 h-4 rounded-full opacity-40"
              style={{ backgroundColor: value.color }}
            />
            {/* Punto central nítido */}
            <span
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: value.color }}
            />
          </div>
        </div>
      ))}

      {/* STRATEGIC / SPECIAL (sin separador) */}
      
      <div className="flex items-center justify-between gap-2">
        <span className="text-gray-300">Strategic capital</span>
        <div className="relative flex items-center justify-center w-5 h-5">
          <span
            className="absolute w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "#22c55e" }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-gray-300">Chokepoint</span>
        <div className="relative flex items-center justify-center w-5 h-5">
          <span className="absolute text-2xl leading-none" style={{ color: "#38bdf8" }}>◆</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <span className="text-gray-300">Military base</span>
        <div className="relative flex items-center justify-center w-5 h-5">
          <span className="absolute text-purple-400 text-lg leading-none">★</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-gray-300">Active conflict</span>
        <div className="relative flex items-center justify-center w-5 h-5">
          <span
            className="absolute px-2 py-0.5 rounded text-[9px] font-bold tracking-wider border-2"
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

      {/* TRAFFIC SECTION (solo en fullscreen) */}
      {isFullscreenMap && (
        <>
          <div className="border-t border-gray-800 pt-2 mt-2" />
          
          <div className="uppercase tracking-wide text-gray-400 text-[11px] mb-1">
            Live Traffic
          </div>

          {/* AIRCRAFT */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-300">Aircraft</span>
            <div className="relative flex items-center justify-center w-5 h-5">
              <span className="absolute text-yellow-400 text-2xl leading-none">✈</span>
            </div>
          </div>

          {/* VESSELS */}
          <div className="space-y-1 mt-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-300">Commercial vessel</span>
              <div className="flex items-center gap-0.5">
                <span 
                  className="w-2 h-2 rounded-full border border-white"
                  style={{ backgroundColor: "#3b82f6" }}
                />
                <span className="text-blue-400 text-[10px] leading-none">▶</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-300">Military vessel</span>
              <div className="flex items-center gap-0.5">
                <span 
                  className="w-2 h-2 rounded-full border border-white"
                  style={{ backgroundColor: "#dc2626" }}
                />
                <span className="text-red-600 text-[10px] leading-none">▶</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-300">Cruise ship</span>
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
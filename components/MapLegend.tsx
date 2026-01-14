"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { categoryColors } from "@/lib/categoryColors"

export default function MapLegend() {
  const pathname = usePathname()
  const isFullscreenMap = pathname === "/map"
  
  // Estado de expansión (contraído por defecto en home, expandido en fullscreen)
  const [isExpanded, setIsExpanded] = useState(false)

  // Al cambiar de página, actualizar el estado por defecto
  useEffect(() => {
    setIsExpanded(isFullscreenMap)
  }, [isFullscreenMap])

  return (
    <div className="text-[10px] space-y-2">

      {/* TITLE NATO-STYLE con botón toggle */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-cyan-500 rounded-full" />
          <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-gray-500">
            Map Legend
          </span>
        </div>
        
        {/* Botón toggle sutil */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="
            text-gray-600 hover:text-gray-400 
            transition-colors
            focus:outline-none
          "
          title={isExpanded ? "Collapse legend" : "Expand legend"}
        >
          <svg 
            className="w-3 h-3 transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* CONTENIDO EXPANDIBLE */}
      {isExpanded && (
        <>
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
                <span className="text-gray-400 group-hover:text-gray-300 transition lowercase">
                  {value.label}
                </span>
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
                <span className="text-gray-400 group-hover:text-gray-300 transition lowercase">strategic capital</span>
                <div className="relative flex items-center justify-center w-4 h-4">
                  <span
                    className="absolute w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#22c55e" }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 group">
                <span className="text-gray-400 group-hover:text-gray-300 transition lowercase">chokepoint</span>
                <div className="relative flex items-center justify-center w-4 h-4">
                  <span className="absolute text-lg leading-none" style={{ color: "#38bdf8" }}>◆</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-2 group">
                <span className="text-gray-400 group-hover:text-gray-300 transition lowercase">military base</span>
                <div className="relative flex items-center justify-center w-4 h-4">
                  <span className="absolute text-purple-400 text-sm leading-none">★</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 group">
                <span className="text-gray-400 group-hover:text-gray-300 transition lowercase">active conflict</span>
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
                    <span className="text-gray-400 group-hover:text-gray-300 transition lowercase">aircraft</span>
                    <div className="relative flex items-center justify-center w-4 h-4">
                      <span className="absolute text-yellow-400 text-lg leading-none">✈</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 group">
                    <span className="text-gray-400 group-hover:text-gray-300 transition lowercase">commercial vessel</span>
                    <div className="flex items-center gap-0.5">
                      <span 
                        className="w-1.5 h-1.5 rounded-full border border-white"
                        style={{ backgroundColor: "#3b82f6" }}
                      />
                      <span className="text-blue-400 text-[8px] leading-none">▶</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 group">
                    <span className="text-gray-400 group-hover:text-gray-300 transition lowercase">military vessel</span>
                    <div className="flex items-center gap-0.5">
                      <span 
                        className="w-1.5 h-1.5 rounded-full border border-white"
                        style={{ backgroundColor: "#dc2626" }}
                      />
                      <span className="text-red-600 text-[8px] leading-none">▶</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 group">
                    <span className="text-gray-400 group-hover:text-gray-300 transition lowercase">cruise ship</span>
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
                  <span className="text-gray-400 group-hover:text-gray-300 transition lowercase">internet hub</span>
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
                    <span className="text-gray-400 group-hover:text-gray-300 transition lowercase">conflict signal</span>
                    <div className="relative flex items-center justify-center w-4 h-4">
                      <span className="text-red-500 text-sm leading-none">▲</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 group">
                    <span className="text-gray-400 group-hover:text-gray-300 transition lowercase">disaster signal</span>
                    <div className="relative flex items-center justify-center w-4 h-4">
                      <span className="text-orange-500 text-sm leading-none">▲</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 group">
                    <span className="text-gray-400 group-hover:text-gray-300 transition lowercase">social signal</span>
                    <div className="relative flex items-center justify-center w-4 h-4">
                      <span className="text-blue-500 text-sm leading-none">▲</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
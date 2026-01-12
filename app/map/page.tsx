"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import MapboxMap from "@/components/MapboxMap"
import MapLegend from "@/components/MapLegend"
import LegendInsights from "@/components/LegendInsights"
import FocusTimeline from "@/components/FocusTimeline"
import { Event } from "@/lib/types"
import { buildGlobalState } from "@/lib/gse"
import { adaptEventsToGSE } from "@/lib/eventToGSE"
import GlobalStateIndicator from "@/components/GlobalStateIndicator"

export default function FullscreenMapPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [focusRegion, setFocusRegion] = useState<string | null>(null)
  const [timelineVisible, setTimelineVisible] = useState(true)
  const [timelinePosition, setTimelinePosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  /* ===================== DATA ===================== */

  useEffect(() => {
    fetch("/api/events")
      .then(res => res.json())
      .then(data => {
        setEvents(data)
        setLoading(false)
      })
  }, [])

  /* ===================== KEYBOARD ===================== */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key.toLowerCase() === "f") {
        router.push("/")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [router])

  /* ===================== DRAGGABLE TIMELINE ===================== */

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.timeline-content')) return
    setIsDragging(true)
    setDragStart({
      x: e.clientX - timelinePosition.x,
      y: e.clientY - timelinePosition.y
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      setTimelinePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart])

  /* ===================== GLOBAL STATE ===================== */

  const globalState = useMemo(() => {
    if (events.length === 0) return null
    const gseEvents = adaptEventsToGSE(events)
    return buildGlobalState(gseEvents)
  }, [events])

  const lastUpdated = useMemo(() => {
    return new Date().toLocaleTimeString()
  }, [])

  /* ===================== FILTERED EVENTS ===================== */

  const filteredEvents = useMemo(() => {
    if (!focusRegion) return events

    return events.filter(
      e => e.country === focusRegion || focusRegion === "Global"
    )
  }, [events, focusRegion])

  /* ===================== RENDER ===================== */

  return (
    <main className="h-screen flex flex-col bg-black">
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex flex-col leading-tight">
            <h1 className="text-xl font-bold">Global Intelligence Monitor</h1>
            <span className="text-[11px] text-gray-400 tracking-wide">
              Open Source Intelligence · Updated {lastUpdated}
            </span>
          </div>

          {globalState && <GlobalStateIndicator state={globalState} />}

          {/* FOCUS INDICATOR */}
          {focusRegion && (
            <span
              onClick={() => setFocusRegion(null)}
              className="
                text-[11px] text-gray-300 cursor-pointer
                border border-gray-700 px-2 py-0.5 rounded
                hover:bg-black/40 transition
              "
            >
              Focus: {focusRegion} ×
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFocusRegion(null)
              if (!timelineVisible) setTimelineVisible(true)
            }}
            disabled={!focusRegion && timelineVisible}
            className="px-4 py-2 rounded border border-gray-700 text-gray-200 text-sm hover:bg-gray-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {!timelineVisible ? 'Show Timeline' : 'Clear Filters'}
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded border border-gray-700 text-gray-200 text-sm hover:bg-gray-900 transition"
          >
            EXIT (ESC)
          </button>
        </div>
      </header>

      {/* MAP + LEGEND */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEGEND SIDEBAR */}
        <aside className="w-64 flex flex-col gap-3 shrink-0 p-4 border-r border-gray-800 overflow-y-auto custom-scrollbar">
          <MapLegend />
          <LegendInsights events={filteredEvents} />
        </aside>

        {/* MAP */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              Loading map...
            </div>
          ) : (
            <>
              <MapboxMap 
                events={filteredEvents} 
                onSelectSatelliteFocus={() => {}}
              />
              
              {/* TIMELINE SUPERPUESTO (draggable) */}
              {timelineVisible && (
                <div 
                  className="w-[336px] h-72 bg-black/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden"
                  style={
                    timelinePosition 
                      ? {
                          position: 'absolute',
                          left: `${timelinePosition.x}px`,
                          top: `${timelinePosition.y}px`,
                          cursor: isDragging ? 'grabbing' : 'grab'
                        }
                      : {
                          position: 'absolute',
                          bottom: '46px',
                          right: '46px',
                          cursor: isDragging ? 'grabbing' : 'grab'
                        }
                  }
                  onMouseDown={handleMouseDown}
                >
                  {/* HEADER DRAGGABLE */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-black/50">
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                      Focus Timeline
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setTimelineVisible(false)
                      }}
                      className="text-gray-400 hover:text-gray-200 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* CONTENT CON SCROLL */}
                  <div className="timeline-content flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4">
                    <FocusTimeline
                      events={filteredEvents}
                      onSelectRegion={setFocusRegion}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
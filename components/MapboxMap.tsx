"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

import { Event } from "@/lib/types"
import type { SatelliteFocus } from "./SatelliteView"

import { isWithinTimeWindow } from "@/lib/timestampUtils"
import { hasCoordinates, MAP_CONFIG, TIME_WINDOWS, type TimeWindow } from "@/lib/map/helpers"

// Custom layer hooks
import { useEventsLayer } from "@/hooks/map/useEventsLayer"
import { useHotZonesLayer } from "@/hooks/map/useHotZonesLayer"
import { useCapitalsLayer } from "@/hooks/map/useCapitalsLayer"
import { useChokepointsLayer } from "@/hooks/map/useChokepointsLayer"
import { useConflictsLayer } from "@/hooks/map/useConflictsLayer"
import { useMilitaryBasesLayer } from "@/hooks/map/useMilitaryBasesLayer"
import { useTrafficLayer } from "@/hooks/map/useTrafficLayer"
import { useConnectionsLayer } from "@/hooks/map/useConnectionsLayer"
import { useHeatmapLayer } from "@/hooks/map/useHeatmapLayer"
import { useDayNightLayer } from "@/hooks/map/useDayNightLayer"
import { useHubsLayer } from "@/hooks/map/useHubsLayer"
import { useSignalsLayer } from "@/hooks/map/useSignalsLayer"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

type Props = {
  events: Event[]
  hoveredEventId?: string | null
  onSelectSatelliteFocus?: (focus: SatelliteFocus) => void
  heatmapMode?: boolean
  showConnections?: boolean
}

export default function MapboxMap({
  events,
  hoveredEventId,
  onSelectSatelliteFocus,
  heatmapMode = false,
  showConnections = false,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const isFullscreenPage = pathname === "/map"

  const mapRef = useRef<mapboxgl.Map | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)

  const [ready, setReady] = useState(false)
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("24h")
  // Siempre usar dark por defecto
  const mapStyle = "dark"
  // Day/Night toggle - DESACTIVADO por defecto
  const [showDayNight, setShowDayNight] = useState(false)

  const [layers, setLayers] = useState({
    events: true,
    hotzones: false, // Desactivado por defecto
    capitals: true,
    chokepoints: true,
    conflicts: true,
    militaryBases: true,
    hubs: false, // Desactivado por defecto
    signals: true, // Activado por defecto
    aircraft: false,  // Desactivado por defecto
    vessels: false,
  })

  // NO activar aircraft automáticamente en fullscreen
  // El usuario debe activarlo manualmente si lo desea

  // Filtered data by time window
  const visibleEvents = useMemo(() => {
    if (events.length === 0) return []

    const now = Date.now()
    const timeWindowMs = {
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "72h": 72 * 60 * 60 * 1000,
    }
    
    const cutoffTime = now - timeWindowMs[timeWindow]
    
    // Filtrar por ventana de tiempo usando timestamp
    const filtered = events.filter(e => {
      const eventTime = e.timestamp || new Date(e.date).getTime()
      return eventTime >= cutoffTime && eventTime <= now
    })
    
    // Si todos los eventos pasan el filtro (son muy recientes), aplicar límite por cantidad
    if (filtered.length === events.length) {
      // Ordenar por timestamp (más reciente primero)
      const sorted = [...filtered].sort((a, b) => {
        const timeA = a.timestamp || new Date(a.date).getTime()
        const timeB = b.timestamp || new Date(b.date).getTime()
        return timeB - timeA
      })
      
      // Límites por ventana
      const limits = {
        "6h": Math.max(Math.floor(events.length * 0.3), 20),  // 30% mínimo 20
        "24h": Math.max(Math.floor(events.length * 0.6), 40), // 60% mínimo 40
        "72h": events.length                                   // 100%
      }
      
      return sorted.slice(0, limits[timeWindow])
    }
    
    return filtered
  }, [events, timeWindow])

  /* ===================== CUSTOM LAYER HOOKS ===================== */

  // Heatmap layer
  useHeatmapLayer({
    map: ready ? mapRef.current : null,
    events: visibleEvents,
    visible: heatmapMode,
  })

  // Connections layer
  useConnectionsLayer({
    map: ready ? mapRef.current : null,
    events: visibleEvents,
    visible: showConnections,
  })

  // HotZones layer (PRIMERO para que esté DEBAJO)
  const { hotZones } = useHotZonesLayer({
    map: ready ? mapRef.current : null,
    events: visibleEvents,
    visible: layers.hotzones && !heatmapMode, // Ocultar hotzones cuando heatmap está activo
  })

  // Events layer (DESPUÉS para que esté ENCIMA de hotzones)
  useEventsLayer({
    map: ready ? mapRef.current : null,
    events: visibleEvents,
    visible: layers.events,
    popupRef,
    onSelectSatelliteFocus,
  })

  useCapitalsLayer({
    map: ready ? mapRef.current : null,
    visible: layers.capitals,
    popupRef,
    onSelectSatelliteFocus,
  })

  useChokepointsLayer({
    map: ready ? mapRef.current : null,
    visible: layers.chokepoints,
    popupRef,
    onSelectSatelliteFocus,
  })

  useConflictsLayer({
    map: ready ? mapRef.current : null,
    visible: layers.conflicts,
    popupRef,
    onSelectSatelliteFocus,
  })

  useMilitaryBasesLayer({
    map: ready ? mapRef.current : null,
    visible: layers.militaryBases,
    popupRef,
  })

  // Hubs layer (solo en fullscreen)
  useHubsLayer({
    map: ready ? mapRef.current : null,
    visible: layers.hubs && isFullscreenPage, // Solo visible en fullscreen
    popupRef,
    onSelectSatelliteFocus,
  })

  // Signals layer (solo en fullscreen)
  useSignalsLayer({
    map: ready ? mapRef.current : null,
    visible: layers.signals && isFullscreenPage, // Solo visible en fullscreen
    popupRef,
  })

  // Tráfico en tiempo real (solo si está habilitado)
  const { loading: aircraftLoading, count: aircraftCount } = useTrafficLayer({
    map: ready ? mapRef.current : null,
    type: "aircraft",
    visible: layers.aircraft,
    popupRef,
  })

  const { loading: vesselsLoading, count: vesselsCount } = useTrafficLayer({
    map: ready ? mapRef.current : null,
    type: "vessels",
    visible: layers.vessels,
    popupRef,
  })

  // Day/Night layer (solo visible en fullscreen por defecto)
  useDayNightLayer({
    map: ready ? mapRef.current : null,
    visible: showDayNight,
  })

  /* ===================== PERSISTENCE ===================== */

  useEffect(() => {
    const stored = localStorage.getItem("osint.map.timeWindow")
    if (stored === "6h" || stored === "24h" || stored === "72h") {
      setTimeWindow(stored)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("osint.map.timeWindow", timeWindow)
  }, [timeWindow])

  /* ===================== KEYBOARD SHORTCUT ===================== */

  useEffect(() => {
    if (isFullscreenPage) return // Ya está manejado en la página

    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f") {
        e.preventDefault()
        router.push("/map")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [router, isFullscreenPage])

  /* ===================== MAP INITIALIZATION ===================== */

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    try {
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11", // Siempre dark
        center: isFullscreenPage ? [10, 25] : MAP_CONFIG.INITIAL_CENTER, // Centrado entre USA/Venezuela y Europa/Oriente Medio
        zoom: isFullscreenPage ? 2.2 : MAP_CONFIG.INITIAL_ZOOM, // Zoom 2.2 (ligero zoom in pero se ve todo)
        minZoom: MAP_CONFIG.MIN_ZOOM,
        maxZoom: MAP_CONFIG.MAX_ZOOM,
        projection: { name: "mercator" },
        attributionControl: false,
      })

      // NO añadir controles de navegación de Mapbox
      // map.addControl(new mapboxgl.NavigationControl(), "bottom-right")

      map.on("load", () => {
        popupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 12,
        })
        setReady(true)
      })

      map.on("error", (e) => {
        console.error("Mapbox error:", e)
      })

      mapRef.current = map

      return () => {
        map.remove()
        mapRef.current = null
        setReady(false)
      }
    } catch (error) {
      console.error("Failed to initialize map:", error)
    }
  }, [isFullscreenPage]) // Añadir dependencia de isFullscreenPage

  /* ===================== HOVER HIGHLIGHT ===================== */

  useEffect(() => {
    if (!ready || !mapRef.current) return

    const map = mapRef.current

    try {
      if (!map.getSource("event-highlight")) {
        map.addSource("event-highlight", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        })
      }

      if (!map.getLayer("event-highlight-layer")) {
        map.addLayer({
          id: "event-highlight-layer",
          type: "circle",
          source: "event-highlight",
          paint: {
            "circle-radius": 10,
            "circle-color": "#ffffff",
            "circle-opacity": 0.25,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        })
      }

      const source = map.getSource("event-highlight") as mapboxgl.GeoJSONSource
      if (!source) return

      if (!hoveredEventId) {
        source.setData({ type: "FeatureCollection", features: [] })
        return
      }

      const event = events.find(e => e.id === hoveredEventId)
      if (!event || !hasCoordinates(event)) {
        source.setData({ type: "FeatureCollection", features: [] })
        return
      }

      source.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: [event.lon, event.lat],
            },
          },
        ],
      })
    } catch (error) {
      console.error("Error updating highlight:", error)
    }
  }, [hoveredEventId, events, ready])

  /* ===================== RENDER ===================== */

  return (
    <section
      className={`
        relative border border-gray-800 overflow-hidden
        ${isFullscreenPage ? "h-full" : "h-[420px]"}
      `}
    >
      <div
        ref={containerRef}
        className="h-full w-full"
      />

      {/* LAYER CONTROLS */}
      <div className="absolute top-2 left-2 z-10 space-y-1 text-xs">
        {Object.entries(layers).map(([key, value]) => {
          // Ocultar controles de tráfico, hubs y signals si no estamos en fullscreen
          if ((key === "aircraft" || key === "vessels" || key === "hubs" || key === "signals") && !isFullscreenPage) {
            return null
          }

          // Labels limpios por capa
          const layerLabels: Record<string, string> = {
            events: "EVENTS",
            hotzones: "HOTZONES",
            capitals: "CAPITALS",
            chokepoints: "CHOKEPOINTS",
            conflicts: "CONFLICTS",
            militaryBases: "BASES",
            hubs: "HUBS",
            signals: "SIGNALS",
            aircraft: "AIRCRAFT",
            vessels: "VESSELS",
          }

          const label = layerLabels[key] || key.toUpperCase()

          return (
            <button
              key={key}
              onClick={() =>
                setLayers(prev => ({
                  ...prev,
                  [key]: !prev[key as keyof typeof prev],
                }))
              }
              className={`
                block px-3 py-1.5 rounded-md border transition-all font-medium tracking-wide
                ${value
                  ? "bg-black/90 text-gray-200 border-gray-700 shadow-lg"
                  : "bg-black/50 text-gray-500 border-gray-800 hover:border-gray-700 hover:text-gray-300"
                }
              `}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* FULLSCREEN BUTTON (solo en home) */}
      {!isFullscreenPage && (
        <div className="absolute top-2 right-2 z-20">
          <button
            onClick={() => router.push("/map")}
            className="px-3 py-1.5 rounded border bg-black/80 border-gray-700 text-gray-200 text-xs hover:bg-black transition"
          >
            MISSION CONTROL (F)
          </button>
        </div>
      )}

      {/* CUSTOM MAP CONTROLS (solo en fullscreen) */}
      {isFullscreenPage && (
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
          {/* Botón centrar mapa */}
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.flyTo({
                  center: [10, 25], // Centrado entre USA/Venezuela y Europa/Oriente Medio
                  zoom: 2.2,
                  duration: 1500,
                })
              }
            }}
            className="w-9 h-9 rounded border bg-black/90 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition flex items-center justify-center"
            title="Center map"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
          
          {/* Botón zoom in */}
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.zoomIn({ duration: 300 })
              }
            }}
            className="w-9 h-9 rounded border bg-black/90 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition flex items-center justify-center text-xl font-light"
            title="Zoom in"
          >
            +
          </button>
          
          {/* Botón zoom out */}
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.zoomOut({ duration: 300 })
              }
            }}
            className="w-9 h-9 rounded border bg-black/90 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition flex items-center justify-center text-xl font-light"
            title="Zoom out"
          >
            −
          </button>
        </div>
      )}

      {/* DAY/NIGHT TOGGLE (solo en fullscreen y desktop) */}
      {isFullscreenPage && (
        <div className="absolute bottom-3 left-2 z-20 hidden md:block">
          <div className="bg-black/90 border border-gray-800 rounded p-2 w-[160px]">
            <button
              onClick={() => setShowDayNight(!showDayNight)}
              className={`w-full px-3 py-1.5 text-[10px] font-medium rounded transition-all ${
                showDayNight
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 border border-transparent"
              }`}
            >
              DAY/NIGHT
            </button>
            
            {/* Info visual siempre visible */}
            <div className="mt-2 pt-2 border-t border-gray-800 text-[9px] space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#000000", opacity: 0.25 }} />
                <span className="text-gray-400">Night zone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-[2px]" style={{ 
                  background: "repeating-linear-gradient(to right, #4b5563 0, #4b5563 3px, transparent 3px, transparent 6px)",
                  opacity: 0.4
                }} />
                <span className="text-gray-400">Terminator</span>
              </div>
              <div className="text-gray-600 text-[8px] mt-1">
                Updates every 5min
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TIME WINDOW + COUNTERS */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        {/* Stats bar */}
        <div className="text-[11px] text-gray-400 bg-black/90 border border-gray-800 rounded px-3 py-1.5">
          <span className="text-red-400 font-medium">
            {hotZones.length} hot zones
          </span>
          <span className="mx-2 text-gray-600">|</span>
          <span className="text-blue-400 font-medium">{visibleEvents.length}</span>
          <span className="text-gray-500"> / {events.length} events</span>
          
          {/* Traffic counters (solo en fullscreen) */}
          {isFullscreenPage && (
            <>
              {layers.aircraft && (
                <>
                  <span className="mx-2 text-gray-600">|</span>
                  <span className="text-yellow-400">
                    ✈ {aircraftCount} aircraft
                  </span>
                </>
              )}
              {layers.vessels && (
                <>
                  <span className="mx-2 text-gray-600">|</span>
                  <span className="text-blue-400">
                    🚢 {vesselsCount} vessels
                  </span>
                </>
              )}
            </>
          )}
        </div>
        
        {/* Time window selector */}
        <div className="flex gap-1.5 bg-black/90 border border-gray-800 rounded p-1">
          {(["6h", "24h", "72h"] as TimeWindow[]).map(v => {
            const isActive = timeWindow === v
            return (
              <button
                key={v}
                onClick={() => setTimeWindow(v)}
                className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
                }`}
              >
                {isActive && "● "}{v.toUpperCase()}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
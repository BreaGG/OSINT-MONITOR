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
  const [mapStyle, setMapStyle] = useState<"dark" | "satellite" | "terrain" | "navigation">(
    isFullscreenPage ? "navigation" : "dark"
  )

  const [layers, setLayers] = useState({
    events: true,
    hotzones: true,
    capitals: true,
    chokepoints: true,
    conflicts: true,
    militaryBases: true,
    aircraft: false,
    vessels: false,
  })

  // Activar aircraft automáticamente en fullscreen
  useEffect(() => {
    if (isFullscreenPage) {
      setLayers(prev => ({ ...prev, aircraft: true }))
    }
  }, [isFullscreenPage])

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

  // Events layer
  useEventsLayer({
    map: ready ? mapRef.current : null,
    events: visibleEvents,
    visible: layers.events,
    popupRef,
    onSelectSatelliteFocus,
  })

  const { hotZones } = useHotZonesLayer({
    map: ready ? mapRef.current : null,
    events: visibleEvents,
    visible: layers.hotzones && !heatmapMode, // Ocultar hotzones cuando heatmap está activo
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

  // Estilos disponibles
  const mapStyles = {
    dark: "mapbox://styles/mapbox/dark-v11",
    satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    terrain: "mapbox://styles/mapbox/outdoors-v12",
    navigation: "mapbox://styles/mapbox/navigation-night-v1",
  }

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    try {
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: mapStyles[mapStyle],
        center: MAP_CONFIG.INITIAL_CENTER,
        zoom: MAP_CONFIG.INITIAL_ZOOM,
        minZoom: MAP_CONFIG.MIN_ZOOM,
        maxZoom: MAP_CONFIG.MAX_ZOOM,
        projection: { name: "mercator" },
        attributionControl: false,
      })

      map.addControl(new mapboxgl.NavigationControl(), "bottom-right")

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
  }, [mapStyle])

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
          // Ocultar controles de tráfico si no estamos en fullscreen
          if ((key === "aircraft" || key === "vessels") && !isFullscreenPage) {
            return null
          }

          return (
            <button
              key={key}
              onClick={() =>
                setLayers(prev => ({
                  ...prev,
                  [key]: !prev[key as keyof typeof prev],
                }))
              }
              className={`block px-2 py-1 rounded border transition-colors ${
                value
                  ? "bg-black/80 text-gray-200 border-gray-700"
                  : "bg-black/40 text-gray-500 border-gray-800 hover:border-gray-700"
              }`}
            >
              {key === "aircraft" && "✈ AIRCRAFT"}
              {key === "vessels" && "⚓ VESSELS"}
              {key !== "aircraft" && key !== "vessels" && key.toUpperCase()}
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

      {/* MAP STYLE SELECTOR - Bottom Left (solo en fullscreen) */}
      {isFullscreenPage && (
        <div className="absolute bottom-3 left-2 z-20">
          <div className="grid grid-cols-2 gap-1 bg-black/90 border border-gray-800 rounded p-1.5">
            {(["dark", "satellite", "terrain", "navigation"] as const).map(style => (
              <button
                key={style}
                onClick={() => setMapStyle(style)}
                className={`px-3 py-1.5 text-[10px] font-medium rounded transition-all ${
                  mapStyle === style
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 border border-transparent"
                }`}
              >
                {style.toUpperCase()}
              </button>
            ))}
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
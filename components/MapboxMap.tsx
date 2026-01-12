"use client"

import { useEffect, useRef, useState } from "react"
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

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

type Props = {
  events: Event[]
  hoveredEventId?: string | null
  onSelectSatelliteFocus?: (focus: SatelliteFocus) => void
}

export default function MapboxMap({
  events,
  hoveredEventId,
  onSelectSatelliteFocus,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const isFullscreenPage = pathname === "/map"

  const mapRef = useRef<mapboxgl.Map | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)

  const [ready, setReady] = useState(false)
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("24h")

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
  const visibleEvents = events.filter(e =>
    isWithinTimeWindow(e, TIME_WINDOWS[timeWindow])
  )

  /* ===================== CUSTOM LAYER HOOKS ===================== */

  // Solo llamar hooks cuando el mapa está listo
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
    visible: layers.hotzones,
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

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    try {
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
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
  }, [])

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
            FULL MAP (F)
          </button>
        </div>
      )}

      {/* TIME WINDOW + COUNTERS */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1">
        <div className="text-[11px] text-gray-400 bg-black/70 border border-gray-800 rounded px-2 py-0.5">
          <span className="text-red-400 font-medium">
            {hotZones.length} hot zones
          </span>
          <span className="mx-2 text-gray-600">|</span>
          <span>{visibleEvents.length} events</span>
          
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
        <div className="flex gap-1 bg-black/70 border border-gray-800 rounded px-1 py-1">
          {(["6h", "24h", "72h"] as TimeWindow[]).map(v => (
            <button
              key={v}
              onClick={() => setTimeWindow(v)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                timeWindow === v
                  ? "bg-black text-gray-200 border border-gray-600"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
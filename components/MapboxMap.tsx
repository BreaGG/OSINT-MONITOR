"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

import { Event } from "@/lib/types"
import type { SatelliteFocus } from "./SatelliteView"

import { isWithinTimeWindow } from "@/lib/timestampUtils"
import { hasCoordinates, MAP_CONFIG, TIME_WINDOWS, type TimeWindow } from "@/lib/map/helpers"
import { applySmartDispersion, getTopCountries, getCountryAcronym } from "@/lib/mapDispersionHelper"

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
  onCountryFocus?: (country: string | null) => void // NUEVO: para filtrar por país
}

export default function MapboxMap({
  events,
  hoveredEventId,
  onSelectSatelliteFocus,
  heatmapMode = false,
  showConnections = false,
  onCountryFocus,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const isFullscreenPage = pathname === "/map"

  const mapRef = useRef<mapboxgl.Map | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)

  const [ready, setReady] = useState(false)
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("24h")
  const mapStyle = "dark"
  const [showDayNight, setShowDayNight] = useState(false)
  const [projectionMode, setProjectionMode] = useState<"2d" | "3d">("2d")
  
  // NUEVO: estados para búsqueda de país
  const [countrySearch, setCountrySearch] = useState("")
  const [showCountrySearch, setShowCountrySearch] = useState(false)

  const [layers, setLayers] = useState({
    events: true,
    hotzones: false,
    capitals: true,
    chokepoints: true,
    conflicts: true,
    militaryBases: true,
    hubs: false,
    signals: true,
    aircraft: false,
    vessels: false,
  })

  // Filtered data by time window CON DISPERSIÓN INTELIGENTE
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
    let finalFiltered = filtered
    if (filtered.length === events.length) {
      const sorted = [...filtered].sort((a, b) => {
        const timeA = a.timestamp || new Date(a.date).getTime()
        const timeB = b.timestamp || new Date(b.date).getTime()
        return timeB - timeA
      })
      
      const limits = {
        "6h": Math.max(Math.floor(events.length * 0.3), 20),
        "24h": Math.max(Math.floor(events.length * 0.6), 40),
        "72h": events.length
      }
      
      finalFiltered = sorted.slice(0, limits[timeWindow])
    }
    
    // APLICAR DISPERSIÓN INTELIGENTE
    const dispersed = applySmartDispersion(finalFiltered)
    
    return dispersed
  }, [events, timeWindow])

  // Top countries para presets (solo en fullscreen)
  const topCountries = useMemo(() => {
    if (!isFullscreenPage) return []
    return getTopCountries(visibleEvents, 5)
  }, [visibleEvents, isFullscreenPage])

  /* ===================== CUSTOM LAYER HOOKS ===================== */

  useHeatmapLayer({
    map: ready ? mapRef.current : null,
    events: visibleEvents,
    visible: heatmapMode,
  })

  useConnectionsLayer({
    map: ready ? mapRef.current : null,
    events: visibleEvents,
    visible: showConnections,
  })

  const { hotZones } = useHotZonesLayer({
    map: ready ? mapRef.current : null,
    events: visibleEvents,
    visible: layers.hotzones && !heatmapMode,
  })

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

  useHubsLayer({
    map: ready ? mapRef.current : null,
    visible: layers.hubs && isFullscreenPage,
    popupRef,
    onSelectSatelliteFocus,
  })

  useSignalsLayer({
    map: ready ? mapRef.current : null,
    visible: layers.signals && isFullscreenPage,
    popupRef,
  })

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
    
    // Cargar modo de proyección guardado (solo en fullscreen)
    if (isFullscreenPage) {
      const storedMode = localStorage.getItem("osint.map.projectionMode")
      if (storedMode === "2d" || storedMode === "3d") {
        setProjectionMode(storedMode)
      }
    }
  }, [isFullscreenPage])

  useEffect(() => {
    localStorage.setItem("osint.map.timeWindow", timeWindow)
  }, [timeWindow])
  
  useEffect(() => {
    if (isFullscreenPage) {
      localStorage.setItem("osint.map.projectionMode", projectionMode)
    }
  }, [projectionMode, isFullscreenPage])

  /* ===================== KEYBOARD SHORTCUT ===================== */

  useEffect(() => {
    if (isFullscreenPage) return

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
        center: isFullscreenPage ? [10, 25] : MAP_CONFIG.INITIAL_CENTER,
        zoom: isFullscreenPage ? (projectionMode === "3d" ? 2.4 : 2.2) : MAP_CONFIG.INITIAL_ZOOM,
        minZoom: MAP_CONFIG.MIN_ZOOM,
        maxZoom: MAP_CONFIG.MAX_ZOOM,
        projection: projectionMode === "3d" ? { name: "globe" } : { name: "mercator" },
        attributionControl: false,
      })

      // Configuración especial para modo 3D globe (sin estrellas)
      if (projectionMode === "3d") {
        map.on('style.load', () => {
          map.setFog({
            color: 'rgb(10, 10, 15)',
            'high-color': 'rgb(30, 35, 50)',
            'horizon-blend': 0.03,
            'space-color': 'rgb(5, 5, 10)',
            'star-intensity': 0.1
          })
        })
      }

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
  }, [isFullscreenPage, projectionMode])

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

  /* ===================== FLY TO COUNTRY ===================== */

  const flyToCountry = (center: [number, number], zoom: number) => {
    if (!mapRef.current) return
    
    mapRef.current.flyTo({
      center,
      zoom,
      duration: 1500,
      essential: true,
    })
  }

  /* ===================== TOGGLE PROJECTION MODE ===================== */

  const toggleProjectionMode = () => {
    if (!mapRef.current || !isFullscreenPage) return
    
    const newMode = projectionMode === "2d" ? "3d" : "2d"
    const map = mapRef.current
    
    // Cambiar proyección
    map.setProjection(newMode === "3d" ? { name: "globe" } : { name: "mercator" })
    
    // Ajustar zoom apropiado para cada modo
    const currentZoom = map.getZoom()
    const newZoom = newMode === "3d" 
      ? Math.max(currentZoom * 0.8, 2.0)
      : Math.min(currentZoom * 1.25, 2.2)
    
    map.flyTo({
      zoom: newZoom,
      duration: 1500,
    })
    
    // Configurar fog para modo 3D (sin estrellas)
    if (newMode === "3d") {
      map.setFog({
        color: 'rgb(10, 10, 15)',
        'high-color': 'rgb(30, 35, 50)',
        'horizon-blend': 0.03,
        'space-color': 'rgb(5, 5, 10)',
        'star-intensity': 0
      })
    } else {
      map.setFog(null)
    }
    
    setProjectionMode(newMode)
  }

  /* ===================== COUNTRY COORDINATES ===================== */
  
  const COUNTRY_COORDINATES: Record<string, { center: [number, number], zoom: number }> = {
    "United States": { center: [-95, 38], zoom: 4 },
    "Russia": { center: [100, 60], zoom: 2.5 },
    "China": { center: [105, 35], zoom: 4 },
    "India": { center: [78, 22], zoom: 4.5 },
    "Brazil": { center: [-50, -10], zoom: 4 },
    "Canada": { center: [-95, 60], zoom: 3 },
    "Australia": { center: [133, -27], zoom: 4 },
    "United Kingdom": { center: [-2, 54], zoom: 5.5 },
    "France": { center: [2, 47], zoom: 5.5 },
    "Germany": { center: [10, 51], zoom: 6 },
    "Italy": { center: [12, 42], zoom: 6 },
    "Spain": { center: [-4, 40], zoom: 6 },
    "Ukraine": { center: [31, 49], zoom: 5.5 },
    "Poland": { center: [20, 52], zoom: 6 },
    "Iran": { center: [54, 32], zoom: 5 },
    "Iraq": { center: [44, 33], zoom: 6 },
    "Syria": { center: [38, 35], zoom: 7 },
    "Israel": { center: [35, 31], zoom: 7 },
    "Saudi Arabia": { center: [45, 24], zoom: 5 },
    "Turkey": { center: [35, 39], zoom: 6 },
    "Egypt": { center: [30, 26], zoom: 5.5 },
    "South Africa": { center: [25, -29], zoom: 5.5 },
    "Japan": { center: [138, 36], zoom: 5 },
    "South Korea": { center: [128, 36], zoom: 7 },
    "North Korea": { center: [127, 40], zoom: 7 },
    "Mexico": { center: [-102, 23], zoom: 5 },
    "Argentina": { center: [-64, -34], zoom: 4 },
    "Colombia": { center: [-74, 4], zoom: 5.5 },
    "Venezuela": { center: [-66, 8], zoom: 6 },
    "Pakistan": { center: [69, 30], zoom: 5.5 },
    "Afghanistan": { center: [66, 33], zoom: 6 },
    "Indonesia": { center: [118, -2], zoom: 4.5 },
    "Philippines": { center: [122, 12], zoom: 6 },
    "Vietnam": { center: [106, 16], zoom: 6 },
    "Thailand": { center: [101, 15], zoom: 6 },
    "Myanmar": { center: [96, 21], zoom: 5.5 },
    "Nigeria": { center: [8, 9], zoom: 6 },
    "Ethiopia": { center: [39, 9], zoom: 6 },
    "Kenya": { center: [37, 1], zoom: 6 },
    "Algeria": { center: [3, 28], zoom: 5 },
    "Libya": { center: [17, 27], zoom: 5 },
    "Sudan": { center: [30, 15], zoom: 5.5 },
    "Yemen": { center: [48, 15], zoom: 6.5 },
    "Oman": { center: [56, 21], zoom: 6 },
    "UAE": { center: [54, 24], zoom: 7 },
    "Qatar": { center: [51, 25], zoom: 8 },
    "Kuwait": { center: [48, 29], zoom: 7.5 },
    "Lebanon": { center: [36, 34], zoom: 8 },
    "Jordan": { center: [36, 31], zoom: 7 },
    "Georgia": { center: [43, 42], zoom: 7 },
    "Azerbaijan": { center: [48, 40], zoom: 7 },
    "Armenia": { center: [45, 40], zoom: 7.5 },
  }

  /* ===================== COUNTRY SEARCH HANDLERS ===================== */
  
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return []
    
    const search = countrySearch.toLowerCase()
    return Object.keys(COUNTRY_COORDINATES)
      .filter(c => c.toLowerCase().includes(search))
      .slice(0, 10)
  }, [countrySearch])

  const handleCountrySearch = (country: string) => {
    if (!mapRef.current || !country) return
    
    const coords = COUNTRY_COORDINATES[country]
    if (!coords) return
    
    // 1. Focus en el mapa
    flyToCountry(coords.center, coords.zoom)
    
    // 2. Activar layer de eventos
    setLayers(prev => ({ ...prev, events: true }))
    
    // 3. Notificar al componente padre para filtrar eventos
    if (onCountryFocus) {
      onCountryFocus(country)
    }
    
    // Cerrar búsqueda
    setShowCountrySearch(false)
    setCountrySearch("")
  }
// ============ CONTINUACIÓN DE PARTE 1 ============

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
          if ((key === "aircraft" || key === "vessels" || key === "hubs" || key === "signals") && !isFullscreenPage) {
            return null
          }

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

      {/* COUNTRY PRESETS (solo fullscreen) */}
      {isFullscreenPage && topCountries.length > 0 && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 bg-black/90 border border-gray-800 rounded px-2.5 py-1.5">
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[8px] uppercase tracking-[0.12em] font-bold text-gray-500">
                Hotspots
              </span>
            </div>
            
            <div className="w-px h-3 bg-gray-800" />
            
            <div className="flex items-center gap-1">
              {topCountries.map(({ country, count, center, zoom }) => (
                <button
                  key={country}
                  onClick={() => flyToCountry(center, zoom)}
                  className="
                    flex items-center gap-1 px-2 py-1 rounded
                    bg-gray-900/50 border border-gray-800
                    hover:border-gray-700 hover:bg-gray-900
                    transition-all group
                  "
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-300 leading-none">
                    {getCountryAcronym(country)}
                  </span>
                  <div className="flex items-center justify-center px-1 py-0.5 bg-red-500/20 border border-red-500/40 rounded min-w-[20px]">
                    <span className="text-[8px] font-mono font-bold text-red-400 leading-none">
                      {count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
          {/* Botón 2D/3D Toggle */}
          <button
            onClick={toggleProjectionMode}
            className={`
              w-9 h-9 rounded border transition-all flex items-center justify-center group relative
              ${projectionMode === "3d"
                ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                : "bg-black/90 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
              }
            `}
            title={projectionMode === "2d" ? "Switch to 3D Globe View" : "Switch to 2D Flat Map"}
          >
            {projectionMode === "2d" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth="2" />
                <path d="M12 3 C8 8, 8 16, 12 21" strokeWidth="1.5" />
                <path d="M12 3 C16 8, 16 16, 12 21" strokeWidth="1.5" />
                <ellipse cx="12" cy="12" rx="9" ry="4" strokeWidth="1.5" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="6" width="18" height="12" strokeWidth="2" rx="1" />
                <path d="M9 6 L9 18 M15 6 L15 18" strokeWidth="1.5" />
                <path d="M3 12 L21 12" strokeWidth="1.5" />
              </svg>
            )}
            
            <div className="absolute right-full mr-2 px-2 py-1 bg-black/90 border border-gray-700 rounded text-[9px] text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {projectionMode === "2d" ? "3D Globe View" : "2D Flat Map"}
            </div>
          </button>
          
          <div className="w-9 h-px bg-gray-800 my-0.5" />
          
          {/* Botón centrar mapa */}
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.flyTo({
                  center: [10, 25],
                  zoom: projectionMode === "3d" ? 2.4 : 2.2,
                  duration: 1500,
                  essential: true,
                })
              }
            }}
            className="w-9 h-9 rounded border bg-black/90 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition flex items-center justify-center group"
            title="Center map"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            <div className="absolute right-full mr-2 px-2 py-1 bg-black/90 border border-gray-700 rounded text-[9px] text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Center Map
            </div>
          </button>
          
          {/* Botón búsqueda de país */}
          <button
            onClick={() => setShowCountrySearch(true)}
            className="w-9 h-9 rounded border bg-black/90 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition flex items-center justify-center group"
            title="Search country"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div className="absolute right-full mr-2 px-2 py-1 bg-black/90 border border-gray-700 rounded text-[9px] text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Search Country
            </div>
          </button>
          
          <div className="w-9 h-px bg-gray-800 my-0.5" />
          
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

      {/* COUNTRY SEARCH POPUP (solo fullscreen) */}
      {isFullscreenPage && showCountrySearch && (
        <div className="absolute top-2 right-14 z-30">
          <div className="bg-black/95 border border-gray-700 rounded-lg p-2 w-64 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search country..."
                autoFocus
                className="
                  flex-1 bg-transparent text-gray-300 text-sm
                  focus:outline-none placeholder:text-gray-600
                "
              />
              <button
                onClick={() => {
                  setShowCountrySearch(false)
                  setCountrySearch("")
                  if (onCountryFocus) {
                    onCountryFocus(null)
                  }
                }}
                className="text-gray-500 hover:text-gray-300 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {filteredCountries.length > 0 && (
              <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                {filteredCountries.map((country) => (
                  <button
                    key={country}
                    onClick={() => handleCountrySearch(country)}
                    className="
                      w-full text-left px-3 py-2 rounded text-sm
                      text-gray-300 hover:bg-gray-800 hover:text-white
                      transition-all
                    "
                  >
                    {country}
                  </button>
                ))}
              </div>
            )}
            
            {countrySearch && filteredCountries.length === 0 && (
              <div className="text-center py-4 text-sm text-gray-600">
                No countries found
              </div>
            )}
          </div>
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
        <div className="text-[11px] text-gray-400 bg-black/90 border border-gray-800 rounded px-3 py-1.5 flex items-center">
          {/* Indicador de modo (solo en fullscreen) con SVG */}
          {isFullscreenPage && (
            <>
              <span className="inline-flex items-center gap-1.5">
                {projectionMode === "3d" ? (
                  <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth="2" />
                    <path d="M12 3 C8 8, 8 16, 12 21" strokeWidth="1.5" />
                    <path d="M12 3 C16 8, 16 16, 12 21" strokeWidth="1.5" />
                    <ellipse cx="12" cy="12" rx="9" ry="4" strokeWidth="1.5" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="6" width="18" height="12" strokeWidth="2" rx="1" />
                    <path d="M9 6 L9 18 M15 6 L15 18" strokeWidth="1.5" />
                    <path d="M3 12 L21 12" strokeWidth="1.5" />
                  </svg>
                )}
                <span className={`font-medium ${projectionMode === "3d" ? "text-purple-400" : "text-cyan-400"}`}>
                  {projectionMode === "3d" ? "GLOBE" : "FLAT"}
                </span>
              </span>
              <span className="mx-2 text-gray-600">|</span>
            </>
          )}
          
          <span className="text-red-400 font-medium">
            {hotZones.length} hot zones
          </span>
          <span className="mx-2 text-gray-600">|</span>
          <span className="text-blue-400 font-medium">{visibleEvents.length}</span>
          <span className="text-gray-500"> / {events.length} events</span>
          
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
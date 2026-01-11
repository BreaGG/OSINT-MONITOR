"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import type * as GeoJSON from "geojson"

import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"
import { strategicPoints } from "@/lib/strategicPoints"
import { strategicChokepoints } from "@/lib/strategicChokepoints"
import { activeConflicts } from "@/lib/activeConflicts"
import { strategicMilitaryBases } from "@/lib/strategicMilitaryBases"
import type { SatelliteFocus } from "./SatelliteView"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

type Props = {
  events: Event[]
  hoveredEventId?: string | null
  onSelectSatelliteFocus?: (focus: SatelliteFocus) => void
}


type TimeWindow = "6h" | "24h" | "72h"

const TIME_WINDOWS: Record<TimeWindow, number> = {
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "72h": 72 * 60 * 60 * 1000,
}


type CategoryKey = keyof typeof categoryColors

/* ===================== HELPERS ===================== */

function parseDBTimestamp(ts: string): number {
  // "2026-01-10 19:49:01"
  const [date, time] = ts.split(" ")
  const [y, m, d] = date.split("-").map(Number)
  const [hh, mm, ss] = time.split(":").map(Number)

  return new Date(y, m - 1, d, hh, mm, ss).getTime()
}


function getEventTimestamp(e: Event): number | null {
  const ts =
    (e as any).publishedAt ||
    (e as any).published_at ||
    (e as any).createdAt ||
    (e as any).created_at

  if (!ts) return null

  if (typeof ts === "string" && ts.includes(" ")) {
    return parseDBTimestamp(ts)
  }

  const d = new Date(ts)
  return isNaN(d.getTime()) ? null : d.getTime()
}

function updateTimeFilteredLayers(
  map: mapboxgl.Map,
  events: Event[],
  timeWindow: TimeWindow
) {
  const windowMs = TIME_WINDOWS[timeWindow]

  // EVENTS
  const eventSource = map.getSource("events") as mapboxgl.GeoJSONSource
  if (eventSource) {
    eventSource.setData({
      type: "FeatureCollection",
      features: events
        .filter(hasCoordinates)
        .filter(e => isWithinTimeWindow(e, windowMs))
        .map(e => ({
          type: "Feature",
          properties: {
            id: e.id,
            title: e.title,
            category: e.category,
            color: categoryColors[e.category].color,
          },
          geometry: {
            type: "Point",
            coordinates: [e.lon, e.lat],
          },
        })),
    })
  }

  // HOT ZONES
  const hotSource = map.getSource("hot-zones") as mapboxgl.GeoJSONSource
  if (hotSource) {
    hotSource.setData({
      type: "FeatureCollection",
      features: computeHotZones(
        events.filter(e => isWithinTimeWindow(e, windowMs))
      ).map(z => ({
        type: "Feature",
        properties: { count: z.count },
        geometry: {
          type: "Point",
          coordinates: [z.lon, z.lat],
        },
      })),
    })
  }
}

function isWithinTimeWindow(e: Event, windowMs: number) {
  const ts = getEventTimestamp(e)
  if (!ts) return windowMs >= TIME_WINDOWS["24h"]
  return Date.now() - ts <= windowMs
}


function hasCoordinates(
  e: Event
): e is Event & { lat: number; lon: number } {
  return typeof e.lat === "number" && typeof e.lon === "number"
}

function relatedHeadlines(events: Event[], country: string) {
  const items = events.filter(e => e.country === country).slice(0, 3)

  if (items.length === 0) {
    return `<li style="color:#9ca3af;font-size:11px">No recent headlines</li>`
  }

  return items
    .map(
      e => `
        <li style="margin-bottom:4px">
          <a
            href="/event/${encodeURIComponent(e.id)}"
            style="
              display:block;
              padding:4px 6px;
              font-size:11px;
              color:#60a5fa;
              text-decoration:none;
              border-radius:4px;
            "
            onmouseover="
              this.style.background='rgba(255,255,255,0.04)';
              this.style.color='#93c5fd';
              this.style.textDecoration='underline';
            "
            onmouseout="
              this.style.background='transparent';
              this.style.color='#60a5fa';
              this.style.textDecoration='none';
            "
          >
            ${e.title}
          </a>
        </li>`
    )
    .join("")
}

function popup(content: string) {
  return `
    <div style="
      padding:12px;
      max-width:280px;
      font-size:13px;
    ">
      ${content}
    </div>
  `
}

type HotZone = {
  lat: number
  lon: number
  count: number
  intensity: number
}

/* ===================== HELPERS ===================== */

// Distancia real en km (Haversine)
function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function eventWeight(e: Event) {
  const ts = getEventTimestamp(e)
  if (!ts) return 0.5   // 👈 clave

  const hoursAgo = (Date.now() - ts) / 36e5

  if (hoursAgo < 6) return 2
  if (hoursAgo < 24) return 1.5
  return 1
}

/* ===================== HOT ZONES ===================== */

export function computeHotZones(events: Event[]): HotZone[] {
  const RADIUS_KM = 150        // radio realista
  const MIN_WEIGHT = 4        // umbral real de actividad

  const zones: HotZone[] = []

  events.filter(hasCoordinates).forEach(e => {
    const w = eventWeight(e)

    const zone = zones.find(z =>
      distanceKm(z.lat, z.lon, e.lat, e.lon) <= RADIUS_KM
    )

    if (zone) {
      // centroid dinámico (promedio ponderado)
      const total = zone.intensity + w
      zone.lat = (zone.lat * zone.intensity + e.lat * w) / total
      zone.lon = (zone.lon * zone.intensity + e.lon * w) / total
      zone.intensity = total
      zone.count++
    } else {
      zones.push({
        lat: e.lat,
        lon: e.lon,
        count: 1,
        intensity: w,
      })
    }
  })

  return zones
    .filter(z => z.intensity >= MIN_WEIGHT)
    .sort((a, b) => b.intensity - a.intensity)
}

/* ===================== COMPONENT ===================== */

export default function MapboxMap({
  events,
  hoveredEventId,
  onSelectSatelliteFocus,
}: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("24h")
  const popupRef = useRef<mapboxgl.Popup | null>(null)

  const [layers, setLayers] = useState({
    events: true,
    hotzones: true,
    capitals: true,
    chokepoints: true,
    conflicts: true,
    militaryBases: true,
  })
  useEffect(() => {
    if (!mapRef.current) return

    updateTimeFilteredLayers(
      mapRef.current,
      events,
      timeWindow
    )
  }, [timeWindow, events])


  useEffect(() => {
    const stored = localStorage.getItem("osint.map.timeWindow")
    if (stored === "6h" || stored === "24h" || stored === "72h") {
      setTimeWindow(stored)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("osint.map.timeWindow", timeWindow)
  }, [timeWindow])


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f") {
        setIsFullscreen(v => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current
    setTimeout(() => {
      map.resize()
    }, 200)
  }, [isFullscreen])

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : ""
  }, [isFullscreen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false)
    }

    if (isFullscreen) {
      window.addEventListener("keydown", onKey)
    }

    return () => window.removeEventListener("keydown", onKey)
  }, [isFullscreen])

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [30, 38],
      zoom: 2.4,
      minZoom: 1.2,
      maxZoom: 6,
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

      /* ===================== EVENTS ===================== */

      map.addSource("events", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: events
            .filter(hasCoordinates)
            .map(e => ({
              type: "Feature",
              properties: {
                id: e.id,
                title: e.title,
                country: e.country,
                category: e.category as CategoryKey,
                color: categoryColors[e.category as CategoryKey].color,
                ts: getEventTimestamp(e), // 👈 CLAVE
              },
              geometry: {
                type: "Point",
                coordinates: [e.lon, e.lat],
              },
            })),
        },
      })



      map.addSource("event-highlight", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      })

      map.addLayer({
        id: "events-layer",
        type: "circle",
        source: "events",
        paint: {
          "circle-radius": 4,
          "circle-color": ["get", "color"],
          "circle-opacity": 0.85,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      })

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

      map.on("click", "events-layer", e => {
        const p = e.features?.[0]?.properties as any
        if (!p) return

        // 👉 SOLO ACCIÓN, NADA VISUAL
        onSelectSatelliteFocus?.({
          lat: e.lngLat.lat,
          lon: e.lngLat.lng,
          region: p.country ?? "Selected area",
          label: p.title,
        })
      })
      map.on("mouseenter", "events-layer", e => {
        map.getCanvas().style.cursor = "pointer"
        if (!e.features?.length) return

        const p = e.features[0].properties as any

        popupRef.current!
          .setLngLat(e.lngLat)
          .setHTML(
            popup(`
        <div style="font-size:12px;line-height:1.3">
          <div style="font-weight:600;font-size:13px">
            ${p.title}
          </div>
          <div style="font-size:11px;color:#9ca3af">
            ${p.country}
          </div>
          <div style="font-size:11px;color:${p.color};margin-top:4px">
            ${categoryColors[p.category as CategoryKey].label}
          </div>
        </div>
      `)
          )
          .addTo(map)
      })
      map.on("mouseleave", "events-layer", () => {
        map.getCanvas().style.cursor = ""
        popupRef.current?.remove()
      })



      /* ===================== HOT ZONES ===================== */

      map.addSource("hot-zones", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: computeHotZones(events).map(z => ({
            type: "Feature",
            properties: { count: z.count },
            geometry: {
              type: "Point",
              coordinates: [z.lon, z.lat],
            },
          })),
        } as GeoJSON.FeatureCollection,
      })

      map.addLayer({
        id: "hotzones-layer",
        type: "circle",
        source: "hot-zones",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "count"],
            3,
            40,
            10,
            120,
          ],
          "circle-color": "#991b1b",
          "circle-opacity": 0.12,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#991b1b",
        },
      })

      updateTimeFilteredLayers(map, events, timeWindow)

      /* ===================== CAPITALS ===================== */

      map.addSource("capitals", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: strategicPoints.map(p => ({
            type: "Feature",
            properties: {
              ...p,
              entities: Array.isArray(p.entities)
                ? p.entities.join(", ")
                : p.entities,
            },
            geometry: {
              type: "Point",
              coordinates: [p.lon, p.lat],
            },
          })),
        } as GeoJSON.FeatureCollection,
      })

      map.addLayer({
        id: "capitals-layer",
        type: "circle",
        source: "capitals",
        paint: {
          "circle-radius": 6,
          "circle-color": "#365314",
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      })

      map.addLayer({
        id: "capitals-labels",
        type: "symbol",
        source: "capitals",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.3],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#e5e7eb",
          "text-halo-color": "#020617",
          "text-halo-width": 1,
        },
      })

      map.on("click", "capitals-layer", e => {
        const p = e.features?.[0]?.properties as any
        if (!p) return

        onSelectSatelliteFocus?.({
          lat: e.lngLat.lat,
          lon: e.lngLat.lng,
          region: p.country ?? p.name,
          label: p.name,
        })
      })

      map.on("mouseenter", "capitals-layer", e => {
        map.getCanvas().style.cursor = "pointer"
        const p = e.features?.[0]?.properties as any
        if (!p) return

        popupRef.current!
          .setLngLat(e.lngLat)
          .setHTML(
            popup(`
        <div style="font-size:12px;line-height:1.3">

          <!-- HEADER -->
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <div style="font-weight:600;font-size:14px">
              ${p.name}
            </div>
            <div style="font-size:11px;color:#9ca3af">
              ${p.status}
            </div>
          </div>

          <!-- SUMMARY -->
          <div style="font-size:11px;color:#d1d5db;margin-bottom:6px">
            ${p.summary}
          </div>

          <div style="height:1px;background:#e5e7eb;opacity:0.25;margin:6px 0"></div>

          <!-- ENTITIES -->
          <div style="font-size:11px">
            <span style="color:#9ca3af">Key entities</span><br/>
            ${p.entities}
          </div>

        </div>
      `)
          )
          .addTo(map)
      })

      map.on("mouseleave", "capitals-layer", () => {
        map.getCanvas().style.cursor = ""
        popupRef.current?.remove()
      })


      /* ===================== MILITARY BASES ===================== */

      map.addSource("military-bases", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: strategicMilitaryBases.map(b => ({
            type: "Feature",
            properties: b,
            geometry: {
              type: "Point",
              coordinates: [b.lon, b.lat],
            },
          })),
        } as GeoJSON.FeatureCollection,
      })
      map.addLayer({
        id: "military-bases-layer",
        type: "symbol",
        source: "military-bases",
        layout: {
          "text-field": "★",
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            1.5, 16,
            3, 20,
            5, 26,
          ],
          "text-anchor": "center",
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#a855f7",
          "text-halo-color": "#020617",
          "text-halo-width": 0.75,
        },
      })


      map.on("click", "military-bases-layer", () => { })
      map.on("mouseenter", "military-bases-layer", e => {
        map.getCanvas().style.cursor = "pointer"
        const b = e.features?.[0]?.properties as any
        if (!b) return

        popupRef.current!
          .setLngLat(e.lngLat)
          .setHTML(
            popup(`
        <div style="font-size:12px;line-height:1.3">

          <!-- HEADER -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
            <div style="font-weight:600;font-size:14px">
              ${b.name}
            </div>
            <div style="font-size:11px;color:#c4b5fd;white-space:nowrap">
              MILITARY BASE
            </div>
          </div>

          <!-- LOCATION -->
          <div style="font-size:11px;color:#d1d5db;margin-bottom:6px">
            ${b.country}
          </div>

          <div style="height:1px;background:#e5e7eb;opacity:0.25;margin:6px 0"></div>

          <!-- DESCRIPTION -->
          <div style="font-size:11px;color:#d1d5db;margin-bottom:6px">
            ${b.description}
          </div>

          <div style="height:1px;background:#e5e7eb;opacity:0.25;margin:6px 0"></div>

          <!-- SIGNIFICANCE -->
          <div style="font-size:11px">
            <span style="color:#9ca3af">Strategic significance</span><br/>
            ${b.significance}
          </div>

        </div>
      `)
          )
          .addTo(map)
      })


      map.on("mouseleave", "military-bases-layer", () => {
        map.getCanvas().style.cursor = ""
        popupRef.current?.remove()
      })


      /* ===================== CHOKEPOINTS ===================== */

      map.addSource("chokepoints", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: strategicChokepoints.map(p => ({
            type: "Feature",
            properties: p,
            geometry: {
              type: "Point",
              coordinates: [p.lon, p.lat],
            },
          })),
        } as GeoJSON.FeatureCollection,
      })

      map.addLayer({
        id: "chokepoints-layer",
        type: "symbol",
        source: "chokepoints",
        layout: {
          "text-field": "◆",
          "text-size": 26,
          "text-allow-overlap": true,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#334155",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        },
      })

      map.addLayer({
        id: "chokepoints-labels",
        type: "symbol",
        source: "chokepoints",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.3],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#cbd5f5",
          "text-halo-color": "#020617",
          "text-halo-width": 1,
        },
      })

      map.on("click", "chokepoints-layer", e => {
        const p = e.features?.[0]?.properties as any
        if (!p) return

        onSelectSatelliteFocus?.({
          lat: e.lngLat.lat,
          lon: e.lngLat.lng,
          region: p.name,
          label: `Chokepoint · ${p.name}`,
        })
      })

      map.on("mouseenter", "chokepoints-layer", e => {
        map.getCanvas().style.cursor = "pointer"
        const p = e.features?.[0]?.properties as any
        if (!p) return

        popupRef.current!
          .setLngLat(e.lngLat)
          .setHTML(
            popup(`
        <div style="font-size:12px;line-height:1.3">

          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <div style="font-weight:600;font-size:14px">
              ${p.name}
            </div>
            <div style="font-size:11px;color:#9ca3af">
              ${p.status}
            </div>
          </div>

          <div style="font-size:11px;color:#d1d5db">
            ${p.summary}
          </div>

        </div>
      `)
          )
          .addTo(map)
      })

      map.on("mouseleave", "chokepoints-layer", () => {
        map.getCanvas().style.cursor = ""
        popupRef.current?.remove()
      })



      /* ===================== CONFLICTS ===================== */

      map.addSource("conflicts", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: activeConflicts.map(c => ({
            type: "Feature",
            properties: {
              ...c,
              belligerents: Array.isArray(c.belligerents)
                ? c.belligerents.join(", ")
                : c.belligerents,
            },
            geometry: {
              type: "Point",
              coordinates: [c.lon, c.lat],
            },
          })),
        } as GeoJSON.FeatureCollection,
      })

      map.addLayer({
        id: "conflicts-layer",
        type: "symbol",
        source: "conflicts",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
        },
        paint: {
          "text-color": "#fecaca",
          "text-halo-color": "#7f1d1d",
          "text-halo-width": 1.5,
        },
      })

      map.on("click", "conflicts-layer", e => {
        const c = e.features?.[0]?.properties as any
        if (!c) return

        onSelectSatelliteFocus?.({
          lat: e.lngLat.lat,
          lon: e.lngLat.lng,
          region: c.name,
          label: `Conflict · ${c.name}`,
        })
      })
      map.on("mouseenter", "conflicts-layer", e => {
        map.getCanvas().style.cursor = "pointer"
        const c = e.features?.[0]?.properties as any
        if (!c) return

        popupRef.current!
          .setLngLat(e.lngLat)
          .setHTML(
            popup(`
        <div style="font-size:12px;line-height:1.3">

          <!-- HEADER -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
            <div style="font-weight:600;font-size:14px">
              ${c.name}
            </div>
            <div style="font-size:11px;color:#9ca3af">
              ${c.startDate}
            </div>
          </div>

          <div style="color:#fca5a5;font-size:11px;margin-bottom:6px">
            ${c.level} intensity
          </div>

          <div style="height:1px;background:#e5e7eb;opacity:0.25;margin:6px 0"></div>

          <!-- KEY METRICS -->
          <div style="margin-bottom:6px">

            <div style="display:flex;justify-content:space-between">
              <span style="color:#9ca3af">Casualties</span>
              <span>${c.casualties}</span>
            </div>

            <div style="display:flex;justify-content:space-between">
              <span style="color:#9ca3af">Displaced</span>
              <span>${c.displaced}</span>
            </div>

          </div>

          <div style="height:1px;background:#e5e7eb;opacity:0.25;margin:6px 0"></div>

          <!-- DESCRIPTION -->
          <div style="color:#d1d5db;font-size:11px;margin-bottom:6px">
            ${c.description}
          </div>

          <div style="height:1px;background:#e5e7eb;opacity:0.25;margin:6px 0"></div>

          <!-- BELLIGERENTS -->
          <div style="font-size:11px">
            <span style="color:#9ca3af">Belligerents</span><br/>
            ${String(c.belligerents)
                .split(",")
                .map(b => b.trim())
                .join(" · ")}
          </div>

        </div>
      `)
          )
          .addTo(map)
      })


      map.on("mouseleave", "conflicts-layer", () => {
        map.getCanvas().style.cursor = ""
        popupRef.current?.remove()
      })


      if (map.getLayer("event-highlight-layer")) {
        map.moveLayer("event-highlight-layer")
      }

      setReady(true)
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [events])

  /* ===================== LAYER TOGGLES ===================== */

  useEffect(() => {
    if (!ready || !mapRef.current) return
    const map = mapRef.current


    const toggle = (id: string, visible: boolean) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none")
      }
    }

    toggle("events-layer", layers.events)
    toggle("hotzones-layer", layers.hotzones)
    toggle("capitals-layer", layers.capitals)
    toggle("capitals-labels", layers.capitals)
    toggle("chokepoints-layer", layers.chokepoints)
    toggle("chokepoints-labels", layers.chokepoints)
    toggle("conflicts-layer", layers.conflicts)
    toggle("military-bases-layer", layers.militaryBases)
  }, [layers, ready])


  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current
    const source = map.getSource("event-highlight") as mapboxgl.GeoJSONSource
    if (!source) return

    if (!hoveredEventId) {
      source.setData({
        type: "FeatureCollection",
        features: [],
      })
      return
    }

    const event = events.find(e => e.id === hoveredEventId)

    if (
      !event ||
      typeof event.lat !== "number" ||
      typeof event.lon !== "number"
    ) {
      source.setData({
        type: "FeatureCollection",
        features: [],
      })
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
  }, [hoveredEventId, events])


  return (
    <section
      className={`
      ${isFullscreen
          ? "fixed inset-0 z-[999] bg-black"
          : "relative rounded-xl border border-gray-800"
        }
      overflow-hidden
    `}
    >
      {/* TOP LEFT — LAYERS */}
      <div className="absolute top-2 left-2 z-10 space-y-1 text-xs">
        {Object.entries(layers).map(([key, value]) => (
          <button
            key={key}
            onClick={() =>
              setLayers(prev => ({
                ...prev,
                [key]: !prev[key as keyof typeof prev],
              }))
            }
            className={`block px-2 py-1 rounded border ${value
              ? "bg-black/80 text-gray-200 border-gray-700"
              : "bg-black/40 text-gray-500 border-gray-800"
              }`}
          >
            {key.toUpperCase()}
          </button>
        ))}
      </div>

      {/* TOP RIGHT — FULLSCREEN */}
      <div className="absolute top-2 right-2 z-20">
        <button
          onClick={() => setIsFullscreen(v => !v)}
          className="
          px-3 py-1.5
          rounded border
          bg-black/80 border-gray-700
          text-gray-200 text-xs
          hover:bg-black
          transition
        "
        >
          {isFullscreen ? "EXIT MAP" : "FULL MAP"}
        </button>
      </div>

      {/* BOTTOM CENTER — TIME WINDOW */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
        <div className="flex gap-1 bg-black/70 border border-gray-800 rounded px-1 py-1">
          {(["6h", "24h", "72h"] as TimeWindow[]).map(v => (
            <button
              key={v}
              onClick={() => setTimeWindow(v)}
              className={`px-3 py-1 text-xs rounded ${timeWindow === v
                ? "bg-black text-gray-200 border border-gray-600"
                : "text-gray-500 hover:text-gray-300"
                }`}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* MAP */}
      <div
        ref={containerRef}
        className={isFullscreen ? "h-full w-full" : "h-[420px] w-full"}
      />
    </section>
  )
}

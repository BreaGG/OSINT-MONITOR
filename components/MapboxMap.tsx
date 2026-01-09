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

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

type Props = {
  events: Event[]
}

type CategoryKey = keyof typeof categoryColors

/* ===================== HELPERS ===================== */

function hasCoordinates(
  e: Event
): e is Event & { lat: number; lon: number } {
  return typeof e.lat === "number" && typeof e.lon === "number"
}

function relatedHeadlines(events: Event[], country: string) {
  const items = events.filter(e => e.country === country).slice(0, 3)

  if (items.length === 0) {
    return `<li style="color:#9ca3af;font-size:12px">No recent headlines</li>`
  }

  return items
    .map(
      e => `
      <li>
        <a href="/event/${encodeURIComponent(e.id)}"
           style="color:#60a5fa;text-decoration:underline;font-size:12px">
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

function computeHotZones(events: Event[]) {
  const zones: { lat: number; lon: number; count: number }[] = []

  events.filter(hasCoordinates).forEach(e => {
    const found = zones.find(
      z => Math.abs(z.lat - e.lat) < 5 && Math.abs(z.lon - e.lon) < 5
    )
    if (found) found.count++
    else zones.push({ lat: e.lat, lon: e.lon, count: 1 })
  })

  return zones.filter(z => z.count >= 3)
}

/* ===================== COMPONENT ===================== */

export default function MapboxIntelMap({ events }: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)

  const [layers, setLayers] = useState({
    events: true,
    hotzones: true,
    capitals: true,
    chokepoints: true,
    conflicts: true,
  })

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0, 20],
      zoom: 1.6,
      minZoom: 1.2,
      maxZoom: 6,
      projection: { name: "mercator" },
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl(), "bottom-right")

    map.on("load", () => {
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
              },
              geometry: {
                type: "Point",
                coordinates: [e.lon, e.lat],
              },
            })),
        } as GeoJSON.FeatureCollection,
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

      map.on("click", "events-layer", e => {
        const p = e.features?.[0]?.properties as {
          id: string
          title: string
          country: string
          category: CategoryKey
          color: string
        }

        new mapboxgl.Popup({ closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(
            popup(`
              <strong>${p.title}</strong><br/>
              <span style="color:#9ca3af;font-size:12px">${p.country}</span><br/>
              <span style="color:${p.color};font-size:12px">
                ${categoryColors[p.category].label}
              </span><br/><br/>
              <a href="/event/${encodeURIComponent(p.id)}"
                 style="color:#60a5fa;text-decoration:underline;font-size:12px">
                View details →
              </a>
            `)
          )
          .addTo(map)
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

      /* ===================== CAPITALS ===================== */

      map.addSource("capitals", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: strategicPoints.map(p => ({
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

        new mapboxgl.Popup({ closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(
            popup(`
              <strong>${p.name}</strong><br/>
              <span style="color:#9ca3af;font-size:12px">${p.summary}</span><br/><br/>
              <strong>Status:</strong> ${p.status}<br/>
              <strong>Key entities:</strong> ${p.entities.join(", ")}<br/><br/>
              <strong>Related headlines:</strong>
              <ul>${relatedHeadlines(events, p.country)}</ul>
            `)
          )
          .addTo(map)
      })

      const onCapitalClick = (e: mapboxgl.MapLayerMouseEvent) => {
  const p = e.features?.[0]?.properties as any

  new mapboxgl.Popup({ closeButton: false })
    .setLngLat(e.lngLat)
    .setHTML(
      popup(`
        <strong>${p.name}</strong><br/>
        <span style="color:#9ca3af;font-size:12px">${p.summary}</span><br/><br/>
        <strong>Status:</strong> ${p.status}<br/>
        <strong>Key entities:</strong> ${p.entities.join(", ")}<br/><br/>
        <strong>Related headlines:</strong>
        <ul>${relatedHeadlines(events, p.country)}</ul>
      `)
    )
    .addTo(map)
}

map.on("click", "capitals-layer", onCapitalClick)
map.on("click", "capitals-labels", onCapitalClick)


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
        type: "circle",
        source: "chokepoints",
        paint: {
          "circle-radius": 6,
          "circle-color": "#334155",
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
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

        new mapboxgl.Popup({ closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(
            popup(`
              <strong>${p.name}</strong><br/>
              <span style="color:#9ca3af;font-size:12px">${p.summary}</span><br/><br/>
              <strong>Status:</strong> ${p.status}<br/><br/>
              <strong>Related headlines:</strong>
              <ul>${relatedHeadlines(events, p.country)}</ul>
            `)
          )
          .addTo(map)
      })

      const onChokepointClick = (e: mapboxgl.MapLayerMouseEvent) => {
  const p = e.features?.[0]?.properties as any

  new mapboxgl.Popup({ closeButton: false })
    .setLngLat(e.lngLat)
    .setHTML(
      popup(`
        <strong>${p.name}</strong><br/>
        <span style="color:#9ca3af;font-size:12px">${p.summary}</span><br/><br/>
        <strong>Status:</strong> ${p.status}<br/><br/>
        <strong>Related headlines:</strong>
        <ul>${relatedHeadlines(events, p.country)}</ul>
      `)
    )
    .addTo(map)
}

map.on("click", "chokepoints-layer", onChokepointClick)
map.on("click", "chokepoints-labels", onChokepointClick)


      /* ===================== CONFLICTS ===================== */

      map.addSource("conflicts", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: activeConflicts.map(c => ({
            type: "Feature",
            properties: c,
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

        new mapboxgl.Popup({ closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(
            popup(`
              <strong>${c.name}</strong><br/>
              <span style="color:#fca5a5">${c.level} intensity</span><br/><br/>
              <strong>Start:</strong> ${c.startDate}<br/>
              <strong>Casualties:</strong> ${c.casualties}<br/>
              <strong>Displaced:</strong> ${c.displaced}<br/><br/>
              <p style="font-size:12px;color:#d1d5db">
                ${c.description}
              </p>
              <strong>Belligerents:</strong>
              <ul>${c.belligerents.map((b: string) => `<li>${b}</li>`).join("")}</ul>
            `)
          )
          .addTo(map)
      })

      map.on("idle", () => setReady(true))
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
  }, [layers, ready])

  return (
    <section className="relative rounded-xl overflow-hidden border border-gray-800">
      {/* CONTROLES OSINT */}
      <div className="absolute top-2 left-2 z-10 space-y-1 text-xs">
        {Object.entries(layers).map(([key, value]) => (
          <button
            key={key}
            onClick={() =>
              setLayers(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
            }
            className={`block px-2 py-1 rounded border ${
              value
                ? "bg-black/80 text-gray-200 border-gray-700"
                : "bg-black/40 text-gray-500 border-gray-800"
            }`}
          >
            {key.toUpperCase()}
          </button>
        ))}
      </div>

      <div ref={containerRef} className="h-[420px] w-full" />
    </section>
  )
}

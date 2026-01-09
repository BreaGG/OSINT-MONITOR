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
        const p = e.features?.[0]?.properties as any

        new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: true,
          offset: {
            top: [0, 12],
            bottom: [0, -12],
            left: [12, 0],
            right: [-12, 0],
          },
        })

          .setLngLat(e.lngLat)
          .setHTML(
            popup(`
    <div style="font-size:12px;line-height:1.3">

      <!-- HEADER -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
        <div style="font-weight:600;font-size:13px;max-width:200px">
          ${p.title}
        </div>
        <div style="font-size:11px;color:#9ca3af;white-space:nowrap">
          ${p.country}
        </div>
      </div>

      <!-- CATEGORY -->
      <div style="font-size:11px;color:${p.color};margin-bottom:6px">
        ${categoryColors[p.category as CategoryKey].label}
      </div>

      <div style="height:1px;background:#e5e7eb;opacity:0.25;margin:6px 0"></div>

      <!-- LINK -->
<a
  href="/event/${encodeURIComponent(p.id)}"
  style="
    display:block;
    padding:4px 6px;
    font-size:11px;
    color:#ffffff;
    text-decoration:none;
    border-radius:4px;
  "
  onmouseover="
    this.style.background='rgba(255,255,255,0.06)';
    this.style.textDecoration='underline';
  "
  onmouseout="
    this.style.background='transparent';
    this.style.textDecoration='none';
  "
>
  View details →
</a>


    </div>
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

        new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: true,
          offset: {
            top: [0, 12],
            bottom: [0, -12],
            left: [12, 0],
            right: [-12, 0],
          },
        })

          .setLngLat(e.lngLat)
          .setHTML(
            popup(`
    <div style="font-size:12px;line-height:1.3">

      <!-- HEADER -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
        <div style="font-weight:600;font-size:14px">
          ${p.name}
        </div>
        <div style="font-size:11px;color:#9ca3af;white-space:nowrap">
          ${p.status}
        </div>
      </div>

      <!-- SUMMARY -->
      <div style="font-size:11px;color:#d1d5db;margin-bottom:6px">
        ${p.summary}
      </div>

      <div style="height:1px;background:#e5e7eb;opacity:0.25;margin:6px 0"></div>

      <!-- ENTITIES -->
      <div style="font-size:11px;margin-bottom:6px">
        <span style="color:#9ca3af">Key entities</span><br/>
        ${p.entities}
      </div>

      <div style="height:1px;background:#e5e7eb;opacity:0.25;margin:6px 0"></div>

      <!-- HEADLINES -->
      <div style="font-size:11px">
        <div style="color:#9ca3af;margin-bottom:2px">
          Related headlines
        </div>
        <ul style="margin:0;padding-left:14px">
          ${relatedHeadlines(events, p.country)}
        </ul>
      </div>

    </div>
  `)
          )
          .addTo(map)
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

        new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: true,
          offset: {
            top: [0, 12],
            bottom: [0, -12],
            left: [12, 0],
            right: [-12, 0],
          },
        })

          .setLngLat(e.lngLat)
          .setHTML(
            popup(`
    <div style="font-size:12px;line-height:1.3">

      <!-- HEADER -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
        <div style="font-weight:600;font-size:14px">
          ${p.name}
        </div>
        <div style="font-size:11px;color:#9ca3af;white-space:nowrap">
          ${p.status}
        </div>
      </div>

      <!-- SUMMARY -->
      <div style="font-size:11px;color:#d1d5db;margin-bottom:6px">
        ${p.summary}
      </div>

      <div style="height:1px;background:#e5e7eb;opacity:0.25;margin:6px 0"></div>

      <!-- HEADLINES -->
      <div style="font-size:11px">
        <div style="color:#9ca3af;margin-bottom:2px">
          Related headlines
        </div>
        <ul style="margin:0;padding-left:14px">
          ${relatedHeadlines(events, p.country)}
        </ul>
      </div>

    </div>
  `)
          )
          .addTo(map)
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

        new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: true,
          offset: {
            top: [0, 12],
            bottom: [0, -12],
            left: [12, 0],
            right: [-12, 0],
          },
        })

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
      <div className="absolute top-2 left-2 z-10 space-y-1 text-xs">
        {Object.entries(layers).map(([key, value]) => (
          <button
            key={key}
            onClick={() =>
              setLayers(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
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

      <div ref={containerRef} className="h-[420px] w-full" />
    </section>
  )
}

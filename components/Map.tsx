"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"
import { strategicPoints } from "@/lib/strategicPoints"
import { strategicChokepoints } from "@/lib/strategicChokepoints"
import { activeConflicts } from "@/lib/activeConflicts"

type Props = {
    events: Event[]
}

/* ===================== TYPE GUARD ===================== */

function hasCoordinates(
    event: Event
): event is Event & { lat: number; lon: number } {
    return typeof event.lat === "number" && typeof event.lon === "number"
}

/* ===================== ICONS (SIN CAMBIOS) ===================== */

function eventIcon(color: string) {
    return L.divIcon({
        className: "",
        html: `
      <div style="
        background:${color};
        opacity:0.85;
        width:12px;
        height:12px;
        border-radius:50%;
        border:1.5px solid rgba(255,255,255,0.8);
        box-shadow:0 0 3px rgba(0,0,0,0.7);
      "></div>
    `,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
    })
}

function strategicIcon(level: "LOW" | "MEDIUM" | "HIGH") {
    const color =
        level === "HIGH"
            ? "#7f1d1d"
            : level === "MEDIUM"
                ? "#92400e"
                : "#365314"

    return L.divIcon({
        className: "",
        html: `
      <div style="
        background:${color};
        width:16px;
        height:16px;
        border-radius:3px;
        border:1.5px solid rgba(255,255,255,0.7);
        box-shadow:0 0 5px rgba(0,0,0,0.8);
      "></div>
    `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    })
}

function chokepointIcon() {
    return L.divIcon({
        className: "",
        html: `
      <div style="
        background:#334155;
        width:14px;
        height:14px;
        transform:rotate(45deg);
        border:1.5px solid rgba(255,255,255,0.7);
        box-shadow:0 0 5px rgba(0,0,0,0.8);
      "></div>
    `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
    })
}

function conflictIcon(label: string) {
    return L.divIcon({
        className: "",
        html: `
      <div style="
        display:inline-block;
        background:#7f1d1d;
        color:#fef2f2;
        padding:4px 8px;
        font-size:9px;
        font-weight:600;
        border:1px solid rgba(255,255,255,0.9);
        box-shadow:0 0 8px rgba(0,0,0,0.9);
        white-space:nowrap;
        transform: translate(-50%, -50%);
      ">
        ${label}
      </div>
    `,
    })
}

function labelIcon(text: string) {
    return L.divIcon({
        className: "",
        html: `
      <div style="
        display:inline-block;
        font-size:10px;
        line-height:1.2;
        color:#111827;
        background:rgba(243,244,246,0.9);
        padding:3px 6px;
        border-radius:3px;
        white-space:nowrap;
        pointer-events:none;
        transform: translateY(18px);
      ">
        ${text}
      </div>
    `,
        iconAnchor: [0, 0],
    })
}


/* ===================== HELPERS ===================== */

function popup(content: string) {
    return `
    <div style="
      background:#020617;
      color:#e5e7eb;
      padding:12px;
      border-radius:8px;
      max-width:260px;
      font-size:13px;
    ">
      ${content}
    </div>
  `
}

/* ===================== HOT ZONES ===================== */

/**
 * Agrupa eventos por proximidad simple (grid rough)
 * y genera zonas calientes OSINT-style
 */
function computeHotZones(events: Event[]) {
    const zones: { lat: number; lon: number; count: number }[] = []

    events.filter(hasCoordinates).forEach(e => {
        const found = zones.find(
            z => Math.abs(z.lat - e.lat) < 5 && Math.abs(z.lon - e.lon) < 5
        )

        if (found) {
            found.count++
        } else {
            zones.push({ lat: e.lat, lon: e.lon, count: 1 })
        }
    })

    return zones.filter(z => z.count >= 3)
}

/* ===================== COMPONENT ===================== */

export default function Map({ events }: Props) {
    const mapRef = useRef<L.Map | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (mapRef.current || !containerRef.current) return

        const map = L.map(containerRef.current, {
            zoomControl: false,
            attributionControl: false,
            minZoom: 2,
            maxZoom: 6,
        }).setView([20, 0], 2)


        /* === OSINT BASEMAP (sobrio, no chillón) === */
        L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            {
                maxZoom: 6,
            }
        ).addTo(map)

        L.control.zoom({ position: "bottomright" }).addTo(map)



        /* ===================== LAYERS ===================== */

        const eventsLayer = L.layerGroup().addTo(map)
        const capitalsLayer = L.layerGroup().addTo(map)
        const chokepointsLayer = L.layerGroup().addTo(map)
        const conflictsLayer = L.layerGroup().addTo(map)
        const hotZonesLayer = L.layerGroup().addTo(map)

        /* ===================== EVENTS ===================== */

        events.filter(hasCoordinates).forEach(event => {
            const color = categoryColors[event.category]?.color ?? "#6b7280"

            L.marker([event.lat, event.lon], { icon: eventIcon(color) })
                .bindPopup(
                    popup(`
            <strong>${event.title}</strong><br/>
            <span style="color:#9ca3af;font-size:12px">${event.country}</span><br/>
            <span style="color:${color};font-size:12px">
              ${categoryColors[event.category]?.label}
            </span>
          `)
                )
                .addTo(eventsLayer)
        })

        /* ===================== HOT ZONES ===================== */

        computeHotZones(events).forEach(zone => {
            L.circle([zone.lat, zone.lon], {
                radius: 180000 + zone.count * 50000,
                color: "#991b1b",
                fillColor: "#991b1b",
                fillOpacity: 0.08,
                weight: 1,
                dashArray: "4 6",
            })
                .bindPopup(
                    popup(`
        <strong>Hot zone</strong><br/>
        <span style="color:#fca5a5">
          ${zone.count} recent events
        </span>
      `)
                )
                .addTo(hotZonesLayer)
        })


        /* ===================== CAPITALS ===================== */

        strategicPoints.forEach(point => {
            L.marker([point.lat, point.lon], {
                icon: strategicIcon(point.level),
            })
                .bindPopup(
                    popup(`
        <strong>${point.name}</strong><br/>
        <span style="color:#9ca3af;font-size:12px">
          ${point.summary}
        </span>
      `)
                )
                .addTo(capitalsLayer)

            L.marker([point.lat, point.lon], {
                icon: labelIcon(point.name),
                interactive: false,
            }).addTo(capitalsLayer)
        })


        /* ===================== CHOKEPOINTS ===================== */

        strategicChokepoints.forEach(point => {
            L.marker([point.lat, point.lon], {
                icon: chokepointIcon(),
            })
                .bindPopup(
                    popup(`
        <strong>${point.name}</strong><br/>
        <span style="color:#9ca3af;font-size:12px">
          ${point.summary}
        </span>
      `)
                )
                .addTo(chokepointsLayer)

            L.marker([point.lat, point.lon], {
                icon: labelIcon(point.name),
                interactive: false,
            }).addTo(chokepointsLayer)
        })


        /* ===================== CONFLICTS ===================== */

        activeConflicts.forEach(conflict => {
            L.marker([conflict.lat, conflict.lon], {
                icon: conflictIcon(conflict.name),
            })
                .bindPopup(
                    popup(`
            <strong>${conflict.name}</strong><br/>
            <span style="color:#fca5a5;font-size:12px">
              ${conflict.level} intensity
            </span>
          `)
                )
                .addTo(conflictsLayer)
        })

        /* ===================== LAYER CONTROL ===================== */

        L.control
            .layers(
                {},
                {
                    "News events": eventsLayer,
                    "Hot zones": hotZonesLayer,
                    "Strategic capitals": capitalsLayer,
                    "Chokepoints": chokepointsLayer,
                    "Active conflicts": conflictsLayer,
                },
                { collapsed: true, position: "topright" }
            )
            .addTo(map)

        mapRef.current = map
        return () => {
            map.remove()
            mapRef.current = null
        }
    }, [events])

    return (
        <section className="bg-white rounded-xl overflow-hidden border border-gray-200">
            <div ref={containerRef} className="h-[420px] w-full" />
        </section>
    )
}

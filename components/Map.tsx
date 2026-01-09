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

/* ===================== ICONS ===================== */

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
      ? "#7f1d1d"   // dark crimson
      : level === "MEDIUM"
      ? "#92400e"   // muted amber
      : "#365314"   // olive green

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
        background:#334155; /* steel blue */
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

/* 🔹 LABEL DISCRETO (CAPITALES / CHOKEPOINTS) */
function labelIcon(text: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        margin-top:20px;
        font-size:10px;
        color:#111827;
        background:rgba(243,244,246,0.85);
        padding:2px 5px;
        border-radius:3px;
        white-space:nowrap;
        pointer-events:none;
      ">
        ${text}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [-6, -6],
  })
}


/* ===================== HELPERS ===================== */

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

/* ===================== COMPONENT ===================== */

export default function Map({ events }: Props) {
    const mapRef = useRef<L.Map | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (mapRef.current || !containerRef.current) return

        const map = L.map(containerRef.current, {
            zoomControl: false,
            attributionControl: false,
        }).setView([20, 0], 2)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map)
        L.control.zoom({ position: "bottomright" }).addTo(map)

        /* EVENTS */
        events.filter(hasCoordinates).forEach(event => {
            const color = categoryColors[event.category]?.color ?? "#6b7280"

            L.marker([event.lat, event.lon], { icon: eventIcon(color) })
                .addTo(map)
                .bindPopup(
                    popup(`
            <strong>${event.title}</strong><br/>
            <span style="color:#9ca3af;font-size:12px">${event.country}</span><br/>
            <span style="color:${color};font-size:12px">
              ${categoryColors[event.category]?.label}
            </span><br/><br/>
            <a href="/event/${encodeURIComponent(event.id)}"
               style="color:#60a5fa;text-decoration:underline;font-size:12px">
              View details →
            </a>
          `)
                )
        })

        /* CAPITALS */
        strategicPoints.forEach(point => {
            L.marker([point.lat, point.lon], { icon: strategicIcon(point.level) })
                .addTo(map)
                .bindPopup(
                    popup(`
            <strong>${point.name}</strong><br/>
            <span style="color:#9ca3af;font-size:12px">${point.summary}</span><br/><br/>
            <strong>Status:</strong> ${point.status}<br/>
            <strong>Key entities:</strong> ${point.entities.join(", ")}<br/><br/>
            <strong>Related headlines:</strong>
            <ul>${relatedHeadlines(events, point.country)}</ul>
          `)
                )

            L.marker([point.lat, point.lon], {
                icon: labelIcon(point.name),
                interactive: false,
            }).addTo(map)
        })

        /* CHOKEPOINTS */
        strategicChokepoints.forEach(point => {
            L.marker([point.lat, point.lon], { icon: chokepointIcon() })
                .addTo(map)
                .bindPopup(
                    popup(`
            <strong>${point.name}</strong><br/>
            <span style="color:#9ca3af;font-size:12px">${point.summary}</span><br/><br/>
            <strong>Status:</strong> ${point.status}<br/><br/>
            <strong>Related headlines:</strong>
            <ul>${relatedHeadlines(events, point.country)}</ul>
          `)
                )

            L.marker([point.lat, point.lon], {
                icon: labelIcon(point.name),
                interactive: false,
            }).addTo(map)
        })

        /* ACTIVE CONFLICTS */
        activeConflicts.forEach(conflict => {
            L.marker([conflict.lat, conflict.lon], {
                icon: conflictIcon(conflict.name),
            })
                .addTo(map)
                .bindPopup(
                    popup(`
            <strong>${conflict.name}</strong><br/>
            <span style="color:#fca5a5;font-size:12px">
              ${conflict.level} intensity
            </span><br/><br/>

            <strong>Start date:</strong> ${conflict.startDate}<br/>
            <strong>Casualties:</strong> ${conflict.casualties}<br/>
            <strong>Displaced:</strong> ${conflict.displaced}<br/><br/>

            <p style="font-size:12px;color:#d1d5db">
              ${conflict.description}
            </p>

            <strong>Belligerents:</strong>
            <ul>${conflict.belligerents.map(b => `<li>${b}</li>`).join("")}</ul>

            <strong>Key developments:</strong>
            <ul>${conflict.developments.map(d => `<li>${d}</li>`).join("")}</ul>
          `)
                )
        })

        mapRef.current = map
        return () => {
            map.remove()
            mapRef.current = null
        }
    }, [events])

    return (
        <section className="bg-white rounded-xl overflow-hidden border border-gray-200">
            <div ref={containerRef} className="h-[400px] w-full" />
        </section>
    )
}

"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"
import { strategicPoints } from "@/lib/strategicPoints"
import { strategicChokepoints } from "@/lib/strategicChokepoints"

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
        width:14px;
        height:14px;
        border-radius:50%;
        border:2px solid white;
        box-shadow:0 0 4px rgba(0,0,0,0.6);
      "></div>
    `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
    })
}

function strategicIcon(level: "LOW" | "MEDIUM" | "HIGH") {
    const color =
        level === "HIGH"
            ? "#dc2626"
            : level === "MEDIUM"
                ? "#f59e0b"
                : "#10b981"

    return L.divIcon({
        className: "",
        html: `
      <div style="
        background:${color};
        width:18px;
        height:18px;
        border-radius:4px;
        border:2px solid white;
        box-shadow:0 0 6px rgba(0,0,0,0.7);
      "></div>
    `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
    })
}

function chokepointIcon() {
    return L.divIcon({
        className: "",
        html: `
      <div style="
        background:#2563eb;
        width:16px;
        height:16px;
        transform:rotate(45deg);
        border:2px solid white;
        box-shadow:0 0 6px rgba(0,0,0,0.7);
      "></div>
    `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    })
}

function labelIcon(text: string) {
    return L.divIcon({
        className: "",
        html: `
      <div style="
        margin-top:22px;
        font-size:11px;
        color:#111827;
        background:rgba(255,255,255,0.85);
        padding:2px 4px;
        border-radius:4px;
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
        return "<li>No recent headlines</li>"
    }

    return items
        .map(
            e => `
      <li>
        <a href="/event/${encodeURIComponent(e.id)}"
           style="color:#2563eb;text-decoration:underline;font-size:12px">
          ${e.title}
        </a>
      </li>`
        )
        .join("")
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

        // 🌍 MAPA CLARO Y LEGIBLE
        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        ).addTo(map)

        L.control.zoom({ position: "bottomright" }).addTo(map)

        /* ===================== EVENTS ===================== */

        events.filter(hasCoordinates).forEach(event => {
            const color =
                categoryColors[event.category]?.color ?? "#6b7280"

            L.marker([event.lat, event.lon], {
                icon: eventIcon(color),
            })
                .addTo(map)
                .bindPopup(`
          <strong>${event.title}</strong><br/>
          <span style="font-size:12px;color:#6b7280">
            ${event.country}
          </span><br/>
          <span style="font-size:12px;color:${color}">
            ${categoryColors[event.category]?.label ?? event.category}
          </span><br/><br/>
          <a
            href="/event/${encodeURIComponent(event.id)}"
            style="font-size:12px;color:#2563eb;text-decoration:underline"
          >
            View details →
          </a>
        `)
        })

        /* ===================== CAPITALS ===================== */

        strategicPoints.forEach(point => {
            L.marker([point.lat, point.lon], {
                icon: strategicIcon(point.level),
            })
                .addTo(map)
                .bindPopup(`
          <strong>${point.name}</strong><br/>
          <small>${point.summary}</small><br/><br/>
          <strong>Status:</strong> ${point.status}<br/>
          <strong>Key entities:</strong> ${point.entities.join(", ")}<br/><br/>
          <strong>Related headlines:</strong>
          <ul>${relatedHeadlines(events, point.country)}</ul>
        `)

            L.marker([point.lat, point.lon], {
                icon: labelIcon(point.name),
                interactive: false,
            }).addTo(map)
        })

        /* ===================== CHOKEPOINTS ===================== */

        strategicChokepoints.forEach(point => {
            L.marker([point.lat, point.lon], {
                icon: chokepointIcon(),
            })
                .addTo(map)
                .bindPopup(`
          <strong>${point.name}</strong><br/>
          <small>${point.summary}</small><br/><br/>
          <strong>Status:</strong> ${point.status}<br/><br/>
          <strong>Related headlines:</strong>
          <ul>${relatedHeadlines(events, point.country)}</ul>
        `)

            L.marker([point.lat, point.lon], {
                icon: labelIcon(point.name),
                interactive: false,
            }).addTo(map)
        })

        mapRef.current = map
        return () => {
            map.remove()
            mapRef.current = null
        }
    }, [events])

    return (
        <section className="bg-white rounded-xl overflow-hidden border border-gray-200">
            <div
                ref={containerRef}
                className="h-[380px] w-full"
            />
        </section>
    )
}

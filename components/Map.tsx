"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"

type Props = {
    events: Event[]
}

// Type guard para TypeScript
function hasCoordinates(
    event: Event
): event is Event & { lat: number; lon: number } {
    return typeof event.lat === "number" && typeof event.lon === "number"
}

function markerIcon(color: string) {
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

export default function Map({ events }: Props) {
    const mapRef = useRef<L.Map | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (mapRef.current || !containerRef.current) return

        const map = L.map(containerRef.current, {
            zoomControl: false,
            attributionControl: false,
        }).setView([20, 0], 2)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
        }).addTo(map)

        L.control.zoom({ position: "bottomright" }).addTo(map)

        events
            .filter(hasCoordinates)
            .forEach(event => {
                const color =
                    categoryColors[event.category]?.color ?? "#6b7280"

                const marker = L.marker(
                    [event.lat, event.lon],
                    { icon: markerIcon(color) }
                ).addTo(map)

                marker.bindPopup(`
          <strong>${event.title}</strong><br/>
          ${event.country}<br/>
          <span style="font-size:12px;color:${color}">
            ${categoryColors[event.category]?.label ?? event.category}
          </span>
        `)
            })

        mapRef.current = map

        return () => {
            map.remove()
            mapRef.current = null
        }
    }, [events])

    return (
        <section className="bg-gray-900 border border-gray-800 rounded-xl shadow-sm">
            {/* MAPA */}
            <div
                ref={containerRef}
                className="h-[300px] w-full rounded-t-xl overflow-hidden"
            />

            {/* LEYENDA */}
            <div className="flex flex-wrap gap-4 px-4 py-3 border-t border-gray-800 text-xs text-gray-300">
                {Object.entries(categoryColors).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                        <span
                            className="inline-block w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: value.color }}
                        />
                        <span>{value.label}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}

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
    return (
        typeof event.lat === "number" &&
        typeof event.lon === "number"
    )
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
        box-shadow:0 0 2px rgba(0,0,0,0.6);
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

        const map = L.map(containerRef.current).setView([20, 0], 2)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
        }).addTo(map)

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
        <div>
            <div
                ref={containerRef}
                className="h-[500px] w-full rounded"
            />

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
                {Object.entries(categoryColors).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-1">
                        <span
                            className="inline-block w-3 h-3 rounded-full"
                            style={{ backgroundColor: value.color }}
                        />
                        {value.label}
                    </div>
                ))}
            </div>
        </div>
    )
}

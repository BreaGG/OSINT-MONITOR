"use client"

import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"
import { strategicPoints } from "@/lib/strategicPoints"
import { strategicChokepoints } from "@/lib/strategicChokepoints"
import { activeConflicts } from "@/lib/activeConflicts"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

type Props = {
    events: Event[]
}

/* ===================== HELPERS ===================== */

function hasCoordinates(
    e: Event
): e is Event & { lat: number; lon: number } {
    return typeof e.lat === "number" && typeof e.lon === "number"
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

export default function MapboxMap({ events }: Props) {
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (mapRef.current || !containerRef.current) return

        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: "mapbox://styles/mapbox/dark-v11", // BASE (luego lo customizas)
            center: [0, 20],
            zoom: 1.6,
            minZoom: 1.2,
            maxZoom: 6,
            attributionControl: false,
        })

        map.addControl(new mapboxgl.NavigationControl(), "bottom-right")

        map.on("load", () => {
            /* ===================== EVENTS ===================== */

            const eventsGeoJSON = {
                type: "FeatureCollection",
                features: events
                    .filter(hasCoordinates)
                    .map(e => ({
                        type: "Feature",
                        properties: {
                            title: e.title,
                            category: e.category,
                            color: categoryColors[e.category]?.color ?? "#6b7280",
                        },
                        geometry: {
                            type: "Point",
                            coordinates: [e.lon, e.lat],
                        },
                    })),
            }

            map.addSource("events", {
                type: "geojson",
                data: eventsGeoJSON as any,
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

            /* ===================== HOT ZONES ===================== */

            const hotZonesGeoJSON = {
                type: "FeatureCollection",
                features: computeHotZones(events).map(z => ({
                    type: "Feature",
                    properties: {
                        count: z.count,
                    },
                    geometry: {
                        type: "Point",
                        coordinates: [z.lon, z.lat],
                    },
                })),
            }

            map.addSource("hot-zones", {
                type: "geojson",
                data: hotZonesGeoJSON as any,
            })

            map.addLayer({
                id: "hot-zones-layer",
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
                    "circle-opacity": 0.15,
                    "circle-stroke-color": "#991b1b",
                    "circle-stroke-width": 1,
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
                            name: p.name,
                            level: p.level,
                        },
                        geometry: {
                            type: "Point",
                            coordinates: [p.lon, p.lat],
                        },
                    })),
                } as any,
            })

            map.addLayer({
                id: "capitals-layer",
                type: "symbol",
                source: "capitals",
                layout: {
                    "text-field": ["get", "name"],
                    "text-size": 10,
                    "text-offset": [0, 1.2],
                    "text-anchor": "top",
                },
                paint: {
                    "text-color": "#e5e7eb",
                    "text-halo-color": "#020617",
                    "text-halo-width": 1,
                },
            })

            /* ===================== CHOKEPOINTS ===================== */

            map.addSource("chokepoints", {
                type: "geojson",
                data: {
                    type: "FeatureCollection",
                    features: strategicChokepoints.map(p => ({
                        type: "Feature",
                        properties: {
                            name: p.name,
                        },
                        geometry: {
                            type: "Point",
                            coordinates: [p.lon, p.lat],
                        },
                    })),
                } as any,
            })

            map.addLayer({
                id: "chokepoints-layer",
                type: "symbol",
                source: "chokepoints",
                layout: {
                    "text-field": ["get", "name"],
                    "text-size": 10,
                    "text-offset": [0, 1.2],
                    "text-anchor": "top",
                },
                paint: {
                    "text-color": "#93c5fd",
                    "text-halo-color": "#020617",
                    "text-halo-width": 1,
                },
            })

            /* ===================== CONFLICTS ===================== */

            map.addSource("conflicts", {
                type: "geojson",
                data: {
                    type: "FeatureCollection",
                    features: activeConflicts.map(c => ({
                        type: "Feature",
                        properties: {
                            name: c.name,
                        },
                        geometry: {
                            type: "Point",
                            coordinates: [c.lon, c.lat],
                        },
                    })),
                } as any,
            })

            map.addLayer({
                id: "conflicts-layer",
                type: "symbol",
                source: "conflicts",
                layout: {
                    "text-field": ["get", "name"],
                    "text-size": 11,
                    "text-anchor": "center",
                },
                paint: {
                    "text-color": "#fecaca",
                    "text-halo-color": "#7f1d1d",
                    "text-halo-width": 1.5,
                },
            })
        })

        mapRef.current = map
        return () => {
            map.remove()
            mapRef.current = null
        }
    }, [events])

    return (
        <section className="rounded-xl overflow-hidden border border-gray-800">
            <div ref={containerRef} className="h-[420px] w-full" />
        </section>
    )
}

"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import EventList from "@/components/EventList"
import { Event } from "@/lib/types"
import Stream from "@/components/Stream"
import MarketSnapshot from "@/components/MarketSnapshot"
import MapLegend from "@/components/MapLegend"
import LegendInsights from "@/components/LegendInsights"

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
})

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("all")
  const [country, setCountry] = useState("all")

  useEffect(() => {
    fetch("/api/events")
      .then(res => res.json())
      .then(data => {
        setEvents(data)
        setLoading(false)
      })
  }, [])

  const filteredEvents = events.filter(event => {
    const categoryMatch =
      category === "all" || event.category === category

    const countryMatch =
      country === "all" || event.country === country

    return categoryMatch && countryMatch
  })

  const countries = Array.from(
    new Set(
      events
        .map(e => e.country)
        .filter(c => c && c !== "Unknown")
    )
  ).sort()

  const lastUpdated = useMemo(() => {
  const now = new Date()
  return now.toLocaleTimeString()
  }, [])


  return (
    <main className="p-6 max-w-[1600px] mx-auto h-screen flex flex-col">
      <div className="flex items-baseline gap-3 mb-4">
        <h1 className="text-2xl font-bold">
          Global OSINT Monitor
        </h1>

        <span className="text-xs text-gray-400">
          Updated {lastUpdated} · Daily update at 02:00 UTC
        </span>
      </div>

      {/* FILTROS */}
      <div className="flex gap-4 mb-4">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Categorys</option>
          <option value="conflict">Conflict</option>
          <option value="disaster">Disaster</option>
          <option value="politics">Politic</option>
          <option value="health">Health</option>
        </select>

        <select
          value={country}
          onChange={e => setCountry(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Countrys</option>
          {countries.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* LAYOUT PRINCIPAL */}
      <div className="flex flex-1 min-h-0 gap-6">
        {/* LEYENDA (FUERA DEL GRID) */}
        <aside className="w-30 flex flex-col gap-6 shrink-0">
          <MapLegend />
          <LegendInsights events={filteredEvents} />
        </aside>


        {/* GRID CENTRAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* MAPA + STREAM */}
          <section>
            <Map events={filteredEvents} />
            <Stream />
          </section>

          {/* MARKET + FEED */}
          <section className="flex flex-col flex-1 min-h-0 space-y-4">
            <MarketSnapshot />

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <p>Loading events...</p>
              ) : (
                <EventList events={filteredEvents} />
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

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
  const [search, setSearch] = useState("")

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

    const searchMatch =
      search === "" ||
      event.title.toLowerCase().includes(search.toLowerCase())

    return categoryMatch && countryMatch && searchMatch
  })



  const countries = Array.from(
    new Set(
      events
        .map(e => e.country)
        .filter(c => c && c !== "Unknown")
    )
  ).sort()

  const lastUpdated = useMemo(() => {
    return new Date().toLocaleTimeString()
  }, [])

  return (
    <main className="p-6 max-w-[1600px] mx-auto h-screen flex flex-col">
      {/* HEADER: TITLE + FILTERS */}
      <div className="flex items-center justify-between mb-4 gap-6">
        {/* TITLE */}
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold">
            Global OSINT Monitor
          </h1>

          <span className="text-xs text-gray-400">
            Updated {lastUpdated} · Daily update at 02:00 UTC
          </span>
        </div>

        {/* FILTERS */}
        <div className="flex items-center gap-3">
          {/* CATEGORY */}
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="bg-black text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          >
            <option value="all">All categories</option>
            <option value="conflict">Conflict</option>
            <option value="disaster">Disaster</option>
            <option value="politics">Politics</option>
            <option value="health">Health</option>
          </select>

          {/* COUNTRY */}
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="bg-black text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          >
            <option value="all">All countries</option>
            {countries.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search headline…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-black text-white border border-gray-700 rounded px-3 py-2 text-sm w-56 placeholder-gray-500 focus:outline-none focus:border-gray-400" />
        </div>

      </div>

      {/* LAYOUT PRINCIPAL */}
      <div className="flex flex-1 min-h-0 gap-5 overflow-hidden">
        {/* LEYENDA + INSIGHTS */}
        <aside className="w-32 flex flex-col gap-0 shrink-0">
          <MapLegend />
          <LegendInsights events={filteredEvents} />
        </aside>

        {/* GRID CENTRAL */}
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_0.4fr] gap-6 flex-1 min-h-0 overflow-hidden">

          {/* MAPA + STREAM */}
          <section className="flex flex-col min-h-0 gap-2">

            {/* MAPA – protagonista absoluto */}
            <div className="flex-shrink-0">
              <Map events={filteredEvents} />
            </div>

            {/* STREAM – claramente secundario */}
            <div className="flex-shrink-0">
              <Stream />
            </div>
          </section>

          {/* MARKET + FEED */}
          <section className="flex flex-col min-h-0 space-y-3">
            <MarketSnapshot />

            {/* FEED CON SCROLL INDEPENDIENTE */}
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

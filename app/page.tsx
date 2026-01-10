"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import EventList from "@/components/EventList"
import { Event } from "@/lib/types"
import Stream from "@/components/Stream"
import MarketSnapshot from "@/components/MarketSnapshot"
import MapLegend from "@/components/MapLegend"
import LegendInsights from "@/components/LegendInsights"
import MapboxMap from "@/components/MapboxMap"
import NewAndEscalatingPanel from "@/components/NewAndEscalatingPanel"

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
})

/* ===================== PRESETS ===================== */

type Preset = "all" | "conflicts" | "strategic"

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  /* ===== filters ===== */
  const [category, setCategory] = useState("all")
  const [country, setCountry] = useState("all")
  const [search, setSearch] = useState("")

  /* ===== presets ===== */
  const [preset, setPreset] = useState<Preset>("all")

  /* ===================== DATA ===================== */

  useEffect(() => {
    fetch("/api/events")
      .then(res => res.json())
      .then(data => {
        setEvents(data)
        setLoading(false)
      })
  }, [])

  /* ===================== PRESET LOGIC ===================== */

  useEffect(() => {
    if (preset === "all") {
      setCategory("all")
      setCountry("all")
      return
    }

    if (preset === "conflicts") {
      setCategory("conflict")
      setCountry("all")
      return
    }

    if (preset === "strategic") {
      setCategory("politics")
      setCountry("all")
      return
    }
  }, [preset])

  /* ===================== FILTERING ===================== */

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

  /* ===================== AUX DATA ===================== */

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

  /* ===================== RENDER ===================== */

  return (
    <main className="p-4 lg:p-6 max-w-[1600px] mx-auto h-screen flex flex-col">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-3">
        <div className="flex gap-3 overflow-hidden items-center whitespace-nowrap lg:items-baseline lg:whitespace-normal">
          <h1 className="text-lg font-semibold shrink-0 lg:text-2xl lg:font-bold">
            Global OSINT Monitor
          </h1>

          <span className="text-[11px] text-gray-400 truncate lg:text-xs lg:truncate-none">
            Updated {lastUpdated} · Daily update at 02:00 UTC
          </span>
        </div>

        {/* FILTERS (desktop only) */}
        <div className="hidden lg:flex items-center gap-4">
          {/* PRESETS */}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            {(["all", "conflicts", "strategic"] as Preset[]).map(p => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`px-2 py-1 rounded border ${
                  preset === p
                    ? "border-gray-500 text-gray-200"
                    : "border-gray-800 hover:border-gray-600"
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          {/* CATEGORY */}
          <select
            value={category}
            onChange={e => {
              setPreset("all")
              setCategory(e.target.value)
            }}
            className="bg-black text-white border border-gray-700 rounded px-3 py-2 text-sm"
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
            onChange={e => {
              setPreset("all")
              setCountry(e.target.value)
            }}
            className="bg-black text-white border border-gray-700 rounded px-3 py-2 text-sm"
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
            onChange={e => {
              setPreset("all")
              setSearch(e.target.value)
            }}
            className="bg-black text-white border border-gray-700 rounded px-3 py-2 text-sm w-56"
          />
        </div>
      </div>

      {/* MOBILE PRESETS */}
      <div className="flex lg:hidden gap-2 mb-3 text-xs text-gray-400">
        {(["all", "conflicts", "strategic"] as Preset[]).map(p => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={`px-2 py-1 rounded border ${
              preset === p
                ? "border-gray-500 text-gray-200"
                : "border-gray-800"
            }`}
          >
            {p.toUpperCase()}
          </button>
        ))}
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-5 overflow-hidden">

        {/* SIDEBAR (desktop only) */}
        <aside className="hidden lg:flex w-38 flex-col gap-1 shrink-0">
          <MapLegend />
          <LegendInsights events={filteredEvents} />
        </aside>

        {/* CENTER + RIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-5 flex-1 min-h-0 overflow-hidden">

          {/* MAP COLUMN */}
          <section className="flex flex-col min-h-0 gap-3 order-1">
            <MapboxMap events={filteredEvents} />

            {/* STREAM + PANEL (desktop only) */}
            <div className="hidden lg:grid grid-cols-[2fr_1fr] gap-3 h-[420px]">
              <div className="rounded-lg overflow-hidden">
                <Stream />
              </div>
              <div className="rounded-lg bg-black/40">
                <NewAndEscalatingPanel
                  events={filteredEvents}
                  preset={preset}
                />
              </div>
            </div>
          </section>

          {/* MARKET + FEED */}
          <section className="flex flex-col min-h-0 space-y-3 order-2">
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

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
import FocusTimeline from "@/components/FocusTimeline"
import { categoryColors } from "@/lib/categoryColors"

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
})

/* ===================== PRESETS ===================== */

type Preset = "all" | "conflicts" | "strategic"

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  /* ===== analytical focus ===== */
  const [focusRegion, setFocusRegion] = useState<string | null>(null)
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)

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

  /* ===================== ANALYTICAL FOCUS ===================== */

  const finalEvents = useMemo(() => {
    if (!focusRegion) return filteredEvents

    return filteredEvents.filter(
      e => e.country === focusRegion || focusRegion === "Global"
    )
  }, [filteredEvents, focusRegion])

  /* ===================== AUX DATA ===================== */

  const countries = Array.from(
    new Set(
      events
        .map(e => e.country)
        .filter(c => c && c !== "Unknown")
    )
  ).sort()

  const categories = Array.from(
    new Set(
      events
        .map(e => e.category)
        .filter(c => c && c !== "sports")
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
        <div className="flex gap-3 items-center flex-wrap">
          <h1 className="text-lg font-semibold lg:text-2xl lg:font-bold">
            Global OSINT Monitor
          </h1>

          <span className="text-[11px] text-gray-400">
            Updated {lastUpdated} · Daily update at 02:00 UTC
          </span>

          {/* FOCUS INDICATOR */}
          {focusRegion && (
            <span
              onClick={() => setFocusRegion(null)}
              className="ml-2 text-[11px] text-gray-300 cursor-pointer border border-gray-700 px-2 py-0.5 rounded hover:bg-black/40"
            >
              Focus: {focusRegion} ×
            </span>
          )}
        </div>

        {/* FILTERS (desktop) */}
        <div className="hidden lg:flex items-center gap-4">

          {/* PRESETS */}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            {(["all", "conflicts", "strategic"] as Preset[]).map(p => (
              <button
                key={p}
                onClick={() => {
                  setPreset(p)
                  setFocusRegion(null)
                }}
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
              setFocusRegion(null)
              setCategory(e.target.value)
            }}
            className="bg-black text-white border border-gray-700 rounded px-3 py-2 text-sm"
          >
            <option value="all">All categories</option>

            {categories.map(c => (
              <option key={c} value={c}>
                {categoryColors[c as keyof typeof categoryColors]?.label ?? c}
              </option>
            ))}
          </select>


          {/* COUNTRY */}
          <select
            value={country}
            onChange={e => {
              setPreset("all")
              setFocusRegion(null)
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
              setFocusRegion(null)
              setSearch(e.target.value)
            }}
            className="bg-black text-white border border-gray-700 rounded px-3 py-2 text-sm w-56"
          />
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-5 overflow-hidden">

        {/* SIDEBAR */}
        <aside className="hidden lg:flex w-38 flex-col gap-1 shrink-0">
          <MapLegend />
          <LegendInsights events={filteredEvents} />
        </aside>

        {/* CENTER + RIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-5 flex-1 min-h-0 overflow-hidden">

          {/* MAP COLUMN */}
          <section className="flex flex-col min-h-0 gap-3">
            <MapboxMap
              events={filteredEvents}
              hoveredEventId={hoveredEventId}
            />
            <div className="hidden lg:grid grid-cols-[2fr_1fr] gap-3 h-[420px]">
              <div className="rounded-lg overflow-hidden">
                <Stream />
              </div>
              <div className="rounded-lg bg-black/40 flex flex-col gap-3 p-3 h-full">
              {/* TOP: SIGNALS */}
                <div className="rounded-lg bg-black/40 flex flex-col">
                  <NewAndEscalatingPanel
                    events={filteredEvents}
                    preset={preset}
                    onSelectRegion={setFocusRegion}
                  />
                </div>

                <div className="rounded-lg bg-black/40 flex flex-col">
                  <FocusTimeline
                    events={filteredEvents}
                    onSelectRegion={setFocusRegion}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* MARKET + FEED */}
          <section className="flex flex-col min-h-0 space-y-3">
            <MarketSnapshot />

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <p>Loading events...</p>
              ) : (
                <EventList
                  events={filteredEvents}
                  onHover={setHoveredEventId}
                />
              )}
            </div>
          </section>

        </div>
      </div>
    </main>
  )
}

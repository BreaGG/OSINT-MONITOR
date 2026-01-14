"use client"

import { useEffect, useState, useMemo } from "react"
import EventList from "@/components/EventList"
import { Event } from "@/lib/types"
import MarketSnapshot from "@/components/MarketSnapshot"
import MapLegend from "@/components/MapLegend"
import LegendInsights from "@/components/LegendInsights"
import MapboxMap from "@/components/MapboxMap"
import NewAndEscalatingPanel from "@/components/NewAndEscalatingPanel"
import FocusTimeline from "@/components/FocusTimeline"
import { categoryColors } from "@/lib/categoryColors"
import AdminIngestButton from "@/components/AdminIngestButton"
import VisualPanel from "@/components/VisualPanel"
import type { SatelliteFocus } from "@/components/SatelliteView"
import { buildGlobalState } from "@/lib/gse"
import { adaptEventsToGSE } from "@/lib/eventToGSE"
import GlobalStateIndicator from "@/components/GlobalStateIndicator"

/* ===================== PRESETS ===================== */

type Preset = "all" | "conflicts" | "strategic"

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [satelliteFocus, setSatelliteFocus] =
    useState<SatelliteFocus | undefined>(undefined)

  /* ===== analytical focus ===== */
  const [focusRegion, setFocusRegion] = useState<string | null>(null)

  /* ===== filters ===== */
  const [category, setCategory] = useState("all")
  const [country, setCountry] = useState("all")
  const [search, setSearch] = useState("")

  /* ===== presets ===== */
  const [preset, setPreset] = useState<Preset>("all")
  
  /* ===== mobile redirect ===== */
  useEffect(() => {
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      window.location.href = '/map'
    }
  }, [])

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
      events.map(e => e.category)
    )
  ).sort()

  const lastUpdated = useMemo(() => {
    return new Date().toLocaleTimeString()
  }, [])

  /* ===================== GLOBAL STATE ===================== */

  const globalState = useMemo(() => {
    if (events.length === 0) return null

    const gseEvents = adaptEventsToGSE(events)
    return buildGlobalState(gseEvents)
  }, [events])

  /* ===================== CLEAR FILTERS ===================== */
  
  const clearFilters = () => {
    setCategory("all")
    setCountry("all")
    setSearch("")
    setFocusRegion(null)
    setPreset("all")
  }

  const hasActiveFilters = category !== "all" || country !== "all" || search !== "" || focusRegion

  /* ===================== RENDER ===================== */

  return (
    <main className="p-4 lg:p-5 max-w-[1800px] mx-auto h-screen flex flex-col min-h-0 bg-black">

      {/* ===================== HEADER ===================== */}
      <header className="mb-3">
        
        {/* SINGLE ROW: TITLE + FILTERS */}
        <div className="flex items-center justify-between gap-4 p-3 bg-gray-950 border border-gray-900 rounded-lg">
          
          {/* LEFT: BRANDING + STATUS */}
          <div className="flex items-center gap-4">
            {/* TITLE */}
            <div className="flex flex-col leading-tight">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Global Intelligence Monitor
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-gray-600 uppercase tracking-wider">
                  OSINT
                </span>
                <span className="text-[10px] text-gray-700">•</span>
                <span className="text-[10px] text-gray-600">
                  {lastUpdated}
                </span>
                <span className="text-[10px] text-gray-700">•</span>
                {/* Event count badge */}
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-900 border border-gray-800 rounded">
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-medium text-gray-400">
                    {filteredEvents.length}
                  </span>
                </div>
              </div>
            </div>

            {/* SYSTEM STATUS */}
            {globalState && (
              <div className="h-6.5 border-l border-gray-800 pl-4">
                <GlobalStateIndicator state={globalState} />
              </div>
            )}

            {/* PRESETS */}
            <div className="flex items-center gap-1">
              {(["all", "conflicts", "strategic"] as Preset[]).map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setPreset(p)
                    setFocusRegion(null)
                  }}
                  className={`
                    px-2.5 py-1 rounded text-[11px] font-medium uppercase tracking-wide
                    transition-all
                    ${preset === p
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                      : "bg-black/50 text-gray-600 border border-gray-800 hover:border-gray-700 hover:text-gray-400"
                    }
                  `}
                >
                  {p === "all" && "All"}
                  {p === "conflicts" && "Conflicts"}
                  {p === "strategic" && "Strategic"}
                </button>
              ))}
            </div>

            {/* FOCUS INDICATOR */}
            {focusRegion && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded">
                <span className="text-[10px] text-purple-400 font-medium">
                  {focusRegion}
                </span>
                <button
                  onClick={() => setFocusRegion(null)}
                  className="text-purple-400 hover:text-purple-300 transition"
                >
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: FILTERS + CLEAR + ADMIN */}
          <div className="flex items-center gap-2">
            {/* CATEGORY */}
            <select
              value={category}
              onChange={e => {
                setPreset("all")
                setFocusRegion(null)
                setCategory(e.target.value)
              }}
              className="
                bg-black/80 text-gray-400 text-[11px] font-medium
                border border-gray-800 rounded
                px-2.5 py-1.5
                hover:border-gray-700 hover:text-gray-300 transition
                focus:outline-none focus:border-cyan-500/50
              "
            >
              <option value="all">Category</option>
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
              className="
                bg-black/80 text-gray-400 text-[11px] font-medium
                border border-gray-800 rounded
                px-2.5 py-1.5
                hover:border-gray-700 hover:text-gray-300 transition
                focus:outline-none focus:border-cyan-500/50
              "
            >
              <option value="all">Country</option>
              {countries.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* SEARCH */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => {
                  setPreset("all")
                  setFocusRegion(null)
                  setSearch(e.target.value)
                }}
                className="
                  bg-black/80 text-gray-400 text-[11px]
                  border border-gray-800 rounded
                  pl-7 pr-2.5 py-1.5 w-44
                  placeholder:text-gray-700
                  hover:border-gray-700 transition
                  focus:outline-none focus:border-cyan-500/50 focus:text-gray-300
                "
              />
              <svg 
                className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-700"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* CLEAR FILTERS BUTTON - SIEMPRE VISIBLE */}
            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className={`
                px-2.5 py-1.5 rounded text-[11px] font-medium
                transition-all
                flex items-center gap-1
                ${hasActiveFilters
                  ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 cursor-pointer"
                  : "bg-gray-900/50 text-gray-700 border border-gray-800 cursor-not-allowed opacity-50"
                }
              `}
              title={hasActiveFilters ? "Clear all filters" : "No active filters"}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-[10px] uppercase tracking-wider">Clear</span>
            </button>

            {/* ADMIN */}
            <AdminIngestButton />
          </div>
        </div>
      </header>

      {/* ===================== MAIN LAYOUT ===================== */}
      <div className="flex flex-1 min-h-0 gap-4 overflow-hidden">

        {/* SIDEBAR: LEGEND + INSIGHTS */}
        <aside className="hidden lg:flex w-52 flex-col gap-3 shrink-0 overflow-y-auto custom-scrollbar pr-2">
          <div className="bg-gray-950 border border-gray-900 rounded-lg p-3">
            <MapLegend />
          </div>
          <div className="bg-gray-950 border border-gray-900 rounded-lg p-3">
            <LegendInsights events={filteredEvents} />
          </div>
        </aside>

        {/* CENTER + RIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 flex-1 min-h-0 overflow-hidden">

          {/* MAP COLUMN */}
          <section className="flex flex-col min-h-0 gap-3">
            {/* MAP */}
            <div className="rounded-lg overflow-hidden border border-gray-900">
              <MapboxMap events={filteredEvents} onSelectSatelliteFocus={setSatelliteFocus} />
            </div>

            {/* BOTTOM PANEL */}
            <div className="hidden lg:grid grid-cols-[1.5fr_1fr] gap-3 h-[400px] min-h-0">

              {/* LEFT: VISUAL PANEL */}
              <div className="rounded-lg overflow-hidden border border-gray-900">
                <VisualPanel satelliteFocus={satelliteFocus} />
              </div>

              {/* RIGHT: SIGNALS */}
              <div className="flex flex-col gap-3 h-full min-h-0">
                {/* NEW & ESCALATING */}
                <div className="bg-gray-950 border border-gray-900 rounded-lg p-3 h-1/2">
                  <NewAndEscalatingPanel
                    events={filteredEvents}
                    preset={preset}
                    onSelectRegion={setFocusRegion}
                  />
                </div>

                {/* FOCUS TIMELINE */}
                <div className="bg-gray-950 border border-gray-900 rounded-lg p-3 h-1/2 overflow-hidden">
                  <div className="h-full overflow-y-auto custom-scrollbar">
                    <FocusTimeline
                      events={filteredEvents}
                      onSelectRegion={setFocusRegion}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: MARKET + FEED */}
          <section className="flex flex-col min-h-0 gap-3">
            {/* MARKET SNAPSHOT */}
            <div className="shrink-0">
              <MarketSnapshot />
            </div>

            {/* EVENT FEED */}
            <div className="flex-1 min-h-0 bg-gray-950 border border-gray-900 rounded-lg">
              <div className="h-full overflow-y-auto custom-scrollbar p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-4 h-4 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
                      <span className="text-sm">Loading events...</span>
                    </div>
                  </div>
                ) : (
                  <EventList events={filteredEvents} />
                )}
              </div>
            </div>
          </section>

        </div>
      </div>
    </main>
  )
}
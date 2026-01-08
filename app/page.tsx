"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import EventList from "@/components/EventList"
import { Event } from "@/lib/types"
import Stream from "@/components/Stream"
import MarketSnapshot from "@/components/MarketSnapshot"

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

  return (
    <main className="p-6 max-w-7xl mx-auto h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">
        Global OSINT Monitor
      </h1>

      {/* FILTROS */}
      <div className="flex gap-4 mb-4">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">Todas las categorías</option>
          <option value="conflict">Conflicto</option>
          <option value="disaster">Desastre</option>
          <option value="politics">Política</option>
          <option value="health">Salud</option>
        </select>

        <select
          value={country}
          onChange={e => setCountry(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">Todos los países</option>
          {countries.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* COLUMNA IZQUIERDA – MAPA + STREAM */}
        <section>
          <Map events={filteredEvents} />
          <Stream />
        </section>

        {/* COLUMNA DERECHA – ACCIONES + FEED */}
        <section className="flex flex-col h-[calc(100vh-220px)] space-y-4">
          {/* MARKET SNAPSHOT (FIJO) */}
          <MarketSnapshot />

          {/* FEED CON SCROLL INDEPENDIENTE */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <p>Cargando eventos...</p>
            ) : (
              <EventList events={filteredEvents} />
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

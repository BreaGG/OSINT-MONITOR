"use client"

import { useState, useMemo } from "react"
import { Event } from "@/lib/types"
import EventCard from "./EventCard"

type Props = {
  events: Event[]
  onHover?: (id: string | null) => void
}

const PAGE_SIZE = 20

/* ===================== COUNTRY ACRONYMS ===================== */

const COUNTRY_ACRONYMS: Record<string, string> = {
  "United States": "USA",
  "United States of America": "USA",
  "United Kingdom": "UK",
  "Russian Federation": "RUS",
  "South Korea": "ROK",
  "North Korea": "DPRK",
  "European Union": "EU",
  "United Arab Emirates": "UAE",
}

function formatCountry(name: string) {
  return COUNTRY_ACRONYMS[name] || name
}

export default function EventList({ events, onHover }: Props) {
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(events.length / PAGE_SIZE)

  const paginatedEvents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return events.slice(start, start + PAGE_SIZE)
  }, [events, page])

  /* ===================== GROUP BY COUNTRY ===================== */

  const grouped = useMemo(() => {
    const map: Record<string, Event[]> = {}

    paginatedEvents.forEach(event => {
      const key =
        event.country && event.country !== "Unknown"
          ? event.country
          : "Global"

      if (!map[key]) map[key] = []
      map[key].push(event)
    })

    return map
  }, [paginatedEvents])

  // Check DESPUÉS de todos los hooks
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-gray-500">No events match your filters</p>
          <p className="text-xs text-gray-600">Try adjusting your search or filters</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">

      {/* LIST */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([country, countryEvents]) => (
          <section key={country}>

            {/* COUNTRY HEADER NATO-STYLE */}
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-900">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 bg-cyan-500 rounded-full" />
                <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-gray-500">
                  {formatCountry(country)}
                </span>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-900 border border-gray-800 rounded">
                <span className="text-[8px] text-gray-600 font-mono">
                  {countryEvents.length}
                </span>
              </div>
              <div className="flex-1 h-px bg-gray-900" />
            </div>

            {/* EVENTS */}
            <ul className="space-y-0">
              {countryEvents.map(event => (
                <li
                  key={event.id}
                  onMouseEnter={() => onHover?.(event.id)}
                  onMouseLeave={() => onHover?.(null)}
                  className="border-b border-gray-900 last:border-0"
                >
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* PAGINATION NATO-STYLE */}
      {totalPages > 1 && (
        <div className="mt-4 pt-3 border-t border-gray-800">
          <div className="flex items-center justify-between">
            {/* Page Info */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-600 uppercase tracking-wider font-bold">
                Page
              </span>
              <div className="px-2 py-0.5 bg-gray-900 border border-gray-800 rounded">
                <span className="text-[10px] text-gray-400 font-mono">
                  {page}/{totalPages}
                </span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="
                  px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider
                  border border-gray-800 bg-black/50 text-gray-500
                  hover:border-gray-700 hover:text-gray-400
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all
                "
              >
                Prev
              </button>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="
                  px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider
                  border border-gray-800 bg-black/50 text-gray-500
                  hover:border-gray-700 hover:text-gray-400
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all
                "
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
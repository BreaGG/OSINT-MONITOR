"use client"

import { useState, useMemo } from "react"
import { Event } from "@/lib/types"
import EventCard from "./EventCard"

type Props = {
  events: Event[]
  onHover?: (id: string | null) => void
}

const PAGE_SIZE = 20

export default function EventList({ events, onHover }: Props) {
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(events.length / PAGE_SIZE)

  const paginatedEvents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return events.slice(start, start + PAGE_SIZE)
  }, [events, page])

  if (events.length === 0) {
    return <p className="text-gray-500 text-sm">No events available</p>
  }

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

  return (
    <div className="flex flex-col">

      {/* LIST */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([country, countryEvents]) => (
          <section key={country} className="space-y-2">

            {/* COUNTRY HEADER */}
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-gray-400">
              <span>{country}</span>
              <span className="text-gray-600">
                ({countryEvents.length})
              </span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            {/* EVENTS */}
            <ul className="space-y-1">
              {countryEvents.map(event => (
                <li
                  key={event.id}
                  onMouseEnter={() => onHover?.(event.id)}
                  onMouseLeave={() => onHover?.(null)}
                >
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 text-sm text-gray-400">
          <span>
            Page {page} of {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 border border-gray-800 rounded hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              disabled={page === totalPages}
              onClick={() =>
                setPage(p => Math.min(totalPages, p + 1))
              }
              className="px-3 py-1 border border-gray-800 rounded hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

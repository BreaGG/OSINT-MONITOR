"use client"

import { useState, useMemo } from "react"
import { Event } from "@/lib/types"
import EventCard from "./EventCard"

type Props = {
  events: Event[]
}

const PAGE_SIZE = 20

export default function EventList({ events }: Props) {
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(events.length / PAGE_SIZE)

  const paginatedEvents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return events.slice(start, start + PAGE_SIZE)
  }, [events, page])

  if (events.length === 0) {
    return <p className="text-gray-500 text-sm">No events available</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {/* LISTA */}
      <ul className="space-y-4">
        {paginatedEvents.map(event => (
          <li key={event.id}>
            <EventCard event={event} />
          </li>
        ))}
      </ul>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-sm text-gray-400">
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

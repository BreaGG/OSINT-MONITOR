import Link from "next/link"
import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"

type Props = {
  event: Event
}

export default function EventCard({ event }: Props) {
  const category = categoryColors[event.category]

  const isNew =
    Date.now() - new Date(event.date).getTime() <
    1000 * 60 * 60 * 2 // 2h

  const isEscalating = event.category === "conflict"

  return (
    <article
      className="py-3 pl-3 pr-2 space-y-2 text-sm text-gray-200 relative"
      style={{
        borderLeft: `2px solid ${category.color}`,
      }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span
            className="font-medium"
            style={{ color: category.color }}
          >
            {category.label}
          </span>

          {isEscalating && (
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              ESCALATING
            </span>
          )}

          {isNew && (
            <span className="text-green-400 font-medium">
              NEW
            </span>
          )}
        </div>

        <span className="text-gray-500">
          {event.country}
        </span>
      </div>

      {/* TITLE */}
      <h3 className="font-medium leading-snug text-gray-100">
        <Link
          href={`/event/${encodeURIComponent(event.id)}`}
          className="hover:underline"
        >
          {event.title}
        </Link>
      </h3>

      {/* SUMMARY */}
      {event.summary && (
        <p className="text-gray-400 leading-relaxed line-clamp-3">
          {event.summary}
        </p>
      )}

      {/* FOOTER */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{event.source}</span>
        <span>
          {new Date(event.date).toLocaleDateString()}
        </span>
      </div>

      {/* SEPARATOR */}
      <div className="border-t border-gray-800 pt-2" />
    </article>
  )
}

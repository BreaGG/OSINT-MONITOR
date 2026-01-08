import Link from "next/link"
import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"

type Props = {
  event: Event
}

export default function EventCard({ event }: Props) {
  const category = categoryColors[event.category]

  return (
    <article className="py-3 space-y-2 text-sm text-gray-200">
      {/* HEADER */}
      <div className="flex items-center justify-between text-xs">
        <span
          className="font-medium"
          style={{ color: category.color }}
        >
          {category.label}
        </span>

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

import Link from "next/link"
import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"

type Props = {
  event: Event
}

export default function EventCard({ event }: Props) {
  const category = categoryColors[event.category]

  return (
    <article className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-700 transition-colors">
      {/* CATEGORÍA */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="inline-block text-xs px-2 py-0.5 rounded text-white"
          style={{ backgroundColor: category.color }}
        >
          {category.label}
        </span>

        <span className="text-xs text-gray-500">
          {event.country}
        </span>
      </div>

      {/* TÍTULO */}
      <h3 className="font-semibold leading-snug text-gray-100 mb-1">
        <Link
          href={`/event/${encodeURIComponent(event.id)}`}
          className="hover:underline"
        >
          {event.title}
        </Link>
      </h3>

      {/* RESUMEN */}
      <p className="text-sm text-gray-400 line-clamp-3">
        {event.summary || "No summary available."}
      </p>

      {/* METADATA */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>{event.source}</span>
        <span>
          {new Date(event.date).toLocaleDateString()}
        </span>
      </div>
    </article>
  )
}

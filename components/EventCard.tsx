import Link from "next/link"
import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"

type Props = {
  event: Event
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const hours = Math.floor(diff / 36e5)

  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours}h ago`
  if (hours < 48) return "Yesterday"

  return new Date(date).toLocaleDateString()
}

export default function EventCard({ event }: Props) {
  const category = categoryColors[event.category]

  const isNew =
    Date.now() - new Date(event.date).getTime() <
    1000 * 60 * 60 * 2 // 2h

  const isEscalating = event.category === "conflict"

  return (
    <article
      className="
        relative py-3 pl-3 pr-2 space-y-2 text-sm text-gray-200
        transition-colors
        hover:bg-black/40
        group
      "
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
            <span className="flex items-center gap-1 text-red-400 font-medium">
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

        <span className="text-gray-500 truncate max-w-[120px]">
          {event.country}
        </span>
      </div>

      {/* TITLE */}
      <h3 className="font-medium leading-snug text-gray-100">
        <Link
          href={`/event/${encodeURIComponent(event.id)}`}
          className="group-hover:underline"
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
        <span>{timeAgo(event.date)}</span>
      </div>

      {/* SEPARATOR */}
      <div className="border-t border-gray-800 pt-2" />
    </article>
  )
}

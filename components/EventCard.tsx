import Link from "next/link"
import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"

type Props = {
  event: Event
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const hours = Math.floor(diff / 36e5)

  if (hours < 1) return "NOW"
  if (hours < 24) return `${hours}H`
  if (hours < 48) return "24H"

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}D`
  
  return new Date(date).toLocaleDateString()
}

export default function EventCard({ event }: Props) {
  const category = categoryColors[event.category]

  const isNew =
    Date.now() - new Date(event.date).getTime() <
    1000 * 60 * 60 * 2 // 2h

  const isEscalating = event.category === "conflict"
  
  // Guardar origen cuando se hace click
  const handleClick = () => {
    sessionStorage.setItem("event-origin", "home")
  }

  return (
    <article
      className="
        relative py-2.5 pl-2.5 pr-2 
        border-l-2
        transition-all
        hover:bg-gray-950/50
        group
        cursor-pointer
      "
      style={{
        borderLeftColor: category.color,
      }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {/* Category Badge */}
          <span
            className="text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
            style={{ 
              color: category.color,
              backgroundColor: `${category.color}15`,
              border: `1px solid ${category.color}40`
            }}
          >
            {category.label}
          </span>

          {/* Status Badges */}
          {isEscalating && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 border border-red-500/30 rounded">
              <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[8px] text-red-400 font-bold uppercase tracking-wider">
                ESC
              </span>
            </div>
          )}

          {isNew && (
            <span className="text-[8px] text-green-400 font-bold uppercase tracking-wider px-1.5 py-0.5 bg-green-500/10 border border-green-500/30 rounded">
              NEW
            </span>
          )}
        </div>

        {/* Country + Time */}
        <div className="flex items-center gap-2 text-[9px]">
          <span className="text-gray-500 uppercase tracking-wide font-medium truncate max-w-[100px]">
            {event.country && event.country !== "Unknown" ? event.country : "GLB"}
          </span>
          <span className="text-gray-700">•</span>
          <span className="text-gray-600 font-mono">
            {timeAgo(event.date)}
          </span>
        </div>
      </div>

      {/* TITLE */}
      <h3 className="text-[11px] font-medium leading-snug text-gray-200 mb-1.5 group-hover:text-white transition">
        <Link
          href={`/event/${encodeURIComponent(event.id)}`}
          onClick={handleClick}
          className="group-hover:underline decoration-gray-600"
        >
          {event.title}
        </Link>
      </h3>

      {/* SUMMARY */}
      {event.summary && (
        <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2 mb-2">
          {event.summary}
        </p>
      )}

      {/* FOOTER */}
      <div className="flex items-center justify-between pt-1.5 border-t border-gray-900">
        <span className="text-[9px] text-gray-600 truncate max-w-[200px]">
          {event.source}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-gray-800" />
        </div>
      </div>
    </article>
  )
}
import { Event } from "@/lib/types"
import Link from "next/link"
import { categoryColors } from "@/lib/categoryColors"

type Props = {
  event: Event
}

export default function EventCard({ event }: Props) {
  const category = categoryColors[event.category]

  return (
    <article className="border border-gray-700 rounded-lg p-4 bg-neutral-900 hover:bg-neutral-800 hover:border-gray-500 transition-colors">
      {event.image && (
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-40 object-cover rounded mb-3"
          loading="lazy"
        />
      )}
      <h2 className="font-semibold text-lg mb-1 text-white">
        {event.title}
      </h2>

      <p className="text-sm text-gray-400 mb-2">
        {event.source} ·{" "}
        {new Date(event.date).toLocaleDateString()}
      </p>

      <p className="text-sm text-gray-200 mb-3">
        {event.summary || "Sin resumen disponible"}
      </p>

      <div className="flex justify-between items-center">
        <span
          className="text-xs px-2 py-1 rounded text-white"
          style={{ backgroundColor: category.color }}
        >
          {category.label}
        </span>

        <Link href={`/event/${encodeURIComponent(event.id)}`}
          className="text-blue-600 text-sm underline"
        >
          Ver detalle
        </Link>
      </div>
    </article>
  )
}

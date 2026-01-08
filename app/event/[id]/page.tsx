"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"

export default function EventDetail() {
    const { id } = useParams()
    const router = useRouter()

    const decodedId = decodeURIComponent(id as string)

    const [event, setEvent] = useState<Event | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/events")
            .then(res => res.json())
            .then((events: Event[]) => {
                const found = events.find(e => e.id === decodedId)

                if (!found) {
                    setEvent(null)
                } else {
                    setEvent(found)
                }

                setLoading(false)
            })
            .catch(() => {
                setEvent(null)
                setLoading(false)
            })
    }, [decodedId])

    if (loading) {
        return (
            <main className="p-6 max-w-3xl mx-auto">
                <p>Loading event...</p>
            </main>
        )
    }

    if (!event) {
        return (
            <main className="p-6 max-w-3xl mx-auto">
                <p>Event not found</p>
                <button
                    onClick={() => router.push("/")}
                    className="mt-4 text-blue-600 underline"
                >
                    ← Back to home
                </button>
            </main>
        )
    }

    const category = categoryColors[event.category]

    // 🔒 Normalización segura de JSONB (TS-safe)
    const content: string[] = Array.isArray(event.content)
        ? event.content
        : []

    return (
        <main className="p-6 max-w-3xl mx-auto">
            {/* VOLVER */}
            <button
                onClick={() => router.push("/")}
                className="mb-4 text-sm text-white-600 hover:underline"
            >
                ← Back home
            </button>

            {/* IMAGEN */}
            {event.image && (
                <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-64 object-cover rounded mb-6"
                />
            )}

            {/* TÍTULO */}
            <h1 className="text-2xl font-bold mb-2">
                {event.title}
            </h1>

            {/* METADATA */}
            <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-4">
                <span>{event.source}</span>
                <span>•</span>
                <span>{new Date(event.date).toLocaleString()}</span>
                <span>•</span>
                <span>{event.country}</span>
            </div>

            {/* CATEGORÍA */}
            <span
                className="inline-block text-xs px-3 py-1 rounded text-white mb-6"
                style={{ backgroundColor: category.color }}
            >
                {category.label}
            </span>

            {/* CONTENIDO */}
            <article className="space-y-4 text-gray-200 leading-relaxed">
                <p>
                    {event.summary || "No summary available for this event."}
                </p>

                {content.length > 0 ? (
                    <>
                        <h2 className="text-lg font-semibold mt-6">
                            Event context
                        </h2>

                        {content.map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                        ))}
                    </>
                ) : (
                    <p className="text-sm text-gray-400 italic mt-6">
                        No extended content is available for this event.
                    </p>
                )}

                <p className="text-sm text-gray-400 mt-6">
                    This extended summary has been automatically generated
                    from publicly available OSINT sources.
                </p>
            </article>

            {/* ENLACE EXTERNO */}
            <div className="mt-8 border-t border-gray-700 pt-4">
                <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm"
                >
                    Read the full article on {event.source} →
                </a>
            </div>
        </main>
    )
}

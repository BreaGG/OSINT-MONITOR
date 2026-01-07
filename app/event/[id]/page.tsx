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
                setEvent(found || null)
                setLoading(false)
            })
    }, [decodedId])

    if (loading) {
        return (
            <main className="p-6 max-w-3xl mx-auto">
                <p>Cargando evento...</p>
            </main>
        )
    }

    if (!event) {
        return (
            <main className="p-6 max-w-3xl mx-auto">
                <p>Evento no encontrado</p>
                <button
                    onClick={() => router.push("/")}
                    className="mt-4 text-blue-600 underline"
                >
                    ← Volver al mapa
                </button>
            </main>
        )
    }

    const category = categoryColors[event.category]

    return (
        <main className="p-6 max-w-3xl mx-auto">
            {/* VOLVER */}
            <button
                onClick={() => router.push("/")}
                className="mb-4 text-sm text-blue-600 hover:underline"
            >
                ← Volver al mapa
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
                    {event.summary || "No hay un resumen disponible para este evento."}
                </p>

                {event.content && event.content.length > 0 && (
                    <>
                    <h2 className="text-lg font-semibold mt-6">
                        Contexto del evento
                    </h2>

                    {event.content.map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                    ))}
                    </>
                )}

                <p className="text-sm text-gray-400 mt-6">
                    Este resumen ampliado ha sido generado automáticamente a partir
                    de fuentes OSINT públicas.
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
                    Leer la noticia completa en {event.source} →
                </a>
            </div>
        </main>
    )
}

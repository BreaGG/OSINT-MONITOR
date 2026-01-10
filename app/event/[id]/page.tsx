"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"

/* ===================== HELPERS ===================== */

function shortCountry(country?: string) {
    if (!country || country === "Unknown") return "Global"
    if (country === "United States") return "USA"
    if (country === "United Kingdom") return "UK"
    return country
}

function intelSummary(event: Event) {
    const country = shortCountry(event.country)
    const category = event.category

    if (category === "conflict") {
        return `Escalating security-related developments reported in ${country}, indicating potential instability or military activity.`
    }

    if (category === "politics") {
        return `Political developments in ${country} may have short-term implications for governance, policy direction, or regional stability.`
    }

    if (category === "disaster") {
        return `An unfolding emergency situation in ${country} could impact civilian safety, infrastructure, or humanitarian conditions.`
    }

    if (category === "health") {
        return `Health-related developments in ${country} may affect public health systems or population risk levels.`
    }

    return `Developments reported in ${country} require monitoring for potential regional or strategic impact.`
}

/* ===================== COMPONENT ===================== */

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
                setEvent(found ?? null)
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
                <p className="text-gray-400">Loading event…</p>
            </main>
        )
    }

    if (!event) {
        return (
            <main className="p-6 max-w-3xl mx-auto">
                <p className="text-gray-400">Event not found</p>
                <button
                    onClick={() => router.push("/")}
                    className="mt-4 text-sm underline text-gray-300"
                >
                    ← Back to monitor
                </button>
            </main>
        )
    }

    const category = categoryColors[event.category]
    const content: string[] = Array.isArray(event.content)
        ? event.content
        : []

    return (
        <main className="p-6 max-w-3xl mx-auto space-y-6">

            {/* BACK */}
            <button
                onClick={() => router.push("/")}
                className="text-xs text-gray-400 hover:text-gray-200"
            >
                ← Back to monitor
            </button>

            {/* IMAGE */}
            {event.image && (
                <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-64 object-cover rounded-lg"
                />
            )}

            {/* HEADLINE */}
            <h1 className="text-2xl font-semibold leading-snug">
                {event.title}
            </h1>

            {/* METADATA */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span>{event.source}</span>
            <span>•</span>
            <span>{new Date(event.date).toLocaleString()}</span>
            <span>•</span>
            <span>{shortCountry(event.country)}</span>
            <span>•</span>
            <span className="uppercase tracking-wide" style={{ color: category.color }}>{category.label}</span>
            </div>

            {/* INTEL SUMMARY */}
            <section className="border border-gray-800 rounded-lg bg-black/40 p-4">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                    Intel assessment
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">
                    {intelSummary(event)}
                </p>
            </section>

            {/* FACT SUMMARY */}
            <section className="space-y-3">
                <div className="text-[11px] uppercase tracking-wide text-gray-500">
                    Situation overview
                </div>

                <p className="text-gray-200 leading-relaxed">
                    {event.summary || "No summary available for this event."}
                </p>
            </section>

            {/* EXTENDED CONTEXT */}
            {content.length > 0 && (
                <section className="space-y-4">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">
                        Context & background
                    </div>

                    {content.map((paragraph, idx) => (
                        <p
                            key={idx}
                            className="text-gray-300 leading-relaxed"
                        >
                            {paragraph}
                        </p>
                    ))}
                </section>
            )}

            {/* DISCLAIMER */}
            <p className="text-[11px] text-gray-500 italic">
                This assessment is automatically generated from publicly available OSINT sources.
            </p>

            {/* SOURCE LINK */}
            <div className="pt-4 border-t border-gray-800">
                <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline text-gray-300 hover:text-white"
                >
                    Read full article on {event.source} →
                </a>
            </div>
        </main>
    )
}

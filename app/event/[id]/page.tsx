"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"
import GlobalStateBar from "@/components/GlobalStateBar"
import { buildGlobalState } from "@/lib/gse"
import { adaptEventsToGSE } from "@/lib/eventToGSE"
import WhyThisEventMatters from "@/components/WhyThisEventMatters"
import { whyThisEventMatters } from "@/lib/whyThisMatters"

/* ===================== HELPERS ===================== */

function shortCountry(country?: string) {
    if (!country || country === "Unknown") return "Global"
    if (country === "United States") return "USA"
    if (country === "United Kingdom") return "UK"
    return country
}

function pickVariant(variants: string[], seed: string) {
    const index = Math.abs(hashCode(seed)) % variants.length
    return variants[index]
}

function hashCode(str: string) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i)
        hash |= 0
    }
    return hash
}

function intelSummary(event: Event) {
    const country = shortCountry(event.country)

    switch (event.category) {
        case "conflict":
            return pickVariant(
                [
                    `Security-related activity reported in ${country} suggests a potential escalation or continuation of armed tensions.`,
                    `Developments in ${country} indicate increased military or security activity, warranting close monitoring.`,
                    `Conflict-related reporting from ${country} points to heightened instability with possible regional implications.`,
                ],
                event.id
            )

        case "politics":
            return pickVariant(
                [
                    `Political developments in ${country} may influence governance dynamics or near-term policy direction.`,
                    `Reported political activity in ${country} could have implications for internal stability or regional relations.`,
                    `Evolving political conditions in ${country} suggest potential shifts in decision-making or leadership posture.`,
                ],
                event.id
            )

        case "disaster":
            return pickVariant(
                [
                    `An unfolding emergency in ${country} may impact civilian safety, critical infrastructure, or humanitarian conditions.`,
                    `Disaster-related reports from ${country} indicate potential disruption requiring situational awareness.`,
                    `Environmental or natural hazard events in ${country} could lead to cascading humanitarian or logistical challenges.`,
                ],
                event.id
            )

        case "health":
            return pickVariant(
                [
                    `Health-related developments in ${country} may place pressure on public health systems or population resilience.`,
                    `Reported health events in ${country} suggest potential public health risks requiring monitoring.`,
                    `Emerging health indicators in ${country} could affect healthcare capacity or disease risk levels.`,
                ],
                event.id
            )

        case "economy":
            return pickVariant(
                [
                    `Economic indicators reported in ${country} may signal short-term market volatility or macroeconomic pressure.`,
                    `Developments affecting the economy of ${country} could influence financial stability or investor sentiment.`,
                    `Macroeconomic signals from ${country} suggest potential impacts on growth, inflation, or fiscal conditions.`,
                ],
                event.id
            )

        case "sports":
            return pickVariant(
                [
                    `Sports-related reporting from ${country} has limited strategic relevance but may reflect public sentiment.`,
                    `Athletic or sporting developments in ${country} are noted with low strategic impact.`,
                ],
                event.id
            )

        default:
            return `Reported developments in ${country} require monitoring for potential regional or strategic impact.`
    }
}

/* ===================== COMPONENT ===================== */

export default function EventDetail() {
    const { id } = useParams()
    const router = useRouter()
    const decodedId = decodeURIComponent(id as string)

    const [event, setEvent] = useState<Event | null>(null)
    const [globalState, setGlobalState] =
        useState<ReturnType<typeof buildGlobalState> | null>(null)
    const [loading, setLoading] = useState(true)

    /* ===== BRIEFING MODE ===== */
    const [briefingMode, setBriefingMode] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem("briefingMode")
        if (saved) setBriefingMode(saved === "true")
    }, [])

    useEffect(() => {
        localStorage.setItem("briefingMode", String(briefingMode))
    }, [briefingMode])

    useEffect(() => {
        fetch("/api/events")
            .then(res => res.json())
            .then((events: Event[]) => {
                const found = events.find(e => e.id === decodedId)
                setEvent(found ?? null)

                const gseEvents = adaptEventsToGSE(events)
                const state = buildGlobalState(gseEvents)
                setGlobalState(state)

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
    const content = Array.isArray(event.content) ? event.content : []

    const relevanceReasons =
        globalState ? whyThisEventMatters(event, globalState) : []

    return (
        <main
            className={`
                mx-auto
                ${briefingMode
                    ? "p-4 max-w-4xl space-y-4"
                    : "p-6 max-w-5xl space-y-6"}
            `}
        >

            {/* GLOBAL CONTEXT */}
            {globalState && <GlobalStateBar state={globalState} />}

            {/* BACK + BRIEFING TOGGLE */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push("/")}
                    className="text-xs text-gray-400 hover:text-gray-200"
                >
                    ← Back to monitor
                </button>

                <button
                    onClick={() => setBriefingMode(b => !b)}
                    className="
                        text-[11px] px-2 py-1 rounded border
                        border-gray-700 text-gray-300
                        hover:border-gray-500
                    "
                >
                    {briefingMode ? "EXIT BRIEFING" : "BRIEFING MODE"}
                </button>
            </div>

            {/* ===== TOP GRID ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">

                {/* LEFT — EVENT CORE */}
                <section className="space-y-4">

                    {!briefingMode && event.image && (
                        <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-48 object-cover rounded-lg"
                        />
                    )}

                    <h1 className="text-2xl font-semibold leading-snug">
                        {event.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        <span>{event.source}</span>
                        <span>•</span>
                        <span>{new Date(event.date).toLocaleString()}</span>
                        <span>•</span>
                        <span>{shortCountry(event.country)}</span>
                        <span>•</span>
                        <span
                            className="uppercase tracking-wide"
                            style={{ color: category.color }}
                        >
                            {category.label}
                        </span>
                    </div>
                </section>

                {/* RIGHT — CONTEXT CORE */}
                <section className="space-y-4">

                    {globalState && relevanceReasons.length > 0 && (
                        <WhyThisEventMatters reasons={relevanceReasons} />
                    )}

                    <section
                        className={`
                            border border-gray-800 rounded-lg bg-black/40
                            ${briefingMode ? "p-3" : "p-4"}
                        `}
                    >
                        <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                            Intel assessment
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed">
                            {intelSummary(event)}
                        </p>
                    </section>

                </section>
            </div>

            {/* ===== BELOW ===== */}

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
            {!briefingMode && content.length > 0 && (
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

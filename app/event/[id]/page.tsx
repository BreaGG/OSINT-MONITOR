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

    // Detectar de dónde viene el usuario
    const [referrer, setReferrer] = useState<"home" | "map">("home")

    /* ===== BRIEFING MODE ===== */
    const [briefingMode, setBriefingMode] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem("briefingMode")
        if (saved) setBriefingMode(saved === "true")
    }, [])

    useEffect(() => {
        localStorage.setItem("briefingMode", String(briefingMode))
    }, [briefingMode])

    // Detectar origen de navegación
    useEffect(() => {
        const origin = sessionStorage.getItem("event-origin") || "home"
        setReferrer(origin as "home" | "map")
    }, [])

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

    // Función de navegación de vuelta
    const handleBack = () => {
        sessionStorage.removeItem("event-origin")
        if (referrer === "map") {
            router.push("/map")
        } else {
            router.push("/")
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-black to-gray-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin mx-auto" />
                    <p className="text-gray-400">Loading event details…</p>
                </div>
            </main>
        )
    }

    if (!event) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-black to-gray-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-gray-400 text-lg">Event not found</p>
                    <button
                        onClick={handleBack}
                        className="text-sm text-cyan-400 hover:text-cyan-300 underline"
                    >
                        ← Return to {referrer === "map" ? "map" : "monitor"}
                    </button>
                </div>
            </main>
        )
    }

    const category = categoryColors[event.category]
    const content = Array.isArray(event.content) ? event.content : []

    const relevanceReasons =
        globalState ? whyThisEventMatters(event, globalState) : []

    return (
        <main className="min-h-screen bg-gradient-to-b from-black to-gray-950">

            {/* GLOBAL CONTEXT BAR */}
            {globalState && (
                <div className="border-b border-gray-800/50">
                    <GlobalStateBar state={globalState} />
                </div>
            )}

            {/* CONTAINER */}
            <div className={`mx-auto ${briefingMode ? "max-w-4xl" : "max-w-6xl"}`}>

                {/* HEADER ACTIONS */}
                <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-sm border-b border-gray-800/50">
                    <div className="flex items-center justify-between px-6 py-4">

                        {/* LEFT — BACK */}
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition group"
                        >
                            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="font-medium">
                                {referrer === "map" ? "BACK TO MAP" : "BACK TO MONITOR"}
                            </span>
                        </button>

                        {/* RIGHT — ACTIONS */}
                        <div className="flex items-center gap-3">

                            {/* MISSION CONTROL */}
                            {referrer !== "map" && (
                                <button
                                    onClick={() => {
                                        sessionStorage.setItem("event-origin", "home")
                                        router.push("/map")
                                    }}
                                    className="
                                        flex items-center gap-2
                                        text-xs px-3 py-2 rounded-md
                                        bg-blue-500/10 border border-blue-500/30
                                        text-blue-300 hover:bg-blue-500/20
                                        hover:border-blue-500/50
                                        transition-all duration-200
                                    "
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    MISSION CONTROL
                                </button>
                            )}

                            {/* BRIEFING MODE */}
                            <button
                                onClick={() => setBriefingMode(b => !b)}
                                className={`
                                    flex items-center gap-2
                                    text-xs px-3 py-2 rounded-md
                                    border transition-all duration-200
                                    ${briefingMode
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                                        : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800'
                                    }
                                `}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {briefingMode ? "EXIT BRIEFING" : "BRIEFING MODE"}
                            </button>

                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className={`${briefingMode ? "p-6 space-y-6" : "p-8 space-y-8"}`}>

                    {/* HERO SECTION */}
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">

                        {/* LEFT — EVENT DETAILS */}
                        <div className="space-y-6">

                            {/* IMAGE */}
                            {!briefingMode && event.image && (
                                <div className="relative overflow-hidden rounded-xl border border-gray-800 shadow-2xl">
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className="w-full h-72 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                </div>
                            )}

                            {/* TITLE */}
                            <div className="space-y-4">
                                <h1 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-gray-100">
                                    {event.title}
                                </h1>

                                {/* META */}
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <span
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium"
                                        style={{
                                            backgroundColor: `${category.color}20`,
                                            color: category.color,
                                            border: `1px solid ${category.color}40`
                                        }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                                        {category.label}
                                    </span>

                                    <span className="text-gray-400">•</span>

                                    <span className="text-gray-400">{event.source}</span>

                                    <span className="text-gray-400">•</span>

                                    <span className="text-gray-400">
                                        {new Date(event.date).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>

                                    {event.country && event.country !== "Unknown" && (
                                        <>
                                            <span className="text-gray-400">•</span>
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800/50 text-gray-300 text-xs">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {shortCountry(event.country)}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT — CONTEXT CARDS */}
                        <div className="space-y-4">

                            {/* WHY THIS MATTERS */}
                            {globalState && relevanceReasons.length > 0 && (
                                <WhyThisEventMatters reasons={relevanceReasons} />
                            )}

                            {/* INTEL ASSESSMENT */}
                            <div className="p-5 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700/50">
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                                        Intelligence Assessment
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    {intelSummary(event)}
                                </p>
                            </div>
                            {/* SOURCE LINK */}
                            <a
                                href={event.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                                inline-flex items-center gap-2
                                px-4 py-2 rounded-lg
                                bg-gray-800/50 hover:bg-gray-800
                                border border-gray-700/50 hover:border-gray-600
                                text-sm text-gray-300 hover:text-white
                                transition-all duration-200
                                group
                            "
                            >
                                <span>Read full article on {event.source}</span>
                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </a>

                        </div>
                    </div>

                    {/* SITUATION OVERVIEW */}
                    <div className="p-6 rounded-xl bg-gray-900/40 border border-gray-800/50">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-5 rounded-full bg-cyan-500" />
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                                Situation Overview
                            </h2>
                        </div>
                        <p className="text-base text-gray-200 leading-relaxed">
                            {event.summary || "No summary available for this event."}
                        </p>
                    </div>

                    {/* EXTENDED CONTEXT */}
                    {!briefingMode && content.length > 0 && (
                        <div className="p-6 rounded-xl bg-gray-900/40 border border-gray-800/50">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-5 rounded-full bg-purple-500" />
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-purple-400">
                                    Context & Background
                                </h2>
                            </div>
                            <div className="space-y-4">
                                {content.map((paragraph, idx) => (
                                    <p
                                        key={idx}
                                        className="text-base text-gray-300 leading-relaxed"
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* FOOTER */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-gray-800/50">

                        {/* DISCLAIMER */}
                        <p className="text-xs text-gray-500 italic flex items-start gap-2">
                            <svg className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>This assessment is automatically generated from publicly available OSINT sources.</span>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
}
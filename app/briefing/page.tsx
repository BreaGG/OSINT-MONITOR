"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"

// Función de análisis de inteligencia (misma lógica que Python)
function analyzeIntelligence(events: Event[], config: any) {
    const analysis = {
        threatLevel: 'MODERATE' as 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL',
        keyFindings: [] as string[],
        emergingPatterns: [] as string[],
        riskAssessment: [] as { level: string; area: string; detail: string }[],
        recommendations: [] as string[],
        geographicHotspots: [] as { country: string; count: number; percentage: number }[],
        temporalTrends: [] as string[],
    }

    if (events.length === 0) return analysis

    // Contar por categoría
    const categoryCounts: Record<string, number> = {}
    events.forEach(e => {
        categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1
    })

    const total = events.length
    const conflictRatio = (categoryCounts['conflict'] || 0) / total
    const terrorismRatio = (categoryCounts['terrorism'] || 0) / total

    // 1. THREAT LEVEL
    if (conflictRatio > 0.4 || terrorismRatio > 0.2) analysis.threatLevel = 'ELEVATED'
    if (conflictRatio > 0.6 || terrorismRatio > 0.3) analysis.threatLevel = 'HIGH'
    if (conflictRatio > 0.8 || terrorismRatio > 0.5) analysis.threatLevel = 'CRITICAL'

    // 2. KEY FINDINGS
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]
    if (topCategory) {
        const [catName, catCount] = topCategory
        const pct = (catCount / total) * 100
        const label = categoryColors[catName as keyof typeof categoryColors]?.label || catName
        analysis.keyFindings.push(
            `${label} events comprise ${pct.toFixed(1)}% of total activity (${catCount} incidents)`
        )
    }

    // Análisis geográfico
    const countryCounts: Record<string, number> = {}
    events.forEach(e => {
        if (e.country && e.country !== 'Unknown') {
            countryCounts[e.country] = (countryCounts[e.country] || 0) + 1
        }
    })

    const top3Countries = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)

    if (top3Countries.length > 0) {
        analysis.keyFindings.push(
            `Primary activity concentrated in ${top3Countries.map(c => c[0]).join(', ')}`
        )

        top3Countries.forEach(([country, count]) => {
            analysis.geographicHotspots.push({
                country,
                count,
                percentage: (count / total) * 100
            })
        })
    }

    // 3. EMERGING PATTERNS
    if (conflictRatio > 0.3) {
        analysis.emergingPatterns.push(
            "Elevated conflict activity indicates potential regional instability"
        )
    }

    if ((categoryCounts['cyber'] || 0) > 5) {
        analysis.emergingPatterns.push(
            "Increased cyber operations suggest state-sponsored information warfare"
        )
    }

    if (Object.keys(categoryCounts).length > 5) {
        analysis.emergingPatterns.push(
            `Multi-domain operations detected across ${Object.keys(categoryCounts).length} distinct categories`
        )
    }

    // 4. RISK ASSESSMENT
    if (conflictRatio > 0.5) {
        analysis.riskAssessment.push({
            level: 'HIGH',
            area: 'Regional Stability',
            detail: 'Sustained military operations risk escalation to wider conflict'
        })
    }

    if (terrorismRatio > 0.15) {
        analysis.riskAssessment.push({
            level: 'ELEVATED',
            area: 'Terrorist Activity',
            detail: 'Heightened terrorist operations threaten civilian infrastructure'
        })
    }

    // 5. TEMPORAL TRENDS
    const timeSorted = [...events].sort((a, b) => {
        const timeA = a.timestamp || new Date(a.date).getTime()
        const timeB = b.timestamp || new Date(b.date).getTime()
        return timeB - timeA
    })

    if (timeSorted.length > 10) {
        const recent24h = timeSorted.slice(0, Math.floor(timeSorted.length / 2))
        const recentConflicts = recent24h.filter(e => e.category === 'conflict').length

        if (recentConflicts > (categoryCounts['conflict'] || 0) * 0.6) {
            analysis.temporalTrends.push(
                "Conflict activity accelerating in past 24 hours - potential escalation"
            )
        }
    }

    // 6. RECOMMENDATIONS
    if (['HIGH', 'CRITICAL'].includes(analysis.threatLevel)) {
        analysis.recommendations.push(
            "Recommend increased surveillance of high-activity regions"
        )
        analysis.recommendations.push(
            "Alert coalition partners to elevated threat posture"
        )
    }

    if ((categoryCounts['cyber'] || 0) > 3) {
        analysis.recommendations.push(
            "Enhance cyber defenses and monitor critical infrastructure"
        )
    }

    if (analysis.geographicHotspots.length > 0) {
        analysis.recommendations.push(
            `Prioritize HUMINT collection in ${analysis.geographicHotspots[0].country} region`
        )
    }

    return analysis
}

export default function BriefingPage() {
    const searchParams = useSearchParams()
    const briefingRef = useRef<HTMLDivElement>(null)

    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)

    // Parsear parámetros
    const countries = searchParams.get('countries')?.split(',').filter(Boolean) || []
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || []
    const timeWindow = searchParams.get('timeWindow') || '24h'
    const includeSignals = searchParams.get('includeSignals') === 'true'
    const includeHotZones = searchParams.get('includeHotZones') === 'true'
    const includeTimeline = searchParams.get('includeTimeline') === 'true'

    // Cargar eventos
    useEffect(() => {
        fetch("/api/events")
            .then(res => res.json())
            .then(data => {
                const now = Date.now()
                const timeWindowMs = {
                    "6h": 6 * 60 * 60 * 1000,
                    "24h": 24 * 60 * 60 * 1000,
                    "72h": 72 * 60 * 60 * 1000,
                }
                const cutoffTime = now - (timeWindowMs[timeWindow as keyof typeof timeWindowMs] || timeWindowMs["24h"])

                const filtered = data.filter((e: Event) => {
                    const eventTime = e.timestamp || new Date(e.date).getTime()
                    const timeMatch = eventTime >= cutoffTime && eventTime <= now

                    const countryMatch = countries.length === 0 || countries.includes(e.country)
                    const categoryMatch = categories.length === 0 || categories.includes(e.category)

                    return timeMatch && countryMatch && categoryMatch
                })

                setEvents(filtered)
                setLoading(false)
            })
    }, [])

    // Análisis de inteligencia
    const intelligence = useMemo(() => {
        return analyzeIntelligence(events, { timeWindow, countries, categories })
    }, [events, timeWindow, countries, categories])

    // Exportar a PDF usando la API
    const exportToPDF = async () => {
        setExporting(true)
        try {
            const response = await fetch('/api/briefing/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    events,
                    analysis: intelligence, // ← AÑADIDO: pasar el análisis completo
                    config: {
                        timeWindow,
                        countries,
                        categories,
                        includeSignals,
                        includeHotZones,
                        includeTimeline,
                    },
                }),
            })

            if (!response.ok) throw new Error('PDF generation failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `intelligence-briefing-${new Date().toISOString().split('T')[0]}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('PDF export failed:', error)
            alert('Failed to generate PDF. Please try again.')
        } finally {
            setExporting(false)
        }
    }

    // Agrupar eventos
    const eventsByCategory = events.reduce((acc, event) => {
        const category = event.category
        if (!acc[category]) acc[category] = []
        acc[category].push(event)
        return acc
    }, {} as Record<string, Event[]>)

    const eventsByCountry = events.reduce((acc, event) => {
        const country = event.country || 'Unknown'
        if (!acc[country]) acc[country] = []
        acc[country].push(event)
        return acc
    }, {} as Record<string, Event[]>)

    const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    })

    // Colores de threat level
    const threatLevelColor = {
        'LOW': 'bg-green-500/20 text-green-300 border-green-500/50',
        'MODERATE': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
        'ELEVATED': 'bg-orange-500/20 text-orange-300 border-orange-500/50',
        'HIGH': 'bg-red-500/20 text-red-300 border-red-500/50',
        'CRITICAL': 'bg-red-900/40 text-red-200 border-red-700',
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
                    <span className="text-gray-400">Generating briefing...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-gray-200">

            {/* HEADER CONTROLS */}
            <div className="sticky top-0 z-50 bg-gray-950 border-b border-gray-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                        <h1 className="text-lg font-bold text-white">Intelligence Briefing</h1>
                        <span className="text-xs text-gray-600 uppercase tracking-wider">
                            Classified • {timestamp}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.close()}
                            className="px-4 py-2 rounded border border-gray-800 text-gray-400 text-sm font-medium hover:border-gray-700 hover:text-gray-300 transition"
                        >
                            Close
                        </button>
                        <button
                            onClick={exportToPDF}
                            disabled={exporting}
                            className="px-4 py-2 rounded bg-cyan-500 text-black text-sm font-bold hover:bg-cyan-400 transition flex items-center gap-2 disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {exporting ? 'Generating PDF...' : 'Export PDF'}
                        </button>
                    </div>
                </div>
            </div>

            {/* BRIEFING CONTENT */}
            <div ref={briefingRef} className="max-w-7xl mx-auto px-6 py-8">

                {/* COVER PAGE */}
                <div className="mb-12">
                    <div className="border-l-4 border-cyan-500 pl-6 mb-8">
                        <div className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">
                            Intelligence Assessment
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Global Intelligence Briefing
                        </h1>
                        <div className="text-sm text-gray-500">
                            Classification: UNCLASSIFIED // OPEN SOURCE INTELLIGENCE
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Time Period</div>
                            <div className="text-2xl font-bold text-cyan-400">Last {timeWindow}</div>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Total Events</div>
                            <div className="text-2xl font-bold text-cyan-400">{events.length}</div>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Countries Monitored</div>
                            <div className="text-2xl font-bold text-cyan-400">
                                {countries.length === 0 ? Object.keys(eventsByCountry).length : countries.length}
                            </div>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Event Categories</div>
                            <div className="text-2xl font-bold text-cyan-400">
                                {categories.length === 0 ? Object.keys(eventsByCategory).length : categories.length}
                            </div>
                        </div>
                    </div>

                    {/* EXECUTIVE SUMMARY - MEJORADO */}
                    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h2 className="text-lg font-bold text-cyan-300 uppercase tracking-wider">
                                Executive Summary
                            </h2>
                        </div>

                        {/* THREAT LEVEL BADGE */}
                        <div className={`inline-block px-4 py-2 rounded border-2 font-bold text-sm mb-4 ${threatLevelColor[intelligence.threatLevel]}`}>
                            THREAT LEVEL: {intelligence.threatLevel}
                        </div>

                        <div className="text-sm text-gray-300 space-y-3">
                            <p>
                                This intelligence assessment analyzes <span className="font-bold text-cyan-400">{events.length} significant events</span> collected over <span className="font-bold text-cyan-400">{timeWindow}</span>
                                {countries.length > 0 && <> with focus on <span className="font-bold text-cyan-400">{countries.join(', ')}</span></>}.
                                All data is derived from open-source intelligence (OSINT) including news media, social signals,
                                satellite imagery analysis, and public databases across <span className="font-bold text-cyan-400">{Object.keys(eventsByCountry).length} monitored countries</span>.
                            </p>

                            <p className="text-xs text-gray-500 italic border-l-2 border-gray-700 pl-3">
                                <span className="font-bold">Methodology:</span> Events are aggregated from multiple open sources,
                                cross-referenced for verification, and analyzed using pattern detection algorithms.
                                Threat assessments are generated through statistical analysis of event frequency,
                                geographic distribution, and temporal clustering.
                            </p>

                            {/* KEY FINDINGS */}
                            {intelligence.keyFindings.length > 0 && (
                                <div>
                                    <p className="font-bold text-cyan-400 mb-2">KEY FINDINGS:</p>
                                    <ul className="space-y-1">
                                        {intelligence.keyFindings.map((finding, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-cyan-400 mt-1">•</span>
                                                <span>{finding}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* EMERGING PATTERNS */}
                            {intelligence.emergingPatterns.length > 0 && (
                                <div>
                                    <p className="font-bold text-orange-400 mb-2">EMERGING PATTERNS:</p>
                                    <ul className="space-y-1">
                                        {intelligence.emergingPatterns.map((pattern, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-orange-400 mt-1">•</span>
                                                <span>{pattern}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* RISK ASSESSMENT */}
                            {intelligence.riskAssessment.length > 0 && (
                                <div>
                                    <p className="font-bold text-red-400 mb-2">RISK ASSESSMENT:</p>
                                    <ul className="space-y-2">
                                        {intelligence.riskAssessment.map((risk, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-red-400 mt-1">•</span>
                                                <div>
                                                    <span className="font-bold text-red-400">[{risk.level}]</span>{' '}
                                                    <span className="font-bold">{risk.area}:</span>{' '}
                                                    <span>{risk.detail}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* RECOMMENDATIONS */}
                            {intelligence.recommendations.length > 0 && (
                                <div>
                                    <p className="font-bold text-green-400 mb-2">RECOMMENDATIONS:</p>
                                    <ul className="space-y-1">
                                        {intelligence.recommendations.map((rec, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-green-400 mt-1">•</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="pt-3 mt-3 border-t border-cyan-500/20">
                                <div className="text-xs text-gray-500">
                                    Generated: {timestamp} | System: OSINT-AI-01 | Classification: UNCLASSIFIED
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* EVENTS BY CATEGORY */}
                <div className="mb-12">
                    <div className="border-l-4 border-cyan-500 pl-6 mb-6">
                        <h2 className="text-2xl font-bold text-white">Events by Category</h2>
                        <p className="text-sm text-gray-500 mt-1">Breakdown of {events.length} events across operational categories</p>
                    </div>

                    <div className="space-y-6">
                        {Object.entries(eventsByCategory)
                            .sort(([, a], [, b]) => b.length - a.length)
                            .map(([category, catEvents]) => {
                                const config = categoryColors[category as keyof typeof categoryColors]
                                return (
                                    <div key={category} className="bg-gray-900/30 border border-gray-800 rounded-lg p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: config.color }}
                                            />
                                            <h3 className="text-lg font-bold text-gray-200">
                                                {config.label}
                                            </h3>
                                            <span className="text-sm text-gray-600">
                                                ({catEvents.length} events)
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {catEvents.slice(0, 10).map(event => (
                                                <div key={event.id} className="pl-6 border-l-2 border-gray-800">
                                                    <div className="text-sm font-medium text-gray-200 mb-1">
                                                        {event.title}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-1">
                                                        <span>{event.country}</span>
                                                        <span>•</span>
                                                        <span>{new Date(event.date).toLocaleDateString()}</span>
                                                        {event.source && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-cyan-500">Source: {event.source}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {event.summary && (
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                            {event.summary}
                                                        </p>
                                                    )}
                                                    {event.url && (
                                                        <a
                                                            href={event.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-cyan-600 hover:text-cyan-400 mt-1 inline-block"
                                                        >
                                                            View source →
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                            {catEvents.length > 10 && (
                                                <div className="text-xs text-gray-600 italic pl-6">
                                                    ... and {catEvents.length - 10} more {config.label.toLowerCase()} events
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                    </div>
                </div>

                {/* GEOGRAPHIC DISTRIBUTION */}
                <div className="mb-12">
                    <div className="border-l-4 border-cyan-500 pl-6 mb-6">
                        <h2 className="text-2xl font-bold text-white">Geographic Distribution</h2>
                        <p className="text-sm text-gray-500 mt-1">Events organized by country</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(eventsByCountry)
                            .sort(([, a], [, b]) => b.length - a.length)
                            .map(([country, countryEvents]) => (
                                <div key={country} className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-bold text-gray-200">{country}</h3>
                                        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
                                            {countryEvents.length}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(
                                            countryEvents.reduce((acc, e) => {
                                                acc[e.category] = (acc[e.category] || 0) + 1
                                                return acc
                                            }, {} as Record<string, number>)
                                        ).map(([cat, count]) => {
                                            const config = categoryColors[cat as keyof typeof categoryColors]
                                            return (
                                                <span
                                                    key={cat}
                                                    className="text-xs px-2 py-0.5 rounded"
                                                    style={{
                                                        backgroundColor: `${config.color}20`,
                                                        color: config.color
                                                    }}
                                                >
                                                    {config.label}: {count}
                                                </span>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* TIMELINE */}
                {includeTimeline && (
                    <div className="mb-12">
                        <div className="border-l-4 border-cyan-500 pl-6 mb-6">
                            <h2 className="text-2xl font-bold text-white">Chronological Timeline</h2>
                            <p className="text-sm text-gray-500 mt-1">Events in temporal sequence</p>
                        </div>

                        <div className="space-y-3">
                            {events
                                .sort((a, b) => {
                                    const timeA = a.timestamp || new Date(a.date).getTime()
                                    const timeB = b.timestamp || new Date(b.date).getTime()
                                    return timeB - timeA
                                })
                                .map(event => {
                                    const config = categoryColors[event.category as keyof typeof categoryColors]
                                    return (
                                        <div key={event.id} className="flex gap-4">
                                            <div className="w-24 shrink-0 text-xs text-gray-600 pt-1">
                                                {new Date(event.date).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                            <div className="flex-1 pb-4 border-l-2 border-gray-800 pl-4">
                                                <div className="flex items-start gap-2">
                                                    <div
                                                        className="w-2 h-2 rounded-full mt-1 shrink-0"
                                                        style={{ backgroundColor: config.color }}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-200 mb-1">
                                                            {event.title}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                                                            <span>{event.country}</span>
                                                            <span>•</span>
                                                            <span>{config.label}</span>
                                                        </div>
                                                        {event.summary && (
                                                            <p className="text-xs text-gray-500 line-clamp-2">
                                                                {event.summary}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>
                    </div>
                )}

                {/* FOOTER */}
                <div className="pt-8 mt-8 border-t border-gray-800">
                    <div className="text-xs text-gray-600 space-y-2">
                        <p>
                            <span className="font-bold">Classification:</span> UNCLASSIFIED // OPEN SOURCE INTELLIGENCE
                        </p>
                        <p>
                            <span className="font-bold">Distribution:</span> Approved for public release
                        </p>
                        <p>
                            <span className="font-bold">Generated:</span> {timestamp} by OSINT-AI-01 Automated Intelligence System
                        </p>
                        <p>
                            <span className="font-bold">Disclaimer:</span> This assessment is based exclusively on publicly available information.
                            Analysis conclusions are algorithmic and should be independently verified before operational use.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
"use client"

import { useState, useMemo } from "react"
import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"

type BriefingExportModalProps = {
    events: Event[]
    onClose: () => void
}

export default function BriefingExportModal({ events, onClose }: BriefingExportModalProps) {
    const [step, setStep] = useState<1 | 2>(1)

    // Configuración del briefing
    const [selectedCountries, setSelectedCountries] = useState<string[]>([])
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [timeWindow, setTimeWindow] = useState<"6h" | "24h" | "72h">("24h")
    const [includeSignals, setIncludeSignals] = useState(true)
    const [includeHotZones, setIncludeHotZones] = useState(true)
    const [includeTimeline, setIncludeTimeline] = useState(true)

    // Obtener países únicos
    const countries = useMemo(() => {
        return Array.from(new Set(events.map(e => e.country).filter(c => c && c !== "Unknown"))).sort()
    }, [events])

    // Obtener categorías
    const categories = Object.keys(categoryColors)

    // Toggle selección
    const toggleCountry = (country: string) => {
        setSelectedCountries(prev =>
            prev.includes(country)
                ? prev.filter(c => c !== country)
                : [...prev, country]
        )
    }

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        )
    }

    // Eventos filtrados según selección
    const filteredEvents = useMemo(() => {
        const now = Date.now()
        const timeWindowMs = {
            "6h": 6 * 60 * 60 * 1000,
            "24h": 24 * 60 * 60 * 1000,
            "72h": 72 * 60 * 60 * 1000,
        }
        const cutoffTime = now - timeWindowMs[timeWindow]

        return events.filter(e => {
            const eventTime = e.timestamp || new Date(e.date).getTime()
            const timeMatch = eventTime >= cutoffTime && eventTime <= now

            const countryMatch = selectedCountries.length === 0 || selectedCountries.includes(e.country)
            const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(e.category)

            return timeMatch && countryMatch && categoryMatch
        })
    }, [events, selectedCountries, selectedCategories, timeWindow])

    // Generar briefing
    const generateBriefing = () => {
        // Crear query params para la página de briefing
        const params = new URLSearchParams({
            countries: selectedCountries.join(','),
            categories: selectedCategories.join(','),
            timeWindow,
            includeSignals: includeSignals.toString(),
            includeHotZones: includeHotZones.toString(),
            includeTimeline: includeTimeline.toString(),
            eventCount: filteredEvents.length.toString(),
        })

        // Abrir en nueva ventana
        window.open(`/briefing?${params.toString()}`, '_blank')
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-950 border border-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">

                {/* HEADER */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                Export Intelligence Briefing
                            </h2>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">
                                Classified • NATO Eyes Only
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-300 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* PROGRESS */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/50 border-b border-gray-800">
                    <div className={`flex items-center gap-2 ${step === 1 ? 'text-cyan-400' : 'text-green-400'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-cyan-500/20 border border-cyan-500/50' : 'bg-green-500/20 border border-green-500/50'
                            }`}>
                            {step === 2 ? '✓' : '1'}
                        </div>
                        <span className="text-xs font-medium">Configure</span>
                    </div>

                    <div className="flex-1 h-px bg-gray-800" />

                    <div className={`flex items-center gap-2 ${step === 2 ? 'text-cyan-400' : 'text-gray-600'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-cyan-500/20 border border-cyan-500/50' : 'bg-gray-800 border border-gray-700'
                            }`}>
                            2
                        </div>
                        <span className="text-xs font-medium">Review</span>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)] custom-scrollbar">

                    {step === 1 && (
                        <div className="space-y-4">

                            {/* TIME WINDOW */}
                            <div>
                                <label className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-2 block">
                                    Time Window
                                </label>
                                <div className="flex gap-2">
                                    {(["6h", "24h", "72h"] as const).map(tw => (
                                        <button
                                            key={tw}
                                            onClick={() => setTimeWindow(tw)}
                                            className={`flex-1 px-4 py-2 rounded border text-sm font-medium transition-all ${timeWindow === tw
                                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                                                    : 'bg-gray-900/50 text-gray-500 border-gray-800 hover:border-gray-700'
                                                }`}
                                        >
                                            {tw.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* COUNTRIES */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs uppercase tracking-wider font-bold text-gray-500">
                                        Countries ({selectedCountries.length} selected)
                                    </label>
                                    <button
                                        onClick={() => setSelectedCountries(selectedCountries.length === countries.length ? [] : countries)}
                                        className="text-xs text-cyan-400 hover:text-cyan-300 transition"
                                    >
                                        {selectedCountries.length === countries.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-gray-900/30 border border-gray-800 rounded">
                                    {countries.map(country => (
                                        <button
                                            key={country}
                                            onClick={() => toggleCountry(country)}
                                            className={`px-3 py-1.5 rounded text-xs font-medium transition-all text-left ${selectedCountries.includes(country)
                                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                                                    : 'bg-gray-900 text-gray-500 border border-gray-800 hover:border-gray-700'
                                                }`}
                                        >
                                            {country}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* CATEGORIES */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs uppercase tracking-wider font-bold text-gray-500">
                                        Event Categories ({selectedCategories.length} selected)
                                    </label>
                                    <button
                                        onClick={() => setSelectedCategories(selectedCategories.length === categories.length ? [] : categories)}
                                        className="text-xs text-cyan-400 hover:text-cyan-300 transition"
                                    >
                                        {selectedCategories.length === categories.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map(cat => {
                                        const config = categoryColors[cat as keyof typeof categoryColors]
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => toggleCategory(cat)}
                                                className={`px-3 py-2 rounded text-xs font-medium transition-all text-left flex items-center gap-2 ${selectedCategories.includes(cat)
                                                        ? 'bg-gray-900 border-2'
                                                        : 'bg-gray-900/30 border border-gray-800 hover:border-gray-700'
                                                    }`}
                                                style={{
                                                    borderColor: selectedCategories.includes(cat) ? config.color : undefined
                                                }}
                                            >
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: config.color }}
                                                />
                                                <span className={selectedCategories.includes(cat) ? 'text-gray-200' : 'text-gray-500'}>
                                                    {config.label}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* ADDITIONAL OPTIONS */}
                            <div>
                                <label className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-2 block">
                                    Additional Components
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 px-3 py-2 bg-gray-900/30 border border-gray-800 rounded hover:border-gray-700 transition cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={includeSignals}
                                            onChange={(e) => setIncludeSignals(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-cyan-500"
                                        />
                                        <div>
                                            <div className="text-sm font-medium text-gray-300">Civil Signals Analysis</div>
                                            <div className="text-xs text-gray-600">Include conflict, disaster, and social signals</div>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 px-3 py-2 bg-gray-900/30 border border-gray-800 rounded hover:border-gray-700 transition cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={includeHotZones}
                                            onChange={(e) => setIncludeHotZones(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-cyan-500"
                                        />
                                        <div>
                                            <div className="text-sm font-medium text-gray-300">Hot Zones Assessment</div>
                                            <div className="text-xs text-gray-600">Areas of concentrated activity</div>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 px-3 py-2 bg-gray-900/30 border border-gray-800 rounded hover:border-gray-700 transition cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={includeTimeline}
                                            onChange={(e) => setIncludeTimeline(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-cyan-500"
                                        />
                                        <div>
                                            <div className="text-sm font-medium text-gray-300">Chronological Timeline</div>
                                            <div className="text-xs text-gray-600">Events in temporal sequence</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            {/* SUMMARY */}
                            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">
                                        Intelligence Assessment Summary
                                    </h3>
                                </div>

                                <div className="space-y-2 text-sm text-gray-300">
                                    <p>
                                        <span className="text-gray-500">Time Period:</span>{' '}
                                        <span className="font-medium text-cyan-400">Last {timeWindow}</span>
                                    </p>
                                    <p>
                                        <span className="text-gray-500">Geographic Scope:</span>{' '}
                                        <span className="font-medium text-cyan-400">
                                            {selectedCountries.length === 0 ? 'All Countries' : `${selectedCountries.length} Countries`}
                                        </span>
                                    </p>
                                    <p>
                                        <span className="text-gray-500">Event Categories:</span>{' '}
                                        <span className="font-medium text-cyan-400">
                                            {selectedCategories.length === 0 ? 'All Categories' : selectedCategories.map(c => categoryColors[c as keyof typeof categoryColors].label).join(', ')}
                                        </span>
                                    </p>
                                    <p>
                                        <span className="text-gray-500">Total Events:</span>{' '}
                                        <span className="font-medium text-cyan-400">{filteredEvents.length}</span>
                                    </p>

                                    <div className="pt-2 mt-2 border-t border-cyan-500/20">
                                        <p className="text-xs text-gray-400">
                                            This briefing will include detailed analysis of {filteredEvents.length} events
                                            {selectedCountries.length > 0 && ` across ${selectedCountries.join(', ')}`}
                                            {includeSignals && ', civil signals analysis'}
                                            {includeHotZones && ', hot zones assessment'}
                                            {includeTimeline && ', and chronological timeline'}.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* PREVIEW */}
                            <div>
                                <h3 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">
                                    Event Preview (First 5)
                                </h3>
                                <div className="space-y-2">
                                    {filteredEvents.slice(0, 5).map(event => {
                                        const config = categoryColors[event.category as keyof typeof categoryColors]
                                        return (
                                            <div
                                                key={event.id}
                                                className="p-3 bg-gray-900/50 border border-gray-800 rounded"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div
                                                        className="w-2 h-2 rounded-full mt-1 shrink-0"
                                                        style={{ backgroundColor: config.color }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-200 line-clamp-1">
                                                            {event.title}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-gray-500">{event.country}</span>
                                                            <span className="text-xs text-gray-700">•</span>
                                                            <span className="text-xs text-gray-600">{config.label}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {filteredEvents.length > 5 && (
                                        <div className="text-center text-xs text-gray-600 py-2">
                                            ... and {filteredEvents.length - 5} more events
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between p-4 border-t border-gray-800 bg-gray-900/50">
                    {step === 1 ? (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded border border-gray-800 text-gray-400 text-sm font-medium hover:border-gray-700 hover:text-gray-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                disabled={filteredEvents.length === 0}
                                className="px-4 py-2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 text-sm font-medium hover:bg-cyan-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue to Review →
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setStep(1)}
                                className="px-4 py-2 rounded border border-gray-800 text-gray-400 text-sm font-medium hover:border-gray-700 hover:text-gray-300 transition"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={generateBriefing}
                                className="px-6 py-2 rounded bg-cyan-500 text-black text-sm font-bold hover:bg-cyan-400 transition flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Generate Briefing
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
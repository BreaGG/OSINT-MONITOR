"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface IngestStats {
    status: string
    processed: number
    filtered: number
    inserted: number
    filterRate: string
    byCategory: Record<string, number>
    bySeverity: {
        critical: number
        high: number
        medium: number
        low: number
    }
}

interface SocialStats {
    status: string
    inserted: number
}

export default function IngestButton() {
    const router = useRouter()

    const [open, setOpen] = useState(false)
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [eventsStats, setEventsStats] = useState<IngestStats | null>(null)
    const [socialStats, setSocialStats] = useState<SocialStats | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function runIngest() {
        setLoading(true)
        setError(null)
        setEventsStats(null)
        setSocialStats(null)

        try {
            /* ===================== EVENTS INGEST ===================== */
            const eventsRes = await fetch("/api/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            })

            if (!eventsRes.ok) {
                throw new Error("Events ingest failed")
            }

            const eventsData = await eventsRes.json()
            setEventsStats(eventsData)

            /* ===================== SOCIAL INGEST ===================== */
            const socialRes = await fetch("/api/social/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            })

            if (!socialRes.ok) {
                throw new Error("Social ingest failed")
            }

            const socialData = await socialRes.json()
            setSocialStats(socialData)

            /* ===================== AUTO REFRESH ===================== */
            setTimeout(() => {
                window.location.reload() // F5 / full page refresh
            }, 2000)

        } catch (err) {
            setError("Invalid password or ingest failed")
            setLoading(false)
            setPassword("")
        }
    }

    const categoryEmojis: Record<string, string> = {
        conflict: '🔴',
        terrorism: '💣',
        nuclear: '☢️',
        cyber: '💻',
        disaster: '🌪️',
        health: '🏥',
        climate: '🌡️',
        economy: '💰',
        politics: '🏛️',
    }

    return (
        <>
            {/* BUTTON */}
            <button
                onClick={() => setOpen(true)}
                className="px-2 py-1 text-xs border border-gray-700 rounded hover:border-gray-500 transition-colors"
                title="Manual ingest (events + social)"
            >
                Refresh
            </button>

            {/* MODAL */}
            {open && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-gray-950 border border-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        
                        {/* HEADER */}
                        <div className="sticky top-0 bg-gray-950 border-b border-gray-800 p-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-gray-100">
                                    Manual Ingest
                                </h2>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="text-gray-400 hover:text-gray-200 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* CONTENT */}
                        <div className="p-4 space-y-4">

                            {/* PASSWORD INPUT */}
                            {!eventsStats && !socialStats && (
                                <div className="space-y-3">
                                    <input
                                        type="password"
                                        placeholder="Admin Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && !loading && password && runIngest()}
                                        disabled={loading}
                                        className="
                                            w-full bg-gray-900 border border-gray-700 rounded-lg 
                                            px-4 py-2 text-sm text-gray-100
                                            focus:outline-none focus:ring-2 focus:ring-blue-500
                                            disabled:opacity-50
                                        "
                                    />

                                    <button
                                        onClick={runIngest}
                                        disabled={loading || !password}
                                        className="
                                            w-full px-4 py-2 rounded-lg
                                            bg-blue-600 hover:bg-blue-700
                                            disabled:bg-gray-700 disabled:cursor-not-allowed
                                            text-white text-sm font-medium
                                            transition-colors duration-200
                                            flex items-center justify-center gap-2
                                        "
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Running ingest...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Run Ingest</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* LOADING STATE */}
                            {loading && (
                                <div className="py-8 text-center space-y-3">
                                    <div className="w-12 h-12 border-4 border-gray-700 border-t-cyan-500 rounded-full animate-spin mx-auto" />
                                    <div className="text-sm text-gray-400">
                                        Processing feeds and filtering content...
                                    </div>
                                </div>
                            )}

                            {/* ERROR */}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                    ⚠️ {error}
                                </div>
                            )}

                            {/* EVENTS STATS */}
                            {eventsStats && (
                                <div className="space-y-4">
                                    
                                    {/* OVERVIEW */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                            <div className="text-xs text-blue-400 mb-1">Processed</div>
                                            <div className="text-2xl font-bold text-blue-300">
                                                {eventsStats.processed}
                                            </div>
                                        </div>
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                            <div className="text-xs text-red-400 mb-1">Filtered</div>
                                            <div className="text-2xl font-bold text-red-300">
                                                {eventsStats.filtered}
                                            </div>
                                            <div className="text-[10px] text-red-400/70 mt-1">
                                                {eventsStats.filterRate}
                                            </div>
                                        </div>
                                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                            <div className="text-xs text-green-400 mb-1">Inserted</div>
                                            <div className="text-2xl font-bold text-green-300">
                                                {eventsStats.inserted}
                                            </div>
                                        </div>
                                    </div>

                                    {/* SEVERITY */}
                                    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                                        <div className="text-xs font-semibold text-gray-400 mb-2">
                                            Severity Distribution
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 text-center">
                                            <div>
                                                <div className="text-lg font-bold text-red-400">
                                                    {eventsStats.bySeverity.critical}
                                                </div>
                                                <div className="text-[10px] text-gray-500">Critical</div>
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-orange-400">
                                                    {eventsStats.bySeverity.high}
                                                </div>
                                                <div className="text-[10px] text-gray-500">High</div>
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-yellow-400">
                                                    {eventsStats.bySeverity.medium}
                                                </div>
                                                <div className="text-[10px] text-gray-500">Medium</div>
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-gray-400">
                                                    {eventsStats.bySeverity.low}
                                                </div>
                                                <div className="text-[10px] text-gray-500">Low</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CATEGORIES */}
                                    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                                        <div className="text-xs font-semibold text-gray-400 mb-2">
                                            📑 Top Categories
                                        </div>
                                        <div className="space-y-1.5">
                                            {Object.entries(eventsStats.byCategory)
                                                .sort((a, b) => b[1] - a[1])
                                                .slice(0, 6)
                                                .map(([category, count]) => {
                                                    const percentage = ((count / eventsStats.inserted) * 100).toFixed(0)
                                                    return (
                                                        <div key={category} className="flex items-center gap-2 text-xs">
                                                            <span className="w-4">
                                                                {categoryEmojis[category] || '📌'}
                                                            </span>
                                                            <span className="w-20 text-gray-400 capitalize">
                                                                {category}
                                                            </span>
                                                            <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-cyan-500 transition-all duration-500"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                            <span className="w-12 text-right text-gray-500">
                                                                {count}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SOCIAL STATS */}
                            {socialStats && (
                                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-purple-400">
                                            Social Signals
                                        </div>
                                        <div className="text-xl font-bold text-purple-300">
                                            {socialStats.inserted}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* AUTO REFRESH NOTICE */}
                            {eventsStats && socialStats && (
                                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs text-center">
                                    Page will refresh automatically in 2 seconds...
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
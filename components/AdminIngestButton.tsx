"use client"

import { useState } from "react"

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

export default function AdminIngestButton() {
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
                window.location.reload()
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
            {/* NATO-STYLE BUTTON */}
            <button
                onClick={() => setOpen(true)}
                className="
                    px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.1em] 
                    border border-gray-800 bg-black/50 text-gray-600
                    hover:border-gray-700 hover:text-gray-400
                    transition-all
                "
                title="Manual ingest (events + social)"
            >
                Refresh
            </button>

            {/* MODAL NATO-STYLE */}
            {open && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-gray-950/95 border-2 border-gray-800 rounded w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        
                        {/* HEADER NATO-STYLE */}
                        <div className="bg-gray-900/50 border-b-2 border-gray-800 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center justify-center w-10 h-10 border-2 border-gray-700 bg-black/50">
                                    <span className="text-[9px] text-gray-500 font-bold leading-none">REF</span>
                                    <span className="text-[7px] text-gray-600 font-bold leading-none mt-0.5">RESH</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] text-gray-400 uppercase tracking-[0.15em] font-bold leading-none">
                                        Manual Data Refresh
                                    </span>
                                    <span className="text-[9px] text-gray-700 uppercase tracking-wider leading-none mt-1">
                                        Events & Social Signals
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-gray-600 hover:text-gray-300 transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">

                            {/* PASSWORD INPUT */}
                            {!eventsStats && !socialStats && (
                                <div className="space-y-3">
                                    <input
                                        type="password"
                                        placeholder="ADMIN PASSWORD"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && !loading && password && runIngest()}
                                        disabled={loading}
                                        className="
                                            w-full bg-gray-900 border border-gray-800 rounded
                                            px-4 py-2.5 text-sm text-gray-300 font-mono
                                            placeholder:text-gray-700 placeholder:uppercase placeholder:tracking-wider
                                            focus:outline-none focus:border-cyan-500/50
                                            disabled:opacity-50
                                        "
                                    />

                                    <button
                                        onClick={runIngest}
                                        disabled={loading || !password}
                                        className="
                                            w-full px-4 py-2.5 rounded
                                            bg-cyan-600 hover:bg-cyan-700
                                            disabled:bg-gray-800 disabled:cursor-not-allowed
                                            text-white text-[11px] font-bold uppercase tracking-[0.15em]
                                            transition-all
                                            flex items-center justify-center gap-2
                                        "
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Executing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                <span>Execute Refresh</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* LOADING STATE */}
                            {loading && (
                                <div className="py-8 text-center space-y-3">
                                    <div className="w-12 h-12 border-4 border-gray-800 border-t-cyan-500 rounded-full animate-spin mx-auto" />
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                                        Processing feeds and filtering content...
                                    </div>
                                </div>
                            )}

                            {/* ERROR */}
                            {error && (
                                <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] flex items-center gap-2">
                                    <span className="text-lg">⚠️</span>
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}

                            {/* EVENTS STATS */}
                            {eventsStats && (
                                <div className="space-y-3">
                                    
                                    {/* OVERVIEW */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                                            <div className="text-[9px] text-blue-400 uppercase tracking-wider mb-1">Processed</div>
                                            <div className="text-2xl font-bold text-blue-300">
                                                {eventsStats.processed}
                                            </div>
                                        </div>
                                        <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                                            <div className="text-[9px] text-red-400 uppercase tracking-wider mb-1">Filtered</div>
                                            <div className="text-2xl font-bold text-red-300">
                                                {eventsStats.filtered}
                                            </div>
                                            <div className="text-[9px] text-red-400/70 mt-1 font-mono">
                                                {eventsStats.filterRate}
                                            </div>
                                        </div>
                                        <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                                            <div className="text-[9px] text-green-400 uppercase tracking-wider mb-1">Inserted</div>
                                            <div className="text-2xl font-bold text-green-300">
                                                {eventsStats.inserted}
                                            </div>
                                        </div>
                                    </div>

                                    {/* SEVERITY */}
                                    <div className="bg-gray-900/50 border border-gray-800 rounded overflow-hidden">
                                        <div className="bg-gray-900/50 px-3 py-2 border-b border-gray-800">
                                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                                                Severity Distribution
                                            </span>
                                        </div>
                                        <div className="p-3 grid grid-cols-4 gap-2 text-center">
                                            <div>
                                                <div className="text-lg font-bold text-red-400">
                                                    {eventsStats.bySeverity.critical}
                                                </div>
                                                <div className="text-[8px] text-gray-600 uppercase tracking-wider">Critical</div>
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-orange-400">
                                                    {eventsStats.bySeverity.high}
                                                </div>
                                                <div className="text-[8px] text-gray-600 uppercase tracking-wider">High</div>
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-yellow-400">
                                                    {eventsStats.bySeverity.medium}
                                                </div>
                                                <div className="text-[8px] text-gray-600 uppercase tracking-wider">Medium</div>
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-gray-400">
                                                    {eventsStats.bySeverity.low}
                                                </div>
                                                <div className="text-[8px] text-gray-600 uppercase tracking-wider">Low</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CATEGORIES */}
                                    <div className="bg-gray-900/50 border border-gray-800 rounded overflow-hidden">
                                        <div className="bg-gray-900/50 px-3 py-2 border-b border-gray-800">
                                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                                                Top Categories
                                            </span>
                                        </div>
                                        <div className="p-3 space-y-2">
                                            {Object.entries(eventsStats.byCategory)
                                                .sort((a, b) => b[1] - a[1])
                                                .slice(0, 6)
                                                .map(([category, count]) => {
                                                    const percentage = ((count / eventsStats.inserted) * 100).toFixed(0)
                                                    return (
                                                        <div key={category} className="flex items-center gap-2 text-[10px]">
                                                            <span className="w-4 text-center">
                                                                {categoryEmojis[category] || '📌'}
                                                            </span>
                                                            <span className="w-20 text-gray-500 capitalize font-medium">
                                                                {category}
                                                            </span>
                                                            <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-cyan-500 transition-all duration-500"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                            <span className="w-10 text-right text-gray-600 font-mono">
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
                                <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[9px] text-purple-400 uppercase tracking-wider">
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
                                <div className="p-3 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                                    <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
                                        Auto-refresh in 2s
                                    </span>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
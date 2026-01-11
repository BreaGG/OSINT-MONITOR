"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function IngestButton() {
    const router = useRouter()

    const [open, setOpen] = useState(false)
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [eventsResult, setEventsResult] = useState<number | null>(null)
    const [socialResult, setSocialResult] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function runIngest() {
        setLoading(true)
        setError(null)
        setEventsResult(null)
        setSocialResult(null)

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
            setEventsResult(eventsData.inserted ?? 0)

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
            setSocialResult(socialData.inserted ?? 0)

            /* ===================== REFRESH UI ===================== */
            setTimeout(() => {
                setOpen(false)
                router.refresh()
            }, 800)

        } catch (err) {
            setError("Invalid password or ingest failed")
        } finally {
            setLoading(false)
            setPassword("")
        }
    }

    return (
        <>
            {/* BUTTON */}
            <button
                onClick={() => setOpen(true)}
                className="px-2 py-1 text-xs border border-gray-700 rounded hover:border-gray-500"
                title="Manual ingest (events + social)"
            >
                Refresh
            </button>

            {/* MODAL */}
            {open && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
                    <div className="bg-black border border-gray-800 rounded-lg p-4 w-80 space-y-3">

                        <div className="text-sm font-medium">
                            Manual ingest
                        </div>

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-sm"
                        />

                        {loading && (
                            <div className="text-xs text-gray-400">
                                Ingesting events & social signals…
                            </div>
                        )}

                        {(eventsResult !== null || socialResult !== null) && (
                            <div className="text-xs text-green-400 space-y-1">
                                {eventsResult !== null && (
                                    <div>✔ {eventsResult} events ingested</div>
                                )}
                                {socialResult !== null && (
                                    <div>✔ {socialResult} social signals ingested</div>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="text-xs text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setOpen(false)}
                                className="text-xs text-gray-400 hover:text-gray-200"
                            >
                                Close
                            </button>
                            <button
                                onClick={runIngest}
                                disabled={loading || !password}
                                className="px-3 py-1 text-xs border border-gray-700 rounded hover:border-gray-500 disabled:opacity-40"
                            >
                                Run
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

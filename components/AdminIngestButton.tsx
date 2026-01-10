"use client"

import { useState } from "react"

export default function IngestButton() {
    const [open, setOpen] = useState(false)
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function runIngest() {
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const res = await fetch("/api/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            })

            if (!res.ok) {
                throw new Error("Unauthorized")
            }

            const data = await res.json()
            setResult(data.inserted)
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
                title="Manual ingest"
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
                                Ingesting feeds…
                            </div>
                        )}

                        {result !== null && (
                            <div className="text-xs text-green-400">
                                ✔ {result} new events ingested
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

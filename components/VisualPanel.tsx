"use client"

import { useEffect, useState } from "react"
import Stream from "./Stream"
import VisualFeeds from "./VisualFeeds"

type Mode = "stream" | "cameras"

const STORAGE_KEY = "osint.visual.mode"

export default function VisualPanel() {
    const [mode, setMode] = useState<Mode>("stream")

    /* -------------------- PERSISTENCE -------------------- */
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored === "stream" || stored === "cameras") {
            setMode(stored)
        }
    }, [])

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, mode)
    }, [mode])

    return (
        <section className="flex flex-col h-full bg-black/40 rounded-lg overflow-hidden">
            {/* MODE SWITCH (COMPACT) */}
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-800 text-[11px]">
                <span className="text-gray-500 tracking-wide">VIEW</span>

                <button
                    onClick={() => setMode("stream")}
                    className={`
            px-2.5 py-1 rounded
            transition
            ${mode === "stream"
                            ? "bg-black text-gray-200 border border-gray-700"
                            : "text-gray-500 hover:text-gray-300"
                        }
          `}
                >
                    BROADCAST
                </button>

                <button
                    onClick={() => setMode("cameras")}
                    className={`
            px-2.5 py-1 rounded
            transition
            ${mode === "cameras"
                            ? "bg-black text-gray-200 border border-gray-700"
                            : "text-gray-500 hover:text-gray-300"
                        }
          `}
                >
                    VISUAL SOURCES
                </button>
            </div>

            {/* CONTENT (SCALED + EMBEDDED) */}
            <div className="flex-1 min-h-0 p-2">
                <div className="h-full scale-[0.96] origin-top">
                    {mode === "stream" ? <Stream /> : <VisualFeeds />}
                </div>
            </div>
        </section>
    )
}

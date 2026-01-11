"use client"

import { useState } from "react"
import Stream from "./Stream"
import VisualFeeds from "@/components/VisualFeeds"

type Mode = "stream" | "cameras"

export default function VisualPanel() {
    const [mode, setMode] = useState<Mode>("stream")

    return (
        <section className="flex flex-col h-full bg-black/40">
            {/* MODE SELECTOR — STRUCTURAL, NOT VISUAL */}
            <div className="flex items-center gap-4 px-3 py-2 text-[11px] text-gray-500">
                <span className="tracking-wide">VIEW</span>

                <button
                    onClick={() => setMode("stream")}
                    className={`
            ${mode === "stream"
                            ? "text-gray-200"
                            : "hover:text-gray-300"}
          `}
                >
                    STREAM
                </button>

                <button
                    onClick={() => setMode("cameras")}
                    className={`
            ${mode === "cameras"
                            ? "text-gray-200"
                            : "hover:text-gray-300"}
          `}
                >
                    CAMERAS
                </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 min-h-0">
                {mode === "stream" ? <Stream /> : <VisualFeeds />}
            </div>
        </section>
    )
}

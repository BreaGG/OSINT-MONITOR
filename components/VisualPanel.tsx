"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import Stream from "./Stream"
import VisualFeeds from "./VisualFeeds"
import SatelliteView from "./SatelliteView"
import type { SatelliteFocus } from "./SatelliteView"
import SocialView from "./SocialView"
import UAVView from "./UAVView"

/* ===================== TYPES ===================== */

export type VisualMode =
    | "stream"
    | "cameras"
    | "satellite"
    | "social"
    | "uav"

type Props = {
    satelliteFocus?: SatelliteFocus
}

/* ===================== CONFIG ===================== */

const STORAGE_KEY = "osint.visual.mode"

const AVAILABLE_MODES: VisualMode[] = [
    "stream",
    "cameras",
    "satellite",
    "social",
    "uav",
]

const MODE_LABELS: Record<VisualMode, string> = {
    stream: "BROADCAST",
    cameras: "VISUAL",
    satellite: "SAT",
    social: "SOCIAL",
    uav: "UAV",
}

/* ===================== COMPONENT ===================== */

export default function VisualPanel({ satelliteFocus }: Props) {
    const [mode, setMode] = useState<VisualMode>("stream")

    /* -------- LOAD PERSISTED MODE -------- */
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored && AVAILABLE_MODES.includes(stored as VisualMode)) {
            setMode(stored as VisualMode)
        }
    }, [])

    /* -------- SAVE MODE -------- */
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, mode)
    }, [mode])

    /* -------- MODE → COMPONENT MAP -------- */
    const MODE_COMPONENTS: Record<VisualMode, ReactNode> = {
        stream: <Stream />,
        cameras: <VisualFeeds />,
        satellite: <SatelliteView focus={satelliteFocus} />,
        social: <SocialView focus={satelliteFocus} />,
        uav: <UAVView focus={satelliteFocus} />,
    }

    return (
        <section className="flex flex-col h-full bg-gray-950 border border-gray-900 rounded overflow-hidden">
            {/* HEADER NATO-STYLE */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-900/50 border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-purple-500 rounded-full" />
                    <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-gray-500">
                        Visual Intelligence
                    </span>
                </div>

                {/* MODE SELECTOR */}
                <div className="flex items-center gap-1">
                    {AVAILABLE_MODES.map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`
                                px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider
                                transition-all
                                ${mode === m
                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                    : "text-gray-600 hover:text-gray-400 border border-transparent"
                                }
                            `}
                        >
                            {MODE_LABELS[m]}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 min-h-0 p-3 overflow-hidden">
                <div className="h-full">
                    {MODE_COMPONENTS[mode]}
                </div>
            </div>
        </section>
    )
}
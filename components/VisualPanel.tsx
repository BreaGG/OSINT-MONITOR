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

    /* -------- MODE → COMPONENT MAP (INSIDE SCOPE) -------- */
    const MODE_COMPONENTS: Record<VisualMode, ReactNode> = {
        stream: <Stream />,
        cameras: <VisualFeeds />,
        satellite: <SatelliteView focus={satelliteFocus} />,
        social: <SocialView />,
        uav: <UAVView focus={satelliteFocus} />,
    }

    return (
        <section className="flex flex-col h-full bg-black/40 rounded-lg overflow-hidden">
            {/* ===================== MODE SELECTOR ===================== */}
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-800 text-[11px]">
                <span className="text-gray-500 tracking-wide">VIEW</span>

                {AVAILABLE_MODES.map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`
              px-2.5 py-1 rounded transition
              ${mode === m
                                ? "bg-black text-gray-200 border border-gray-700"
                                : "text-gray-500 hover:text-gray-300"
                            }
            `}
                    >
                        {m === "stream" && "BROADCAST"}
                        {m === "cameras" && "VISUAL SOURCES"}
                        {m === "satellite" && "SATELLITE"}
                        {m === "social" && "SOCIAL"}
                        {m === "uav" && "UAV"}
                    </button>
                ))}
            </div>

            {/* ===================== CONTENT SLOT ===================== */}
            <div className="flex-1 min-h-0 p-2">
                <div className="h-full scale-[0.92] origin-top">
                    {MODE_COMPONENTS[mode]}
                </div>
            </div>
        </section>
    )
}

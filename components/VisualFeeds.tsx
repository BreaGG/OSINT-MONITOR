"use client"

import { useEffect, useState } from "react"
import { visualSources } from "@/lib/visualSources"

const STORAGE_KEY = "osint.visual.activeId"

export default function VisualFeeds() {
    const [activeId, setActiveId] = useState<string>("")

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored && visualSources.some(v => v.id === stored)) {
            setActiveId(stored)
        } else {
            setActiveId(visualSources[0]?.id ?? "")
        }
    }, [])

    useEffect(() => {
        if (activeId) {
            localStorage.setItem(STORAGE_KEY, activeId)
        }
    }, [activeId])

    const active = visualSources.find(v => v.id === activeId)

    return (
        <div className="flex flex-col h-full gap-2">
            {/* SELECTOR */}
            <div className="shrink-0">
                <select
                    value={activeId}
                    onChange={e => setActiveId(e.target.value)}
                    className="
                        w-full bg-gray-900 text-gray-300 text-[10px] font-medium
                        border border-gray-800 rounded
                        px-3 py-2
                        focus:outline-none focus:border-cyan-500/50
                        cursor-pointer
                    "
                >
                    {visualSources.map(v => (
                        <option key={v.id} value={v.id}>
                            {v.name} — {v.country}
                        </option>
                    ))}
                </select>
            </div>

            {/* VIDEO */}
            <div className="flex-1 min-h-0 bg-black rounded border border-gray-800 overflow-hidden">
                {active && (
                    <iframe
                        src={active.embedUrl}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        loading="lazy"
                    />
                )}
            </div>

            {/* INFO */}
            {active && (
                <div className="shrink-0 space-y-1">
                    <div className="text-[9px] text-gray-500 leading-relaxed">
                        {active.description}
                    </div>
                    <div className="flex items-center gap-2 text-[8px] text-gray-700">
                        <span className="uppercase tracking-wider">Live Source</span>
                        <span>•</span>
                        <span>{active.source}</span>
                        <span>•</span>
                        <span className="uppercase">No Recording</span>
                    </div>
                </div>
            )}
        </div>
    )
}
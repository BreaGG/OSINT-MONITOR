"use client"

import { useEffect, useState } from "react"
import { visualSources } from "@/lib/visualSources"

const STORAGE_KEY = "osint.visual.activeId"

export default function VisualFeeds() {
    const [activeId, setActiveId] = useState<string>("")

    // LOAD persisted value
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored && visualSources.some(v => v.id === stored)) {
            setActiveId(stored)
        } else {
            setActiveId(visualSources[0]?.id ?? "")
        }
    }, [])

    // SAVE on change
    useEffect(() => {
        if (activeId) {
            localStorage.setItem(STORAGE_KEY, activeId)
        }
    }, [activeId])

    const active = visualSources.find(v => v.id === activeId)

    return (
        <div className="flex flex-col h-full">
            {/* SELECTOR */}
            <div className="px-3 py-2">
                <select
                    value={activeId}
                    onChange={e => setActiveId(e.target.value)}
                    className="
            w-full bg-black text-gray-200 text-sm
            border border-gray-800
            px-3 py-2 rounded
            focus:outline-none
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
            <div className="px-3 pb-3">
                <div className="aspect-video bg-black rounded overflow-hidden">
                    {active && (
                        <iframe
                            src={active.embedUrl}
                            className="w-full h-full"
                            allow="autoplay; encrypted-media; picture-in-picture"
                            loading="lazy"
                        />
                    )}
                </div>
            </div>

            {/* INFO */}
            {active && (
                <div className="px-3 text-[11px] text-gray-500 leading-snug">
                    {active.description}
                    <div className="mt-1 text-gray-600">
                        Live visual source · {active.source} · No recording
                    </div>
                </div>
            )}
        </div>
    )
}

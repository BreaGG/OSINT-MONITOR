"use client"

import { useState } from "react"
import { GlobalState } from "@/lib/gse"

function timeAgo(ts: number) {
    const diff = Math.floor((Date.now() - ts) / 60000)
    if (diff < 1) return "just now"
    if (diff < 60) return `${diff} min ago`
    const h = Math.floor(diff / 60)
    return `${h}h ago`
}

function confidenceWidth(level: GlobalState["confidence"]) {
    if (level === "high") return "w-full"
    if (level === "medium") return "w-2/3"
    return "w-1/3"
}

export default function GlobalStateIndicator({
    state,
}: {
    state: GlobalState
}) {
    const [open, setOpen] = useState(false)

    return (
        <div
            className="relative"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            {/* BADGE */}
            <span
                className={`
          text-[12px] px-2 py-0.5 rounded border cursor-default
          ${state.status === "stable" && "border-green-500/40 text-green-400"}
          ${state.status === "regional_escalation" && "border-yellow-500/40 text-yellow-400"}
          ${state.status === "multi_region_escalation" && "border-orange-500/40 text-orange-400"}
          ${state.status === "critical" && "border-red-500/40 text-red-400"}
        `}
            >
                SYSTEM: {state.status.replaceAll("_", " ").toUpperCase()}
            </span>

            {/* HOVER PANEL */}
            {open && (
                <div
                    className="
            absolute top-full left-0 mt-2 w-[540px]
            bg-black border border-gray-800 rounded-lg
            p-3 text-[11px] text-gray-300 z-50
          "
                >
                    {/* HEADER */}
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800">
                        <div className="uppercase tracking-wide text-gray-400">
                            Global system status
                        </div>
                        <div
                            className={`
                text-[10px] px-2 py-0.5 rounded border
                ${state.status === "critical" && "border-red-500/40 text-red-400"}
                ${state.status === "multi_region_escalation" && "border-orange-500/40 text-orange-400"}
                ${state.status === "regional_escalation" && "border-yellow-500/40 text-yellow-400"}
                ${state.status === "stable" && "border-green-500/40 text-green-400"}
              `}
                        >
                            {state.status.replaceAll("_", " ").toUpperCase()}
                        </div>
                    </div>

                    {/* MAIN GRID */}
                    <div className="grid grid-cols-2 gap-2">

                        {/* LEFT COLUMN */}
                        <div className="space-y-3 pr-2 border-r border-gray-800">

                            {/* PRIMARY AO */}
                            {state.primaryRegion && (
                                <div className="p-2 rounded bg-black/60 border border-red-900/40">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <div className="text-[10px] uppercase text-gray-500">
                                            Primary AO
                                        </div>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded border border-red-500/40 text-red-400">
                                            PRIMARY
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-100 font-medium">
                                        {state.primaryRegion}
                                    </div>
                                </div>
                            )}

                            {/* SECONDARY */}
                            {state.secondaryRegions.length > 0 && (
                                <div className="pt-2 border-t border-gray-800">
                                    <div className="text-[10px] uppercase text-gray-500 mb-0.5">
                                        Secondary regions
                                    </div>
                                    <ul className="space-y-0">
                                        {state.secondaryRegions.map(r => (
                                            <li key={r} className="text-gray-300">
                                                • {r}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="space-y-3 pl-2">

                            {/* DRIVERS */}
                            {state.drivers.length > 0 && (
                                <div>
                                    <div className="text-[10px] uppercase text-gray-500 mb-1">
                                        Drivers
                                    </div>
                                    <ul className="space-y-1">
                                        {state.drivers.map((d, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <span className="text-gray-400">•</span>
                                                <span className="flex-1">{d}</span>
                                                <span className="h-1 w-6 bg-red-500/30 rounded" />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* CONFIDENCE */}
                            <div className="pt-2 border-t border-gray-800">
                                <div className="text-[10px] uppercase text-gray-500 mb-1">
                                    Confidence
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-gray-800 rounded">
                                        <div
                                            className={`
                        h-1 rounded
                        ${confidenceWidth(state.confidence)}
                        ${state.confidence === "high" && "bg-green-500"}
                        ${state.confidence === "medium" && "bg-yellow-500"}
                        ${state.confidence === "low" && "bg-gray-500"}
                      `}
                                        />
                                    </div>
                                    <span className="text-gray-200 capitalize">
                                        {state.confidence}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-3 pt-2 border-t border-gray-800 text-[10px] text-gray-500 flex justify-between">
                        <span>Updated {timeAgo(state.updatedAt)}</span>
                        <span>Auto-generated assessment</span>
                    </div>
                </div>
            )}
        </div>
    )
}

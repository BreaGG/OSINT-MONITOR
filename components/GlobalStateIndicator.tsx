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
          text-[11px] px-2 py-0.5 rounded border cursor-default
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
            absolute top-full left-0 mt-2 w-[320px]
            bg-black border border-gray-800 rounded-md
            p-3 text-[11px] text-gray-300 z-50 space-y-3
          "
                >
                    {/* HEADER */}
                    <div className="uppercase tracking-wide text-gray-500">
                        Global system status
                    </div>

                    {/* PRIMARY AO */}
                    {state.primaryRegion && (
                        <div>
                            <div className="text-[10px] uppercase text-gray-500 mb-1">
                                Primary AO
                            </div>
                            <div className="text-gray-200">
                                • {state.primaryRegion}
                            </div>
                        </div>
                    )}

                    {/* SECONDARY */}
                    {state.secondaryRegions.length > 0 && (
                        <div>
                            <div className="text-[10px] uppercase text-gray-500 mb-1">
                                Secondary regions
                            </div>
                            <ul className="space-y-0.5">
                                {state.secondaryRegions.map(r => (
                                    <li key={r}>• {r}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* DRIVERS */}
                    {state.drivers.length > 0 && (
                        <div>
                            <div className="text-[10px] uppercase text-gray-500 mb-1">
                                Drivers
                            </div>
                            <ul className="space-y-0.5">
                                {state.drivers.map((d, i) => (
                                    <li key={i}>• {d}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* CONFIDENCE */}
                    <div>
                        <div className="text-[10px] uppercase text-gray-500 mb-1">
                            Confidence
                        </div>
                        <div className="text-gray-200 capitalize">
                            • {state.confidence} confidence assessment
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="pt-2 border-t border-gray-800 text-gray-500">
                        Updated {timeAgo(state.updatedAt)}
                    </div>
                </div>
            )}
        </div>
    )
}

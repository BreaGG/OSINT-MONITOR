"use client"

import { useState } from "react"
import { GlobalState } from "@/lib/gse"

function timeAgo(ts: number) {
    const diff = Math.floor((Date.now() - ts) / 60000)
    if (diff < 1) return "NOW"
    if (diff < 60) return `${diff}M`
    const h = Math.floor(diff / 60)
    if (h < 24) return `${h}H`
    const d = Math.floor(h / 24)
    return `${d}D`
}

function confidenceWidth(level: GlobalState["confidence"]) {
    if (level === "high") return "w-full"
    if (level === "medium") return "w-2/3"
    return "w-1/3"
}

function getStatusColor(status: GlobalState["status"]) {
    const colors = {
        stable: {
            border: "border-green-600/50",
            text: "text-green-400",
            bg: "bg-green-950/30",
            glow: "shadow-green-500/10"
        },
        regional_escalation: {
            border: "border-yellow-600/50",
            text: "text-yellow-400",
            bg: "bg-yellow-950/30",
            glow: "shadow-yellow-500/10"
        },
        multi_region_escalation: {
            border: "border-orange-600/50",
            text: "text-orange-400",
            bg: "bg-orange-950/30",
            glow: "shadow-orange-500/10"
        },
        critical: {
            border: "border-red-600/50",
            text: "text-red-400",
            bg: "bg-red-950/30",
            glow: "shadow-red-500/20"
        }
    }
    return colors[status]
}

function getStatusLabel(status: GlobalState["status"]) {
    const labels = {
        stable: "STABLE",
        regional_escalation: "REGIONAL",
        multi_region_escalation: "MULTI-REGION",
        critical: "CRITICAL"
    }
    return labels[status]
}

export default function GlobalStateIndicator({
    state,
}: {
    state: GlobalState
}) {
    const [open, setOpen] = useState(false)
    const colors = getStatusColor(state.status)
    const label = getStatusLabel(state.status)

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            {/* NATO-STYLE BADGE */}
            <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-600 uppercase tracking-[0.1em] font-bold">
                    SYS
                </span>
                <div className={`
                    flex items-center gap-1.5 px-2 py-1 rounded
                    border ${colors.border} ${colors.bg}
                    shadow-lg ${colors.glow}
                    cursor-default
                `}>
                    {/* Status indicator dot */}
                    <div className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')} animate-pulse`} />
                    <span className={`text-[10px] font-bold tracking-[0.15em] ${colors.text}`}>
                        {label}
                    </span>
                </div>
            </div>

            {/* NATO-STYLE HOVER PANEL */}
            {open && (
                <div
                    className="
                        absolute top-full left-0 mt-2 w-[520px]
                        bg-black/95 backdrop-blur-sm
                        border-2 border-gray-800
                        rounded
                        shadow-2xl shadow-black/80
                        z-[100]
                    "
                    onMouseEnter={() => setOpen(true)}
                    onMouseLeave={() => setOpen(false)}
                >
                    {/* HEADER - NATO STYLE */}
                    <div className={`
                        flex items-center justify-between
                        px-3 py-2
                        border-b-2 ${colors.border}
                        ${colors.bg}
                    `}>
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col items-center justify-center w-8 h-8 border-2 border-gray-700 bg-black/50">
                                <span className="text-[8px] text-gray-500 font-bold leading-none">SYS</span>
                                <span className="text-[6px] text-gray-600 font-bold leading-none mt-0.5">STAT</span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[9px] text-gray-500 uppercase tracking-[0.15em] font-bold leading-none">
                                    GLOBAL SYSTEM STATUS
                                </span>
                                <span className="text-[8px] text-gray-700 uppercase tracking-wider leading-none mt-1">
                                    Intelligence Assessment
                                </span>
                            </div>
                        </div>
                        
                        <div className={`
                            flex items-center gap-1.5
                            px-2.5 py-1 rounded
                            border ${colors.border} ${colors.bg}
                        `}>
                            <div className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')} animate-pulse`} />
                            <span className={`text-[9px] font-bold tracking-[0.15em] ${colors.text}`}>
                                {label}
                            </span>
                        </div>
                    </div>

                    {/* BODY */}
                    <div className="p-3 space-y-3">
                        
                        {/* MAIN GRID */}
                        <div className="grid grid-cols-2 gap-3">

                            {/* LEFT: REGIONS */}
                            <div className="space-y-2">
                                
                                {/* PRIMARY AO */}
                                {state.primaryRegion && (
                                    <div className="border border-red-900/50 bg-red-950/20 rounded overflow-hidden">
                                        <div className="bg-red-900/30 px-2 py-1 border-b border-red-900/50 flex items-center justify-between">
                                            <span className="text-[8px] text-red-400 uppercase tracking-[0.15em] font-bold">
                                                PRIMARY AO
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                                                <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "75ms" }} />
                                                <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                                            </div>
                                        </div>
                                        <div className="px-2 py-2 flex items-center justify-center">
                                            <span className="text-xs text-gray-200 font-bold tracking-wide">
                                                {state.primaryRegion}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* SECONDARY REGIONS */}
                                {state.secondaryRegions.length > 0 && (
                                    <div className="border border-gray-800 bg-gray-950/50 rounded overflow-hidden">
                                        <div className="bg-gray-900/50 px-2 py-1 border-b border-gray-800 flex items-center">
                                            <span className="text-[8px] text-gray-500 uppercase tracking-[0.15em] font-bold">
                                                SECONDARY AO
                                            </span>
                                        </div>
                                        <div className="px-2 py-2">
                                            <ul className="space-y-0.5">
                                                {state.secondaryRegions.map(r => (
                                                    <li key={r} className="flex items-center gap-1.5">
                                                        <span className="text-gray-700 text-[10px]">▸</span>
                                                        <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                                                            {r}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: DRIVERS + CONFIDENCE */}
                            <div className="space-y-2">
                                
                                {/* DRIVERS */}
                                {state.drivers.length > 0 && (
                                    <div className="border border-gray-800 bg-gray-950/50 rounded overflow-hidden">
                                        <div className="bg-gray-900/50 px-2 py-1 border-b border-gray-800 flex items-center">
                                            <span className="text-[8px] text-gray-500 uppercase tracking-[0.15em] font-bold">
                                                KEY DRIVERS
                                            </span>
                                        </div>
                                        <div className="px-2 py-2">
                                            <ul className="space-y-1">
                                                {state.drivers.map((d, i) => (
                                                    <li key={i} className="flex items-start gap-1.5">
                                                        <span className="text-red-600/70 text-[10px] mt-0.5">●</span>
                                                        <span className="flex-1 text-[10px] text-gray-400 leading-tight">
                                                            {d}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* CONFIDENCE */}
                                <div className="border border-gray-800 bg-gray-950/50 rounded overflow-hidden">
                                    <div className="bg-gray-900/50 px-2 py-1 border-b border-gray-800 flex items-center">
                                        <span className="text-[8px] text-gray-500 uppercase tracking-[0.15em] font-bold">
                                            ASSESSMENT CONFIDENCE
                                        </span>
                                    </div>
                                    <div className="px-2 py-2">
                                        <div className="space-y-1.5">
                                            <div className="h-1.5 bg-gray-900 rounded-sm overflow-hidden border border-gray-800">
                                                <div
                                                    className={`
                                                        h-full rounded-sm transition-all
                                                        ${confidenceWidth(state.confidence)}
                                                        ${state.confidence === "high" && "bg-green-600"}
                                                        ${state.confidence === "medium" && "bg-yellow-600"}
                                                        ${state.confidence === "low" && "bg-gray-700"}
                                                    `}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className={`
                                                    text-[9px] uppercase tracking-[0.15em] font-bold
                                                    ${state.confidence === "high" && "text-green-500"}
                                                    ${state.confidence === "medium" && "text-yellow-500"}
                                                    ${state.confidence === "low" && "text-gray-500"}
                                                `}>
                                                    {state.confidence}
                                                </span>
                                                <span className="text-[8px] text-gray-600">
                                                    {state.confidence === "high" && "90-100%"}
                                                    {state.confidence === "medium" && "60-90%"}
                                                    {state.confidence === "low" && "30-60%"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER - NATO STYLE */}
                    <div className="px-3 py-1.5 bg-gray-950/80 border-t border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <span className="text-[8px] text-gray-600 uppercase tracking-wider font-bold">UPD:</span>
                                <span className="text-[8px] text-gray-500 font-mono tracking-wider">
                                    {timeAgo(state.updatedAt)}
                                </span>
                            </div>
                            <div className="w-px h-3 bg-gray-800" />
                            <div className="flex items-center gap-1">
                                <div className="w-1 h-1 bg-cyan-500/50 rounded-full" />
                                <span className="text-[8px] text-gray-600 uppercase tracking-wider">
                                    AUTO-GEN
                                </span>
                            </div>
                        </div>
                        <span className="text-[7px] text-gray-700 uppercase tracking-wider font-mono">
                            INTEL-SYS-V2
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
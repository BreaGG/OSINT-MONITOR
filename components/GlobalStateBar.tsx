"use client"

import { GlobalState } from "@/lib/gse"

const STATUS_COLOR: Record<string, string> = {
    stable: "text-green-400",
    regional_escalation: "text-yellow-400",
    multi_region_escalation: "text-orange-400",
    critical: "text-red-500",
}

export default function GlobalStateBar({ state }: { state: GlobalState }) {
    return (
        <div className="w-full px-3 py-2 border-b border-gray-800 bg-black text-[12px] flex justify-between items-center">
            <div className="flex gap-4 items-center">
                <span className={`font-semibold ${STATUS_COLOR[state.status]}`}>
                    GLOBAL STATUS: {state.status.replaceAll("_", " ").toUpperCase()}
                </span>

                {state.primaryRegion && (
                    <span className="text-gray-300">
                        Primary AO: {state.primaryRegion}
                    </span>
                )}

                {state.secondaryRegions.length > 0 && (
                    <span className="text-gray-500">
                        Secondary: {state.secondaryRegions.join(", ")}
                    </span>
                )}
            </div>

            <div className="flex gap-4 text-gray-500">
                <span>Confidence: {state.confidence.toUpperCase()}</span>
                <span>
                    Updated: {new Date(state.updatedAt).toUTCString().slice(17, 25)}Z
                </span>
            </div>
        </div>
    )
}

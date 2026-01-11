"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import UAVView, { UAVFocus } from "@/components/UAVView"
import GlobalStateBar from "@/components/GlobalStateBar"
import { buildGlobalState, isPrimaryAO } from "@/lib/gse"
import { adaptEventsToGSE } from "@/lib/eventToGSE"
import { Event } from "@/lib/types"

export default function UAVClientPage() {
    const params = useSearchParams()

    /* ===================== UAV FOCUS ===================== */

    const focus: UAVFocus | undefined = params.get("lat")
        ? {
            lat: Number(params.get("lat")),
            lon: Number(params.get("lon")),
            region: params.get("region") ?? "AO",
            label: params.get("label") ?? "ISR tasking",
        }
        : undefined

    /* ===================== GLOBAL STATE ===================== */

    const [globalState, setGlobalState] =
        useState<ReturnType<typeof buildGlobalState> | null>(null)

    useEffect(() => {
        fetch("/api/events")
            .then(res => res.json())
            .then((events: Event[]) => {
                const gseEvents = adaptEventsToGSE(events)
                const state = buildGlobalState(gseEvents)
                setGlobalState(state)
            })
            .catch(() => setGlobalState(null))
    }, [])

    const primaryAO =
        globalState && focus
            ? isPrimaryAO(globalState, focus.region)
            : false

    /* ===================== RENDER ===================== */

    return (
        <div className="w-screen h-screen bg-black flex flex-col">
            {/* GLOBAL CONTEXT */}
            {globalState && <GlobalStateBar state={globalState} />}

            {/* UAV FEED */}
            <div className="flex-1 min-h-0">
                <UAVView
                    focus={focus}
                    globalStatus={globalState?.status}
                    isPrimaryAO={primaryAO}
                />
            </div>
        </div>
    )
}

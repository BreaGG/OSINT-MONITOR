"use client"

import { useEffect, useMemo, useState } from "react"

/* ===================== TYPES ===================== */

type ZoomLevel = "macro" | "regional" | "urban"

export type SatelliteFocus = {
    lat: number
    lon: number
    region: string
    label?: string
}

/* ===================== CONFIG ===================== */

const ZOOM_LEVELS: Record<ZoomLevel, number> = {
    macro: 5,
    regional: 9,
    urban: 13,
}

const PAN_STEP: Record<ZoomLevel, number> = {
    macro: 1.2,
    regional: 0.3,
    urban: 0.06,
}

const DEFAULT_FOCUS: SatelliteFocus = {
    lat: 0,
    lon: 0,
    region: "Custom coordinates",
    label: "Satellite snapshot",
}

/* ===================== COMPONENT ===================== */

type Props = {
    focus?: SatelliteFocus
}

export default function SatelliteView({ focus }: Props) {
    const [zoom, setZoom] = useState<ZoomLevel>("macro")
    const [currentFocus, setCurrentFocus] =
        useState<SatelliteFocus>(focus ?? DEFAULT_FOCUS)

    /* ---- Custom coordinate inputs ---- */
    const [latInput, setLatInput] = useState("")
    const [lonInput, setLonInput] = useState("")

    /* -------- UPDATE FOCUS WHEN PROP CHANGES -------- */
    useEffect(() => {
        if (focus) {
            setCurrentFocus(focus)
            setLatInput("")
            setLonInput("")
        }
    }, [focus])

    /* -------- APPLY CUSTOM COORDINATES -------- */
    const applyCustomCoords = () => {
        const lat = Number(latInput)
        const lon = Number(lonInput)

        if (
            Number.isNaN(lat) ||
            Number.isNaN(lon) ||
            lat < -90 ||
            lat > 90 ||
            lon < -180 ||
            lon > 180
        ) {
            return
        }

        setCurrentFocus({
            lat,
            lon,
            region: "Custom coordinates",
            label: `Lat ${lat.toFixed(3)}, Lon ${lon.toFixed(3)}`,
        })

        setLatInput("")
        setLonInput("")
    }

    /* -------- PAN HANDLER -------- */
    const pan = (dx: number, dy: number) => {
        const step = PAN_STEP[zoom]
        setCurrentFocus(prev => ({
            ...prev,
            lat: prev.lat + dy * step,
            lon: prev.lon + dx * step,
        }))
    }

    const imageSize = "640x360"
    const zoomValue = ZOOM_LEVELS[zoom]

    const imageUrl = useMemo(() => {
        return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${currentFocus.lon},${currentFocus.lat},${zoomValue}/${imageSize}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
    }, [currentFocus, zoomValue])

    const generatedAt = useMemo(
        () => new Date().toUTCString(),
        [currentFocus, zoom]
    )

    return (
        <div className="flex flex-col h-full">
            {/* IMAGE */}
            <div className="relative aspect-video bg-black rounded overflow-hidden">
                <img
                    src={imageUrl}
                    alt="Satellite imagery"
                    className="w-full h-full object-cover"
                />

                {/* CUSTOM COORDINATES */}
                <div className="absolute top-2 left-2 bg-black/70 border border-gray-800 rounded px-2 py-1 text-[11px] flex gap-1 items-center">
                    <input
                        type="number"
                        step="any"
                        placeholder="Lat"
                        value={latInput}
                        onChange={e => setLatInput(e.target.value)}
                        className="w-[70px] bg-black text-gray-200 border border-gray-700 px-1 py-0.5 rounded focus:outline-none"
                    />
                    <input
                        type="number"
                        step="any"
                        placeholder="Lon"
                        value={lonInput}
                        onChange={e => setLonInput(e.target.value)}
                        className="w-[70px] bg-black text-gray-200 border border-gray-700 px-1 py-0.5 rounded focus:outline-none"
                    />
                    <button
                        onClick={applyCustomCoords}
                        className="px-2 py-0.5 border border-gray-700 rounded text-gray-300 hover:bg-white/10"
                    >
                        APPLY
                    </button>
                </div>

                {/* ZOOM CONTROL */}
                <div className="absolute bottom-2 left-2 flex gap-1 text-[11px] bg-black/70 border border-gray-800 rounded px-1 py-1">
                    {(["macro", "regional", "urban"] as ZoomLevel[]).map(z => (
                        <button
                            key={z}
                            onClick={() => setZoom(z)}
                            className={`px-2 py-0.5 rounded ${zoom === z
                                    ? "bg-black text-gray-200 border border-gray-600"
                                    : "text-gray-500 hover:text-gray-300"
                                }`}
                        >
                            {z.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* PAN CONTROLS */}
                <div className="absolute bottom-2 right-2 bg-black/70 border border-gray-800 rounded p-1 text-[11px]">
                    <div className="grid grid-cols-3 gap-0.5 text-gray-300">
                        <div />
                        <button onClick={() => pan(0, 1)} className="hover:bg-white/10 rounded">↑</button>
                        <div />
                        <button onClick={() => pan(-1, 0)} className="hover:bg-white/10 rounded">←</button>
                        <span className="text-gray-500">●</span>
                        <button onClick={() => pan(1, 0)} className="hover:bg-white/10 rounded">→</button>
                        <div />
                        <button onClick={() => pan(0, -1)} className="hover:bg-white/10 rounded">↓</button>
                        <div />
                    </div>
                </div>

                {/* ORIENTATION */}
                <div className="absolute top-2 right-2 text-[10px] text-gray-400 bg-black/60 border border-gray-800 rounded px-2 py-1">
                    N ↑ · {zoom.toUpperCase()}
                </div>
            </div>

            {/* METADATA */}
            <div className="mt-2 text-[11px] text-gray-500 leading-snug">
                <div className="text-gray-300">{currentFocus.region}</div>
                <div className="text-gray-400">
                    {currentFocus.label ?? "Satellite snapshot"}
                </div>
                <div className="text-gray-600 mt-0.5">
                    Source: Mapbox Satellite · Static imagery · Generated: {generatedAt}
                </div>
            </div>
        </div>
    )
}

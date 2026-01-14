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

    const [latInput, setLatInput] = useState("")
    const [lonInput, setLonInput] = useState("")

    useEffect(() => {
        if (focus) {
            setCurrentFocus(focus)
            setLatInput("")
            setLonInput("")
        }
    }, [focus])

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
        <div className="flex flex-col h-full gap-2">
            {/* IMAGE */}
            <div className="relative flex-1 min-h-0 bg-black rounded border border-gray-800 overflow-hidden">
                <img
                    src={imageUrl}
                    alt="Satellite imagery"
                    className="w-full h-full object-cover"
                />

                {/* COORDINATES INPUT */}
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/80 border border-gray-800 rounded px-2 py-1">
                    <input
                        type="number"
                        step="any"
                        placeholder="LAT"
                        value={latInput}
                        onChange={e => setLatInput(e.target.value)}
                        className="
                            w-[60px] bg-black/50 text-gray-300 text-[9px] font-mono
                            border border-gray-700 rounded px-1.5 py-0.5
                            placeholder:text-gray-700 placeholder:text-[8px]
                            focus:outline-none focus:border-cyan-500/50
                        "
                    />
                    <input
                        type="number"
                        step="any"
                        placeholder="LON"
                        value={lonInput}
                        onChange={e => setLonInput(e.target.value)}
                        className="
                            w-[60px] bg-black/50 text-gray-300 text-[9px] font-mono
                            border border-gray-700 rounded px-1.5 py-0.5
                            placeholder:text-gray-700 placeholder:text-[8px]
                            focus:outline-none focus:border-cyan-500/50
                        "
                    />
                    <button
                        onClick={applyCustomCoords}
                        className="
                            px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider
                            bg-cyan-600 hover:bg-cyan-700 text-white
                            transition-all
                        "
                    >
                        GO
                    </button>
                </div>

                {/* ZOOM CONTROL */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/80 border border-gray-800 rounded px-1.5 py-1">
                    {(["macro", "regional", "urban"] as ZoomLevel[]).map(z => (
                        <button
                            key={z}
                            onClick={() => setZoom(z)}
                            className={`
                                px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider
                                transition-all
                                ${zoom === z
                                    ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                                    : "text-gray-600 hover:text-gray-400 border border-transparent"
                                }
                            `}
                        >
                            {z.substring(0, 3)}
                        </button>
                    ))}
                </div>

                {/* PAN CONTROLS */}
                <div className="absolute bottom-2 right-2 bg-black/80 border border-gray-800 rounded p-1">
                    <div className="grid grid-cols-3 gap-0.5 text-[10px] text-gray-400">
                        <div />
                        <button 
                            onClick={() => pan(0, 1)} 
                            className="w-6 h-6 flex items-center justify-center hover:bg-cyan-500/20 hover:text-cyan-400 rounded transition"
                        >
                            ↑
                        </button>
                        <div />
                        <button 
                            onClick={() => pan(-1, 0)} 
                            className="w-6 h-6 flex items-center justify-center hover:bg-cyan-500/20 hover:text-cyan-400 rounded transition"
                        >
                            ←
                        </button>
                        <div className="w-6 h-6 flex items-center justify-center text-gray-700">
                            ●
                        </div>
                        <button 
                            onClick={() => pan(1, 0)} 
                            className="w-6 h-6 flex items-center justify-center hover:bg-cyan-500/20 hover:text-cyan-400 rounded transition"
                        >
                            →
                        </button>
                        <div />
                        <button 
                            onClick={() => pan(0, -1)} 
                            className="w-6 h-6 flex items-center justify-center hover:bg-cyan-500/20 hover:text-cyan-400 rounded transition"
                        >
                            ↓
                        </button>
                        <div />
                    </div>
                </div>

                {/* ORIENTATION */}
                <div className="absolute top-2 right-2 bg-black/80 border border-gray-800 rounded px-2 py-1">
                    <span className="text-[8px] text-gray-500 uppercase tracking-wider font-bold">
                        N ↑ · {zoom.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* METADATA */}
            <div className="shrink-0 space-y-1">
                <div className="text-[9px] text-gray-400 font-medium">
                    {currentFocus.region}
                </div>
                <div className="text-[9px] text-gray-600">
                    {currentFocus.label ?? "Satellite snapshot"}
                </div>
                <div className="flex items-center gap-2 text-[8px] text-gray-700">
                    <span className="uppercase tracking-wider">Mapbox Satellite</span>
                    <span>•</span>
                    <span>Static Imagery</span>
                    <span>•</span>
                    <span className="truncate">{generatedAt}</span>
                </div>
            </div>
        </div>
    )
}
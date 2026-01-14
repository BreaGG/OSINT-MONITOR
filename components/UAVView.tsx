"use client"

import { useEffect, useMemo, useRef, useState } from "react"

/* ===================== TYPES ===================== */

export type UAVFocus = {
    lat: number
    lon: number
    region: string
    label?: string
}

type Altitude = "low" | "medium" | "high"
type Pattern = "orbit" | "transit"
type Mission = "surveillance" | "recon" | "tracking"
type Sensor = "eo" | "ir" | "low-light"
type UAVStatus = "standby" | "enroute" | "onstation"

/* ===================== CONFIG ===================== */

const ALTITUDE_CONFIG: Record<Altitude, { zoom: number; step: number }> = {
    low: { zoom: 15, step: 0.001 },
    medium: { zoom: 13, step: 0.006 },
    high: { zoom: 11, step: 0.02 },
}

const SENSOR_FILTERS: Record<Sensor, string> = {
    eo: "contrast(1) brightness(1)",
    ir: "grayscale(1) contrast(1.4) brightness(1.2)",
    "low-light": "brightness(0.7) contrast(1.2)",
}

const SENSOR_MODES: Record<Sensor, string> = {
    eo: "VISUAL",
    ir: "THERMAL",
    "low-light": "LOW-VIS",
}

const DEFAULT_FOCUS: UAVFocus = {
    lat: 0,
    lon: 0,
    region: "Global AO",
    label: "UAV standby",
}

const MAX_ENDURANCE_MIN = 180

/* ===================== HELPERS ===================== */

function bearing(dx: number, dy: number) {
    if (dx === 0 && dy === 0) return "—"
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "E" : "W"
    if (Math.abs(dy) > Math.abs(dx)) return dy > 0 ? "N" : "S"
    if (dx > 0 && dy > 0) return "NE"
    if (dx < 0 && dy > 0) return "NW"
    if (dx > 0 && dy < 0) return "SE"
    return "SW"
}

/* ===================== COMPONENT ===================== */

type Props = {
    focus?: UAVFocus
    globalStatus?: string
    isPrimaryAO?: boolean
}

export default function UAVView({ focus, globalStatus, isPrimaryAO }: Props) {
    const [altitude, setAltitude] = useState<Altitude>("medium")
    const [pattern, setPattern] = useState<Pattern>("orbit")
    const [mission, setMission] = useState<Mission>("surveillance")
    const [sensor, setSensor] = useState<Sensor>("eo")
    const [status, setStatus] = useState<UAVStatus>("standby")
    const [onStationMinutes, setOnStationMinutes] = useState(0)
    const [cityQuery, setCityQuery] = useState("")
    const [deploying, setDeploying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentFocus, setCurrentFocus] = useState<UAVFocus>(focus ?? DEFAULT_FOCUS)

    const originRef = useRef(currentFocus)
    const lastMove = useRef({ dx: 0, dy: 0 })

    useEffect(() => {
        if (focus) {
            setCurrentFocus(focus)
            originRef.current = focus
            setStatus("enroute")
            setOnStationMinutes(0)
        }
    }, [focus])

    useEffect(() => {
        if (status !== "onstation") return
        const id = setInterval(() => {
            setOnStationMinutes(m => m + 1)
        }, 60000)
        return () => clearInterval(id)
    }, [status])

    const taskingPriority =
        isPrimaryAO && globalStatus !== "stable"
            ? "HIGH"
            : globalStatus === "critical"
            ? "MEDIUM"
            : "NORMAL"

    useEffect(() => {
        if (globalStatus === "critical" && !isPrimaryAO) {
            console.warn("UAV operating outside primary AO during CRITICAL global state")
        }
    }, [globalStatus, isPrimaryAO])

    const { zoom, step } = ALTITUDE_CONFIG[altitude]
    const size = "640x360"

    const deployCity = async () => {
        if (!cityQuery.trim()) return
        setDeploying(true)
        setError(null)

        try {
            const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                    cityQuery
                )}.json?types=place,locality&limit=1&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
            )

            const data = await res.json()
            const place = data.features?.[0]
            if (!place) throw new Error()

            const [lon, lat] = place.center

            const newFocus: UAVFocus = {
                lat,
                lon,
                region: place.text,
                label: "Urban ISR tasking",
            }

            setCurrentFocus(newFocus)
            originRef.current = newFocus
            setAltitude("medium")
            setPattern("orbit")
            setMission("surveillance")
            setSensor("eo")
            setStatus("enroute")
            setOnStationMinutes(0)
            setCityQuery("")
        } catch {
            setError("City not found")
        } finally {
            setDeploying(false)
        }
    }

    const move = (dx: number, dy: number) => {
        lastMove.current = { dx, dy }
        setCurrentFocus(f => ({
            ...f,
            lat: f.lat + dy,
            lon: f.lon + dx,
        }))
    }

    useEffect(() => {
        if (pattern !== "orbit") return

        const interval = mission === "surveillance" ? 4000 : 2500

        const id = setInterval(() => {
            const dx = step * (mission === "recon" ? 0.6 : 0.3)
            const dy = step * 0.2
            lastMove.current = { dx, dy }

            setCurrentFocus(f => ({
                ...f,
                lat: f.lat + dy,
                lon: f.lon + dx,
            }))

            if (status === "enroute") setStatus("onstation")
        }, interval)

        return () => clearInterval(id)
    }, [pattern, mission, step, status])

    const heading = bearing(lastMove.current.dx, lastMove.current.dy)

    const imageUrl = useMemo(() => {
        return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${currentFocus.lon},${currentFocus.lat},${zoom}/${size}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
    }, [currentFocus, zoom])

    const timestamp = useMemo(
        () => new Date().toUTCString(),
        [currentFocus, altitude, mission, sensor]
    )

    const enduranceLeft = Math.max(MAX_ENDURANCE_MIN - onStationMinutes, 0)

    const popOut = () => {
        const params = new URLSearchParams({
            lat: String(currentFocus.lat),
            lon: String(currentFocus.lon),
            region: currentFocus.region,
            label: currentFocus.label ?? "",
        })

        window.open(`/uav?${params.toString()}`, "_blank", "noopener,noreferrer")
    }

    return (
        <div className="flex flex-col h-full gap-2">
            {/* DEPLOY BAR */}
            <div className="flex items-center gap-1 shrink-0">
                <input
                    value={cityQuery}
                    onChange={e => setCityQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && deployCity()}
                    placeholder="DEPLOY TO CITY..."
                    className="
                        flex-1 bg-gray-900 border border-gray-800 rounded
                        px-2 py-1 text-[10px] text-gray-300 font-medium
                        placeholder:text-gray-700 placeholder:uppercase placeholder:tracking-wider
                        focus:outline-none focus:border-cyan-500/50
                    "
                />
                <button
                    onClick={deployCity}
                    disabled={deploying}
                    className="
                        px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider
                        bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-800
                        text-white transition-all
                    "
                >
                    {deploying ? "..." : "Deploy"}
                </button>
                <button
                    onClick={popOut}
                    className="
                        px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider
                        bg-gray-800 hover:bg-gray-700 text-gray-400
                        border border-gray-700 transition-all
                    "
                >
                    ⤢
                </button>
            </div>

            {error && (
                <div className="shrink-0 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded">
                    <span className="text-[9px] text-red-400 uppercase tracking-wider">
                        {error}
                    </span>
                </div>
            )}

            {/* FEED */}
            <div className="relative flex-1 min-h-0 bg-black rounded border border-gray-800 overflow-hidden">
                <img
                    src={imageUrl}
                    alt="UAV ISR feed"
                    className="w-full h-full object-cover"
                    style={{ filter: SENSOR_FILTERS[sensor] }}
                />

                <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:100%_3px]" />

                {/* STATUS HUD */}
                <div className="absolute top-2 left-2 bg-black/80 border border-gray-800 rounded px-2 py-1.5 space-y-0.5 text-[9px] font-mono">
                    <div className="text-cyan-400 font-bold">UAV-01 · {status.toUpperCase()}</div>
                    <div className="text-gray-400">
                        MSN {mission.toUpperCase()} · ALT {altitude.toUpperCase()}
                    </div>
                    <div className="text-gray-400">
                        SNS {sensor.toUpperCase()} · {SENSOR_MODES[sensor]}
                    </div>
                    <div className="text-gray-500">
                        HDG {heading} · TOS {onStationMinutes}M
                    </div>
                    <div className="text-gray-500">
                        END {enduranceLeft}M
                    </div>

                    <div className="pt-1 border-t border-gray-800/50">
                        <div className={`
                            ${taskingPriority === "HIGH" ? "text-red-400" : 
                              taskingPriority === "MEDIUM" ? "text-yellow-400" : 
                              "text-green-400"}
                        `}>
                            PRIORITY: {taskingPriority}
                        </div>
                        {!isPrimaryAO && globalStatus === "critical" && (
                            <div className="text-yellow-500 text-[8px]">
                                ⚠ OUTSIDE PRIMARY AO
                            </div>
                        )}
                    </div>
                </div>

                {/* MOVEMENT */}
                <div className="absolute top-2 right-2 grid grid-cols-3 gap-0.5">
                    {[
                        [null, [0, step], null],
                        [[-step, 0], "home", [step, 0]],
                        [null, [0, -step], null],
                    ].map((row, i) => (
                        <div key={i} className="contents">
                            {row.map((cell, j) => {
                                if (cell === null) return <div key={j} />
                                if (cell === "home") return (
                                    <button
                                        key={j}
                                        onClick={() => setCurrentFocus(originRef.current)}
                                        className="w-6 h-6 flex items-center justify-center bg-black/60 border border-gray-700 rounded text-[10px] text-cyan-400 hover:bg-cyan-500/20 transition"
                                    >
                                        ⦿
                                    </button>
                                )
                                const [dx, dy] = cell as number[]
                                return (
                                    <button
                                        key={j}
                                        onClick={() => move(dx, dy)}
                                        className="w-6 h-6 flex items-center justify-center bg-black/60 border border-gray-700 rounded text-[10px] text-gray-400 hover:bg-cyan-500/20 hover:text-cyan-400 transition"
                                    >
                                        {dy > 0 ? "▲" : dy < 0 ? "▼" : dx > 0 ? "▶" : "◀"}
                                    </button>
                                )
                            })}
                        </div>
                    ))}
                </div>

                {/* ALTITUDE CONTROL */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/80 border border-gray-800 rounded px-1.5 py-1">
                    {(["low", "medium", "high"] as Altitude[]).map(a => (
                        <button
                            key={a}
                            onClick={() => setAltitude(a)}
                            className={`
                                px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider
                                transition-all
                                ${altitude === a
                                    ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                                    : "text-gray-600 hover:text-gray-400 border border-transparent"
                                }
                            `}
                        >
                            {a}
                        </button>
                    ))}
                </div>

                {/* SENSOR CONTROL */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/80 border border-gray-800 rounded px-1.5 py-1">
                    {(["eo", "ir", "low-light"] as Sensor[]).map(s => (
                        <button
                            key={s}
                            onClick={() => setSensor(s)}
                            className={`
                                px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider
                                transition-all
                                ${sensor === s
                                    ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                                    : "text-gray-600 hover:text-gray-400 border border-transparent"
                                }
                            `}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* METADATA */}
            <div className="shrink-0 space-y-1">
                <div className="text-[9px] text-gray-400 font-medium">
                    AO: {currentFocus.region}
                </div>
                <div className="text-[9px] text-gray-600">
                    {currentFocus.label ?? "ISR UAV asset"}
                </div>
                <div className="flex items-center gap-2 text-[8px] text-gray-700">
                    <span className="uppercase tracking-wider">Simulated UAV ISR</span>
                    <span>•</span>
                    <span className="truncate">{timestamp}</span>
                </div>
            </div>
        </div>
    )
}
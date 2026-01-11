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

/* ===================== CONFIG ===================== */

const ALTITUDE_CONFIG: Record<
    Altitude,
    { zoom: number; step: number }
> = {
    low: { zoom: 15, step: 0.001 },
    medium: { zoom: 13, step: 0.006 },
    high: { zoom: 11, step: 0.02 },
}

const SENSOR_FILTERS: Record<Sensor, string> = {
    eo: "contrast(1) brightness(1)",
    ir: "grayscale(1) contrast(1.4) brightness(1.2)",
    "low-light": "brightness(0.7) contrast(1.2)",
}

const DEFAULT_FOCUS: UAVFocus = {
    lat: 0,
    lon: 0,
    region: "Global AO",
    label: "UAV standby",
}

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
}

export default function UAVView({ focus }: Props) {
    const [altitude, setAltitude] = useState<Altitude>("medium")
    const [pattern, setPattern] = useState<Pattern>("orbit")
    const [mission, setMission] = useState<Mission>("surveillance")
    const [sensor, setSensor] = useState<Sensor>("eo")

    const [cityQuery, setCityQuery] = useState("")
    const [deploying, setDeploying] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [currentFocus, setCurrentFocus] =
        useState<UAVFocus>(focus ?? DEFAULT_FOCUS)

    const originRef = useRef(currentFocus)
    const lastMove = useRef({ dx: 0, dy: 0 })

    /* -------- UPDATE FROM MAP -------- */
    useEffect(() => {
        if (focus) {
            setCurrentFocus(focus)
            originRef.current = focus
        }
    }, [focus])

    const { zoom, step } = ALTITUDE_CONFIG[altitude]
    const size = "640x360"

    /* -------- DEPLOY TO CITY -------- */
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

            if (!place) {
                setError("City not found")
                return
            }

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
            setCityQuery("")
        } catch {
            setError("Geocoding failed")
        } finally {
            setDeploying(false)
        }
    }

    /* -------- MANUAL MOVE -------- */
    const move = (dx: number, dy: number) => {
        lastMove.current = { dx, dy }
        setCurrentFocus(f => ({
            ...f,
            lat: f.lat + dy,
            lon: f.lon + dx,
        }))
    }

    /* -------- AUTO ORBIT -------- */
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
        }, interval)

        return () => clearInterval(id)
    }, [pattern, mission, step])

    const heading = bearing(
        lastMove.current.dx,
        lastMove.current.dy
    )

    const imageUrl = useMemo(() => {
        return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${currentFocus.lon},${currentFocus.lat},${zoom}/${size}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
    }, [currentFocus, zoom])

    const timestamp = useMemo(
        () => new Date().toUTCString(),
        [currentFocus, altitude, mission, sensor]
    )

    /* ===================== RENDER ===================== */

    return (
        <div className="flex flex-col h-full bg-black">
            {/* DEPLOY BAR */}
            <div className="px-2 py-1 border-b border-gray-800 flex gap-1 text-[11px]">
                <input
                    value={cityQuery}
                    onChange={e => setCityQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && deployCity()}
                    placeholder="Deploy UAV to city…"
                    className="flex-1 bg-black border border-gray-800 px-2 py-1 text-gray-200 outline-none"
                />
                <button
                    onClick={deployCity}
                    disabled={deploying}
                    className="px-2 py-1 border border-gray-700 text-gray-200"
                >
                    {deploying ? "…" : "DEPLOY"}
                </button>
            </div>

            {error && (
                <div className="px-2 py-1 text-[10px] text-red-400">
                    {error}
                </div>
            )}

            {/* FEED */}
            <div className="relative aspect-video bg-black rounded overflow-hidden">
                <img
                    src={imageUrl}
                    alt="UAV ISR feed"
                    className="w-full h-full object-cover"
                    style={{ filter: SENSOR_FILTERS[sensor] }}
                />

                <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:100%_3px]" />

                {/* STATUS */}
                <div className="absolute top-2 left-2 text-[10px] text-gray-300 bg-black/70 border border-gray-800 rounded px-2 py-1 space-y-0.5">
                    <div>UAV ISR · {mission.toUpperCase()}</div>
                    <div>
                        SENSOR {sensor.toUpperCase()} · ALT {altitude.toUpperCase()}
                    </div>
                    <div>HDG {heading}</div>
                </div>

                {/* MOVEMENT */}
                <div className="absolute top-2 right-2 grid grid-cols-3 gap-0.5 text-[11px]">
                    <div />
                    <button onClick={() => move(0, step)}>▲</button>
                    <div />
                    <button onClick={() => move(-step, 0)}>◀</button>
                    <button onClick={() => setCurrentFocus(originRef.current)}>
                        ⦿
                    </button>
                    <button onClick={() => move(step, 0)}>▶</button>
                    <div />
                    <button onClick={() => move(0, -step)}>▼</button>
                    <div />
                </div>

                {/* CONTROLS */}
                <div className="absolute bottom-2 left-2 flex gap-1 text-[11px] bg-black/70 border border-gray-800 rounded px-1 py-1">
                    {(["low", "medium", "high"] as Altitude[]).map(a => (
                        <button
                            key={a}
                            onClick={() => setAltitude(a)}
                            className={altitude === a ? "text-gray-200" : "text-gray-500"}
                        >
                            {a.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="absolute bottom-2 right-2 flex gap-1 text-[11px] bg-black/70 border border-gray-800 rounded px-1 py-1">
                    {(["eo", "ir", "low-light"] as Sensor[]).map(s => (
                        <button
                            key={s}
                            onClick={() => setSensor(s)}
                            className={sensor === s ? "text-gray-200" : "text-gray-500"}
                        >
                            {s.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* METADATA */}
            <div className="mt-2 text-[11px] text-gray-500 leading-snug">
                <div className="text-gray-300">
                    AO: {currentFocus.region}
                </div>
                <div className="text-gray-400">
                    {currentFocus.label ?? "ISR UAV asset"}
                </div>
                <div className="text-gray-600 mt-0.5">
                    Simulated UAV ISR · {timestamp}
                </div>
            </div>
        </div>
    )
}

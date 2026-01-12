"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"

type TimeWindow = "6h" | "24h" | "72h"

type Props = {
    events: Event[]
    onSelectEvent?: (event: Event) => void
    onTimeRangeChange?: (start: Date, end: Date) => void
}

export default function GlobalTimeline({ events, onSelectEvent, onTimeRangeChange }: Props) {
    const [timeWindow, setTimeWindow] = useState<TimeWindow>("24h")
    const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)
    const [selectedTime, setSelectedTime] = useState<Date | null>(null)
    const timelineRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [scrollStart, setScrollStart] = useState(0)

    // Calcular ventana de tiempo
    const timeWindowMs = {
        "6h": 6 * 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000,
        "72h": 72 * 60 * 60 * 1000,
    }

    const now = useMemo(() => new Date(), [])
    const startTime = useMemo(() => {
        return new Date(now.getTime() - timeWindowMs[timeWindow])
    }, [now, timeWindow])

    // Filtrar eventos dentro de la ventana
    const timelineEvents = useMemo(() => {
        return events
            .filter(e => {
                const eventDate = new Date(e.date)
                return eventDate >= startTime && eventDate <= now
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }, [events, startTime, now])

    // Agrupar eventos por hora
    const eventsByHour = useMemo(() => {
        const groups: Record<string, Event[]> = {}

        timelineEvents.forEach(event => {
            const date = new Date(event.date)
            const hourKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`

            if (!groups[hourKey]) {
                groups[hourKey] = []
            }
            groups[hourKey].push(event)
        })

        return groups
    }, [timelineEvents])

    // Crear buckets de tiempo para el gráfico
    const timeBuckets = useMemo(() => {
        const buckets: Array<{
            time: Date
            events: Event[]
            hourLabel: string
        }> = []

        const bucketSize = timeWindow === "6h" ? 30 * 60 * 1000 : // 30 min
            timeWindow === "24h" ? 60 * 60 * 1000 : // 1 hora
                3 * 60 * 60 * 1000 // 3 horas

        let currentTime = startTime.getTime()

        while (currentTime <= now.getTime()) {
            const bucketDate = new Date(currentTime)
            const bucketEvents = timelineEvents.filter(e => {
                const eventTime = new Date(e.date).getTime()
                return eventTime >= currentTime && eventTime < currentTime + bucketSize
            })

            buckets.push({
                time: bucketDate,
                events: bucketEvents,
                hourLabel: bucketDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: timeWindow === "6h" ? '2-digit' : undefined,
                    hour12: false
                })
            })

            currentTime += bucketSize
        }

        return buckets
    }, [timelineEvents, startTime, now, timeWindow])

    // Calcular altura máxima para normalizar barras
    const maxEvents = useMemo(() => {
        return Math.max(...timeBuckets.map(b => b.events.length), 1)
    }, [timeBuckets])

    // Handler para click en bucket
    const handleBucketClick = (bucket: typeof timeBuckets[0]) => {
        setSelectedTime(bucket.time)
        if (onTimeRangeChange) {
            const bucketSize = timeWindow === "6h" ? 30 * 60 * 1000 :
                timeWindow === "24h" ? 60 * 60 * 1000 :
                    3 * 60 * 60 * 1000
            onTimeRangeChange(bucket.time, new Date(bucket.time.getTime() + bucketSize))
        }
    }

    // Drag to scroll
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!timelineRef.current) return
        setIsDragging(true)
        setScrollStart(e.pageX - timelineRef.current.offsetLeft)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !timelineRef.current) return
        e.preventDefault()
        const x = e.pageX - timelineRef.current.offsetLeft
        const walk = (x - scrollStart) * 2
        timelineRef.current.scrollLeft -= walk
        setScrollStart(x)
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    // Stats
    const stats = useMemo(() => {
        const byCategory: Record<string, number> = {}
        timelineEvents.forEach(e => {
            byCategory[e.category] = (byCategory[e.category] || 0) + 1
        })

        return {
            total: timelineEvents.length,
            byCategory,
            avgPerHour: (timelineEvents.length / timeBuckets.length).toFixed(1)
        }
    }, [timelineEvents, timeBuckets])

    return (
        <div className="flex flex-col gap-3 bg-black/40 border border-gray-800 rounded-lg p-4">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
                        Global Timeline
                    </h3>

                    {/* Stats badges */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                            {stats.total} events
                        </span>
                        <span className="px-2 py-0.5 bg-gray-700/50 text-gray-400 rounded">
                            ~{stats.avgPerHour}/hr
                        </span>
                    </div>
                </div>

                {/* Time window selector */}
                <div className="flex gap-1 text-xs">
                    {(["6h", "24h", "72h"] as TimeWindow[]).map(w => (
                        <button
                            key={w}
                            onClick={() => {
                                setTimeWindow(w)
                                setSelectedTime(null)
                            }}
                            className={`px-3 py-1 rounded border transition ${timeWindow === w
                                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500"
                                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                                }`}
                        >
                            {w.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* TIMELINE GRAPH */}
            <div
                ref={timelineRef}
                className="relative h-32 overflow-x-auto overflow-y-hidden custom-scrollbar cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ userSelect: 'none' }}
            >
                <div className="flex items-end h-full gap-1 min-w-full" style={{ width: `${timeBuckets.length * 40}px` }}>
                    {timeBuckets.map((bucket, idx) => {
                        const height = bucket.events.length > 0
                            ? (bucket.events.length / maxEvents) * 100
                            : 2

                        const isSelected = selectedTime?.getTime() === bucket.time.getTime()

                        // Calcular distribución de categorías en este bucket
                        const categoryDist: Record<string, number> = {}
                        bucket.events.forEach(e => {
                            categoryDist[e.category] = (categoryDist[e.category] || 0) + 1
                        })

                        return (
                            <div
                                key={idx}
                                className="relative flex-shrink-0 group"
                                style={{ width: '36px' }}
                                onClick={() => handleBucketClick(bucket)}
                                onMouseEnter={() => setHoveredEvent(bucket.time.toISOString())}
                                onMouseLeave={() => setHoveredEvent(null)}
                            >
                                {/* Bar */}
                                <div className="relative h-full flex flex-col justify-end">
                                    {bucket.events.length > 0 ? (
                                        <div
                                            className={`w-full rounded-t transition-all ${isSelected
                                                    ? 'bg-cyan-400 shadow-lg shadow-cyan-500/50'
                                                    : 'bg-gradient-to-t from-blue-600 to-blue-400 group-hover:from-cyan-500 group-hover:to-cyan-300'
                                                }`}
                                            style={{ height: `${height}%` }}
                                        >
                                            {/* Category indicators */}
                                            <div className="absolute inset-x-0 bottom-0 flex flex-col">
                                                {Object.entries(categoryDist).map(([cat, count]) => {
                                                    const color = categoryColors[cat as keyof typeof categoryColors]?.color || '#888'
                                                    const percent = (count / bucket.events.length) * 100
                                                    return (
                                                        <div
                                                            key={cat}
                                                            className="w-full"
                                                            style={{
                                                                height: `${percent}%`,
                                                                backgroundColor: color,
                                                                opacity: 0.6
                                                            }}
                                                        />
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-0.5 bg-gray-800 rounded" />
                                    )}
                                </div>

                                {/* Time label */}
                                {idx % (timeWindow === "6h" ? 4 : timeWindow === "24h" ? 6 : 8) === 0 && (
                                    <div className="absolute -bottom-5 left-0 text-[9px] text-gray-500 whitespace-nowrap">
                                        {bucket.hourLabel}
                                    </div>
                                )}

                                {/* Tooltip on hover */}
                                {hoveredEvent === bucket.time.toISOString() && bucket.events.length > 0 && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                                        <div className="bg-black/95 border border-gray-700 rounded-lg p-2 shadow-xl min-w-[180px]">
                                            <div className="text-[10px] text-gray-400 mb-1">
                                                {bucket.time.toLocaleString([], {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                            <div className="text-xs font-semibold text-cyan-300 mb-1">
                                                {bucket.events.length} events
                                            </div>
                                            <div className="space-y-0.5">
                                                {Object.entries(categoryDist).map(([cat, count]) => (
                                                    <div key={cat} className="flex items-center justify-between text-[10px]">
                                                        <span className="text-gray-400">{cat}</span>
                                                        <span className="text-gray-300 font-medium">{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Critical event indicator */}
                                {bucket.events.some(e => e.category === 'conflict') && (
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* LEGEND */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <div className="flex items-center gap-3 text-xs">
                    {Object.entries(stats.byCategory).map(([cat, count]) => {
                        const color = categoryColors[cat as keyof typeof categoryColors]
                        return (
                            <div key={cat} className="flex items-center gap-1.5">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: color?.color || '#888' }}
                                />
                                <span className="text-gray-400">{color?.label || cat}</span>
                                <span className="text-gray-300 font-medium">{count}</span>
                            </div>
                        )
                    })}
                </div>

                <button
                    onClick={() => setSelectedTime(null)}
                    disabled={!selectedTime}
                    className="text-xs text-gray-500 hover:text-gray-300 transition disabled:opacity-30"
                >
                    Clear selection
                </button>
            </div>
        </div>
    )
}
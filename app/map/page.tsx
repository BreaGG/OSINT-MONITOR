"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import MapboxMap from "@/components/MapboxMap"
import MapLegend from "@/components/MapLegend"
import LegendInsights from "@/components/LegendInsights"
import FocusTimeline from "@/components/FocusTimeline"
import VisualPanel from "@/components/VisualPanel"
import EventList from "@/components/EventList"
import NewAndEscalatingPanel from "@/components/NewAndEscalatingPanel"
import ReplayControls from "@/components/ReplayControls"
import { Event } from "@/lib/types"
import { buildGlobalState } from "@/lib/gse"
import { adaptEventsToGSE } from "@/lib/eventToGSE"
import GlobalStateIndicator from "@/components/GlobalStateIndicator"
import AdminIngestButton from "@/components/AdminIngestButton"
import type { SatelliteFocus } from "@/components/SatelliteView"

type FloatingWindow = 'timeline' | 'visual' | 'events' | 'escalating'
type Preset = "all" | "conflicts" | "strategic"

interface WindowState {
    visible: boolean
    position: { x: number; y: number } | null
}

/* ===================== COUNTRY MAPPING ===================== */
const ACRONYM_TO_COUNTRY: Record<string, string> = {
    "USA": "United States",
    "UK": "United Kingdom",
    "RUS": "Russian Federation",
    "ROK": "South Korea",
    "DPRK": "North Korea",
    "EU": "European Union",
    "UAE": "United Arab Emirates",
}

export default function FullscreenMapPage() {
    const router = useRouter()
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [focusRegion, setFocusRegion] = useState<string | null>(null)
    const [satelliteFocus, setSatelliteFocus] = useState<SatelliteFocus | undefined>(undefined)
    const [preset, setPreset] = useState<Preset>("all")
    const [heatmapMode, setHeatmapMode] = useState(false)
    const [showConnections, setShowConnections] = useState(false)
    const [replayMode, setReplayMode] = useState(false)
    const [replayTime, setReplayTime] = useState<number | null>(null)
    
    // Detección de móvil
    const [isMobile, setIsMobile] = useState(false)
    
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Estado de ventanas flotantes
    const [windows, setWindows] = useState<Record<FloatingWindow, WindowState>>({
        timeline: { visible: true, position: null },
        visual: { visible: false, position: null },
        events: { visible: false, position: null },
        escalating: { visible: false, position: null }
    })

    const [dragging, setDragging] = useState<{
        window: FloatingWindow | null
        startX: number
        startY: number
    }>({ window: null, startX: 0, startY: 0 })

    /* ===================== REGION HANDLER ===================== */

    const handleSelectRegion = (region: string) => {
        const fullName = ACRONYM_TO_COUNTRY[region] || region
        setFocusRegion(fullName)
    }

    /* ===================== DATA ===================== */

    useEffect(() => {
        fetch("/api/events")
            .then(res => res.json())
            .then(data => {
                setEvents(data)
                setLoading(false)
            })
    }, [])

    /* ===================== KEYBOARD ===================== */

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" || e.key.toLowerCase() === "f") {
                router.push("/")
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [router])

    /* ===================== DRAGGABLE WINDOWS ===================== */

    const handleMouseDown = (windowType: FloatingWindow, e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.window-content')) return

        const currentPosition = windows[windowType].position || getDefaultPosition(windowType)

        setDragging({
            window: windowType,
            startX: e.clientX - currentPosition.x,
            startY: e.clientY - currentPosition.y
        })
    }

    const getDefaultPosition = (windowType: FloatingWindow): { x: number; y: number } => {
        const positions = {
            timeline: { x: window.innerWidth - 352, y: window.innerHeight - 332 },
            visual: { x: 16, y: 100 },
            events: { x: window.innerWidth - 452, y: 100 },
            escalating: { x: window.innerWidth / 2 - 200, y: 100 }
        }
        return positions[windowType]
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragging.window) return

            setWindows(prev => ({
                ...prev,
                [dragging.window!]: {
                    ...prev[dragging.window!],
                    position: {
                        x: e.clientX - dragging.startX,
                        y: e.clientY - dragging.startY
                    }
                }
            }))
        }

        const handleMouseUp = () => {
            setDragging({ window: null, startX: 0, startY: 0 })
        }

        if (dragging.window) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [dragging])

    const toggleWindow = (windowType: FloatingWindow) => {
        setWindows(prev => ({
            ...prev,
            [windowType]: {
                ...prev[windowType],
                visible: !prev[windowType].visible
            }
        }))
    }

    const toggleAllWindows = () => {
        const allVisible = Object.values(windows).every(w => w.visible)
        
        setWindows(prev => ({
            timeline: { ...prev.timeline, visible: !allVisible },
            visual: { ...prev.visual, visible: !allVisible },
            events: { ...prev.events, visible: !allVisible },
            escalating: { ...prev.escalating, visible: !allVisible }
        }))
    }

    const allWindowsVisible = Object.values(windows).every(w => w.visible)

    /* ===================== GLOBAL STATE ===================== */

    const globalState = useMemo(() => {
        if (events.length === 0) return null
        const gseEvents = adaptEventsToGSE(events)
        return buildGlobalState(gseEvents)
    }, [events])

    const lastUpdated = useMemo(() => {
        return new Date().toLocaleTimeString()
    }, [])

    /* ===================== FILTERED EVENTS ===================== */

    const filteredEvents = useMemo(() => {
        let filtered = events

        if (focusRegion) {
            filtered = filtered.filter(
                e => e.country === focusRegion || focusRegion === "Global"
            )
        }

        if (replayMode && replayTime !== null) {
            filtered = filtered.filter(e => {
                const eventTime = e.timestamp || new Date(e.date).getTime()
                return eventTime <= replayTime
            })
        }

        return filtered
    }, [events, focusRegion, replayMode, replayTime])

    const { minTimestamp, maxTimestamp } = useMemo(() => {
        if (events.length === 0) {
            return { minTimestamp: Date.now() - 72 * 60 * 60 * 1000, maxTimestamp: Date.now() }
        }

        const timestamps = events.map(e => e.timestamp || new Date(e.date).getTime())
        return {
            minTimestamp: Math.min(...timestamps),
            maxTimestamp: Math.max(...timestamps)
        }
    }, [events])

    /* ===================== RENDER FLOATING WINDOW ===================== */

    const renderFloatingWindow = (
        windowType: FloatingWindow,
        title: string,
        content: React.ReactNode,
        defaultPosition: { bottom?: string; right?: string; left?: string; top?: string },
        size: { width: string; height: string }
    ) => {
        if (!windows[windowType].visible) return null

        const position = windows[windowType].position
        const isDraggingThis = dragging.window === windowType

        return (
            <div
                className="flex flex-col bg-gray-950/95 backdrop-blur-sm border border-gray-800 rounded overflow-hidden shadow-2xl"
                style={{
                    position: 'absolute',
                    width: size.width,
                    height: size.height,
                    ...(position
                        ? {
                            left: `${position.x}px`,
                            top: `${position.y}px`
                        }
                        : defaultPosition),
                    cursor: isDraggingThis ? 'grabbing' : 'grab',
                    zIndex: isDraggingThis ? 50 : 10
                }}
                onMouseDown={(e) => handleMouseDown(windowType, e)}
            >
                {/* HEADER NATO-STYLE */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-gray-900/50 select-none">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                        {title}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleWindow(windowType)
                        }}
                        className="text-gray-600 hover:text-gray-300 transition"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* CONTENT */}
                <div className="window-content flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {content}
                </div>
            </div>
        )
    }

    /* ===================== MOBILE VIEW ===================== */
    
    if (isMobile) {
        return (
            <main className="h-screen w-screen bg-black overflow-hidden">
                <div className="portrait-only fixed inset-0 bg-black z-50 flex flex-col items-center justify-center gap-4 p-8">
                    <svg className="w-16 h-16 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <p className="text-lg font-medium text-gray-300 text-center">Please rotate your device</p>
                    <p className="text-sm text-gray-500 text-center">For the best experience, use landscape mode</p>
                </div>
                
                <div className="landscape-only h-full w-full">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
                                <span className="text-sm">Loading map...</span>
                            </div>
                        </div>
                    ) : (
                        <MapboxMap
                            events={filteredEvents}
                            onSelectSatelliteFocus={(focus) => setSatelliteFocus(focus)}
                            heatmapMode={false}
                            showConnections={false}
                        />
                    )}
                </div>
                
                <style jsx global>{`
                    @media screen and (max-width: 768px) {
                        @media (orientation: landscape) {
                            .portrait-only { display: none !important; }
                            .landscape-only { display: block !important; }
                        }
                        @media (orientation: portrait) {
                            .portrait-only { display: flex !important; }
                            .landscape-only { display: none !important; }
                        }
                    }
                    @media screen and (min-width: 769px) {
                        .portrait-only { display: none !important; }
                        .landscape-only { display: block !important; }
                    }
                `}</style>
            </main>
        )
    }

    /* ===================== DESKTOP VIEW ===================== */

    return (
        <main className="h-screen flex flex-col bg-black">
            {/* HEADER COMPACTO */}
            <header className="shrink-0">
                <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-gray-950 border-b border-gray-900">
                    
                    {/* LEFT: BRANDING + STATUS + FOCUS */}
                    <div className="flex items-center gap-4">
                        {/* TITLE */}
                        <div className="flex flex-col leading-tight">
                            <h1 className="text-lg font-bold tracking-tight text-white">
                                Mission Control
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-gray-600 uppercase tracking-[0.1em] font-bold">
                                    OSINT
                                </span>
                                <span className="text-[9px] text-gray-700">•</span>
                                <span className="text-[9px] text-gray-600">
                                    {lastUpdated}
                                </span>
                                <span className="text-[9px] text-gray-700">•</span>
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-900 border border-gray-800 rounded">
                                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-[9px] font-medium text-gray-400">
                                        {filteredEvents.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* SYSTEM STATUS */}
                        {globalState && (
                            <div className="h-6.5 border-l border-gray-800 pl-4">
                                <GlobalStateIndicator state={globalState} />
                            </div>
                        )}

                        {/* FOCUS INDICATOR */}
                        {focusRegion && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded">
                                <span className="text-[10px] text-purple-400 font-medium">
                                    {focusRegion}
                                </span>
                                <button
                                    onClick={() => setFocusRegion(null)}
                                    className="text-purple-400 hover:text-purple-300 transition"
                                >
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: CONTROLS */}
                    <div className="flex items-center gap-2">
                        {/* WINDOW TOGGLES */}
                        <button
                            onClick={() => toggleWindow('timeline')}
                            className={`
                                px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.1em] transition-all
                                ${windows.timeline.visible
                                    ? 'border border-blue-500/50 bg-blue-500/20 text-blue-300'
                                    : 'border border-gray-800 bg-black/50 text-gray-600 hover:border-gray-700 hover:text-gray-400'
                                }
                            `}
                        >
                            Timeline
                        </button>
                        <button
                            onClick={() => toggleWindow('visual')}
                            className={`
                                px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.1em] transition-all
                                ${windows.visual.visible
                                    ? 'border border-purple-500/50 bg-purple-500/20 text-purple-300'
                                    : 'border border-gray-800 bg-black/50 text-gray-600 hover:border-gray-700 hover:text-gray-400'
                                }
                            `}
                        >
                            Visual
                        </button>
                        <button
                            onClick={() => toggleWindow('events')}
                            className={`
                                px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.1em] transition-all
                                ${windows.events.visible
                                    ? 'border border-green-500/50 bg-green-500/20 text-green-300'
                                    : 'border border-gray-800 bg-black/50 text-gray-600 hover:border-gray-700 hover:text-gray-400'
                                }
                            `}
                        >
                            Events
                        </button>
                        <button
                            onClick={() => toggleWindow('escalating')}
                            className={`
                                px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.1em] transition-all
                                ${windows.escalating.visible
                                    ? 'border border-red-500/50 bg-red-500/20 text-red-300'
                                    : 'border border-gray-800 bg-black/50 text-gray-600 hover:border-gray-700 hover:text-gray-400'
                                }
                            `}
                        >
                            Escalating
                        </button>

                        <div className="w-px h-5 bg-gray-800 mx-1" />

                        {/* SHOW/HIDE ALL */}
                        <button
                            onClick={toggleAllWindows}
                            className={`
                                px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.1em] transition-all
                                ${allWindowsVisible
                                    ? 'border border-orange-500/50 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                                    : 'border border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-700'
                                }
                            `}
                        >
                            {allWindowsVisible ? 'Hide All' : 'Show All'}
                        </button>

                        {/* MODE TOGGLES */}
                        <button
                            onClick={() => setHeatmapMode(!heatmapMode)}
                            className={`
                                px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.1em] transition-all
                                ${heatmapMode
                                    ? 'border border-red-500/50 bg-red-500/20 text-red-300'
                                    : 'border border-gray-800 bg-black/50 text-gray-600 hover:border-gray-700 hover:text-gray-400'
                                }
                            `}
                        >
                            Heatmap
                        </button>

                        <button
                            onClick={() => setShowConnections(!showConnections)}
                            className={`
                                px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.1em] transition-all
                                ${showConnections
                                    ? 'border border-cyan-500/50 bg-cyan-500/20 text-cyan-300'
                                    : 'border border-gray-800 bg-black/50 text-gray-600 hover:border-gray-700 hover:text-gray-400'
                                }
                            `}
                        >
                            Connections
                        </button>

                        <button
                            onClick={() => {
                                setReplayMode(!replayMode)
                                if (!replayMode) {
                                    setReplayTime(maxTimestamp)
                                } else {
                                    setReplayTime(null)
                                }
                            }}
                            className={`
                                px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.1em] transition-all
                                ${replayMode
                                    ? 'border border-purple-500/50 bg-purple-500/20 text-purple-300'
                                    : 'border border-gray-800 bg-black/50 text-gray-600 hover:border-gray-700 hover:text-gray-400'
                                }
                            `}
                        >
                            Replay
                        </button>

                        <div className="w-px h-5 bg-gray-800 mx-1" />

                        {/* REFRESH BUTTON */}
                        <AdminIngestButton />

                        {/* EXIT */}
                        <button
                            onClick={() => router.push("/")}
                            className="px-3 py-1 rounded border border-gray-800 bg-black/50 text-gray-400 text-[10px] font-bold uppercase tracking-[0.1em] hover:border-gray-700 hover:text-gray-300 transition"
                        >
                            Exit
                        </button>
                    </div>
                </div>
            </header>

            {/* MAP + LEGEND */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* LEGEND SIDEBAR */}
                <aside className="w-52 flex flex-col gap-3 shrink-0 p-3 border-r border-gray-900 overflow-y-auto custom-scrollbar bg-gray-950/50">
                    <div className="bg-gray-950 border border-gray-900 rounded p-3">
                        <MapLegend />
                    </div>
                    <div className="bg-gray-950 border border-gray-900 rounded p-3">
                        <LegendInsights events={filteredEvents} />
                    </div>
                </aside>

                {/* MAP */}
                <div className="flex-1 relative">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex items-center gap-2 text-gray-500">
                                <div className="w-4 h-4 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
                                <span className="text-sm">Loading map...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <MapboxMap
                                events={filteredEvents}
                                onSelectSatelliteFocus={(focus) => setSatelliteFocus(focus)}
                                heatmapMode={heatmapMode}
                                showConnections={showConnections}
                            />

                            {/* REPLAY CONTROLS */}
                            <ReplayControls
                                isActive={replayMode}
                                onToggle={() => {
                                    setReplayMode(false)
                                    setReplayTime(null)
                                }}
                                onTimeChange={setReplayTime}
                                startTime={minTimestamp}
                                endTime={maxTimestamp}
                            />

                            {/* FLOATING WINDOWS */}
                            {renderFloatingWindow(
                                'timeline',
                                'Focus Timeline',
                                <div className="p-3">
                                    <FocusTimeline
                                        events={filteredEvents}
                                        onSelectRegion={handleSelectRegion}
                                        hideTitle={true}
                                    />
                                </div>,
                                { bottom: '16px', right: '16px' },
                                { width: '336px', height: '288px' }
                            )}

                            {renderFloatingWindow(
                                'visual',
                                'Visual Intelligence',
                                <div className="p-3 overflow-hidden h-full">
                                    <VisualPanel satelliteFocus={satelliteFocus} />
                                </div>,
                                { left: '16px', top: '100px' },
                                { width: '600px', height: '475px' }
                            )}

                            {renderFloatingWindow(
                                'events',
                                'Event Feed',
                                <div className="p-3">
                                    <EventList events={filteredEvents} />
                                </div>,
                                { right: '16px', top: '100px' },
                                { width: '420px', height: '600px' }
                            )}

                            {renderFloatingWindow(
                                'escalating',
                                'New & Escalating',
                                <div className="p-3">
                                    <NewAndEscalatingPanel
                                        events={filteredEvents}
                                        preset={preset}
                                        onSelectRegion={handleSelectRegion}
                                        hideTitle={true}
                                    />
                                </div>,
                                { left: '50%', top: '100px' },
                                { width: '380px', height: '200px' }
                            )}
                        </>
                    )}
                </div>
            </div>
        </main>
    )
}
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
            setIsMobile(window.innerWidth < 768) // md breakpoint de Tailwind
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
        // Convertir acrónimo a nombre completo si existe
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

        // Filtrar por región si está seleccionada
        if (focusRegion) {
            filtered = filtered.filter(
                e => e.country === focusRegion || focusRegion === "Global"
            )
        }

        // Filtrar por replay time si está activo
        if (replayMode && replayTime !== null) {
            filtered = filtered.filter(e => {
                const eventTime = e.timestamp || new Date(e.date).getTime()
                return eventTime <= replayTime
            })
        }

        return filtered
    }, [events, focusRegion, replayMode, replayTime])

    // Calcular timestamps para replay
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
                className="flex flex-col bg-black/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl overflow-hidden"
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
                {/* HEADER */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-black/50 select-none">
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                        {title}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleWindow(windowType)
                        }}
                        className="text-gray-400 hover:text-gray-200 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                {/* Mensaje de rotación solo en portrait */}
                <div className="portrait-only fixed inset-0 bg-black z-50 flex flex-col items-center justify-center gap-4 p-8">
                    <svg className="w-16 h-16 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <p className="text-lg font-medium text-gray-300 text-center">Please rotate your device</p>
                    <p className="text-sm text-gray-500 text-center">For the best experience, use landscape mode</p>
                </div>
                
                {/* Contenido del mapa */}
                <div className="landscape-only h-full w-full">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            Loading map...
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
                    /* Mostrar/ocultar según orientación */
                    @media screen and (max-width: 768px) {
                        /* En landscape: ocultar mensaje, mostrar mapa */
                        @media (orientation: landscape) {
                            .portrait-only {
                                display: none !important;
                            }
                            .landscape-only {
                                display: block !important;
                            }
                        }
                        
                        /* En portrait: mostrar mensaje, ocultar mapa */
                        @media (orientation: portrait) {
                            .portrait-only {
                                display: flex !important;
                            }
                            .landscape-only {
                                display: none !important;
                            }
                        }
                    }
                    
                    /* En desktop: siempre mostrar contenido */
                    @media screen and (min-width: 769px) {
                        .portrait-only {
                            display: none !important;
                        }
                        .landscape-only {
                            display: block !important;
                        }
                    }
                `}</style>
            </main>
        )
    }

    /* ===================== DESKTOP VIEW ===================== */

    return (
        <main className="h-screen flex flex-col bg-black">
            {/* HEADER */}
            <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col leading-tight">
                        <h1 className="text-xl font-bold">Global Intelligence Monitor</h1>
                        <span className="text-[11px] text-gray-400 tracking-wide">
                            Open Source Intelligence · Updated {lastUpdated}
                        </span>
                    </div>

                    {globalState && <GlobalStateIndicator state={globalState} />}

                    {/* FOCUS INDICATOR */}
                    {focusRegion && (
                        <span
                            onClick={() => setFocusRegion(null)}
                            className="
                text-[11px] text-gray-300 cursor-pointer
                border border-gray-700 px-2 py-0.5 rounded
                hover:bg-black/40 transition
              "
                        >
                            Focus: {focusRegion} ×
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* WINDOW TOGGLE BUTTONS */}
                    <button
                        onClick={() => toggleWindow('timeline')}
                        className={`px-3 py-1.5 rounded border text-xs transition ${windows.timeline.visible
                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                            : 'border-gray-700 text-gray-400 hover:bg-gray-900'
                            }`}
                    >
                        Timeline
                    </button>
                    <button
                        onClick={() => toggleWindow('visual')}
                        className={`px-3 py-1.5 rounded border text-xs transition ${windows.visual.visible
                            ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                            : 'border-gray-700 text-gray-400 hover:bg-gray-900'
                            }`}
                    >
                        Visual
                    </button>
                    <button
                        onClick={() => toggleWindow('events')}
                        className={`px-3 py-1.5 rounded border text-xs transition ${windows.events.visible
                            ? 'border-green-500 bg-green-500/20 text-green-300'
                            : 'border-gray-700 text-gray-400 hover:bg-gray-900'
                            }`}
                    >
                        Events
                    </button>
                    <button
                        onClick={() => toggleWindow('escalating')}
                        className={`px-3 py-1.5 rounded border text-xs transition ${windows.escalating.visible
                            ? 'border-red-500 bg-red-500/20 text-red-300'
                            : 'border-gray-700 text-gray-400 hover:bg-gray-900'
                            }`}
                    >
                        Escalating
                    </button>

                    <div className="w-px h-6 bg-gray-700 mx-1" />

                    {/* SHOW ALL / HIDE ALL BUTTON */}
                    <button
                        onClick={toggleAllWindows}
                        className={`px-3 py-1.5 rounded border text-xs font-semibold transition ${allWindowsVisible
                            ? 'border-orange-500 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                            : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        {allWindowsVisible ? 'Hide All' : 'Show All'}
                    </button>

                    {/* HEATMAP MODE TOGGLE */}
                    <button
                        onClick={() => setHeatmapMode(!heatmapMode)}
                        className={`px-3 py-1.5 rounded border text-xs font-semibold transition ${heatmapMode
                            ? 'border-red-500 bg-red-500/20 text-red-300 hover:bg-red-500/30'
                            : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                            }`}
                        title="Toggle heatmap visualization"
                    >
                        Heatmap
                    </button>

                    {/* CONNECTIONS TOGGLE */}
                    <button
                        onClick={() => setShowConnections(!showConnections)}
                        className={`px-3 py-1.5 rounded border text-xs font-semibold transition ${showConnections
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 hover:bg-cyan-500/30'
                            : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                            }`}
                        title="Show connections between countries"
                    >
                        Connections
                    </button>

                    {/* REPLAY MODE TOGGLE */}
                    <button
                        onClick={() => {
                            setReplayMode(!replayMode)
                            if (!replayMode) {
                                setReplayTime(maxTimestamp) // Empezar en el presente
                            } else {
                                setReplayTime(null)
                            }
                        }}
                        className={`px-3 py-1.5 rounded border text-xs font-semibold transition ${replayMode
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500 hover:bg-purple-500/30'
                            : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                            }`}
                        title="Replay events over time"
                    >
                        Replay
                    </button>

                    <div className="w-px h-6 bg-gray-700 mx-1" />

                    <button
                        onClick={() => setFocusRegion(null)}
                        disabled={!focusRegion}
                        className="px-4 py-2 rounded border border-gray-700 text-gray-200 text-sm hover:bg-gray-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Clear Filters
                    </button>
                    <button
                        onClick={() => router.push("/")}
                        className="px-4 py-2 rounded border border-gray-700 text-gray-200 text-sm hover:bg-gray-900 transition"
                    >
                        EXIT (ESC)
                    </button>
                </div>
            </header>

            {/* MAP + LEGEND */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* LEGEND SIDEBAR */}
                <aside className="w-64 flex flex-col gap-3 shrink-0 p-4 border-r border-gray-800 overflow-y-auto custom-scrollbar">
                    <MapLegend />
                    <LegendInsights events={filteredEvents} />
                </aside>

                {/* MAP */}
                <div className="flex-1 relative">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            Loading map...
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
                                <div className="p-4">
                                    <FocusTimeline
                                        events={filteredEvents}
                                        onSelectRegion={handleSelectRegion}
                                    />
                                </div>,
                                { bottom: '16px', right: '16px' },
                                { width: '336px', height: '288px' }
                            )}

                            {renderFloatingWindow(
                                'visual',
                                'Visual Intelligence',
                                <div className="p-4 overflow-hidden h-full">
                                    <VisualPanel satelliteFocus={satelliteFocus} />
                                </div>,
                                { left: '16px', top: '100px' },
                                { width: '600px', height: '475px' }
                            )}

                            {renderFloatingWindow(
                                'events',
                                'Event Feed',
                                <div className="p-4">
                                    <EventList events={filteredEvents} />
                                </div>,
                                { right: '16px', top: '100px' },
                                { width: '450px', height: '600px' }
                            )}

                            {renderFloatingWindow(
                                'escalating',
                                'New & Escalating',
                                <div className="p-4">
                                    <NewAndEscalatingPanel
                                        events={filteredEvents}
                                        preset={preset}
                                        onSelectRegion={handleSelectRegion}
                                    />
                                </div>,
                                { left: '50%', top: '100px' },
                                { width: '400px', height: '260px' }
                            )}
                        </>
                    )}
                </div>
            </div>
        </main>
    )
}
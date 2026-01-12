"use client"

import { useState, useEffect, useRef } from "react"

type PlaybackSpeed = 0.5 | 1 | 2 | 5

type Props = {
    onTimeChange: (timestamp: number) => void
    startTime: number // timestamp más antiguo
    endTime: number   // timestamp más reciente (ahora)
    isActive: boolean
    onToggle: () => void
}

export default function ReplayControls({
    onTimeChange,
    startTime,
    endTime,
    isActive,
    onToggle
}: Props) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(endTime) // Empezar en el presente
    const [speed, setSpeed] = useState<PlaybackSpeed>(1)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Duración total en milisegundos
    const duration = endTime - startTime

    // Convertir currentTime a porcentaje (0-100)
    const progress = ((currentTime - startTime) / duration) * 100

    // Formatear timestamp a hora legible
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffHours = Math.floor((now.getTime() - timestamp) / (1000 * 60 * 60))

        if (diffHours < 1) {
            const diffMins = Math.floor((now.getTime() - timestamp) / (1000 * 60))
            return `${diffMins}m ago`
        } else if (diffHours < 24) {
            return `${diffHours}h ago`
        } else {
            return date.toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        }
    }

    // Efecto de reproducción
    useEffect(() => {
        if (!isPlaying || !isActive) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            return
        }

        // Incremento base: 1 segundo de reproducción = 1 minuto de tiempo real
        const baseIncrement = 60 * 1000 // 1 minuto
        const increment = baseIncrement * speed

        intervalRef.current = setInterval(() => {
            setCurrentTime(prev => {
                const next = prev + increment

                // Si llegamos al final, pausar
                if (next >= endTime) {
                    setIsPlaying(false)
                    return endTime
                }

                return next
            })
        }, 1000) // Actualizar cada segundo

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [isPlaying, speed, endTime, isActive])

    // Notificar cambios de tiempo
    useEffect(() => {
        if (isActive) {
            onTimeChange(currentTime)
        }
    }, [currentTime, isActive, onTimeChange])

    // Handlers
    const handlePlayPause = () => {
        setIsPlaying(!isPlaying)
    }

    const handleRestart = () => {
        setCurrentTime(startTime)
        setIsPlaying(false)
    }

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const percent = parseFloat(e.target.value)
        const newTime = startTime + (duration * percent / 100)
        setCurrentTime(newTime)
        setIsPlaying(false)
    }

    const handleSpeedChange = () => {
        const speeds: PlaybackSpeed[] = [0.5, 1, 2, 5]
        const currentIndex = speeds.indexOf(speed)
        const nextIndex = (currentIndex + 1) % speeds.length
        setSpeed(speeds[nextIndex])
    }

    if (!isActive) return null

    return (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-[600px]">
            <div className="bg-black/95 border border-cyan-500/50 rounded-lg shadow-2xl shadow-cyan-500/20 p-4">

                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wide">
                            Replay Mode
                        </span>
                    </div>

                    <button
                        onClick={onToggle}
                        className="text-xs text-gray-400 hover:text-gray-200 transition"
                    >
                        EXIT
                    </button>
                </div>

                {/* Timeline Slider */}
                <div className="mb-3">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={progress}
                        onChange={handleSliderChange}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer 
                       [&::-webkit-slider-thumb]:appearance-none 
                       [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 
                       [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-cyan-400
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-lg
                       [&::-webkit-slider-thumb]:shadow-cyan-500/50"
                        style={{
                            background: `linear-gradient(to right, 
                rgb(6, 182, 212) 0%, 
                rgb(6, 182, 212) ${progress}%, 
                rgb(31, 41, 55) ${progress}%, 
                rgb(31, 41, 55) 100%)`
                        }}
                    />

                    {/* Time Labels */}
                    <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                        <span>{formatTime(startTime)}</span>
                        <span className="text-cyan-300 font-medium">{formatTime(currentTime)}</span>
                        <span>Now</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-2">
                    {/* Restart */}
                    <button
                        onClick={handleRestart}
                        className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                        title="Restart"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>

                    {/* Play/Pause */}
                    <button
                        onClick={handlePlayPause}
                        className="p-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black transition shadow-lg shadow-cyan-500/50"
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>

                    {/* Speed */}
                    <button
                        onClick={handleSpeedChange}
                        className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-cyan-300 text-xs font-medium transition"
                        title="Playback speed"
                    >
                        {speed}x
                    </button>

                    {/* Current/Total Time */}
                    <div className="ml-3 text-xs text-gray-400">
                        <span className="text-cyan-300">
                            {Math.floor(((currentTime - startTime) / duration) * 100)}%
                        </span>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-3 pt-3 border-t border-gray-800 text-[10px] text-gray-500 text-center">
                    Use slider to scrub • {isPlaying ? 'Playing' : 'Paused'} • 1s = 1min real time
                </div>
            </div>
        </div>
    )
}
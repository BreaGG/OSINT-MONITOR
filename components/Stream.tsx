"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { toEmbedUrl } from "@/lib/youtube"

const PRESET_STREAMS = [
    {
        label: "France 24",
        url: "https://www.youtube.com/watch?v=Ap-UM1O9RBU",
        description: "International public broadcaster. Broad geopolitical and diplomatic coverage.",
    },
    {
        label: "Al Jazeera",
        url: "https://www.youtube.com/watch?v=gCNeDWCI0vo",
        description: "Middle East–focused coverage with strong conflict and regional reporting.",
    },
    {
        label: "DW News",
        url: "https://www.youtube.com/watch?v=LuKwFajn37U",
        description: "European perspective with emphasis on politics, economy, and security.",
    },
]

export default function Stream() {
    const [url, setUrl] = useState(PRESET_STREAMS[0].url)
    const [input, setInput] = useState("")
    const [editing, setEditing] = useState(false)
    const [muted, setMuted] = useState(true)

    const iframeRef = useRef<HTMLIFrameElement | null>(null)

    const baseEmbed = toEmbedUrl(url)
    const embedUrl = baseEmbed
        ? `${baseEmbed}?autoplay=1&mute=1&controls=1&enablejsapi=1`
        : null

    const activePreset = useMemo(() => {
        return PRESET_STREAMS.find(s => s.url === url) || null
    }, [url])

    const description = activePreset
        ? activePreset.description
        : "Custom live stream selected by the analyst."

    /* -------- YT CONTROL -------- */
    function sendCommand(command: "mute" | "unMute") {
        iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({
                event: "command",
                func: command,
                args: [],
            }),
            "*"
        )
    }

    function toggleMute() {
        if (muted) sendCommand("unMute")
        else sendCommand("mute")
        setMuted(!muted)
    }

    useEffect(() => {
        setMuted(true)
    }, [url])

    return (
        <div className="flex flex-col h-full gap-2">
            {/* CONTROLS */}
            <div className="flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1 flex-wrap">
                    {PRESET_STREAMS.map(stream => (
                        <button
                            key={stream.label}
                            onClick={() => {
                                setUrl(stream.url)
                                setEditing(false)
                            }}
                            className={`
                                px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider
                                transition-all
                                ${url === stream.url
                                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                    : "text-gray-600 hover:text-gray-400 border border-gray-800"
                                }
                            `}
                        >
                            {stream.label}
                        </button>
                    ))}

                    <button
                        onClick={() => setEditing(!editing)}
                        className={`
                            px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider
                            transition-all
                            ${!activePreset && editing
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                : "text-gray-600 hover:text-gray-400 border border-gray-800"
                            }
                        `}
                    >
                        Custom
                    </button>
                </div>

                {/* MUTE TOGGLE */}
                <button
                    onClick={toggleMute}
                    className={`
                        px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider
                        transition-all shrink-0
                        ${!muted
                            ? "bg-green-500/20 text-green-400 border border-green-500/40"
                            : "text-gray-600 border border-gray-800"
                        }
                    `}
                    title={muted ? "Unmute stream" : "Mute stream"}
                >
                    {muted ? "Muted" : "Live"}
                </button>
            </div>

            {/* CUSTOM INPUT */}
            {editing && (
                <div className="flex gap-2 shrink-0">
                    <input
                        type="url"
                        placeholder="PASTE YOUTUBE URL"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        className="
                            flex-1 bg-gray-900 border border-gray-800 rounded
                            px-2 py-1 text-[10px] text-gray-300
                            placeholder:text-gray-700 placeholder:uppercase placeholder:tracking-wider
                            focus:outline-none focus:border-cyan-500/50
                        "
                    />
                    <button
                        onClick={() => {
                            const embed = toEmbedUrl(input)
                            if (embed) {
                                setUrl(input)
                                setInput("")
                                setEditing(false)
                            }
                        }}
                        className="
                            px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider
                            bg-cyan-600 hover:bg-cyan-700 text-white
                            transition-all
                        "
                    >
                        Load
                    </button>
                </div>
            )}

            {/* PLAYER */}
            <div className="flex-1 min-h-0 bg-black rounded border border-gray-800 overflow-hidden">
                {embedUrl ? (
                    <iframe
                        ref={iframeRef}
                        src={embedUrl}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                        <div className="text-gray-700 text-2xl">⚠</div>
                        <div className="text-[9px] text-gray-600 uppercase tracking-wider">
                            Invalid URL
                        </div>
                    </div>
                )}
            </div>

            {/* DESCRIPTION */}
            <div className="shrink-0 text-[9px] text-gray-600 leading-relaxed">
                {description}
            </div>
        </div>
    )
}
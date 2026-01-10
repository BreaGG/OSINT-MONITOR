"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { toEmbedUrl } from "@/lib/youtube"

const PRESET_STREAMS = [
    {
        label: "France 24",
        url: "https://www.youtube.com/watch?v=Ap-UM1O9RBU",
        description:
            "International public broadcaster. Broad geopolitical and diplomatic coverage.",
    },
    {
        label: "Al Jazeera",
        url: "https://www.youtube.com/watch?v=gCNeDWCI0vo",
        description:
            "Middle East–focused coverage with strong conflict and regional reporting.",
    },
    {
        label: "DW News",
        url: "https://www.youtube.com/watch?v=LuKwFajn37U",
        description:
            "European perspective with emphasis on politics, economy, and security.",
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

    /* ===================== CONTEXT ===================== */

    const activePreset = useMemo(() => {
        return PRESET_STREAMS.find(s => s.url === url) || null
    }, [url])

    const description = activePreset
        ? activePreset.description
        : "Custom live stream selected by the analyst."

    /* ===================== YT CONTROL ===================== */

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

    // Reset mute when stream changes
    useEffect(() => {
        setMuted(true)
    }, [url])

    /* ===================== RENDER ===================== */

    return (
        <section className="flex flex-col gap-2 text-xs text-gray-200">
            {/* HEADER */}
            <div className="flex items-center gap-2">
                <span className="uppercase tracking-wide text-gray-400">
                    Live
                </span>

                <div className="flex items-center gap-1">
                    {PRESET_STREAMS.map(stream => (
                        <button
                            key={stream.label}
                            onClick={() => {
                                setUrl(stream.url)
                                setEditing(false)
                            }}
                            className={`px-2 py-0.5 rounded border transition ${
                                url === stream.url
                                    ? "border-gray-500 text-gray-200"
                                    : "border-gray-800 text-gray-500 hover:text-gray-300"
                            }`}
                        >
                            {stream.label}
                        </button>
                    ))}

                    <button
                        onClick={() => setEditing(!editing)}
                        className={`px-2 py-0.5 rounded border transition ${
                            !activePreset && editing
                                ? "border-gray-500 text-gray-200"
                                : "border-gray-800 text-gray-500 hover:text-gray-300"
                        }`}
                    >
                        Custom
                    </button>
                </div>

                {/* MUTE */}
                <button
                    onClick={toggleMute}
                    className="ml-auto text-gray-400 hover:text-gray-100 transition"
                    title={muted ? "Unmute stream" : "Mute stream"}
                >
                    {muted ? "Muted" : "Live"}
                </button>
            </div>

            {/* CUSTOM INPUT */}
            {editing && (
                <div className="flex gap-2">
                    <input
                        type="url"
                        placeholder="Paste YouTube URL"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        className="flex-1 bg-black border border-gray-800 px-2 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-600"
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
                        className="px-2 text-gray-300 hover:text-gray-100 transition"
                    >
                        Load
                    </button>
                </div>
            )}

            {/* PLAYER */}
            <div className="w-full aspect-video bg-black overflow-hidden rounded border border-gray-800">
                {embedUrl ? (
                    <iframe
                        ref={iframeRef}
                        src={embedUrl}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Invalid YouTube URL
                    </div>
                )}
            </div>

            {/* DESCRIPTION */}
            <div className="text-[11px] text-gray-500 leading-snug">
                {description}
            </div>
        </section>
    )
}

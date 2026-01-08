"use client"

import { useState } from "react"
import { toEmbedUrl } from "@/lib/youtube"

const PRESET_STREAMS = [
    {
        label: "France 24",
        url: "https://www.youtube.com/watch?v=Ap-UM1O9RBU",
    },
    {
        label: "Al Jazeera",
        url: "https://www.youtube.com/watch?v=gCNeDWCI0vo",
    },
    {
        label: "DW News",
        url: "https://www.youtube.com/watch?v=LuKwFajn37U",
    },
]

export default function Stream() {
    const [url, setUrl] = useState(PRESET_STREAMS[0].url)
    const [input, setInput] = useState("")
    const [editing, setEditing] = useState(false)

    const embedUrl = toEmbedUrl(url)

    return (
        <section className="mt-4 space-y-3 text-sm text-gray-200">
            {/* HEADER + STREAM SELECTOR */}
            <div className="flex flex-wrap items-center gap-4">
                <span className="uppercase tracking-wide text-gray-400">
                    Live stream
                </span>

                {PRESET_STREAMS.map(stream => (
                    <button
                        key={stream.label}
                        onClick={() => {
                            setUrl(stream.url)
                            setEditing(false)
                        }}
                        className={`transition ${url === stream.url
                                ? "text-gray-100"
                                : "text-gray-500 hover:text-gray-300"
                            }`}
                    >
                        {stream.label}
                    </button>
                ))}

                <button
                    onClick={() => setEditing(!editing)}
                    className={`transition ${editing
                            ? "text-gray-100"
                            : "text-gray-500 hover:text-gray-300"
                        }`}
                >
                    Custom
                </button>
            </div>

            {/* CUSTOM STREAM INPUT */}
            {editing && (
                <div className="flex gap-2">
                    <input
                        type="url"
                        placeholder="Paste YouTube URL"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        className="flex-1 bg-black border border-gray-800 px-3 py-2 text-sm text-gray-200"
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
                        className="text-gray-300 hover:text-gray-100 transition"
                    >
                        Load
                    </button>
                </div>
            )}

            {/* PLAYER */}
            <div className="w-full aspect-video bg-black overflow-hidden">
                {embedUrl ? (
                    <iframe
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
        </section>
    )
}

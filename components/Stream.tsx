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
        <section className="mt-4 space-y-3">
            {/* HEADER + BUTTONS */}
            <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold mr-2">
                    Live stream
                </h2>

                {PRESET_STREAMS.map(stream => (
                    <button
                        key={stream.label}
                        onClick={() => {
                            setUrl(stream.url)
                            setEditing(false)
                        }}
                        className={`px-3 py-1.5 rounded text-sm border transition ${url === stream.url
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500"
                            }`}
                    >
                        {stream.label}
                    </button>
                ))}

                {/* CUSTOM STREAM BUTTON */}
                <button
                    onClick={() => setEditing(!editing)}
                    className={`px-3 py-1.5 rounded text-sm border transition ${editing
                            ? "bg-gray-800 text-white border-gray-600"
                            : "bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500"
                        }`}
                >
                    Custom
                </button>
            </div>

            {/* CUSTOM STREAM INPUT (DESPLEGABLE) */}
            {editing && (
                <div className="flex gap-2">
                    <input
                        type="url"
                        placeholder="Paste YouTube URL"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        className="flex-1 border rounded px-3 py-2 text-sm bg-gray-900 border-gray-700"
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
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded"
                    >
                        Load
                    </button>
                </div>
            )}

            {/* PLAYER */}
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-800">
                {embedUrl ? (
                    <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        Invalid YouTube URL
                    </div>
                )}
            </div>
        </section>
    )
}

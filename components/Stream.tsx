"use client"

import { useState } from "react"
import { toEmbedUrl } from "@/lib/youtube"

const DEFAULT_STREAM =
    "https://www.youtube.com/watch?v=Ap-UM1O9RBU"

export default function Stream() {
    const [url, setUrl] = useState(DEFAULT_STREAM)
    const [input, setInput] = useState("")
    const [editing, setEditing] = useState(false)

    const embedUrl = toEmbedUrl(url)

    return (
        <section className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                    Live news stream
                </h2>

                <button
                    onClick={() => setEditing(!editing)}
                    className="text-sm text-blue-600 hover:underline"
                >
                    Change stream
                </button>
            </div>

            {editing && (
                <div className="flex gap-2">
                    <input
                        type="url"
                        placeholder="Paste YouTube URL"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        className="flex-1 border rounded px-3 py-2 text-sm"
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

            <div className="w-full aspect-video bg-black rounded overflow-hidden">
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

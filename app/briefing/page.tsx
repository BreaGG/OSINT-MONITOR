import { Suspense } from "react"
import BriefingClient from "./BriefingClient"

export default function BriefingPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
                        <span className="text-gray-400">Generating briefing...</span>
                    </div>
                </div>
            }
        >
            <BriefingClient />
        </Suspense>
    )
}

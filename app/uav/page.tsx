import { Suspense } from "react"
import UAVClientPage from "./uav-client"

export default function UAVPage() {
  return (
    <Suspense fallback={<UAVFallback />}>
      <UAVClientPage />
    </Suspense>
  )
}

function UAVFallback() {
  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center text-gray-400 text-sm">
      Initializing UAV feed…
    </div>
  )
}

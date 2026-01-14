"use client"

import { useEffect, useMemo, useState } from "react"
import type { SatelliteFocus } from "./SatelliteView"

/* ===================== TYPES ===================== */

type SocialPlatform = "telegram" | "twitter" | "youtube" | "tiktok"
type VerificationLevel = "verified" | "unverified" | "unknown"

type SocialSignal = {
  id: string
  platform: SocialPlatform
  region: string
  description: string
  timestamp: string
  verification: VerificationLevel
  url?: string
  sourceLabel?: string
}

/* ===================== CONFIG ===================== */

const ITEMS_PER_PAGE = 20

const PLATFORM_LABELS: Record<SocialPlatform | "all", string> = {
  all: "ALL",
  telegram: "TELEGRAM",
  twitter: "X",
  youtube: "YOUTUBE",
  tiktok: "TIKTOK",
}

const VERIFICATION_COLORS: Record<VerificationLevel, string> = {
  verified: "text-green-400",
  unverified: "text-yellow-400",
  unknown: "text-gray-600",
}

/* ===================== HELPERS ===================== */

function hoursAgo(ts: string) {
  return (Date.now() - new Date(ts).getTime()) / 36e5
}

function matchesFocus(signal: SocialSignal, focus?: SatelliteFocus) {
  if (!focus?.region) return true
  const r = focus.region.toLowerCase()
  return (
    signal.region.toLowerCase().includes(r) ||
    signal.description.toLowerCase().includes(r)
  )
}

/* ===================== COMPONENT ===================== */

export default function SocialView({ focus }: { focus?: SatelliteFocus }) {
  const [signals, setSignals] = useState<SocialSignal[]>([])
  const [platform, setPlatform] = useState<SocialPlatform | "all">("all")
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/social")
      .then(res => res.json())
      .then(data => setSignals(data))
      .catch(() => setSignals([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setPage(0)
  }, [focus?.region, platform])

  const filtered = useMemo(() => {
    return signals
      .filter(s => matchesFocus(s, focus))
      .filter(s => platform === "all" || s.platform === platform)
      .sort((a, b) => hoursAgo(a.timestamp) - hoursAgo(b.timestamp))
  }, [signals, focus, platform])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  const paginated = useMemo(() => {
    const start = page * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, page])

  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-1">
          {(["all", "telegram", "twitter", "youtube", "tiktok"] as const).map(p => (
            <button
              key={p}
              onClick={() => {
                setPlatform(p)
                setPage(0)
              }}
              className={`
                px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider
                transition-all
                ${platform === p
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                  : "text-gray-600 hover:text-gray-400 border border-gray-800"
                }
              `}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>

        <div className="text-[9px] text-gray-600 font-mono">
          {filtered.length}
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 min-h-0 flex flex-col mt-2">

        {/* SCROLLABLE LIST */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">

          {loading && (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <div className="w-4 h-4 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
              <div className="text-[9px] text-gray-600 uppercase tracking-wider">
                Loading signals...
              </div>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <div className="text-gray-700 text-2xl">○</div>
              <div className="text-[9px] text-gray-600 uppercase tracking-wider">
                No signals detected
              </div>
            </div>
          )}

          {paginated.map(s => {
            const externalUrl = s.url

            return (
              <div
                key={s.id}
                onClick={() => {
                  if (externalUrl) {
                    window.open(externalUrl, "_blank", "noopener,noreferrer")
                  }
                }}
                className={`
                  border border-gray-800 rounded bg-gray-950/50 p-2
                  transition-all
                  ${externalUrl ? "cursor-pointer hover:border-gray-700 hover:bg-gray-900/50" : ""}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">
                    {s.region}
                  </span>
                  <span className={`text-[8px] uppercase tracking-wider font-bold ${VERIFICATION_COLORS[s.verification]}`}>
                    {s.verification === "verified" ? "✓" : s.verification === "unverified" ? "?" : "—"}
                  </span>
                </div>

                <div className="text-[10px] text-gray-300 leading-relaxed mb-2 break-words">
                  {s.description}
                </div>

                <div className="flex items-center justify-between text-[8px]">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="uppercase tracking-wider font-bold">
                      {PLATFORM_LABELS[s.platform]}
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      {Math.floor(hoursAgo(s.timestamp))}H
                    </span>
                  </div>
                  <span className="text-gray-700 truncate max-w-[120px]">
                    {new Date(s.timestamp).toLocaleDateString()}
                  </span>
                </div>

                {s.sourceLabel && (
                  <div className="mt-1 text-[8px] text-gray-700 uppercase tracking-wider">
                    SRC: {s.sourceLabel}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="shrink-0 pt-2 mt-2 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-gray-600 uppercase tracking-wider font-bold">
                  Page
                </span>
                <div className="px-2 py-0.5 bg-gray-900 border border-gray-800 rounded">
                  <span className="text-[9px] text-gray-400 font-mono">
                    {page + 1}/{totalPages}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="
                    w-6 h-6 flex items-center justify-center rounded
                    border border-gray-800 bg-black/50
                    text-gray-500 text-[10px]
                    hover:border-gray-700 hover:text-gray-400
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all
                  "
                >
                  ←
                </button>

                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="
                    w-6 h-6 flex items-center justify-center rounded
                    border border-gray-800 bg-black/50
                    text-gray-500 text-[10px]
                    hover:border-gray-700 hover:text-gray-400
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all
                  "
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
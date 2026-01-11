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

const ITEMS_PER_PAGE = 10

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
  unknown: "text-gray-500",
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
  const [platform, setPlatform] =
    useState<SocialPlatform | "all">("all")
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  /* -------- FETCH DATA -------- */
  useEffect(() => {
    fetch("/api/social")
      .then(res => res.json())
      .then(data => setSignals(data))
      .catch(() => setSignals([]))
      .finally(() => setLoading(false))
  }, [])

  /* -------- RESET PAGE ON CONTEXT CHANGE -------- */
  useEffect(() => {
    setPage(0)
  }, [focus?.region, platform])

  /* -------- FILTER + SORT -------- */
  const filtered = useMemo(() => {
    return signals
      .filter(s => matchesFocus(s, focus))
      .filter(s => platform === "all" || s.platform === platform)
      .sort((a, b) => hoursAgo(a.timestamp) - hoursAgo(b.timestamp))
  }, [signals, focus, platform])

  /* -------- PAGINATION -------- */
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  const paginated = useMemo(() => {
    const start = page * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, page])

  /* ===================== RENDER ===================== */

  return (
    <div className="flex flex-col h-full bg-black">

      {/* HEADER */}
      <div className="border-b border-gray-800 p-2 text-[11px] flex justify-between">
        <div className="uppercase tracking-wide text-gray-400">
          Social signals
        </div>

        <div className="flex gap-1">
          {(["all", "telegram", "twitter", "youtube", "tiktok"] as const).map(p => (
            <button
              key={p}
              onClick={() => {
                setPlatform(p)
                setPage(0)
              }}
              className={`px-2 py-0.5 rounded ${platform === p
                  ? "border border-gray-700 text-gray-200"
                  : "text-gray-500 hover:text-gray-300"
                }`}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* BODY */}
      <div className="relative flex-1 min-h-0">

        {/* SCROLLABLE CONTENT */}
        <div className="absolute inset-0 flex flex-col">

          <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-14">

            {loading && (
              <div className="text-xs text-gray-500 text-center mt-6">
                Loading social signals…
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="text-xs text-gray-500 text-center mt-6">
                No relevant social signals detected
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
                  className={`border border-gray-800 rounded bg-black/40 p-3
                  ${externalUrl ? "cursor-pointer hover:border-gray-600" : ""}
                `}
                >
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-300">{s.region}</span>
                    <span className={VERIFICATION_COLORS[s.verification]}>
                      {s.verification.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-1 text-sm text-gray-200 break-words">
                    {s.description}
                  </div>

                  <div className="mt-2 flex justify-between text-[10px] text-gray-500">
                    <span>
                      {PLATFORM_LABELS[s.platform]} ·{" "}
                      {Math.floor(hoursAgo(s.timestamp))}h ago
                    </span>
                    <span>{new Date(s.timestamp).toUTCString()}</span>
                  </div>

                  {s.sourceLabel && (
                    <div className="mt-1 text-[10px] text-gray-600">
                      Source: {s.sourceLabel}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="border-t border-gray-800 bg-black/95 backdrop-blur p-2 flex justify-between text-[11px] text-gray-400">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="hover:text-gray-200 disabled:opacity-40"
              >
                ← Prev
              </button>

              <span>
                Page {page + 1} / {totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="hover:text-gray-200 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
"use client"

import { useEffect, useMemo, useState } from "react"
import {
  socialSources,
  type SocialPlatform,
  type VerificationLevel,
} from "@/lib/socialSources"
import type { SatelliteFocus } from "./SatelliteView"

/* ===================== TYPES ===================== */

type Props = {
  focus?: SatelliteFocus
}

type TimeWindow = "1h" | "3h" | "6h"

/* ===================== CONFIG ===================== */

const PLATFORM_LABELS: Record<SocialPlatform | "all", string> = {
  all: "ALL",
  telegram: "TELEGRAM",
  youtube: "YOUTUBE",
  twitter: "X",
  tiktok: "TIKTOK",
}

const VERIFICATION_COLORS: Record<VerificationLevel, string> = {
  verified: "text-green-400",
  unverified: "text-yellow-400",
  unknown: "text-gray-500",
}

const TIME_WINDOWS: Record<TimeWindow, number> = {
  "1h": 1,
  "3h": 3,
  "6h": 6,
}

/* ===================== HELPERS ===================== */

function hoursAgo(ts: string) {
  return (Date.now() - new Date(ts).getTime()) / 36e5
}

function classifyRecency(h: number) {
  if (h <= 1) return "NOW"
  if (h <= 3) return "EMERGING"
  if (h <= 6) return "RECENT"
  return "OLDER"
}

function matchesFocus(source: any, focus?: SatelliteFocus) {
  if (!focus?.region) return true

  const r = focus.region.toLowerCase()

  return (
    source.region.toLowerCase().includes(r) ||
    source.description.toLowerCase().includes(r)
  )
}

/* ===================== COMPONENT ===================== */

export default function SocialView({ focus }: Props) {
  const [platform, setPlatform] =
    useState<SocialPlatform | "all">("all")
  const [window, setWindow] = useState<TimeWindow>("6h")

  const [query, setQuery] = useState("")
  const [appliedQuery, setAppliedQuery] = useState("")

  /* -------- FILTER PIPELINE -------- */
  const visible = useMemo(() => {
    return socialSources
      .filter(s => matchesFocus(s, focus))
      .filter(s => platform === "all" || s.platform === platform)
      .filter(s => {
        if (!appliedQuery) return true
        const q = appliedQuery.toLowerCase()
        return (
          s.region.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
        )
      })
      .map(s => {
        const h = hoursAgo(s.timestamp)
        return { ...s, hoursAgo: h, recency: classifyRecency(h) }
      })
      .filter(s => s.hoursAgo <= TIME_WINDOWS[window])
      .sort((a, b) => a.hoursAgo - b.hoursAgo)
  }, [focus, platform, window, appliedQuery])

  /* -------- RESET ON MAP FOCUS CHANGE -------- */
  useEffect(() => {
    setQuery("")
    setAppliedQuery("")
    setPlatform("all")
    setWindow("6h")
  }, [focus?.region])

  /* ===================== RENDER ===================== */

  return (
    <div className="flex flex-col h-full bg-black">
      {/* CONTROLS */}
      <div className="border-b border-gray-800 p-2 text-[11px] space-y-2">
        <div className="flex justify-between">
          <div className="flex gap-1">
            {(["all", "telegram", "youtube", "twitter", "tiktok"] as const).map(
              p => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`px-2 py-0.5 rounded ${
                    platform === p
                      ? "bg-black text-gray-200 border border-gray-700"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {PLATFORM_LABELS[p]}
                </button>
              )
            )}
          </div>

          <div className="flex gap-1">
            {(["1h", "3h", "6h"] as TimeWindow[]).map(w => (
              <button
                key={w}
                onClick={() => setWindow(w)}
                className={`px-2 py-0.5 rounded ${
                  window === w
                    ? "bg-black text-gray-200 border border-gray-700"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {w.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* SEARCH */}
        <div className="flex gap-1">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              e.stopPropagation()
              if (e.key === "Enter") setAppliedQuery(query)
            }}
            onFocus={e => e.stopPropagation()}
            placeholder="Search keyword (overrides map focus)"
            className="flex-1 bg-black border border-gray-800 px-2 py-1 text-gray-200 rounded"
          />

          <button
            onClick={() => setAppliedQuery(query)}
            className="px-3 py-1 border border-gray-700 rounded text-gray-200"
          >
            SEARCH
          </button>
        </div>
      </div>

      {/* CONTEXT */}
      {focus?.region && (
        <div className="px-2 py-1 text-[11px] text-gray-500 border-b border-gray-800">
          Social signals related to <span className="text-gray-300">{focus.region}</span>
        </div>
      )}

      {/* CONTENT */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-3">
        {visible.length === 0 && (
          <div className="text-xs text-gray-500 text-center mt-6">
            No social signals match current focus or filters
          </div>
        )}

        {visible.map(s => (
          <div
            key={s.id}
            className="border border-gray-800 rounded bg-black/40 overflow-hidden"
          >
            <div className="aspect-video bg-black">
              <iframe
                src={s.embedUrl}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
              />
            </div>

            <div className="p-2 text-[11px] text-gray-500">
              <div className="flex justify-between">
                <span className="text-gray-300">{s.region}</span>
                <span className={VERIFICATION_COLORS[s.verification]}>
                  {s.verification.toUpperCase()}
                </span>
              </div>

              <div className="mt-1 text-gray-400">{s.description}</div>

              <div className="mt-1 flex justify-between text-gray-600">
                <span>{PLATFORM_LABELS[s.platform]} · {s.recency}</span>
                <span>{new Date(s.timestamp).toUTCString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

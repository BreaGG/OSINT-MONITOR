"use client"

import { useEffect, useState } from "react"

type MarketItem = {
    id: string
    label: string
    change: number
    fallback?: boolean
}

type YahooQuote = {
    symbol: string
    regularMarketChangePercent?: number
}

const FALLBACK_DATA: MarketItem[] = [
    { id: "SPX", label: "S&P 500", change: 0.42, fallback: true },
    { id: "WTI", label: "Oil (WTI)", change: -0.87, fallback: true },
    { id: "GOLD", label: "Gold", change: 0.31, fallback: true },
    { id: "BTC", label: "Bitcoin", change: 1.12, fallback: true },
]

export default function MarketSnapshot() {
    const [data, setData] = useState<MarketItem[]>([])
    const [usingFallback, setUsingFallback] = useState(false)

    useEffect(() => {
        async function fetchMarket() {
            try {
                const res = await fetch(
                    "https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EGSPC,CL=F,GC=F,BTC-USD",
                    { cache: "no-store" }
                )

                const json = await res.json()

                const results: YahooQuote[] =
                    json?.quoteResponse?.result ?? []

                const mapped: MarketItem[] = results
                    .map(item => {
                        if (typeof item.regularMarketChangePercent !== "number") {
                            return null
                        }

                        return {
                            id: item.symbol,
                            label:
                                item.symbol === "^GSPC"
                                    ? "S&P 500"
                                    : item.symbol === "CL=F"
                                        ? "Oil (WTI)"
                                        : item.symbol === "GC=F"
                                            ? "Gold"
                                            : item.symbol === "BTC-USD"
                                                ? "Bitcoin"
                                                : item.symbol,
                            change: item.regularMarketChangePercent,
                        }
                    })
                    .filter(Boolean) as MarketItem[]

                if (mapped.length === 0) {
                    setUsingFallback(true)
                    setData(FALLBACK_DATA)
                } else {
                    setData(mapped)
                }
            } catch {
                setUsingFallback(true)
                setData(FALLBACK_DATA)
            }
        }

        fetchMarket()
    }, [])

    return (
        <div className="text-xs text-gray-200 overflow-hidden">
            <div className="flex items-center gap-6 whitespace-nowrap animate-market-ticker hover:[animation-play-state:paused]">
                <span className="uppercase tracking-wide text-gray-400">
                    Market
                </span>

                {data.map(item => (
                    <div
                        key={item.id}
                        className="flex items-center gap-1"
                    >
                        <span className="text-gray-300">
                            {item.label}
                        </span>
                        <span
                            className={
                                item.change >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                            }
                        >
                            {item.change >= 0 ? "+" : ""}
                            {item.change.toFixed(2)}%
                        </span>
                    </div>
                ))}

                {usingFallback && (
                    <span className="text-gray-500 ml-4">
                        indicative
                    </span>
                )}
            </div>
        </div>
    )
}

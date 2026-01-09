"use client"

import { useEffect, useState } from "react"

type MarketItem = {
    id: string
    label: string
    change: number
    fallback?: boolean
}

const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY!

/**
 * ETFs y activos líquidos como proxy OSINT
 * (estándar en análisis macro y geopolítico)
 */
const SYMBOLS = [
    // Commodities (ETFs)
    { id: "WTI", label: "Oil (WTI)", symbol: "USO" },
    { id: "BRENT", label: "Oil (Brent)", symbol: "BNO" },
    { id: "GAS", label: "Natural Gas", symbol: "UNG" },
    { id: "GOLD", label: "Gold", symbol: "GLD" },
    { id: "SILVER", label: "Silver", symbol: "SLV" },
    { id: "AGRI", label: "Agriculture", symbol: "DBA" },

    // Empresas clave
    { id: "AAPL", label: "Apple", symbol: "AAPL" },
    { id: "MSFT", label: "Microsoft", symbol: "MSFT" },
    { id: "NVDA", label: "Nvidia", symbol: "NVDA" },
    { id: "GOOGL", label: "Alphabet", symbol: "GOOGL" },
    { id: "AMZN", label: "Amazon", symbol: "AMZN" },

    // Cripto
    { id: "BTC", label: "Bitcoin", symbol: "BINANCE:BTCUSDT" },
]

const FALLBACK_DATA: MarketItem[] = [
    { id: "WTI", label: "Oil (WTI)", change: 0.6, fallback: true },
    { id: "GOLD", label: "Gold", change: 0.2, fallback: true },
    { id: "GAS", label: "Natural Gas", change: -0.4, fallback: true },
    { id: "BTC", label: "Bitcoin", change: 0.9, fallback: true },
]

export default function MarketSnapshot() {
    const [data, setData] = useState<MarketItem[]>([])
    const [usingFallback, setUsingFallback] = useState(false)

    useEffect(() => {
        async function fetchMarket() {
            try {
                const results = await Promise.all(
                    SYMBOLS.map(async item => {
                        const res = await fetch(
                            `https://finnhub.io/api/v1/quote?symbol=${item.symbol}&token=${FINNHUB_KEY}`,
                            { cache: "no-store" }
                        )

                        if (!res.ok) return null

                        const json = await res.json()

                        if (
                            typeof json.c !== "number" ||
                            typeof json.pc !== "number" ||
                            json.pc === 0
                        ) {
                            return null
                        }

                        const change =
                            ((json.c - json.pc) / json.pc) * 100

                        return {
                            id: item.id,
                            label: item.label,
                            change,
                        }
                    })
                )

                const clean = results.filter(Boolean) as MarketItem[]

                if (clean.length === 0) {
                    throw new Error("No market data")
                }

                setUsingFallback(false)
                setData(clean)
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
                    <div key={item.id} className="flex items-center gap-1">
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

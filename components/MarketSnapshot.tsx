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
    { id: "WTI", label: "Oil", symbol: "USO" },
    { id: "GAS", label: "Gas", symbol: "UNG" },
    { id: "GOLD", label: "Gold", symbol: "GLD" },
    { id: "SILVER", label: "Silver", symbol: "SLV" },

    // Empresas clave
    { id: "AAPL", label: "Apple", symbol: "AAPL" },
    { id: "MSFT", label: "MSFT", symbol: "MSFT" },
    { id: "NVDA", label: "NVDA", symbol: "NVDA" },
    { id: "GOOGL", label: "GOOGL", symbol: "GOOGL" },

    // Cripto
    { id: "BTC", label: "BTC", symbol: "BINANCE:BTCUSDT" },
]

const FALLBACK_DATA: MarketItem[] = [
    { id: "WTI", label: "Oil", change: 0.6, fallback: true },
    { id: "GOLD", label: "Gold", change: 0.2, fallback: true },
    { id: "GAS", label: "Gas", change: -0.4, fallback: true },
    { id: "BTC", label: "BTC", change: 0.9, fallback: true },
]

export default function MarketSnapshot() {
    const [data, setData] = useState<MarketItem[]>([])
    const [usingFallback, setUsingFallback] = useState(false)
    const [loading, setLoading] = useState(true)

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

                        const change = ((json.c - json.pc) / json.pc) * 100

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
            } finally {
                setLoading(false)
            }
        }

        fetchMarket()
    }, [])

    return (
        <div className="bg-gray-950 border border-gray-900 rounded overflow-hidden">
            {/* SINGLE LINE TICKER */}
            <div className="px-3 py-2 overflow-hidden relative">
                {loading ? (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 border border-gray-700 border-t-green-500 rounded-full animate-spin" />
                        <span className="text-[9px] text-gray-600 uppercase tracking-wider">
                            Loading market...
                        </span>
                    </div>
                ) : (
                    <>
                        <div 
                            className="flex items-center gap-4 whitespace-nowrap"
                            style={{
                                animation: 'scroll-left 30s linear infinite',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.animationPlayState = 'paused'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.animationPlayState = 'running'
                            }}
                        >
                            {/* HEADER */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <div className={`w-1 h-1 rounded-full ${usingFallback ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
                                <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-gray-500">
                                    Market
                                </span>
                            </div>

                            {/* ITEMS - PRIMERA COPIA */}
                            {data.map(item => (
                                <div 
                                    key={item.id} 
                                    className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-900/30 border border-gray-800 rounded shrink-0"
                                >
                                    <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">
                                        {item.label}
                                    </span>
                                    <span
                                        className={`text-[9px] font-bold font-mono ${
                                            item.change >= 0
                                                ? "text-green-400"
                                                : "text-red-400"
                                        }`}
                                    >
                                        {item.change >= 0 ? "+" : ""}
                                        {item.change.toFixed(2)}%
                                    </span>
                                </div>
                            ))}

                            {/* FALLBACK INDICATOR */}
                            {usingFallback && (
                                <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded">
                                    <span className="text-yellow-500 text-[8px]">⚠</span>
                                    <span className="text-[8px] text-yellow-600 uppercase tracking-wider font-bold">
                                        SIM
                                    </span>
                                </div>
                            )}

                            {/* SEPARATOR */}
                            <div className="w-px h-4 bg-gray-800 shrink-0 mx-2" />

                            {/* ITEMS - SEGUNDA COPIA (para loop infinito) */}
                            {data.map(item => (
                                <div 
                                    key={`${item.id}-dup`}
                                    className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-900/30 border border-gray-800 rounded shrink-0"
                                >
                                    <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">
                                        {item.label}
                                    </span>
                                    <span
                                        className={`text-[9px] font-bold font-mono ${
                                            item.change >= 0
                                                ? "text-green-400"
                                                : "text-red-400"
                                        }`}
                                    >
                                        {item.change >= 0 ? "+" : ""}
                                        {item.change.toFixed(2)}%
                                    </span>
                                </div>
                            ))}

                            {/* FALLBACK INDICATOR - DUPLICATE */}
                            {usingFallback && (
                                <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded">
                                    <span className="text-yellow-500 text-[8px]">⚠</span>
                                    <span className="text-[8px] text-yellow-600 uppercase tracking-wider font-bold">
                                        SIM
                                    </span>
                                </div>
                            )}
                        </div>

                        <style dangerouslySetInnerHTML={{__html: `
                            @keyframes scroll-left {
                                0% {
                                    transform: translateX(0);
                                }
                                100% {
                                    transform: translateX(-50%);
                                }
                            }
                        `}} />
                    </>
                )}
            </div>
        </div>
    )
}
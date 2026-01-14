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
    const [showPopup, setShowPopup] = useState(false)

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

    // Función para obtener el link del exchange
    const getExchangeLink = (itemId: string) => {
        const symbol = SYMBOLS.find(s => s.id === itemId)?.symbol
        
        if (itemId === "BTC") {
            return `https://www.binance.com/en/trade/BTC_USDT`
        }
        
        // Para acciones, usar Yahoo Finance
        return `https://finance.yahoo.com/quote/${symbol}`
    }

    return (
        <div className="bg-gray-950 border border-gray-900 rounded relative">
            {/* SINGLE LINE TICKER */}
            <div 
                className="px-3 py-2 overflow-hidden relative"
                onMouseEnter={() => setShowPopup(true)}
                onMouseLeave={() => setShowPopup(false)}
            >
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

            {/* POPUP CON TODOS LOS INDICADORES */}
            {showPopup && !loading && (
                <div 
                    className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl z-50 p-3"
                    onMouseEnter={() => setShowPopup(true)}
                    onMouseLeave={() => setShowPopup(false)}
                >
                    {/* HEADER */}
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-800">
                        <div className={`w-1.5 h-1.5 rounded-full ${usingFallback ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
                        <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-gray-400">
                            Market Overview
                        </span>
                        {usingFallback && (
                            <span className="ml-auto text-[8px] text-yellow-600 uppercase tracking-wider font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded">
                                ⚠ SIM
                            </span>
                        )}
                    </div>

                    {/* GRID DE INDICADORES */}
                    <div className="grid grid-cols-3 gap-2">
                        {data.map(item => (
                            <a
                                key={item.id}
                                href={getExchangeLink(item.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                                    flex flex-col gap-1 p-2 
                                    bg-gray-950 border border-gray-800 rounded
                                    hover:border-cyan-500/50 hover:bg-gray-900/50
                                    transition-all cursor-pointer
                                    group
                                "
                            >
                                {/* LABEL */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                                        {item.label}
                                    </span>
                                    <svg 
                                        className="w-3 h-3 text-gray-700 group-hover:text-cyan-500 transition-colors" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </div>
                                
                                {/* CHANGE */}
                                <div className="flex items-center gap-1">
                                    <span
                                        className={`text-[11px] font-bold font-mono ${
                                            item.change >= 0
                                                ? "text-green-400"
                                                : "text-red-400"
                                        }`}
                                    >
                                        {item.change >= 0 ? "+" : ""}
                                        {item.change.toFixed(2)}%
                                    </span>
                                    <span className="text-[8px] text-gray-600">
                                        24h
                                    </span>
                                </div>

                                {/* ARROW INDICATOR */}
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className={`text-[10px] ${item.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                                        {item.change >= 0 ? "▲" : "▼"}
                                    </span>
                                    <span className="text-[8px] text-gray-600 uppercase tracking-wider">
                                        {item.change >= 0 ? "Up" : "Down"}
                                    </span>
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* FOOTER */}
                    <div className="mt-2 pt-2 border-t border-gray-800 text-center">
                        <span className="text-[8px] text-gray-600 uppercase tracking-wider">
                            Click any asset to view on exchange
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
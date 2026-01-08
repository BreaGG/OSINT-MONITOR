async function fetchStooq(symbol: string) {
  const url = `https://stooq.com/q/l/?s=${symbol}&i=d`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Stooq failed for ${symbol}`);
  }

  const text = await res.text();
  const lines = text.trim().split("\n");

  if (lines.length < 2) return null;

  const [, row] = lines;
  const parts = row.split(",");

  // CSV format:
  // Date,Open,High,Low,Close,Volume
  const open = Number(parts[1]);
  const close = Number(parts[4]);

  if (!open || !close) return null;

  const changePercent = ((close - open) / open) * 100;

  return {
    price: close,
    change: Number(changePercent.toFixed(2)),
  };
}

export async function fetchMarketData() {
  const sources = [
    { id: "SPX", label: "S&P 500", symbol: "^spx" },
    { id: "WTI", label: "Oil (WTI)", symbol: "cl.f" },
    { id: "GOLD", label: "Gold", symbol: "gc.f" },
    { id: "BTC", label: "Bitcoin", symbol: "btcusd" },
  ];

  const results = [];

  for (const s of sources) {
    try {
      const data = await fetchStooq(s.symbol);
      if (!data) continue;

      results.push({
        id: s.id,
        label: s.label,
        symbol: s.symbol,
        price: data.price,
        change: data.change,
      });
    } catch (err) {
      console.error("Market fetch error:", s.label, err);
    }
  }

  return results;
}

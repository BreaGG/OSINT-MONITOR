export type MarketIndicator = {
  id: string;
  label: string;
  symbol: string;
  value: string;
  change: number;
};

export const marketIndicators: MarketIndicator[] = [
  {
    id: "sp500",
    label: "S&P 500",
    symbol: "SPX",
    value: "4,872",
    change: 0.42,
  },
  {
    id: "oil",
    label: "Oil (WTI)",
    symbol: "WTI",
    value: "$78.31",
    change: -1.12,
  },
  {
    id: "gold",
    label: "Gold",
    symbol: "XAU",
    value: "$2,038",
    change: 0.87,
  },
  {
    id: "btc",
    label: "Bitcoin",
    symbol: "BTC",
    value: "$43,120",
    change: 2.01,
  },
];

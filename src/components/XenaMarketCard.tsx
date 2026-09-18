import React, { useState } from 'react';
import { TrendingUp, ShoppingCart, ArrowDownCircle, Activity, BarChart2, Zap } from 'lucide-react';
import { MarketStats } from '../types';
import { MARKET_CHART_POINTS } from '../data/initialData';
import { XenaTokenBadge } from './XenaLogo';

interface XenaMarketCardProps {
  marketStats: MarketStats;
  onBuyXena: () => void;
  onSellXena: () => void;
}

export const XenaMarketCard: React.FC<XenaMarketCardProps> = ({
  marketStats,
  onBuyXena,
  onSellXena,
}) => {
  const [timeframe, setTimeframe] = useState<'15m' | '1H' | '4H' | '1D' | '1W'>('1D');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const pointsData = MARKET_CHART_POINTS[timeframe];
  const minPrice = Math.min(...pointsData) * 0.985;
  const maxPrice = Math.max(...pointsData) * 1.015;
  const priceRange = maxPrice - minPrice || 0.1;

  const svgWidth = 360;
  const svgHeight = 110;
  const padX = 10;
  const padY = 15;

  const chartCoords = pointsData.map((val, idx) => {
    const x = padX + (idx / (pointsData.length - 1)) * (svgWidth - 2 * padX);
    const y = svgHeight - padY - ((val - minPrice) / priceRange) * (svgHeight - 2 * padY);
    return { x, y, val };
  });

  const makeSmooth = (coords: { x: number; y: number }[]) => {
    if (coords.length < 2) return '';
    let p = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      p += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return p;
  };

  const linePath = makeSmooth(chartCoords);
  const areaPath = `${linePath} L ${chartCoords[chartCoords.length - 1].x} ${svgHeight} L ${chartCoords[0].x} ${svgHeight} Z`;

  const currentHoverPrice = hoverIndex !== null ? chartCoords[hoverIndex].val : marketStats.price;

  return (
    <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-5 shadow-sm" id="xena-market-card">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-sm font-bold text-[#171717]">XENA Token</h3>
          <p className="text-xs text-[#6B7280]">Market overview</p>
        </div>
        <span className="text-xs font-semibold text-[#6D28D9] bg-[#F8F7FC] px-2.5 py-1 rounded-full border border-[#EDE9FE] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
          <span>Live Market</span>
        </span>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gradient">{currentHoverPrice.toFixed(4)} USDT</span>
          <span className="text-xs font-semibold text-[#16A34A]">+{marketStats.change24h}%</span>
        </div>

        {/* Timeframe pill selector */}
        <div className="flex bg-[#F8F7FC] p-0.5 rounded-lg border border-[#EDE9FE] text-[10px]">
          {(['1H', '1D', '1W'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf as any)}
              className={`px-1.5 py-0.5 font-bold rounded transition-all cursor-pointer ${
                timeframe === tf ? 'bg-white text-[#6D28D9] shadow-2xs' : 'text-[#6B7280]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart visualization */}
      <div className="h-28 w-full bg-[#F8F7FC] rounded-xl mb-4 relative p-2 overflow-hidden border border-[#EDE9FE]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="marketGradClean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#marketGradClean)" />
          <path
            d={linePath}
            fill="none"
            stroke="#7C3AED"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {chartCoords.map((pt, i) => (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoverIndex === i ? 5 : i === chartCoords.length - 1 ? 4 : 2}
                className="fill-white stroke-[#7C3AED] stroke-[2px]"
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onBuyXena}
          className="bg-gradient-to-r from-[#7C3AED] to-[#DB2777] text-white text-xs font-bold py-2.5 rounded-xl hover:opacity-95 transition-all cursor-pointer shadow-md shadow-fuchsia-200/50 flex items-center justify-center gap-1.5"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Buy</span>
        </button>
        <button
          onClick={onSellXena}
          className="border border-[#EDE9FE] text-[#171717] text-xs font-bold py-2.5 rounded-xl hover:bg-sky-50 hover:border-sky-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <ArrowDownCircle className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Sell</span>
        </button>
      </div>
    </div>
  );
};

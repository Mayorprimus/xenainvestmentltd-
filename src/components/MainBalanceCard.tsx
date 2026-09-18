import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, TrendingUp, Eye, EyeOff, Sparkles, RefreshCw } from 'lucide-react';
import { UserBalances } from '../types';
import { PORTFOLIO_HISTORY } from '../data/initialData';
import { XenaTokenBadge } from './XenaLogo';

interface MainBalanceCardProps {
  balances: UserBalances;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}

export const MainBalanceCard: React.FC<MainBalanceCardProps> = ({
  balances,
  onOpenDeposit,
  onOpenWithdraw,
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [activeTimeframe, setActiveTimeframe] = useState<'1D' | '1W' | '1M' | '1Y' | 'ALL'>('1D');
  const [hoveredPoint, setHoveredPoint] = useState<{ time: string; value: number } | null>(null);

  const chartData = PORTFOLIO_HISTORY[activeTimeframe];

  // SVG Chart path calculation
  const minVal = Math.min(...chartData.map((d) => d.value)) * 0.98;
  const maxVal = Math.max(...chartData.map((d) => d.value)) * 1.02;
  const range = maxVal - minVal || 1;

  const width = 360;
  const height = 120;
  const paddingX = 10;
  const paddingY = 15;

  const points = chartData.map((d, i) => {
    const x = paddingX + (i / (chartData.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((d.value - minVal) / range) * (height - 2 * paddingY);
    return { x, y, data: d };
  });

  // Smooth spline curve generator
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePath = createSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div
      className="relative rounded-[24px] p-5 sm:p-7 text-white overflow-hidden shadow-xl shadow-purple-200/40 deep-gradient transition-all duration-300"
      id="main-balance-card"
    >
      {/* Background spline wave accent per design theme */}
      <div className="absolute right-[-40px] bottom-[-20px] opacity-25 pointer-events-none">
        <svg width="400" height="150" viewBox="0 0 400 150">
          <path
            d="M0 120 Q50 110 100 80 T200 60 T300 40 T400 20"
            fill="none"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Side: Balance & Key Metrics */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-5">
          {/* Card Eyebrow */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-purple-100 text-xs font-medium uppercase tracking-wider">
                Total XENA Assets
              </p>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={showBalance ? 'Hide balance' : 'Show balance'}
              >
                {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Timeframe pill selector for chart */}
            <div className="flex bg-black/20 backdrop-blur-md p-1 rounded-xl border border-white/10">
              {(['1D', '1W', '1M', '1Y', 'ALL'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setActiveTimeframe(tf)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    activeTimeframe === tf
                      ? 'bg-white text-[#6D28D9] shadow-xs'
                      : 'text-purple-200 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Big Balance Number */}
          <div>
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
                {showBalance ? `${balances.totalXena.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XENA` : '••••••••'}
              </h2>
              <span className="text-purple-200 text-sm sm:text-lg font-medium">
                ≈ {showBalance ? `$${(balances.totalXena * balances.usdRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-xs sm:text-sm text-green-300 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                +{balances.change24hAmount.toFixed(2)} XENA (+{balances.change24hPercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Sub-balances: Available & Invested */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-1 sm:flex sm:flex-wrap">
            {/* Available */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3 border border-white/20 min-w-0 sm:min-w-[130px]">
              <p className="text-[11px] sm:text-xs text-purple-200 font-medium">Available</p>
              <p className="font-bold text-xs sm:text-base text-white mt-0.5 truncate">
                {showBalance ? `${balances.availableXena.toLocaleString('en-US', { minimumFractionDigits: 2 })} XENA` : '••••'}
              </p>
            </div>

            {/* Invested */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3 border border-white/20 min-w-0 sm:min-w-[130px]">
              <p className="text-[11px] sm:text-xs text-purple-200 font-medium">Invested</p>
              <p className="font-bold text-xs sm:text-base text-white mt-0.5 truncate">
                {showBalance ? `${balances.investedXena.toLocaleString('en-US', { minimumFractionDigits: 2 })} XENA` : '••••'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Deposit & Withdraw Buttons */}
        <div className="lg:col-span-4 grid grid-cols-2 sm:flex sm:flex-row lg:flex-col gap-2.5 sm:gap-3 justify-center items-stretch pt-1 sm:pt-0">
          <button
            onClick={onOpenDeposit}
            className="bg-white text-[#6D28D9] px-4 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm shadow-lg hover:bg-purple-50 active:scale-95 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer min-h-[44px]"
          >
            <ArrowDownRight className="w-4 h-4 text-[#6D28D9]" />
            <span>Deposit</span>
          </button>

          <button
            onClick={onOpenWithdraw}
            className="bg-white/20 text-white border border-white/30 px-4 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer min-h-[44px]"
          >
            <ArrowUpRight className="w-4 h-4 text-white" />
            <span>Withdraw</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { TrendingUp, ArrowRight, Clock, Award, ShieldCheck, Plus } from 'lucide-react';
import { InvestmentPlan } from '../types';

interface ActiveInvestmentsProps {
  plans: InvestmentPlan[];
  onSelectPlan: (plan: InvestmentPlan) => void;
  onNewInvestment?: () => void;
}

export const ActiveInvestments: React.FC<ActiveInvestmentsProps> = ({
  plans,
  onSelectPlan,
  onNewInvestment,
}) => {
  return (
    <section className="py-2" id="active-investments-section">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-[#171717]">
            Active Investments
          </h2>
          <p className="text-xs text-[#6B7280]">
            Automated compounding yield generating daily passive rewards
          </p>
        </div>

        {onNewInvestment && (
          <button
            onClick={onNewInvestment}
            className="px-3 py-1 rounded-full bg-[#F8F7FC] hover:bg-purple-50 text-[#6D28D9] text-xs font-bold border border-[#EDE9FE] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Explore Plans</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white border border-[#EDE9FE] rounded-[24px] p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-purple-100/50 hover:-translate-y-0.5 transition-all"
          >
            {/* Plan Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-[#171717]">{plan.name}</h3>
                  <p className="text-xs text-[#6B7280]">{plan.category}</p>
                </div>
                <span className="text-xs font-bold text-[#16A34A] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  +{plan.projectedReturnPercent}% APY
                </span>
              </div>

              {/* Progress */}
              <div className="flex flex-col gap-1.5 mt-3">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#6B7280]">Progress (Day {plan.totalDays - plan.daysRemaining}/{plan.totalDays})</span>
                  <span className="text-[#6D28D9] font-bold">{plan.progressPercent}%</span>
                </div>
                <div className="w-full bg-[#F8F7FC] h-2 rounded-full overflow-hidden border border-[#EDE9FE]">
                  <div
                    className="bg-gradient-to-r from-[#7C3AED] to-[#A855F7] h-full rounded-full transition-all duration-500"
                    style={{ width: `${plan.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Stats Box */}
              <div className="flex justify-between items-center pt-3 mt-3 border-t border-[#EDE9FE] text-xs">
                <div>
                  <p className="text-[#6B7280]">Invested</p>
                  <p className="font-bold text-[#171717]">{plan.investedAmount.toLocaleString()} XENA</p>
                </div>
                <div className="text-right">
                  <p className="text-[#6B7280]">Earned</p>
                  <p className="font-bold text-[#6D28D9]">+{plan.earnedAmount.toFixed(2)} XENA</p>
                </div>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => onSelectPlan(plan)}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold text-[#6D28D9] bg-[#F8F7FC] hover:bg-gradient-to-r hover:from-[#7C3AED] hover:to-[#A855F7] hover:text-white border border-[#EDE9FE] hover:border-transparent transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Manage Investment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

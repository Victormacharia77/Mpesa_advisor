/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PieChart, BarChart3, TrendingUp, DollarSign, Wallet, Percent, Info } from "lucide-react";
import { MpesaTransaction, TransactionType } from "../types";

interface ChartsViewProps {
  transactions: MpesaTransaction[];
}

export default function ChartsView({ transactions }: ChartsViewProps) {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);

  // 1. Filter out income/deposits for spending calculations
  const expenses = transactions.filter(
    (t) => t.type !== TransactionType.RECEIVE_MONEY && t.type !== TransactionType.CASH_DEPOSIT
  );

  const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalFees = transactions.reduce((sum, t) => sum + t.fee, 0);

  const inflows = transactions.filter(
    (t) => t.type === TransactionType.RECEIVE_MONEY || t.type === TransactionType.CASH_DEPOSIT
  );
  const totalReceived = inflows.reduce((sum, t) => sum + t.amount, 0);

  // 2. Aggregate spending by category
  const categoriesMap: Record<string, { amount: number; color: string }> = {
    Food: { amount: 0, color: "#10B981" }, // Emerald
    Utilities: { amount: 0, color: "#06B6D4" }, // Cyan
    Transport: { amount: 0, color: "#3B82F6" }, // Blue
    Shopping: { amount: 0, color: "#F59E0B" }, // Amber
    Leisure: { amount: 0, color: "#EC4899" }, // Pink
    Health: { amount: 0, color: "#EF4444" }, // Red
    Education: { amount: 0, color: "#8B5CF6" }, // Violet
    Miscellaneous: { amount: 0, color: "#64748B" }, // Slate
  };

  expenses.forEach((t) => {
    const cat = t.category || "Miscellaneous";
    if (categoriesMap[cat]) {
      categoriesMap[cat].amount += t.amount;
    } else {
      categoriesMap["Miscellaneous"].amount += t.amount;
    }
  });

  const categoryData = Object.entries(categoriesMap)
    .map(([name, val]) => ({
      name,
      amount: val.amount,
      color: val.color,
      percentage: totalSpent > 0 ? Math.round((val.amount / totalSpent) * 100) : 0,
    }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // 3. Fees by Transaction Type
  const feesMap: Record<string, number> = {
    "Send Money": 0,
    "Pay Bill": 0,
    "Cash Withdrawal": 0,
    "Buy Airtime": 0,
    Others: 0,
  };

  transactions.forEach((t) => {
    if (t.fee > 0) {
      if (t.type === TransactionType.SEND_MONEY) {
        feesMap["Send Money"] += t.fee;
      } else if (t.type === TransactionType.PAY_BILL) {
        feesMap["Pay Bill"] += t.fee;
      } else if (t.type === TransactionType.CASH_WITHDRAWAL) {
        feesMap["Cash Withdrawal"] += t.fee;
      } else if (t.type === TransactionType.AIRTIME) {
        feesMap["Buy Airtime"] += t.fee;
      } else {
        feesMap["Others"] += t.fee;
      }
    }
  });

  const feesData = Object.entries(feesMap)
    .map(([name, fee]) => ({ name, fee }))
    .filter((f) => f.fee > 0);

  // Donut chart logic (SVG arcs calculations)
  let cumulativePercent = 0;
  const donutSlices = categoryData.map((c) => {
    const startPercent = cumulativePercent;
    cumulativePercent += c.percentage;
    return {
      ...c,
      startPercent,
      endPercent: cumulativePercent,
    };
  });

  // Calculate coordinates for SVG path arc
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  if (transactions.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-6 text-center bg-slate-50">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4 border border-teal-100">
          <PieChart className="w-8 h-8 text-teal-600" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No chart data generated</h3>
        <p className="text-xs text-slate-500 max-w-[260px] mt-1.5 leading-relaxed">
          Pasting your Safaricom M-Pesa statements triggers beautiful, real-time interactive cost analysis and distributions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto pb-4">
      {/* View Title */}
      <div className="bg-slate-900 text-white p-5 shrink-0 flex items-center gap-2">
        <div className="bg-teal-500/20 p-1 rounded">
          <TrendingUp className="w-4 h-4 text-teal-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Visual Analytics</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Category breakdowns and transactional cost-leaks.</p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* Cash Inflow vs Outflow Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <span>Inflow vs Outflow</span>
            </h4>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium">Monthly cashflow</span>
          </div>

          <div className="flex justify-between items-end h-32 px-6 pt-4 border-b border-slate-100 relative">
            {/* Guide Gridlines */}
            <div className="absolute left-0 right-0 top-1/3 border-t border-slate-100/60 border-dashed" />
            <div className="absolute left-0 right-0 top-2/3 border-t border-slate-100/60 border-dashed" />

            {/* Inflow Bar */}
            <div className="flex flex-col items-center w-1/3 z-10">
              <span className="text-[10px] font-bold text-emerald-600 mb-1">
                Ksh {totalReceived > 1000 ? `${(totalReceived / 1000).toFixed(1)}k` : totalReceived}
              </span>
              <div
                className="w-10 bg-emerald-500 hover:bg-emerald-600 rounded-t-lg transition-all duration-500 shadow-sm"
                style={{
                  height: `${totalReceived + totalSpent > 0 ? (totalReceived / Math.max(totalReceived, totalSpent)) * 80 : 0}px`,
                }}
              />
              <span className="text-[10px] text-slate-500 font-bold mt-2">Inflows</span>
            </div>

            {/* Net Flow Marker */}
            <div className="flex flex-col items-center w-1/4 pb-4">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-1.5 text-center">
                <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-bold">Net Flow</span>
                <span className={`text-[10px] font-extrabold ${totalReceived - totalSpent >= 0 ? "text-teal-600" : "text-rose-600"}`}>
                  Ksh {Math.abs(totalReceived - totalSpent).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Outflow Bar */}
            <div className="flex flex-col items-center w-1/3 z-10">
              <span className="text-[10px] font-bold text-rose-600 mb-1">
                Ksh {totalSpent > 1000 ? `${(totalSpent / 1000).toFixed(1)}k` : totalSpent}
              </span>
              <div
                className="w-10 bg-slate-800 hover:bg-slate-700 rounded-t-lg transition-all duration-500 shadow-sm"
                style={{
                  height: `${totalReceived + totalSpent > 0 ? (totalSpent / Math.max(totalReceived, totalSpent)) * 80 : 0}px`,
                }}
              />
              <span className="text-[10px] text-slate-500 font-bold mt-2">Outflows</span>
            </div>
          </div>
        </div>

        {/* Category Share Donut Chart */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-teal-600" />
              <span>Category Distribution</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">Interactive breakdown</span>
          </div>

          {/* SVG Donut Chart wrapper */}
          <div className="relative w-40 h-40 flex items-center justify-center mb-4 shrink-0">
            <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-full h-full -rotate-90">
              {donutSlices.length === 0 ? (
                <circle cx="0" cy="0" r="1" fill="#f1f5f9" />
              ) : (
                donutSlices.map((slice, i) => {
                  const [startX, startY] = getCoordinatesForPercent(slice.startPercent / 100);
                  const [endX, endY] = getCoordinatesForPercent(slice.endPercent / 100);
                  const largeArcFlag = slice.percentage > 50 ? 1 : 0;
                  const pathData = `
                    M ${startX} ${startY}
                    A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}
                    L 0 0
                  `;
                  return (
                    <path
                      key={i}
                      d={pathData}
                      fill={slice.color}
                      className="transition-all duration-200 cursor-pointer"
                      style={{
                        transform: activeCategoryIndex === i ? "scale(1.04)" : "scale(1.0)",
                        transformOrigin: "center",
                        opacity: activeCategoryIndex !== null && activeCategoryIndex !== i ? 0.35 : 1.0,
                      }}
                      onMouseEnter={() => setActiveCategoryIndex(i)}
                      onMouseLeave={() => setActiveCategoryIndex(null)}
                      onClick={() => setActiveCategoryIndex(activeCategoryIndex === i ? null : i)}
                    />
                  );
                })
              )}
              {/* Center cutout for donut look */}
              <circle cx="0" cy="0" r="0.65" fill="#ffffff" />
            </svg>

            {/* Absolute Center Content */}
            <div className="absolute text-center flex flex-col items-center pointer-events-none select-none max-w-[100px]">
              {activeCategoryIndex !== null ? (
                <>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block truncate max-w-[80px]">
                    {donutSlices[activeCategoryIndex].name}
                  </span>
                  <span className="text-[11px] font-black text-slate-800 leading-tight">
                    {donutSlices[activeCategoryIndex].percentage}%
                  </span>
                  <span className="text-[8px] text-slate-400 block mt-0.5 truncate">
                    Ksh {donutSlices[activeCategoryIndex].amount.toLocaleString()}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Total Outflow</span>
                  <span className="text-[12px] font-black text-slate-800 leading-tight">
                    Ksh {totalSpent > 1000 ? `${(totalSpent / 1000).toFixed(1)}k` : totalSpent}
                  </span>
                  <span className="text-[8px] text-teal-600 font-semibold block mt-0.5">{categoryData.length} Sectors</span>
                </>
              )}
            </div>
          </div>

          {/* Interactive Legend Grid */}
          <div className="w-full grid grid-cols-2 gap-2 text-xs mt-2 border-t border-slate-50 pt-3">
            {categoryData.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-1 rounded-lg transition-colors cursor-pointer ${
                  activeCategoryIndex === idx ? "bg-slate-50" : "hover:bg-slate-50/50"
                }`}
                onMouseEnter={() => setActiveCategoryIndex(idx)}
                onMouseLeave={() => setActiveCategoryIndex(null)}
                onClick={() => setActiveCategoryIndex(activeCategoryIndex === idx ? null : idx)}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 truncate text-[11px] font-semibold">{item.name}</span>
                </div>
                <span className="text-slate-400 text-[10px] font-bold shrink-0">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Fees Optimization Alert */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
              <Info className="w-4 h-4 text-teal-600" />
              <span>Safaricom M-Pesa Fees Analysis</span>
            </h4>
            <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Cost Alert</span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
            You spent <strong className="font-bold text-slate-800">Ksh {totalFees.toLocaleString()}</strong> in M-Pesa transactional charges. In Kenya, Safaricom uses fee bands. Consolidating payments can dramatically lower your transaction tax.
          </p>

          {/* Fees Bar Chart */}
          {feesData.length > 0 ? (
            <div className="space-y-2.5">
              {feesData.map((f, i) => {
                const maxFee = Math.max(...feesData.map((fd) => fd.fee));
                const pctOfMax = maxFee > 0 ? (f.fee / maxFee) * 100 : 0;
                return (
                  <div key={i} className="flex flex-col">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-600">{f.name}</span>
                      <span className="text-slate-700 font-bold">Ksh {f.fee.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${pctOfMax}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-2 text-[10px] text-slate-400 italic">
              No transactional fees extracted. Congratulations, you spent Ksh 0.00 in fee tariffs!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, BarChart3, AlertTriangle, Calendar, Lightbulb, TrendingDown, ArrowRight, ShieldCheck } from "lucide-react";
import { MpesaTransaction, MonthlyReport } from "../types";

interface ReportsViewProps {
  transactions: MpesaTransaction[];
  savedReports: MonthlyReport[];
  onSaveReport: (report: MonthlyReport) => void;
}

export default function ReportsView({ transactions, savedReports, onSaveReport }: ReportsViewProps) {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [activeReport, setActiveReport] = useState<MonthlyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Group transactions into distinct Months
  const getMonthsInTransactions = () => {
    const months = new Set<string>();
    transactions.forEach((t) => {
      try {
        const date = new Date(t.dateTime);
        if (!isNaN(date.getTime())) {
          const mStr = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          months.add(mStr);
        }
      } catch (e) {
        // ignore invalid dates
      }
    });
    return Array.from(months);
  };

  const availableMonths = getMonthsInTransactions();

  // Set default selected month if available
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths]);

  // Check if there is an existing saved report for the selected month on load
  useEffect(() => {
    if (selectedMonth) {
      const existing = savedReports.find((r) => r.monthYear === selectedMonth);
      if (existing) {
        setActiveReport(existing);
      } else {
        setActiveReport(null);
      }
    }
  }, [selectedMonth, savedReports]);

  // 2. Generate monthly report from backend API
  const handleGenerateReport = async () => {
    if (!selectedMonth) return;

    setIsLoading(true);
    setError(null);

    // Filter transactions for this specific month
    const monthlyTxs = transactions.filter((t) => {
      try {
        const date = new Date(t.dateTime);
        const mStr = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        return mStr === selectedMonth;
      } catch {
        return false;
      }
    });

    try {
      const response = await fetch("/api/generate-monthly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: monthlyTxs,
          monthYear: selectedMonth,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error code: ${response.status}`);
      }

      const report = (await response.json()) as MonthlyReport;
      setActiveReport(report);
      onSaveReport(report); // Save report locally to state -> localStorage

    } catch (err: any) {
      console.error(err);
      setError("Failed to compile AI insights. Verify your API credentials or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-6 text-center bg-slate-50">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4 border border-teal-100">
          <Sparkles className="w-8 h-8 text-teal-600 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No AI Reports available</h3>
        <p className="text-xs text-slate-500 max-w-[260px] mt-1.5 leading-relaxed">
          Ingest your M-Pesa transaction statements first to unlock monthly advisory trends compiled by Gemini AI.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto pb-4">
      {/* Header Widget */}
      <div className="bg-slate-900 text-white p-5 shrink-0 flex items-center gap-2">
        <div className="bg-teal-500/20 p-1.5 rounded">
          <Sparkles className="w-4 h-4 text-teal-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Advisory & AI Reports</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Gemini-powered monthly spending advice & savings models.</p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Month Selector Panel */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Target report period</label>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-100 text-xs rounded-xl p-2.5 font-semibold text-slate-700 outline-none focus:border-teal-500 transition"
              >
                {availableMonths.map((m, idx) => (
                  <option key={idx} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                onClick={handleGenerateReport}
                disabled={isLoading || !selectedMonth}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition active:scale-95 flex items-center gap-1.5 shrink-0 hover:shadow shadow-emerald-600/10"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Compile AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading Spinner Screen */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin mb-4" />
            <h4 className="text-xs font-bold text-slate-800">Gemini is auditing your logs...</h4>
            <p className="text-[10px] text-slate-400 max-w-[220px] mt-1 leading-relaxed">
              Analyzing category distributions, cash flows, and tracking Safaricom M-Pesa cost leaks...
            </p>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 text-rose-700">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold">Failed to compile AI insights</h5>
              <p className="text-[11px] leading-relaxed mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Completed Active Report View */}
        {activeReport && !isLoading && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            
            {/* Core Statistics Highlights */}
            <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 w-20 h-20 bg-teal-500/10 rounded-full blur-xl" />
              
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Gemini Financial Audit</span>
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                  Compiled
                </span>
              </div>

              <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
                <div>
                  <span className="text-[8px] text-teal-300 uppercase tracking-wide block">Total outflow</span>
                  <p className="text-sm font-extrabold">Ksh {activeReport.totalSpent.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[8px] text-teal-300 uppercase tracking-wide block">Total inflow</span>
                  <p className="text-sm font-extrabold">Ksh {activeReport.totalReceived.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[8px] text-teal-300 uppercase tracking-wide block">M-Pesa Tax Fees</span>
                  <p className="text-sm font-extrabold text-amber-300">Ksh {activeReport.totalFees.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[8px] text-teal-300 uppercase tracking-wide block">Net savings rate</span>
                  <p className="text-sm font-extrabold text-emerald-300">
                    {activeReport.savingsRate > 0 ? `+${activeReport.savingsRate}%` : `${activeReport.savingsRate}%`}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Summary Block */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Advisor Synthesis</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {activeReport.aiSummary}
              </p>
            </div>

            {/* Actionable Recommendations Bullet Points */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Actionable insights</span>
              </h4>
              
              <div className="flex flex-col gap-3">
                {activeReport.aiInsights.map((insight, idx) => (
                  <div key={idx} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                    <span className="w-5 h-5 bg-teal-50 border border-teal-100/50 rounded-full flex items-center justify-center text-[10px] text-teal-700 font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="flex-1">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Advisory Onboarding State when no report compiled yet */}
        {!activeReport && !isLoading && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center shadow-sm">
            <Sparkles className="w-7 h-7 text-emerald-500 mx-auto animate-pulse" />
            <h4 className="text-xs font-bold text-slate-800 mt-2">Generate Monthly Advice Audit</h4>
            <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto mt-1 leading-relaxed">
              Select any transactional month from your database logs and click "Compile AI" to trigger a deep cashflow audit from Gemini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

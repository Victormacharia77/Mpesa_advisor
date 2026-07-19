/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ArrowUpRight, ArrowDownLeft, ShieldCheck, Wallet, DollarSign, ListFilter, Activity, Target, BellRing, Sparkles, Eye, EyeOff } from "lucide-react";
import { MpesaTransaction, CategoryBudget, TransactionType } from "../types";

interface DashboardProps {
  transactions: MpesaTransaction[];
  budgets: CategoryBudget[];
  onNavigate: (tab: string) => void;
  onAddTransactions?: (newTransactions: MpesaTransaction[]) => void;
  hideBalances: boolean;
  onToggleHideBalances: () => void;
}

export default function Dashboard({ transactions, budgets, onNavigate, onAddTransactions, hideBalances, onToggleHideBalances }: DashboardProps) {
  // 1. Calculations
  const expenses = transactions.filter(
    (t) => t.type !== TransactionType.RECEIVE_MONEY && t.type !== TransactionType.CASH_DEPOSIT
  );
  
  const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalFees = transactions.reduce((sum, t) => sum + t.fee, 0);
  
  const inflows = transactions.filter(
    (t) => t.type === TransactionType.RECEIVE_MONEY || t.type === TransactionType.CASH_DEPOSIT
  );
  const totalReceived = inflows.reduce((sum, t) => sum + t.amount, 0);
  
  const netSavings = totalReceived - totalSpent;
  const savingsRate = totalReceived > 0 ? Math.round((netSavings / totalReceived) * 100) : 0;

  // Find top spending merchant
  const merchantTotals: Record<string, number> = {};
  expenses.forEach((t) => {
    merchantTotals[t.party] = (merchantTotals[t.party] || 0) + t.amount;
  });
  const topMerchantEntry = Object.entries(merchantTotals).sort((a, b) => b[1] - a[1])[0];
  const topMerchant = topMerchantEntry ? topMerchantEntry[0] : "None";
  const topMerchantAmt = topMerchantEntry ? topMerchantEntry[1] : 0;

  // Aggregate current spending by budget category
  const updatedBudgets = budgets.map((b) => {
    const spentInCategory = expenses
      .filter((t) => t.category.toLowerCase() === b.category.toLowerCase())
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      ...b,
      spent: spentInCategory,
    };
  });

  // Recent transactions (last 3)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    .slice(0, 4);

  // Simulation of incoming SMS alert
  const simulateIncomingMpesaAlert = (type: "receive" | "paybill" | "buygoods") => {
    if (!onAddTransactions) return;

    // Generate random M-PESA transaction code
    const alph = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const num = "0123456789";
    let code = "";
    for (let i = 0; i < 2; i++) code += alph.charAt(Math.floor(Math.random() * alph.length));
    for (let i = 0; i < 4; i++) code += num.charAt(Math.floor(Math.random() * num.length));
    for (let i = 0; i < 4; i++) code += alph.charAt(Math.floor(Math.random() * alph.length));

    let smsBody = "";
    let parsedTx: MpesaTransaction;

    const dateStr = new Date().toLocaleDateString("en-GB");
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (type === "receive") {
      const amount = [2500, 5000, 12000, 800][Math.floor(Math.random() * 4)];
      const names = ["JOHN MWANGI", "MARY ATIENO", "HASSAN JUMA", "FAITH KEMBOI"];
      const sender = names[Math.floor(Math.random() * names.length)];
      smsBody = `${code} Confirmed. You have received Ksh${amount.toFixed(2)} from ${sender} on ${dateStr} at ${timeStr}. New M-PESA balance is Ksh${(amount + 12450).toFixed(2)}.`;
      
      parsedTx = {
        id: code,
        rawSms: smsBody,
        amount,
        fee: 0,
        type: TransactionType.RECEIVE_MONEY,
        party: sender,
        dateTime: new Date().toISOString(),
        balance: amount + 12450,
        category: "Income"
      };
    } else if (type === "paybill") {
      const amount = [1200, 3200, 450, 2400][Math.floor(Math.random() * 4)];
      const utilities = ["KPLC prepaid", "Zuku Fiber", "Nairobi Water", "Safaricom Home"];
      const util = utilities[Math.floor(Math.random() * utilities.length)];
      const fee = amount > 3000 ? 55 : amount > 1000 ? 33 : 15;
      smsBody = `${code} Confirmed. Ksh${amount.toFixed(2)} paid to ${util.toUpperCase()} for account 420019283 on ${dateStr} at ${timeStr}. New M-PESA balance is Ksh8,450.00. Transaction cost, Ksh${fee.toFixed(2)}.`;

      parsedTx = {
        id: code,
        rawSms: smsBody,
        amount,
        fee,
        type: TransactionType.PAY_BILL,
        party: util,
        dateTime: new Date().toISOString(),
        balance: 8450,
        category: "Utilities"
      };
    } else {
      const amount = [650, 1250, 480, 2100][Math.floor(Math.random() * 4)];
      const shops = ["Naivas Supermarket", "Quickmart Westlands", "Carrefour Junction", "Artcaffe"];
      const shop = shops[Math.floor(Math.random() * shops.length)];
      const fee = 0; // Buy Goods usually has zero cost for customer
      smsBody = `${code} Confirmed. Ksh${amount.toFixed(2)} paid to ${shop.toUpperCase()} on ${dateStr} at ${timeStr}. New M-PESA balance is Ksh5,220.00. Transaction cost, Ksh0.00.`;

      parsedTx = {
        id: code,
        rawSms: smsBody,
        amount,
        fee,
        type: TransactionType.BUY_GOODS,
        party: shop,
        dateTime: new Date().toISOString(),
        balance: 5220,
        category: "Food"
      };
    }

    // Trigger floating native push notification in MobileFrame!
    const event = new CustomEvent("mpesa-notification", {
      detail: {
        title: "M-PESA",
        body: smsBody
      }
    });
    window.dispatchEvent(event);

    // Save transaction in local list
    onAddTransactions([parsedTx]);
  };

  // If empty state
  if (transactions.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-6 text-center bg-slate-50 overflow-y-auto">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4 border border-teal-100">
          <Wallet className="w-8 h-8 text-teal-600" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No M-Pesa data analyzed yet</h3>
        <p className="text-xs text-slate-500 max-w-[260px] mt-1.5 leading-relaxed">
          Upload and parse your historical M-Pesa statements (SMS logs, CSV or PDF exports) securely in the AI Advisor tab. No live dialing or real-time SIM sync required!
        </p>

        {/* Quick Simulation Panel in Empty State */}
        <div className="mt-6 p-4 bg-white border border-slate-150 rounded-2xl max-w-sm w-full flex flex-col gap-3 shadow-sm">
          <span className="text-[10px] font-black text-teal-600 uppercase tracking-wider flex items-center justify-center gap-1">
            <BellRing className="w-3.5 h-3.5" /> SMS & Notification Simulator
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => simulateIncomingMpesaAlert("receive")}
              className="text-[9px] font-extrabold py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 rounded-xl transition cursor-pointer active:scale-95"
            >
              + Receive Money
            </button>
            <button
              onClick={() => simulateIncomingMpesaAlert("paybill")}
              className="text-[9px] font-extrabold py-2 px-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/50 rounded-xl transition cursor-pointer active:scale-95"
            >
              - Pay Bill
            </button>
            <button
              onClick={() => simulateIncomingMpesaAlert("buygoods")}
              className="text-[9px] font-extrabold py-2 px-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/50 rounded-xl transition cursor-pointer active:scale-95"
            >
              - Buy Goods
            </button>
          </div>
        </div>

        <button
          onClick={() => onNavigate("analyze")}
          className="mt-6 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl transition shadow-sm active:scale-95 cursor-pointer"
        >
          Open AI Advisor Chat
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto pb-4">
      {/* Header Widget */}
      <div className="bg-slate-900 text-white px-5 py-6 shrink-0 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 w-28 h-28 bg-teal-500/10 rounded-full blur-xl" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">Active Statement Period</span>
          </div>
          <span className="text-[10px] font-bold bg-teal-900/50 text-teal-300 border border-teal-700/30 px-2 py-0.5 rounded-full">
            Local SQLite Active
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-400">Total Mobile Outflow</p>
          <button 
            onClick={onToggleHideBalances} 
            className="flex items-center gap-1.5 text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-300 px-2.5 py-1 rounded-xl border border-white/5 transition cursor-pointer select-none active:scale-95"
            title={hideBalances ? "Show Balances" : "Hide Balances"}
          >
            {hideBalances ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{hideBalances ? "Show Balances" : "Hide Balances"}</span>
          </button>
        </div>
        <h2 className="text-3xl font-black tracking-tight mt-0.5">
          Ksh {hideBalances ? "••••••" : totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>

        {/* Mini Ledger Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-800/60">
          <div className="flex gap-2">
            <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Total Inflows</p>
              <p className="text-xs font-bold text-emerald-400">Ksh {hideBalances ? "••••••" : totalReceived.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-7 h-7 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-center text-rose-400 shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Transaction Fees</p>
              <p className="text-xs font-bold text-rose-400">Ksh {hideBalances ? "••••••" : totalFees.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Widgets Area */}
      <div className="px-4 py-5 flex flex-col gap-5">
        {/* SMS Notification Alert Simulator */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-teal-600 animate-pulse" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Historical Statement Simulator</h4>
            </div>
            <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-100">
              Interactive Test
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
            Simulate historical transactions to test how the AI Advisory engine parses and catalogs real SMS patterns! It auto-updates your balance and active budgets instantly.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => simulateIncomingMpesaAlert("receive")}
              className="text-[9.5px] font-extrabold py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150 rounded-xl transition cursor-pointer active:scale-95 text-center"
            >
              + Receive Money
            </button>
            <button
              onClick={() => simulateIncomingMpesaAlert("paybill")}
              className="text-[9.5px] font-extrabold py-2 px-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150 rounded-xl transition cursor-pointer active:scale-95 text-center"
            >
              - Pay Bill
            </button>
            <button
              onClick={() => simulateIncomingMpesaAlert("buygoods")}
              className="text-[9.5px] font-extrabold py-2 px-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-150 rounded-xl transition cursor-pointer active:scale-95 text-center"
            >
              - Buy Goods
            </button>
          </div>
        </div>

        {/* Savings Performance and Top Merchant */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Savings Rate</span>
              <h4 className="text-lg font-extrabold text-slate-800 mt-0.5">{savingsRate}%</h4>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${savingsRate > 20 ? "bg-emerald-500" : "bg-teal-500"}`}
                style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Top Merchant</span>
              <h4 className="text-[13px] font-extrabold text-slate-800 truncate mt-0.5" title={topMerchant}>
                {topMerchant}
              </h4>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">Ksh {hideBalances ? "••••••" : topMerchantAmt.toLocaleString()}</p>
          </div>
        </div>

        {/* Budgets Progress List */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-teal-600" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Category Budgets</h4>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Monthly tracker</span>
          </div>

          <div className="flex flex-col gap-3">
            {updatedBudgets.map((b, idx) => {
              const pct = b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0;
              const isOver = b.spent > b.limit;
              return (
                <div key={idx} className="flex flex-col">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className="font-semibold text-slate-700">{b.category}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Ksh {hideBalances ? "••••" : b.spent.toLocaleString()} <span className="text-slate-300">/</span> Ksh {hideBalances ? "••••" : b.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? "bg-rose-500" : pct > 80 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className={`text-[9px] font-bold ${isOver ? "text-rose-600" : pct > 80 ? "text-amber-600" : "text-slate-400"}`}>
                      {isOver ? "Exceeded Budget" : pct > 80 ? "Nearing Limit" : `${pct}% Spent`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prominent High-Visibility Ledger Link Banner */}
        <div
          onClick={() => onNavigate("ledger")}
          className="bg-gradient-to-r from-teal-800 to-slate-900 hover:from-teal-700 hover:to-slate-800 text-white rounded-2xl p-4 border border-teal-500/25 shadow-md flex items-center justify-between cursor-pointer transition-all duration-200 active:scale-[0.98] select-none"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 shadow-inner">
              <ListFilter className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[12px] font-black uppercase tracking-wider text-teal-300">Detailed M-Pesa Ledger</h4>
              <p className="text-[10px] text-slate-300 mt-0.5 leading-snug truncate">
                Filter, search, and audit your complete transaction history
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-300 shrink-0">
            <span className="font-bold text-sm">→</span>
          </div>
        </div>

        {/* Recent Transactions list */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Recent Activity</h4>
            </div>
            <button
              onClick={() => onNavigate("ledger")}
              className="text-[10px] text-teal-600 font-bold hover:underline flex items-center gap-0.5"
            >
              See ledger
            </button>
          </div>

          <div className="flex flex-col gap-2.5 flex-1 justify-start">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === TransactionType.RECEIVE_MONEY || tx.type === TransactionType.CASH_DEPOSIT;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                        isIncome
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {tx.party.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-[11px] font-bold text-slate-800 truncate" title={tx.party}>
                        {tx.party}
                      </h5>
                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">{tx.type}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-bold ${isIncome ? "text-emerald-600" : "text-slate-800"}`}>
                      {isIncome ? "+" : "-"} Ksh {hideBalances ? "••••" : tx.amount.toLocaleString()}
                    </p>
                    <span className="text-[8px] text-slate-400 block mt-0.5">
                      {new Date(tx.dateTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

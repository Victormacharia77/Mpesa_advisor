/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Tag, 
  Layers, 
  RefreshCw, 
  AlertCircle, 
  Copy, 
  Check, 
  Trash2, 
  Clock, 
  Coins, 
  MessageSquare,
  ShieldCheck,
  CreditCard,
  ArrowLeft
} from "lucide-react";
import { MpesaTransaction, TransactionType } from "../types";

interface TransactionListProps {
  transactions: MpesaTransaction[];
  onDeleteTransaction?: (id: string) => void;
  onBack?: () => void;
  hideBalances?: boolean;
}

export default function TransactionList({ transactions, onDeleteTransaction, onBack, hideBalances = false }: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Get unique list of categories and types for dropdown filters
  const categories = ["All", ...Array.from(new Set(transactions.map((t) => t.category)))];
  const types = ["All", ...Array.from(new Set(transactions.map((t) => t.type)))];

  // 2. Filter matching transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.party.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.rawSms && t.rawSms.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
    const matchesType = selectedType === "All" || t.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const handleRowClick = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCopyText = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Food":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Utilities":
        return "bg-cyan-50 text-cyan-700 border-cyan-100";
      case "Transport":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Shopping":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Leisure":
        return "bg-pink-50 text-pink-700 border-pink-100";
      case "Income":
        return "bg-teal-50 text-teal-700 border-teal-100";
      case "Health":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "Education":
        return "bg-violet-50 text-violet-700 border-violet-100";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 shrink-0 flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center shrink-0"
            title="Go back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-teal-400" />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            {!onBack && <Layers className="w-4 h-4 text-teal-400" />}
            <span>M-Pesa Transaction Ledger</span>
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Detailed activity log parsed from your raw SMS inputs ({filteredTransactions.length} of {transactions.length}).
          </p>
        </div>
      </div>

      {/* Control filters bar */}
      <div className="p-4 bg-white border-b border-slate-100 shrink-0 flex flex-col gap-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, merchant or details..."
            className="w-full bg-slate-50 border border-slate-100 text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition"
          />
        </div>

        {/* Quick filters selection */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-100 text-xs rounded-xl p-2 font-semibold text-slate-700 outline-none focus:border-teal-500 transition"
            >
              {categories.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Transaction Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 border border-slate-100 text-xs rounded-xl p-2 font-semibold text-slate-700 outline-none focus:border-teal-500 transition"
            >
              {types.map((t, i) => (
                <option key={i} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions list panel */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
        {filteredTransactions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-100">
            <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
            <h4 className="text-xs font-bold text-slate-700">No transactions match</h4>
            <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 leading-relaxed">
              Try adjusting your search criteria or category filters to find older activities.
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isExpanded = expandedId === tx.id;
            const isIncome = tx.type === TransactionType.RECEIVE_MONEY || tx.type === TransactionType.CASH_DEPOSIT;
            return (
              <div
                key={tx.id}
                className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-200 ${
                  isExpanded ? "ring-2 ring-teal-600/30 border-teal-600/20 shadow-md" : ""
                }`}
              >
                {/* Row Header clickable */}
                <div
                  onClick={() => handleRowClick(tx.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 active:bg-slate-100/40 transition select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-black shadow-sm ${
                        isIncome
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100/65"
                          : "bg-slate-100 text-slate-700 border border-slate-200/50"
                      }`}
                    >
                      {tx.party.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-0.5">
                        <h4 className="text-xs font-black text-slate-800 truncate leading-tight pr-1" title={tx.party}>
                          {tx.party}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[8.5px] font-bold text-slate-400 font-mono tracking-wider bg-slate-100/60 border border-slate-200/40 px-1.5 py-0.5 rounded">
                            {tx.id}
                          </span>
                          <span className={`text-[8.5px] font-extrabold border rounded-full px-1.5 py-0.5 ${getCategoryColor(tx.category)}`}>
                            {tx.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2.5 shrink-0 ml-auto pl-2">
                    <div className="flex flex-col items-end">
                      <p className={`text-xs font-black tracking-tight ${isIncome ? "text-emerald-600" : "text-slate-800"}`}>
                        {isIncome ? "+" : "-"} Ksh {hideBalances ? "••••" : tx.amount.toLocaleString()}
                      </p>
                      <span className="text-[9px] text-slate-400 font-semibold mt-0.5 leading-none">
                        {tx.type}
                      </span>
                      {tx.fee > 0 && (
                        <span className="text-[8.5px] text-rose-500 font-extrabold mt-1 bg-rose-50 border border-rose-100/50 rounded-md px-1.5 py-0.5">
                          Fee: Ksh {hideBalances ? "••••" : tx.fee.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 transition-transform" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform" />
                    )}
                  </div>
                </div>

                {/* Expanded Details section */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-100 p-5 text-[11px] text-slate-600 flex flex-col gap-4 animate-slideDown">
                    {/* Bento-style Grid metadata details */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* DateTime Card */}
                      <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-xs flex items-start gap-2.5">
                        <div className="p-1.5 bg-indigo-50 border border-indigo-100/50 rounded-lg text-indigo-600 shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wide block">Transaction Time</span>
                          <span className="font-bold text-slate-700 text-[11.5px] block mt-0.5">
                            {new Date(tx.dateTime).toLocaleString("en-KE", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Remaining Balance Card */}
                      <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-xs flex items-start gap-2.5">
                        <div className="p-1.5 bg-teal-50 border border-teal-100/50 rounded-lg text-teal-600 shrink-0">
                          <Coins className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wide block">Remaining Balance</span>
                          <span className="font-bold text-slate-700 text-[11.5px] block mt-0.5">
                            Ksh {hideBalances ? "••••••" : tx.balance.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Category Card */}
                      <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-xs flex items-start gap-2.5">
                        <div className="p-1.5 bg-amber-50 border border-amber-100/50 rounded-lg text-amber-600 shrink-0">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wide block">Parsed Category</span>
                          <span className="font-bold text-slate-700 text-[11.5px] block mt-0.5">
                            {tx.category}
                          </span>
                        </div>
                      </div>

                      {/* Transaction Type Card */}
                      <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-xs flex items-start gap-2.5">
                        <div className="p-1.5 bg-purple-50 border border-purple-100/50 rounded-lg text-purple-600 shrink-0">
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wide block">Transfer Type</span>
                          <span className="font-bold text-slate-700 text-[11.5px] block mt-0.5">
                            {tx.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Original Safaricom SMS receipt - Designed beautifully as a physical bill mockup */}
                    <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm relative">
                      <div className="flex items-center justify-between border-b border-dashed border-slate-100 pb-2.5 mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-[#00B140]" />
                          <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider">
                            Safaricom M-Pesa Receipt SMS
                          </span>
                        </div>
                        
                        <button
                          onClick={(e) => handleCopyText(tx.id, tx.rawSms || "", e)}
                          className="flex items-center gap-1 text-[9px] font-bold bg-slate-50 border border-slate-200 hover:bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 active:scale-95 transition"
                          title="Copy original raw receipt to clipboard"
                        >
                          {copiedId === tx.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 font-extrabold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy SMS</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 font-mono text-[10px] text-slate-600 leading-relaxed select-all">
                        {tx.rawSms}
                      </div>
                    </div>

                    {/* Transaction action controllers */}
                    {onDeleteTransaction && (
                      <div className="flex justify-end pt-1 border-t border-slate-100/70">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this transaction record?")) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 text-[10px] bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 px-3 py-1.5 rounded-lg font-bold border border-rose-100/60 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Transaction</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  PhoneCall, 
  Calendar, 
  Briefcase, 
  ShieldAlert, 
  Smartphone, 
  TrendingUp, 
  UserCheck, 
  Grid, 
  Compass, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Info,
  DollarSign,
  ArrowRightLeft,
  Building
} from "lucide-react";

interface SafaricomHubProps {
  onLogout?: () => void;
}

export default function SafaricomHub({ onLogout }: SafaricomHubProps) {
  // Tabs for the Info Hub
  const [activeSection, setActiveSection] = useState<"ussd" | "news" | "foundations" | "events" | "m_kopa" | "careers" | "care" | "fraud" | "agent" | "reversal" | "stock">("ussd");
  
  // USSD Emulator state
  const [ussdModalOpen, setUssdModalOpen] = useState(false);
  const [currentUssdCode, setCurrentUssdCode] = useState("");
  const [ussdHistory, setUssdHistory] = useState<string[]>([]);
  const [ussdInput, setUssdInput] = useState("");
  const [ussdOutputText, setUssdOutputText] = useState("");
  const [ussdStep, setUssdStep] = useState(0);

  // Search & Filtering for USSD Codes directory
  const [ussdSearch, setUssdSearch] = useState("");
  const [ussdFilterCategory, setUssdFilterCategory] = useState<"all" | "money" | "data" | "loans" | "support" | "intl" | "entertainment">("all");

  // M-Pesa Go Junior Sandbox Simulator state
  const [teenPocketMoney, setTeenPocketMoney] = useState(1500);
  const [teenSpendHistory, setTeenSpendHistory] = useState<{ id: string; party: string; amount: number; type: string; blocked: boolean }[]>([
    { id: "JTX001", party: "KCA Academy School Fees", amount: 800, type: "Paybill", blocked: false },
    { id: "JTX002", party: "Safaricom Bundles (Hook 50)", amount: 50, type: "Buy Airtime", blocked: false },
  ]);
  const [teenSandboxMessage, setTeenSandboxMessage] = useState<string | null>(null);

  // USSD code triggers
  const handleStartUssd = (code: string) => {
    setCurrentUssdCode(code);
    setUssdModalOpen(true);
    setUssdHistory([]);
    setUssdInput("");
    setUssdStep(0);
    
    if (code === "*334#") {
      setUssdOutputText(
        `M-PESA:\n1. Send Money\n2. Withdraw Cash\n3. Buy Goods and Services\n4. Pay Bill\n5. Loans and Savings\n6. Lipa Na M-PESA\n7. My Account\n8. Reversals`
      );
    } else if (code === "*544#") {
      setUssdOutputText(
        `Safaricom Data & Airtime:\n1. Hook & Win 5G Offers\n2. Buy Data Bundles (No Expiry)\n3. Daily / Weekly / Monthly Bundles\n4. Tunukiwa Special Offers\n5. Okoa Jahazi Credit\n6. Balance and Self Care`
      );
    } else if (code === "*144#") {
      setUssdOutputText(
        `Safaricom Airtime Balance:\n\nYour account balance is Ksh 124.50.\n- Active Bundles: 1.2 GB (Expires 19/07/2026)\n- SMS: 240 Free SMS\n\n0. Back`
      );
    } else if (code === "*555#") {
      setUssdOutputText(
        `Safaricom Kredi & Promotions:\n1. Opt-in to Kredi Points\n2. Redeem Points for Data\n3. Redeem Points for Airtime\n4. Check Points Balance\n\n0. Exit`
      );
    } else if (code === "*100#") {
      setUssdOutputText(
        `Prepaid Self Care:\n1. My Profile & PUK\n2. Manage My Subscriptions\n3. Data Manager (Stop internet when bundles run out)\n4. Link Another Line\n5. eSIM Activation Guide`
      );
    } else if (code === "*234#") {
      setUssdOutputText(
        `M-PESA Information:\n1. Fuliza M-PESA\n2. M-Shwari Status\n3. KCB M-PESA Info\n4. M-PESA Charge Query\n5. My Agent Location\n\n0. Exit`
      );
    } else if (code === "*487#") {
      setUssdOutputText(
        `Hustler Fund:\n1. Personal Loan (Limit: Ksh 1,200)\n2. Micro-Business Loan\n3. Check Balance / Repay\n4. Opt-out\n\n0. Exit`
      );
    } else if (code === "*131#") {
      setUssdOutputText(
        `Okoa Jahazi Airtime Advance:\n1. Okoa Ksh 50 (Fee Ksh 5)\n2. Okoa Ksh 100 (Fee Ksh 10)\n3. Okoa Ksh 200 (Fee Ksh 20)\n4. Check Okoa Debt Balance\n\n0. Back`
      );
    } else if (code === "*150#") {
      setUssdOutputText(
        `Safaricom Home Fiber:\n1. Pay for Home Fiber\n2. Manage Subscription\n3. Check Balance & Due Date\n4. Register New Account\n\n0. Exit`
      );
    } else if (code === "*266#") {
      setUssdOutputText(
        `Safaricom Roaming Services:\n1. Activate Roaming\n2. Buy Roaming Bundles\n3. Check Balance\n4. Deactivate Roaming\n\n0. Exit`
      );
    } else if (code === "*140#") {
      setUssdOutputText(
        `Safaricom International Calling:\n1. Buy International Calling Bundles\n2. Check Calling Rates\n3. Check Active Minutes Balance\n\n0. Back`
      );
    } else if (code === "*811#") {
      setUssdOutputText(
        `Skiza Tunes:\n1. Search skiza tunes\n2. Buy popular caller ringback tune\n3. My active tunes & Unsubscribe\n\n0. Back`
      );
    } else if (code === "*222#") {
      setUssdOutputText(
        `Safaricom Hook (Youth Hub):\n1. Buy Hook Bundles (Data + Music)\n2. Hook Careers & Tech Courses\n3. Hook Gaming (Daily League)\n\n0. Back`
      );
    } else if (code === "*456#") {
      setUssdOutputText(
        `Safaricom Services Menu:\n1. Premium Subscriptions & SPAM\n2. Check Active Subscriptions\n3. Tariff Migration\n4. Help Desk\n\n0. Exit`
      );
    } else {
      setUssdOutputText(
        `Safaricom Custom USSD:\nRequesting server connection for ${code}...\nPress Send or Exit.`
      );
    }
  };

  const handleUssdSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const input = ussdInput.trim();
    if (!input) return;

    setUssdHistory(prev => [...prev, `Entered: ${input}`]);
    setUssdInput("");

    // Simple branching emulator logic
    if (currentUssdCode === "*334#") {
      if (ussdStep === 0) {
        if (input === "1") {
          setUssdOutputText(`Send Money to:\n1. Enter Mobile Number\n2. Search in Contacts\n3. Send to Other Network\n\n0. Back`);
          setUssdStep(1);
        } else if (input === "5") {
          setUssdOutputText(`Loans and Savings:\n1. M-Shwari\n2. KCB M-PESA\n3. Mali Wealth Management\n4. Hustler Fund\n\n0. Back`);
          setUssdStep(5);
        } else if (input === "8") {
          setUssdOutputText(`M-PESA REVERSALS:\n\nTo reverse a wrong transaction instantly:\n1. Send transaction SMS code to 456\n2. Enter wrong transaction ID below\n3. Call helpline 100\n\nPress 0 to exit USSD.`);
          setUssdStep(8);
        } else {
          setUssdOutputText(`Request processed. Safaricom is verifying your selection. You will receive an SMS confirmation shortly.`);
          setUssdStep(99);
        }
      } else if (ussdStep === 1) {
        if (input === "1") {
          setUssdOutputText(`Enter Phone Number to send funds:`);
          setUssdStep(11);
        } else {
          handleStartUssd("*334#");
        }
      } else if (ussdStep === 11) {
        setUssdOutputText(`Enter Amount in Ksh to send to ${input}:`);
        setUssdStep(12);
      } else if (ussdStep === 5) {
        if (input === "1") {
          setUssdOutputText(`M-Shwari Services:\n1. Send money to M-Shwari\n2. Withdraw money to M-PESA\n3. Lock Savings Account\n4. Request Loan Limit\n\n0. Back`);
          setUssdStep(51);
        } else if (input === "3") {
          setUssdOutputText(`Mali Wealth Management:\n- Earn interest up to 10% per annum.\n- Minimum deposit: Ksh 100.\n- Instant withdrawal to M-Pesa.\n\n1. Register / Opt-in\n2. Invest Funds\n0. Back`);
          setUssdStep(53);
        } else {
          handleStartUssd("*334#");
        }
      } else {
        setUssdOutputText(`USSD session closed. Thank you for choosing Safaricom.`);
        setUssdStep(99);
      }
    } else if (currentUssdCode === "*544#") {
      if (ussdStep === 0) {
        if (input === "2") {
          setUssdOutputText(`Buy Data Bundles (No Expiry):\n1. Ksh 50 (150 MB)\n2. Ksh 100 (400 MB)\n3. Ksh 500 (2.5 GB)\n4. Ksh 1,000 (6 GB)\n\n0. Back`);
          setUssdStep(2);
        } else if (input === "5") {
          setUssdOutputText(`Okoa Jahazi Credit:\n1. Okoa Ksh 50 (Fee Ksh 5)\n2. Okoa Ksh 100 (Fee Ksh 10)\n3. Okoa Ksh 250 (Fee Ksh 25)\n\n0. Back`);
          setUssdStep(5);
        } else {
          setUssdOutputText(`USSD session closed. Thank you for choosing Safaricom.`);
          setUssdStep(99);
        }
      } else {
        setUssdOutputText(`USSD session closed. Your request is being processed offline.`);
        setUssdStep(99);
      }
    } else if (["*234#", "*487#", "*131#", "*150#", "*266#", "*140#", "*811#", "*222#", "*456#"].includes(currentUssdCode)) {
      setUssdOutputText(`Safaricom Service Message:\nYour request to enter option "${input}" is being processed.\nAn SMS receipt will be sent to your Safaricom mobile line shortly.\n\nThank you for choosing Safaricom.`);
      setUssdStep(99);
    } else {
      setUssdOutputText(`USSD code terminal simulation ended. Session timed out.`);
      setUssdStep(99);
    }
  };

  // Demo state for testing Wrong Reversal form
  const [reversalId, setReversalId] = useState("");
  const [reversalStatus, setReversalStatus] = useState<string | null>(null);

  const handleSimulateReversal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalId) return;
    setReversalStatus("processing");
    setTimeout(() => {
      setReversalStatus("success");
    }, 1500);
  };

  // Demo state for testing Job Application
  const [jobApplied, setJobApplied] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto pb-4">
      {/* Visual Title Header */}
      <div className="bg-slate-900 text-white px-5 py-6 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 w-28 h-28 bg-[#00B140]/10 rounded-full blur-xl" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-[#00B140]" />
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">Safaricom & M-Pesa Directory</span>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-[9.5px] font-extrabold bg-[#00B140]/10 text-[#00B140] hover:bg-[#00B140]/20 border border-[#00B140]/30 rounded-xl px-2.5 py-1 transition cursor-pointer select-none active:scale-95"
            >
              Sign Out
            </button>
          )}
        </div>
        <h2 className="text-2xl font-black tracking-tight mt-1.5">CARE & INFO HUB</h2>
        <p className="text-[11px] text-slate-400 mt-1 max-w-[280px] leading-relaxed">
          Official informational directories, legal policies, safety guardrails, and mock interactive tools according to Kenya Information Law.
        </p>
      </div>

      {/* Horizontal categories menu */}
      <div className="flex gap-1 overflow-x-auto px-4 py-3 bg-white border-b border-slate-100 scrollbar-none shrink-0 z-10 sticky top-0">
        <button
          onClick={() => setActiveSection("ussd")}
          className={`px-3 py-1.5 text-[10.5px] font-extrabold rounded-full transition whitespace-nowrap cursor-pointer ${
            activeSection === "ussd" ? "bg-[#00B140]/10 text-[#00B140] border border-[#00B140]/20" : "bg-slate-50 text-slate-600 border border-slate-150"
          }`}
        >
          📞 USSD Emulator
        </button>
        <button
          onClick={() => setActiveSection("news")}
          className={`px-3 py-1.5 text-[10.5px] font-extrabold rounded-full transition whitespace-nowrap cursor-pointer ${
            activeSection === "news" ? "bg-[#00B140]/10 text-[#00B140] border border-[#00B140]/20" : "bg-slate-50 text-slate-600 border border-slate-150"
          }`}
        >
          📰 News & Socials
        </button>
        <button
          onClick={() => setActiveSection("foundations")}
          className={`px-3 py-1.5 text-[10.5px] font-extrabold rounded-full transition whitespace-nowrap cursor-pointer ${
            activeSection === "foundations" ? "bg-[#00B140]/10 text-[#00B140] border border-[#00B140]/20" : "bg-slate-50 text-slate-600 border border-slate-150"
          }`}
        >
          🏛️ Foundations & Kids (Go)
        </button>
        <button
          onClick={() => setActiveSection("care")}
          className={`px-3 py-1.5 text-[10.5px] font-extrabold rounded-full transition whitespace-nowrap cursor-pointer ${
            activeSection === "care" ? "bg-[#00B140]/10 text-[#00B140] border border-[#00B140]/20" : "bg-slate-50 text-slate-600 border border-slate-150"
          }`}
        >
          🏢 Customer Care
        </button>
        <button
          onClick={() => setActiveSection("fraud")}
          className={`px-3 py-1.5 text-[10.5px] font-extrabold rounded-full transition whitespace-nowrap cursor-pointer ${
            activeSection === "fraud" ? "bg-[#00B140]/10 text-[#00B140] border border-[#00B140]/20" : "bg-slate-50 text-slate-600 border border-slate-150"
          }`}
        >
          🚨 Safety & Fraud
        </button>
        <button
          onClick={() => setActiveSection("reversal")}
          className={`px-3 py-1.5 text-[10.5px] font-extrabold rounded-full transition whitespace-nowrap cursor-pointer ${
            activeSection === "reversal" ? "bg-[#00B140]/10 text-[#00B140] border border-[#00B140]/20" : "bg-slate-50 text-slate-600 border border-slate-150"
          }`}
        >
          🔄 Reversals Guide
        </button>
        <button
          onClick={() => setActiveSection("events")}
          className={`px-3 py-1.5 text-[10.5px] font-extrabold rounded-full transition whitespace-nowrap cursor-pointer ${
            activeSection === "events" ? "bg-[#00B140]/10 text-[#00B140] border border-[#00B140]/20" : "bg-slate-50 text-slate-600 border border-slate-150"
          }`}
        >
          📅 Event Board
        </button>
        <button
          onClick={() => setActiveSection("m_kopa")}
          className={`px-3 py-1.5 text-[10.5px] font-extrabold rounded-full transition whitespace-nowrap cursor-pointer ${
            activeSection === "m_kopa" ? "bg-[#00B140]/10 text-[#00B140] border border-[#00B140]/20" : "bg-slate-50 text-slate-600 border border-slate-150"
          }`}
        >
          📱 M-KOPA Shop
        </button>
        <button
          onClick={() => setActiveSection("careers")}
          className={`px-3 py-1.5 text-[10.5px] font-extrabold rounded-full transition whitespace-nowrap cursor-pointer ${
            activeSection === "careers" ? "bg-[#00B140]/10 text-[#00B140] border border-[#00B140]/20" : "bg-slate-50 text-slate-600 border border-slate-150"
          }`}
        >
          💼 Careers
        </button>
        <button
          onClick={() => setActiveSection("agent")}
          className={`px-3 py-1.5 text-[10.5px] font-extrabold rounded-full transition whitespace-nowrap cursor-pointer ${
            activeSection === "agent" ? "bg-[#00B140]/10 text-[#00B140] border border-[#00B140]/20" : "bg-slate-50 text-slate-600 border border-slate-150"
          }`}
        >
          👥 Apply Agent
        </button>
        <button
          onClick={() => setActiveSection("stock")}
          className={`px-3 py-1.5 text-[10.5px] font-extrabold rounded-full transition whitespace-nowrap cursor-pointer ${
            activeSection === "stock" ? "bg-[#00B140]/10 text-[#00B140] border border-[#00B140]/20" : "bg-slate-50 text-slate-600 border border-slate-150"
          }`}
        >
          📈 Stocks & Wealth
        </button>
      </div>

      {/* Main content body */}
      <div className="p-4 flex-1">
        
        {/* SECTION 1: USSD EMULATOR */}
        {activeSection === "ussd" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black uppercase text-[#00B140] tracking-wider block mb-1">Interactive Simulation Directory</span>
              <h3 className="text-sm font-bold text-slate-800">Safaricom USSD Command Center</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                Safaricom USSD codes allow complete offline access to cellular and financial services. Browse the comprehensive directory below by category, search for any code, and tap to trigger an interactive network terminal simulator!
              </p>

              {/* Search and Category Filters */}
              <div className="mt-4 flex flex-col gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={ussdSearch}
                    onChange={(e) => setUssdSearch(e.target.value)}
                    placeholder="Search codes (e.g. *334#, fiber, loan, bonga)..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#00B140]"
                  />
                  {ussdSearch && (
                    <button
                      onClick={() => setUssdSearch("")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex gap-1 overflow-x-auto py-1 scrollbar-none">
                  <button
                    onClick={() => setUssdFilterCategory("all")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition whitespace-nowrap ${
                      ussdFilterCategory === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All Codes
                  </button>
                  <button
                    onClick={() => setUssdFilterCategory("money")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition whitespace-nowrap ${
                      ussdFilterCategory === "money" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    💸 M-Pesa & Money
                  </button>
                  <button
                    onClick={() => setUssdFilterCategory("data")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition whitespace-nowrap ${
                      ussdFilterCategory === "data" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    📶 Data & SMS
                  </button>
                  <button
                    onClick={() => setUssdFilterCategory("loans")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition whitespace-nowrap ${
                      ussdFilterCategory === "loans" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    🏦 Loans & Savings
                  </button>
                  <button
                    onClick={() => setUssdFilterCategory("support")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition whitespace-nowrap ${
                      ussdFilterCategory === "support" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    🛠️ Self Care & Fiber
                  </button>
                  <button
                    onClick={() => setUssdFilterCategory("intl")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition whitespace-nowrap ${
                      ussdFilterCategory === "intl" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    🌍 Roaming & Global
                  </button>
                  <button
                    onClick={() => setUssdFilterCategory("entertainment")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition whitespace-nowrap ${
                      ussdFilterCategory === "entertainment" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    🎵 Youth & Bonga
                  </button>
                </div>
              </div>

              {/* Exhaustive USSD Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 max-h-[360px] overflow-y-auto pr-1">
                {[
                  { code: "*334#", label: "M-Pesa Unified Menu", desc: "Send money, withdraw, Lipa Na M-Pesa, paybills, loans & reversals.", cat: "money" },
                  { code: "*234#", label: "M-Pesa Agent & Info Hub", desc: "Look up agents, Fuliza limits, M-Shwari, or calculate charges.", cat: "money" },
                  { code: "*487#", label: "Hustler Fund Services", desc: "Access micro-finance government loans, repayments, and savings.", cat: "loans" },
                  { code: "*131#", label: "Okoa Jahazi Credit", desc: "Request instant airtime credit advance to pay back on next recharge.", cat: "loans" },
                  { code: "*544#", label: "Data Bundles & Airtime", desc: "Buy mobile internet (no-expiry, daily, monthly), check airtime.", cat: "data" },
                  { code: "*144#", label: "Check Account Balance", desc: "View airtime balance, active data bundles, and free SMS counters.", cat: "data" },
                  { code: "*100#", label: "Prepaid Support Hub", desc: "Get PUK, manage premium subscriptions, activate eSIM, eSIM setup.", cat: "support" },
                  { code: "*200#", label: "Postpaid Self Care", desc: "Corporate invoicing, monthly allocations, credit limits, roaming.", cat: "support" },
                  { code: "*150#", label: "Home Fiber Support", desc: "Renew monthly home fiber plans, upgrade speeds, link fiber lines.", cat: "support" },
                  { code: "*555#", label: "Bonga Points Rewards", desc: "Redeem loyalty reward points for free minutes, internet, or phones.", cat: "entertainment" },
                  { code: "*811#", label: "Skiza Music Tunes", desc: "Subscribe, browse, or opt-out of Skiza caller ringback melodies.", cat: "entertainment" },
                  { code: "*222#", label: "Safaricom Hook (Youth)", desc: "Youth discounts, gaming leagues, free tech courses, custom bundles.", cat: "entertainment" },
                  { code: "*456#", label: "Spam & Tariff Care", desc: "Block marketing SMS, check tariffs, migrate, talk to support.", cat: "support" },
                  { code: "*266#", label: "International Roaming", desc: "Buy travel data and calling packages before boarding your flight.", cat: "intl" },
                  { code: "*140#", label: "International Calling", desc: "Safaricom global directory tariffs, purchase cheap international minutes.", cat: "intl" }
                ]
                  .filter(item => {
                    const matchesSearch = item.code.includes(ussdSearch) || 
                      item.label.toLowerCase().includes(ussdSearch.toLowerCase()) || 
                      item.desc.toLowerCase().includes(ussdSearch.toLowerCase());
                    const matchesCat = ussdFilterCategory === "all" || item.cat === ussdFilterCategory;
                    return matchesSearch && matchesCat;
                  })
                  .map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleStartUssd(item.code)}
                      className="p-3 bg-slate-950 text-white rounded-xl text-left border border-slate-900 hover:border-[#00B140]/60 hover:bg-slate-900 transition-all group cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-[#00B140] font-mono group-hover:scale-[1.03] transition-transform">{item.code}</span>
                        <span className="text-[7.5px] bg-[#00B140]/10 text-[#00B140] px-1.5 py-0.5 rounded uppercase font-black tracking-widest">{item.cat}</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-100 block mt-1 leading-tight">{item.label}</span>
                      <span className="text-[8px] text-slate-400 block mt-0.5 leading-relaxed">{item.desc}</span>
                    </button>
                  ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black uppercase text-amber-600 tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Direct Dial Recommendation
              </span>
              <p className="text-[10px] text-slate-600 leading-relaxed mt-1.5 font-medium">
                Safaricom officially recommends using these USSD codes on your physical device's dialer if you are in offline conditions. Our AI model can suggest dialing codes whenever you query M-Pesa statements or bundles.
              </p>
            </div>
          </div>
        )}

        {/* SECTION: NEWS & SOCIALS FEED */}
        {activeSection === "news" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* Main News Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black uppercase text-[#00B140] tracking-wider block mb-1">Official Press Room</span>
              <h3 className="text-sm font-bold text-slate-800">Safaricom PLC Latest Announcements</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1 mb-4">
                Real-time official updates, corporate events, and service rollouts compiled directly from Safaricom's news desk.
              </p>

              <div className="flex flex-col gap-3">
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/40">
                  <span className="text-[8px] font-black text-emerald-600 block uppercase">5G EXPANSION • JULY 2026</span>
                  <h4 className="text-xs font-extrabold text-slate-800 mt-1">Safaricom Extends Ultra-Fast 5G Coverage to 45 Counties</h4>
                  <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                    Safaricom has successfully commissioned 1,100 high-capacity 5G bases across 45 Kenyan counties, enabling thousands of residential consumers and businesses to access internet speeds of up to 1Gbps offline and online.
                  </p>
                  <span className="text-[9px] text-[#00B140] font-bold block mt-2 cursor-pointer hover:underline">Read official release →</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[8px] font-black text-slate-500 block uppercase">CORPORATE GOVERNANCE • JUNE 2026</span>
                  <h4 className="text-xs font-extrabold text-slate-800 mt-1">Safaricom Annual General Meeting Decides 2026 Dividends</h4>
                  <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                    The Safaricom Board of Directors approved a final dividend payout of Ksh 1.20 per ordinary share, reflecting robust commercial growth in digital payments and cellular operations.
                  </p>
                  <span className="text-[9px] text-slate-500 font-bold block mt-2 cursor-pointer hover:underline">Download AGM Report (PDF) →</span>
                </div>
              </div>
            </div>

            {/* Twitter/X Style Feed */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-black uppercase text-[#00B140] tracking-wider block">Official Twitter / X Stream</span>
                <span className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black">@SafaricomPLC</span>
              </div>

              <div className="flex flex-col gap-3.5 divide-y divide-slate-100">
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#00B140]/10 flex items-center justify-center font-black text-[#00B140] text-[9px]">S</div>
                    <div>
                      <h4 className="text-[10.5px] font-black text-slate-800 leading-none">Safaricom PLC <span className="text-[9px] text-slate-400 font-normal">@SafaricomPLC • 4h</span></h4>
                      <p className="text-[9.5px] text-slate-400">Official verified channel</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-700 leading-relaxed mt-2 pl-9">
                    Mambo ni digital! No need for physical paperwork to activate your eSIM. Just visit any Safaricom retail shop or dial Prepaid Self Care <span className="text-[#00B140] font-semibold font-mono">*100#</span> on your phone! 📲 No plastic card, 100% security. #eSIM #SafaricomHook
                  </p>
                  <div className="flex items-center gap-4 pl-9 mt-2 text-slate-400 text-[9px]">
                    <span>💬 340</span>
                    <span>🔁 1.2K</span>
                    <span>❤️ 4.8K</span>
                  </div>
                </div>

                <div className="pt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#00B140]/10 flex items-center justify-center font-black text-[#00B140] text-[9px]">M</div>
                    <div>
                      <h4 className="text-[10.5px] font-black text-slate-800 leading-none">M-Pesa App <span className="text-[9px] text-slate-400 font-normal">@MpesaApp • 1d</span></h4>
                      <p className="text-[9.5px] text-slate-400">Lipa Na M-Pesa Official</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-700 leading-relaxed mt-2 pl-9">
                    Teens want financial freedom to pay for study resources, parents want real guardrails. Meet <span className="text-emerald-600 font-black">M-Pesa Go</span>! 💳 Parental controls, real-time limit monitors, and strictly zero betting or mobile credit access. #MPesaGo #Parenting
                  </p>
                  <div className="flex items-center gap-4 pl-9 mt-2 text-slate-400 text-[9px]">
                    <span>💬 120</span>
                    <span>🔁 430</span>
                    <span>❤️ 1.9K</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instagram Style Feed */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black uppercase text-[#00B140] tracking-wider block mb-3">Instagram Highlights</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                  <div className="h-28 bg-gradient-to-tr from-[#00B140] to-emerald-800 flex items-center justify-center p-3 relative text-white animate-pulse">
                    <span className="absolute top-2 right-2 text-[8px] bg-black/40 text-white px-2 py-0.5 rounded-full font-black uppercase">Live Tour</span>
                    <div className="text-center">
                      <span className="text-[20px] block">🎸</span>
                      <span className="text-[10px] font-black tracking-tight block mt-1">Safaricom Hook Campus Tour</span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[9.5px] text-slate-700 leading-relaxed font-medium">
                      Empowering over 10,000 university students with coding bootcamps, custom data deals, and digital content creation masterclasses! 💻🔥 #SafaricomHook
                    </p>
                    <span className="text-[8px] text-slate-400 font-black block mt-1.5 uppercase">Nairobi Campus • 2 Days Ago</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                  <div className="h-28 bg-gradient-to-tr from-amber-500 to-emerald-700 flex items-center justify-center p-3 relative text-white">
                    <span className="absolute top-2 right-2 text-[8px] bg-black/40 text-white px-2 py-0.5 rounded-full font-black uppercase">Impact</span>
                    <div className="text-center">
                      <span className="text-[20px] block">🏥</span>
                      <span className="text-[10px] font-black tracking-tight block mt-1">Ndoto Zetu Hospital Upgrade</span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[9.5px] text-slate-700 leading-relaxed font-medium">
                      Commissioning the brand-new maternal health wing at Malava Sub-County Hospital, fully funded by Safaricom Foundation. Delivering safe, dignified births. #NdotoZetu
                    </p>
                    <span className="text-[8px] text-slate-400 font-black block mt-1.5 uppercase">Kakamega • 4 Days Ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: FOUNDATIONS & M-PESA GO */}
        {activeSection === "foundations" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* Foundations Overview Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black uppercase text-[#00B140] tracking-wider block mb-1">Corporate Philanthropy</span>
              <h3 className="text-sm font-bold text-slate-800">Safaricom & M-Pesa Foundations</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                Authorized registered charity vehicles established to transform lives and empower Kenyan communities through systemic multi-million funding.
              </p>

              <div className="grid grid-cols-1 gap-3 mt-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🌻</span>
                    <h4 className="text-xs font-black text-slate-800">Safaricom Foundation ("Ndoto Zetu")</h4>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1.5 leading-relaxed">
                    Partnering directly with local communities to actualize their dreams in three core pillars: Health (equipping centers, mobile clinics), Education (building school libraries, digital labs), and Economic Empowerment (solar-powered irrigation pumps, disabled youth self-help groups). Over 3,000 projects completed.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🏫</span>
                    <h4 className="text-xs font-black text-slate-800">M-Pesa Foundation ("M-Pesa Academy")</h4>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1.5 leading-relaxed">
                    A multi-billion residential co-educational institution in Thika that provides talented students from economically challenged background with premium International Baccalaureate (IB) education under 100% full scholarships.
                  </p>
                  <div className="mt-2 text-[9px] bg-[#00B140]/10 text-[#00B140] px-2 py-1 rounded font-extrabold inline-block">
                    Impact: Uzazi Salama maternal health campaign in Samburu county is also fully funded here.
                  </div>
                </div>
              </div>
            </div>

            {/* M-PESA GO INTERACTIVE SANDBOX */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[8px] font-black uppercase bg-[#00B140] text-slate-950 px-2 py-0.5 rounded tracking-wider inline-block mb-1">Interactive Sandbox Tool</span>
                  <h3 className="text-sm font-extrabold text-white">M-Pesa Go: Secure Wallet for Teens</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-extrabold">Ages 10-17</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-2">
                M-Pesa Go is Safaricom's custom junior payment wallet that empowers kids while enforcing strict parental locks and legally mandatory guardrails.
              </p>

              {/* Guardrails specs */}
              <div className="grid grid-cols-2 gap-1.5 mt-3 text-[9px] text-slate-300">
                <div className="bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-emerald-400 font-bold block">✓ Parental Oversight</span>
                  Parents can set limits, view statements, and fund pocket money accounts easily.
                </div>
                <div className="bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-amber-400 font-bold block">✓ Zero Loan Exposure</span>
                  Teenagers can never access Fuliza, M-Shwari loans, or high-risk leverage.
                </div>
                <div className="bg-slate-800/60 p-2 rounded-lg col-span-2">
                  <span className="text-rose-400 font-bold block">✓ Automatic Merchant Blocks</span>
                  The system automatically blocks payments to betting companies, liquor outlets, and adult-only services.
                </div>
              </div>

              {/* Simulator Panel */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mt-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-[9.5px] text-slate-400 font-extrabold font-mono">Mock Teen Wallet Simulator</span>
                  <span className="text-xs text-emerald-400 font-black font-mono">Balance: Ksh {teenPocketMoney.toLocaleString()}</span>
                </div>

                {/* Sandbox action button triggers */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => {
                      if (teenPocketMoney < 50) {
                        setTeenSandboxMessage("❌ INSUFFICIENT FUNDS: Pocket money depleted.");
                        return;
                      }
                      setTeenPocketMoney(prev => prev - 50);
                      const tx = { id: `JTX${Date.now().toString().slice(-3)}`, party: "E-Learning study bundle", amount: 50, type: "Buy Bundles", blocked: false };
                      setTeenSpendHistory(prev => [tx, ...prev]);
                      setTeenSandboxMessage("✅ SUCCESS: Paid Ksh 50 for teen-friendly study bundles.");
                    }}
                    className="p-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-lg text-left text-[9px] cursor-pointer"
                  >
                    <span className="text-emerald-400 font-bold block">📚 Buy Study Bundle</span>
                    <span className="text-slate-500 text-[8px]">Cost: Ksh 50 (Approved)</span>
                  </button>

                  <button
                    onClick={() => {
                      setTeenSandboxMessage("🚫 PAYMENT BLOCKED: M-Pesa Go has blocked this transaction. Underage betting and gambling is strictly prohibited by Kenya Information Law.");
                      const tx = { id: `JTX${Date.now().toString().slice(-3)}`, party: "SportPesa / Betting Merchant", amount: 200, type: "Gambling Paybill", blocked: true };
                      setTeenSpendHistory(prev => [tx, ...prev]);
                    }}
                    className="p-2 bg-slate-900 border border-slate-800 hover:border-rose-500/40 rounded-lg text-left text-[9px] cursor-pointer"
                  >
                    <span className="text-rose-400 font-bold block">🎲 Send to SportPesa</span>
                    <span className="text-slate-500 text-[8px]">Cost: Ksh 200 (Restricted)</span>
                  </button>
                </div>

                {/* Simulated alerts */}
                {teenSandboxMessage && (
                  <div className={`mt-3 p-2 rounded-lg text-[9px] font-medium leading-relaxed ${
                    teenSandboxMessage.startsWith("✅") ? "bg-emerald-950/40 text-emerald-300 border border-emerald-900/30" : "bg-rose-950/40 text-rose-300 border border-rose-900/30"
                  }`}>
                    {teenSandboxMessage}
                  </div>
                )}

                {/* Log history inside teen wallet */}
                <div className="mt-3">
                  <span className="text-[8px] font-black uppercase text-slate-500 block mb-1">Teenager Wallet Log</span>
                  <div className="flex flex-col gap-1.5 max-h-[85px] overflow-y-auto pr-0.5">
                    {teenSpendHistory.map((h) => (
                      <div key={h.id} className="flex justify-between items-center text-[8.5px] p-1.5 bg-slate-900/40 rounded">
                        <div className="flex items-center gap-1.5">
                          <span>{h.blocked ? "🚫" : "💳"}</span>
                          <div>
                            <span className="font-extrabold block text-slate-200">{h.party}</span>
                            <span className="text-slate-500 text-[7.5px] font-mono">{h.id} • {h.type}</span>
                          </div>
                        </div>
                        <span className={`font-mono font-black ${h.blocked ? "text-rose-400 line-through" : "text-emerald-400"}`}>
                          Ksh {h.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: CUSTOMER CARE DIRECTORY */}
        {activeSection === "care" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black uppercase text-[#00B140] tracking-wider block mb-1">Customer Care Center resolve guide</span>
              <h3 className="text-sm font-bold text-slate-800">Authorized Care Locations in Kenya</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                For major account overrides, legal updates, or corporate operations, visit any authorized physical customer care retail center:
              </p>

              {/* Locations Grid */}
              <div className="flex flex-col gap-2.5 mt-4">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Building className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Sarit Centre Retail Shop (Nairobi)</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">First Floor, Sarit Centre Mall, Westlands</p>
                    <p className="text-[9px] text-[#00B140] font-extrabold mt-1">Services: SIM Swap, Reversals, M-Pesa Agent Audit, M-Pesa Visa campaigns</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Building className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">I&M Customer Care Retail Shop</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">I&M Building, Kenyatta Avenue, Nairobi CBD</p>
                    <p className="text-[9px] text-[#00B140] font-extrabold mt-1">Services: High-volume merchant onboarding, Corporate line allocations</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Building className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Junction Mall Safaricom Shop</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Ground Floor, Junction Mall, Ngong Road</p>
                    <p className="text-[9px] text-[#00B140] font-extrabold mt-1">Services: Line unblocking, original ID verification, Home Fiber setups</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Building className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Nyali Safaricom Retail Shop (Mombasa)</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Ground Floor, Nyali Centre, Mombasa</p>
                    <p className="text-[9px] text-[#00B140] font-extrabold mt-1">Services: Coast region agent support, SIM Swaps, bill inquiries</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Building className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">West End Safaricom Shop (Kisumu)</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Ground Floor, West End Mall, Kisumu</p>
                    <p className="text-[9px] text-[#00B140] font-extrabold mt-1">Services: Western region consumer self-care, line registrations</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Services resolved at Retail Shops:</h3>
              <ul className="text-[10.5px] text-slate-600 leading-relaxed list-disc pl-4 flex flex-col gap-1.5">
                <li><strong>SIM Card Replacement / Swap</strong>: Loss of card or upgrading to 5G LTE require physical biometric registration.</li>
                <li><strong>Line Unblocking (PUK Recovery)</strong>: Keying wrong PINs requires customer care center or *100# verification.</li>
                <li><strong>Corporate Merchant Till</strong>: Registering Lipa Na M-Pesa Tills for LLCs and partnership stores.</li>
                <li><strong>Agent Onboarding Audit</strong>: Depositing capital physical checks and licensing.</li>
              </ul>
            </div>
          </div>
        )}

        {/* SECTION 3: SAFETY & FRAUD PREVENTION */}
        {activeSection === "fraud" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 p-4 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-rose-800 uppercase tracking-wide">Consumer Protection Guardrails</h4>
                <p className="text-[10.5px] text-rose-700 leading-relaxed mt-1">
                  M-Pesa fraud is highly common. In Kenya, perpetrators use social engineering or mock phone calls to compromise your PIN. Protect yourself instantly!
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800">How to Identify Stranger Fraud</h3>
              
              <div className="flex flex-col gap-3 mt-3">
                <div className="flex items-start gap-2.5 p-2.5 bg-rose-50/40 border border-slate-100 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">1</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">"Wrong Deposit" Refund Callers</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">A stranger calls claiming they sent cash to your line by mistake and asks you to "dial codes" or send it back. Do NOT send money back directly. Ask them to trigger an official Safaricom reversal!</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-rose-50/40 border border-slate-100 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">2</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Fake Customer Care Numbers</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Safaricom customer care will ONLY call you using the official, verified hotline number: <strong>0722 000 000</strong>. If someone calls using a normal personal number claiming to be a Safaricom support employee, hang up immediately!</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-rose-50/40 border border-slate-100 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">3</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Never Share Your PIN or Phone</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Never enter your M-Pesa PIN on any portal or screen prompted by a stranger. Never hand your unlocked phone over to strangers at agent points or retailer kiosks.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div>
                <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" /> REPORT FRAUDULENT NUMBERS
                </h4>
                <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                  You can block unknown scammers and report their numbers to Safaricom directly. Forward the suspicious SMS or the phone number of the fraud caller to the official toll-free Safaricom reporting helpline:
                </p>
              </div>

              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[8px] uppercase font-bold text-slate-400 block">Safaricom Report SMS Helpline</span>
                  <span className="text-xs font-black text-[#00B140] font-mono">SMS Scammer Details to 333</span>
                </div>
                <span className="text-[9px] bg-[#00B140]/10 text-[#00B140] font-extrabold px-2 py-0.5 rounded-full border border-[#00B140]/20">Toll Free</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: WRONG TRANSACTION REVERSAL GUIDE */}
        {activeSection === "reversal" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black uppercase text-[#00B140] tracking-wider block mb-1">Instant Reversal Workflow</span>
              <h3 className="text-sm font-bold text-slate-800">How to get a reversal</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                Sent cash to the wrong till number, wrong paybill, or wrong phone number? Here are the official recovery avenues according to information and billing laws:
              </p>

              {/* Steps */}
              <div className="flex flex-col gap-2.5 mt-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <span className="text-[9px] font-extrabold text-[#00B140] uppercase tracking-wide">Method 1 (Instant SMS Reversal)</span>
                  <p className="text-[10.5px] text-slate-700 font-bold mt-1">Forward the complete M-Pesa SMS confirmation to the official helpline code 456.</p>
                  <p className="text-[9.5px] text-slate-500 mt-0.5">Safaricom systems parse the transaction and lock the funds instantly on the receiver's end, pending investigation.</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-155">
                  <span className="text-[9px] font-extrabold text-[#00B140] uppercase tracking-wide">Method 2 (USSD Reversal)</span>
                  <p className="text-[10.5px] text-slate-700 font-bold mt-1">Dial *334# and select Option 8 (Reversals).</p>
                  <p className="text-[9.5px] text-slate-500 mt-0.5">Follow the offline prompt to identify your wrong transaction and initiate automated recovery.</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-155">
                  <span className="text-[9px] font-extrabold text-[#00B140] uppercase tracking-wide">Method 3 (Chatbot Zuri / M-Pesa App)</span>
                  <p className="text-[10.5px] text-slate-700 font-bold mt-1">Log into the M-PESA App, open history, tap the transaction, and select "Request Reversal".</p>
                </div>
              </div>
            </div>

            {/* Simulated Reversal Form */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Interactive Sandbox Tool</span>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Test Reversal Simulation</h3>
              
              <form onSubmit={handleSimulateReversal} className="mt-3 flex flex-col gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 block mb-1">ENTER M-PESA TRANSACTION ID (e.g. QX728HJ189)</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Enter 10-char code"
                    value={reversalId}
                    onChange={(e) => setReversalId(e.target.value.toUpperCase())}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-150 rounded-lg uppercase tracking-wider font-mono outline-none focus:border-[#00B140]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reversalStatus === "processing"}
                  className="w-full text-xs font-bold text-white bg-[#00B140] hover:bg-[#009033] transition py-2.5 rounded-lg active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {reversalStatus === "processing" ? "Locking recipient wallet..." : "Initiate Mock Reversal Request"}
                </button>
              </form>

              {reversalStatus === "success" && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200/60 rounded-xl flex items-start gap-2 text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">Request Logged with Safaricom Net</p>
                    <p className="text-[9px] text-emerald-600 mt-0.5">We simulated locking transaction {reversalId}. Safaricom is sending a confirmation SMS to your phone line offline.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 5: EVENT BOARD & CAMPAIGNS */}
        {activeSection === "events" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black uppercase text-[#00B140] tracking-wider block mb-1">Safaricom Event Board</span>
              <h3 className="text-sm font-bold text-slate-800">Active Campaign Calendars</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                Stay updated on live roadshows, merchant hackathons, and consumer campaigns occurring next week across various Kenya regional locations:
              </p>

              <div className="flex flex-col gap-3 mt-4">
                {/* Event 1 */}
                <div className="p-3 bg-slate-50 rounded-xl border-l-4 border-l-[#00B140] border border-slate-150 relative">
                  <span className="absolute top-3 right-3 text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-extrabold uppercase">Next Week</span>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                    <Calendar className="w-3.5 h-3.5" /> 23rd July 2026 - 28th July 2026
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mt-1">M-Pesa Visa Virtual Card Campaign</h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Safaricom activation agents are hosting a giant lifestyle and international checkout booth at <strong>Sarit Centre, Westlands (Nairobi)</strong>. Head there next week to claim free transaction fees, register for Safaricom Global Pay, and win custom airtime bundle vouchers!
                  </p>
                </div>

                {/* Event 2 */}
                <div className="p-3 bg-slate-50 rounded-xl border-l-4 border-l-slate-400 border border-slate-150">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                    <Calendar className="w-3.5 h-3.5" /> 10th August 2026
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mt-1">Safaricom Golf Tour Regional Finale</h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Mombasa Golf Club. Supporting regional youth sports development programs and offline networking events for Lipa Na M-Pesa premium merchants.
                  </p>
                </div>

                {/* Event 3 */}
                <div className="p-3 bg-slate-50 rounded-xl border-l-4 border-l-slate-400 border border-slate-150">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                    <Calendar className="w-3.5 h-3.5" /> 18th August 2026
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mt-1">Lipa Na M-Pesa Merchant Meetup</h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Laico Regent Hotel, Nairobi. Reviewing feedback on QR payments, settlement APIs, and merchant withdrawal charges.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: M-KOPA PHONE SHOP */}
        {activeSection === "m_kopa" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black uppercase text-[#00B140] tracking-wider block mb-1">M-KOPA Shop (Lipa Mdogo Mdogo)</span>
              <h3 className="text-sm font-bold text-slate-800">Phone Financing & Real-time Prices</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                Safaricom partners with M-KOPA to offer pay-as-you-go cellular financing. You pay a small entry deposit and settle the balance via small daily installments:
              </p>

              <div className="flex flex-col gap-3 mt-4">
                {/* Phone 1 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-slate-600" /> Samsung Galaxy A04s
                    </h4>
                    <p className="text-[9px] text-slate-500 mt-0.5">Financed via Safaricom Airtime Control</p>
                    <div className="flex gap-2.5 mt-2">
                      <span className="text-[9px] bg-[#00B140]/10 text-[#00B140] font-black px-1.5 py-0.5 rounded">Deposit: Ksh 3,999</span>
                      <span className="text-[9px] bg-slate-200/60 text-slate-700 font-black px-1.5 py-0.5 rounded">Daily: Ksh 70</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-black block text-slate-700">Total Term</span>
                    <span className="text-[9px] text-slate-400 block">365 Days</span>
                  </div>
                </div>

                {/* Phone 2 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-slate-600" /> Nokia C21 Plus
                    </h4>
                    <p className="text-[9px] text-slate-500 mt-0.5">Stocked and cleared for Kenya lines</p>
                    <div className="flex gap-2.5 mt-2">
                      <span className="text-[9px] bg-[#00B140]/10 text-[#00B140] font-black px-1.5 py-0.5 rounded">Deposit: Ksh 3,499</span>
                      <span className="text-[9px] bg-slate-200/60 text-slate-700 font-black px-1.5 py-0.5 rounded">Daily: Ksh 60</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-black block text-slate-700">Total Term</span>
                    <span className="text-[9px] text-slate-400 block">365 Days</span>
                  </div>
                </div>

                {/* Phone 3 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-slate-600" /> Tecno Spark 10
                    </h4>
                    <p className="text-[9px] text-slate-500 mt-0.5">High battery performance smartphone</p>
                    <div className="flex gap-2.5 mt-2">
                      <span className="text-[9px] bg-[#00B140]/10 text-[#00B140] font-black px-1.5 py-0.5 rounded">Deposit: Ksh 4,499</span>
                      <span className="text-[9px] bg-slate-200/60 text-slate-700 font-black px-1.5 py-0.5 rounded">Daily: Ksh 85</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-black block text-slate-700">Total Term</span>
                    <span className="text-[9px] text-slate-400 block">365 Days</span>
                  </div>
                </div>

                {/* Phone 4 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-slate-600" /> Samsung Galaxy A14
                    </h4>
                    <p className="text-[9px] text-slate-500 mt-0.5">Full HD Display, dual Safaricom SIM</p>
                    <div className="flex gap-2.5 mt-2">
                      <span className="text-[9px] bg-[#00B140]/10 text-[#00B140] font-black px-1.5 py-0.5 rounded">Deposit: Ksh 5,499</span>
                      <span className="text-[9px] bg-slate-200/60 text-slate-700 font-black px-1.5 py-0.5 rounded">Daily: Ksh 110</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-black block text-slate-700">Total Term</span>
                    <span className="text-[9px] text-slate-400 block">365 Days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 7: CAREERS & JOBS */}
        {activeSection === "careers" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black uppercase text-[#00B140] tracking-wider block mb-1">Talent & Human Resources</span>
              <h3 className="text-sm font-bold text-slate-800">How to Apply for a Job at Safaricom</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                Safaricom recruits globally for roles based in Nairobi, Addis Ababa, and regional hubs. All official openings are logged on the central database portal:
              </p>

              <div className="flex flex-col gap-3 mt-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-[#00B140]" /> Software Engineer, M-Pesa Core
                    </span>
                    <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">Open</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Nairobi, HQ. Requirements: Java, Kotlin, spring-boot, microservices, secure transaction architecture.</p>
                  <button
                    onClick={() => setJobApplied("M-Pesa Core Software Engineer")}
                    className="mt-2.5 text-[10px] bg-[#00B140] hover:bg-[#009033] text-white px-3 py-1 rounded font-bold transition cursor-pointer"
                  >
                    Apply Now
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-[#00B140]" /> regional M-Pesa Agent Manager
                    </span>
                    <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">Open</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Rift Valley Region. Requirements: 3+ years experience in retail finance distributions, driving float logistics.</p>
                  <button
                    onClick={() => setJobApplied("Regional Agent Manager")}
                    className="mt-2.5 text-[10px] bg-[#00B140] hover:bg-[#009033] text-white px-3 py-1 rounded font-bold transition cursor-pointer"
                  >
                    Apply Now
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-[#00B140]" /> Data Protection Compliance Officer
                    </span>
                    <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">Open</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">HQ Nairobi. Auditing systems according to Kenya Data Protection Act 2019 and global security laws.</p>
                  <button
                    onClick={() => setJobApplied("Data Compliance Officer")}
                    className="mt-2.5 text-[10px] bg-[#00B140] hover:bg-[#009033] text-white px-3 py-1 rounded font-bold transition cursor-pointer"
                  >
                    Apply Now
                  </button>
                </div>
              </div>

              {jobApplied && (
                <div className="mt-4 p-3 bg-[#00B140]/10 text-[#00B140] rounded-xl border border-[#00B140]/20 text-center">
                  <p className="text-xs font-bold">Mock Application Successful for {jobApplied}!</p>
                  <p className="text-[9.5px] text-slate-500 mt-0.5">To submit a legal corporate resume, please navigate to the official Safaricom portal at <strong>safaricom.co.ke/careers</strong></p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 8: AGENT APPLICATION */}
        {activeSection === "agent" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black uppercase text-[#00B140] tracking-wider block mb-1">M-Pesa Distribution Channel</span>
              <h3 className="text-sm font-bold text-slate-800">Become an Authorized M-Pesa Agent</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                Applying to run a physical cash-deposit/withdrawal booth is regulated by Safaricom and CBK policies. Review key eligibility criteria:
              </p>

              <div className="flex flex-col gap-3.5 mt-4">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <UserCheck className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-[#00B140]">Capital & Float Requirements</h4>
                    <p className="text-[10px] text-slate-600 mt-1">
                      A minimum of <strong>Ksh 100,000</strong> liquid cash is required to act as cash reserve float for deposits and customer agent withdrawals.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <UserCheck className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-[#00B140]">Corporate Documentation</h4>
                    <p className="text-[10px] text-slate-600 mt-1">
                      Must provide a registered limited liability company certificate, active tax compliance Pin, business permits from the respective county, and verified Police Clearance Certificates (Certificate of Good Conduct) for administrators.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <UserCheck className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-[#00B140]">Physical Kiosk / Security</h4>
                    <p className="text-[10px] text-slate-600 mt-1">
                      Physical outlet must adhere to minimum safety standards, with transparent barriers, secure physical ledgers/registers, and visible branding displays indicating that <strong>deposits are free</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 9: STOCK & INVESTMENT */}
        {activeSection === "stock" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black uppercase text-[#00B140] tracking-wider block mb-1">Nairobi Securities Exchange (NSE)</span>
              <h3 className="text-sm font-bold text-slate-800">Safaricom PLC Stock & Ziidi Wealth</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                Safaricom PLC (ticker <strong>SCOM</strong>) is Kenya's most valuable publicly traded firm. Monitor corporate financial performance and alternative savings pools:
              </p>

              {/* Stock ticker box */}
              <div className="mt-4 p-4 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">SCOM (Safaricom PLC)</span>
                  <span className="text-lg font-black font-mono">Ksh 15.40 <span className="text-emerald-400 text-xs font-bold">+1.31%</span></span>
                  <span className="text-[8px] text-slate-500 block mt-0.5">Nairobi Securities Exchange, Live pricing simulated</span>
                </div>
                <div className="w-12 h-8 flex items-end gap-0.5">
                  <div className="w-1.5 h-2 bg-emerald-500/30 rounded-t" />
                  <div className="w-1.5 h-4 bg-emerald-500/40 rounded-t" />
                  <div className="w-1.5 h-3 bg-emerald-500/50 rounded-t" />
                  <div className="w-1.5 h-6 bg-emerald-500/80 rounded-t" />
                  <div className="w-1.5 h-8 bg-emerald-500 rounded-t animate-pulse" />
                </div>
              </div>

              {/* Information text */}
              <div className="flex flex-col gap-3 mt-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <h4 className="text-xs font-bold text-slate-800">Ziidi Alternative Investing (Mali Wealth)</h4>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Safaricom has partnered with capital market managers to deliver **Mali**, a micro-investment pool offering up to <strong>10% annual yields</strong>. It enables instant top-up via M-Pesa starting from as low as Ksh 100 with zero lock-in restrictions.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <h4 className="text-xs font-bold text-slate-800">Kenyan Information Law Compliance</h4>
                  <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                    Under the <strong>Kenya Data Protection Act 2019</strong>, Safaricom and M-Pesa financial transactions are highly confidential. Your personal offline statement database on this app is completely private, stored on-device, and compliant with consumer billing and digital privacy rights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* USSD Modal overlay */}
      {ussdModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-6 z-[999]">
          <div className="bg-slate-950 text-emerald-400 font-mono w-full max-w-sm rounded-2xl border-2 border-emerald-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[420px]">
            {/* Header */}
            <div className="bg-slate-900 border-b border-emerald-500/20 px-4 py-2.5 flex items-center justify-between shrink-0 text-white font-sans text-xs font-bold">
              <span>Interactive USSD Console ({currentUssdCode})</span>
              <button
                onClick={() => setUssdModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Output screen */}
            <div className="p-4 flex-1 overflow-y-auto flex flex-col justify-between text-xs leading-relaxed font-mono whitespace-pre-wrap select-text">
              <div>
                {/* History */}
                {ussdHistory.map((hist, idx) => (
                  <p key={idx} className="text-emerald-500/40 text-[10px] border-b border-emerald-500/5 pb-1 mb-1">{hist}</p>
                ))}
                
                {/* Active body */}
                <p className="text-[#00FF55] tracking-tight">{ussdOutputText}</p>
              </div>

              {ussdStep === 99 && (
                <button
                  onClick={() => setUssdModalOpen(false)}
                  className="mt-6 w-full text-center bg-emerald-500 text-slate-950 py-2 rounded font-sans font-black text-xs hover:bg-emerald-400 transition cursor-pointer"
                >
                  Close Console
                </button>
              )}
            </div>

            {/* Input Form */}
            {ussdStep !== 99 && (
              <form onSubmit={handleUssdSubmit} className="bg-slate-900/60 p-3 border-t border-emerald-500/20 shrink-0 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Enter option..."
                  value={ussdInput}
                  onChange={(e) => setUssdInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-emerald-500/30 text-emerald-400 p-2 text-xs rounded outline-none focus:border-emerald-400 text-center font-mono font-bold"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-black text-xs px-4 py-2 rounded transition cursor-pointer"
                >
                  Send
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

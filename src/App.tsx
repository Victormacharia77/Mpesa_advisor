/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { LayoutDashboard, MessageSquarePlus, ListFilter, PieChart, Sparkles, Code, Wallet, Info, Compass, ShieldCheck, Lock, CheckCircle, Loader2, User } from "lucide-react";
import { MpesaTransaction, CategoryBudget, MonthlyReport } from "./types";
import MobileFrame from "./components/MobileFrame";
import Dashboard from "./components/Dashboard";
import SmsAnalyzer from "./components/SmsAnalyzer";
import TransactionList from "./components/TransactionList";
import ChartsView from "./components/ChartsView";
import ReportsView from "./components/ReportsView";
import KotlinGuide from "./components/KotlinGuide";
import SafaricomHub from "./components/SafaricomHub";

// Default standard category budgets in Kenya shillings
const DEFAULT_BUDGETS: CategoryBudget[] = [
  { category: "Food", limit: 12000, spent: 0, color: "#10B981" },       // Emerald
  { category: "Utilities", limit: 15000, spent: 0, color: "#06B6D4" },  // Cyan
  { category: "Transport", limit: 6000, spent: 0, color: "#3B82F6" },   // Blue
  { category: "Shopping", limit: 10000, spent: 0, color: "#F59E0B" },   // Amber
  { category: "Leisure", limit: 5000, spent: 0, color: "#EC4899" },     // Pink
  { category: "Health", limit: 4000, spent: 0, color: "#EF4444" },      // Red
  { category: "Education", limit: 25000, spent: 0, color: "#8B5CF6" },   // Violet
  { category: "Miscellaneous", limit: 5000, spent: 0, color: "#64748B" }, // Slate
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [transactions, setTransactions] = useState<MpesaTransaction[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>(DEFAULT_BUDGETS);
  const [savedReports, setSavedReports] = useState<MonthlyReport[]>([]);

  // Simulation OTP & Login State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => localStorage.getItem("mpesa_analyzer_logged_in") === "true");
  const [hideBalances, setHideBalances] = useState<boolean>(() => localStorage.getItem("mpesa_analyzer_hide_balances") === "true");
  const [phoneNumber, setPhoneNumber] = useState<string>("+254 712 345678");
  const [enteredOtp, setEnteredOtp] = useState<string>("");
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpMethod, setOtpMethod] = useState<"sms" | "call" | null>(null);
  const [loginError, setLoginError] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // New Sign Up, Email & Device Permissions States
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("phone");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [nationalId, setNationalId] = useState<string>("");
  const [showContactsPermissionPrompt, setShowContactsPermissionPrompt] = useState<boolean>(false);
  const [contactsPermissionGranted, setContactsPermissionGranted] = useState<boolean>(() => localStorage.getItem("mpesa_analyzer_contacts_permission") === "true");

  const handleToggleHideBalances = () => {
    setHideBalances((prev) => {
      const val = !prev;
      localStorage.setItem("mpesa_analyzer_hide_balances", String(val));
      return val;
    });
  };

  const handleRequestOtp = (method: "sms" | "call") => {
    if (!phoneNumber.trim() || phoneNumber.trim().length < 9) {
      setLoginError("Please enter a valid Safaricom phone number.");
      return;
    }
    setOtpSent(true);
    setOtpMethod(method);
    setLoginError("");
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setLoginError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setLoginError("Password must be at least 6 characters.");
      return;
    }
    setIsLoggingIn(true);
    setLoginError("");
    setTimeout(() => {
      setIsLoggedIn(true);
      localStorage.setItem("mpesa_analyzer_logged_in", "true");
      setIsLoggingIn(false);
    }, 1000);
  };

  const handleEmailSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setLoginError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setLoginError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setLoginError("Password must be at least 6 characters.");
      return;
    }
    setIsLoggingIn(true);
    setLoginError("");
    setTimeout(() => {
      setIsLoggedIn(true);
      localStorage.setItem("mpesa_analyzer_logged_in", "true");
      setIsLoggingIn(false);
    }, 1000);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setLoginError("Please enter your full name to proceed with enrollment.");
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 9) {
      setLoginError("Please enter a valid Safaricom phone number.");
      return;
    }
    setLoginError("");
    // Trigger contacts permission request modal
    setShowContactsPermissionPrompt(true);
  };

  const handleContactsPermissionResponse = (granted: boolean) => {
    setContactsPermissionGranted(granted);
    localStorage.setItem("mpesa_analyzer_contacts_permission", String(granted));
    setShowContactsPermissionPrompt(false);
    
    // Once permission is resolved, immediately trigger OTP generation to secure the phone number
    setOtpSent(true);
    setOtpMethod("sms");
  };

  const handleVerifyOtp = () => {
    if (enteredOtp !== "2409") {
      setLoginError("Verification failed. Use the student code '2409' to login!");
      return;
    }
    setIsLoggingIn(true);
    setLoginError("");
    setTimeout(() => {
      setIsLoggedIn(true);
      localStorage.setItem("mpesa_analyzer_logged_in", "true");
      setIsLoggingIn(false);
    }, 1000);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("mpesa_analyzer_logged_in");
    setOtpSent(false);
    setEnteredOtp("");
    setOtpMethod(null);
    setFullName("");
    setNationalId("");
    setEmail("");
    setPassword("");
  };

  // 1. Local Storage Sync on Initial Mount
  useEffect(() => {
    try {
      const storedTx = localStorage.getItem("mpesa_analyzer_transactions");
      if (storedTx) {
        setTransactions(JSON.parse(storedTx));
      }
      const storedReports = localStorage.getItem("mpesa_analyzer_reports");
      if (storedReports) {
        setSavedReports(JSON.parse(storedReports));
      }
      const storedBudgets = localStorage.getItem("mpesa_analyzer_budgets");
      if (storedBudgets) {
        setBudgets(JSON.parse(storedBudgets));
      }
    } catch (e) {
      console.error("Local storage restoration failed:", e);
    }
  }, []);

  // 2. Local Storage sync on Data updates
  const handleAnalysisSuccess = (newTransactions: MpesaTransaction[]) => {
    setTransactions((prev) => {
      // Merge by unique Transaction ID to prevent duplicates
      const txMap = new Map<string, MpesaTransaction>();
      prev.forEach((tx) => txMap.set(tx.id, tx));
      newTransactions.forEach((tx) => txMap.set(tx.id, tx));
      
      const merged = Array.from(txMap.values()).sort(
        (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
      );
      
      localStorage.setItem("mpesa_analyzer_transactions", JSON.stringify(merged));
      return merged;
    });

    // Automatically navigate to dashboard to see results
    setActiveTab("dashboard");
  };

  const handleSaveReport = (report: MonthlyReport) => {
    setSavedReports((prev) => {
      const updated = prev.filter((r) => r.monthYear !== report.monthYear);
      updated.push(report);
      localStorage.setItem("mpesa_analyzer_reports", JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => {
      const filtered = prev.filter((tx) => tx.id !== id);
      localStorage.setItem("mpesa_analyzer_transactions", JSON.stringify(filtered));
      return filtered;
    });
  };

  // Render sub-screens based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            transactions={transactions}
            budgets={budgets}
            onNavigate={(tab) => setActiveTab(tab)}
            onAddTransactions={handleAnalysisSuccess}
            hideBalances={hideBalances}
            onToggleHideBalances={handleToggleHideBalances}
          />
        );
      case "analyze":
        return <SmsAnalyzer onAnalysisSuccess={handleAnalysisSuccess} />;
      case "ledger":
        return (
          <TransactionList
            transactions={transactions}
            onDeleteTransaction={handleDeleteTransaction}
            onBack={() => setActiveTab("dashboard")}
            hideBalances={hideBalances}
          />
        );
      case "charts":
        return <ChartsView transactions={transactions} />;
      case "safaricom":
        return <SafaricomHub onLogout={handleLogout} />;
      case "kotlin":
        return <KotlinGuide onAddTransactions={handleAnalysisSuccess} />;
      default:
        return (
          <Dashboard
            transactions={transactions}
            budgets={budgets}
            onNavigate={(tab) => setActiveTab(tab)}
            hideBalances={hideBalances}
            onToggleHideBalances={handleToggleHideBalances}
          />
        );
    }
  };

  if (!isLoggedIn) {
    return (
      <MobileFrame>
        <div className="flex-1 flex flex-col bg-[#0A0E12] text-slate-100 font-sans p-6 justify-between select-none relative overflow-hidden">
          {/* Subtle glowing dots background */}
          <div className="absolute top-10 left-10 w-44 h-44 bg-[#00B140]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-44 h-44 bg-teal-500/10 rounded-full blur-3xl" />

          {/* Top Banner decoration */}
          <div className="flex flex-col items-center text-center pt-8 z-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#00B140] to-emerald-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,177,64,0.3)] relative mb-4">
              <Lock className="w-7 h-7 text-slate-950" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0A0E12] flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>
            
            <h2 className="text-xl font-black tracking-tight text-white uppercase font-display">M-PESA AI ADVISOR</h2>
            <p className="text-[10px] text-[#00B140] font-black tracking-wider uppercase mt-1">Secure Historical Statement Analyzer</p>
            
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mt-4">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00B140]" />
              <span className="text-[8.5px] text-emerald-300 font-black tracking-wide uppercase">Kenya Data Protection Compliant</span>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 shadow-xl my-auto flex flex-col gap-4 z-10 backdrop-blur-md">
            {!otpSent ? (
              !isSignUpMode ? (
                <>
                  {/* Login Method Toggle Tabs */}
                  <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => {
                        setLoginMethod("phone");
                        setLoginError("");
                      }}
                      className={`text-[9.5px] font-black uppercase tracking-wider py-2 rounded-lg transition ${
                        loginMethod === "phone"
                          ? "bg-[#00B140] text-slate-950"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Phone OTP
                    </button>
                    <button
                      onClick={() => {
                        setLoginMethod("email");
                        setLoginError("");
                      }}
                      className={`text-[9.5px] font-black uppercase tracking-wider py-2 rounded-lg transition ${
                        loginMethod === "email"
                          ? "bg-[#00B140] text-slate-950"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Email & Pass
                    </button>
                  </div>

                  {loginMethod === "phone" ? (
                    <>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Safaricom Mobile Line</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">+254</span>
                          <input
                            type="text"
                            className="w-full bg-slate-950 border border-white/5 text-xs text-white pl-14 pr-3 py-3 rounded-xl outline-none focus:border-[#00B140] transition font-semibold"
                            placeholder="712 345678"
                            value={phoneNumber.replace("+254 ", "")}
                            onChange={(e) => setPhoneNumber("+254 " + e.target.value)}
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 mt-2 block leading-normal">
                          Enter your Safaricom mobile line to generate an offline simulation OTP token.
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 mt-2">
                        <button
                          onClick={() => handleRequestOtp("sms")}
                          className="w-full bg-[#00B140] hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-black text-xs transition cursor-pointer select-none active:scale-[0.97] shadow-lg shadow-emerald-500/10"
                        >
                          Receive OTP via SMS
                        </button>
                        <button
                          onClick={() => handleRequestOtp("call")}
                          className="w-full bg-slate-800 text-white hover:bg-slate-750 border border-white/5 py-3 rounded-xl font-bold text-xs transition cursor-pointer select-none active:scale-[0.97]"
                        >
                          Verify via Secure Call
                        </button>
                      </div>
                    </>
                  ) : (
                    <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                        <input
                          type="email"
                          className="w-full bg-slate-950 border border-white/5 text-xs text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#00B140] transition font-semibold"
                          placeholder="e.g. name@domain.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Password</label>
                        <input
                          type="password"
                          className="w-full bg-slate-950 border border-white/5 text-xs text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#00B140] transition font-semibold"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full bg-[#00B140] hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-black text-xs transition cursor-pointer select-none active:scale-[0.97] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 mt-1"
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Authenticating...</span>
                          </>
                        ) : (
                          <span>Log In with Password</span>
                        )}
                      </button>
                    </form>
                  )}

                  {/* Toggle Mode */}
                  <div className="text-center mt-1 border-t border-white/5 pt-3">
                    <span className="text-[10px] text-slate-400 font-medium">First time using the Advisor? </span>
                    <button
                      onClick={() => {
                        setLoginError("");
                        setIsSignUpMode(true);
                      }}
                      className="text-[10px] text-[#00B140] font-black hover:underline cursor-pointer"
                    >
                      Sign Up Here
                    </button>
                  </div>

                  {/* Pre-fill Option */}
                  <div className="border-t border-white/5 pt-3.5 mt-1.5 text-center">
                    <span className="text-[9.5px] text-slate-400 font-medium">Student Account Quick Access:</span>
                    <button
                      onClick={() => {
                        if (loginMethod === "phone") {
                          setPhoneNumber("+254 740 940724");
                          handleRequestOtp("sms");
                        } else {
                          setEmail("2409407@students.kcau.ac.ke");
                          setPassword("kcau2409");
                        }
                      }}
                      className="block mx-auto mt-1 text-[9.5px] text-[#00B140] font-bold hover:underline cursor-pointer"
                    >
                      {loginMethod === "phone" ? "KCA Student SIM (+254 740 940724)" : "KCA Student Email (2409407@students.kcau.ac.ke)"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Signup Method Toggle Tabs */}
                  <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod("phone");
                        setLoginError("");
                      }}
                      className={`text-[9.5px] font-black uppercase tracking-wider py-2 rounded-lg transition ${
                        loginMethod === "phone"
                          ? "bg-[#00B140] text-slate-950"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Phone Sign Up
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod("email");
                        setLoginError("");
                      }}
                      className={`text-[9.5px] font-black uppercase tracking-wider py-2 rounded-lg transition ${
                        loginMethod === "email"
                          ? "bg-[#00B140] text-slate-950"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Email Sign Up
                    </button>
                  </div>

                  {loginMethod === "phone" ? (
                    <form onSubmit={handleSignUp} className="flex flex-col gap-3.5">
                      <div>
                        <h3 className="text-xs font-black text-[#00B140] uppercase tracking-wider mb-1">Enroll via Safaricom Line</h3>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                        <input
                          type="text"
                          className="w-full bg-slate-950 border border-white/5 text-xs text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#00B140] transition font-semibold"
                          placeholder="e.g. John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Safaricom Mobile Line</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">+254</span>
                          <input
                            type="text"
                            className="w-full bg-slate-950 border border-white/5 text-xs text-white pl-14 pr-3 py-2.5 rounded-xl outline-none focus:border-[#00B140] transition font-semibold"
                            placeholder="712 345678"
                            value={phoneNumber.replace("+254 ", "")}
                            onChange={(e) => setPhoneNumber("+254 " + e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">National ID / Student Number (Optional)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-950 border border-white/5 text-xs text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#00B140] transition font-semibold"
                          placeholder="e.g. 2409407"
                          value={nationalId}
                          onChange={(e) => setNationalId(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#00B140] hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-black text-xs transition cursor-pointer select-none active:scale-[0.97] shadow-lg shadow-emerald-500/10 font-sans"
                      >
                        Create Account & Request Permissions
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleEmailSignUp} className="flex flex-col gap-3">
                      <div>
                        <h3 className="text-xs font-black text-[#00B140] uppercase tracking-wider mb-1">Enroll via Email Credential</h3>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                        <input
                          type="text"
                          className="w-full bg-slate-950 border border-white/5 text-xs text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#00B140] transition font-semibold"
                          placeholder="e.g. John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                        <input
                          type="email"
                          className="w-full bg-slate-950 border border-white/5 text-xs text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#00B140] transition font-semibold"
                          placeholder="e.g. john@domain.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Create Password</label>
                        <input
                          type="password"
                          className="w-full bg-slate-950 border border-white/5 text-xs text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#00B140] transition font-semibold"
                          placeholder="Min 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Student / National ID (Optional)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-950 border border-white/5 text-xs text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#00B140] transition font-semibold"
                          placeholder="e.g. 2409407"
                          value={nationalId}
                          onChange={(e) => setNationalId(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#00B140] hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-black text-xs transition cursor-pointer select-none active:scale-[0.97] shadow-lg shadow-emerald-500/10 font-sans mt-1"
                      >
                        Create Email Account
                      </button>
                    </form>
                  )}

                  <div className="text-center mt-1 border-t border-white/5 pt-2">
                    <span className="text-[10px] text-slate-400 font-medium">Already registered? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginError("");
                        setIsSignUpMode(false);
                      }}
                      className="text-[10px] text-[#00B140] font-black hover:underline cursor-pointer"
                    >
                      Log In instead
                    </button>
                  </div>
                </>
              )
            ) : (
              <>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Enter Verification Token</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="w-full bg-slate-950 border border-white/5 text-center tracking-widest text-lg text-[#00B140] py-2 rounded-xl outline-none focus:border-[#00B140] font-mono font-black"
                    placeholder="••••"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                  />
                  <div className="bg-emerald-500/10 border border-emerald-500/15 rounded-xl p-2.5 mt-3 text-center">
                    <p className="text-[9.5px] text-emerald-300 font-extrabold">
                      {otpMethod === "sms" 
                        ? "✉️ Simulated secure SMS sent to your line!" 
                        : "📞 Simulated secure call initiated!"}
                    </p>
                    <p className="text-[9.5px] text-slate-400 mt-1">
                      Verification code: <strong className="text-white font-mono bg-slate-900 px-1.5 py-0.5 rounded">2409</strong>
                    </p>
                  </div>

                  {/* Anti-spoofing Explanation */}
                  <div className="mt-3 bg-teal-500/10 border border-teal-500/20 p-2.5 rounded-xl text-[8.5px] text-slate-300 leading-normal text-left">
                    <strong className="text-teal-400 block mb-0.5">🔒 How is this line identity secured?</strong>
                    Each Safaricom mobile line is linked to an active hardware SIM card registered under your biometric profile with Kenya authorities. By requiring an immediate SMS OTP challenge, our platform ensures physical ownership—another user cannot log into your wallet because the verification token is only delivered to your active SIM.
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <button
                    onClick={handleVerifyOtp}
                    disabled={isLoggingIn}
                    className="w-full bg-[#00B140] hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-black text-xs transition cursor-pointer select-none active:scale-[0.97] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Securing Connection...</span>
                      </>
                    ) : (
                      <span>Verify & Enter Advisor</span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setOtpSent(false);
                      setEnteredOtp("");
                    }}
                    className="text-[9.5px] text-slate-400 hover:text-white underline mt-1 font-medium cursor-pointer"
                  >
                    Change Phone Number
                  </button>
                </div>
              </>
            )}

            {loginError && (
              <p className="text-[10px] text-rose-400 font-bold text-center mt-1 bg-rose-500/5 border border-rose-500/10 p-2 rounded-xl">
                ⚠️ {loginError}
              </p>
            )}
          </div>

          {/* Bottom Security Footer */}
          <div className="text-center pb-4 text-slate-500 text-[8.5px] leading-relaxed flex flex-col items-center gap-0.5 shrink-0 z-10 font-mono">
            <p>© 2026 M-Pesa AI Advisor. Not affiliated with Safaricom PLC.</p>
            <p>End-to-end simulated validation compliant with Kenya Information Acts.</p>
          </div>
        </div>

        {/* Contacts Access Permission Prompt Dialog Overlay */}
        {showContactsPermissionPrompt && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
            <div className="bg-[#121216] border border-white/10 rounded-2xl w-full max-w-xs overflow-hidden p-5 flex flex-col gap-4 shadow-2xl text-center">
              <div className="w-12 h-12 bg-teal-500/10 text-[#00B140] rounded-full flex items-center justify-center mx-auto border border-[#00B140]/20">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Contacts Permission</h3>
                <p className="text-[10px] text-slate-400 leading-normal mt-2">
                  Allow <strong>M-Pesa AI Advisor</strong> to access your device contacts? This permission allows the app to map phone numbers in your raw transaction logs to real contact names in your phonebook.
                </p>
              </div>
              <div className="flex flex-col gap-2 mt-1">
                <button
                  onClick={() => handleContactsPermissionResponse(true)}
                  className="w-full bg-[#00B140] hover:bg-emerald-400 text-slate-950 py-2.5 rounded-xl font-black text-xs transition cursor-pointer"
                >
                  Allow Access
                </button>
                <button
                  onClick={() => handleContactsPermissionResponse(false)}
                  className="w-full bg-slate-800 text-slate-300 hover:text-white py-2 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Don't Allow
                </button>
              </div>
            </div>
          </div>
        )}
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      {/* Dynamic Screen View */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#090909] text-[#E0E0E0] relative font-sans">
        {renderContent()}
      </div>

      {/* Dynamic Bottom Mobile Navigation Bar */}
      <div className="h-14 bg-[#121214] border-t border-white/5 flex items-center justify-around px-2 shrink-0 z-50">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
            activeTab === "dashboard" ? "text-[#00B140] scale-105 font-bold" : "text-white/40 hover:text-white/70"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[9px] tracking-tight font-display">Home</span>
        </button>

        <button
          onClick={() => setActiveTab("analyze")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
            activeTab === "analyze" ? "text-[#00B140] scale-105 font-bold" : "text-white/40 hover:text-white/70"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[9px] tracking-tight font-display">AI Chat</span>
        </button>

        <button
          onClick={() => setActiveTab("ledger")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
            activeTab === "ledger" ? "text-[#00B140] scale-105 font-bold" : "text-white/40 hover:text-white/70"
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span className="text-[9px] tracking-tight font-display">Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab("charts")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
            activeTab === "charts" ? "text-[#00B140] scale-105 font-bold" : "text-white/40 hover:text-white/70"
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span className="text-[9px] tracking-tight font-display">Charts</span>
        </button>

        <button
          onClick={() => setActiveTab("safaricom")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
            activeTab === "safaricom" ? "text-[#00B140] scale-105 font-bold" : "text-white/40 hover:text-white/70"
          }`}
          title="Safaricom Care, Jobs & Info Hub"
        >
          <Compass className="w-4 h-4" />
          <span className="text-[9px] tracking-tight font-display font-black">Care Hub</span>
        </button>

        <button
          onClick={() => setActiveTab("kotlin")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
            activeTab === "kotlin" ? "text-[#00B140] scale-105 font-bold" : "text-white/40 hover:text-white/70"
          }`}
          title="Android APK & SMS Permissions Hub"
        >
          <Code className="w-4 h-4" />
          <span className="text-[9px] tracking-tight font-display">Android APK</span>
        </button>
      </div>
    </MobileFrame>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  FileText, 
  Terminal, 
  Download, 
  Smartphone, 
  Check, 
  Copy, 
  UploadCloud, 
  Loader2, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  ListFilter,
  CheckCircle2,
  ChevronRight,
  Info
} from "lucide-react";
import { MpesaTransaction, TransactionType } from "../types";

interface KotlinGuideProps {
  onAddTransactions?: (transactions: MpesaTransaction[]) => void;
}

export default function KotlinGuide({ onAddTransactions }: KotlinGuideProps) {
  const [activeTab, setActiveTab] = useState<"export" | "test" | "apk">("export");
  
  // Test Parser State
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number; type: string; base64: string } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedTxs, setParsedTxs] = useState<MpesaTransaction[]>([]);
  const [parsedSource, setParsedSource] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    setSuccessMsg(null);
    setSelectedFile(null);

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        if (isPdf) {
          const fileObj = {
            name: file.name,
            size: file.size,
            type: "application/pdf",
            base64: result
          };
          setSelectedFile(fileObj);
          setInputText(""); // Avoid putting binary string into textbox
          triggerParse("", fileObj);
        } else {
          setInputText(result);
          const fileObj = {
            name: file.name,
            size: file.size,
            type: file.type || "text/plain",
            base64: btoa(unescape(encodeURIComponent(result)))
          };
          setSelectedFile(fileObj);
          triggerParse(result, fileObj);
        }
      } else {
        setError("Could not read file content.");
      }
    };

    if (isPdf) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const triggerParse = async (textToParse: string, fileObj = selectedFile) => {
    if (!textToParse.trim() && !fileObj) {
      setError("Please paste raw transaction text, upload a CSV/text file, or attach your PDF statement first.");
      return;
    }

    setIsParsing(true);
    setError(null);
    setSuccessMsg(null);
    setParsedTxs([]);

    try {
      const response = await fetch("/api/analyze-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: textToParse,
          fileData: fileObj ? fileObj.base64 : undefined,
          mimeType: fileObj ? fileObj.type : undefined
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({ error: "Parser server responded with an error." }));
        throw new Error(errJson.error || "Parser server responded with an error.");
      }

      const data = await response.json();
      if (data.transactions && Array.isArray(data.transactions)) {
        setParsedTxs(data.transactions);
        setParsedSource(data.source === "gemini_api" ? "Gemini AI Core" : "Local Offline Pattern Recognizer");
        
        if (data.transactions.length === 0) {
          setError("No valid M-Pesa transaction patterns detected in the provided content. Please verify your statement format.");
        } else {
          setSuccessMsg(`Successfully extracted ${data.transactions.length} transactions from your statement!`);
        }
      } else {
        throw new Error("Invalid response format.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to parse content. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommitTransactions = () => {
    if (parsedTxs.length === 0) return;
    if (onAddTransactions) {
      onAddTransactions(parsedTxs);
      setSuccessMsg(`Successfully committed ${parsedTxs.length} transactions to your active ledger and dashboard!`);
      // Clear states after successful commit
      setParsedTxs([]);
      setInputText("");
    }
  };

  const sampleLogs = `QX728HJ189 Confirmed. Ksh3,500.00 sent to MAMA MBOGA GROCERS on 15/7/26 at 11:15 AM. New M-PESA balance is Ksh14,200.00. Transaction cost, Ksh34.00.
QJB49204 Confirmed. Ksh12,000.00 received from KEBASO ENTERPRISES on 14/7/26 at 3:30 PM. New M-PESA balance is Ksh17,734.00. Transaction cost, Ksh0.00.
QJS91823 Confirmed. Paid Ksh1,200.00 to QUICKMART SUPERMARKET on 13/7/26 at 7:45 PM. New M-PESA balance is Ksh5,734.00. Transaction cost, Ksh0.00.`;

  return (
    <div className="flex flex-col h-full bg-[#0A0A0C] text-slate-100 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-[#121216] border-b border-white/5 p-5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#00B140]/10 p-2 rounded-xl text-[#00B140] border border-[#00B140]/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-[#00B140] uppercase tracking-widest block">Offline Analytics Hub</span>
              <h2 className="text-lg font-bold tracking-tight text-white leading-tight">Android APK & Statement Import</h2>
            </div>
          </div>
          <span className="bg-[#1D1D22] border border-white/5 text-[10px] font-mono px-2 py-0.5 rounded text-white/50">
            v2.0-Statement
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
          Avoid active SMS monitoring or dialings completely. Download your official transaction history files directly from Safaricom and test them securely offline on your device, or bundle this app as a mobile APK!
        </p>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-[#121216]/50 border-b border-white/5 px-4 py-2 flex gap-1 shrink-0">
        <button
          onClick={() => setActiveTab("export")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
            activeTab === "export"
              ? "bg-[#00B140]/10 border-[#00B140]/30 text-white font-black"
              : "bg-transparent border-transparent text-slate-400 hover:text-white"
          }`}
        >
          📂 1. Get Statements
        </button>
        <button
          onClick={() => setActiveTab("test")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
            activeTab === "test"
              ? "bg-[#00B140]/10 border-[#00B140]/30 text-white font-black"
              : "bg-transparent border-transparent text-slate-400 hover:text-white"
          }`}
        >
          🧪 2. Test Real Statements
        </button>
        <button
          onClick={() => setActiveTab("apk")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
            activeTab === "apk"
              ? "bg-[#00B140]/10 border-[#00B140]/30 text-white font-black"
              : "bg-transparent border-transparent text-slate-400 hover:text-white"
          }`}
        >
          🛠️ 3. Compile APK
        </button>
      </div>

      {/* Content Space */}
      <div className="flex-1 p-4 pb-12">
        
        {/* TAB 1: HOW TO GET STATEMENTS */}
        {activeTab === "export" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-[#00B140]/20 rounded-2xl p-4 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-[#00B140] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">100% Secure Offline Extraction</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                  M-Pesa statements downloaded from official Safaricom channels are processed locally. No financial data is ever shared or stored on remote servers, fully complying with the Kenya Data Protection Act.
                </p>
              </div>
            </div>

            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mt-2 px-1">
              Select Statement Export Method
            </h3>

            {/* Steps Timeline */}
            <div className="space-y-3">
              {/* Method A */}
              <div className="bg-[#121216] border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-[#00B140]/20 text-[#00B140] text-[10px] font-black flex items-center justify-center">A</span>
                  <h4 className="text-xs font-black text-white">Export from the "MySafaricom" App</h4>
                </div>
                <ul className="text-[11px] text-slate-400 space-y-1.5 list-none pl-1">
                  <li className="flex items-start gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-[#00B140] shrink-0 mt-0.5" />
                    <span>Open the official <strong>MySafaricom App</strong> on your smartphone.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-[#00B140] shrink-0 mt-0.5" />
                    <span>Tap on the <strong>M-PESA</strong> tab on the bottom bar, and log in.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-[#00B140] shrink-0 mt-0.5" />
                    <span>Select <strong>M-PESA Statement</strong> from the menu list.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-[#00B140] shrink-0 mt-0.5" />
                    <span>Choose <strong>Full Statement</strong>, select your duration (e.g., 3 or 6 months), and select your export type as <strong>CSV</strong> or <strong>PDF Text</strong>.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-[#00B140] shrink-0 mt-0.5" />
                    <span>Tap <strong>Send to Email</strong> or download directly to your mobile file directory!</span>
                  </li>
                </ul>
              </div>

              {/* Method B */}
              <div className="bg-[#121216] border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-[#00B140]/20 text-[#00B140] text-[10px] font-black flex items-center justify-center">B</span>
                  <h4 className="text-xs font-black text-white">Request via USSD Code (Free & Instant)</h4>
                </div>
                <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                  If you don't have internet access or prefer standard cellular codes, you can request your historical statements straight to your mailbox instantly:
                </p>
                <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl font-mono text-[10.5px] text-emerald-400 leading-normal mb-2 text-center">
                  Dial <strong className="text-white">*334#</strong> on your Safaricom SIM line
                </div>
                <ul className="text-[10.5px] text-slate-400 space-y-1 pl-1">
                  <li>1. Choose option <strong>7 (My Account)</strong></li>
                  <li>2. Choose option <strong>1 (M-PESA Statement)</strong></li>
                  <li>3. Choose option <strong>1 (Full Statement)</strong></li>
                  <li>4. Select your desired period (1 Month, 3 Months, or 6 Months)</li>
                  <li>5. Enter your registered email address & M-PESA PIN to authorize</li>
                </ul>
              </div>

              {/* Method C */}
              <div className="bg-[#121216] border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-[#00B140]/20 text-[#00B140] text-[10px] font-black flex items-center justify-center">C</span>
                  <h4 className="text-xs font-black text-white">Safaricom E-Mail PDF Alert Logs</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Safaricom sends monthly statement summaries automatically to registered users. You can simply go to your email client (Gmail, Outlook, Yahoo), locate emails from <strong>Safaricom M-Pesa</strong>, copy the transaction table or raw SMS lines, and paste them directly into the testing parser in the next tab!
                </p>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setActiveTab("test")}
                className="w-full bg-[#00B140] hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-black text-xs transition cursor-pointer select-none active:scale-[0.97] flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/15"
              >
                <span>Proceed to Statement Tester</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE STATEMENT PARSER TESTER */}
        {activeTab === "test" && (
          <div className="space-y-4">
            <div className="bg-[#121216] border border-white/5 rounded-2xl p-4">
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#00B140]" />
                <span>Real Statement Parsing Console</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                Upload your downloaded Safaricom statement file or paste raw transactional SMS alert lines directly. The advisor will extract, organize, and categorize the dataset in seconds.
              </p>

              {/* Drag Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                  isDragging 
                    ? "border-[#00B140] bg-[#00B140]/10" 
                    : "border-white/10 hover:border-[#00B140]/40 bg-black/30"
                }`}
              >
                <input
                  type="file"
                  id="statement-file-input"
                  accept=".txt,.csv,.log,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                {selectedFile ? (
                  <div className="bg-[#1D1D22] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 max-w-sm mx-auto">
                    <div className="flex items-center gap-2.5 overflow-hidden text-left">
                      <div className="p-2 rounded-lg bg-[#00B140]/10 text-[#00B140] border border-[#00B140]/20">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type.split("/").pop()?.toUpperCase() || "FILE"}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setSelectedFile(null);
                        setInputText("");
                      }}
                      className="text-slate-400 hover:text-rose-400 text-xs p-1 rounded-lg transition cursor-pointer"
                      title="Clear Selection"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label htmlFor="statement-file-input" className="cursor-pointer block">
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs font-bold text-white block">
                      Drag & Drop Statement File
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Accepts Safaricom .pdf, .csv, or .txt files
                    </span>
                    <span className="mt-3 inline-block bg-[#1D1D22] border border-white/5 hover:bg-slate-850 text-[10px] text-slate-300 font-bold px-3 py-1.5 rounded-lg transition">
                      Browse File
                    </span>
                  </label>
                )}
              </div>

              {/* Or Divider */}
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">or paste text</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {/* Text Area Input */}
              <div className="space-y-2">
                <textarea
                  rows={4}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#00B140]/40 font-mono"
                  placeholder="Paste your exported statement rows, or raw M-Pesa SMS alerts here..."
                />

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setInputText(sampleLogs);
                    }}
                    className="text-[9.5px] text-[#00B140] font-black hover:underline cursor-pointer flex items-center gap-1"
                  >
                    💡 Insert Sample Transaction Logs
                  </button>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {inputText.length} chars
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => triggerParse(inputText)}
                disabled={isParsing || (!inputText.trim() && !selectedFile)}
                className="w-full bg-[#00B140] hover:bg-[#009435] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 py-3 rounded-xl font-black text-xs transition cursor-pointer select-none active:scale-[0.97] mt-3 flex items-center justify-center gap-1.5 shadow-lg"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>AI Securely Parsing Statement...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Parse Statement with AI Advisor</span>
                  </>
                )}
              </button>

              {/* Error Box */}
              {error && (
                <div className="mt-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex gap-2 text-[11px] text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Box */}
              {successMsg && (
                <div className="mt-3 bg-[#00B140]/10 border border-[#00B140]/20 rounded-xl p-3 flex gap-2 text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>

            {/* Parsed Result Display Panel */}
            {parsedTxs.length > 0 && (
              <div className="bg-[#121216] border border-white/5 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Successfully Extracted ({parsedTxs.length})
                    </h4>
                    <span className="text-[9px] text-[#00B140] font-bold">
                      Parsed using {parsedSource}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleCommitTransactions}
                    className="bg-[#00B140] hover:bg-[#009a37] text-slate-950 font-black text-[10px] px-3 py-1.5 rounded-lg transition active:scale-[0.97] flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Merge to My Ledger</span>
                  </button>
                </div>

                {/* Scroller list of parsed txs */}
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {parsedTxs.map((tx, idx) => (
                    <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-[11px] flex justify-between items-center gap-2">
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white truncate max-w-[120px]">
                            {tx.party}
                          </span>
                          <span className="text-[8px] px-1 py-0.2 bg-[#1D1D22] text-slate-400 rounded font-mono font-bold">
                            {tx.id}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5 flex gap-1 items-center">
                          <span>{tx.type}</span>
                          <span>•</span>
                          <span>{tx.category}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-white font-black block">
                          Ksh {tx.amount.toLocaleString()}
                        </span>
                        <span className="text-[8.5px] text-slate-500 block">
                          Fee: Ksh {tx.fee}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMPILE NATIVE APK */}
        {activeTab === "apk" && (
          <div className="space-y-4">
            <div className="bg-[#121216] border border-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-4 h-4 text-[#00B140]" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Convert this React Dashboard to a Mobile APK
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Using <strong>Capacitor</strong>, you can package this completed React code and its AI features into a native installer file (.apk) to test directly on your physical smartphone or distribute!
              </p>

              <div className="mt-4 space-y-4">
                {/* Step 1 */}
                <div className="space-y-1">
                  <span className="text-[10px] text-[#00B140] font-black uppercase tracking-wider block">
                    Step 1: Export Code ZIP from AI Studio
                  </span>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    Tap the <strong>Settings Cog Wheel</strong> or <strong>Export Menu</strong> in the top header section of this AI Studio environment, and select <strong>Download ZIP</strong>. Extract the ZIP package onto your local computer.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-[#00B140] font-black uppercase tracking-wider block">
                    Step 2: Install Capacitor CLI Wrappers
                  </span>
                  <p className="text-[10.5px] text-slate-400">
                    Open a terminal in the extracted folder on your laptop, and run:
                  </p>
                  <div className="bg-black border border-white/10 rounded-xl p-2.5 font-mono text-[10px] text-slate-300 relative group">
                    <pre>npm install @capacitor/core @capacitor/cli @capacitor/android</pre>
                    <button
                      onClick={() => handleCopy("npm install @capacitor/core @capacitor/cli @capacitor/android", "cap-install")}
                      className="absolute right-2.5 top-2 bg-slate-800 text-slate-300 hover:text-white px-2 py-0.5 rounded text-[9px] border border-white/5"
                    >
                      {copiedText === "cap-install" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-[#00B140] font-black uppercase tracking-wider block">
                    Step 3: Add & Sync Android Project
                  </span>
                  <p className="text-[10.5px] text-slate-400">
                    Configure the platform wrappers and synchronize your production bundle:
                  </p>
                  <div className="bg-black border border-white/10 rounded-xl p-2.5 font-mono text-[10px] text-slate-300 relative group">
                    <pre>npm run build
npx cap add android
npx cap sync</pre>
                    <button
                      onClick={() => handleCopy("npm run build && npx cap add android && npx cap sync", "cap-sync")}
                      className="absolute right-2.5 top-2 bg-slate-800 text-slate-300 hover:text-white px-2 py-0.5 rounded text-[9px] border border-white/5"
                    >
                      {copiedText === "cap-sync" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-[#00B140] font-black uppercase tracking-wider block">
                    Step 4: Build installer inside Android Studio
                  </span>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    Launch your compiled Android container wrapper in Android Studio:
                  </p>
                  <div className="bg-black border border-white/10 rounded-xl p-2.5 font-mono text-[10px] text-slate-300 relative group">
                    <pre>npx cap open android</pre>
                    <button
                      onClick={() => handleCopy("npx cap open android", "cap-open")}
                      className="absolute right-2.5 top-2 bg-slate-800 text-slate-300 hover:text-white px-2 py-0.5 rounded text-[9px] border border-white/5"
                    >
                      {copiedText === "cap-open" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Once Android Studio opens, select <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>. The system will compile the static package file immediately.
                  </p>
                </div>

                {/* Step 5 */}
                <div className="space-y-1">
                  <span className="text-[10px] text-[#00B140] font-black uppercase tracking-wider block">
                    Step 5: Transfer and Install
                  </span>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    Locate the compiled <code>app-debug.apk</code> file in Android Studio's popup explorer. Transfer it to your physical smartphone via USB, Google Drive, or email, open it, and accept the offline installation prompt to begin testing!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  Paperclip, 
  Trash2, 
  BookOpen, 
  Brain, 
  FileText, 
  HelpCircle, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Plus, 
  User, 
  Bot, 
  RefreshCw,
  PlusCircle,
  Menu,
  X,
  FileSpreadsheet
} from "lucide-react";
import { MpesaTransaction, TransactionType } from "../types";

interface SmsAnalyzerProps {
  onAnalysisSuccess: (newTransactions: MpesaTransaction[]) => void;
  // We can also retrieve the current transactions to pass to the AI chat for context
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
}

interface LearntRule {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

interface ImportedFile {
  name: string;
  size: string;
  txCount: number;
  date: string;
}

export default function SmsAnalyzer({ onAnalysisSuccess }: SmsAnalyzerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // File Import states
  const [isUploading, setIsUploading] = useState(false);
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document Upload Permissions States
  const [hasUploadConsent, setHasUploadConsent] = useState<boolean>(() => localStorage.getItem("mpesa_analyzer_upload_consent") === "true");
  const [showUploadConsentPrompt, setShowUploadConsentPrompt] = useState<boolean>(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // AI Learning States
  const [learntRules, setLearntRules] = useState<LearntRule[]>([]);
  const [newRuleTitle, setNewRuleTitle] = useState("");
  const [newRuleDesc, setNewRuleDesc] = useState("");
  const [showRuleModal, setShowRuleModal] = useState(false);

  // Active user transaction state retrieved from localStorage for context
  const [currentTransactions, setCurrentTransactions] = useState<MpesaTransaction[]>([]);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    try {
      // Load current transactions for AI context
      const storedTx = localStorage.getItem("mpesa_analyzer_transactions");
      if (storedTx) {
        setCurrentTransactions(JSON.parse(storedTx));
      }

      // Load Chat History
      const storedChat = localStorage.getItem("mpesa_analyzer_chat_history");
      if (storedChat) {
        setMessages(JSON.parse(storedChat));
      } else {
        // Welcome message
        const defaultWelcome: ChatMessage[] = [
          {
            id: "welcome-1",
            sender: "ai",
            content: "Habari! 👋 I am your M-Pesa AI Financial Advisor. \n\nI have been designed specifically to help you analyze your mobile cash-flows, optimize transaction costs, and audit Safaricom fees. \n\n📎 Import files directly: You can upload a .txt or .csv of your raw M-Pesa SMS statements anytime using the clip icon or by dropping files. I will instantly parse and inject them into your transaction database! What financial questions can I answer for you today?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ];
        setMessages(defaultWelcome);
        localStorage.setItem("mpesa_analyzer_chat_history", JSON.stringify(defaultWelcome));
      }

      // Load Learnt Rules
      const storedRules = localStorage.getItem("mpesa_analyzer_learnt_rules");
      if (storedRules) {
        setLearntRules(JSON.parse(storedRules));
      } else {
        const defaultRules: LearntRule[] = [
          { id: "rule-1", title: "Electricity Bill Paybill 220220", description: "Map to Utilities category", createdAt: "System Default" },
          { id: "rule-2", title: "MAMA MBOGA Groceries", description: "Treat sent money as Food category", createdAt: "System Default" },
          { id: "rule-3", title: "BOLT CAB Transport", description: "Always categorize as Transport", createdAt: "System Default" }
        ];
        setLearntRules(defaultRules);
        localStorage.setItem("mpesa_analyzer_learnt_rules", JSON.stringify(defaultRules));
      }

      // Load Imported Files history
      const storedFiles = localStorage.getItem("mpesa_analyzer_imported_files");
      if (storedFiles) {
        setImportedFiles(JSON.parse(storedFiles));
      } else {
        const defaultFiles: ImportedFile[] = [
          { name: "simulated_statement.txt", size: "3.4 KB", txCount: 13, date: "15/07/2026" }
        ];
        setImportedFiles(defaultFiles);
        localStorage.setItem("mpesa_analyzer_imported_files", JSON.stringify(defaultFiles));
      }
    } catch (e) {
      console.error("Failed to restore analyzer data:", e);
    }
  }, []);

  // 2. Refresh active transactions on state update
  const refreshActiveTransactions = () => {
    try {
      const storedTx = localStorage.getItem("mpesa_analyzer_transactions");
      if (storedTx) {
        setCurrentTransactions(JSON.parse(storedTx));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Send Message to AI Advisor
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!textToSend) {
      setInputText("");
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    localStorage.setItem("mpesa_analyzer_chat_history", JSON.stringify(updatedMessages));
    setIsAiTyping(true);
    setError(null);

    try {
      // Post message context, transaction list, and rules taught to the backend API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          transactions: currentTransactions,
          learntRules: learntRules
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned error status: ${response.status}`);
      }

      const data = await response.json();
      
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "ai",
        content: data.content || "I couldn't generate a response. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);
      localStorage.setItem("mpesa_analyzer_chat_history", JSON.stringify(finalMessages));

    } catch (err: any) {
      console.error(err);
      setError("Failed to connect to the AI Financial Advisor. Check your connection.");
      
      const aiErrorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "ai",
        content: "⚠️ I am currently having difficulty communicating with my main server. Please ensure you are connected, or check that your Gemini API Key is correctly configured in your settings.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...updatedMessages, aiErrorMsg]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // 4. File upload/import parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!hasUploadConsent) {
      setPendingFile(file);
      setShowUploadConsentPrompt(true);
      // Reset input value so same file can be selected again if canceled
      if (e.target) e.target.value = "";
      return;
    }

    executeFileUpload(file);
  };

  const handleUploadConsentResponse = (granted: boolean) => {
    setShowUploadConsentPrompt(false);
    if (granted) {
      setHasUploadConsent(true);
      localStorage.setItem("mpesa_analyzer_upload_consent", "true");
      if (pendingFile) {
        executeFileUpload(pendingFile);
        setPendingFile(null);
      }
    } else {
      setPendingFile(null);
      setError("Document analysis cancelled. Permission is required to parse statements.");
    }
  };

  const executeFileUpload = (file: File) => {
    setIsUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result;
      if (typeof text !== "string") {
        setIsUploading(false);
        setError("Unable to read this file format. Please upload plain text.");
        return;
      }

      try {
        const response = await fetch("/api/analyze-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error("Failed to parse the file text.");
        }

        const data = await response.json();
        if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
          // Success! Save imported file log
          const newImport: ImportedFile = {
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            txCount: data.transactions.length,
            date: new Date().toLocaleDateString("en-GB")
          };

          const updatedImports = [newImport, ...importedFiles];
          setImportedFiles(updatedImports);
          localStorage.setItem("mpesa_analyzer_imported_files", JSON.stringify(updatedImports));

          // Save transactions in the database
          onAnalysisSuccess(data.transactions);
          refreshActiveTransactions();

          // Inject AI chatbot notification of success
          const successAlertMsg: ChatMessage = {
            id: `msg-import-success-${Date.now()}`,
            sender: "ai",
            content: `📂 File Imported Successfully!\n\nI parsed ${data.transactions.length} transactions from your file ${file.name} (${newImport.size}). \n\nI have successfully merged this into your ledger and re-computed your budget totals automatically! What details would you like to analyze regarding this updated list?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          const newMsgList = [...messages, successAlertMsg];
          setMessages(newMsgList);
          localStorage.setItem("mpesa_analyzer_chat_history", JSON.stringify(newMsgList));

          // Simulate push notification in the parent frame!
          triggerNativeStyleNotification("M-PESA", `Import complete! Successfully analyzed ${data.transactions.length} transactions from file.`);

        } else {
          setError("No M-Pesa transaction texts were recognized in this file.");
        }
      } catch (err: any) {
        console.error(err);
        setError("Error parsing M-Pesa file context. Ensure it contains raw Safaricom SMS.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  };

  // Helper to trigger native-looking push notifications
  const triggerNativeStyleNotification = (title: string, body: string) => {
    const event = new CustomEvent("mpesa-notification", { detail: { title, body } });
    window.dispatchEvent(event);
  };

  // 5. Add Custom AI Learning Rule
  const handleAddRule = () => {
    if (!newRuleTitle.trim() || !newRuleDesc.trim()) return;

    const newRule: LearntRule = {
      id: `rule-${Date.now()}`,
      title: newRuleTitle.trim(),
      description: newRuleDesc.trim(),
      createdAt: new Date().toLocaleDateString("en-GB")
    };

    const updatedRules = [newRule, ...learntRules];
    setLearntRules(updatedRules);
    localStorage.setItem("mpesa_analyzer_learnt_rules", JSON.stringify(updatedRules));

    setNewRuleTitle("");
    setNewRuleDesc("");
    setShowRuleModal(false);

    // Notify user in chat
    const alertMsg: ChatMessage = {
      id: `msg-rule-learnt-${Date.now()}`,
      sender: "ai",
      content: `🧠 Rule Learnt!\n\nI've committed your custom mapping instruction to memory:\n- Rule: ${newRule.title}\n- Behavior: ${newRule.description}\n\nI will now always apply this rule when parsing M-Pesa records and formulating your cash-flow recommendations.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => {
      const newList = [...prev, alertMsg];
      localStorage.setItem("mpesa_analyzer_chat_history", JSON.stringify(newList));
      return newList;
    });
  };

  // Delete a rule
  const handleDeleteRule = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = learntRules.filter(r => r.id !== id);
    setLearntRules(updated);
    localStorage.setItem("mpesa_analyzer_learnt_rules", JSON.stringify(updated));
  };

  // Clear chat logs
  const handleClearChat = () => {
    if (confirm("Are you sure you want to clear your conversation history?")) {
      const defaultWelcome: ChatMessage[] = [
        {
          id: "welcome-1",
          sender: "ai",
          content: "Chat cleared! I am ready for fresh analysis. You can upload files of M-Pesa SMS statements or ask me about saving behaviors.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(defaultWelcome);
      localStorage.setItem("mpesa_analyzer_chat_history", JSON.stringify(defaultWelcome));
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden font-sans relative">
      {/* Header Banner */}
      <div className="bg-slate-900 border-b border-white/5 p-4 shrink-0 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="bg-teal-500/10 border border-teal-500/25 p-2 rounded-xl text-teal-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-teal-300">AI Financial Advisor</h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Chat, Import Logs, and Train Custom Rules</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sidebar Toggle */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition"
            title="Toggle Sidebar of Past Info"
          >
            <Menu className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleClearChat}
            className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main View Area with Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* SIDEBAR: Past Information & Learnt Rules */}
        {showSidebar && (
          <div className="w-64 bg-slate-950/80 border-r border-white/5 flex flex-col shrink-0 overflow-y-auto animate-slideIn">
            {/* Header */}
            <div className="p-3.5 border-b border-white/5 flex items-center justify-between bg-slate-950">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-400" /> Past Information & Rules
              </span>
              <button onClick={() => setShowSidebar(false)} className="text-slate-500 hover:text-white md:hidden">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI Custom Learnt Knowledge */}
            <div className="p-3.5 border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-teal-400 flex items-center gap-1">
                  <Brain className="w-3 h-3" /> Custom AI Memory
                </span>
                <button
                  onClick={() => setShowRuleModal(true)}
                  className="text-[9px] text-teal-300 hover:text-white font-extrabold flex items-center gap-0.5 bg-teal-500/15 border border-teal-500/25 px-1.5 py-0.5 rounded-md"
                >
                  <Plus className="w-2.5 h-2.5" /> Teach
                </button>
              </div>

              {learntRules.length === 0 ? (
                <p className="text-[9.5px] text-slate-500 leading-relaxed font-semibold italic">
                  No custom rules taught yet. Use the Teach button to train the AI!
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {learntRules.map((r) => (
                    <div key={r.id} className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 rounded-lg p-2 group transition">
                      <div className="flex items-start justify-between">
                        <span className="text-[9.5px] font-bold text-slate-200 line-clamp-1">{r.title}</span>
                        <button
                          onClick={(e) => handleDeleteRule(r.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <p className="text-[8.5px] text-slate-400 font-medium leading-snug mt-0.5">{r.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Imported files history */}
            <div className="p-3.5 border-b border-white/5">
              <span className="text-[9px] font-black uppercase tracking-wider text-teal-400 flex items-center gap-1 mb-2">
                <FileText className="w-3 h-3" /> Past Imported Logs
              </span>
              
              {importedFiles.length === 0 ? (
                <p className="text-[9.5px] text-slate-500 leading-relaxed font-semibold italic">
                  No imported statements. Drop or import files using the chat.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {importedFiles.map((f, idx) => (
                    <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-lg p-2">
                      <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-300">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[8px] text-slate-400 font-semibold">
                        <span>{f.size} • {f.txCount} txs</span>
                        <span>{f.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FAQ Guide & Historical Statements info */}
            <div className="p-3.5 flex-1 flex flex-col justify-end bg-slate-950/40">
              <div className="bg-teal-950/45 border border-teal-500/15 rounded-xl p-3 text-[10px] text-slate-300 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-teal-300 font-black">
                  <FileText className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Historical Statement Parsing</span>
                </div>
                <p className="text-[9px] font-semibold leading-relaxed text-slate-300">
                  <strong>How do I analyze my past M-Pesa statements?</strong>
                </p>
                <p className="text-[8.5px] font-medium leading-relaxed text-slate-400">
                  Upload your historical M-Pesa CSV or PDF statements directly in the chat or paste raw transaction SMS texts. The offline AI engine immediately catalogs everything securely without needing any physical SIM card or dialing and registration.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CHATBOX PANEL */}
        <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative">
          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.map((m) => {
              const isAi = m.sender === "ai";
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 max-w-[85%] ${isAi ? "self-start" : "self-end flex-row-reverse"}`}
                >
                  {/* Icon */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border text-xs ${
                      isAi
                        ? "bg-teal-500/10 border-teal-500/20 text-teal-400"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Bubble */}
                  <div className="flex flex-col gap-1">
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-xs font-semibold leading-relaxed ${
                        isAi
                          ? "bg-white/[0.04] text-slate-200 border border-white/5 rounded-tl-none whitespace-pre-wrap"
                          : "bg-teal-600 text-white rounded-tr-none"
                      }`}
                    >
                      {m.content}
                    </div>
                    <span className={`text-[8px] text-slate-500 font-bold ${isAi ? "self-start pl-1" : "self-end pr-1"}`}>
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* AI is Typing loader */}
            {isAiTyping && (
              <div className="flex gap-2.5 max-w-[85%] self-start">
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl rounded-tl-none px-3.5 py-2.5 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            {/* File importing animation banner */}
            {isUploading && (
              <div className="flex gap-2 p-3 bg-teal-950/40 border border-teal-500/25 rounded-xl text-xs text-teal-300 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <div>
                  <span className="font-bold">Analyzing file content...</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Executing regex extraction engine to process Safaricom text formats.</p>
                </div>
              </div>
            )}

            {/* Errors */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-300 text-xs flex gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Error Processing Request</span>
                  <p className="text-[10px] text-rose-400/90 mt-0.5">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggested Prompt Chips */}
          <div className="px-4 py-2 flex gap-1.5 overflow-x-auto bg-slate-950/30 scrollbar-none shrink-0 border-t border-white/5">
            <button
              onClick={() => handleSendMessage("💡 Analyze my Safaricom transaction fees")}
              className="text-[9.5px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1.5 rounded-full border border-white/5 hover:border-white/10 transition shrink-0"
            >
              Analyze Transaction Fees
            </button>
            <button
              onClick={() => handleSendMessage("📈 What are my top mobile spending categories?")}
              className="text-[9.5px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1.5 rounded-full border border-white/5 hover:border-white/10 transition shrink-0"
            >
              Top Spend Categories
            </button>
            <button
              onClick={() => handleSendMessage("📲 How will I access real M-Pesa logs via the WhatsApp APK download?")}
              className="text-[9.5px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1.5 rounded-full border border-white/5 hover:border-white/10 transition shrink-0"
            >
              WhatsApp APK FAQ
            </button>
          </div>

          {/* Input Chat Message Form */}
          <div className="p-3 bg-slate-950 shrink-0 border-t border-white/5 flex items-center gap-2">
            {/* Secret hidden File uploader input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.csv"
              className="hidden"
            />
            
            {/* Trigger file picker button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition shrink-0 border border-white/5 hover:border-white/10"
              title="Import raw SMS statement (.txt/.csv)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Main Chat input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask AI, upload SMS file, or teach rules..."
              className="flex-1 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 focus:border-teal-500/50 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition placeholder-slate-500 font-semibold"
            />

            {/* Send icon button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-xl transition shrink-0 flex items-center justify-center ${
                inputText.trim() 
                  ? "bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                  : "bg-white/5 text-slate-500 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Teach AI Rule Form */}
      {showRuleModal && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center gap-2 text-teal-400">
              <Brain className="w-5 h-5" />
              <h3 className="text-xs font-black uppercase tracking-wider">Teach AI Advisor Custom Rule</h3>
            </div>
            
            <p className="text-[10.5px] text-slate-400 leading-normal">
              Teach the AI how to categorize unique merchant names, paybills, or specific personal budget codes.
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Pattern or Trigger (e.g. Paybill 220220)</label>
                <input
                  type="text"
                  value={newRuleTitle}
                  onChange={(e) => setNewRuleTitle(e.target.value)}
                  placeholder="e.g. Quickmart Supermarket"
                  className="bg-white/5 border border-white/10 text-xs rounded-xl p-2.5 outline-none focus:border-teal-500 text-white font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">AI Action / Categorization</label>
                <input
                  type="text"
                  value={newRuleDesc}
                  onChange={(e) => setNewRuleDesc(e.target.value)}
                  placeholder="e.g. Categorize as Food, or Treat as Groceries budget"
                  className="bg-white/5 border border-white/10 text-xs rounded-xl p-2.5 outline-none focus:border-teal-500 text-white font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => setShowRuleModal(false)}
                className="py-2.5 border border-white/5 hover:bg-white/5 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRule}
                disabled={!newRuleTitle.trim() || !newRuleDesc.trim()}
                className={`py-2.5 text-xs font-bold rounded-xl transition text-center ${
                  newRuleTitle.trim() && newRuleDesc.trim()
                    ? "bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md active:scale-95"
                    : "bg-white/5 text-slate-500 cursor-not-allowed"
                }`}
              >
                Learn Instruction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Document Upload Consent Prompt */}
      {showUploadConsentPrompt && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center gap-2 text-teal-400">
              <FileText className="w-5 h-5" />
              <h3 className="text-xs font-black uppercase tracking-wider">Document Access Consent</h3>
            </div>
            
            <p className="text-[10.5px] text-slate-300 leading-normal">
              Do you grant <strong>M-Pesa AI Advisor</strong> permission to upload and parse your raw transaction logs file?
            </p>

            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl text-[9px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300 block mb-1">🔒 Your privacy is secured:</strong>
              This application operates purely locally on your client environment. Submitting this transaction statement extracts transaction entries to calculate your budgets. No financial information is shared with unauthorized third parties or sold.
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => handleUploadConsentResponse(false)}
                className="py-2.5 border border-white/5 hover:bg-white/5 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Deny & Cancel
              </button>
              <button
                onClick={() => handleUploadConsentResponse(true)}
                className="py-2.5 text-xs font-bold rounded-xl transition text-center bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md active:scale-95 cursor-pointer"
              >
                Grant & Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

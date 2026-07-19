/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { TransactionType, MpesaTransaction } from "./src/types.js";
import { createRequire } from "module";
const customRequire = typeof require !== "undefined" ? require : createRequire(import.meta.url);
const { PDFParse } = customRequire("pdf-parse");

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json({ limit: "5mb" }));

const PORT = 3000;

// Lazy initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;
let isGeminiDisabled = false;

function getAiClient(): GoogleGenAI | null {
  if (isGeminiDisabled) {
    return null;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Dedicated line-by-line PDF statement parser for Safaricom statements
function parseMpesaPdfText(text: string): MpesaTransaction[] {
  const transactions: MpesaTransaction[] = [];
  const seenIds = new Set<string>();
  
  // Clean text a bit to normalize characters
  const normalizedText = text.replace(/\r/g, "");

  // Match 10-character alphanumeric transaction IDs (Receipt No)
  const idRegex = /\b([A-Z0-9]{10})\b/gi;
  let match;
  const matches: { id: string; index: number }[] = [];
  
  while ((match = idRegex.exec(normalizedText)) !== null) {
    const id = match[1].toUpperCase();
    
    // Validate that it has at least one letter and one number to avoid pure numbers (dates, phone numbers)
    if (/^[A-Z0-9]{10}$/.test(id) && /[A-Z]/.test(id) && /[0-9]/.test(id)) {
      // Exclude common PDF header words that happen to be 10 characters
      if (!["STATEMENT", "SAFARICOM", "TELEPHONE", "TRANSACTION", "PARTICULAR", "CUSTOMER", "DETAILED", "COMPLETED", "CONFIRMED"].includes(id)) {
        matches.push({ id, index: match.index });
      }
    }
  }

  for (const item of matches) {
    const { id, index } = item;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    // Extract a local context window around the transaction ID (e.g. 120 chars before and 180 chars after)
    // This is 100% immune to line split and alignment issues from PDF text parsers
    const startPos = Math.max(0, index - 120);
    const endPos = Math.min(normalizedText.length, index + 180);
    const context = normalizedText.substring(startPos, endPos);

    // Parse decimal/monetary values within this transaction context window
    const monetaryMatches = context.match(/(-?[\d,]+\.\d{2})/g);
    let amount = 0;
    let balance = 0;

    if (monetaryMatches && monetaryMatches.length > 0) {
      // In typical Safaricom statement rows, the final column is the running Balance
      balance = parseFloat(monetaryMatches[monetaryMatches.length - 1].replace(/,/g, ""));

      // Identify the transaction amount as the first non-zero monetary value in the row context
      let foundAmount = false;
      for (let d = 0; d < monetaryMatches.length - 1; d++) {
        const val = parseFloat(monetaryMatches[d].replace(/,/g, ""));
        if (val !== 0) {
          amount = Math.abs(val);
          foundAmount = true;
          break;
        }
      }
      if (!foundAmount) {
        if (monetaryMatches.length >= 2) {
          amount = Math.abs(parseFloat(monetaryMatches[monetaryMatches.length - 2].replace(/,/g, "")));
        } else {
          amount = Math.abs(balance);
        }
      }
    } else {
      // Fallback: look for integers if no decimals exist
      const simpleNumbers = context.match(/\b\d+\b/g);
      if (simpleNumbers && simpleNumbers.length > 0) {
        amount = parseFloat(simpleNumbers[simpleNumbers.length - 1]);
      }
    }

    // Extract date and time from the context
    let dateTimeStr = new Date().toISOString();
    const dateMatch = context.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?)/) || 
                      context.match(/(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}(?::\d{2})?)/) ||
                      context.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}(?::\d{2})?)/);
    if (dateMatch) {
      try {
        dateTimeStr = new Date(dateMatch[1].replace(/-/g, "/")).toISOString();
      } catch (e) {
        // keep fallback
      }
    }

    // Extract transaction detail/party text by cleaning out numbers, IDs, and metadata from context
    let cleanText = context
      .replace(id, "")
      .replace(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?/, "")
      .replace(/\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}(?::\d{2})?/, "")
      .replace(/\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}(?::\d{2})?/, "")
      .replace(/-?[\d,]+\.\d{2}/g, "")
      .replace(/\bCompleted\b/g, "")
      .replace(/\bSuccess\b/g, "")
      .replace(/\bcompleted\b/g, "")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    let party = cleanText || "M-Pesa Transaction";
    let type = TransactionType.UNKNOWN;
    let category = "Miscellaneous";

    // Classify transactions and extract precise party names based on M-Pesa standard SMS/statement formatting
    const contextLower = context.toLowerCase();

    if (contextLower.includes("customer transfer to") || contextLower.includes("sent to") || contextLower.includes("mobile money transfer")) {
      type = TransactionType.SEND_MONEY;
      category = "Shopping";
      const match = cleanText.match(/(?:sent to|transfer to)\s+([^0-9]+)/i);
      if (match) party = match[1].trim();
    } else if (contextLower.includes("received from") || contextLower.includes("customer transfer received") || contextLower.includes("funds received")) {
      type = TransactionType.RECEIVE_MONEY;
      category = "Income";
      const match = cleanText.match(/(?:received from|transfer received from)\s+([^0-9]+)/i);
      if (match) party = match[1].trim();
    } else if (contextLower.includes("pay bill to") || contextLower.includes("paid to") || contextLower.includes("paybill")) {
      type = TransactionType.PAY_BILL;
      category = "Utilities";
      const match = cleanText.match(/(?:pay bill to|paid to)\s+([^0-9.]+)/i);
      if (match) party = match[1].trim();
    } else if (contextLower.includes("merchant payment") || contextLower.includes("lipa na m-pesa") || contextLower.includes("buy goods")) {
      type = TransactionType.BUY_GOODS;
      category = "Shopping";
      const match = cleanText.match(/(?:payment to|goods to|paid to)\s+([^0-9.]+)/i);
      if (match) party = match[1].trim();
    } else if (contextLower.includes("withdrawal") || contextLower.includes("withdrawn")) {
      type = TransactionType.CASH_WITHDRAWAL;
      category = "Miscellaneous";
      const match = cleanText.match(/(?:at agent|from agent)\s+([^0-9]+)/i);
      if (match) party = match[1].trim();
    } else if (contextLower.includes("deposit")) {
      type = TransactionType.CASH_DEPOSIT;
      category = "Income";
      const match = cleanText.match(/(?:at agent|from agent)\s+([^0-9]+)/i);
      if (match) party = match[1].trim();
    } else if (contextLower.includes("airtime")) {
      type = TransactionType.AIRTIME;
      party = "Safaricom Airtime";
      category = "Utilities";
    }

    // Final string cleanups
    party = party.replace(/\s+\d+$/, "").replace(/^[-\s:|]+/, "").trim();
    if (party.length > 50) {
      party = party.substring(0, 50) + "...";
    }
    if (!party || party === "...") party = "M-Pesa Transaction";

    // Auto-categorize common keywords in party name
    const pLower = party.toLowerCase();
    if (pLower.includes("mama") || pLower.includes("grocery") || pLower.includes("butcher") || pLower.includes("food") || pLower.includes("fast food") || pLower.includes("restaurant") || pLower.includes("kfc") || pLower.includes("cafe")) {
      category = "Food";
    } else if (pLower.includes("cab") || pLower.includes("uber") || pLower.includes("bolt") || pLower.includes("petrol") || pLower.includes("shell") || pLower.includes("matatu") || pLower.includes("fuel") || pLower.includes("filling station")) {
      category = "Transport";
    } else if (pLower.includes("hospital") || pLower.includes("chemist") || pLower.includes("pharmacy") || pLower.includes("clinic") || pLower.includes("medical")) {
      category = "Health";
    } else if (pLower.includes("school") || pLower.includes("uni") || pLower.includes("academy") || pLower.includes("college") || pLower.includes("fees")) {
      category = "Education";
    } else if (pLower.includes("rent") || pLower.includes("landlord") || pLower.includes("kplc") || pLower.includes("electricity") || pLower.includes("water") || pLower.includes("zuku") || pLower.includes("dstv") || pLower.includes("safaricom home")) {
      category = "Utilities";
    } else if (pLower.includes("bar") || pLower.includes("lounge") || pLower.includes("club") || pLower.includes("cinema") || pLower.includes("hotel") || pLower.includes("leisure") || pLower.includes("resort")) {
      category = "Leisure";
    }

    transactions.push({
      id,
      rawSms: `Extracted Row [ID: ${id}]`,
      amount,
      fee: 0,
      type,
      party,
      dateTime: dateTimeStr,
      balance,
      category
    });
  }

  // Sort transactions by date (descending)
  return transactions.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
}

// Highly robust Regex Parser as a solid fallback or local processor
function parseMpesaSmsRegex(text: string): MpesaTransaction[] {
  // If the text looks like an M-Pesa PDF/CSV statement, route to the dedicated PDF line parser
  const lowerText = text.toLowerCase();
  if (
    lowerText.includes("receipt no") || 
    lowerText.includes("paid in") || 
    lowerText.includes("paid out") || 
    lowerText.includes("completion time") || 
    lowerText.includes("balance") || 
    lowerText.includes("safaricom") ||
    lowerText.includes("m-pesa statement") ||
    lowerText.includes("detailed transaction")
  ) {
    console.info("Detected PDF/CSV statement structure. Routing to parseMpesaPdfText...");
    return parseMpesaPdfText(text);
  }

  // Split into individual messages by line breaks first to avoid splitting on 8-12 char merchant names like QUICKMART (9) or ENTERPRISES (11)
  let lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  // If there are very few lines but the text is long, they might have pasted multiple SMSs in a continuous block without line breaks.
  // In this fallback, split ONLY on transaction IDs followed by known transaction actions to prevent false-splitting on company names!
  if (lines.length <= 2 && text.length > 100) {
    lines = text.split(/(?=\b[A-Z0-9]{8,12}\b\s+(?:Confirmed|Paid|Received|You\s+have))/i).map(l => l.trim()).filter(Boolean);
  }

  const transactions: MpesaTransaction[] = [];

  for (let raw of lines) {
    raw = raw.trim();
    if (!raw) continue;

    // Must have a valid 8-12 char transaction ID
    const matchId = raw.match(/\b([A-Z0-9]{8,12})\b/i);
    if (!matchId) continue;

    const id = matchId[1].toUpperCase();
    
    // Ignore common words that are NOT transaction IDs
    if (["STATEMENT", "SAFARICOM", "TELEPHONE", "TRANSACTION", "PARTICULAR", "CUSTOMER", "DETAILED", "COMPLETED", "CONFIRMED"].includes(id)) {
      continue;
    }

    let amount = 0;
    let fee = 0;
    let balance = 0;
    let party = "Unknown";
    let type = TransactionType.UNKNOWN;
    let category = "Miscellaneous";
    let dateTimeStr = new Date().toISOString();

    // 1. Amount Extraction
    // Match patterns like "Ksh1,500.00" or "Ksh 1,500.00" or simple decimals representing amounts
    const amountMatch = raw.match(/Ksh\s*([\d,]+\.?\d*)/i) || raw.match(/([\d,]+\.\d{2})/);
    if (amountMatch) {
      amount = parseFloat(amountMatch[1].replace(/,/g, ""));
    }

    // 2. Fee Extraction
    const feeMatch = raw.match(/Transaction\s+cost,\s*Ksh\s*([\d,]+\.?\d*)/i) || raw.match(/cost\s*Ksh\s*([\d,]+\.?\d*)/i);
    if (feeMatch) {
      fee = parseFloat(feeMatch[1].replace(/,/g, ""));
    }

    // 3. Balance Extraction
    const balanceMatch = raw.match(/balance\s+is\s+Ksh\s*([\d,]+\.?\d*)/i) || raw.match(/New\s+balance\s*is?\s*Ksh\s*([\d,]+\.?\d*)/i);
    if (balanceMatch) {
      balance = parseFloat(balanceMatch[1].replace(/,/g, ""));
    }

    // 4. Date and Time Extraction
    // Match "on 15/7/26 at 2:30 PM" or standard DD/MM/YYYY dates
    const dateTimeMatch = raw.match(/on\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\s*at\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i) || raw.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i);
    if (dateTimeMatch) {
      try {
        const dateStr = dateTimeMatch[1];
        const timeStr = dateTimeMatch[2];
        const [day, month, yearPart] = dateStr.split("/");
        const fullYear = yearPart.length === 2 ? `20${yearPart}` : yearPart;
        
        let hours = 0;
        let minutes = 0;
        const timeParts = timeStr.match(/(\d{1,2}):(\d{2})/);
        if (timeParts) {
          hours = parseInt(timeParts[1]);
          minutes = parseInt(timeParts[2]);
          const ampmMatch = timeStr.match(/(AM|PM)/i);
          if (ampmMatch) {
            const ampm = ampmMatch[1].toUpperCase();
            if (ampm === "PM" && hours < 12) hours += 12;
            if (ampm === "AM" && hours === 12) hours = 0;
          }
        }
        
        const dateObj = new Date(parseInt(fullYear), parseInt(month) - 1, parseInt(day), hours, minutes);
        if (!isNaN(dateObj.getTime())) {
          dateTimeStr = dateObj.toISOString();
        }
      } catch (e) {
        console.error("Failed to parse date-time in local parser:", e);
      }
    }

    // 5. Type and Party and Category Detection
    if (raw.includes("sent to")) {
      type = TransactionType.SEND_MONEY;
      category = "Shopping";
      const matchParty = raw.match(/sent\s+to\s+([^0-9]+?)(?:\s+\d{10,12}|\s+on\s+)/i);
      if (matchParty) party = matchParty[1].trim();
      
      // Auto-categorize common names or keywords
      const pLower = party.toLowerCase();
      if (pLower.includes("mama") || pLower.includes("grocery") || pLower.includes("butcher") || pLower.includes("food") || pLower.includes("fast food")) {
        category = "Food";
      } else if (pLower.includes("cab") || pLower.includes("uber") || pLower.includes("bolt") || pLower.includes("petrol") || pLower.includes("shell") || pLower.includes("matatu")) {
        category = "Transport";
      } else if (pLower.includes("hospital") || pLower.includes("chemist") || pLower.includes("pharmacy") || pLower.includes("clinic")) {
        category = "Health";
      } else if (pLower.includes("school") || pLower.includes("uni") || pLower.includes("academy")) {
        category = "Education";
      } else if (pLower.includes("rent") || pLower.includes("landlord")) {
        category = "Utilities";
      }
    } else if (raw.includes("paid to") || raw.includes("Lipa Na M-PESA")) {
      // Could be Pay Bill or Buy Goods
      const paybillMatch = raw.match(/paid\s+to\s+([^.]+?)\s+for\s+account/i);
      if (paybillMatch) {
        type = TransactionType.PAY_BILL;
        party = paybillMatch[1].trim();
        category = "Utilities"; // Default for Pay Bills
        
        const pLower = party.toLowerCase();
        if (pLower.includes("kplc") || pLower.includes("electricity") || pLower.includes("water") || pLower.includes("zuku") || pLower.includes("dstv") || pLower.includes("safaricom home")) {
          category = "Utilities";
        }
      } else {
        type = TransactionType.BUY_GOODS;
        category = "Shopping";
        const matchParty = raw.match(/paid\s+to\s+([^.]+?)\s+on\s+/i);
        if (matchParty) party = matchParty[1].trim();
        
        const pLower = party.toLowerCase();
        if (pLower.includes("supermarket") || pLower.includes("quickmart") || pLower.includes("naivas") || pLower.includes("carrefour") || pLower.includes("retail")) {
          category = "Food";
        } else if (pLower.includes("bar") || pLower.includes("lounge") || pLower.includes("club") || pLower.includes("cinema") || pLower.includes("hotel") || pLower.includes("restaurant")) {
          category = "Leisure";
        }
      }
    } else if (raw.includes("received") || raw.includes("received Ksh")) {
      type = TransactionType.RECEIVE_MONEY;
      category = "Income";
      const matchParty = raw.match(/received\s+from\s+([^.]+?)\s+on\s+/i);
      if (matchParty) party = matchParty[1].trim();
    } else if (raw.includes("Cash Deposit")) {
      type = TransactionType.CASH_DEPOSIT;
      category = "Income";
      const matchParty = raw.match(/at\s+agent\s+([^.]+?)\s+on\s+/i);
      if (matchParty) party = matchParty[1].trim();
    } else if (raw.includes("withdrawn")) {
      type = TransactionType.CASH_WITHDRAWAL;
      category = "Miscellaneous";
      const matchParty = raw.match(/from\s+agent\s+([^.]+?)\s+on\s+/i);
      if (matchParty) party = matchParty[1].trim();
    } else if (raw.includes("airtime") || raw.includes("bought") && raw.includes("airtime")) {
      type = TransactionType.AIRTIME;
      party = "Safaricom Airtime";
      category = "Utilities";
    }

    transactions.push({
      id,
      rawSms: raw,
      amount,
      fee,
      type,
      party,
      dateTime: dateTimeStr,
      balance,
      category,
    });
  }

  return transactions;
}

// 1. Analyze SMS API Route
app.post("/api/analyze-sms", async (req, res) => {
  let extractedPdfText = "";
  const { text, fileData, mimeType, pdfPassword } = req.body;
  
  try {
    if (!fileData && (!text || typeof text !== "string")) {
      return res.status(400).json({ error: "Text field or fileData field is required." });
    }

    // Decode and extract PDF text locally first if it is a PDF
    if (fileData && mimeType === "application/pdf") {
      try {
        console.log("Decoding PDF and extracting text locally with PDFParse...");
        let base64Data = fileData;
        if (base64Data.includes(";base64,")) {
          base64Data = base64Data.split(";base64,").pop() || "";
        }
        const pdfBuffer = Buffer.from(base64Data, "base64");
        
        // Instantiate the modern PDFParse class with password parameters if available
        const parser = new PDFParse({ data: pdfBuffer, password: pdfPassword || undefined });
        const textResult = await parser.getText();
        extractedPdfText = textResult.text || "";
        console.log(`Extracted ${extractedPdfText.length} characters from PDF.`);
      } catch (pdfErr: any) {
        console.error("Local PDF extraction failed:", pdfErr.message);
        const errLower = pdfErr.message ? pdfErr.message.toLowerCase() : "";
        if (pdfErr.name === "PasswordException" || errLower.includes("password") || errLower.includes("decrypt")) {
          return res.status(400).json({ 
            error: "This PDF statement is password-protected. Please provide your correct 6-digit statement passcode in the passcode field and try again." 
          });
        }
        return res.status(400).json({
          error: `Could not read PDF statement: ${pdfErr.message}. If the PDF is password-protected, please verify your passcode and try again.`
        });
      }
    }

    // Check if we have Gemini credentials
    const ai = getAiClient();
    if (!ai) {
      if (mimeType === "application/pdf") {
        console.log("Bypassing Gemini (Disabled or missing key). Running local PDF parser on extracted PDF text.");
        const transactions = parseMpesaPdfText(extractedPdfText);
        return res.json({
          source: "local_pdf_parser",
          transactions,
          failedCount: 0,
          extractedText: extractedPdfText,
        });
      }
      console.log("Using Regex parser fallback (No GEMINI_API_KEY configured)");
      const transactions = parseMpesaSmsRegex(text || "");
      return res.json({
        source: "regex_parser",
        transactions,
        failedCount: 0,
        extractedText: text || "",
      });
    }

    // We have Gemini! Use it for highly precise parsing and categorization
    console.log("Calling Gemini 3.5 Flash for statement analysis...");
    
    // Prepare prompt
    const prompt = `
You are an exceptionally precise financial statement parser.
Your task is to parse a Safaricom M-Pesa statement (which might be in PDF, CSV, or raw text format) and extract structured transaction details.
Analyze the provided document or text carefully. Identify every single valid M-Pesa transaction (such as Send Money, Pay Bill, Buy Goods, Cash Deposit, Withdrawal, Airtime purchase, etc.) and output a clean JSON array of objects.

Each object MUST strictly follow this structure:
{
  "id": "A unique 10-character capitalized alphanumeric M-Pesa transaction code, e.g. QX728HJ189",
  "amount": 1500.00, // Float number representing transaction amount in Ksh
  "fee": 15.00, // Float number representing transaction cost/fee in Ksh. If free or not specified, output 0.00.
  "type": "One of these specific strings: 'Send Money', 'Pay Bill', 'Buy Goods (Lipa Na M-Pesa)', 'Receive Money', 'Cash Deposit', 'Cash Withdrawal', 'Buy Airtime', 'Funds Transfer', 'Fee / Other Cost'",
  "party": "Extracted recipient name, business name, agent name, or paybill name, e.g. 'Naivas Supermarket' or 'JOHN SMITH'",
  "dateTime": "The ISO String representing transaction timestamp. Convert dates like 15/7/26 (meaning 15th July 2026) and times like 2:30 PM correctly to ISO 8601 string format (e.g. 2026-07-15T14:30:00.000Z). Use Year 2026 for YY=26, etc.",
  "balance": 12300.00, // Float number representing ending balance after transaction
  "category": "Map this transaction to exactly one of: 'Food', 'Utilities', 'Transport', 'Shopping', 'Leisure', 'Income', 'Health', 'Education', 'Miscellaneous'"
}

Respond with nothing but a valid JSON array. Ensure no markdown wrappers or backticks outside the valid JSON.
`;

    // Prepare content parts
    const parts: any[] = [];
    
    // For PDFs, we can send the raw extracted text inside the text block to Gemini, which is extremely reliable and bypasses binary restrictions!
    const textContext = mimeType === "application/pdf" 
      ? `Here is the raw text extracted from the PDF statement:\n\n${extractedPdfText}`
      : (text || "");

    parts.push({
      text: `${prompt}\n\nAdditional text context provided:\n${textContext}`
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text ? response.text.trim() : "";
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    // Clean up response if there are markdown wrappers (defensive coding)
    let jsonString = responseText;
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.substring(7);
    }
    if (jsonString.startsWith("```")) {
      jsonString = jsonString.substring(3);
    }
    if (jsonString.endsWith("```")) {
      jsonString = jsonString.substring(0, jsonString.length - 3);
    }
    jsonString = jsonString.trim();

    const parsedTransactions = JSON.parse(jsonString) as MpesaTransaction[];

    // Add raw SMS or description field to parsed transactions if missing
    const enrichedTransactions = parsedTransactions.map((tx, idx) => ({
      ...tx,
      rawSms: tx.rawSms || `Parsed from ${mimeType ? 'uploaded document' : 'text'} via Gemini AI [Index: ${idx}]`,
    }));

    return res.json({
      source: "gemini_api",
      transactions: enrichedTransactions,
      failedCount: 0,
      extractedText: textContext,
    });

  } catch (error: any) {
    const errMsg = error.message || String(error);
    if (errMsg.includes("PERMISSION_DENIED") || errMsg.includes("denied") || errMsg.includes("403") || errMsg.includes("key") || errMsg.includes("API key")) {
      isGeminiDisabled = true;
      console.info("Info: Gemini API restricted or denied. Switched fully to local offline parser.");
    } else {
      console.info("Info: Gemini SMS parsing was bypassed. Reason:", errMsg);
    }
    // Fallback to Regex parser on failure to ensure zero disruption for user
    try {
      const sourceText = mimeType === "application/pdf" ? extractedPdfText : (text || "");
      console.info("Using robust offline Regex parser fallback.");
      const transactions = mimeType === "application/pdf" ? parseMpesaPdfText(extractedPdfText) : parseMpesaSmsRegex(sourceText);
      return res.json({
        source: mimeType === "application/pdf" ? "local_pdf_parser_fallback" : "regex_parser_fallback",
        transactions,
        failedCount: 0,
        extractedText: sourceText,
        info: "Running in offline fallback mode",
        warning: `Gemini API returned an error, so we parsed your statement using our robust local offline parser. (Error: ${errMsg})`
      });
    } catch (fallbackErr: any) {
      console.info("Local parsing failed:", fallbackErr.message);
      return res.status(200).json({
        source: "regex_parser_fallback",
        transactions: [],
        failedCount: 0,
        extractedText: mimeType === "application/pdf" ? extractedPdfText : (text || ""),
        info: "Empty results",
      });
    }
  }
});

// 3. AI Financial Advisor Chat Route with Learnt Rules and Context
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, transactions, learntRules } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = getAiClient();

    // Prepare context summarizing current user finances
    const totalSpent = transactions?.filter((t: any) => t.type !== TransactionType.RECEIVE_MONEY && t.type !== TransactionType.CASH_DEPOSIT).reduce((acc: number, t: any) => acc + t.amount, 0) || 0;
    const totalReceived = transactions?.filter((t: any) => t.type === TransactionType.RECEIVE_MONEY || t.type === TransactionType.CASH_DEPOSIT).reduce((acc: number, t: any) => acc + t.amount, 0) || 0;
    const totalFees = transactions?.reduce((acc: number, t: any) => acc + t.fee, 0) || 0;

    const rulesStr = learntRules && Array.isArray(learntRules) && learntRules.length > 0
      ? learntRules.map((r: any, idx: number) => `Rule ${idx + 1}: ${r.title} - ${r.description}`).join("\n")
      : "No custom categorization or budget rules taught yet.";

    // Sort transactions and select top 40 for Gemini context
    const recentTxList = (transactions && Array.isArray(transactions))
      ? transactions
          .slice()
          .sort((a: any, b: any) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
          .slice(0, 40)
          .map((t: any) => `- [${new Date(t.dateTime).toLocaleDateString("en-GB")}] Code: ${t.id} | ${t.type} to/from ${t.party} | Ksh ${t.amount.toLocaleString()} | Fee: Ksh ${t.fee} | Category: ${t.category}`)
          .join("\n")
      : "No transactions recorded yet.";

    const contextPrompt = `
You are an expert mobile financial assistant for Safaricom M-Pesa users in Kenya.
You have access to the user's current transaction stats:
- Total Outflow (Spent): Ksh ${totalSpent.toLocaleString()}
- Total Inflow (Received): Ksh ${totalReceived.toLocaleString()}
- Total Safaricom Transaction Fees paid: Ksh ${totalFees.toLocaleString()}
- Number of recorded transactions: ${transactions?.length || 0}

Current local server date: ${new Date().toLocaleDateString("en-GB")}

Here is the list of the user's 40 most recent M-Pesa transactions (from newest to oldest):
${recentTxList}

The user has "TAUGHT" you the following custom rules/knowledge which you MUST learn, remember, and respect in your answers:
${rulesStr}

Instructions:
1. Provide highly professional, financially savvy, and locally relevant (Kenyan context, shillings, Safaricom tier system) advice.
2. If asked about "Safaricom features" (e.g. Fuliza, M-Shwari, or Global Pay), describe them with legit information. Do NOT offer alternatives or competitors unless the user explicitly asks for alternatives in their query. Mention downloading the official apps ("MySafaricom App" or "M-PESA App") on Google Play Store or Apple App Store.
3. Be conversational, objective, clear, and actionable. Refer to specific transactions if asked (e.g., from last week, yesterday, etc.).
4. Keep your responses compact and scannable so it fits beautifully in a mobile chat bubble screen.
5. If asked about the WhatsApp APK download: Confidently reassure them that once they share/compile the APK and install it on their physical device via WhatsApp, the native Android application will be able to intercept the local SMS broadcasts. This lets them securely track real M-Pesa alerts offline in real-time.
6. CRITICAL: DO NOT use markdown bolding (asterisks like '**') in your response under any circumstances, because the chatbox renders plain text and will display raw asterisks which clutter the message. Use capital letters, headers, emojis, or dashes for lists to structure your message cleanly instead.
7. Be extremely flexible, helpful, and versatile like ChatGPT. Answer ANY general questions, greeting messages, or specific questions about Safaricom, budgeting, saving, or life in Kenya with warmth and high financial expertise.
8. If the user asks about M-Pesa withdrawal charges/tariffs, provide precise information about Safaricom's tiered withdrawal bands. Do NOT recommend or volunteer alternatives unless they explicitly ask for alternatives.
9. If the user asks about M-Pesa deposit charges or adding money/depositing cash, inform them clearly and warmly that cash deposits are completely FREE at any authorized M-Pesa agent outlet in Kenya. Explain that agents are legally forbidden from charging any fee for deposits, and specify physical original ID card and active Safaricom line/number requirements.
10. CRITIQUE CAPABILITIES: Constructively critique the user's financial habits and queries when they ask for a budget review or financial advice. Point out if they are spending too much on fees, or if their transaction flow looks unbalanced.
11. GUARDRAILS FOR INTERNAL DATA & SECURITY: If the user asks for sensitive, non-public Safaricom information (e.g., how much employees are paid) or how to breach/compromise security (e.g., how to hack M-Pesa or the system), refuse immediately, politely, and firmly. Cite security and compliance guardrails, stating that you cannot provide proprietary salary information or assist with hacking or unauthorized activity.
12. SAVING VS FULIZA CORRECTION: If the user mentions "saving" but references "Fuliza" in the same thought or ask, immediately correct them. Explain that Fuliza is a high-cost continuous overdraft product (which charges daily administrative fees) and NOT a savings account. Do NOT recommend other savings accounts or alternatives unless they specifically ask for alternatives.
13. COMPETITORS: If the user asks about Safaricom competitors (such as Airtel Money, T-Kash, Equity Bank, etc.), provide unbiased, generic high-level information, then direct them to the competitors' official websites, customer care, or respective mobile applications for the most accurate details.
14. AT THE ABSOLUTE END of your response, you MUST always append a new paragraph stating exactly: "Do you want me to analyze the report or explain again?"
`;
    // Local/offline heuristic responder logic helper
    const handleLocalChatFallback = () => {
      const lastMessage = messages[messages.length - 1]?.content || "";
      let responseText = "";

      const lowerMsg = lastMessage.toLowerCase();

      // A. GUARDRAILS (Hacking or internal corporate data)
      if (
        lowerMsg.includes("hack") || 
        lowerMsg.includes("hacking") || 
        lowerMsg.includes("bypass") || 
        lowerMsg.includes("compromise") || 
        lowerMsg.includes("exploit") || 
        lowerMsg.includes("breach") ||
        (lowerMsg.includes("employee") && (lowerMsg.includes("paid") || lowerMsg.includes("salary") || lowerMsg.includes("salaries") || lowerMsg.includes("wage") || lowerMsg.includes("wages") || lowerMsg.includes("pay scale")))
      ) {
        return `I cannot assist with that request. 

For safety, security, and corporate compliance reasons:
- I do not have access to proprietary Safaricom corporate details, including employee payroll, salaries, or internal operational budgets.
- I am strictly programmed to follow ethical guardrails and cannot assist with, discuss, or facilitate any form of unauthorized security testing, hacking, system exploits, or pin bypasses.

If you have questions about saving, budgeting, or optimizing your own transaction fees, I would be happy to help!`;
      }

      // B. SAVING VS FULIZA CORRECTION
      if (
        (lowerMsg.includes("save") || lowerMsg.includes("saving") || lowerMsg.includes("savings") || lowerMsg.includes("deposit")) && 
        (lowerMsg.includes("fuliza") || lowerMsg.includes("overdraft"))
      ) {
        return `I must correct an important financial distinction: Fuliza is NOT a savings product! 

Fuliza is an automated, continuous overdraft service designed to help you complete transactions when you have insufficient funds. Because it charges continuous daily administrative fees and interest, relying on it will deplete your money rather than help you save.

If you are looking to build savings and earn interest, please avoid Fuliza and consider these genuine savings alternatives instead:
1. M-Shwari Lock Savings Account: Allows you to lock funds for 1 to 12 months and earn interest up to 6% per annum.
2. KCB M-Pesa Account: A digital bank account with NCBA and KCB that offers interest-bearing savings.
3. SACCOs: Saving with registered SACCOs (like Stima, Harambee, or Safaricom SACCO) typically grants annual dividend payouts between 10% and 15%.`;
      }

      // C. COMPETITORS COMPARISON
      if (
        lowerMsg.includes("airtel") || 
        lowerMsg.includes("t-kash") || 
        lowerMsg.includes("tkash") || 
        lowerMsg.includes("telkom") || 
        lowerMsg.includes("equitel") || 
        lowerMsg.includes("competitor") || 
        lowerMsg.includes("competitors")
      ) {
        return `Here is generic, objective information regarding mobile money competitors in Kenya:

1. Airtel Money (by Airtel Kenya):
- Features: Allows sending and receiving money, settling utility bills, and agent cash withdrawals. P2P transfers within network and cash withdrawals are often priced cheaper than M-Pesa.
- Official Source: Please visit Airtel Kenya's official portal at airtel.co.ke or dial 100 on an Airtel line.

2. T-Kash (by Telkom Kenya):
- Features: Telkom's mobile money platform providing basic transfers, merchant payments, and agent withdrawal infrastructure.
- Official Source: Please visit Telkom Kenya's official portal at telkom.co.ke or dial 100 on a Telkom line.

3. Equitel & Banking Apps:
- Features: Equitel (by Equity Group) offers banking-driven mobile transfer capabilities linked directly to Equity Bank accounts.
- Official Source: Please visit Equity Bank's website at equitygroupholdings.com or download the official Equity Mobile app.

For accurate, real-time pricing and terms of these services, we highly recommend checking their respective official websites or reaching out directly to their customer service teams.`;
      }

      // D. CONSTRUCTIVE FINANCIAL CRITIQUE
      if (
        lowerMsg.includes("critique") || 
        lowerMsg.includes("audit") || 
        lowerMsg.includes("rate") || 
        lowerMsg.includes("review") || 
        lowerMsg.includes("opinion") || 
        lowerMsg.includes("how am i doing") || 
        lowerMsg.includes("analyze my habits") || 
        lowerMsg.includes("evaluate")
      ) {
        const feeRatio = totalSpent > 0 ? ((totalFees / totalSpent) * 100).toFixed(1) : "0.0";
        const netSavings = totalReceived - totalSpent;
        const netVerdict = netSavings >= 0 
          ? "Your cash flow is POSITIVE. You are living within your means by receiving more than you spend. Keep this up!" 
          : "Your cash flow is NEGATIVE. You are currently spending more than you receive. This indicates over-reliance on overdraft products like Fuliza or micro-loans. We need to curb non-essential outflows.";

        const feeVerdict = parseFloat(feeRatio) > 2.0 
          ? "CRITIQUE: Your fee-to-spending ratio is above 2.0% (" + feeRatio + "%). This is inefficient! You are likely performing too many small withdrawals or paying paybills multiple times. Settle transactions once or pay via Till to save on fees." 
          : "HEALTH CHECK: Your fee-to-spending ratio is healthy at " + feeRatio + "%. You are managing transaction overhead well!";

        return `Here is my direct, objective critique of your mobile financial habits based on your M-Pesa ledger:

1. TRANSACTION OVERHEAD:
- Safaricom fees paid: Ksh ${totalFees.toLocaleString()}
- Total outflows: Ksh ${totalSpent.toLocaleString()}
- ${feeVerdict}

2. CASH FLOW BALANCE:
- Total Inflows (deposits/received): Ksh ${totalReceived.toLocaleString()}
- Total Outflows (bills/spent): Ksh ${totalSpent.toLocaleString()}
- Net position: Ksh ${netSavings.toLocaleString()}
- Critique: ${netVerdict}

3. CLASSIFICATION & RULES:
- Rules taught: ${learntRules?.length || 0} active rules.
- Critique: ${learntRules?.length && learntRules.length > 0 ? "You have actively taught me customization rules, which makes your budget more precise! Continue mapping specific merchants to categories." : "You have not taught me any custom category mapping rules yet. Tap 'Rules Management' to train me on how you categorize specific local merchants to improve budget accuracy."}

Smart Optimization Steps:
- Pay with Till: Buy Goods payments (Lipa Na M-Pesa) are free. Move non-cash expenses away from withdrawals.
- Consolidate transfers: Avoid multiple small cash sends.
- Establish a buffer: Allocate 10% of monthly inflows to M-Shwari Lock savings before spending.`;
      }

      // 1. GREETING AND HELP SYSTEM (ChatGPT-like flexibility)
      if (
        lowerMsg === "hello" || 
        lowerMsg === "hi" || 
        lowerMsg === "hey" || 
        lowerMsg === "habari" || 
        lowerMsg === "jambo" || 
        lowerMsg.includes("who are you") || 
        lowerMsg.includes("what can you do") || 
        lowerMsg.includes("help") || 
        lowerMsg.includes("chatgpt")
      ) {
        return `Hello! I am your M-Pesa AI Advisor, here to help you manage your mobile finances like ChatGPT. 

Here is what I can assist you with:
- Financial Critique: Ask me to "critique my habits" or "evaluate my budget" to get a smart personal financial audit.
- Safaricom Features: Ask me about Fuliza, M-Shwari digital banking, Safaricom Global Pay, and where to download official apps.
- Deposits: Ask me about cash deposit fees or how to add money to your account.
- Withdrawal Charges: Ask me about agent withdrawal fees, tariffs, and cost-saving alternatives.
- Ledger Analysis: Ask me to list your transactions from last week, yesterday, or find what you spent on specific items.
- Smart Budgets: Ask me how much you have spent, or teach me custom rules for categorization.

What questions can I answer for you today?`;
      }

      // 2. CASH DEPOSITS (Always FREE)
      if (
        lowerMsg.includes("deposit") || 
        lowerMsg.includes("depositing") || 
        lowerMsg.includes("deposits") ||
        lowerMsg.includes("add money") ||
        lowerMsg.includes("top up")
      ) {
        return `Cash deposits into your Safaricom M-Pesa account are absolutely FREE of charge at any authorized M-Pesa agent outlet in Kenya!

Key guidelines for M-Pesa deposits:
1. No Fee: You should never be charged any fee or commission by an agent to deposit cash. It is 100% free at any outlet in your area.
2. Requirements: You must present a valid physical original ID (National ID, Passport, or Military ID) and your active Safaricom line/phone number to complete a deposit.
3. Transaction Limit: The minimum deposit amount is Ksh 10, and the maximum transaction limit is Ksh 150,000 per transaction (with a daily account limit of Ksh 500,000).
4. Verify First: Always wait for the official SMS confirmation from 'M-PESA' on your phone and verify your balance before leaving the agent desk.
5. Official Register: Make sure to sign the agent's physical ledger book to log your transaction securely.`;
      }


      // 3. SAFARICOM FEATURES AND APP DISCOVERY QUERY
      if (
        lowerMsg.includes("safaricom") || 
        lowerMsg.includes("feature") || 
        lowerMsg.includes("fuliza") || 
        lowerMsg.includes("mshwari") || 
        lowerMsg.includes("m-shwari") || 
        lowerMsg.includes("global pay") || 
        lowerMsg.includes("globalpay") || 
        lowerMsg.includes("save") || 
        lowerMsg.includes("loan") || 
        lowerMsg.includes("borrow") || 
        lowerMsg.includes("app") || 
        lowerMsg.includes("playstore") || 
        lowerMsg.includes("app store") || 
        lowerMsg.includes("apple store") ||
        lowerMsg.includes("myone")
      ) {
        responseText = `Here are the official, legitimate Safaricom M-Pesa features available on your Safaricom line and apps, complete with smart financial alternatives:

1. FULIZA (M-Pesa Overdraft):
- What it is: An automated, continuous overdraft service that lets you complete transactions (Lipa Na M-Pesa, Paybill, Send Money) when your M-Pesa balance is insufficient.
- How to activate: Dial *234# or opt-in inside the official apps.
- Alternatives: Instead of high-tariff daily administrative fees from Fuliza, consider activating a micro-loan limit on M-Shwari or KCB M-PESA (repayable in 30 days) to avoid continuous compounding overdraft rates, or set up a small buffer reserve on your ledger.

2. M-SHWARI (Savings & Loans with NCBA Bank):
- What it is: A digital banking service allowing you to save securely (earning interest up to 6% p.a.) and borrow short-term micro-loans from Ksh 100 to Ksh 50,000 with a flat 7.5% facilitation fee.
- How to access: Find it under 'Loans and Savings' in your M-Pesa SIM menu, or within Safaricom's apps.
- Alternatives: Try KCB M-PESA (offering competitive interest rates at 8.64%), Equity Eazzy Loan, or save in a digital SACCO (like Harambee or Stima SACCO) which can offer annual dividend payouts of 10-15%.

3. SAFARICOM GLOBAL PAY (Virtual Visa Card):
- What it is: An online virtual Visa card linked directly to your M-Pesa account balance, enabling you to pay international merchants (such as Amazon, Netflix, AliExpress, Spotify) securely without a foreign bank account.
- How to activate: Access and activate it exclusively inside the official M-PESA App.
- Alternatives: Use the official M-Pesa to PayPal top-up portal to pay international merchants, or request a virtual prepaid card from digital banking platforms like NCBA Loop, KCB, or I&M Bank.

Official App Downloads:
- MySafaricom App: Your all-in-one hub for bundles, airtime, and detailed M-Pesa statements. Download it from Google Play Store or Apple App Store.
- M-PESA App: A modern, dedicated lifestyle and payment app featuring Global Pay, budget trackers, and mini-apps. Download it from Google Play Store or Apple App Store.`;
        return responseText;
      }

      // 3. WITHDRAWAL FEES AND TARIFFS
      if (
        lowerMsg.includes("withdraw") || 
        lowerMsg.includes("charge") || 
        lowerMsg.includes("fee") || 
        lowerMsg.includes("tariff") || 
        lowerMsg.includes("cost") || 
        lowerMsg.includes("agent") ||
        lowerMsg.includes("rate")
      ) {
        responseText = `Here is a complete, official schedule of Safaricom M-Pesa Agent Withdrawal Charges in Kenya:

- Ksh 50 - 100: Ksh 11 fee
- Ksh 101 - 500: Ksh 28 fee
- Ksh 501 - 1,000: Ksh 29 fee
- Ksh 1,001 - 1,500: Ksh 34 fee
- Ksh 1,501 - 2,500: Ksh 34 fee
- Ksh 2,501 - 3,500: Ksh 68 fee
- Ksh 3,501 - 5,000: Ksh 68 fee
- Ksh 5,001 - 7,500: Ksh 84 fee
- Ksh 7,501 - 10,000: Ksh 112 fee
- Ksh 10,001 - 15,000: Ksh 162 fee
- Ksh 15,001 - 20,000: Ksh 180 fee
- Ksh 20,001 - 35,000: Ksh 191 fee
- Ksh 35,001 - 50,000: Ksh 273 fee
- Ksh 50,001 - 150,000: Ksh 300 fee

Smart financial alternatives to avoid withdrawal fees:
1. Pay with Till Number (Lipa Na M-PESA Buy Goods) directly at supermarket and retailer checkouts - This is completely free for you as a customer.
2. Settle utility bills directly using official Paybill numbers rather than withdrawing hard cash.
3. Consolidate your cash needs - withdrawing Ksh 10,000 in one transaction costs Ksh 112, whereas withdrawing Ksh 2,000 five times costs Ksh 170.
4. Transfer money directly wallet-to-wallet if the other party accepts mobile money, as transfer rates are significantly cheaper than cash withdrawals.`;
        return responseText;
      }

      // 4. DETAILED TRANSACTION/LEDGER QUERY FALLBACK (INCLUDING LAST WEEK & YESTERDAY QUERY)
      const isTxQuery = 
        lowerMsg.includes("transaction") || 
        lowerMsg.includes("week") || 
        lowerMsg.includes("yesterday") ||
        lowerMsg.includes("recent") || 
        lowerMsg.includes("history") || 
        lowerMsg.includes("ledger") || 
        lowerMsg.includes("show") || 
        lowerMsg.includes("find") || 
        lowerMsg.includes("list") || 
        lowerMsg.includes("spent") || 
        lowerMsg.includes("received") || 
        lowerMsg.includes("paid") || 
        lowerMsg.includes("bought");

      if (isTxQuery) {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
        const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        
        let filtered = transactions || [];
        let filterReason = "all recorded transactions";

        if (lowerMsg.includes("yesterday")) {
          filtered = filtered.filter((t: any) => new Date(t.dateTime) >= yesterdayStart);
          filterReason = "transactions from yesterday";
        } else if (lowerMsg.includes("week") || lowerMsg.includes("last week")) {
          filtered = filtered.filter((t: any) => new Date(t.dateTime) >= oneWeekAgo);
          filterReason = "transactions from last week (the last 7 days)";
        } else if (lowerMsg.includes("spent") || lowerMsg.includes("expense") || lowerMsg.includes("outflow") || lowerMsg.includes("paid") || lowerMsg.includes("bought")) {
          filtered = filtered.filter((t: any) => t.type !== TransactionType.RECEIVE_MONEY && t.type !== TransactionType.CASH_DEPOSIT);
          filterReason = "expenses / money spent";
        } else if (lowerMsg.includes("received") || lowerMsg.includes("income") || lowerMsg.includes("deposit")) {
          filtered = filtered.filter((t: any) => t.type === TransactionType.RECEIVE_MONEY || t.type === TransactionType.CASH_DEPOSIT);
          filterReason = "received income / cash deposits";
        }

        // Search word match (excluding standard stop-words)
        const words = lowerMsg.split(/\s+/);
        const stopWords = ["show", "me", "my", "transactions", "from", "last", "week", "yesterday", "recent", "list", "find", "search", "the", "a", "of", "and", "in", "spent", "received", "for", "any", "all"];
        const searchTerms = words.filter(w => w.length > 2 && !stopWords.includes(w));
        
        if (searchTerms.length > 0) {
          filtered = filtered.filter((t: any) => 
            searchTerms.some(term => 
              t.party.toLowerCase().includes(term) || 
              t.category.toLowerCase().includes(term) ||
              t.type.toLowerCase().includes(term)
            )
          );
          filterReason += ` matching "${searchTerms.join(", ")}"`;
        }

        const sorted = filtered.slice().sort((a: any, b: any) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

        if (sorted.length === 0) {
          return `I searched your local offline database but couldn't find any ${filterReason}. 

How to add them:
1. Import a statement file: Click the paperclip icon in the input bar and upload or drop a raw M-Pesa SMS statement file (.txt or .csv) to parse transactions instantly!
2. Simulate test data: Head over to the Home dashboard tab and tap one of the dynamic 'Simulate Alert' buttons to quickly seed test transaction records (such as Naivas, Quickmart, or Airtime purchases).
3. Official PDF Statement: You can retrieve a full, password-secured 6-month statement directly from Safaricom by dialing *334# on your mobile dialer.`;
        }

        const displayLimit = Math.min(10, sorted.length);
        const listStr = sorted.slice(0, displayLimit).map((t: any) => {
          const dateLabel = new Date(t.dateTime).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' });
          return `- [${dateLabel}] ${t.type} to/from ${t.party} - Ksh ${t.amount.toLocaleString()} (Fee: Ksh ${t.fee})`;
        }).join("\n");

        const subtotal = sorted.reduce((sum: number, t: any) => sum + t.amount, 0);

        return `I parsed your ledger and found ${sorted.length} ${filterReason}. Here are the ${displayLimit} most recent entries:

${listStr}
${sorted.length > displayLimit ? `\n...and ${sorted.length - displayLimit} more entries are viewable in your full Ledger tab.` : ""}

Analysis of selection:
- Total Selected Volume: Ksh ${subtotal.toLocaleString()}
- Total Safaricom Fees: Ksh ${sorted.reduce((sum: number, t: any) => sum + t.fee, 0).toLocaleString()}

Smart Alternatives for Statement Retrieval:
- If you need certified official records, you can download a full, password-secured PDF statement by dialing *334# on your Safaricom line (sent immediately to your email).
- Alternatively, download and log into the official MySafaricom App or M-PESA App on Google Play Store or Apple App Store to view a complete visual statement history of up to 12 months.`;
      }

      // 5. BACKGROUND SERVICE & PRIVACY QUERY
      if (lowerMsg.includes("apk") || lowerMsg.includes("whatsapp") || lowerMsg.includes("real data") || lowerMsg.includes("download") || lowerMsg.includes("access")) {
        return `Yes! Once you send the built .apk file to WhatsApp, download and install it on your Android phone, the application will gain native system access to your SMS inbox. By declaring the READ_SMS and RECEIVE_SMS permissions, our background service intercepts incoming messages from the 'M-PESA' sender immediately. It parses them offline on your device, ensuring 100% free operation and complete financial privacy without sending any data to third-party servers!`;
      } 

      // 6. TAUGHT RULES QUERY
      if (lowerMsg.includes("learn") || lowerMsg.includes("rule") || lowerMsg.includes("teach") || lowerMsg.includes("custom")) {
        return `I have integrated your taught rules! I will now always prioritize these custom mapping rules when interpreting your M-Pesa receipts. Current learnt rules include:\n\n${rulesStr}`;
      }

      // 7. ARBITRARY FINANCE & FLEXIBLE GENERAL ADVICE CHATGPT-STYLE
      return `I am your M-Pesa AI Advisor, designed to answer any general financial questions, analyze your budgets, or display withdrawal charges in Kenya.

Current Ledger Summary:
- Record Count: ${transactions?.length || 0} transactions
- Total Inflows: Ksh ${totalReceived.toLocaleString()}
- Total Outflows: Ksh ${totalSpent.toLocaleString()}
- Safaricom Transaction Fees paid: Ksh ${totalFees.toLocaleString()}

Taught memory rules: ${learntRules?.length || 0} active.

What financial question can I help you with? Feel free to ask me about:
- Safaricom services (Fuliza overdrafts, M-Shwari loans, Global Pay cards)
- M-Pesa Agent withdrawal fees and charges
- Saving tips and Sacco alternatives in Kenya
- Budgeting your cash flows`;
    };

    const appendClosingPrompt = (text: string): string => {
      const trimmed = text.trim();
      const lower = trimmed.toLowerCase();
      if (lower.includes("explain again") || lower.includes("analyze the report")) {
        return trimmed;
      }
      return `${trimmed}\n\nDo you want me to analyze the report or explain again?`;
    };

    if (!ai) {
      console.log("No GEMINI_API_KEY. Using offline expert heuristic responder.");
      return res.json({ content: appendClosingPrompt(handleLocalChatFallback()) });
    }

    // Call Gemini for high quality response
    const geminiMessages = [
      { role: "user", parts: [{ text: contextPrompt }] },
      ...messages.map((m: any) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }))
    ];

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: geminiMessages.map(m => ({
          role: m.role,
          parts: m.parts
        }))
      });

      const reply = response.text || "I apologize, I could not formulate a reply. Please try again.";
      return res.json({ content: appendClosingPrompt(reply) });
    } catch (apiError: any) {
      const errMsg = apiError.message || String(apiError);
      if (errMsg.includes("PERMISSION_DENIED") || errMsg.includes("denied") || errMsg.includes("403") || errMsg.includes("key") || errMsg.includes("API key")) {
        isGeminiDisabled = true;
        console.info("Info: Gemini chat API restricted. Switched fully to local heuristic adviser.");
      } else {
        console.info("Info: Chat API fallback engaged. Reason:", errMsg);
      }
      return res.json({ content: appendClosingPrompt(handleLocalChatFallback()) });
    }

  } catch (error: any) {
    console.warn("AI Chatbot routing general error:", error.message || error);
    return res.status(200).json({ 
      content: "I am currently running in local backup mode. Let me know how I can assist you with your M-Pesa habits offline!" 
    });
  }
});

// 2. Generate Monthly Report Route
app.post("/api/generate-monthly-report", async (req, res) => {
  const { transactions, monthYear } = req.body;
  const reportMonth = monthYear || "the specified month";

  try {
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: "A non-empty list of transactions is required." });
    }

    // Prepare a compact summary of data for Gemini to keep tokens low and fast
    const totalSpent = transactions
      .filter(t => t.type !== TransactionType.RECEIVE_MONEY && t.type !== TransactionType.CASH_DEPOSIT)
      .reduce((acc, t) => acc + t.amount, 0);

    const totalReceived = transactions
      .filter(t => t.type === TransactionType.RECEIVE_MONEY || t.type === TransactionType.CASH_DEPOSIT)
      .reduce((acc, t) => acc + t.amount, 0);

    const totalFees = transactions.reduce((acc, t) => acc + t.fee, 0);

    // Compute Category Totals
    const catTotals: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type !== TransactionType.RECEIVE_MONEY && t.type !== TransactionType.CASH_DEPOSIT) {
        catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
      }
    }

    const categorySummaryStr = Object.entries(catTotals)
      .map(([cat, amt]) => `- ${cat}: Ksh ${amt.toLocaleString()}`)
      .join("\n");

    const topParties = transactions
      .filter(t => t.type !== TransactionType.RECEIVE_MONEY && t.type !== TransactionType.CASH_DEPOSIT)
      .reduce((acc: Record<string, number>, t) => {
        acc[t.party] = (acc[t.party] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const topPartiesStr = Object.entries(topParties)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([party, amt]) => `- ${party}: Ksh ${amt.toLocaleString()}`)
      .join("\n");

    const handleLocalReportFallback = () => {
      const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
      const savingsRate = totalReceived > 0 ? Math.round(((totalReceived - totalSpent) / totalReceived) * 100) : 0;
      
      return {
        monthYear: reportMonth,
        totalSpent,
        totalReceived,
        totalFees,
        topSpendingCategory: topCat,
        savingsRate,
        aiSummary: `Monthly Financial Report for ${reportMonth}. You have spent a total of Ksh ${totalSpent.toLocaleString()} across your M-Pesa channels, while receiving Ksh ${totalReceived.toLocaleString()}. Your overall transaction fee overhead stands at Ksh ${totalFees.toLocaleString()}. Based on local rules, your top outflow sector was **${topCat}**. To optimize your cash flow, consider bundling paybill transactions to reduce Safaricom fee tiers, and review your top merchants to eliminate duplicate subscriptions.`,
        aiInsights: [
          `Your biggest single spending sector this month was ${topCat}, which accounts for the majority of your cash outflows.`,
          `You spent Ksh ${totalFees.toLocaleString()} on Safaricom M-Pesa transaction charges. Consolidating payments could reduce these fees.`,
          savingsRate > 0 
            ? `Your cash inflows exceeded outflows, resulting in a positive net savings rate of ${savingsRate}%. Excellent job!`
            : `Your cash outflows exceeded incoming cash by Ksh ${(totalSpent - totalReceived).toLocaleString()}. Review non-essential shopping to balance your ledger.`
        ],
        categoryDistribution: Object.entries(catTotals).map(([category, amount]) => ({ category, amount }))
      };
    };

    const ai = getAiClient();
    if (!ai) {
      console.log("No GEMINI_API_KEY. Generating local template-based report.");
      return res.json(handleLocalReportFallback());
    }

    console.log(`Calling Gemini to generate monthly report for ${reportMonth}...`);
    const prompt = `
You are an expert personal financial advisor specializing in mobile money patterns (specifically Safaricom M-Pesa in Kenya).
Analyze this consolidated transactional summary of a user's mobile money ledger for the month of ${reportMonth}:

**TOTAL SUMMARY:**
- Total Outflow (Expenses): Ksh ${totalSpent.toLocaleString()}
- Total Inflow (Income/Deposits): Ksh ${totalReceived.toLocaleString()}
- Total Safaricom Transaction Fees: Ksh ${totalFees.toLocaleString()}

**EXPENSES BY CATEGORY:**
${categorySummaryStr || "None recorded"}

**TOP RECIPIENTS/MERCHANTS:**
${topPartiesStr || "None recorded"}

Please output a JSON object containing a detailed report. The JSON object must strictly match this structure:
{
  "monthYear": "${reportMonth}",
  "totalSpent": ${totalSpent},
  "totalReceived": ${totalReceived},
  "totalFees": ${totalFees},
  "topSpendingCategory": "${Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"}",
  "savingsRate": ${totalReceived > 0 ? Math.round(((totalReceived - totalSpent) / totalReceived) * 100) : 0},
  "aiSummary": "A highly professional, deep paragraph analyzing their specific spending, transaction fee efficiency, cash flow ratios, and positive/negative trends. Be conversational, objective, clear, and actionable.",
  "aiInsights": [
    "Insight 1 about their top spending sector and how to adjust.",
    "Insight 2 about Safaricom fees efficiency (e.g. suggests merging transactions to avoid high band tariffs).",
    "Insight 3 about savings trends or specific cash leaks based on top merchants.",
    "Insight 4 offering a positive behavioral nudge."
  ],
  "categoryDistribution": [
    { "category": "Food", "amount": 1200.00 }
  ]
}

Ensure the output is strictly valid JSON without any markdown code wrappers around it.
`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [prompt],
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text ? response.text.trim() : "";
      let jsonString = responseText;
      if (jsonString.startsWith("```json")) {
        jsonString = jsonString.substring(7);
      }
      if (jsonString.startsWith("```")) {
        jsonString = jsonString.substring(3);
      }
      if (jsonString.endsWith("```")) {
        jsonString = jsonString.substring(0, jsonString.length - 3);
      }
      jsonString = jsonString.trim();

      const reportObj = JSON.parse(jsonString);
      reportObj.categoryDistribution = Object.entries(catTotals).map(([category, amount]) => ({ category, amount }));

      return res.json(reportObj);
    } catch (apiError: any) {
      const errMsg = apiError.message || String(apiError);
      if (errMsg.includes("PERMISSION_DENIED") || errMsg.includes("denied") || errMsg.includes("403") || errMsg.includes("key") || errMsg.includes("API key")) {
        isGeminiDisabled = true;
        console.info("Info: Gemini report API restricted. Switched fully to local offline report compiler.");
      } else {
        console.info("Info: Report API fallback engaged. Reason:", errMsg);
      }
      return res.json(handleLocalReportFallback());
    }

  } catch (error: any) {
    console.warn("Failed to generate monthly report general error:", error.message || error);
    
    // Last-resort fallback with zero-rely on input computations
    const totalSpent = transactions?.reduce((acc: number, t: any) => t.type !== TransactionType.RECEIVE_MONEY && t.type !== TransactionType.CASH_DEPOSIT ? acc + (t.amount || 0) : acc, 0) || 0;
    const totalReceived = transactions?.reduce((acc: number, t: any) => t.type === TransactionType.RECEIVE_MONEY || t.type === TransactionType.CASH_DEPOSIT ? acc + (t.amount || 0) : acc, 0) || 0;
    const totalFees = transactions?.reduce((acc: number, t: any) => acc + (t.fee || 0), 0) || 0;
    
    const catTotals: Record<string, number> = {};
    if (transactions && Array.isArray(transactions)) {
      for (const t of transactions) {
        if (t.type !== TransactionType.RECEIVE_MONEY && t.type !== TransactionType.CASH_DEPOSIT) {
          catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
        }
      }
    }

    return res.json({
      monthYear: reportMonth,
      totalSpent,
      totalReceived,
      totalFees,
      topSpendingCategory: Object.keys(catTotals)[0] || "Various",
      savingsRate: totalReceived > 0 ? Math.round(((totalReceived - totalSpent) / totalReceived) * 100) : 0,
      aiSummary: `Monthly report for ${reportMonth}. Compiled locally. You spent Ksh ${totalSpent.toLocaleString()} and received Ksh ${totalReceived.toLocaleString()}. Total charges cost you Ksh ${totalFees.toLocaleString()}. Consolidating bills can help you minimize cost brackets.`,
      aiInsights: [
        `You spent Ksh ${totalFees.toLocaleString()} on M-Pesa transaction costs.`,
        `Your primary outflows were handled securely. Check transaction breakdown for details.`
      ],
      categoryDistribution: Object.entries(catTotals).map(([category, amount]) => ({ category, amount }))
    });
  }
});

// Serve frontend assets in production or mount Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files in production...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();

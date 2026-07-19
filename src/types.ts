/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TransactionType {
  SEND_MONEY = "Send Money",
  PAY_BILL = "Pay Bill",
  BUY_GOODS = "Buy Goods (Lipa Na M-Pesa)",
  RECEIVE_MONEY = "Receive Money",
  CASH_DEPOSIT = "Cash Deposit",
  CASH_WITHDRAWAL = "Cash Withdrawal",
  AIRTIME = "Buy Airtime",
  FUNDS_TRANSFER = "Funds Transfer",
  FEE_PAYMENT = "Fee / Other Cost",
  UNKNOWN = "Unknown"
}

export interface MpesaTransaction {
  id: string; // e.g. QX728HJ189
  rawSms: string; // Original SMS message
  amount: number; // Ksh amount
  fee: number; // Transaction cost
  type: TransactionType; // Extracted type
  party: string; // The person, business, paybill or agent name
  dateTime: string; // ISO String or parseable datetime string (e.g. 2026-07-15T14:30:00)
  balance: number; // Account balance after transaction
  category: string; // e.g. Food, Utilities, Transport, Shopping, Leisure, Income, Fees, Miscellaneous
  notes?: string;
}

export interface CategoryBudget {
  category: string;
  limit: number;
  spent: number;
  color: string;
}

export interface MonthlyReport {
  monthYear: string; // e.g., "July 2026"
  totalSpent: number;
  totalReceived: number;
  totalFees: number;
  topSpendingCategory: string;
  savingsRate: number; // percentage of incoming money saved
  aiSummary: string; // Detailed Gemini-generated summary
  aiInsights: string[]; // Key takeaways
  categoryDistribution: { category: string; amount: number }[];
}

export interface ParseResult {
  transactions: MpesaTransaction[];
  failedCount: number;
}

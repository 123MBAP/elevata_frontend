/**
 * Ledger classification rules.
 *
 * Every money movement in the activities journal is sorted into:
 *  - a P&L line (does it change profit?), and
 *  - a cash-flow section (operating / investing / financing).
 *
 * Keep this file in sync with backend/src/utils/ledgerClassification.js.
 */

export type PnlClass = 'revenue' | 'other_income' | 'cogs' | 'opex' | 'none';
export type CashFlowClass = 'operating' | 'investing' | 'financing';

export interface Classification {
  pnl: PnlClass;
  cashFlow: CashFlowClass;
  /** Short explanation shown in reports, e.g. "Financing — not income". */
  note?: string;
}

/** Reasons offered on the Cash In form. Value = what is stored as the entry category. */
export const CASH_IN_REASONS: { value: string; label: string; classification: Classification }[] = [
  { value: 'Loan received', label: 'Bank / MFI loan received', classification: { pnl: 'none', cashFlow: 'financing', note: 'Loan — a liability, not income' } },
  { value: 'Owner capital injection', label: 'Owner capital injection', classification: { pnl: 'none', cashFlow: 'financing', note: 'Owner equity — not income' } },
  { value: 'Grant received', label: 'Donor / government grant', classification: { pnl: 'other_income', cashFlow: 'operating' } },
  { value: 'Customer advance', label: 'Customer advance / deposit', classification: { pnl: 'none', cashFlow: 'operating', note: 'Owed to the customer until delivered' } },
  { value: 'Receivable collected', label: 'Payment collected for an earlier credit sale', classification: { pnl: 'none', cashFlow: 'operating', note: 'Revenue was already counted at the sale' } },
  { value: 'Asset disposal', label: 'Sale of equipment / fixed asset', classification: { pnl: 'none', cashFlow: 'investing' } },
  { value: 'Other inflow', label: 'Other income', classification: { pnl: 'other_income', cashFlow: 'operating' } }
];

/** Categories offered on the Cash Out form. */
export const CASH_OUT_CATEGORIES: { value: string; label: string; group: 'expense' | 'non_expense'; classification: Classification }[] = [
  { value: 'Utilities', label: 'Utilities (water, power, internet)', group: 'expense', classification: { pnl: 'opex', cashFlow: 'operating' } },
  { value: 'Rent', label: 'Rent & facility leases', group: 'expense', classification: { pnl: 'opex', cashFlow: 'operating' } },
  { value: 'Salaries', label: 'Staff salaries & wages', group: 'expense', classification: { pnl: 'opex', cashFlow: 'operating' } },
  { value: 'Repairs', label: 'Repairs & maintenance', group: 'expense', classification: { pnl: 'opex', cashFlow: 'operating' } },
  { value: 'Transport', label: 'Transport, fuel & delivery', group: 'expense', classification: { pnl: 'opex', cashFlow: 'operating' } },
  { value: 'Marketing', label: 'Marketing & promotion', group: 'expense', classification: { pnl: 'opex', cashFlow: 'operating' } },
  { value: 'Taxes', label: 'Taxes, levies & RRA', group: 'expense', classification: { pnl: 'opex', cashFlow: 'operating' } },
  { value: 'General Expenses', label: 'General office expenses', group: 'expense', classification: { pnl: 'opex', cashFlow: 'operating' } },
  { value: 'Loan Repayment', label: 'Loan repayment', group: 'non_expense', classification: { pnl: 'none', cashFlow: 'financing', note: 'Reduces the loan — not an expense' } },
  { value: 'Supplier Settlement', label: 'Payment to supplier for an earlier credit purchase', group: 'non_expense', classification: { pnl: 'none', cashFlow: 'operating', note: 'The purchase was already recorded' } },
  { value: 'Owner Drawing', label: 'Owner drawing / dividend', group: 'non_expense', classification: { pnl: 'none', cashFlow: 'financing', note: 'Paid to the owner — not an expense' } },
  { value: 'Asset Purchase', label: 'Equipment / fixed asset purchase', group: 'non_expense', classification: { pnl: 'none', cashFlow: 'investing', note: 'Becomes an asset — not an expense' } }
];

const cashInIndex = new Map(CASH_IN_REASONS.map((r) => [r.value.toLowerCase(), r.classification]));
const cashOutIndex = new Map(CASH_OUT_CATEGORIES.map((c) => [c.value.toLowerCase(), c.classification]));

export const classifyCashIn = (category?: string): Classification =>
  cashInIndex.get((category || '').trim().toLowerCase()) || { pnl: 'other_income', cashFlow: 'operating' };

export const classifyCashOut = (category?: string): Classification =>
  cashOutIndex.get((category || '').trim().toLowerCase()) || { pnl: 'opex', cashFlow: 'operating' };

/** Payment methods that mean "not paid yet". */
export const CREDIT_PAYMENT_METHOD = 'Credit / Receivable';
export const isCreditPayment = (method?: string) => (method || '').toLowerCase().startsWith('credit');

/** Sale / purchase is settled in cash unless it was on credit, pending, partial or cancelled. */
export const isSettled = (status?: string, paymentMethod?: string) => {
  const s = (status || 'Completed').toLowerCase();
  if (s === 'cancelled' || s === 'pending' || s === 'partial') return false;
  return !isCreditPayment(paymentMethod);
};

export const isCancelled = (status?: string) => (status || '').toLowerCase() === 'cancelled';

/** Local-time YYYY-MM-DD (toISOString() would shift to UTC and can return yesterday). */
export const toLocalInputDate = (date: Date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Parse a YYYY-MM-DD form value as local midnight (new Date('YYYY-MM-DD') is UTC). */
export const fromLocalInputDate = (value?: string) => {
  if (!value) return new Date();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
};

import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  BarChart3,
  ShoppingBag,
  Truck,
  ArrowDownLeft,
  ListChecks,
  Search,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import {
  classifyCashIn,
  classifyCashOut,
  isCancelled,
  isSettled,
  toLocalInputDate,
  type CashFlowClass,
  type PnlClass
} from '../lib/ledgerClassification';

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type ReportTab = 'pnl' | 'cashflow' | 'sales_journal' | 'purchases_cogs' | 'activity_log';
type RowType = 'Sale' | 'Purchase' | 'Cash In' | 'Cash Out' | 'Expense' | 'Activity';
type PaymentFilter = 'all' | 'settled' | 'unsettled';

type LedgerRow = {
  key: string;
  date: Date;
  type: RowType;
  description: string;
  counterparty?: string;
  category?: string;
  invoiceRef?: string;
  paymentMethod?: string;
  status: string;
  /** Always positive; direction tells which way it moved. */
  amount: number;
  direction: 'in' | 'out' | 'none';
  pnl: PnlClass;
  cashFlow: CashFlowClass;
  /** True when money actually changed hands (not credit / pending / cancelled). */
  cashMoved: boolean;
  /** Cost of the goods sold on this sale (sales only). */
  cogs: number;
  /** Sale lines whose cost price is unknown. */
  cogsMissingLines: number;
  note?: string;
};

const TYPE_BADGE: Record<RowType, string> = {
  Sale: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Purchase: 'bg-blue-50 text-blue-700 border-blue-200',
  'Cash In': 'bg-teal-50 text-teal-700 border-teal-200',
  'Cash Out': 'bg-amber-50 text-amber-700 border-amber-200',
  Expense: 'bg-amber-50 text-amber-700 border-amber-200',
  Activity: 'bg-purple-50 text-purple-700 border-purple-200'
};

const PNL_LABEL: Record<PnlClass, string> = {
  revenue: 'Revenue',
  other_income: 'Other income',
  cogs: 'Cost of goods sold',
  opex: 'Operating expense',
  none: 'Not in P&L'
};

const CASHFLOW_LABEL: Record<CashFlowClass, string> = {
  operating: 'Operating',
  investing: 'Investing',
  financing: 'Financing'
};

const safeDate = (value: string | undefined) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const periodStart = (period: Period) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (period === 'week') date.setDate(date.getDate() - 6);
  if (period === 'month') date.setDate(1);
  if (period === 'quarter') date.setMonth(Math.floor(date.getMonth() / 3) * 3, 1);
  if (period === 'year') date.setMonth(0, 1);
  return date;
};

/** Monday of the week containing `date`, as YYYY-MM-DD. */
const weekKey = (date: Date) => {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

const signed = (row: LedgerRow) => (row.direction === 'in' ? row.amount : row.direction === 'out' ? -row.amount : 0);

export default function ReportsWorkspace() {
  const { activeSme, products } = useApp();
  const [activeTab, setActiveTab] = useState<ReportTab>('pnl');
  const [period, setPeriod] = useState<Period>('month');
  const [from, setFrom] = useState(toLocalInputDate(periodStart('month')));
  const [to, setTo] = useState(toLocalInputDate(new Date()));
  const [exportOpen, setExportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | RowType>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');

  // Cost price lookup used to compute cost of goods sold (by product id, then by name).
  const costLookup = useMemo(() => {
    const byId = new Map<string, number>();
    const byName = new Map<string, number>();
    const catalog = products?.length ? products : [];
    catalog.forEach((p) => {
      const cost = Number(p.costPrice || 0);
      if (cost > 0) {
        byId.set(String(p.id), cost);
        byName.set(p.name.trim().toLowerCase(), cost);
      }
    });
    (activeSme.inventoryItems || []).forEach((item) => {
      const cost = Number(item.costPrice || 0);
      if (cost > 0 && !byId.has(String(item.id))) byId.set(String(item.id), cost);
      if (cost > 0 && !byName.has(item.name.trim().toLowerCase())) byName.set(item.name.trim().toLowerCase(), cost);
    });
    return (productId?: string, name?: string) =>
      (productId && byId.get(String(productId))) || (name && byName.get(name.trim().toLowerCase())) || 0;
  }, [products, activeSme.inventoryItems]);

  // Unified ledger: every money movement, classified.
  const ledger = useMemo<LedgerRow[]>(() => {
    const rows: LedgerRow[] = [];

    activeSme.sales.forEach((sale) => {
      const cancelled = isCancelled(sale.status);
      let cogs = 0;
      let missing = 0;
      const items = sale.items?.length
        ? sale.items
        : [{ productName: sale.product, quantity: sale.quantity, unitPrice: sale.price, unit: sale.unit || 'pcs', total: sale.total }];
      items.forEach((item) => {
        const unitCost = costLookup((item as { productId?: string }).productId, item.productName);
        if (unitCost > 0) cogs += unitCost * Number(item.quantity || 0);
        else missing += 1;
      });
      rows.push({
        key: `sale-${sale.id}`,
        date: safeDate(sale.date),
        type: 'Sale',
        description: sale.product || 'Sale',
        counterparty: sale.customer,
        category: sale.status || 'Completed',
        invoiceRef: sale.invoiceNumber,
        paymentMethod: sale.paymentMethod || 'Cash',
        status: sale.status || 'Completed',
        amount: Number(sale.total) || 0,
        direction: cancelled ? 'none' : 'in',
        pnl: cancelled ? 'none' : 'revenue',
        cashFlow: 'operating',
        cashMoved: !cancelled && isSettled(sale.status, sale.paymentMethod),
        cogs: cancelled ? 0 : cogs,
        cogsMissingLines: cancelled ? 0 : missing,
        note: cancelled ? 'Cancelled' : !isSettled(sale.status, sale.paymentMethod) ? 'Not paid yet — owed by customer' : undefined
      });
    });

    (activeSme.purchases || []).forEach((purchase) => {
      const cancelled = isCancelled(purchase.status);
      const first = purchase.items?.[0];
      rows.push({
        key: `purchase-${purchase.id}`,
        date: safeDate(purchase.date),
        type: 'Purchase',
        description: first ? `${first.productName}${purchase.items!.length > 1 ? ` (+${purchase.items!.length - 1} items)` : ''}` : 'Stock purchase',
        counterparty: purchase.supplier,
        category: 'Stock / inventory',
        invoiceRef: purchase.invoiceRef,
        paymentMethod: purchase.paymentMethod || 'Cash',
        status: purchase.status || 'Completed',
        amount: Number(purchase.totalAmount) || 0,
        direction: cancelled ? 'none' : 'out',
        // Stock bought becomes inventory; it is expensed (as COGS) only when sold.
        pnl: 'none',
        cashFlow: 'operating',
        cashMoved: !cancelled && isSettled(purchase.status, purchase.paymentMethod),
        cogs: 0,
        cogsMissingLines: 0,
        note: !isSettled(purchase.status, purchase.paymentMethod) ? 'Not paid yet — owed to supplier' : 'Added to stock; cost counted when sold'
      });
    });

    (activeSme.cashIns || []).forEach((cash) => {
      const cls = classifyCashIn(cash.category || cash.reason);
      rows.push({
        key: `cashin-${cash.id}`,
        date: safeDate(cash.date),
        type: 'Cash In',
        description: cash.reason,
        counterparty: cash.source,
        category: cash.category || cash.reason,
        invoiceRef: (cash.metadata?.reference as string) || undefined,
        paymentMethod: cash.paymentMethod || 'Bank Transfer',
        status: cash.status || 'Completed',
        amount: Number(cash.amount) || 0,
        direction: 'in',
        pnl: cls.pnl,
        cashFlow: cls.cashFlow,
        cashMoved: isSettled(cash.status),
        cogs: 0,
        cogsMissingLines: 0,
        note: cls.note
      });
    });

    (activeSme.cashOuts || []).forEach((cash) => {
      const cls = classifyCashOut(cash.category);
      rows.push({
        key: `cashout-${cash.id}`,
        date: safeDate(cash.date),
        type: 'Cash Out',
        description: cash.description,
        counterparty: (cash.metadata?.payee as string) || undefined,
        category: cash.category || 'Expense',
        invoiceRef: (cash.metadata?.voucherRef as string) || undefined,
        paymentMethod: cash.paymentMethod || 'Cash',
        status: cash.status || 'Completed',
        amount: Number(cash.amount) || 0,
        direction: 'out',
        pnl: cls.pnl,
        cashFlow: cls.cashFlow,
        cashMoved: isSettled(cash.status),
        cogs: 0,
        cogsMissingLines: 0,
        note: cls.note
      });
    });

    (activeSme.expenses || []).forEach((expense) => {
      rows.push({
        key: `expense-${expense.id}`,
        date: safeDate(expense.date),
        type: 'Expense',
        description: expense.description,
        category: expense.category,
        status: 'Completed',
        amount: Number(expense.amount) || 0,
        direction: 'out',
        pnl: 'opex',
        cashFlow: 'operating',
        cashMoved: true,
        cogs: 0,
        cogsMissingLines: 0
      });
    });

    // Milestones are shown in the activity log only; their value is a budget, not a movement of money.
    (activeSme.otherActivities || []).forEach((act) => {
      rows.push({
        key: `activity-${act.id}`,
        date: safeDate(act.date),
        type: 'Activity',
        description: act.title,
        category: act.category,
        status: act.status || 'Completed',
        amount: Number(act.amount) || 0,
        direction: 'none',
        pnl: 'none',
        cashFlow: 'operating',
        cashMoved: false,
        cogs: 0,
        cogsMissingLines: 0,
        note: act.amount ? 'Budget / contract value — record the actual payment as Cash In or Cash Out' : undefined
      });
    });

    return rows.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [activeSme, costLookup]);

  const filteredByDate = useMemo(() => {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T23:59:59.999`);
    return ledger.filter((row) => row.date >= start && row.date <= end);
  }, [ledger, from, to]);

  const tabRows = (tab: ReportTab, rows: LedgerRow[]) => {
    if (tab === 'pnl') return rows.filter((r) => r.pnl !== 'none' || r.type === 'Sale');
    if (tab === 'cashflow') return rows.filter((r) => r.cashMoved);
    if (tab === 'sales_journal') return rows.filter((r) => r.type === 'Sale');
    if (tab === 'purchases_cogs') return rows.filter((r) => r.type === 'Purchase');
    return rows;
  };

  const tabFiltered = useMemo(() => {
    let rows = tabRows(activeTab, filteredByDate);
    if (typeFilter !== 'all') rows = rows.filter((r) => r.type === typeFilter);
    if (paymentFilter === 'settled') rows = rows.filter((r) => r.cashMoved);
    if (paymentFilter === 'unsettled') rows = rows.filter((r) => !r.cashMoved && r.direction !== 'none');
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter((r) =>
        [r.description, r.counterparty, r.category, r.invoiceRef, r.paymentMethod]
          .some((field) => field && field.toLowerCase().includes(q))
      );
    }
    return rows;
  }, [filteredByDate, activeTab, typeFilter, paymentFilter, searchTerm]);

  // Financial statements for the selected period.
  const totals = useMemo(() => {
    const rows = filteredByDate;
    const sum = (list: LedgerRow[], pick: (r: LedgerRow) => number = (r) => r.amount) => list.reduce((s, r) => s + pick(r), 0);

    const revenue = sum(rows.filter((r) => r.pnl === 'revenue'));
    const cogs = sum(rows.filter((r) => r.type === 'Sale'), (r) => r.cogs);
    const cogsMissingLines = sum(rows.filter((r) => r.type === 'Sale'), (r) => r.cogsMissingLines);
    const grossProfit = revenue - cogs;
    const opexRows = rows.filter((r) => r.pnl === 'opex');
    const opex = sum(opexRows);
    const opexByCategory = Array.from(
      opexRows.reduce((map, r) => map.set(r.category || 'Other', (map.get(r.category || 'Other') || 0) + r.amount), new Map<string, number>())
    ).sort((a, b) => b[1] - a[1]);
    const otherIncome = sum(rows.filter((r) => r.pnl === 'other_income'));
    const operatingProfit = grossProfit - opex;
    const netProfit = operatingProfit + otherIncome;

    const cashRows = rows.filter((r) => r.cashMoved);
    const flow = (section: CashFlowClass) => {
      const list = cashRows.filter((r) => r.cashFlow === section);
      const inflow = sum(list.filter((r) => r.direction === 'in'));
      const outflow = sum(list.filter((r) => r.direction === 'out'));
      return { inflow, outflow, net: inflow - outflow };
    };
    const operating = flow('operating');
    const investing = flow('investing');
    const financing = flow('financing');

    const receivables = sum(rows.filter((r) => r.type === 'Sale' && r.direction === 'in' && !r.cashMoved));
    const payables = sum(rows.filter((r) => r.type === 'Purchase' && r.direction === 'out' && !r.cashMoved));
    const purchasesTotal = sum(rows.filter((r) => r.type === 'Purchase' && r.direction === 'out'));
    const salesCount = rows.filter((r) => r.type === 'Sale' && r.direction === 'in').length;

    return {
      revenue,
      cogs,
      cogsMissingLines,
      grossProfit,
      grossMargin: revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0,
      opex,
      opexByCategory,
      otherIncome,
      operatingProfit,
      netProfit,
      netMargin: revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0,
      operating,
      investing,
      financing,
      netCash: operating.net + investing.net + financing.net,
      receivables,
      payables,
      purchasesTotal,
      salesCount
    };
  }, [filteredByDate]);

  // Chart: P&L view per bucket (revenue, costs = COGS + opex, profit).
  const chartData = useMemo(() => {
    const buckets = new Map<string, { label: string; Revenue: number; Costs: number; Profit: number }>();
    filteredByDate.slice().reverse().forEach((row) => {
      const revenue = row.pnl === 'revenue' || row.pnl === 'other_income' ? row.amount : 0;
      const costs = row.cogs + (row.pnl === 'opex' ? row.amount : 0);
      if (!revenue && !costs) return;
      let key: string;
      let label: string;
      if (period === 'day' || period === 'week') {
        key = toLocalInputDate(row.date);
        label = row.date.toLocaleDateString([], { day: '2-digit', month: 'short' });
      } else if (period === 'month') {
        const monday = weekKey(row.date);
        key = toLocalInputDate(monday);
        label = `Week of ${monday.toLocaleDateString([], { day: '2-digit', month: 'short' })}`;
      } else {
        key = `${row.date.getFullYear()}-${String(row.date.getMonth() + 1).padStart(2, '0')}`;
        label = row.date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      }
      const bucket = buckets.get(key) || { label, Revenue: 0, Costs: 0, Profit: 0 };
      bucket.Revenue += revenue;
      bucket.Costs += costs;
      bucket.Profit += revenue - costs;
      buckets.set(key, bucket);
    });
    return Array.from(buckets.values());
  }, [filteredByDate, period]);

  const selectPeriod = (next: Period) => {
    setPeriod(next);
    setFrom(toLocalInputDate(periodStart(next)));
    setTo(toLocalInputDate(new Date()));
  };

  const tabsConfig: { id: ReportTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'pnl', label: 'Profit & Loss', icon: <TrendingUp className="w-4 h-4" />, color: 'text-emerald-600' },
    { id: 'cashflow', label: 'Cash Flow', icon: <ArrowDownLeft className="w-4 h-4" />, color: 'text-teal-600' },
    { id: 'sales_journal', label: 'Sales Book', icon: <ShoppingBag className="w-4 h-4" />, color: 'text-blue-600' },
    { id: 'purchases_cogs', label: 'Purchases & Stock Cost', icon: <Truck className="w-4 h-4" />, color: 'text-amber-600' },
    { id: 'activity_log', label: 'Full Activity Log', icon: <ListChecks className="w-4 h-4" />, color: 'text-purple-600' }
  ];
  const activeTabLabel = tabsConfig.find((t) => t.id === activeTab)?.label || 'Report';

  // Statement lines for the active tab (used on screen and in exports).
  const statementLines = useMemo<{ label: string; amount: number; strong?: boolean; indent?: boolean }[]>(() => {
    if (activeTab === 'pnl') {
      return [
        { label: 'Sales revenue', amount: totals.revenue },
        { label: 'Cost of goods sold', amount: -totals.cogs },
        { label: 'Gross profit', amount: totals.grossProfit, strong: true },
        ...totals.opexByCategory.map(([label, amount]) => ({ label, amount: -amount, indent: true })),
        { label: 'Total operating expenses', amount: -totals.opex },
        { label: 'Operating profit', amount: totals.operatingProfit, strong: true },
        { label: 'Other income (grants, other)', amount: totals.otherIncome },
        { label: 'Net profit', amount: totals.netProfit, strong: true }
      ];
    }
    if (activeTab === 'cashflow') {
      const section = (name: string, f: { inflow: number; outflow: number; net: number }) => [
        { label: `${name} — money in`, amount: f.inflow, indent: true },
        { label: `${name} — money out`, amount: -f.outflow, indent: true },
        { label: `Net ${name.toLowerCase()} cash`, amount: f.net, strong: true }
      ];
      return [
        ...section('Operating', totals.operating),
        ...section('Investing', totals.investing),
        ...section('Financing', totals.financing),
        { label: 'Net change in cash', amount: totals.netCash, strong: true }
      ];
    }
    if (activeTab === 'sales_journal') {
      return [
        { label: 'Total sales', amount: totals.revenue, strong: true },
        { label: 'Paid', amount: totals.revenue - totals.receivables, indent: true },
        { label: 'Not paid yet (owed by customers)', amount: totals.receivables, indent: true },
        { label: 'Cost of goods sold', amount: -totals.cogs },
        { label: 'Gross profit', amount: totals.grossProfit, strong: true }
      ];
    }
    if (activeTab === 'purchases_cogs') {
      return [
        { label: 'Stock purchased in period', amount: totals.purchasesTotal, strong: true },
        { label: 'Paid', amount: totals.purchasesTotal - totals.payables, indent: true },
        { label: 'Not paid yet (owed to suppliers)', amount: totals.payables, indent: true },
        { label: 'Cost of goods actually sold', amount: totals.cogs, strong: true }
      ];
    }
    return [];
  }, [activeTab, totals]);

  const fileBase = `${activeSme.name.replace(/\W+/g, '_')}_${activeTab}_${from}_${to}`;
  const exportRows = tabFiltered.map((row) => ({
    Date: toLocalInputDate(row.date),
    Type: row.type,
    Description: row.description,
    Counterparty: row.counterparty || '',
    Category: row.category || '',
    Reference: row.invoiceRef || '',
    Payment_Method: row.paymentMethod || '',
    Status: row.status,
    PnL_Line: PNL_LABEL[row.pnl],
    Cash_Flow_Section: row.cashMoved ? CASHFLOW_LABEL[row.cashFlow] : 'No cash moved',
    Amount_RWF: signed(row),
    Note: row.note || ''
  }));

  const exportExcel = () => {
    const workbook = XLSX.utils.book_new();
    if (statementLines.length) {
      const sheet = XLSX.utils.json_to_sheet(statementLines.map((l) => ({ Line: l.label, Amount_RWF: l.amount })));
      XLSX.utils.book_append_sheet(workbook, sheet, 'Statement');
    }
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(exportRows), 'Entries');
    XLSX.writeFile(workbook, `${fileBase}.xlsx`);
    setExportOpen(false);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text(`${activeSme.name} — ${activeTabLabel}`, 14, 15);
    doc.setFontSize(9);
    doc.text(`Period: ${from} to ${to} | Generated: ${toLocalInputDate(new Date())} | Unaudited, prepared from recorded activities`, 14, 21);
    let startY = 26;
    if (statementLines.length) {
      autoTable(doc, {
        startY,
        head: [['Statement line', 'Amount (FRW)']],
        body: statementLines.map((l) => [`${l.indent ? '   ' : ''}${l.label}`, l.amount.toLocaleString()]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 152, 214] },
        tableWidth: 140
      });
      startY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || startY) + 8;
    }
    autoTable(doc, {
      startY,
      head: [['Date', 'Type', 'Description', 'Party', 'Ref #', 'Payment', 'Status', 'P&L line', 'Amount (FRW)']],
      body: exportRows.map((r) => [r.Date, r.Type, r.Description, r.Counterparty, r.Reference, r.Payment_Method, r.Status, r.PnL_Line, r.Amount_RWF.toLocaleString()]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [41, 152, 214] }
    });
    doc.save(`${fileBase}.pdf`);
    setExportOpen(false);
  };

  const tabCount = (tab: ReportTab) => tabRows(tab, filteredByDate).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal text-[#1e293b] font-heading">Financial Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Profit, cash flow and journals for <span className="font-semibold text-slate-700">{activeSme.name}</span>, prepared from your recorded activities (not audited).
          </p>
        </div>

        <div className="relative flex items-center gap-2 self-start sm:self-auto">
          <button type="button" onClick={() => setExportOpen((v) => !v)} disabled={!tabFiltered.length && !statementLines.length} className="accounting-btn-primary">
            <Download className="w-3.5 h-3.5" />
            <span>Export {activeTabLabel}</span>
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-10 z-30 w-48 rounded-[4px] border border-[#cbd5e1] bg-white p-1.5 shadow-xl">
              <button type="button" onClick={exportPdf} className="flex w-full items-center gap-2 rounded-[3px] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                <FileText className="h-4 w-4 text-[#2998d6]" />
                <span>Export PDF</span>
              </button>
              <button type="button" onClick={exportExcel} className="flex w-full items-center gap-2 rounded-[3px] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Export Excel (.xlsx)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        {/* Report tabs */}
        <div className="flex items-end overflow-x-auto scrollbar-none z-10 relative space-x-1 sm:space-x-1.5 -mb-[1px]">
          {tabsConfig.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-t-[6px] text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap select-none border-t border-x ${
                  isActive
                    ? 'bg-white text-slate-900 font-bold border-[#cbd5e1] border-b-white border-b-2 z-20 -mb-[1px]'
                    : 'bg-[#f1f5f9] hover:bg-[#e4eaf2] text-[#475569] font-medium border-[#cbd5e1] border-b-[#cbd5e1]'
                }`}
              >
                {isActive && <span className="absolute top-0 left-0 right-0 h-[3px] bg-[#2998d6] rounded-t-[6px]" />}
                <span className={isActive ? tab.color : 'text-slate-400'}>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${isActive ? 'bg-[#2998d6] text-white' : 'bg-[#cbd5e1] text-[#334155]'}`}>
                  {tabCount(tab.id)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="accounting-card p-5 sm:p-7 relative z-0 border-[#cbd5e1] rounded-t-none space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="accounting-label">Reporting period</label>
              <select value={period} onChange={(e) => selectPeriod(e.target.value as Period)} className="accounting-select w-full">
                <option value="day">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">This month to date</option>
                <option value="quarter">This quarter to date</option>
                <option value="year">This year to date</option>
              </select>
            </div>
            <div>
              <label className="accounting-label">Entry type</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | RowType)} className="accounting-select w-full">
                <option value="all">All types</option>
                <option value="Sale">Sales</option>
                <option value="Purchase">Purchases</option>
                <option value="Cash In">Cash in</option>
                <option value="Cash Out">Cash out</option>
                <option value="Expense">Expenses (older entries)</option>
                <option value="Activity">Activities / milestones</option>
              </select>
            </div>
            <div>
              <label className="accounting-label">Payment status</label>
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)} className="accounting-select w-full">
                <option value="all">All</option>
                <option value="settled">Paid / cash moved</option>
                <option value="unsettled">Not paid yet (credit, pending)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1 pb-2 border-b border-[#e2e8f0]">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="accounting-label">Date from</label>
                <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="accounting-input w-36 text-xs" />
              </div>
              <div>
                <label className="accounting-label">Date to</label>
                <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="accounting-input w-36 text-xs" />
              </div>
              <div className="self-end pb-0.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                  <CalendarDays className="w-3.5 h-3.5 text-[#2998d6]" />
                  <span>{filteredByDate.length} entries in period</span>
                </span>
              </div>
            </div>
            <div className="relative w-full sm:w-64 self-end">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search description, party, ref..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="accounting-input w-full pl-8 text-xs" />
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="accounting-card p-4 border-[#cbd5e1]">
              <span className="accounting-label uppercase tracking-wider text-slate-500 font-bold">Sales revenue</span>
              <div className="mt-1 text-lg sm:text-xl font-bold font-mono text-emerald-700">{formatRWF(totals.revenue)}</div>
              <div className="mt-1 text-[11px] text-slate-500">{totals.salesCount} sales · {formatRWF(totals.receivables)} not paid yet</div>
            </div>
            <div className="accounting-card p-4 border-[#cbd5e1]">
              <span className="accounting-label uppercase tracking-wider text-slate-500 font-bold">Gross profit</span>
              <div className={`mt-1 text-lg sm:text-xl font-bold font-mono ${totals.grossProfit >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>{formatRWF(totals.grossProfit)}</div>
              <div className="mt-1 text-[11px] text-slate-500">Margin {totals.grossMargin}% · cost of goods {formatRWF(totals.cogs)}</div>
            </div>
            <div className="accounting-card p-4 border-[#cbd5e1]">
              <span className="accounting-label uppercase tracking-wider text-slate-500 font-bold">Net profit</span>
              <div className={`mt-1 text-lg sm:text-xl font-bold font-mono ${totals.netProfit >= 0 ? 'text-[#2998d6]' : 'text-rose-700'}`}>{formatRWF(totals.netProfit)}</div>
              <div className="mt-1 text-[11px] text-slate-500">Net margin {totals.netMargin}% · expenses {formatRWF(totals.opex)}</div>
            </div>
            <div className="accounting-card p-4 border-[#cbd5e1]">
              <span className="accounting-label uppercase tracking-wider text-slate-500 font-bold">Net change in cash</span>
              <div className={`mt-1 text-lg sm:text-xl font-bold font-mono ${totals.netCash >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>{formatRWF(totals.netCash)}</div>
              <div className="mt-1 text-[11px] text-slate-500">Includes loans & owner money · financing {formatRWF(totals.financing.net)}</div>
            </div>
          </div>

          {totals.cogsMissingLines > 0 && (
            <div className="flex items-start gap-2 rounded-[4px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {totals.cogsMissingLines} sold item line(s) have no cost price, so cost of goods sold is understated and profit is overstated.
                Add a cost price to those products in Inventory to fix this.
              </span>
            </div>
          )}

          {/* Statement for the active tab */}
          {statementLines.length > 0 && (
            <div className="accounting-card p-4 sm:p-5 border-[#cbd5e1]">
              <h3 className="text-sm font-bold text-slate-800 mb-3">{activeTabLabel} statement · {from} to {to}</h3>
              <table className="w-full max-w-xl text-xs">
                <tbody className="divide-y divide-[#e2e8f0]">
                  {statementLines.map((line, idx) => (
                    <tr key={`${line.label}-${idx}`} className={line.strong ? 'bg-slate-50' : ''}>
                      <td className={`py-1.5 ${line.indent ? 'pl-5 text-slate-500' : 'pl-2'} ${line.strong ? 'font-bold text-slate-900' : 'text-slate-700'}`}>{line.label}</td>
                      <td className={`py-1.5 pr-2 text-right font-mono ${line.strong ? 'font-bold' : ''} ${line.amount < 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                        {line.amount < 0 ? `(${formatRWF(Math.abs(line.amount))})` : formatRWF(line.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {activeTab === 'cashflow' && (
                <p className="mt-3 text-[11px] text-slate-500">
                  Only money that actually moved is counted. Credit sales and purchases appear here when you record the payment (Cash In "Payment collected…" or Cash Out "Payment to supplier…").
                </p>
              )}
            </div>
          )}

          {/* Trend chart */}
          {(activeTab === 'pnl' || activeTab === 'sales_journal') && (
            <div className="accounting-card p-4 sm:p-5 border-[#cbd5e1]">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#e2e8f0]">
                <BarChart3 className="w-4 h-4 text-[#2998d6]" />
                <h3 className="text-sm font-bold text-slate-800">Revenue, costs and profit ({from} to {to})</h3>
              </div>
              <div className="h-64 sm:h-72 w-full">
                {chartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                        tickFormatter={(value) => (Math.abs(value) >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : `${Math.round(value / 1000)}K`)}
                      />
                      <Tooltip formatter={(value) => formatRWF(Number(value))} contentStyle={{ borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }} />
                      <Legend />
                      <Bar dataKey="Revenue" fill="#2998d6" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Costs" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Profit" fill="#10b981" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No sales or expenses in this period. Record them in Business Activities.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Entries table */}
          <div>
            <label className="accounting-label font-bold text-slate-800 text-sm mb-2 block">Entries ({tabFiltered.length})</label>
            <div className="overflow-x-auto border border-[#cbd5e1] rounded-[4px] bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f1f5f9] text-[#475569] font-bold border-b border-[#cbd5e1] text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Party</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Treated as</th>
                    <th className="py-2.5 px-3 text-right">Amount (FRW)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] bg-white">
                  {tabFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">No entries match the selected filters.</td>
                    </tr>
                  ) : (
                    tabFiltered.map((row) => {
                      const value = signed(row);
                      return (
                        <tr key={row.key} className="hover:bg-slate-50/70 align-top">
                          <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                            {row.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_BADGE[row.type]}`}>{row.type}</span>
                          </td>
                          <td className="py-2 px-3 max-w-xs">
                            <div className="font-semibold text-slate-900 truncate">{row.description}</div>
                            {row.invoiceRef && <div className="font-mono text-[10px] text-slate-400">{row.invoiceRef}</div>}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{row.counterparty || '—'}</td>
                          <td className="py-2 px-3 text-slate-600">{row.category || '—'}</td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="text-slate-600">{row.paymentMethod || '—'}</div>
                            {row.direction !== 'none' && (
                              <div className={`text-[10px] font-semibold ${row.cashMoved ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {row.cashMoved ? 'Paid' : row.status === 'Cancelled' ? 'Cancelled' : 'Not paid yet'}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            <div>{PNL_LABEL[row.pnl]}</div>
                            {row.note && <div className="text-[10px] text-slate-400">{row.note}</div>}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold whitespace-nowrap">
                            {row.direction === 'none' ? (
                              <span className="text-slate-400">{row.amount ? formatRWF(row.amount) : '—'}</span>
                            ) : value >= 0 ? (
                              <span className="text-emerald-700">+{formatRWF(value)}</span>
                            ) : (
                              <span className="text-rose-700">-{formatRWF(Math.abs(value))}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

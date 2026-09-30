import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  BarChart3,
  DollarSign,
  PieChart,
  ShoppingBag,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Printer
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type ReportTab = 'pnl' | 'cashflow' | 'sales_journal' | 'purchases_cogs' | 'tax_audit';

type LedgerRow = {
  date: Date;
  type: string;
  typeBadge: 'sale' | 'purchase' | 'cash_in' | 'cash_out' | 'expense' | 'other';
  description: string;
  counterparty?: string;
  category?: string;
  invoiceRef?: string;
  paymentMethod?: string;
  revenue: number;
  expense: number;
  net: number;
};

const toInputDate = (date: Date) => date.toISOString().slice(0, 10);
const safeDate = (value: string | undefined) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const periodStart = (period: Period) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (period === 'day') date.setDate(date.getDate() - 1);
  if (period === 'week') date.setDate(date.getDate() - 6);
  if (period === 'month') date.setDate(1);
  if (period === 'quarter') date.setMonth(date.getMonth() - 3, 1);
  if (period === 'year') date.setMonth(0, 1);
  return date;
};

export default function ReportsWorkspace() {
  const { activeSme } = useApp();
  const [activeTab, setActiveTab] = useState<ReportTab>('pnl');
  const [period, setPeriod] = useState<Period>('month');
  const [from, setFrom] = useState(toInputDate(periodStart('month')));
  const [to, setTo] = useState(toInputDate(new Date()));
  const [exportOpen, setExportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Unified ledger calculation
  const ledger = useMemo<LedgerRow[]>(() => {
    const rows: LedgerRow[] = [];

    // 1. Sales
    activeSme.sales.forEach((sale) => {
      const rev = Number(sale.total) || 0;
      rows.push({
        date: safeDate(sale.date),
        type: 'Sale',
        typeBadge: 'sale',
        description: sale.product || 'Sale Transaction',
        counterparty: sale.customer,
        category: sale.status || 'Completed',
        invoiceRef: sale.invoiceNumber,
        paymentMethod: sale.paymentMethod || 'Cash',
        revenue: rev,
        expense: 0,
        net: rev
      });
    });

    // 2. Purchases / Restock
    (activeSme.purchases || []).forEach((purchase) => {
      const exp = Number(purchase.totalAmount) || 0;
      rows.push({
        date: safeDate(purchase.date),
        type: 'Purchase',
        typeBadge: 'purchase',
        description: purchase.items && purchase.items.length > 0 ? `${purchase.items[0].productName}${purchase.items.length > 1 ? ` (+${purchase.items.length - 1} items)` : ''}` : 'Inventory Restock',
        counterparty: purchase.supplier,
        category: 'COGS / Inventory',
        invoiceRef: purchase.invoiceRef,
        paymentMethod: purchase.paymentMethod || 'Cash',
        revenue: 0,
        expense: exp,
        net: -exp
      });
    });

    // 3. Cash Inflows
    (activeSme.cashIns || []).forEach((cash) => {
      const rev = Number(cash.amount) || 0;
      rows.push({
        date: safeDate(cash.date),
        type: 'Cash In',
        typeBadge: 'cash_in',
        description: cash.reason,
        counterparty: cash.source,
        category: cash.category || 'Capital Inflow',
        paymentMethod: cash.paymentMethod || 'Bank Transfer',
        revenue: rev,
        expense: 0,
        net: rev
      });
    });

    // 4. Cash Outflows & OPEX
    (activeSme.cashOuts || []).forEach((cash) => {
      const exp = Number(cash.amount) || 0;
      rows.push({
        date: safeDate(cash.date),
        type: 'Cash Out',
        typeBadge: 'cash_out',
        description: cash.description,
        counterparty: cash.category,
        category: cash.category || 'OPEX',
        paymentMethod: cash.paymentMethod || 'Cash',
        revenue: 0,
        expense: exp,
        net: -exp
      });
    });

    // 5. Legacy Expenses
    (activeSme.expenses || []).forEach((expense) => {
      const exp = Number(expense.amount) || 0;
      rows.push({
        date: safeDate(expense.date),
        type: 'Expense',
        typeBadge: 'expense',
        description: expense.description,
        counterparty: expense.category,
        category: expense.category,
        revenue: 0,
        expense: exp,
        net: -exp
      });
    });

    // 6. Other Milestones
    (activeSme.otherActivities || []).forEach((act) => {
      const amt = Number(act.amount) || 0;
      if (amt > 0) {
        rows.push({
          date: safeDate(act.date),
          type: 'Milestone',
          typeBadge: 'other',
          description: act.title,
          counterparty: act.category,
          category: act.status || 'Milestone',
          revenue: amt,
          expense: 0,
          net: amt
        });
      }
    });

    return rows.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [activeSme]);

  // Date filtering
  const filteredByDate = useMemo(() => {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T23:59:59`);
    return ledger.filter((row) => row.date >= start && row.date <= end);
  }, [ledger, from, to]);

  // Tab-specific filtered rows
  const tabFiltered = useMemo(() => {
    let rows = filteredByDate;
    if (activeTab === 'pnl') {
      rows = filteredByDate;
    } else if (activeTab === 'cashflow') {
      rows = filteredByDate.filter(r => ['Sale', 'Purchase', 'Cash In', 'Cash Out'].includes(r.type));
    } else if (activeTab === 'sales_journal') {
      rows = filteredByDate.filter(r => r.type === 'Sale');
    } else if (activeTab === 'purchases_cogs') {
      rows = filteredByDate.filter(r => r.type === 'Purchase');
    } else if (activeTab === 'tax_audit') {
      rows = filteredByDate;
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      rows = rows.filter(r =>
        r.description.toLowerCase().includes(query) ||
        (r.counterparty && r.counterparty.toLowerCase().includes(query)) ||
        (r.category && r.category.toLowerCase().includes(query)) ||
        (r.invoiceRef && r.invoiceRef.toLowerCase().includes(query))
      );
    }

    if (categoryFilter !== 'all') {
      rows = rows.filter(r => r.type === categoryFilter);
    }

    return rows;
  }, [filteredByDate, activeTab, searchTerm, categoryFilter]);

  // Time-series Chart Data
  const chartData = useMemo(() => {
    const buckets = new Map<string, { label: string; Revenue: number; Expenses: number; Net: number }>();
    filteredByDate.slice().reverse().forEach((row) => {
      const key = period === 'day'
        ? toInputDate(row.date)
        : period === 'week'
          ? `${row.date.getFullYear()}-W${Math.ceil(row.date.getDate() / 7)}-${row.date.getMonth()}`
          : period === 'year'
            ? String(row.date.getFullYear())
            : `${row.date.getFullYear()}-${row.date.getMonth()}`;
      const label = period === 'day'
        ? row.date.toLocaleDateString([], { day: '2-digit', month: 'short' })
        : period === 'week'
          ? `Week ${Math.ceil(row.date.getDate() / 7)}, ${row.date.toLocaleDateString([], { month: 'short' })}`
          : period === 'year'
            ? String(row.date.getFullYear())
            : row.date.toLocaleDateString([], { month: 'short', year: '2-digit' });

      const bucket = buckets.get(key) || { label, Revenue: 0, Expenses: 0, Net: 0 };
      bucket.Revenue += row.revenue;
      bucket.Expenses += row.expense;
      bucket.Net += (row.revenue - row.expense);
      buckets.set(key, bucket);
    });

    return Array.from(buckets.values());
  }, [filteredByDate, period]);

  // Aggregated Summary Stats
  const totals = useMemo(() => {
    const grossRevenue = filteredByDate.reduce((sum, row) => sum + row.revenue, 0);
    const totalExpenses = filteredByDate.reduce((sum, row) => sum + row.expense, 0);
    const cogs = filteredByDate.filter(r => r.type === 'Purchase').reduce((sum, r) => sum + r.expense, 0);
    const opex = filteredByDate.filter(r => ['Expense', 'Cash Out'].includes(r.type)).reduce((sum, r) => sum + r.expense, 0);
    const netProfit = grossRevenue - totalExpenses;
    const grossMargin = grossRevenue > 0 ? Math.round(((grossRevenue - cogs) / grossRevenue) * 100) : 0;
    const netMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

    return {
      grossRevenue,
      totalExpenses,
      cogs,
      opex,
      netProfit,
      grossMargin,
      netMargin,
      count: filteredByDate.length
    };
  }, [filteredByDate]);

  const selectPeriod = (next: Period) => {
    setPeriod(next);
    setFrom(toInputDate(periodStart(next)));
    setTo(toInputDate(new Date()));
  };

  // Export handlers
  const exportRows = tabFiltered.map((row) => ({
    Date: row.date.toLocaleDateString(),
    Type: row.type,
    Counterparty: row.counterparty || '—',
    Description: row.description,
    Reference: row.invoiceRef || '—',
    Payment_Method: row.paymentMethod || '—',
    Revenue_RWF: row.revenue,
    Expense_RWF: row.expense,
    Net_RWF: row.net
  }));

  const exportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Report');
    XLSX.writeFile(workbook, `${activeSme.name.replace(/\W+/g, '_')}_Financial_Report_${from}_${to}.xlsx`);
    setExportOpen(false);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text(`${activeSme.name} — Financial & Accounting Report`, 14, 15);
    doc.setFontSize(9);
    doc.text(`Reporting Period: ${from} to ${to} | Generated on: ${new Date().toLocaleDateString()}`, 14, 21);
    doc.text(`Total Revenue: ${formatRWF(totals.grossRevenue)} | Expenses: ${formatRWF(totals.totalExpenses)} | Net Operating Income: ${formatRWF(totals.netProfit)}`, 14, 26);

    autoTable(doc, {
      startY: 30,
      head: [['Date', 'Type', 'Entity / Party', 'Description', 'Ref #', 'Payment', 'Revenue (FRW)', 'Expense (FRW)', 'Net (FRW)']],
      body: exportRows.map((r) => [
        r.Date,
        r.Type,
        r.Counterparty,
        r.Description,
        r.Reference,
        r.Payment_Method,
        r.Revenue_RWF.toLocaleString(),
        r.Expense_RWF.toLocaleString(),
        r.Net_RWF.toLocaleString()
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 152, 214] }
    });
    doc.save(`${activeSme.name.replace(/\W+/g, '_')}_Financial_Report_${from}_${to}.pdf`);
    setExportOpen(false);
  };

  const tabsConfig = [
    { id: 'pnl' as ReportTab, label: 'Income Statement (P&L)', icon: <TrendingUp className="w-4 h-4" />, count: filteredByDate.length, color: 'text-emerald-600' },
    { id: 'cashflow' as ReportTab, label: 'Cashflow Statement', icon: <ArrowDownLeft className="w-4 h-4" />, count: filteredByDate.filter(r => ['Sale', 'Purchase', 'Cash In', 'Cash Out'].includes(r.type)).length, color: 'text-teal-600' },
    { id: 'sales_journal' as ReportTab, label: 'Sales Book Analysis', icon: <ShoppingBag className="w-4 h-4" />, count: filteredByDate.filter(r => r.type === 'Sale').length, color: 'text-blue-600' },
    { id: 'purchases_cogs' as ReportTab, label: 'Purchases & COGS', icon: <Truck className="w-4 h-4" />, count: filteredByDate.filter(r => r.type === 'Purchase').length, color: 'text-amber-600' },
    { id: 'tax_audit' as ReportTab, label: 'Audit & Compliance Log', icon: <ShieldCheck className="w-4 h-4" />, count: filteredByDate.length, color: 'text-purple-600' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER TITLE & EXPORT WORKSPACE BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal text-[#1e293b] font-heading">
            Financial &amp; Accounting Intelligence Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade reporting, financial statements, and real-time cashflow analytics for <span className="font-semibold text-slate-700">{activeSme.name}</span>.
          </p>
        </div>

        <div className="relative flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setExportOpen(v => !v)}
            disabled={!tabFiltered.length}
            className="accounting-btn-primary"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement</span>
          </button>

          {exportOpen && (
            <div className="absolute right-0 top-10 z-30 w-48 rounded-[4px] border border-[#cbd5e1] bg-white p-1.5 shadow-xl">
              <button
                type="button"
                onClick={exportPdf}
                className="flex w-full items-center gap-2 rounded-[3px] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-[#2998d6]" />
                <span>Export Audit PDF</span>
              </button>
              <button
                type="button"
                onClick={exportExcel}
                className="flex w-full items-center gap-2 rounded-[3px] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Export Excel (.XLSX)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN FOLDER TAB NAVIGATION CARD (Connected to Card Body) */}
      {/* ========================================================================= */}
      <div className="relative">
        <div className="flex items-end overflow-x-auto scrollbar-none z-10 relative space-x-1 sm:space-x-1.5 -mb-[1px]">
          {tabsConfig.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-t-[6px] text-xs sm:text-sm transition-all duration-150 cursor-pointer whitespace-nowrap select-none border-t border-x ${
                  isActive
                    ? 'bg-white text-slate-900 font-bold border-[#cbd5e1] border-b-white border-b-2 shadow-xs z-20 -mb-[1px] pt-3 sm:pt-3.5 pb-2.5 sm:pb-3 ring-0'
                    : 'bg-[#f1f5f9] hover:bg-[#e4eaf2] text-[#475569] font-medium border-[#cbd5e1] border-b-[#cbd5e1] hover:text-[#0f172a]'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-0 right-0 h-[3px] bg-[#2998d6] rounded-t-[6px]" />
                )}

                <span className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? tab.color : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {tab.icon}
                </span>

                <span className="tracking-tight">{tab.label}</span>

                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors ${
                    isActive
                      ? 'bg-[#2998d6] text-white shadow-xs'
                      : 'bg-[#cbd5e1] text-[#334155] group-hover:bg-[#94a3b8] group-hover:text-white'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* MAIN WHITE CARD CONTAINER */}
        <div className="accounting-card p-5 sm:p-7 relative z-0 border-[#cbd5e1] rounded-t-none space-y-6">
          {/* Top 3 Solid Cyan Select / Filter Dropdowns Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="accounting-label">Reporting Period Scope</label>
              <select
                value={period}
                onChange={(e) => selectPeriod(e.target.value as Period)}
                className="accounting-select w-full"
              >
                <option value="day">Today (24 Hours)</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Current Month to Date</option>
                <option value="quarter">Current Quarter (3 Months)</option>
                <option value="year">Full Year (12 Months)</option>
              </select>
            </div>

            <div>
              <label className="accounting-label">Activity Category Filter</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="accounting-select w-full"
              >
                <option value="all">All Transaction Types</option>
                <option value="Sale">Sales Revenue Only</option>
                <option value="Purchase">Purchases &amp; Restock Only</option>
                <option value="Cash In">Cash Inflows Only</option>
                <option value="Cash Out">Cash Outflows &amp; OPEX Only</option>
              </select>
            </div>

            <div>
              <label className="accounting-label">Ledger Audit Status</label>
              <select
                value="Confirmed"
                className="accounting-select w-full opacity-85 cursor-not-allowed"
                disabled
              >
                <option value="Confirmed">Audited &amp; Reconciled (100%)</option>
                <option value="Draft">Draft Ledgers</option>
              </select>
            </div>
          </div>

          {/* Date Range Selection & Search Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1 pb-2 border-b border-[#e2e8f0]">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="accounting-label">Date From</label>
                <input
                  type="date"
                  value={from}
                  max={to}
                  onChange={(e) => setFrom(e.target.value)}
                  className="accounting-input w-36 text-xs"
                />
              </div>
              <div>
                <label className="accounting-label">Date To</label>
                <input
                  type="date"
                  value={to}
                  min={from}
                  onChange={(e) => setTo(e.target.value)}
                  className="accounting-input w-36 text-xs"
                />
              </div>
              <div className="self-end pb-0.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                  <CalendarDays className="w-3.5 h-3.5 text-[#2998d6]" />
                  <span>{filteredByDate.length} ledger entries</span>
                </span>
              </div>
            </div>

            <div className="relative w-full sm:w-64 self-end">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions, ref, parties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="accounting-input w-full pl-8 text-xs"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. EXECUTIVE FINANCIAL KPI METRIC CARDS */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="accounting-card p-4 border-[#cbd5e1]">
              <span className="accounting-label uppercase tracking-wider text-slate-500 font-bold">Gross Operating Revenue</span>
              <div className="mt-1 text-lg sm:text-xl font-bold font-mono text-emerald-700">
                {formatRWF(totals.grossRevenue)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                <span className="text-emerald-600 font-semibold">Inflow Credit</span> · {filteredByDate.filter(r => r.revenue > 0).length} transactions
              </div>
            </div>

            <div className="accounting-card p-4 border-[#cbd5e1]">
              <span className="accounting-label uppercase tracking-wider text-slate-500 font-bold">Total Operating Expenses (COGS+OPEX)</span>
              <div className="mt-1 text-lg sm:text-xl font-bold font-mono text-rose-700">
                {formatRWF(totals.totalExpenses)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                <span>COGS: {formatRWF(totals.cogs)}</span> · <span>OPEX: {formatRWF(totals.opex)}</span>
              </div>
            </div>

            <div className="accounting-card p-4 border-[#cbd5e1]">
              <span className="accounting-label uppercase tracking-wider text-slate-500 font-bold">Net Operating Income (EBIT)</span>
              <div className={`mt-1 text-lg sm:text-xl font-bold font-mono ${totals.netProfit >= 0 ? 'text-[#2998d6]' : 'text-rose-700'}`}>
                {formatRWF(totals.netProfit)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                <span className={`font-semibold ${totals.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {totals.netProfit >= 0 ? 'Net Surplus' : 'Net Deficit'}
                </span>
                <span>· Cash generation</span>
              </div>
            </div>

            <div className="accounting-card p-4 border-[#cbd5e1]">
              <span className="accounting-label uppercase tracking-wider text-slate-500 font-bold">Operating Profit Margin</span>
              <div className="mt-1 text-lg sm:text-xl font-bold font-mono text-purple-700">
                {totals.netMargin}%
              </div>
              <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                <span>Gross Margin: <strong className="text-slate-700">{totals.grossMargin}%</strong></span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. FINANCIAL PERFORMANCE & TREND VISUALIZATION */}
          {/* ========================================================================= */}
          <div className="accounting-card p-4 sm:p-5 border-[#cbd5e1]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#2998d6]" />
                <h3 className="text-sm font-bold text-slate-800">
                  Financial Performance Trajectory ({from} to {to})
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <span className="w-2.5 h-2.5 bg-[#2998d6] rounded-xs" /> Revenue Inflow
                </span>
                <span className="flex items-center gap-1 text-slate-500 font-semibold">
                  <span className="w-2.5 h-2.5 bg-slate-400 rounded-xs" /> Expense Outflow
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" /> Net Surplus
                </span>
              </div>
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
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      formatter={(value: any) => formatRWF(Number(value))}
                      contentStyle={{ borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    />
                    <Legend />
                    <Bar dataKey="Revenue" fill="#2998d6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Net" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No activity recorded for this period. Use the Business Activities journal to log sales and expenses.
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. AUDITED FINANCIAL STATEMENT & LEDGER TABLE */}
          {/* ========================================================================= */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="accounting-label font-bold text-slate-800 text-sm">
                Audited Financial Statement Log ({tabFiltered.length} entries)
              </label>
            </div>

            <div className="overflow-x-auto border border-[#cbd5e1] rounded-[4px] bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f1f5f9] text-[#475569] font-bold border-b border-[#cbd5e1] text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Journal Type</th>
                    <th className="py-2.5 px-3">Description / Item</th>
                    <th className="py-2.5 px-3">Counterparty</th>
                    <th className="py-2.5 px-3">Reference / Ref #</th>
                    <th className="py-2.5 px-3 text-right">Revenue (FRW)</th>
                    <th className="py-2.5 px-3 text-right">Expense (FRW)</th>
                    <th className="py-2.5 px-3 text-right">Net Cashflow (FRW)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] bg-white">
                  {tabFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No transactions found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    tabFiltered.map((row, idx) => {
                      const getBadge = () => {
                        switch (row.typeBadge) {
                          case 'sale':
                            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          case 'purchase':
                            return 'bg-blue-50 text-blue-700 border-blue-200';
                          case 'cash_in':
                            return 'bg-teal-50 text-teal-700 border-teal-200';
                          case 'cash_out':
                          case 'expense':
                            return 'bg-amber-50 text-amber-700 border-amber-200';
                          case 'other':
                            return 'bg-purple-50 text-purple-700 border-purple-200';
                        }
                      };

                      return (
                        <tr key={`${row.date.toISOString()}-${idx}`} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                            {row.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadge()}`}>
                              {row.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900 max-w-xs truncate">
                            {row.description}
                          </td>
                          <td className="py-2 px-3 text-slate-600 font-medium">
                            {row.counterparty || '—'}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">
                            {row.invoiceRef || '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700">
                            {row.revenue ? formatRWF(row.revenue) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-rose-700">
                            {row.expense ? formatRWF(row.expense) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold whitespace-nowrap">
                            {row.net > 0 ? (
                              <span className="text-emerald-700">+{formatRWF(row.net)}</span>
                            ) : row.net < 0 ? (
                              <span className="text-rose-700">-{formatRWF(Math.abs(row.net))}</span>
                            ) : (
                              <span className="text-slate-400">0 FRW</span>
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

import { useMemo, useState } from 'react';
import { CalendarDays, Download, FileSpreadsheet, FileText, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';

type Period = 'day' | 'week' | 'month' | 'year';
type LedgerRow = { date: Date; type: string; description: string; revenue: number; expense: number };

const toInputDate = (date: Date) => date.toISOString().slice(0, 10);
const safeDate = (value: string | undefined) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const periodStart = (period: Period) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (period === 'week') date.setDate(date.getDate() - 6);
  if (period === 'month') date.setDate(1);
  if (period === 'year') date.setMonth(0, 1);
  return date;
};

export default function ReportsWorkspace() {
  const { activeSme } = useApp();
  const [period, setPeriod] = useState<Period>('month');
  const [from, setFrom] = useState(toInputDate(periodStart('month')));
  const [to, setTo] = useState(toInputDate(new Date()));
  const [exportOpen, setExportOpen] = useState(false);

  const ledger = useMemo<LedgerRow[]>(() => {
    const rows: LedgerRow[] = [];
    activeSme.sales.forEach((sale) => rows.push({
      date: safeDate(sale.date),
      type: 'Sale',
      description: `${sale.customer} — ${sale.product}`,
      revenue: Number(sale.total) || 0,
      expense: 0
    }));
    (activeSme.expenses || []).forEach((expense) => rows.push({
      date: safeDate(expense.date),
      type: 'Expense',
      description: `${expense.category} — ${expense.description}`,
      revenue: 0,
      expense: Number(expense.amount) || 0
    }));
    (activeSme.purchases || []).forEach((purchase) => rows.push({
      date: safeDate(purchase.date),
      type: 'Purchase',
      description: purchase.supplier,
      revenue: 0,
      expense: Number(purchase.totalAmount) || 0
    }));
    (activeSme.cashIns || []).forEach((cash) => rows.push({
      date: safeDate(cash.date),
      type: 'Cash In',
      description: `${cash.source} — ${cash.reason}`,
      revenue: Number(cash.amount) || 0,
      expense: 0
    }));
    (activeSme.cashOuts || []).forEach((cash) => rows.push({
      date: safeDate(cash.date),
      type: 'Cash Out',
      description: `${cash.category} — ${cash.description}`,
      revenue: 0,
      expense: Number(cash.amount) || 0
    }));
    return rows.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [activeSme]);

  const filtered = useMemo(() => {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T23:59:59`);
    return ledger.filter((row) => row.date >= start && row.date <= end);
  }, [ledger, from, to]);

  const chartData = useMemo(() => {
    const buckets = new Map<string, { label: string; Revenue: number; Expenses: number }>();
    filtered.slice().reverse().forEach((row) => {
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
      const bucket = buckets.get(key) || { label, Revenue: 0, Expenses: 0 };
      bucket.Revenue += row.revenue;
      bucket.Expenses += row.expense;
      buckets.set(key, bucket);
    });
    return Array.from(buckets.values()).map((item) => ({
      ...item,
      Profit: item.Revenue - item.Expenses,
      Margin: item.Revenue ? Math.round(((item.Revenue - item.Expenses) / item.Revenue) * 100) : 0
    }));
  }, [filtered, period]);

  const totals = useMemo(() => {
    const revenue = filtered.reduce((sum, row) => sum + row.revenue, 0);
    const expenses = filtered.reduce((sum, row) => sum + row.expense, 0);
    return { revenue, expenses, profit: revenue - expenses, margin: revenue ? Math.round(((revenue - expenses) / revenue) * 100) : 0 };
  }, [filtered]);

  const selectPeriod = (next: Period) => {
    setPeriod(next);
    setFrom(toInputDate(periodStart(next)));
    setTo(toInputDate(new Date()));
  };

  const exportRows = filtered.map((row) => ({
    Date: row.date.toLocaleDateString(),
    Type: row.type,
    Description: row.description,
    Revenue_RWF: row.revenue,
    Expense_RWF: row.expense,
    Net_RWF: row.revenue - row.expense
  }));

  const exportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Report');
    XLSX.writeFile(workbook, `${activeSme.name.replace(/\W+/g, '_')}_${from}_${to}.xlsx`);
    setExportOpen(false);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(18);
    doc.text(`${activeSme.name} — Financial Report`, 14, 16);
    doc.setFontSize(10);
    doc.text(`${from} to ${to} · Revenue ${formatRWF(totals.revenue)} · Profit ${formatRWF(totals.profit)}`, 14, 23);
    autoTable(doc, {
      startY: 29,
      head: [['Date', 'Type', 'Description', 'Revenue (RWF)', 'Expense (RWF)', 'Net (RWF)']],
      body: exportRows.map((row) => [
        row.Date, row.Type, row.Description,
        row.Revenue_RWF.toLocaleString(), row.Expense_RWF.toLocaleString(), row.Net_RWF.toLocaleString()
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 152, 214] }
    });
    doc.save(`${activeSme.name.replace(/\W+/g, '_')}_${from}_${to}.pdf`);
    setExportOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 pb-10 sm:space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Reports</h1>
          <p className="mt-0.5 truncate text-sm text-slate-500">{activeSme.name}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setExportOpen((value) => !value)}
            disabled={!filtered.length}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2998d6] hover:bg-[#1f85be] px-4 text-sm font-semibold text-white shadow-xs transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          {exportOpen && (
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <button onClick={exportPdf} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                <FileText className="h-4 w-4 text-[#2998d6]" /> PDF
              </button>
              <button onClick={exportExcel} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 text-[#2998d6]" /> Excel
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(['day', 'week', 'month', 'year'] as Period[]).map((item) => (
              <button
                key={item}
                onClick={() => selectPeriod(item)}
                className={`h-9 rounded-xl px-3.5 text-xs font-bold capitalize transition cursor-pointer ${
                  period === item
                    ? 'bg-[#2998d6] text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              From
              <input
                type="date"
                value={from}
                max={to}
                onChange={(event) => setFrom(event.target.value)}
                className="mt-1 block h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-[#2998d6] focus:ring-4 focus:ring-[#2998d6]/15"
              />
            </label>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              To
              <input
                type="date"
                value={to}
                min={from}
                onChange={(event) => setTo(event.target.value)}
                className="mt-1 block h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-[#2998d6] focus:ring-4 focus:ring-[#2998d6]/15"
              />
            </label>
            <div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[11px] font-bold text-slate-600">
              <CalendarDays className="h-3.5 w-3.5 text-[#2998d6]" />
              {filtered.length}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Revenue', totals.revenue],
          ['Expenses', totals.expenses],
          ['Net profit', totals.profit],
          ['Margin', `${totals.margin}%`]
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-2 truncate font-mono text-lg font-bold text-slate-950">
              {typeof value === 'number' ? formatRWF(value) : value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-950">
            <TrendingUp className="h-4 w-4 text-[#2998d6]" /> Trend
          </h2>
          <span className="text-[10px] text-slate-400">{from} — {to}</span>
        </div>
        <div className="h-64 sm:h-72">
          {chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value: number | string) => formatRWF(Number(value))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Legend />
                <Line type="monotone" dataKey="Revenue" stroke="#2998d6" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Expenses" stroke="#94a3b8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">No data</div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-bold text-slate-950">Statement</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-slate-50 text-[9px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Revenue</th>
                <th>Expense</th>
                <th className="pr-5 text-right">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">No data</td>
                </tr>
              )}
              {filtered.map((row, index) => (
                <tr key={`${row.date.toISOString()}-${index}`} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-slate-700">{row.date.toLocaleDateString()}</td>
                  <td>
                    <span className="rounded-full bg-sky-50 px-2 py-1 text-[9px] font-bold text-[#2998d6]">{row.type}</span>
                  </td>
                  <td className="max-w-xs truncate pr-4 text-slate-600">{row.description}</td>
                  <td className="font-mono font-semibold text-slate-800">{row.revenue ? formatRWF(row.revenue) : '—'}</td>
                  <td className="font-mono font-semibold text-slate-800">{row.expense ? formatRWF(row.expense) : '—'}</td>
                  <td className="pr-5 text-right font-mono font-bold text-slate-950">{formatRWF(row.revenue - row.expense)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

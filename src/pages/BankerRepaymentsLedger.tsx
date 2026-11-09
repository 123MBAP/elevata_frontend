import { useState, useMemo } from 'react';
import { useApp, Application } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import { Card, CardContent } from '../assets/components/ui/card';
import { Button } from '../assets/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  Building2,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Download,
  Eye,
  X,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  TrendingUp,
  Percent,
  AlertCircle,
  FileText,
  Printer
} from 'lucide-react';

export default function BankerRepaymentsLedger() {
  const {
    applications,
    makeApplicationPayment,
    disburseApplicationFunds
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');

  // Selected application for viewing full repayment history modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Record offline repayment modal state
  const [payingApp, setPayingApp] = useState<Application | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer (RTGS / Internal)');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  // Disburse capital modal state
  const [disbursingApp, setDisbursingApp] = useState<Application | null>(null);
  const [disburseAmount, setDisburseAmount] = useState<number | string>('');
  const [disburseNotes, setDisburseNotes] = useState<string>('');
  const [isSubmittingDisburse, setIsSubmittingDisburse] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Only consider approved, disbursed, or completed loan facilities
  const loanFacilities = useMemo(() => {
    return applications.filter(app => ['Approved', 'Disbursed', 'Completed'].includes(app.status));
  }, [applications]);

  // Aggregate portfolio metrics
  const portfolioStats = useMemo(() => {
    const totalFacilities = loanFacilities.length;
    let totalDisbursed = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let completedCount = 0;
    let activeDisbursedCount = 0;

    loanFacilities.forEach(app => {
      const disbursed = app.disbursedAmount || app.approvedAmount || app.requestedAmount || 5000000;
      const paid = app.totalPaid || 0;
      const payable = app.totalPayable || Math.round(disbursed * 1.12);
      const remaining = app.remainingBalance !== undefined ? app.remainingBalance : Math.max(0, payable - paid);

      totalDisbursed += disbursed;
      totalPaid += paid;
      totalRemaining += remaining;

      if (remaining <= 0 || app.status === 'Completed') {
        completedCount++;
      } else if (app.disbursed || app.status === 'Disbursed') {
        activeDisbursedCount++;
      }
    });

    const collectionRate = totalDisbursed > 0
      ? Math.min(100, Math.round((totalPaid / (totalDisbursed * 1.12)) * 100))
      : 0;

    return {
      totalFacilities,
      totalDisbursed,
      totalPaid,
      totalRemaining,
      completedCount,
      activeDisbursedCount,
      collectionRate
    };
  }, [loanFacilities]);

  // Filtered facilities list
  const filteredFacilities = useMemo(() => {
    return loanFacilities.filter(app => {
      const matchesSearch =
        app.smeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.opportunityTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.contactPhone && app.contactPhone.includes(searchTerm));

      let matchesStatus = true;
      if (statusFilter === 'Disbursed') {
        matchesStatus = Boolean(app.disbursed || app.status === 'Disbursed') && (app.remainingBalance ?? 1) > 0;
      } else if (statusFilter === 'Approved') {
        matchesStatus = !app.disbursed && (app.remainingBalance ?? 1) > 0;
      } else if (statusFilter === 'Completed') {
        matchesStatus = app.status === 'Completed' || (app.remainingBalance !== undefined && app.remainingBalance <= 0);
      }

      const matchesSector = sectorFilter === 'All' || app.smeSector === sectorFilter;

      return matchesSearch && matchesStatus && matchesSector;
    });
  }, [loanFacilities, searchTerm, statusFilter, sectorFilter]);

  // Unique sectors for filter dropdown
  const uniqueSectors = useMemo(() => {
    const set = new Set<string>();
    loanFacilities.forEach(app => {
      if (app.smeSector) set.add(app.smeSector);
    });
    return Array.from(set);
  }, [loanFacilities]);

  // Handle recording payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingApp) return;

    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      triggerToast('Please provide a valid repayment amount.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const updated = await makeApplicationPayment(payingApp.id, {
        amount: amt,
        paymentMethod,
        reference: paymentRef || `BNK-${Date.now().toString(36).toUpperCase()}`,
        notes: paymentNotes || 'Branch counter repayment recorded by credit officer'
      });

      triggerToast(`Payment of ${formatRWF(amt)} recorded successfully into ${payingApp.smeName}'s ledger.`);
      setPayingApp(null);
      if (selectedApp?.id === payingApp.id) {
        setSelectedApp(updated);
      }
    } catch (err: any) {
      triggerToast(err?.message || 'Payment recording failed.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Handle capital disbursement
  const handleDisburseCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disbursingApp) return;

    const amt = Number(disburseAmount) || disbursingApp.approvedAmount || disbursingApp.requestedAmount || 5000000;
    setIsSubmittingDisburse(true);
    try {
      const updated = await disburseApplicationFunds(disbursingApp.id, {
        disbursedAmount: amt,
        notes: disburseNotes || 'Capital disbursement released from lending desk.'
      });

      triggerToast(`Capital of ${formatRWF(amt)} marked as released to ${disbursingApp.smeName}.`);
      setDisbursingApp(null);
      if (selectedApp?.id === disbursingApp.id) {
        setSelectedApp(updated);
      }
    } catch (err: any) {
      triggerToast(err?.message || 'Disbursement recording failed.');
    } finally {
      setIsSubmittingDisburse(false);
    }
  };

  // Export CSV
  const exportLedgerCSV = () => {
    if (filteredFacilities.length === 0) {
      triggerToast('No facilities available to export.');
      return;
    }

    const headers = ['Application Ref', 'SME Name', 'Sector', 'Opportunity Title', 'Disbursed (RWF)', 'Paid (RWF)', 'Remaining (RWF)', 'Next Due', 'Status'];
    const rows = filteredFacilities.map(f => [
      f.id,
      `"${f.smeName}"`,
      f.smeSector,
      `"${f.opportunityTitle}"`,
      f.disbursedAmount || f.approvedAmount || f.requestedAmount || 0,
      f.totalPaid || 0,
      f.remainingBalance ?? 0,
      f.nextDueDate || 'N/A',
      f.disbursed ? 'Disbursed' : f.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Elevata_Banker_Repayment_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Repayment ledger exported to CSV successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-80 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-bold border border-slate-700 flex items-center gap-2.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#2998d6]/10 text-[#2998d6] rounded-xl">
              <Coins className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              SME Loan &amp; Repayment Ledger
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track borrower portfolio disbursements, real-time installment repayments, remaining balances, and full transaction history.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            onClick={exportLedgerCSV}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs h-9 px-4 flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export Ledger (CSV)
          </Button>
        </div>
      </div>

      {/* 4 Primary Portfolio Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              Total Capital Disbursed
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">
              {formatRWF(portfolioStats.totalDisbursed)}
            </div>
            <span className="text-[10px] text-slate-500 block">
              Across {portfolioStats.totalFacilities} approved facilities
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-[#2998d6]" />
              Total Collections (Paid)
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-700 font-mono">
              {formatRWF(portfolioStats.totalPaid)}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold block">
              {portfolioStats.collectionRate}% portfolio recovery rate
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              Remaining Portfolio Principal
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">
              {formatRWF(portfolioStats.totalRemaining)}
            </div>
            <span className="text-[10px] text-slate-500 block">
              Active loan balance in market
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Settlement Status
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">
              {portfolioStats.completedCount} / {portfolioStats.totalFacilities}
            </div>
            <span className="text-[10px] text-slate-500 block">
              {portfolioStats.activeDisbursedCount} active facilities in repayment
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by SME business, opportunity title, ref number, or phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#2998d6] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2998d6]"
          >
            <option value="All">All Loan Statuses</option>
            <option value="Disbursed">Disbursed (Active)</option>
            <option value="Approved">Approved (Pending Disbursal)</option>
            <option value="Completed">Fully Repaid (Settled)</option>
          </select>

          {/* Sector Filter */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2998d6]"
          >
            <option value="All">All Sectors</option>
            {uniqueSectors.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Master SME Repayment Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex justify-between items-center">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#2998d6]" />
            Borrower Loan Portfolio &amp; Repayment Schedule ({filteredFacilities.length})
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">
            Elevata Central Credit Ledger
          </span>
        </div>

        {filteredFacilities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                <tr>
                  <th className="p-3">Borrower (SME)</th>
                  <th className="p-3">Credit Facility</th>
                  <th className="p-3 text-right">Amount Disbursed</th>
                  <th className="p-3 text-right">Monthly Due</th>
                  <th className="p-3 text-right">Amount Paid</th>
                  <th className="p-3 text-right">Remaining Balance</th>
                  <th className="p-3 text-center">Fully Repaid?</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {filteredFacilities.map((app) => {
                  const disbursedAmt = app.disbursedAmount || app.approvedAmount || app.requestedAmount || 5000000;
                  const totalPaid = app.totalPaid || 0;
                  const totalPayable = app.totalPayable || Math.round(disbursedAmt * 1.12);
                  const remaining = app.remainingBalance !== undefined ? app.remainingBalance : Math.max(0, totalPayable - totalPaid);
                  const repaymentPct = totalPayable > 0 ? Math.min(100, Math.round((totalPaid / totalPayable) * 100)) : 0;
                  const isSettled = remaining <= 0 || app.status === 'Completed';

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition">
                      {/* SME Info */}
                      <td className="p-3 font-sans">
                        <div className="font-extrabold text-slate-900 text-xs">{app.smeName}</div>
                        <div className="text-[10.5px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-slate-700">{app.smeSector}</span>
                          <span>·</span>
                          <span className="font-mono text-slate-400">{app.contactPhone || 'No phone'}</span>
                        </div>
                      </td>

                      {/* Facility */}
                      <td className="p-3 font-sans">
                        <div className="font-bold text-slate-800 text-xs truncate max-w-[200px]">
                          {app.opportunityTitle}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Ref: #{app.id.slice(0, 8)}
                        </div>
                      </td>

                      {/* Disbursed */}
                      <td className="p-3 text-right">
                        <div className="font-extrabold text-slate-900 text-xs">{formatRWF(disbursedAmt)}</div>
                        <span className="text-[9.5px] text-slate-500 font-sans block">
                          {app.interestRate || 12}% p.a. · {app.termMonths || 12}M
                        </span>
                      </td>

                      {/* Monthly Due */}
                      <td className="p-3 text-right">
                        <div className="font-bold text-[#1f85be] text-xs">
                          {formatRWF(app.monthlyInstallment || Math.round(disbursedAmt / 12))}
                        </div>
                        <span className="text-[9.5px] text-slate-400 font-sans block">
                          Due: {app.nextDueDate || 'Monthly'}
                        </span>
                      </td>

                      {/* Amount Paid */}
                      <td className="p-3 text-right">
                        <div className="font-extrabold text-emerald-700 text-xs">{formatRWF(totalPaid)}</div>
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 ml-auto overflow-hidden border border-slate-200">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${repaymentPct}%` }} />
                        </div>
                        <span className="text-[9px] text-slate-400 font-sans block mt-0.5">{repaymentPct}% repaid</span>
                      </td>

                      {/* Remaining Balance */}
                      <td className="p-3 text-right">
                        <div className={`font-extrabold text-xs ${isSettled ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {formatRWF(remaining)}
                        </div>
                        <span className="text-[9.5px] text-slate-400 font-sans block">
                          {isSettled ? 'Settled in full' : 'Outstanding'}
                        </span>
                      </td>

                      {/* Fully Repaid? Column */}
                      <td className="p-3 text-center font-sans">
                        {isSettled ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Fully Repaid</span>
                          </div>
                        ) : totalPaid > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-50 text-[#1f85be] border border-sky-200">
                              Partially Repaid ({repaymentPct}%)
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                              {formatRWF(remaining)} left
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                            Not Repaid (0%)
                          </span>
                        )}
                      </td>

                      {/* Actions Column: View Repayments Statement */}
                      <td className="p-3 text-center font-sans">
                        <button
                          type="button"
                          onClick={() => setSelectedApp(app)}
                          className="px-3.5 py-1.5 bg-[#2998d6] hover:bg-[#1f85be] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs mx-auto"
                          title="Open official loan repayment statement and transaction audit"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Repayments Statement
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Coins className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">No Matching Loan Facilities Found</h4>
            <p className="text-slate-400 max-w-sm mx-auto">
              {loanFacilities.length === 0
                ? 'When applications are approved or disbursed, they will automatically appear in this central repayment ledger.'
                : 'No facilities match your search query or filter selection.'}
            </p>
          </div>
        )}
      </div>

      {/* OFFICIAL LOAN REPAYMENT STATEMENT MODAL */}
      <AnimatePresence>
        {selectedApp && (() => {
          const disbursedAmt = selectedApp.disbursedAmount || selectedApp.approvedAmount || selectedApp.requestedAmount || 5000000;
          const totalPaid = selectedApp.totalPaid || 0;
          const totalPayable = selectedApp.totalPayable || Math.round(disbursedAmt * 1.12);
          const remaining = selectedApp.remainingBalance !== undefined ? selectedApp.remainingBalance : Math.max(0, totalPayable - totalPaid);
          const repaymentPct = totalPayable > 0 ? Math.min(100, Math.round((totalPaid / totalPayable) * 100)) : 0;
          const isSettled = remaining <= 0 || selectedApp.status === 'Completed';

          return (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full max-w-4xl max-h-[92vh] rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
              >
                {/* Statement Header */}
                <div className="p-5 border-b border-slate-200 bg-[#1a2332] text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-white/10 text-[#38bdf8]">
                      <FileText className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider">
                          SME Loan Repayment Statement
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/15 text-white">
                          Official Ledger
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        {selectedApp.smeName} · {selectedApp.opportunityTitle} (Ref #{selectedApp.id.slice(0, 8)})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      title="Print official statement"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Print Statement</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedApp(null)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Statement Body */}
                <div className="p-6 overflow-y-auto space-y-5 text-xs bg-slate-50/40 flex-1">
                  {/* Institutional & Borrower Dossier Box */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Lending Institution
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-4 h-4 text-[#2998d6]" />
                          {selectedApp.institution || 'Accredited Financial Partner'}
                        </h4>
                      </div>
                      <div className="text-left sm:text-right font-mono text-[11px] text-slate-500">
                        <div>Statement Date: <strong className="text-slate-800">{new Date().toLocaleDateString()}</strong></div>
                        <div>Facility Ref: <strong className="text-slate-800">{selectedApp.id}</strong></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 font-sans text-xs">
                      <div className="space-y-1">
                        <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Borrower Information</span>
                        <div className="font-extrabold text-slate-900">{selectedApp.smeName}</div>
                        <div className="text-slate-600">Sector: <strong>{selectedApp.smeSector}</strong></div>
                        <div className="text-slate-600 font-mono">Contact: {selectedApp.contactPhone || selectedApp.contactEmail || 'N/A'}</div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Facility Terms</span>
                        <div className="font-extrabold text-slate-900">{selectedApp.opportunityTitle}</div>
                        <div className="text-slate-600">
                          Annual Interest: <strong>{selectedApp.interestRate || 12}% p.a.</strong> · Tenor: <strong>{selectedApp.termMonths || 12} Months</strong>
                        </div>
                        <div className="text-slate-600">
                          Disbursement: <strong>{selectedApp.disbursed ? 'Capital Disbursed' : 'Approved (Pending Disbursal)'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fully Repaid Status Banner */}
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                    isSettled
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : totalPaid > 0
                      ? 'bg-sky-50 border-sky-200 text-sky-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSettled ? 'bg-emerald-600 text-white' : totalPaid > 0 ? 'bg-[#2998d6] text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {isSettled ? '✓' : totalPaid > 0 ? '◷' : '!'}
                      </span>
                      <div>
                        <span className="text-xs font-extrabold uppercase tracking-wider block">
                          {isSettled
                            ? 'Repayment Status: Fully Repaid (100% Settled)'
                            : totalPaid > 0
                            ? `Repayment Status: Active In Repayment (${repaymentPct}% Paid)`
                            : 'Repayment Status: Active (Pending First Repayment Installment)'}
                        </span>
                        <span className="text-[11px] opacity-80 block font-normal">
                          {isSettled
                            ? 'All principal and scheduled interest have been fulfilled in full. Facility is officially discharged.'
                            : `${formatRWF(totalPaid)} repaid of ${formatRWF(totalPayable)} total payable. Outstanding balance is ${formatRWF(remaining)}.`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                        isSettled
                          ? 'bg-emerald-200 text-emerald-900'
                          : totalPaid > 0
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {isSettled ? 'Fully Repaid' : `${repaymentPct}% Paid`}
                      </span>
                    </div>
                  </div>

                  {/* 4 Financial Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Disbursed</span>
                      <div className="text-sm sm:text-base font-extrabold text-slate-900 font-mono mt-0.5">
                        {formatRWF(disbursedAmt)}
                      </div>
                      <span className="text-[9px] text-slate-500 font-sans mt-0.5 block">
                        Capital facility
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Installment</span>
                      <div className="text-sm sm:text-base font-extrabold text-[#1f85be] font-mono mt-0.5">
                        {formatRWF(selectedApp.monthlyInstallment || Math.round(disbursedAmt / 12))}
                      </div>
                      <span className="text-[9px] text-slate-500 font-sans mt-0.5 block">
                        Due: {selectedApp.nextDueDate || 'Monthly'}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Amount Repaid</span>
                      <div className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono mt-0.5">
                        {formatRWF(totalPaid)}
                      </div>
                      <span className="text-[9px] text-emerald-600 font-semibold font-sans mt-0.5 block">
                        {repaymentPct}% of {formatRWF(totalPayable)}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Remaining Balance</span>
                      <div className={`text-sm sm:text-base font-extrabold font-mono mt-0.5 ${isSettled ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {formatRWF(remaining)}
                      </div>
                      <span className="text-[9px] text-slate-500 font-sans mt-0.5 block">
                        {isSettled ? 'Zero balance' : 'Outstanding'}
                      </span>
                    </div>
                  </div>

                  {/* Statement Itemized Ledger Table */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-[#2998d6]" />
                          Itemized Repayments Audit Ledger ({selectedApp.payments?.length || 0} Transactions)
                        </h5>
                        <p className="text-[10.5px] text-slate-500">
                          Complete history of all payments made by {selectedApp.smeName} towards this credit facility.
                        </p>
                      </div>

                      {!isSettled && (
                        <Button
                          type="button"
                          onClick={() => {
                            setPayingApp(selectedApp);
                            setPaymentAmount(selectedApp.monthlyInstallment || 466667);
                            setPaymentRef(`BNK-${Date.now().toString(36).toUpperCase()}`);
                            setPaymentNotes(`Counter deposit recorded for ${selectedApp.smeName}`);
                          }}
                          className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs h-8 px-3 flex items-center gap-1 shadow-2xs"
                        >
                          <Coins className="w-3.5 h-3.5 text-[#2998d6]" />
                          Record Counter Deposit Received
                        </Button>
                      )}
                    </div>

                    {selectedApp.payments && selectedApp.payments.length > 0 ? (
                      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100/70 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                            <tr>
                              <th className="p-3">#</th>
                              <th className="p-3">Payment Date</th>
                              <th className="p-3">Transaction Reference</th>
                              <th className="p-3">Payment Channel</th>
                              <th className="p-3">Payer</th>
                              <th className="p-3 text-right">Amount Repaid</th>
                              <th className="p-3 text-center">Status</th>
                              <th className="p-3">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {selectedApp.payments.map((p, index) => (
                              <tr key={p.id} className="hover:bg-slate-50/70">
                                <td className="p-3 text-slate-400 font-sans">{index + 1}</td>
                                <td className="p-3 text-slate-600">{new Date(p.paidAt).toLocaleString()}</td>
                                <td className="p-3 font-bold text-slate-900">{p.reference}</td>
                                <td className="p-3 font-sans text-slate-700">{p.method}</td>
                                <td className="p-3 font-sans text-slate-600">{p.paidBy}</td>
                                <td className="p-3 text-right font-extrabold text-emerald-700">{formatRWF(p.amount)}</td>
                                <td className="p-3 text-center font-sans">
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[9.5px] font-bold">
                                    {p.status}
                                  </span>
                                </td>
                                <td className="p-3 font-sans text-slate-500 text-[10.5px] truncate max-w-xs">{p.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-1">
                        <Receipt className="w-6 h-6 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-700">No repayment transactions logged yet.</p>
                        <p className="text-slate-400">
                          When the SME submits installment repayments via Mobile Money or Bank Transfer, they will appear here in real time.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statement Footer */}
                <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <p className="text-[10px] text-slate-400">
                    Official financial statement generated via Elevata Central Repayment Clearing.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="bg-[#2998d6] hover:bg-[#1f85be] text-white font-bold text-xs h-9 px-6 border-none"
                  >
                    Close Statement
                  </Button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* RECORD OFFLINE REPAYMENT MODAL */}
      <AnimatePresence>
        {payingApp && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-200 bg-[#1a2332] text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-white/10 text-emerald-400">
                    <Coins className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wider">Record Borrower Repayment</h3>
                    <p className="text-[11px] text-slate-300">{payingApp.smeName} · Ref #{payingApp.id.slice(0, 8)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPayingApp(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Remaining Balance</span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">
                      {formatRWF(payingApp.remainingBalance !== undefined ? payingApp.remainingBalance : (payingApp.totalPayable || 5000000))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Installment</span>
                    <span className="text-sm font-extrabold text-[#1f85be] font-mono">
                      {formatRWF(payingApp.monthlyInstallment || 0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    Repayment Amount Received (RWF) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#2998d6]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    Payment Method / Instrument <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold focus:outline-none focus:border-[#2998d6]"
                  >
                    <option value="Bank Transfer (RTGS / Internal)">Bank Transfer (RTGS / Internal Transfer)</option>
                    <option value="Branch Cash Deposit">Branch Cash Deposit (Over the counter)</option>
                    <option value="Standing Order">Standing Order / Automated Bank Debit</option>
                    <option value="MTN Mobile Money">MTN MoMo (Corporate Collector)</option>
                    <option value="Airtel Money">Airtel Money (Corporate Collector)</option>
                    <option value="Cheque Deposit">Bank Cheque Clearance</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      Bank Ref / Slip Number
                    </label>
                    <input
                      type="text"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="e.g. SLIP-8921"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      Narration
                    </label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="e.g. Month 2 installment"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <Button
                    type="button"
                    onClick={() => setPayingApp(null)}
                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs h-9 px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="bg-[#2998d6] hover:bg-[#1f85be] text-white font-bold text-xs h-9 px-5 shadow-xs border-none"
                  >
                    {isSubmittingPayment ? 'Processing...' : 'Commit Repayment to Ledger'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DISBURSE CAPITAL MODAL */}
      <AnimatePresence>
        {disbursingApp && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-200 bg-[#1a2332] text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-white/10 text-emerald-400">
                    <Coins className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wider">Release Capital Disbursement</h3>
                    <p className="text-[11px] text-slate-300">{disbursingApp.smeName} · {disbursingApp.opportunityTitle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDisbursingApp(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDisburseCapital} className="p-5 space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Approved Facility</span>
                  <span className="text-base font-extrabold text-emerald-950 font-mono">
                    {formatRWF(disbursingApp.approvedAmount || disbursingApp.requestedAmount || 5000000)}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    Disbursement Amount (RWF) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={disburseAmount}
                    onChange={(e) => setDisburseAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#2998d6]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    Disbursement Reference / Notes
                  </label>
                  <input
                    type="text"
                    value={disburseNotes}
                    onChange={(e) => setDisburseNotes(e.target.value)}
                    placeholder="e.g. Wire transfer via central clearing"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#2998d6]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <Button
                    type="button"
                    onClick={() => setDisbursingApp(null)}
                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs h-9 px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingDisburse}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-5 shadow-xs border-none"
                  >
                    {isSubmittingDisburse ? 'Releasing Funds...' : 'Confirm Capital Disbursement'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


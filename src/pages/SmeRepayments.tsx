import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  Printer,
  Download,
  X,
  FileText,
  Search,
  Filter,
  Smartphone,
  ShieldCheck,
  TrendingDown,
  Info,
  ChevronRight,
  ExternalLink,
  Sparkles,
  ClipboardCheck
} from 'lucide-react';
import { useApp, Application, ApplicationPayment } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import { Button } from '../assets/components/ui/button';

export default function SmeRepayments() {
  const { applications, activeSme, makeApplicationPayment } = useApp();

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSettlement, setFilterSettlement] = useState<'all' | 'active' | 'repaid'>('all');

  // Modals state
  const [statementApp, setStatementApp] = useState<Application | null>(null);
  const [payingApp, setPayingApp] = useState<Application | null>(null);
  const [receiptData, setReceiptData] = useState<{
    app: Application;
    amount: number;
    method: string;
    ref: string;
    timestamp: string;
    newBalance: number;
  } | null>(null);

  // Form states for repayment modal
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('MTN Mobile Money');
  const [phoneNumber, setPhoneNumber] = useState<string>('0788123456');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Disbursed / Active Credit facilities for this SME
  // Applications that are Approved, Disbursed, or have financial terms
  const disbursedLoans = useMemo(() => {
    return applications.filter((app) => {
      // Must be approved or disbursed
      const isApprovedOrDisbursed =
        app.status === 'Approved' ||
        app.status === 'Disbursed' ||
        app.status === 'Completed' ||
        app.disbursed === true ||
        (app.disbursedAmount && app.disbursedAmount > 0) ||
        (app.approvedAmount && app.approvedAmount > 0);

      if (!isApprovedOrDisbursed) return false;

      // Filter by search term
      const title = app.opportunityTitle?.toLowerCase() || '';
      const bank = app.institution?.toLowerCase() || '';
      const ref = app.id.toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = title.includes(term) || bank.includes(term) || ref.includes(term);
      if (!matchesSearch) return false;

      // Filter by settlement status
      const isRepaid =
        app.status === 'Completed' ||
        (app.remainingBalance !== undefined && app.remainingBalance <= 0);

      if (filterSettlement === 'active') return !isRepaid;
      if (filterSettlement === 'repaid') return isRepaid;

      return true;
    });
  }, [applications, searchTerm, filterSettlement]);

  // Aggregate Portfolio Metrics
  const portfolioMetrics = useMemo(() => {
    let totalDisbursed = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let fullySettledCount = 0;

    disbursedLoans.forEach((loan) => {
      const principal = loan.disbursedAmount || loan.approvedAmount || loan.requestedAmount || 5000000;
      const payable = loan.totalPayable || principal;
      const paid = loan.totalPaid || 0;
      const remaining = loan.remainingBalance !== undefined ? loan.remainingBalance : (payable - paid);

      totalDisbursed += principal;
      totalPaid += paid;
      totalRemaining += Math.max(0, remaining);

      if (remaining <= 0 || loan.status === 'Completed') {
        fullySettledCount += 1;
      }
    });

    const repaymentProgress = totalDisbursed > 0 ? Math.min(100, Math.round((totalPaid / (totalDisbursed)) * 100)) : 0;

    return {
      totalDisbursed,
      totalPaid,
      totalRemaining,
      fullySettledCount,
      totalLoans: disbursedLoans.length,
      repaymentProgress
    };
  }, [disbursedLoans]);

  // Open Repayment Modal with sensible defaults
  const handleOpenPayment = (app: Application) => {
    setPayingApp(app);
    const remaining = app.remainingBalance !== undefined ? app.remainingBalance : (app.totalPayable || 5000000);
    const installment = app.monthlyInstallment || 450000;
    const initialAmount = Math.min(installment, remaining);
    setPaymentAmount(initialAmount.toString());
    setPhoneNumber(app.contactPhone || '0788123456');
    setPaymentNotes(`Installment repayment for ${app.opportunityTitle}`);
  };

  // Submit Repayment
  const handleSubmitRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingApp) return;

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid repayment amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentRemaining = payingApp.remainingBalance !== undefined ? payingApp.remainingBalance : (payingApp.totalPayable || 5000000);
      const newBalance = Math.max(0, currentRemaining - amountNum);
      const generatedRef = `ELEV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      await makeApplicationPayment(payingApp.id, {
        amount: amountNum,
        paymentMethod,
        phoneNumber,
        notes: paymentNotes || 'Mobile payment settlement',
        reference: generatedRef
      });

      // Show receipt modal
      setReceiptData({
        app: payingApp,
        amount: amountNum,
        method: paymentMethod,
        ref: generatedRef,
        timestamp: new Date().toISOString(),
        newBalance
      });

      setPayingApp(null);
    } catch (err: any) {
      console.error('Failed to submit repayment:', err);
      alert(err.message || 'Payment submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Coins className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              SME Loan Repayments & Debt Portfolio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Monitor disbursed credit facilities, track real-time settlement status (repaid vs. outstanding), execute mobile/bank payments, and view official repayment statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/my-applications">
            <Button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs h-9 px-4 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#2998d6]" />
              My Applications
            </Button>
          </Link>
          <Link to="/opportunity-hub">
            <Button className="bg-[#2998d6] hover:bg-[#1f85be] text-white font-bold text-xs h-9 px-4 flex items-center gap-2 border-none">
              Explore More Credit
            </Button>
          </Link>
        </div>
      </div>

      {/* Portfolio KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Disbursed */}
        <div className="accounting-card p-4">
          <span className="accounting-label !text-[11px] uppercase tracking-wider font-semibold">
            Total Disbursed Capital
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 truncate">
              {formatRWF(portfolioMetrics.totalDisbursed)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Across {portfolioMetrics.totalLoans} loan {portfolioMetrics.totalLoans === 1 ? 'facility' : 'facilities'}
          </span>
        </div>

        {/* Total Amount Repaid */}
        <div className="accounting-card p-4 border-l-4 border-l-emerald-500">
          <span className="accounting-label !text-[11px] uppercase tracking-wider font-semibold text-emerald-700">
            Total Amount Repaid
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-600 truncate">
              {formatRWF(portfolioMetrics.totalPaid)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${portfolioMetrics.repaymentProgress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 font-mono">
              {portfolioMetrics.repaymentProgress}%
            </span>
          </div>
        </div>

        {/* Remaining Outstanding Balance */}
        <div className="accounting-card p-4 border-l-4 border-l-sky-500">
          <span className="accounting-label !text-[11px] uppercase tracking-wider font-semibold text-sky-700">
            Remaining Debt Balance
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 truncate">
              {formatRWF(portfolioMetrics.totalRemaining)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Outstanding principal & interest</span>
        </div>

        {/* Settlement Status */}
        <div className="accounting-card p-4">
          <span className="accounting-label !text-[11px] uppercase tracking-wider font-semibold">
            Settlement Status
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
              {portfolioMetrics.fullySettledCount} / {portfolioMetrics.totalLoans}
            </span>
            <span className="text-xs text-slate-500 font-medium">Settled</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
            {portfolioMetrics.totalLoans > 0 && portfolioMetrics.fullySettledCount === portfolioMetrics.totalLoans
              ? '✓ All facilities fully cleared'
              : `${portfolioMetrics.totalLoans - portfolioMetrics.fullySettledCount} active repayment schedule(s)`}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search facility name, bank, or loan ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#2998d6]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterSettlement('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterSettlement === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Loans ({disbursedLoans.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterSettlement('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterSettlement === 'active'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active / In Repayment
          </button>
          <button
            type="button"
            onClick={() => setFilterSettlement('repaid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterSettlement === 'repaid'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Fully Repaid (100%)
          </button>
        </div>
      </div>

      {/* Disbursed Loans Listing Table / Cards */}
      {disbursedLoans.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Coins className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Disbursed Loans Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || filterSettlement !== 'all'
              ? 'No credit facilities match your search filters.'
              : 'You currently have no disbursed credit facilities. Once an application is approved and funds are released, your repayment schedule will appear here.'}
          </p>
          <Link to="/my-applications">
            <Button className="bg-[#2998d6] hover:bg-[#1f85be] text-white text-xs font-bold h-8 px-4 mt-2 border-none">
              View Application Statuses
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="p-3.5 sm:px-4">Credit Facility &amp; Lender</th>
                  <th className="p-3.5 sm:px-4 text-right">Amount Disbursed</th>
                  <th className="p-3.5 sm:px-4 text-right">Monthly Due</th>
                  <th className="p-3.5 sm:px-4 text-right">Amount Repaid</th>
                  <th className="p-3.5 sm:px-4 text-right">Remaining Balance</th>
                  <th className="p-3.5 sm:px-4 text-center">Status (Repaid or Not)</th>
                  <th className="p-3.5 sm:px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {disbursedLoans.map((app) => {
                  const disbursedAmount = app.disbursedAmount || app.approvedAmount || app.requestedAmount || 5000000;
                  const totalPayable = app.totalPayable || disbursedAmount;
                  const paid = app.totalPaid || 0;
                  const remaining = app.remainingBalance !== undefined ? app.remainingBalance : Math.max(0, totalPayable - paid);
                  const isFullyRepaid = remaining <= 0 || app.status === 'Completed';
                  const percentRepaid = totalPayable > 0 ? Math.min(100, Math.round((paid / totalPayable) * 100)) : 0;

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition">
                      {/* Facility & Lender */}
                      <td className="p-3.5 sm:px-4">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-900 block hover:text-[#2998d6] transition">
                            {app.opportunityTitle}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <Building2 className="w-3 h-3 text-[#2998d6]" />
                              {app.institution || 'Commercial Bank Partner'}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-slate-400">Ref #{app.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Disbursed Amount */}
                      <td className="p-3.5 sm:px-4 text-right font-mono">
                        <span className="font-extrabold text-slate-900 text-xs block">
                          {formatRWF(disbursedAmount)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {app.interestRate || 14}% p.a. · {app.termMonths || 12}M
                        </span>
                      </td>

                      {/* Monthly Due */}
                      <td className="p-3.5 sm:px-4 text-right font-mono">
                        <span className="font-extrabold text-[#1f85be] text-xs block">
                          {formatRWF(app.monthlyInstallment || Math.round(disbursedAmount / (app.termMonths || 12)))}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                          <Calendar className="w-3 h-3" />
                          {app.nextDueDate || '28th of month'}
                        </span>
                      </td>

                      {/* Amount Repaid */}
                      <td className="p-3.5 sm:px-4 text-right font-mono">
                        <span className="font-extrabold text-emerald-600 text-xs block">
                          {formatRWF(paid)}
                        </span>
                        <div className="mt-1 flex items-center justify-end gap-1.5">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${percentRepaid}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{percentRepaid}%</span>
                        </div>
                      </td>

                      {/* Remaining Balance */}
                      <td className="p-3.5 sm:px-4 text-right font-mono">
                        <span className={`font-extrabold text-xs block ${remaining > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                          {formatRWF(remaining)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {remaining > 0 ? 'Principal outstanding' : 'Zero balance'}
                        </span>
                      </td>

                      {/* Status: Repaid or Not */}
                      <td className="p-3.5 sm:px-4 text-center">
                        {isFullyRepaid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Fully Repaid (100%)
                          </span>
                        ) : paid > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-500" /> Partially Repaid ({percentRepaid}%)
                            </span>
                            <span className="text-[9.5px] text-slate-500 font-mono mt-0.5">
                              {formatRWF(remaining)} left
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                            <TrendingDown className="w-3 h-3 text-rose-500" /> Not Repaid (0%)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 sm:px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Make Repayment button */}
                          {!isFullyRepaid && (
                            <Button
                              type="button"
                              onClick={() => handleOpenPayment(app)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 flex items-center gap-1.5 shadow-xs border-none"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Make Repayment</span>
                            </Button>
                          )}

                          {/* Repayment Statement button */}
                          <Button
                            type="button"
                            onClick={() => setStatementApp(app)}
                            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs h-8 px-3 flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#2998d6]" />
                            <span>Statement</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MAKE REPAYMENT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {payingApp && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 bg-[#1a2332] text-white flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-white/10 text-emerald-400">
                    <Coins className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wider">
                      Make Loan Repayment
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      {payingApp.opportunityTitle} · Ref #{payingApp.id.slice(0, 8)}
                    </p>
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

              {/* Form Content */}
              <form onSubmit={handleSubmitRepayment} className="p-5 space-y-4 text-xs">
                {/* Financial Overview Card */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      Remaining Balance
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">
                      {formatRWF(payingApp.remainingBalance !== undefined ? payingApp.remainingBalance : (payingApp.totalPayable || 5000000))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      Monthly Installment
                    </span>
                    <span className="text-sm font-extrabold text-[#1f85be] font-mono">
                      {formatRWF(payingApp.monthlyInstallment || 450000)}
                    </span>
                  </div>
                </div>

                {/* Amount Quick Select Pills */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    Select Quick Repayment Preset
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(String(payingApp.monthlyInstallment || 450000))}
                      className="p-2 border border-slate-200 hover:border-[#2998d6] rounded-lg text-left bg-white transition"
                    >
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">1x Installment</span>
                      <span className="text-xs font-extrabold text-slate-800 font-mono">
                        {formatRWF(payingApp.monthlyInstallment || 450000)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(String((payingApp.monthlyInstallment || 450000) * 2))}
                      className="p-2 border border-slate-200 hover:border-[#2998d6] rounded-lg text-left bg-white transition"
                    >
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">2x Installments</span>
                      <span className="text-xs font-extrabold text-slate-800 font-mono">
                        {formatRWF((payingApp.monthlyInstallment || 450000) * 2)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const rem = payingApp.remainingBalance !== undefined ? payingApp.remainingBalance : (payingApp.totalPayable || 5000000);
                        setPaymentAmount(String(rem));
                      }}
                      className="p-2 border border-emerald-300 bg-emerald-50/50 hover:border-emerald-500 rounded-lg text-left transition"
                    >
                      <span className="text-[9px] text-emerald-700 uppercase font-bold block">Pay Full Balance</span>
                      <span className="text-xs font-extrabold text-emerald-900 font-mono">
                        Clear All
                      </span>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    Repayment Amount (RWF) <span className="text-rose-500">*</span>
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

                {/* Payment Method Selector */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'MTN Mobile Money', label: 'MTN MoMo', icon: Smartphone, color: 'text-amber-500' },
                      { id: 'Airtel Money', label: 'Airtel Money', icon: Smartphone, color: 'text-rose-500' },
                      { id: 'Bank Transfer (RTGS / Internal)', label: 'Bank Wire / RTGS', icon: Building2, color: 'text-blue-500' },
                      { id: 'Debit / Credit Card', label: 'Bank Card', icon: CreditCard, color: 'text-emerald-500' }
                    ].map((m) => {
                      const isSelected = paymentMethod === m.id;
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition ${
                            isSelected
                              ? 'border-[#2998d6] bg-sky-50/50 text-[#1f85be] font-bold ring-1 ring-[#2998d6]'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${m.color}`} />
                          <span className="text-xs">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Phone / Account Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      Mobile / Account Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 0788 123 456"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#2998d6]"
                      required
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
                      placeholder="e.g. Installment Month 2"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#2998d6]"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <Button
                    type="button"
                    onClick={() => setPayingApp(null)}
                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs h-9 px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-5 shadow-xs border-none"
                  >
                    {isSubmitting ? 'Authorizing Payment...' : `Authorize Repayment of ${formatRWF(parseFloat(paymentAmount) || 0)}`}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. REPAYMENT STATEMENT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {statementApp && (() => {
          const disbursedAmount = statementApp.disbursedAmount || statementApp.approvedAmount || statementApp.requestedAmount || 5000000;
          const totalPayable = statementApp.totalPayable || disbursedAmount;
          const totalPaid = statementApp.totalPaid || 0;
          const remaining = statementApp.remainingBalance !== undefined ? statementApp.remainingBalance : Math.max(0, totalPayable - totalPaid);
          const isFullyRepaid = remaining <= 0 || statementApp.status === 'Completed';
          const payments = statementApp.payments || [];

          return (
            <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
              >
                {/* Statement Header Controls */}
                <div className="p-4 border-b border-slate-200 bg-[#1a2332] text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-white/10 text-emerald-400">
                      <FileText className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider">
                        Official Loan Repayment Statement
                      </h3>
                      <p className="text-[11px] text-slate-300">
                        {statementApp.opportunityTitle} · Facility #{statementApp.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Statement</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatementApp(null)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Printable Statement Canvas */}
                <div className="p-6 space-y-6 overflow-y-auto text-xs bg-white">
                  {/* Bank & Borrower Dossier Box */}
                  <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 border-b-2 border-slate-800">
                    <div>
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Lending Institution</span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                        {statementApp.institution || 'Commercial Banking Partner'}
                      </h4>
                      <p className="text-xs text-slate-500">Commercial Credit &amp; Clearing Division</p>
                      <p className="text-xs text-slate-500">Kigali Financial District, Rwanda</p>
                    </div>

                    <div className="sm:text-right">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Borrower Dossier</span>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{activeSme.name}</h4>
                      <p className="text-xs text-slate-500">Sector: {activeSme.sector}</p>
                      <p className="text-xs text-slate-500">Statement Date: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Repayment Status Ribbon */}
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isFullyRepaid
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-sky-50 border-sky-200 text-sky-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg ${isFullyRepaid ? 'bg-emerald-600 text-white' : 'bg-[#2998d6] text-white'}`}>
                        {isFullyRepaid ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </span>
                      <div>
                        <span className="text-xs font-extrabold uppercase tracking-wider block">
                          {isFullyRepaid ? 'Settled in Full (Zero Debt)' : 'Active Good Standing'}
                        </span>
                        <span className="text-[10.5px] opacity-80">
                          {isFullyRepaid
                            ? 'All principal and agreed interest obligations have been cleared.'
                            : 'Installments serviced according to registered repayment schedule.'}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold font-mono">
                      {isFullyRepaid ? '100% Repaid' : `${totalPayable > 0 ? Math.round((totalPaid / totalPayable) * 100) : 0}% Paid`}
                    </span>
                  </div>

                  {/* 4 Financial Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Disbursed Principal</span>
                      <span className="text-sm font-extrabold font-mono text-slate-900 block mt-0.5">
                        {formatRWF(disbursedAmount)}
                      </span>
                      <span className="text-[9.5px] text-slate-400">{statementApp.termMonths || 12} Months Term</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Installment</span>
                      <span className="text-sm font-extrabold font-mono text-[#1f85be] block mt-0.5">
                        {formatRWF(statementApp.monthlyInstallment || Math.round(disbursedAmount / (statementApp.termMonths || 12)))}
                      </span>
                      <span className="text-[9.5px] text-slate-400">Due monthly</span>
                    </div>

                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <span className="text-[9.5px] font-bold text-emerald-800 uppercase tracking-wider block">Total Repaid</span>
                      <span className="text-sm font-extrabold font-mono text-emerald-700 block mt-0.5">
                        {formatRWF(totalPaid)}
                      </span>
                      <span className="text-[9.5px] text-emerald-600">{payments.length} Payments recorded</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Remaining Balance</span>
                      <span className={`text-sm font-extrabold font-mono block mt-0.5 ${remaining > 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                        {formatRWF(remaining)}
                      </span>
                      <span className="text-[9.5px] text-slate-400">{remaining > 0 ? 'Current liability' : 'Fully Cleared'}</span>
                    </div>
                  </div>

                  {/* Itemized Payments History Table */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center justify-between">
                      <span>Itemized Repayments Audit Trail</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Elevata Central Clearing Verification
                      </span>
                    </h5>

                    {payments.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                        <Coins className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                        <span className="text-xs font-medium block">No payment records logged yet.</span>
                        <span className="text-[10px] text-slate-400">Installments will appear here once submitted.</span>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
                              <th className="p-2.5">Date &amp; Time</th>
                              <th className="p-2.5">Channel / Method</th>
                              <th className="p-2.5">Reference ID</th>
                              <th className="p-2.5 text-right">Amount Paid</th>
                              <th className="p-2.5 text-right">Remaining Principal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {(() => {
                              let runningBalance = totalPayable;
                              return payments.map((p, idx) => {
                                runningBalance = Math.max(0, runningBalance - p.amount);
                                return (
                                  <tr key={p.id || idx} className="hover:bg-slate-50">
                                    <td className="p-2.5 text-slate-700">
                                      {p.paidAt ? new Date(p.paidAt).toLocaleString() : 'Recent'}
                                    </td>
                                    <td className="p-2.5 text-slate-900 font-sans font-semibold">
                                      {p.method}
                                    </td>
                                    <td className="p-2.5 text-slate-500">
                                      {p.reference || `REF-${idx + 1}`}
                                    </td>
                                    <td className="p-2.5 text-right font-extrabold text-emerald-600">
                                      +{formatRWF(p.amount)}
                                    </td>
                                    <td className="p-2.5 text-right font-extrabold text-slate-900">
                                      {formatRWF(runningBalance)}
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
                  <p className="text-[10px] text-slate-400">
                    Official financial statement certified by Elevata SME Clearing Engine.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setStatementApp(null)}
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

      {/* ========================================================================= */}
      {/* 3. PAYMENT RECEIPT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {receiptData && (
          <div className="fixed inset-0 z-80 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-5"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Repayment Authorized Successfully
                </h3>
                <p className="text-xs text-slate-500">
                  Your loan payment has been recorded and committed to the bank clearing ledger.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-sans">Payment Ref:</span>
                  <span className="font-extrabold text-slate-900">{receiptData.ref}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-sans">Facility:</span>
                  <span className="font-sans font-bold text-slate-900 text-right truncate max-w-[180px]">
                    {receiptData.app.opportunityTitle}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-sans">Channel:</span>
                  <span className="font-sans font-bold text-slate-900">{receiptData.method}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-sans">Amount Paid:</span>
                  <span className="text-emerald-600 font-extrabold text-sm">
                    {formatRWF(receiptData.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">New Balance:</span>
                  <span className="text-slate-900 font-extrabold">
                    {formatRWF(receiptData.newBalance)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs h-9"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Print Receipt
                </Button>
                <Button
                  type="button"
                  onClick={() => setReceiptData(null)}
                  className="flex-1 bg-[#2998d6] hover:bg-[#1f85be] text-white font-bold text-xs h-9 border-none"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


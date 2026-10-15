import React, { useState, useEffect, useMemo } from 'react';
import {
  financialDemoApi,
  DemoLoan,
  SmeOverviewData,
  DemoSme
} from '../services/financialDemoApi';
import { formatRWF } from '../lib/mockData';
import { Card, CardContent } from '../assets/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Landmark,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Calendar,
  Search,
  FileText,
  X,
  Sparkles,
  Building2,
  Check,
} from 'lucide-react';
import LoanEngine from './LoanEngine';
import mobileMoneyImg from '../assets/images/Mobile_money.png';
import airtelMoneyImg from '../assets/images/airtel_money.png';
import bankTransferImg from '../assets/images/bank_transfer.png';

export default function SmeLoansPage() {
  const [activeTab, setActiveTab] = useState<'loans' | 'engine'>('loans');
  const [loading, setLoading] = useState(true);
  const [smeOverview, setSmeOverview] = useState<SmeOverviewData | null>(null);
  const [loans, setLoans] = useState<DemoLoan[]>([]);
  const [demoSmes, setDemoSmes] = useState<DemoSme[]>([]);
  const [currentSmeId, setCurrentSmeId] = useState<string>('sme-1');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'danger' | 'warning' | 'info'; text: string } | null>(null);

  // Details Modal State (Statements & Loan Info)
  const [detailsLoan, setDetailsLoan] = useState<DemoLoan | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [statementFilter, setStatementFilter] = useState<'ALL' | 'Repayment' | 'Disbursement'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Repayment Modal State
  // Repayment Modal State (Payment Methods: Mobile Money, Airtel Money, Bank)
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [repayLoanId, setRepayLoanId] = useState<string>('');
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [paymentSource, setPaymentSource] = useState<'momo' | 'airtel' | 'bank'>('momo');
  const [momoPhoneNumber, setMomoPhoneNumber] = useState<string>('+250 788 412 890');
  const [airtelPhoneNumber, setAirtelPhoneNumber] = useState<string>('+250 733 892 104');
  const [bankAccount, setBankAccount] = useState<string>('40032918451');
  const [selectedBank, setSelectedBank] = useState<string>('Bank of Kigali');
  const [repayOutcome, setRepayOutcome] = useState<'success' | 'pending' | 'failure'>('success');
  const [isProcessingRepay, setIsProcessingRepay] = useState(false);
  const [repayResult, setRepayResult] = useState<any | null>(null);
  const [repayStep, setRepayStep] = useState<'form' | 'processing' | 'result'>('form');

  const showToast = (type: 'success' | 'danger' | 'warning' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const loadData = async (smeIdToLoad = currentSmeId) => {
    setLoading(true);
    try {
      const [meta, overview, loansData] = await Promise.all([
        financialDemoApi.getDemoMeta(),
        financialDemoApi.getSmeOverview(smeIdToLoad),
        financialDemoApi.getSmeLoans(smeIdToLoad)
      ]);
      setDemoSmes(meta.demoSmes || []);
      setSmeOverview(overview);
      setLoans(loansData);

      // Keep details modal synchronized if currently open
      if (detailsLoan) {
        const updated = loansData.find(l => l.id === detailsLoan.id);
        if (updated) setDetailsLoan(updated);
      }
    } catch (err: any) {
      console.error('Failed to load SME loans data:', err);
      showToast('danger', 'Unable to load loan records from the service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentSmeId);
  }, [currentSmeId]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadData(currentSmeId);
    };

    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [currentSmeId]);

  // Selected loan for repayment
  const targetRepayLoan = useMemo(() => {
    return loans.find(l => l.id === repayLoanId) || (loans.length > 0 ? loans[0] : null);
  }, [loans, repayLoanId]);

  // Filtered statement history in details modal
  const filteredStatement = useMemo(() => {
    if (!detailsLoan) return [];
    let list = detailsLoan.statement || [];
    if (statementFilter !== 'ALL') {
      list = list.filter(item => item.type === statementFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(item =>
        item.description.toLowerCase().includes(term) ||
        item.reference.toLowerCase().includes(term) ||
        item.date.includes(term)
      );
    }
    return list;
  }, [detailsLoan, statementFilter, searchTerm]);

  // Handlers
  const handleOpenDetailsModal = (loan: DemoLoan) => {
    setDetailsLoan(loan);
    setStatementFilter('ALL');
    setSearchTerm('');
    setIsDetailsModalOpen(true);
  };

  const handleOpenRepayModal = (loan: DemoLoan) => {
    setRepayLoanId(loan.id);
    setRepayAmount(String(loan.monthlyInstallment || Math.min(loan.outstandingPrincipal, 500000)));
    setRepayStep('form');
    setRepayResult(null);
    setIsRepayModalOpen(true);
  };

  const handleExecuteRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(repayAmount);
    if (!amountNum || amountNum <= 0) {
      showToast('warning', 'Please enter a valid repayment amount greater than zero.');
      return;
    }

    const loanToRepay = targetRepayLoan;
    if (!loanToRepay) {
      showToast('danger', 'Selected loan not found.');
      return;
    }

    if (amountNum > loanToRepay.outstandingPrincipal) {
      showToast('warning', `Repayment cannot exceed outstanding balance (${formatRWF(loanToRepay.outstandingPrincipal)}).`);
      return;
    }

    if (paymentSource === 'momo' && !momoPhoneNumber.trim()) {
      showToast('warning', 'Please provide a valid MTN Mobile Money phone number.');
      return;
    }
    if (paymentSource === 'airtel' && !airtelPhoneNumber.trim()) {
      showToast('warning', 'Please provide a valid Airtel Money phone number.');
      return;
    }
    if (paymentSource === 'bank' && !bankAccount.trim()) {
      showToast('warning', 'Please provide a valid bank account number.');
      return;
    }

    setIsProcessingRepay(true);
    setRepayStep('processing');

    try {
      const idempotencyKey = `IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      let channel: 'Mobile Money' | 'Bank Transfer' = 'Mobile Money';
      let paymentDetails: any = {};

      if (paymentSource === 'momo') {
        channel = 'Mobile Money';
        paymentDetails = {
          provider: 'MTN Mobile Money Rwanda',
          phoneNumber: momoPhoneNumber
        };
      } else if (paymentSource === 'airtel') {
        channel = 'Mobile Money';
        paymentDetails = {
          provider: 'Airtel Money Rwanda',
          phoneNumber: airtelPhoneNumber
        };
      } else {
        channel = 'Bank Transfer';
        paymentDetails = {
          bankName: selectedBank,
          accountNumber: bankAccount
        };
      }

      const result = await financialDemoApi.repayLoan({
        loanId: loanToRepay.id,
        amount: amountNum,
        channel,
        paymentDetails,
        idempotencyKey,
        simulateOutcome: repayOutcome
      });

      setRepayResult(result);
      setRepayStep('result');

      // Refresh data to reflect state
      await loadData(currentSmeId);

      if (result.success) {
        showToast('success', `Repayment of ${formatRWF(amountNum)} sent to ${loanToRepay.institutionName}. Reference: ${result.transactionReference}`);
      } else if (result.isPending) {
        showToast('warning', `Repayment pending authorization. Reference: ${result.transactionReference}`);
      } else {
        showToast('danger', 'Repayment was declined by the payment provider.');
      }
    } catch (err: any) {
      console.error('Repayment error:', err);
      showToast('danger', err.message || 'Payment execution failed.');
      setRepayStep('form');
    } finally {
      setIsProcessingRepay(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      await financialDemoApi.resetDemo();
      showToast('info', 'Loan records refreshed to the latest account position.');
      await loadData(currentSmeId);
      if (isDetailsModalOpen && detailsLoan) {
        setIsDetailsModalOpen(false);
      }
    } catch (err: any) {
      showToast('danger', 'Failed to refresh loan records.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 border ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950 text-emerald-100 border-emerald-700'
            : toastMessage.type === 'danger'
            ? 'bg-rose-950 text-rose-100 border-rose-700'
            : toastMessage.type === 'warning'
            ? 'bg-amber-950 text-amber-100 border-amber-700'
            : 'bg-slate-900 text-slate-100 border-slate-700'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'danger' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toastMessage.type === 'warning' && <Clock className="w-4 h-4 text-amber-400 shrink-0" />}
          {toastMessage.type === 'info' && <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Account header */}
      <div className="bg-white rounded-[4px] p-4 sm:p-5 shadow-sm border border-[#cbd5e1] border-t-4 border-t-[#2998d6] relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-wider bg-[#e0f2fe] text-[#0369a1] font-mono border border-[#bae6fd]">
                BUSINESS FINANCE
              </span>
              <span className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Connected account services
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-[#1e293b] font-heading flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#2998d6]" />
              SME Loans &amp; Direct Repayments Gateway
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl">
              Track active loan facilities provided by regulated Financial Institutions. Inspect full statement histories and execute direct digital repayments routed automatically to the issuing lender.
            </p>
          </div>

    
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('loans')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'loans'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Loans Taken &amp; Repayments</span>
          {loans.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-sky-100 text-sky-700 rounded-full text-[10px] font-mono">
              {loans.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('engine')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'engine'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>AI Credit Capacity Simulator</span>
        </button>
      </div>

      {activeTab === 'engine' ? (
        <LoanEngine />
      ) : (
        <div className="space-y-6">
          {/* TOP KPI OVERVIEW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Total Loan Amount
                </span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {formatRWF(smeOverview?.totalBorrowed || 0)}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Cumulative borrowed facilities
                </span>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 font-mono">
                  Total Amount Paid
                </span>
                <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
                  {formatRWF(smeOverview?.totalRepaymentsMade || 0)}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Successfully credited to lenders
                </span>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 font-mono">
                  Remaining Balance
                </span>
                <div className="text-xl font-bold font-mono text-rose-600 mt-1">
                  {formatRWF(smeOverview?.outstandingPrincipal || 0)}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Active principal to clear
                </span>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 font-mono">
                  Next Due Installment
                </span>
                <div className="text-xl font-bold font-mono text-sky-700 mt-1">
                  {formatRWF(smeOverview?.nextRepaymentAmount || 0)}
                </div>
                <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-0.5 font-mono">
                  <Calendar className="w-3 h-3 text-sky-500" />
                  <span>Due: {smeOverview?.nextRepaymentDueDate || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* LIST OF LOANS TAKEN */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-sky-600" />
                  <span>Loans Taken with Financial Institutions</span>
                  <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 font-mono rounded-full font-semibold">
                    {loans.length} {loans.length === 1 ? 'Facility' : 'Facilities'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Each loan below displays the issuing Financial Institution (FI), total borrowed amount, amount paid so far, remaining balance, statement history, and direct payment button.
                </p>
              </div>
            </div>

            {loans.length === 0 ? (
              <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No loan facilities found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  There are no active or completed loan facilities currently registered for this SME.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {loans.map((loan) => {
                  const isActive = loan.status === 'Active';
                  const isFullyRepaid = loan.status === 'Fully Repaid';
                  const origAmount = loan.originalPrincipal || 1;
                  const paidPct = Math.min(100, Math.round((loan.totalRepaymentsMade / origAmount) * 100));

                  return (
                    <div
                      key={loan.id}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition space-y-4"
                    >
                      {/* Card Top: FI + Product Info + Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 uppercase font-mono tracking-wide">
                                {loan.institutionName}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs font-mono font-bold text-slate-600">
                                Ref: {loan.referenceNumber}
                              </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                              {loan.productName}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isFullyRepaid
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {loan.status}
                          </span>
                          {loan.disbursementStatus === 'Completed' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-sky-50 text-sky-700 border border-sky-200">
                              Funds credited
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Financial Terms Matrix (Amount Taken, Paid, Remaining) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-150">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">
                            Loan Amount Taken
                          </span>
                          <span className="text-sm sm:text-base font-bold font-mono text-slate-900">
                            {formatRWF(loan.originalPrincipal)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">
                            Amount Paid
                          </span>
                          <span className="text-sm sm:text-base font-bold font-mono text-emerald-600">
                            {formatRWF(loan.totalRepaymentsMade)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">
                            Amount Remaining
                          </span>
                          <span className="text-sm sm:text-base font-bold font-mono text-rose-600">
                            {formatRWF(loan.outstandingPrincipal)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">
                            Monthly Installment
                          </span>
                          <span className="text-sm sm:text-base font-bold font-mono text-slate-800">
                            {formatRWF(loan.monthlyInstallment)}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar of loan repayment */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-500 font-medium">Amortization Progress</span>
                          <span className="font-bold text-slate-800">
                            {paidPct}% Repaid ({formatRWF(loan.totalRepaymentsMade)} of {formatRWF(loan.originalPrincipal)})
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFullyRepaid ? 'bg-slate-400' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${paidPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Bar: Terms & Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                          <span>Interest: <strong className="text-slate-800">{loan.interestRate}% p.a.</strong></span>
                          <span>•</span>
                          <span>Term: <strong className="text-slate-800">{loan.termMonths} Months</strong></span>
                          {loan.statement && loan.statement.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{loan.statement.length} Statement {loan.statement.length === 1 ? 'Entry' : 'Entries'}</span>
                            </>
                          )}
                        </div>

                        {loan.disbursementStatus === 'Completed' && loan.disbursementReference && (
                          <div className="text-[10px] text-sky-700 font-mono">
                            Disbursed {loan.disbursedAt ? new Date(loan.disbursedAt).toLocaleDateString() : ''}
                            {' • Ref: '}{loan.disbursementReference}
                          </div>
                        )}

                        <div className="flex items-center gap-2.5">
                          {/* View Details Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetailsModal(loan)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-slate-600" />
                            <span>View Details</span>
                          </button>

                          {/* Make Payment Button */}
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => handleOpenRepayModal(loan)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                            >
                              <CreditCard className="w-4 h-4" />
                              <span>Make Payment</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL (Statements History & Loan Terms) */}
      <AnimatePresence>
        {isDetailsModalOpen && detailsLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden my-6 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4 shrink-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-200">
                        {detailsLoan.institutionName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-200 text-slate-800">
                        {detailsLoan.referenceNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                        detailsLoan.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : detailsLoan.status === 'Fully Repaid'
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {detailsLoan.status}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                      {detailsLoan.productName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Issuing Financial Institution: <strong className="text-slate-800">{detailsLoan.institutionName}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {detailsLoan.status === 'Active' && (
                    <button
                      onClick={() => {
                        handleOpenRepayModal(detailsLoan);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Make Payment</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body (Scrollable) */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
                {/* Financial Overview Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10.5px] text-slate-400 uppercase font-mono block">Loan Amount Taken</span>
                    <span className="text-base font-bold font-mono text-slate-900">{formatRWF(detailsLoan.originalPrincipal)}</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-400 uppercase font-mono block">Amount Paid So Far</span>
                    <span className="text-base font-bold font-mono text-emerald-600">{formatRWF(detailsLoan.totalRepaymentsMade)}</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-400 uppercase font-mono block">Remaining Balance</span>
                    <span className="text-base font-bold font-mono text-rose-600">{formatRWF(detailsLoan.outstandingPrincipal)}</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-400 uppercase font-mono block">Monthly Due</span>
                    <span className="text-base font-bold font-mono text-sky-700">{formatRWF(detailsLoan.monthlyInstallment)}</span>
                  </div>
                </div>

                {/* Additional Loan Terms */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50/60 p-3.5 rounded-xl border border-slate-150">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono block">Interest Rate</span>
                    <strong className="font-mono text-slate-800">{detailsLoan.interestRate}% Annually</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono block">Loan Duration</span>
                    <strong className="font-mono text-slate-800">{detailsLoan.termMonths} Months</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono block">Disbursement Channel</span>
                    <strong className="font-mono text-slate-800">Direct Account Credit</strong>
                  </div>
                </div>

                {/* Repayment Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500 font-semibold">Repayment Completion</span>
                    <span className="font-bold text-slate-900">
                      {Math.round((detailsLoan.totalRepaymentsMade / (detailsLoan.originalPrincipal || 1)) * 100)}% Repaid
                    </span>
                  </div>
                  <div className="w-full bg-slate-150 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round((detailsLoan.totalRepaymentsMade / (detailsLoan.originalPrincipal || 1)) * 100))}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Paid: {formatRWF(detailsLoan.totalRepaymentsMade)}</span>
                    <span>Remaining: {formatRWF(detailsLoan.outstandingPrincipal)}</span>
                  </div>
                </div>

                {/* STATEMENTS HISTORY & AUDIT LEDGER */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-700" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                        Statement History &amp; Audit Ledger ({filteredStatement.length})
                      </h4>
                    </div>

                    {/* Statement filters */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                        <input
                          type="text"
                          placeholder="Search ref or description..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs w-44 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <select
                        value={statementFilter}
                        onChange={(e) => setStatementFilter(e.target.value as any)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                      >
                        <option value="ALL">All Transactions</option>
                        <option value="Repayment">Repayments</option>
                        <option value="Disbursement">Disbursements</option>
                      </select>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                            <th className="p-3 font-semibold">Date</th>
                            <th className="p-3 font-semibold">Type</th>
                            <th className="p-3 font-semibold">Description &amp; Reference</th>
                            <th className="p-3 font-semibold text-right">Debit</th>
                            <th className="p-3 font-semibold text-right">Credit</th>
                            <th className="p-3 font-semibold text-right">Remaining Balance</th>
                            <th className="p-3 font-semibold text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredStatement.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                                No statement entries recorded for this filter.
                              </td>
                            </tr>
                          ) : (
                            filteredStatement.map((entry) => (
                              <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                                <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                                  {entry.date}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                    entry.type === 'Disbursement'
                                      ? 'bg-sky-50 text-sky-700'
                                      : 'bg-emerald-50 text-emerald-700'
                                  }`}>
                                    {entry.type}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="font-semibold text-slate-900">{entry.description}</div>
                                  <div className="text-[10px] font-mono text-slate-400">Ref: {entry.reference}</div>
                                </td>
                                <td className="p-3 text-right font-mono text-emerald-600 font-semibold">
                                  {entry.debit > 0 ? formatRWF(entry.debit) : '-'}
                                </td>
                                <td className="p-3 text-right font-mono text-sky-700 font-semibold">
                                  {entry.credit > 0 ? formatRWF(entry.credit) : '-'}
                                </td>
                                <td className="p-3 text-right font-mono text-slate-900 font-bold">
                                  {formatRWF(entry.runningBalance)}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono border ${
                                    entry.status === 'Completed'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : entry.status === 'Pending'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}>
                                    {entry.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-500 font-mono">
                  Issuing FI: <strong className="text-slate-800">{detailsLoan.institutionName}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Close
                  </button>
                  {detailsLoan.status === 'Active' && (
                    <button
                      type="button"
                      onClick={() => handleOpenRepayModal(detailsLoan)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Make Payment</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MAKE PAYMENT MODAL */}
      <AnimatePresence>
        {isRepayModalOpen && targetRepayLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden my-6 flex flex-col"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Payment Methods
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select payment source sender to repay facility
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-indigo-200 bg-indigo-50/70 flex items-center justify-center text-indigo-500">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRepayModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                {repayStep === 'form' && (
                  <form onSubmit={handleExecuteRepayment} className="space-y-4">
                    {/* AUTOMATIC DESTINATION FINANCIAL INSTITUTION */}
                    <div className="p-3 bg-sky-50/70 border border-sky-200/80 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9.5px] uppercase font-mono font-bold text-sky-800 block truncate">
                            Destination Lender (Beneficiary)
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {targetRepayLoan.institutionName}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono block truncate">
                            {targetRepayLoan.productName} ({targetRepayLoan.referenceNumber})
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-mono font-bold rounded border border-sky-200 shrink-0">
                        Auto-Routed
                      </span>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Repayment Amount (RWF)
                        </label>
                        <span className="text-[10.5px] text-slate-500 font-mono">
                          Remaining: <strong className="text-rose-600">{formatRWF(targetRepayLoan.outstandingPrincipal)}</strong>
                        </span>
                      </div>
                      <input
                        type="number"
                        min="1000"
                        max={targetRepayLoan.outstandingPrincipal}
                        value={repayAmount}
                        onChange={(e) => setRepayAmount(e.target.value)}
                        placeholder="e.g. 500000"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:outline-none focus:border-teal-500 text-slate-900"
                        required
                      />

                      {/* Quick presets */}
                      <div className="flex gap-1.5 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setRepayAmount(String(targetRepayLoan.monthlyInstallment))}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-mono font-bold cursor-pointer transition"
                        >
                          Due ({formatRWF(targetRepayLoan.monthlyInstallment)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setRepayAmount(String(Math.round(targetRepayLoan.outstandingPrincipal * 0.5)))}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-mono font-bold cursor-pointer transition"
                        >
                          50% Balance
                        </button>
                        <button
                          type="button"
                          onClick={() => setRepayAmount(String(targetRepayLoan.outstandingPrincipal))}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-mono font-bold cursor-pointer transition"
                        >
                          Full ({formatRWF(targetRepayLoan.outstandingPrincipal)})
                        </button>
                      </div>
                    </div>

                    {/* MAIN PAYMENT METHODS CARD CONTAINER (MATCHING IMAGE) */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3.5">
                    

                      {/* Payment Methods List */}
                      <div className="space-y-2.5">
                        {/* 1. Mobile Money (MTN) */}
                        <div
                          onClick={() => setPaymentSource('momo')}
                          className={`relative rounded-xl transition-all cursor-pointer border ${
                            paymentSource === 'momo'
                              ? 'bg-slate-100/90 border-slate-300 shadow-xs'
                              : 'bg-white hover:bg-slate-50/80 border-slate-200'
                          }`}
                        >
                          {paymentSource === 'momo' && (
                            <div className="absolute -top-2 left-3 z-10 bg-amber-400 text-slate-900 font-black text-[9px] px-2 py-0.5 rounded shadow-xs uppercase tracking-wider font-mono">
                              Default
                            </div>
                          )}

                          <div className="p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {/* Payment method image logo */}
                              <div className="w-14 h-9 sm:w-16 sm:h-10 rounded-md bg-white p-1 flex items-center justify-center shadow-xs border border-slate-200 shrink-0 overflow-hidden">
                                <img
                                  src={mobileMoneyImg}
                                  alt="MTN Mobile Money"
                                  className="w-full h-full object-contain"
                                />
                              </div>

                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                  MTN Mobile Money
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  Phone: {momoPhoneNumber}
                                </p>
                              </div>
                            </div>

                            {/* Check indicator - NO EDIT BUTTON */}
                            <div className="shrink-0 flex items-center">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                                paymentSource === 'momo'
                                  ? 'border-teal-600 bg-teal-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}>
                                {paymentSource === 'momo' && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          </div>

                          {/* Expanded detail input for Phone Number */}
                          {paymentSource === 'momo' && (
                            <div className="px-3 pb-3 pt-2 border-t border-slate-200/80 bg-slate-50/70 rounded-b-xl space-y-1.5" onClick={(e) => e.stopPropagation()}>
                              <label className="text-[10px] font-bold text-slate-600 uppercase font-mono block">
                                MTN Rwanda Registered Phone Number
                              </label>
                              <div className="relative">
                                <Smartphone className="w-3.5 h-3.5 text-amber-500 absolute left-2.5 top-2.5" />
                                <input
                                  type="text"
                                  value={momoPhoneNumber}
                                  onChange={(e) => setMomoPhoneNumber(e.target.value)}
                                  placeholder="+250 788 412 890"
                                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                                  required
                                />
                              </div>
                              <p className="text-[10px] text-slate-500 font-mono">
                                USSD prompt will be dispatched to *182# on this mobile number.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 2. Airtel Money */}
                        <div
                          onClick={() => setPaymentSource('airtel')}
                          className={`relative rounded-xl transition-all cursor-pointer border ${
                            paymentSource === 'airtel'
                              ? 'bg-slate-100/90 border-slate-300 shadow-xs'
                              : 'bg-white hover:bg-slate-50/80 border-slate-200'
                          }`}
                        >
                          {paymentSource === 'airtel' && (
                            <div className="absolute -top-2 left-3 z-10 bg-amber-400 text-slate-900 font-black text-[9px] px-2 py-0.5 rounded shadow-xs uppercase tracking-wider font-mono">
                              Default
                            </div>
                          )}

                          <div className="p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {/* Payment method image logo */}
                              <div className="w-14 h-9 sm:w-16 sm:h-10 rounded-md bg-white p-1 flex items-center justify-center shadow-xs border border-slate-200 shrink-0 overflow-hidden">
                                <img
                                  src={airtelMoneyImg}
                                  alt="Airtel Money"
                                  className="w-full h-full object-contain"
                                />
                              </div>

                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                  Airtel Money
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  Phone: {airtelPhoneNumber}
                                </p>
                              </div>
                            </div>

                            {/* Check indicator - NO EDIT BUTTON */}
                            <div className="shrink-0 flex items-center">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                                paymentSource === 'airtel'
                                  ? 'border-teal-600 bg-teal-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}>
                                {paymentSource === 'airtel' && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          </div>

                          {/* Expanded detail input for Phone Number */}
                          {paymentSource === 'airtel' && (
                            <div className="px-3 pb-3 pt-2 border-t border-slate-200/80 bg-slate-50/70 rounded-b-xl space-y-1.5" onClick={(e) => e.stopPropagation()}>
                              <label className="text-[10px] font-bold text-slate-600 uppercase font-mono block">
                                Airtel Rwanda Registered Phone Number
                              </label>
                              <div className="relative">
                                <Smartphone className="w-3.5 h-3.5 text-red-500 absolute left-2.5 top-2.5" />
                                <input
                                  type="text"
                                  value={airtelPhoneNumber}
                                  onChange={(e) => setAirtelPhoneNumber(e.target.value)}
                                  placeholder="+250 733 892 104"
                                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                                  required
                                />
                              </div>
                              <p className="text-[10px] text-slate-500 font-mono">
                                USSD push authorization will be dispatched to *500# on Airtel Rwanda.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 3. Bank Account */}
                        <div
                          onClick={() => setPaymentSource('bank')}
                          className={`relative rounded-xl transition-all cursor-pointer border ${
                            paymentSource === 'bank'
                              ? 'bg-slate-100/90 border-slate-300 shadow-xs'
                              : 'bg-white hover:bg-slate-50/80 border-slate-200'
                          }`}
                        >
                          {paymentSource === 'bank' && (
                            <div className="absolute -top-2 left-3 z-10 bg-amber-400 text-slate-900 font-black text-[9px] px-2 py-0.5 rounded shadow-xs uppercase tracking-wider font-mono">
                              Default
                            </div>
                          )}

                          <div className="p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {/* Payment method image logo */}
                              <div className="w-14 h-9 sm:w-16 sm:h-10 rounded-md bg-white p-1 flex items-center justify-center shadow-xs border border-slate-200 shrink-0 overflow-hidden">
                                <img
                                  src={bankTransferImg}
                                  alt="Bank Transfer"
                                  className="w-full h-full object-contain"
                                />
                              </div>

                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                  Bank Account
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  {selectedBank} • Ending in ...{bankAccount.slice(-4) || '8451'}
                                </p>
                              </div>
                            </div>

                            {/* Check indicator - NO EDIT BUTTON */}
                            <div className="shrink-0 flex items-center">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                                paymentSource === 'bank'
                                  ? 'border-teal-600 bg-teal-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}>
                                {paymentSource === 'bank' && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          </div>

                          {/* Expanded detail input for Bank Selection and Account Number */}
                          {paymentSource === 'bank' && (
                            <div className="px-3 pb-3 pt-2 border-t border-slate-200/80 bg-slate-50/70 rounded-b-xl space-y-2.5" onClick={(e) => e.stopPropagation()}>
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 uppercase font-mono block mb-1">
                                  Select Bank
                                </label>
                                <select
                                  value={selectedBank}
                                  onChange={(e) => setSelectedBank(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                                >
                                  <option value="Bank of Kigali">Bank of Kigali (BK)</option>
                                  <option value="Equity Bank Rwanda">Equity Bank Rwanda</option>
                                  <option value="I&M Bank Rwanda">I&M Bank Rwanda</option>
                                  <option value="BPR Bank Rwanda">BPR Bank Rwanda</option>
                                  <option value="Cogebanque">Cogebanque</option>
                                  <option value="Access Bank Rwanda">Access Bank Rwanda</option>
                                  <option value="Ecobank Rwanda">Ecobank Rwanda</option>
                                  <option value="NCBA Bank Rwanda">NCBA Bank Rwanda</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-600 uppercase font-mono block mb-1">
                                  Bank Account Number
                                </label>
                                <div className="relative">
                                  <Landmark className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-2.5" />
                                  <input
                                    type="text"
                                    value={bankAccount}
                                    onChange={(e) => setBankAccount(e.target.value)}
                                    placeholder="e.g. 40032918451"
                                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                                    required
                                  />
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-1">
                                  Direct debit authorization will be dispatched via National Payment System (ACH/RTGS).
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  
                    {/* PAY NOW BUTTON (MATCHING IMAGE VIBRANT TEAL) */}
                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={isProcessingRepay}
                        className="w-full py-3.5 bg-[#009688] hover:bg-[#008375] active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Pay Now</span>
                        {repayAmount && Number(repayAmount) > 0 && (
                          <span className="opacity-95 font-mono font-medium">
                            • {formatRWF(Number(repayAmount))}
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {repayStep === 'processing' && (
                  <div className="py-10 text-center space-y-4">
                    <div className="w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Dispatching to Mock Payment Gateway...
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        Simulating direct credit to {targetRepayLoan.institutionName} via BNR payment switch.
                      </p>
                    </div>
                  </div>
                )}

                {repayStep === 'result' && repayResult && (
                  <div className="space-y-4 text-center py-2">
                    <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
                      repayResult.success
                        ? 'bg-emerald-100 text-emerald-600'
                        : repayResult.isPending
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-rose-100 text-rose-600'
                    }`}>
                      {repayResult.success && <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />}
                      {repayResult.isPending && <Clock className="w-8 h-8 stroke-[2.5]" />}
                      {!repayResult.success && !repayResult.isPending && <AlertCircle className="w-8 h-8 stroke-[2.5]" />}
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        {repayResult.success
                          ? 'Payment Processed Successfully'
                          : repayResult.isPending
                          ? 'Payment Pending Customer Confirmation'
                          : 'Payment Authorization Failed'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {repayResult.providerData?.message || 'Transaction completed.'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Credited Lender:</span>
                        <span className="font-bold text-slate-900">{targetRepayLoan.institutionName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Transaction Ref:</span>
                        <span className="font-bold text-slate-900">{repayResult.transactionReference}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Amount Paid:</span>
                        <span className="font-bold text-slate-900">{formatRWF(repayResult.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Channel:</span>
                        <span>{repayResult.channel}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1.5">
                        <span className="text-slate-400">New Remaining Balance:</span>
                        <span className="font-bold text-emerald-600">
                          {formatRWF(repayResult.updatedOutstandingBalance)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsRepayModalOpen(false)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Close &amp; Return to Loans
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

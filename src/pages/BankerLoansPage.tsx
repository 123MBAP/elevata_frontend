import React, { useState, useEffect, useMemo } from 'react';
import {
  financialDemoApi,
  DemoLoan,
  DemoApplication,
  FiOverviewData,
  DemoInstitution,
  DemoSme
} from '../services/financialDemoApi';
import { formatRWF } from '../lib/mockData';
import { Card, CardContent } from '../assets/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Landmark,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  Send,
  Building2,
  DollarSign,
  TrendingUp,
  FileCheck,
  FileText,
  UserCheck,
  Layers,
  Search,
  Filter,
  X,
  CreditCard,
  Smartphone,
  ChevronRight,
  Eye,
  Sliders,
  Check,
  Activity
} from 'lucide-react';

export default function BankerLoansPage() {
  const [activeTab, setActiveTab] = useState<'applications' | 'portfolio' | 'repayments' | 'health'>('portfolio');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<FiOverviewData | null>(null);
  const [applications, setApplications] = useState<DemoApplication[]>([]);
  const [loans, setLoans] = useState<DemoLoan[]>([]);
  const [demoSmes, setDemoSmes] = useState<DemoSme[]>([]);
  const [institutions, setInstitutions] = useState<DemoInstitution[]>([]);
  const [selectedFiId, setSelectedFiId] = useState<string>('fi-bk');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'danger' | 'warning' | 'info'; text: string } | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Underwrite Modal State
  const [underwriteApp, setUnderwriteApp] = useState<DemoApplication | null>(null);
  const [decision, setDecision] = useState<'Approved' | 'Rejected' | 'Under Review'>('Approved');
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [approvedRate, setApprovedRate] = useState<number>(13.5);
  const [approvedTerm, setApprovedTerm] = useState<number>(12);
  const [decisionFeedback, setDecisionFeedback] = useState<string>('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Disbursement Modal State
  const [disburseLoanTarget, setDisburseLoanTarget] = useState<DemoLoan | null>(null);
  const [disburseChannel, setDisburseChannel] = useState<'Bank Transfer' | 'Mobile Money'>('Bank Transfer');
  const [destinationAccount, setDestinationAccount] = useState<string>('40032918451');
  const [disburseOutcome, setDisburseOutcome] = useState<'success' | 'pending' | 'failure'>('success');
  const [isExecutingDisbursement, setIsExecutingDisbursement] = useState(false);
  const [disbursementResult, setDisbursementResult] = useState<any | null>(null);

  // Statement Inspection Modal State
  const [inspectedLoan, setInspectedLoan] = useState<DemoLoan | null>(null);

  const showToast = (type: 'success' | 'danger' | 'warning' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const loadData = async (fiId = selectedFiId) => {
    setLoading(true);
    try {
      const [meta, overviewData, appsData, loansData] = await Promise.all([
        financialDemoApi.getDemoMeta(),
        financialDemoApi.getFiOverview(fiId),
        financialDemoApi.getFiApplications(fiId),
        financialDemoApi.getSmeLoans('sme-1') // Fetch loans from shared store
      ]);
      setInstitutions(meta.financialInstitutions || []);
      setDemoSmes(meta.demoSmes || []);
      setOverview(overviewData);
      setApplications(appsData);
      setLoans(loansData);
    } catch (err: any) {
      console.error('Failed to load FI data:', err);
      showToast('danger', 'Unable to load FI data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedFiId);
  }, [selectedFiId]);

  // Open Underwrite Modal
  const handleOpenUnderwrite = (app: DemoApplication) => {
    setUnderwriteApp(app);
    setDecision('Approved');
    setApprovedAmount(app.requestedAmount);
    setApprovedRate(app.interestRate || 13.5);
    setApprovedTerm(app.termMonths || 12);
    setDecisionFeedback('Credit approval granted following verified turnover and healthy debt-service coverage ratio.');
  };

  // Submit Underwrite Decision
  const handleSubmitUnderwrite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!underwriteApp) return;

    setIsSubmittingDecision(true);
    try {
      const result = await financialDemoApi.underwriteApplication(underwriteApp.id, {
        decision,
        feedback: decisionFeedback,
        configuredAmount: approvedAmount,
        configuredRate: approvedRate,
        configuredTerm: approvedTerm
      });

      showToast(
        decision === 'Approved' ? 'success' : 'info',
        `Application ${underwriteApp.id} ${decision.toLowerCase()}. ${
          result.createdLoan ? `New facility record ${result.createdLoan.referenceNumber} created for ${result.createdLoan.smeName}.` : ''
        }`
      );
      setUnderwriteApp(null);
      await loadData(selectedFiId);
    } catch (err: any) {
      showToast('danger', err.message || 'Underwriting action failed.');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Open Disbursement Modal
  const handleOpenDisbursement = (loan: DemoLoan) => {
    setDisburseLoanTarget(loan);
    setDisburseChannel('Bank Transfer');
    setDestinationAccount('40032918451');
    setDisburseOutcome('success');
    setDisbursementResult(null);
  };

  // Execute Simulated Disbursement
  const handleExecuteDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disburseLoanTarget) return;

    setIsExecutingDisbursement(true);
    try {
      const result = await financialDemoApi.disburseLoan(disburseLoanTarget.id, {
        channel: disburseChannel,
        destinationAccount,
        simulateOutcome: disburseOutcome
      });

      setDisbursementResult(result);
      await loadData(selectedFiId);

      if (result.success) {
        showToast('success', `Disbursement of ${formatRWF(result.disbursedAmount)} confirmed. Loan ${result.loanReference} is now Active.`);
      } else if (result.isPending) {
        showToast('warning', `Disbursement queued with clearing switch. Reference: ${result.disbursementReference}`);
      } else {
        showToast('danger', 'Disbursement rejected by the payment provider.');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'Disbursement failed.');
    } finally {
      setIsExecutingDisbursement(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      await financialDemoApi.resetDemo();
      showToast('info', 'Lending records refreshed to the latest portfolio position.');
      await loadData(selectedFiId);
    } catch (err: any) {
      showToast('danger', 'Failed to refresh lending records.');
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

      {/* Lending desk header */}
      <div className="bg-white rounded-[4px] p-4 sm:p-5 shadow-sm border border-[#cbd5e1] border-t-4 border-t-[#2998d6] relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-wider bg-[#e0f2fe] text-[#0369a1] font-mono border border-[#bae6fd]">
                FINANCIAL INSTITUTION DESK
              </span>
              <span className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Lending operations
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-[#1e293b] font-heading flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#2998d6]" />
              Credit Facility Underwriting, Disbursement &amp; Repayment Surveillance
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl">
              Commercial credit institution monitoring portal. Approve or reject applications, trigger interbank disbursements, and monitor borrower repayment cashflows.
            </p>
          </div>
        </div>
      </div>

      {/* TOP OVERVIEW KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Total Disbursed Capital
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {formatRWF(overview?.totalDisbursed || 10000000)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Settled via BNR interbank clearing
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 font-mono">
              Active Portfolio Balance
            </span>
            <div className="text-xl font-bold font-mono text-indigo-600 mt-1">
              {formatRWF(overview?.totalOutstanding || 6500000)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Outstanding across active borrowers
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 font-mono">
              Repayments Collected
            </span>
            <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
              {formatRWF(overview?.totalRepaymentsCollected || 3842500)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Recovered through digital channels
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 font-mono">
              Pending Action Items
            </span>
            <div className="text-xl font-bold font-mono text-amber-600 mt-1">
              {(overview?.pendingDisbursements || 1) + (overview?.pendingApplications || 1)} Items
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {overview?.pendingDisbursements || 1} ready to disburse, {overview?.pendingApplications || 1} to review
            </span>
          </CardContent>
        </Card>
      </div>

      {/* SUB-TABS */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'portfolio'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Loan Portfolio &amp; Disbursements</span>
          <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] font-mono text-slate-600">
            {loans.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'applications'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>SME Applications &amp; Underwriting</span>
          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded-full text-[10px] font-mono">
            {applications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('repayments')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'repayments'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Repayment Stream &amp; Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'health'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Borrower Health &amp; Risk Matrix</span>
        </button>
      </div>

      {/* TAB CONTENT: LOAN PORTFOLIO & DISBURSEMENTS */}
      {activeTab === 'portfolio' && (
        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Institutional Loan Facilities Portfolio
              </h3>
              <p className="text-xs text-slate-500">
                Monitor approved facilities, disburse new loans, and inspect statements.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                  <th className="p-3 font-semibold">Loan Ref</th>
                  <th className="p-3 font-semibold">Borrower SME</th>
                  <th className="p-3 font-semibold">Product</th>
                  <th className="p-3 font-semibold text-right">Principal</th>
                  <th className="p-3 font-semibold text-right">Outstanding</th>
                  <th className="p-3 font-semibold">Interest &amp; Term</th>
                  <th className="p-3 font-semibold text-center">Status</th>
                  <th className="p-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => {
                  const isReadyForDisbursement = loan.status === 'Approved - Ready for Disbursement' || loan.disbursementStatus === 'Pending Disbursement';
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {loan.referenceNumber}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{loan.smeName}</div>
                        <div className="text-[10.5px] text-slate-400">{loan.smeSector}</div>
                      </td>
                      <td className="p-3 text-slate-700">{loan.productName}</td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-900">
                        {formatRWF(loan.totalBorrowed)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-600">
                        {formatRWF(loan.outstandingPrincipal)}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {loan.interestRate}% ({loan.termMonths}m)
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono border ${
                          loan.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : loan.status === 'Fully Repaid'
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isReadyForDisbursement ? (
                            <button
                              onClick={() => handleOpenDisbursement(loan)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition"
                            >
                              <Send className="w-3 h-3" />
                              <span>Disburse</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setInspectedLoan(loan)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Statement</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: APPLICATIONS & UNDERWRITING */}
      {activeTab === 'applications' && (
        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                SME Loan Applications Pipeline
              </h3>
              <p className="text-xs text-slate-500">
                Evaluate applicant SME health, review documents, and issue credit decisions.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                  <th className="p-3 font-semibold">App ID</th>
                  <th className="p-3 font-semibold">Applicant SME</th>
                  <th className="p-3 font-semibold">Facility Program</th>
                  <th className="p-3 font-semibold text-right">Requested Amount</th>
                  <th className="p-3 font-semibold text-center">Health &amp; Readiness</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {app.id}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{app.smeName}</div>
                      <div className="text-[10.5px] text-slate-400">{app.smeSector}</div>
                    </td>
                    <td className="p-3 text-slate-700">{app.productName}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatRWF(app.requestedAmount)}
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1.5 font-mono text-[10.5px]">
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 font-bold">
                          Health: {app.smeHealthScore}%
                        </span>
                        <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded border border-sky-200 font-bold">
                          Readiness: {app.smeReadinessScore}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono border ${
                        app.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : app.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleOpenUnderwrite(app)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition"
                      >
                        Underwrite
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: REPAYMENT STREAM & AUDIT LOGS */}
      {activeTab === 'repayments' && (
        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Institutional Repayment Audit Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Real-time collection feed across Mobile Money and Bank Transfer rails.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">Loan Reference</th>
                  <th className="p-3 font-semibold">Borrower SME</th>
                  <th className="p-3 font-semibold">Channel</th>
                  <th className="p-3 font-semibold">Transaction Ref</th>
                  <th className="p-3 font-semibold text-right">Repayment Amount</th>
                  <th className="p-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.flatMap(l => l.statement.filter(s => s.type === 'Repayment').map(st => ({ ...st, loan: l }))).map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-slate-600">{rep.date}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{rep.loan.referenceNumber}</td>
                    <td className="p-3 font-semibold text-slate-900">{rep.loan.smeName}</td>
                    <td className="p-3 text-slate-600">{rep.channel || 'Mobile Money'}</td>
                    <td className="p-3 font-mono text-slate-500">{rep.reference}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600">
                      {formatRWF(rep.debit)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono border ${
                        rep.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : rep.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {rep.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: BORROWER HEALTH & RISK MATRIX */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demoSmes.map((sme) => (
            <Card key={sme.id} className="bg-white border border-slate-200 shadow-sm rounded-xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{sme.name}</h4>
                    <span className="text-[11px] text-slate-500 font-mono block">TIN: {sme.tin}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full text-[10px] font-bold border border-sky-200">
                    {sme.sector}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Health Score</span>
                    <strong className="text-emerald-600 text-sm">{sme.healthScore}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Readiness Score</span>
                    <strong className="text-sky-600 text-sm">{sme.readinessScore}%</strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Monthly Turnover</span>
                    <strong className="text-slate-900">{formatRWF(sme.monthlyTurnover)}</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  Owner: <strong>{sme.ownerName}</strong> ({sme.phone})
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* UNDERWRITE MODAL */}
      <AnimatePresence>
        {underwriteApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-6"
            >
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Credit Underwriting Dossier #{underwriteApp.id}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Applicant: <strong>{underwriteApp.smeName}</strong> ({underwriteApp.smeSector})
                  </p>
                </div>
                <button
                  onClick={() => setUnderwriteApp(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitUnderwrite} className="p-5 space-y-4">
                {/* Decision Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Underwriting Decision
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDecision('Approved')}
                      className={`py-2 rounded-lg text-xs font-bold font-mono transition border ${
                        decision === 'Approved'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecision('Under Review')}
                      className={`py-2 rounded-lg text-xs font-bold font-mono transition border ${
                        decision === 'Under Review'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      Hold
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecision('Rejected')}
                      className={`py-2 rounded-lg text-xs font-bold font-mono transition border ${
                        decision === 'Rejected'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      Decline
                    </button>
                  </div>
                </div>

                {decision === 'Approved' && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">
                      Approved Facility Terms Configuration
                    </span>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Amount (RWF)</label>
                        <input
                          type="number"
                          value={approvedAmount}
                          onChange={(e) => setApprovedAmount(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono font-bold focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Rate (% p.a.)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={approvedRate}
                          onChange={(e) => setApprovedRate(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono font-bold focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Term (Months)</label>
                        <input
                          type="number"
                          value={approvedTerm}
                          onChange={(e) => setApprovedTerm(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono font-bold focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Credit Officer Official Notes
                  </label>
                  <textarea
                    rows={3}
                    value={decisionFeedback}
                    onChange={(e) => setDecisionFeedback(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                    placeholder="Enter formal justification, conditions precedent, or risk conditions..."
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setUnderwriteApp(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDecision}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Commit Decision</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DISBURSEMENT MODAL */}
      <AnimatePresence>
        {disburseLoanTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-6"
            >
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Initiate Loan Disbursement
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Facility: <strong>{disburseLoanTarget.referenceNumber}</strong> ({disburseLoanTarget.smeName})
                  </p>
                </div>
                <button
                  onClick={() => setDisburseLoanTarget(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!disbursementResult ? (
                <form onSubmit={handleExecuteDisbursement} className="p-5 space-y-4">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-indigo-700 uppercase font-mono block">Principal to Disburse</span>
                      <strong className="text-base text-indigo-950 font-mono">
                        {formatRWF(disburseLoanTarget.totalBorrowed)}
                      </strong>
                    </div>
                    <span className="px-2 py-1 bg-white text-indigo-700 rounded font-mono font-bold text-xs border border-indigo-200">
                      Term: {disburseLoanTarget.termMonths} Months
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Disbursement Rail
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDisburseChannel('Bank Transfer')}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                          disburseChannel === 'Bank Transfer'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <Landmark className="w-4 h-4 text-indigo-600" />
                        <div>
                          <div className="text-xs font-bold">Bank RIPPS</div>
                          <div className="text-[10px] text-slate-500">Interbank RTGS</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDisburseChannel('Mobile Money')}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                          disburseChannel === 'Mobile Money'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div className="text-xs font-bold">MTN MoMo Bulk</div>
                          <div className="text-[10px] text-slate-500">Direct wallet payout</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Destination Account / MSISDN
                    </label>
                    <input
                      type="text"
                      value={destinationAccount}
                      onChange={(e) => setDestinationAccount(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none"
                      required
                    />
                  </div>

                  {/* Sandbox outcome simulator */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-[10px] font-bold text-amber-900 uppercase font-mono block mb-1">
                      Provider response
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setDisburseOutcome('success')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition border ${
                          disburseOutcome === 'success'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-emerald-800 border-emerald-200'
                        }`}
                      >
                        Success
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisburseOutcome('pending')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition border ${
                          disburseOutcome === 'pending'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-amber-800 border-amber-200'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisburseOutcome('failure')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition border ${
                          disburseOutcome === 'failure'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-rose-800 border-rose-200'
                        }`}
                      >
                        Failed
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDisburseLoanTarget(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isExecutingDisbursement}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isExecutingDisbursement ? 'Executing...' : 'Dispatch Disbursement'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-5 space-y-4 text-center">
                  <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
                    disbursementResult.success
                      ? 'bg-emerald-100 text-emerald-600'
                      : disbursementResult.isPending
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-rose-100 text-rose-600'
                  }`}>
                    {disbursementResult.success ? <CheckCircle2 className="w-8 h-8 stroke-[2.5]" /> : <AlertCircle className="w-8 h-8 stroke-[2.5]" />}
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {disbursementResult.success
                        ? 'Disbursement Settled & Facility Activated'
                        : disbursementResult.isPending
                        ? 'Disbursement Queued with Switch'
                        : 'Disbursement Rejected'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {disbursementResult.providerData?.message || 'Transaction processed.'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs font-mono space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Clearing Ref:</span>
                      <span className="font-bold text-slate-900">{disbursementResult.disbursementReference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Disbursed Amount:</span>
                      <span className="font-bold text-emerald-600">{formatRWF(disbursementResult.disbursedAmount)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDisburseLoanTarget(null)}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
                  >
                    Close Dossier
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INSPECT STATEMENT MODAL */}
      <AnimatePresence>
        {inspectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-6"
            >
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Audit Statement: {inspectedLoan.referenceNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Borrower: <strong>{inspectedLoan.smeName}</strong> | Outstanding: <strong>{formatRWF(inspectedLoan.outstandingPrincipal)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setInspectedLoan(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Reference</th>
                      <th className="p-2.5 text-right">Debit</th>
                      <th className="p-2.5 text-right">Credit</th>
                      <th className="p-2.5 text-right">Balance</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inspectedLoan.statement.map((s) => (
                      <tr key={s.id}>
                        <td className="p-2.5 font-mono text-slate-600">{s.date}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{s.type}</td>
                        <td className="p-2.5 font-mono text-slate-500">{s.reference}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-600 font-semibold">{s.debit > 0 ? formatRWF(s.debit) : '-'}</td>
                        <td className="p-2.5 text-right font-mono text-sky-700 font-semibold">{s.credit > 0 ? formatRWF(s.credit) : '-'}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatRWF(s.runningBalance)}</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

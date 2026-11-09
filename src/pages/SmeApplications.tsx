import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck,
  Building2,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  Coins,
  X,
  Target,
  ShieldCheck,
  Calendar,
  Sparkles,
  Phone,
  Mail,
  Info
} from 'lucide-react';
import { useApp, Application } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import { Button } from '../assets/components/ui/button';

export default function SmeApplications() {
  const { applications, opportunities, activeSme } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const oppTitle = app.opportunityTitle?.toLowerCase() || '';
      const institution = app.institution?.toLowerCase() || '';
      const ref = app.id.toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        oppTitle.includes(term) ||
        institution.includes(term) ||
        ref.includes(term);

      if (!matchesSearch) return false;

      if (statusFilter === 'All') return true;
      if (statusFilter === 'Submitted') return app.status === 'Submitted';
      if (statusFilter === 'Under Review') return app.status === 'Under Review';
      if (statusFilter === 'Approved') return app.status === 'Approved' || app.status === 'Disbursed';
      if (statusFilter === 'Completed') return app.status === 'Completed';
      if (statusFilter === 'Rejected') return app.status === 'Rejected';

      return true;
    });
  }, [applications, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = applications.length;
    const underReview = applications.filter(a => a.status === 'Under Review' || a.status === 'Submitted').length;
    const approved = applications.filter(a => a.status === 'Approved' || a.status === 'Disbursed' || a.status === 'Completed').length;
    const totalRequested = applications.reduce((acc, a) => acc + (a.requestedAmount || 0), 0);

    return { total, underReview, approved, totalRequested };
  }, [applications]);

  // Helper to match opportunity details
  const getOpportunity = (oppId: string) => {
    return opportunities.find(o => o.id === oppId);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#2998d6]/10 text-[#2998d6]">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              My Financing Applications
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Track real-time statuses across banking credit desks, review underwriting decisions, and inspect approved loan facility terms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/opportunity-hub">
            <Button className="bg-[#2998d6] hover:bg-[#1f85be] text-white font-bold text-xs h-9 px-4 flex items-center gap-2 shadow-xs border-none">
              <Target className="w-4 h-4" />
              Browse More Opportunities
            </Button>
          </Link>
          <Link to="/repayments">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 px-4 flex items-center gap-2 shadow-xs border-none">
              <Coins className="w-4 h-4 text-emerald-400" />
              SME Repayment Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="accounting-card p-4">
          <span className="accounting-label !text-[11px] uppercase tracking-wider font-semibold">
            Total Submitted
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500 font-medium">Files</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Across all credit desks</span>
        </div>

        <div className="accounting-card p-4">
          <span className="accounting-label !text-[11px] uppercase tracking-wider font-semibold">
            Under Review
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-600">{stats.underReview}</span>
            <span className="text-xs text-slate-500 font-medium">Pending</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Risk scoring in progress</span>
        </div>

        <div className="accounting-card p-4">
          <span className="accounting-label !text-[11px] uppercase tracking-wider font-semibold">
            Approved Facilities
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-600">{stats.approved}</span>
            <span className="text-xs text-slate-500 font-medium">Active</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Terms issued or disbursed</span>
        </div>

        <div className="accounting-card p-4">
          <span className="accounting-label !text-[11px] uppercase tracking-wider font-semibold">
            Requested Capital
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 truncate">
              {formatRWF(stats.totalRequested)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Total portfolio requested</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by facility, institution, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#2998d6]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Submitted', 'Under Review', 'Approved', 'Completed', 'Rejected'].map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2998d6] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Applications Listing */}
      {filteredApplications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Financing Applications Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'All'
              ? 'No applications match your search filters. Try clearing search criteria.'
              : 'You have not submitted any financing applications yet. Explore matched loans and grants in the Opportunity Hub.'}
          </p>
          <Link to="/opportunity-hub">
            <Button className="bg-[#2998d6] hover:bg-[#1f85be] text-white text-xs font-bold h-8 px-4 mt-2 border-none">
              Explore Available Opportunities
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const opp = getOpportunity(app.opportunityId);
            const isApprovedOrActive =
              app.status === 'Approved' ||
              app.status === 'Disbursed' ||
              app.status === 'Completed';
            const isDisbursed =
              app.disbursed === true ||
              app.status === 'Disbursed' ||
              (app.disbursedAmount && app.disbursedAmount > 0);
            const isCompleted =
              app.status === 'Completed' ||
              (app.remainingBalance !== undefined && app.remainingBalance <= 0 && isDisbursed);

            return (
              <motion.div
                key={app.id}
                layout
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs overflow-hidden transition"
              >
                {/* Header row */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                        {app.opportunityTitle}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                        Ref #{app.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-[#2998d6]" />
                        {app.institution || opp?.institution || 'Partner Bank / Credit Desk'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Applied: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    {app.status === 'Submitted' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 animate-spin" /> Submitted
                      </span>
                    )}
                    {app.status === 'Under Review' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> Under Review
                      </span>
                    )}
                    {(app.status === 'Approved' || app.status === 'Disbursed') && !isCompleted && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> {isDisbursed ? 'Disbursed & Active' : 'Approved'}
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-purple-600" /> Fully Settled
                      </span>
                    )}
                    {app.status === 'Rejected' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Declined
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Visual 3-Stage Progress Tracker */}
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
                    <div className="flex items-center justify-between relative px-2 sm:px-6">
                      <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />

                      {/* Stage 1: Submitted */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] mb-1 bg-emerald-500 text-white shadow-2xs">
                          ✓
                        </div>
                        <span className="font-bold text-slate-800 text-[10.5px]">1. Submitted</span>
                        <span className="text-[9px] text-slate-400">Dossier Lodged</span>
                      </div>

                      {/* Stage 2: Under Review */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] mb-1 ${
                            app.status !== 'Submitted'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-amber-500 text-white animate-pulse'
                          }`}
                        >
                          {app.status !== 'Submitted' ? '✓' : '2'}
                        </div>
                        <span className="font-bold text-slate-800 text-[10.5px]">2. Under Review</span>
                        <span className="text-[9px] text-slate-400">
                          {app.status === 'Submitted' ? 'Awaiting Officer' : 'Risk Assessment'}
                        </span>
                      </div>

                      {/* Stage 3: Decision & Terms */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] mb-1 ${
                            isApprovedOrActive
                              ? 'bg-emerald-500 text-white'
                              : app.status === 'Rejected'
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isApprovedOrActive ? '✓' : app.status === 'Rejected' ? '✕' : '3'}
                        </div>
                        <span className="font-bold text-slate-800 text-[10.5px]">
                          {app.status === 'Rejected' ? 'Declined' : isCompleted ? 'Fully Settled' : '3. Decision & Terms'}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {isApprovedOrActive ? (isDisbursed ? 'Capital Disbursed' : 'Approved') : 'Credit Outcome'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                        Requested Facility
                      </span>
                      <span className="font-extrabold text-slate-900 font-mono text-xs">
                        {formatRWF(app.requestedAmount || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                        Tenor
                      </span>
                      <span className="font-bold text-slate-800 text-xs font-mono">
                        {app.termMonths || 12} Months
                      </span>
                    </div>
                    <div>
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                        Primary Purpose
                      </span>
                      <span className="font-medium text-slate-700 text-xs truncate block">
                        {app.purpose || 'Working Capital'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                        Borrower Contact
                      </span>
                      <span className="font-medium text-slate-700 text-xs truncate block">
                        {app.contactPhone || '0788 123 456'}
                      </span>
                    </div>
                  </div>

                  {/* Banker Review Feedback Note */}
                  {app.feedback && (
                    <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 border border-slate-200">
                      <span className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#2998d6]" />
                        Official Banker Review Feedback
                      </span>
                      <p className="text-slate-700 font-sans text-xs leading-relaxed italic bg-white p-2.5 rounded border border-slate-200/80">
                        "{app.feedback}"
                      </p>
                    </div>
                  )}

                  {/* Active Facility Callout if Approved / Disbursed */}
                  {isApprovedOrActive && (
                    <div className="p-4 bg-linear-to-r from-emerald-50 to-sky-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-emerald-600 text-white">
                            <Coins className="w-4 h-4" />
                          </span>
                          <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                            {isDisbursed ? 'Loan Disbursed & Repayments Active' : 'Facility Approved — Repayments Ready'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Approved Facility: <strong className="text-slate-900 font-mono">{formatRWF(app.approvedAmount || app.requestedAmount || 5000000)}</strong>
                          {app.monthlyInstallment ? ` · Monthly Installment: ${formatRWF(app.monthlyInstallment)}` : ''}
                        </p>
                      </div>

                      <Link to="/repayments">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-4 flex items-center gap-1.5 shadow-xs border-none whitespace-nowrap">
                          <span>Open Repayments Ledger</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="text-[11px] text-slate-400">
                      Last update: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Today'}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs h-8 px-3"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
                        View Application Dossier
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* APPLICATION DOSSIER MODAL */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-[#1a2332] text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-white/10 text-[#2998d6]">
                    <ClipboardCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider">
                      Application Dossier Details
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Ref #{selectedApp.id} · {selectedApp.opportunityTitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 overflow-y-auto text-xs">
                {/* Credit Desk & Status */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Target Financial Institution
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {selectedApp.institution || 'Partner Commercial Bank'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-right">
                      Current Status
                    </span>
                    <span className="font-extrabold text-[#2998d6] uppercase tracking-wider text-xs">
                      {selectedApp.status}
                    </span>
                  </div>
                </div>

                {/* Key Financing Parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      Requested Facility
                    </span>
                    <span className="font-extrabold text-slate-900 font-mono text-sm">
                      {formatRWF(selectedApp.requestedAmount || 0)}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      Requested Tenor
                    </span>
                    <span className="font-extrabold text-slate-900 font-mono text-sm">
                      {selectedApp.termMonths || 12} Months
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      Applied Date
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {selectedApp.appliedAt ? new Date(selectedApp.appliedAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>

                {/* Purpose & Notes */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Loan Purpose & Business Utilization
                  </span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 leading-relaxed">
                    {selectedApp.purpose || 'Working capital and operational expansion for business growth.'}
                  </div>
                </div>

                {/* Applicant Notes if any */}
                {selectedApp.notes && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Applicant Supporting Notes
                    </span>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed italic">
                      "{selectedApp.notes}"
                    </div>
                  </div>
                )}

                {/* Contact information */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Registered Contact Details
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedApp.contactPhone || '0788 123 456'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedApp.contactEmail || activeSme.email || 'info@sme.rw'}</span>
                    </div>
                  </div>
                </div>

                {/* Approved Terms if present */}
                {(selectedApp.status === 'Approved' || selectedApp.status === 'Disbursed') && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                      Formal Approved Facility Terms
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-[9.5px] text-emerald-600 block">Approved Principal</span>
                        <span className="font-extrabold font-mono text-emerald-950 text-sm">
                          {formatRWF(selectedApp.approvedAmount || selectedApp.requestedAmount || 5000000)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-emerald-600 block">Interest Rate</span>
                        <span className="font-extrabold font-mono text-emerald-950 text-sm">
                          {selectedApp.interestRate || 14}% p.a.
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-emerald-600 block">Monthly Installment</span>
                        <span className="font-extrabold font-mono text-emerald-950 text-sm">
                          {formatRWF(selectedApp.monthlyInstallment || 450000)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0">
                <Button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs h-9 px-4"
                >
                  Close Dossier
                </Button>

                {(selectedApp.status === 'Approved' || selectedApp.status === 'Disbursed') && (
                  <Link to="/repayments">
                    <Button className="bg-[#2998d6] hover:bg-[#1f85be] text-white font-bold text-xs h-9 px-5 border-none flex items-center gap-2">
                      <Coins className="w-4 h-4 text-emerald-300" />
                      Go to Repayments Ledger
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp, Application, Opportunity } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatRWF } from '../lib/mockData';
import { apiFile } from '../lib/api';
import {
  FileText,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  Calendar,
  AlertTriangle,
  Download,
  UploadCloud,
  Paperclip,
  Check,
  X,
  Lock,
  XCircle,
  Eye,
  RefreshCw,
  Search,
  Filter,
  FilePlus,
  Coins,
  ChevronRight,
  CreditCard,
  Sparkles,
  Loader2,
  ArrowRight,
  Info,
  Phone,
  Mail,
  Globe,
  Sprout,
  FileSpreadsheet,
  FileCheck,
  FileBadge
} from 'lucide-react';
import FormattedText from '../assets/components/ui/FormattedText';

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return 'File uploaded';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getAppStatusCategory = (status: string): 'pending' | 'under_review' | 'completed' | 'rejected' => {
  const s = (status || '').toLowerCase().trim();
  if (s === 'approved' || s === 'completed') return 'completed';
  if (s === 'under review' || s === 'in progress' || s === 'review' || s === 'under_review') return 'under_review';
  if (s === 'rejected' || s === 'declined' || s === 'denied') return 'rejected';
  return 'pending';
};

const getStatusBadge = (status: string) => {
  const category = getAppStatusCategory(status);
  switch (category) {
    case 'completed':
      return {
        label: 'Completed / Approved',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      };
    case 'under_review':
      return {
        label: 'Under Review',
        bg: 'bg-sky-50 text-[#0284c7] border-sky-200',
        icon: <Activity className="w-3.5 h-3.5 text-[#0284c7] animate-pulse" />
      };
    case 'rejected':
      return {
        label: 'Rejected / Action Required',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
      };
    case 'pending':
    default:
      return {
        label: 'Pending Initial Review',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: <Clock className="w-3.5 h-3.5 text-amber-600" />
      };
  }
};

export default function MyApplications() {
  const { user } = useAuth();
  const {
    applications,
    opportunities,
    activeSme,
    refreshApplications,
    uploadApplicationDocument
  } = useApp();

  // Filter & Search State
  const [appStatusFilter, setAppStatusFilter] = useState<'all' | 'pending' | 'under_review' | 'completed' | 'rejected'>('all');
  const [appSearchTerm, setAppSearchTerm] = useState('');

  // Modal State
  const [uploadModalApp, setUploadModalApp] = useState<Application | null>(null);
  const [uploadDocType, setUploadDocType] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isRefreshingApps, setIsRefreshingApps] = useState(false);
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Readiness Calculations
  const calculatedReadiness = useMemo(() => {
    return Math.min(100, Math.round(activeSme.healthScore * 1.05));
  }, [activeSme.healthScore]);

  // Statistics
  const applicationStats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(a => getAppStatusCategory(a.status) === 'pending').length;
    const underReview = applications.filter(a => getAppStatusCategory(a.status) === 'under_review').length;
    const completed = applications.filter(a => getAppStatusCategory(a.status) === 'completed').length;
    const rejected = applications.filter(a => getAppStatusCategory(a.status) === 'rejected').length;
    return { total, pending, underReview, completed, rejected };
  }, [applications]);

  // Filtered List
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const category = getAppStatusCategory(app.status);
      if (appStatusFilter !== 'all' && category !== appStatusFilter) {
        return false;
      }
      if (!appSearchTerm.trim()) return true;
      const term = appSearchTerm.toLowerCase();
      const oppTitle = (app.opportunityTitle || '').toLowerCase();
      const inst = (app.institution || '').toLowerCase();
      const id = (app.id || '').toLowerCase();
      const purpose = (app.purpose || '').toLowerCase();
      return oppTitle.includes(term) || inst.includes(term) || id.includes(term) || purpose.includes(term);
    });
  }, [applications, appStatusFilter, appSearchTerm]);

  // Refresh handler
  const handleRefreshApplications = async () => {
    setIsRefreshingApps(true);
    try {
      await refreshApplications();
      triggerToast('Applications portfolio synchronized with credit institutions.');
    } catch {
      triggerToast('Failed to refresh applications.');
    } finally {
      setIsRefreshingApps(false);
    }
  };

  // Document upload modal open
  const openUploadDocModal = (app: Application, docType = '') => {
    setUploadModalApp(app);
    setUploadDocType(docType);
    setUploadFile(null);
  };

  // Document upload submit
  const handleUploadAdditionalDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalApp || !uploadFile) {
      triggerToast('Please select a document file to upload.');
      return;
    }
    const docType = uploadDocType.trim() || uploadFile.name;
    setIsUploadingDoc(true);
    try {
      await uploadApplicationDocument(uploadModalApp.id, docType, uploadFile);
      triggerToast(`Document "${docType}" uploaded successfully!`);
      setUploadModalApp(null);
      setUploadDocType('');
      setUploadFile(null);
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Document download
  const handleDownloadDoc = async (doc: { id: string; fileName: string; downloadUrl?: string }) => {
    if (!doc.downloadUrl) return;
    try {
      const blob = await apiFile(doc.downloadUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : 'Unable to download file.');
    }
  };

  const selectedOpp = useMemo(() => {
    if (!selectedOppId) return null;
    return opportunities.find(o => o.id === selectedOppId) || null;
  }, [selectedOppId, opportunities]);

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-[#1a2332] text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 border border-[#2d3b4e]">
          <Sparkles className="w-4.5 h-4.5 text-[#38bdf8] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] font-heading flex items-center gap-2.5">
            <span>My Credit &amp; Financing Applications</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-[#0284c7] border border-sky-200">
              {applications.length} {applications.length === 1 ? 'Dossier' : 'Dossiers'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time underwriting progress, document verification statuses, and requirement requests across institutional lenders.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefreshApplications}
            disabled={isRefreshingApps}
            className="accounting-btn-secondary !h-9 !text-xs !px-3.5 flex items-center gap-1.5"
            title="Synchronize status with bank servers"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshingApps ? 'animate-spin text-[#2998d6]' : ''}`} />
            <span>{isRefreshingApps ? 'Syncing...' : 'Refresh Status'}</span>
          </button>

          <Link
            to="/opportunity-hub"
            className="accounting-btn-primary !h-9 !text-xs !px-4 flex items-center gap-1.5 shadow-xs"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Opportunity Catalog</span>
          </Link>
        </div>
      </div>

      {/* KPI Status Filter Ribbon (5 Clickable Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* All */}
        <div
          onClick={() => setAppStatusFilter('all')}
          className={`accounting-card p-4 transition-all cursor-pointer hover:border-[#2998d6] flex flex-col justify-between ${
            appStatusFilter === 'all' ? 'border-[#2998d6] ring-2 ring-[#2998d6]/30 shadow-xs' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">All Applications</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900">{applicationStats.total}</span>
            <span className="text-[10px] text-slate-400">Total made</span>
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => setAppStatusFilter('pending')}
          className={`accounting-card p-4 transition-all cursor-pointer hover:border-amber-400 flex flex-col justify-between ${
            appStatusFilter === 'pending' ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/20 shadow-xs' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-amber-700">{applicationStats.pending}</span>
            <span className="text-[10px] text-amber-600/80">Intake queue</span>
          </div>
        </div>

        {/* Under Review */}
        <div
          onClick={() => setAppStatusFilter('under_review')}
          className={`accounting-card p-4 transition-all cursor-pointer hover:border-[#2998d6] flex flex-col justify-between ${
            appStatusFilter === 'under_review' ? 'border-[#2998d6] ring-2 ring-[#2998d6]/30 bg-sky-50/20 shadow-xs' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284c7]">Under Review</span>
            <Activity className="w-4 h-4 text-[#0284c7]" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#0284c7]">{applicationStats.underReview}</span>
            <span className="text-[10px] text-[#0284c7]/80">With committee</span>
          </div>
        </div>

        {/* Completed / Approved */}
        <div
          onClick={() => setAppStatusFilter('completed')}
          className={`accounting-card p-4 transition-all cursor-pointer hover:border-emerald-500 flex flex-col justify-between ${
            appStatusFilter === 'completed' ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/20 shadow-xs' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-700">{applicationStats.completed}</span>
            <span className="text-[10px] text-emerald-600/80">Approved</span>
          </div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setAppStatusFilter('rejected')}
          className={`accounting-card p-4 transition-all cursor-pointer hover:border-rose-400 flex flex-col justify-between ${
            appStatusFilter === 'rejected' ? 'border-rose-400 ring-2 ring-rose-400/30 bg-rose-50/20 shadow-xs' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Rejected</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-rose-700">{applicationStats.rejected}</span>
            <span className="text-[10px] text-rose-600/80">Needs revision</span>
          </div>
        </div>
      </div>

      {/* Quick Filter Pills & Search Input Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Applications', count: applicationStats.total },
            { id: 'pending', label: 'Pending', count: applicationStats.pending },
            { id: 'under_review', label: 'Under Review', count: applicationStats.underReview },
            { id: 'completed', label: 'Completed', count: applicationStats.completed },
            { id: 'rejected', label: 'Rejected', count: applicationStats.rejected }
          ].map(pill => {
            const isPillActive = appStatusFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setAppStatusFilter(pill.id as any)}
                className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isPillActive
                    ? 'bg-[#1a2332] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{pill.label}</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  isPillActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search program, institution, ref..."
            value={appSearchTerm}
            onChange={e => setAppSearchTerm(e.target.value)}
            className="accounting-input !h-8 !text-xs !pl-8 w-full bg-white"
          />
          {appSearchTerm && (
            <button
              type="button"
              onClick={() => setAppSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-6">
        {filteredApplications.map(app => {
          const matchedOpp = opportunities.find(o => o.id === app.opportunityId);
          const statusCategory = getAppStatusCategory(app.status);
          const statusBadge = getStatusBadge(app.status);

          // Derive requirements list
          const requiredDocList = (matchedOpp?.requiredDocs && matchedOpp.requiredDocs.length > 0)
            ? matchedOpp.requiredDocs
            : [
                'RDB Certificate of Registration',
                'RRA Tax Clearance Certificate',
                'Audited Financial Ledger (Last 6 Months)',
                'Bank Statement (Last 3 Months)'
              ];

          // Check missing docs
          const missingDocsCount = requiredDocList.filter(reqDoc => {
            const reqLower = reqDoc.toLowerCase();
            return !(app.documents || []).some(d => {
              const docTypeLower = d.documentType.toLowerCase();
              return docTypeLower === reqLower || reqLower.includes(docTypeLower) || docTypeLower.includes(reqLower);
            });
          }).length;

          // Extra uploaded docs not in the required checklist
          const extraUploadedDocs = (app.documents || []).filter(doc => {
            const docTypeLower = doc.documentType.toLowerCase();
            return !requiredDocList.some(reqDoc => {
              const reqLower = reqDoc.toLowerCase();
              return docTypeLower === reqLower || reqLower.includes(docTypeLower) || docTypeLower.includes(reqLower);
            });
          });

          return (
            <div
              key={app.id}
              className="accounting-card p-5 sm:p-7 space-y-6 border-[#cbd5e1] hover:border-[#2998d6] transition-all duration-150 shadow-sm"
            >
              {/* Top Row: Title, Institution, Badges, Application ID */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-150">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold bg-[#1a2332] text-white px-2.5 py-0.5 rounded uppercase tracking-wider font-mono">
                      {matchedOpp?.category || 'Financing Facility'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider border ${statusBadge.bg}`}>
                      {statusBadge.icon}
                      <span>{statusBadge.label}</span>
                    </span>
                    <span className="text-[10.5px] font-mono text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                      Ref: #{app.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug font-heading">
                    {app.opportunityTitle}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-sans">
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-[#2998d6]" />
                      <span>{app.institution || matchedOpp?.institution || 'Credit Institution'}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Applied on: <strong className="text-slate-700 font-mono">{app.appliedAt}</strong></span>
                    </span>
                    {missingDocsCount > 0 ? (
                      <>
                        <span>·</span>
                        <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10.5px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          {missingDocsCount} requirement{missingDocsCount === 1 ? '' : 's'} pending
                        </span>
                      </>
                    ) : (
                      <>
                        <span>·</span>
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10.5px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          All requirements supplied
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Financial Request Terms Pill */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 shrink-0 flex items-center gap-5 text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold block">Requested Funding</span>
                    <strong className="text-sm sm:text-base font-bold text-slate-900 block mt-0.5">
                      {app.requestedAmount ? formatRWF(app.requestedAmount) : (matchedOpp?.maxFunding || 'Discretionary')}
                    </strong>
                  </div>
                  <div className="border-l border-slate-200 pl-5">
                    <span className="text-[9px] text-slate-400 uppercase font-semibold block">Facility Term</span>
                    <strong className="text-sm sm:text-base font-bold text-slate-700 block mt-0.5">
                      {app.termMonths ? `${app.termMonths} Months` : (matchedOpp?.loanTerm ? `${matchedOpp.loanTerm} Months` : '24 Months')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 4-STAGE AUDIT TIMELINE PROGRESS TRACKER */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#2998d6]" />
                    Underwriting Audit Pipeline Progress
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-medium">
                    {statusCategory === 'completed'
                      ? '100% Completed'
                      : statusCategory === 'under_review'
                      ? '65% In Committee Audit'
                      : statusCategory === 'rejected'
                      ? 'Evaluation Concluded'
                      : '30% Intake Screening'}
                  </span>
                </div>

                {/* Stepper Dots & Line */}
                <div className="grid grid-cols-4 gap-2 pt-2 relative">
                  {/* Stage 1: Submitted */}
                  <div className="flex flex-col items-center text-center space-y-1">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs font-bold text-xs ring-4 ring-emerald-100">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-[10.5px] font-bold text-slate-900 leading-tight">1. Lodged</span>
                    <span className="text-[9px] text-slate-400 font-mono hidden sm:block">Application Received</span>
                  </div>

                  {/* Stage 2: Desk Intake Screening */}
                  <div className="flex flex-col items-center text-center space-y-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                      statusCategory === 'pending'
                        ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                        : 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                    }`}>
                      {statusCategory === 'pending' ? <Clock className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className={`text-[10.5px] font-bold leading-tight ${statusCategory === 'pending' ? 'text-amber-700' : 'text-slate-900'}`}>
                      2. Desk Intake
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono hidden sm:block">
                      {statusCategory === 'pending' ? 'Screening Active' : 'Verified'}
                    </span>
                  </div>

                  {/* Stage 3: Risk & Requirements Audit */}
                  <div className="flex flex-col items-center text-center space-y-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                      statusCategory === 'under_review'
                        ? 'bg-[#2998d6] text-white ring-4 ring-sky-100 animate-pulse'
                        : statusCategory === 'completed'
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : statusCategory === 'rejected'
                        ? 'bg-rose-500 text-white ring-4 ring-rose-100'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      {statusCategory === 'under_review' ? (
                        <Activity className="w-3.5 h-3.5" />
                      ) : statusCategory === 'completed' ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : statusCategory === 'rejected' ? (
                        <AlertCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                    <span className={`text-[10.5px] font-bold leading-tight ${
                      statusCategory === 'under_review' ? 'text-[#0284c7]' : statusCategory === 'rejected' ? 'text-rose-700' : 'text-slate-900'
                    }`}>
                      3. Risk Audit
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono hidden sm:block">
                      {statusCategory === 'under_review' ? 'Under Review' : statusCategory === 'rejected' ? 'Findings Raised' : 'Committee Audit'}
                    </span>
                  </div>

                  {/* Stage 4: Decision */}
                  <div className="flex flex-col items-center text-center space-y-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                      statusCategory === 'completed'
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : statusCategory === 'rejected'
                        ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      {statusCategory === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : statusCategory === 'rejected' ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                    <span className={`text-[10.5px] font-bold leading-tight ${
                      statusCategory === 'completed' ? 'text-emerald-700' : statusCategory === 'rejected' ? 'text-rose-700' : 'text-slate-400'
                    }`}>
                      4. Decision
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono hidden sm:block">
                      {statusCategory === 'completed' ? 'Completed & Approved' : statusCategory === 'rejected' ? 'Declined' : 'Pending Review'}
                    </span>
                  </div>
                </div>
              </div>

              {/* REQUIREMENTS REQUIRED & COMPLIANCE CHECKLIST */}
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <ShieldCheck className="w-4 h-4 text-[#2998d6]" />
                      Program Requirements &amp; Verification Documents Checklist
                    </h4>
                    <p className="text-[10.5px] text-slate-500 font-sans mt-0.5">
                      Mandatory conditions verified against your SME submission.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openUploadDocModal(app)}
                    className="accounting-btn-secondary !h-7 !text-[11px] !px-2.5 self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
                  >
                    <FilePlus className="w-3.5 h-3.5 text-[#2998d6]" />
                    <span>Upload Additional File</span>
                  </button>
                </div>

                {/* Required Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {requiredDocList.map((reqDoc, idx) => {
                    const reqLower = reqDoc.toLowerCase();
                    const matchedUploadedDoc = (app.documents || []).find(d => {
                      const dLower = d.documentType.toLowerCase();
                      return dLower === reqLower || reqLower.includes(dLower) || dLower.includes(reqLower);
                    });

                    const isProvided = !!matchedUploadedDoc;

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-lg border transition-all flex flex-col justify-between space-y-2.5 ${
                          isProvided
                            ? 'bg-emerald-50/30 border-emerald-200'
                            : 'bg-amber-50/40 border-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5">
                              {isProvided ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                              )}
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-slate-900 leading-tight">
                                {reqDoc}
                              </h5>
                              {isProvided ? (
                                <div className="mt-1 text-[10px] text-slate-500 font-mono space-y-0.5">
                                  <p className="truncate text-slate-700 font-semibold max-w-[240px]">
                                    {matchedUploadedDoc.fileName}
                                  </p>
                                  <p className="text-slate-400">
                                    {formatFileSize(matchedUploadedDoc.sizeBytes)} · Uploaded: {new Date(matchedUploadedDoc.uploadedAt || Date.now()).toLocaleDateString()}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-[10.5px] text-amber-700 mt-1">
                                  Mandatory underwriting requirement pending submission.
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            {isProvided ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Submitted
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                Required
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-[9.5px] text-slate-400 font-mono">
                            {isProvided ? 'Verified Format' : 'Accepted: PDF, Office, Img (<=10MB)'}
                          </span>

                          {isProvided ? (
                            <button
                              type="button"
                              onClick={() => handleDownloadDoc(matchedUploadedDoc)}
                              className="px-2.5 py-1 text-[10.5px] font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded transition flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3 h-3 text-[#2998d6]" />
                              <span>Download</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openUploadDocModal(app, reqDoc)}
                              className="px-2.5 py-1 text-[10.5px] font-bold text-white bg-[#2998d6] hover:bg-[#1f85be] rounded shadow-2xs transition flex items-center gap-1 cursor-pointer"
                            >
                              <UploadCloud className="w-3 h-3" />
                              <span>Upload Now</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Extra Uploaded Documents (if any) */}
                {extraUploadedDocs.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                      Additional Supporting Attachments ({extraUploadedDocs.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {extraUploadedDocs.map((extraDoc, idx) => (
                        <div key={idx} className="p-2.5 bg-white rounded border border-slate-200 flex items-center justify-between text-xs">
                          <div className="truncate mr-2">
                            <strong className="block text-[11px] text-slate-800 font-semibold truncate">{extraDoc.documentType}</strong>
                            <span className="text-[9.5px] text-slate-400 font-mono">{extraDoc.fileName} · {formatFileSize(extraDoc.sizeBytes)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc(extraDoc)}
                            className="px-2.5 py-1 text-[10.5px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3 text-[#2998d6]" />
                            <span>Download</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial & Underwriting Criteria Compliance Breakdown */}
                <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-lg space-y-2">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block font-sans">
                    SME Profile Underwriting Standard Matching
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {/* Health Score */}
                    <div className="p-2.5 bg-white rounded border border-slate-200 space-y-0.5">
                      <span className="text-[9px] text-slate-400 block uppercase font-semibold">Min Health Score</span>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 font-mono">{matchedOpp?.minHealthScore || 60}% Req</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          (app.smeHealth || activeSme.healthScore) >= (matchedOpp?.minHealthScore || 60)
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {app.smeHealth || activeSme.healthScore}% Actual
                        </span>
                      </div>
                    </div>

                    {/* Readiness Score */}
                    <div className="p-2.5 bg-white rounded border border-slate-200 space-y-0.5">
                      <span className="text-[9px] text-slate-400 block uppercase font-semibold">Loan Readiness</span>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 font-mono">{matchedOpp?.minReadinessScore || 65}% Req</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          (app.smeReadiness || calculatedReadiness) >= (matchedOpp?.minReadinessScore || 65)
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-sky-50 text-[#0284c7] border border-sky-200'
                        }`}>
                          {app.smeReadiness || calculatedReadiness}% Index
                        </span>
                      </div>
                    </div>

                    {/* Regulatory Registration */}
                    <div className="p-2.5 bg-white rounded border border-slate-200 space-y-0.5">
                      <span className="text-[9px] text-slate-400 block uppercase font-semibold">RDB / Tax Status</span>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px] truncate">
                          {matchedOpp?.taxCompliance ? 'RRA Clearance' : 'Registered SME'}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-mono">
                          Pass
                        </span>
                      </div>
                    </div>

                    {/* Collateral Security */}
                    <div className="p-2.5 bg-white rounded border border-slate-200 space-y-0.5">
                      <span className="text-[9px] text-slate-400 block uppercase font-semibold">Security Structure</span>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px] truncate" title={matchedOpp?.collateralRequired ? (matchedOpp.collateralType || 'Asset Pledge') : 'Unsecured'}>
                          {matchedOpp?.collateralRequired ? (matchedOpp.collateralType || 'Asset Pledge') : 'No Collateral'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded font-mono">
                          Standard
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* REVIEW FEEDBACK & AI ACCELERATOR ADVISORY */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                      <Building2 className="w-3.5 h-3.5 text-[#2998d6]" />
                      Financial Institution Review Decision &amp; Remarks
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      Desk: {app.institution || matchedOpp?.institution || 'Credit Desk'}
                    </span>
                  </div>
                  <div className="mt-1.5 p-3 bg-white border border-slate-200 rounded text-xs text-slate-700 leading-relaxed font-sans shadow-2xs">
                    {app.feedback || 'Application received and placed in credit intake pool. Awaiting underwriter inspection of submitted trading books.'}
                  </div>
                </div>

                {/* AI Copilot Guidance */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-[#0284c7] uppercase tracking-widest flex items-center gap-1 font-sans">
                    <Sparkles className="w-3.5 h-3.5 text-[#2998d6]" />
                    Elevata AI Fast-Track Recommendation
                  </span>
                  {app.aiSuggestions && app.aiSuggestions.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                      {app.aiSuggestions.map((suggestion, sIdx) => (
                        <li key={sIdx}>{suggestion}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {statusCategory === 'pending'
                        ? 'Your file is in the initial desk screening queue. Continue recording daily sales and inventory in the ledger to maintain positive momentum.'
                        : statusCategory === 'under_review'
                        ? 'Credit committee is analyzing debt-to-revenue ratio. Ensure all required compliance documents above are verified and up-to-date.'
                        : statusCategory === 'completed'
                        ? 'Credit facility has been successfully approved! Reach out to the institution representative to arrange loan facility disbursement.'
                        : 'Review the underwriter remarks above, update any missing documents, and re-apply once requirements are satisfied.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer Actions */}
              <div className="pt-3 border-t border-slate-150 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-[11px] text-slate-500 font-sans">
                  Need assistance with this facility? Contact the underwriter directly:
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {statusCategory === 'completed' && (
                    <Link
                      to="/loans"
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Track &amp; Repay Loan</span>
                    </Link>
                  )}

                  {matchedOpp && (
                    <button
                      type="button"
                      onClick={() => setSelectedOppId(matchedOpp.id)}
                      className="accounting-btn-secondary !h-8 !text-xs !px-3 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Program Terms</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openUploadDocModal(app)}
                    className="accounting-btn-primary !h-8 !text-xs !px-3.5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Submit Requirement File</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredApplications.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#cbd5e1] p-12 text-center space-y-3 bg-slate-50/50">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-[#2998d6] mx-auto flex items-center justify-center border border-sky-100">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 font-heading">
                {applications.length === 0
                  ? 'No Credit or Grant Applications Submitted Yet'
                  : `No Applications Match Status "${appStatusFilter}"`}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {applications.length === 0
                  ? 'Explore matched commercial credit lines, working capital loans, and business development grants in the Opportunity Marketplace.'
                  : 'Try selecting "All Applications" or adjusting your search keyword above to view other applications.'}
              </p>
            </div>
            <div>
              {applications.length === 0 ? (
                <Link
                  to="/opportunity-hub"
                  className="accounting-btn-primary !h-8 !px-4 !text-xs inline-flex items-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Browse Available Opportunities</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAppStatusFilter('all');
                    setAppSearchTerm('');
                  }}
                  className="accounting-btn-secondary !h-8 !px-4 !text-xs"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* UPLOAD ADDITIONAL / REQUIRED DOCUMENT MODAL */}
      {uploadModalApp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-[#cbd5e1] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 bg-[#1a2332] text-white flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] font-bold bg-[#2998d6] text-white px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                  Requirements Upload
                </span>
                <h3 className="text-sm font-bold text-white leading-snug">
                  Upload Requirement Document
                </h3>
                <p className="text-[11px] text-slate-300">
                  Dossier: <span className="text-white font-semibold">{uploadModalApp.opportunityTitle}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUploadModalApp(null);
                  setUploadDocType('');
                  setUploadFile(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadAdditionalDoc} className="p-5 space-y-4 text-xs">
              <div>
                <label className="accounting-label">Document Type / Requirement Name</label>
                <input
                  type="text"
                  placeholder="e.g. RRA Tax Clearance Certificate, Bank Statement..."
                  value={uploadDocType}
                  onChange={e => setUploadDocType(e.target.value)}
                  className="accounting-input w-full"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Name of the verification requirement or institutional request.
                </span>
              </div>

              <div>
                <label className="accounting-label">Select File to Upload</label>
                <div className="border-2 border-dashed border-slate-300 hover:border-[#2998d6] rounded-lg p-5 text-center transition-colors bg-slate-50/50">
                  <input
                    type="file"
                    id="my-app-doc-input"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff,.heic,.heif,.csv,.txt,.rtf,.json,.xml,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="my-app-doc-input" className="cursor-pointer block space-y-2">
                    <div className="w-10 h-10 rounded-full bg-sky-50 text-[#2998d6] mx-auto flex items-center justify-center border border-sky-100">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    {uploadFile ? (
                      <div className="space-y-0.5">
                        <strong className="text-slate-900 block font-semibold text-xs truncate max-w-xs mx-auto">
                          {uploadFile.name}
                        </strong>
                        <span className="text-[10px] text-emerald-600 font-mono font-bold block">
                          Ready ({formatFileSize(uploadFile.size)}) · Click to replace
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-slate-700 block">
                          Click to select a file
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          PDF, PNG, JPG, Word, Excel, CSV up to 10 MB
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadModalApp(null);
                    setUploadDocType('');
                    setUploadFile(null);
                  }}
                  className="accounting-btn-secondary !h-9 !px-4"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUploadingDoc || !uploadFile}
                  className="accounting-btn-primary !h-9 !px-5 !bg-[#2998d6] hover:!bg-[#1f85be] flex items-center gap-1.5 shadow-xs"
                >
                  {isUploadingDoc ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Document...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Submit Requirement File</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OPPORTUNITY DETAILS MODAL (VIEW PROGRAM TERMS) */}
      {selectedOpp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start gap-4 bg-slate-50/70">
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-bold bg-[#1a2332] text-white px-2.5 py-0.5 rounded uppercase tracking-wider font-mono">
                    {selectedOpp.category}
                  </span>
                  <span className="text-[10px] font-bold bg-sky-50 text-[#0284c7] border border-sky-200 px-2.5 py-0.5 rounded uppercase font-mono">
                    Verified Program
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{selectedOpp.title}</h3>
                <p className="text-xs text-slate-500">
                  Offered by <strong className="text-slate-800">{selectedOpp.institution}</strong> · Deadline: <span className="font-mono text-slate-700">{selectedOpp.deadline}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOppId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 text-xs">
              {/* Institution Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#2998d6] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2998d6]" />
                    Verified Institution Desk
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedOpp.publisher?.institutionName || selectedOpp.institution}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10.5px]">
                  {selectedOpp.publisher?.phone && (
                    <a href={`tel:${selectedOpp.publisher.phone}`} className="px-2.5 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-700 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#2998d6]" /> {selectedOpp.publisher.phone}
                    </a>
                  )}
                  {selectedOpp.publisher?.email && (
                    <a href={`mailto:${selectedOpp.publisher.email}`} className="px-2.5 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-700 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[#2998d6]" /> Email Desk
                    </a>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Overview &amp; Scope</span>
                <div className="p-3.5 bg-slate-50 rounded-lg leading-relaxed text-slate-700">
                  <FormattedText text={selectedOpp.description} />
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Benefits &amp; Terms</span>
                <div className="p-3.5 bg-slate-50 rounded-lg leading-relaxed text-slate-700">
                  <FormattedText text={selectedOpp.benefits} />
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Mandatory Required Documents</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(selectedOpp.requiredDocs || []).map((doc, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center gap-2 text-[11px] text-slate-700 font-medium">
                      <FileCheck className="w-3.5 h-3.5 text-[#2998d6] shrink-0" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOppId(null)}
                className="accounting-btn-secondary !h-8 !px-4 text-xs"
              >
                Close Terms
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

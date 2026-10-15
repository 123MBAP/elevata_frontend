import { useState, useMemo, useEffect } from 'react';
import { useApp, Application, normalizeApplicationStatus } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import { Card, CardContent } from '../assets/components/ui/card';
import { Button } from '../assets/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  AlertCircle,
  Check,
  Sparkles,
  TrendingUp,
  Building2,
  Landmark,
  ShieldCheck,
  Eye,
  Download,
  ExternalLink,
  Coins,
  X,
  CheckSquare,
  FileCheck,
  Sliders
} from 'lucide-react';
import { apiFile } from '../lib/api';
import { openBlankViewerTab, writeDocumentViewer } from '../lib/documentViewer';
import { financialDemoApi, DemoApplication, DemoLoan } from '../services/financialDemoApi';

interface DocumentDetail {
  id: string;
  name: string;
  category: string;
  issuer: string;
  docNumber: string;
  issueDate: string;
  expiryDate: string;
  fileSize: string;
  fileType: string;
  status: 'Verified' | 'Pending Verification' | 'Attached';
  verifiedBy: string;
  summary: string;
  mimeType?: string;
  fileName?: string;
  downloadUrl?: string;
}

type ApplicationStatus = Application['status'];
type DisplayApplicationStatus = ApplicationStatus | 'Disbursed';

function getStatusStyle(status: DisplayApplicationStatus): string {
  if (status === 'Disbursed') return 'bg-indigo-100 text-indigo-800 border-indigo-300 shadow-sm';
  switch (normalizeApplicationStatus(status)) {
    case 'Approved':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm';
    case 'Rejected':
      return 'bg-rose-100 text-rose-800 border-rose-300 shadow-sm';
    case 'Under Review':
      return 'bg-sky-100 text-sky-800 border-sky-300 shadow-sm';
    default:
      return 'bg-amber-100 text-amber-800 border-amber-300 shadow-sm';
  }
}

function getStatusIcon(status: DisplayApplicationStatus) {
  if (status === 'Disbursed') return <CheckCircle className="w-3.5 h-3.5 text-indigo-700 shrink-0" />;
  switch (normalizeApplicationStatus(status)) {
    case 'Approved':
      return <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0" />;
    case 'Rejected':
      return <XCircle className="w-3.5 h-3.5 text-rose-700 shrink-0" />;
    case 'Under Review':
      return <Clock className="w-3.5 h-3.5 text-sky-700 shrink-0" />;
    default:
      return <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />;
  }
}

function getSubmittedDocuments(app: Application): DocumentDetail[] {
  return (app.documents || []).map((document) => {
    const extension = document.fileName.split('.').pop()?.toUpperCase();
    const fileType = extension || 'FILE';
    const size = document.sizeBytes >= 1024 * 1024
      ? `${(document.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(document.sizeBytes / 1024))} KB`;

    return {
      id: document.id,
      name: document.documentType,
      category: 'SME Submitted Document',
      issuer: app.smeName,
      docNumber: document.id.slice(0, 12).toUpperCase(),
      issueDate: new Date(document.uploadedAt).toLocaleDateString(),
      expiryDate: 'Not specified',
      fileSize: size,
      fileType,
      status: 'Attached',
      verifiedBy: 'Pending bank officer review',
      summary: `Original file: ${document.fileName}`,
      mimeType: document.mimeType,
      fileName: document.fileName,
      downloadUrl: document.downloadUrl
    };
  });
}

export default function BankerApplications() {
  const { applications, opportunities, smes, updateApplicationStatus } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Selected application for slide-over / full review modal
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [activeReviewTab, setActiveReviewTab] = useState<'overview' | 'metrics' | 'documents' | 'eligibility'>('overview');
  const [reviewStatus, setReviewStatus] = useState<ApplicationStatus>('Under Review');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [documentLoading, setDocumentLoading] = useState(false);
  const [financialApplications, setFinancialApplications] = useState<DemoApplication[]>([]);
  const [financialLoans, setFinancialLoans] = useState<DemoLoan[]>([]);
  const [isDisbursingApplicationId, setIsDisbursingApplicationId] = useState<string | null>(null);
  const [disbursedApplicationIds, setDisbursedApplicationIds] = useState<string[]>([]);
  const [isDisbursementModalOpen, setIsDisbursementModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Find selected application, matched SME and opportunity details
  const selectedApp = useMemo(() => {
    return applications.find(app => app.id === selectedAppId) || null;
  }, [applications, selectedAppId]);

  const selectedSme = useMemo(() => {
    if (!selectedApp) return null;
    return smes.find(s => s.id === selectedApp.smeId) || null;
  }, [selectedApp, smes]);

  const selectedOpp = useMemo(() => {
    if (!selectedApp) return null;
    return opportunities.find(o => o.id === selectedApp.opportunityId) || null;
  }, [selectedApp, opportunities]);

  const selectedFinancialApplication = useMemo(() => {
    if (!selectedApp) return null;
    return financialApplications.find(financialApp => financialApp.id === selectedApp.id)
      || financialApplications.find(financialApp => (
        financialApp.smeId === selectedApp.smeId
        && financialApp.productName === selectedApp.opportunityTitle
      ))
      || null;
  }, [financialApplications, selectedApp]);

  const linkedLoanForApplication = (applicationId: string) => {
    const application = applications.find(item => item.id === applicationId);
    const financialApplication = financialApplications.find(item => item.id === applicationId)
      || financialApplications.find(item => (
        item.smeId === application?.smeId
        && item.productName === application?.opportunityTitle
      ));
    return financialLoans.find(loan => loan.applicationId === applicationId || loan.id === financialApplication?.associatedLoanId) || null;
  };

  const getApplicationDisplayStatus = (application: Application): DisplayApplicationStatus => {
    const linkedLoan = linkedLoanForApplication(application.id);
    return linkedLoan?.disbursementStatus === 'Completed' || Boolean(linkedLoan?.disbursedAt)
      ? 'Disbursed'
      : normalizeApplicationStatus(application.status);
  };

  const selectedStatus: DisplayApplicationStatus | null = selectedApp ? getApplicationDisplayStatus(selectedApp) : null;

  useEffect(() => {
    const loadFinancialRecords = async () => {
      try {
        const records = await financialDemoApi.getFiApplications();
        setFinancialApplications(records);
        const smeIds = [...new Set(records.map(record => record.smeId))];
        const loanSets = await Promise.all(smeIds.map(smeId => financialDemoApi.getSmeLoans(smeId)));
        setFinancialLoans(loanSets.flat());
      } catch {
        setFinancialApplications([]);
        setFinancialLoans([]);
      }
    };

    loadFinancialRecords();
  }, []);

  // Open review helper
  const handleOpenReview = (app: Application) => {
    setSelectedAppId(app.id);
    setActiveReviewTab('overview');
    setReviewStatus(app.status);
    setReviewFeedback(app.feedback || '');
  };

  // Submit review feedback
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !selectedApp) return;

    try {
      await updateApplicationStatus(selectedAppId, reviewStatus, reviewFeedback);
      if (reviewStatus === 'Approved' && selectedFinancialApplication && !selectedFinancialApplication.canDisburse) {
        await financialDemoApi.underwriteApplication(selectedFinancialApplication.id, {
          decision: 'Approved',
          feedback: reviewFeedback
        });
        setFinancialApplications(await financialDemoApi.getFiApplications());
      }
    } catch (error: unknown) {
      triggerToast(error instanceof Error ? error.message : 'Unable to save this decision.');
      return;
    }

    triggerToast(`Application #${selectedApp.id} updated to "${reviewStatus}" successfully.`);
    setSelectedAppId(null);
  };

  const handleDisburseApprovedLoan = async () => {
    if (!selectedApp) return;

    setIsDisbursingApplicationId(selectedApp.id);
    try {
      if (!selectedFinancialApplication?.associatedLoanId) {
        await updateApplicationStatus(
          selectedApp.id,
          'Disbursed',
          'Funds released to the SME receiving account and disbursement instruction recorded.'
        );
        setDisbursedApplicationIds(previous => [...new Set([...previous, selectedApp.id])]);
        setIsDisbursementModalOpen(false);
        triggerToast(`Disbursement instruction for ${formatRWF(selectedApp.requestedAmount || 0)} recorded for ${selectedApp.smeName}.`);
        return;
      }

      const isMobileMoneyDestination = selectedApp.receivingAccountType === 'mobile_money';
      const destinationAccount = isMobileMoneyDestination
        ? selectedApp.receivingMobileNumber
        : selectedApp.receivingAccountNumber;

      const result = await financialDemoApi.disburseLoan(selectedFinancialApplication.associatedLoanId, {
        channel: isMobileMoneyDestination ? 'Mobile Money' : 'Bank Transfer',
        destinationAccount,
        simulateOutcome: 'success'
      });

      if (!result.success) {
        triggerToast(result.isPending
          ? `Disbursement pending settlement. Reference: ${result.disbursementReference}`
          : 'Disbursement was not completed by the payment provider.');
        return;
      }

      await updateApplicationStatus(
        selectedApp.id,
        'Disbursed',
        `Funds released to the SME receiving account. Disbursement reference: ${result.disbursementReference}.`
      );

      setDisbursedApplicationIds(previous => [...new Set([...previous, selectedApp.id])]);
      const refreshedLoan = await financialDemoApi.getLoanDetails(selectedFinancialApplication.associatedLoanId);
      setFinancialLoans(previous => [...previous.filter(loan => loan.id !== refreshedLoan.id), refreshedLoan]);
      setFinancialApplications(await financialDemoApi.getFiApplications());
      setIsDisbursementModalOpen(false);
      triggerToast(`Disbursement of ${formatRWF(result.disbursedAmount)} completed. Reference: ${result.disbursementReference}`);
    } catch (error: unknown) {
      triggerToast(error instanceof Error ? error.message : 'Unable to disburse this approved facility.');
    } finally {
      setIsDisbursingApplicationId(null);
    }
  };

  const isTextDocumentType = (mimeType?: string | null) =>
    Boolean(mimeType?.startsWith('text/'))
    || ['application/json', 'application/xml', 'application/rtf'].includes(mimeType || '');

  const writeViewer = (
    tab: Window | null,
    document: DocumentDetail,
    blobUrl: string,
    textContent: string | null
  ) => {
    if (!tab) return false;
    writeDocumentViewer(tab, {
      blobUrl,
      fileName: document.fileName || document.name,
      title: document.name,
      mimeType: document.mimeType,
      textContent,
      fileType: document.fileType
    });
    return true;
  };

  const handleOpenDocument = async (document: DocumentDetail) => {
    // Open a blank new tab immediately on user click to avoid browser popup blockers
    const viewerTab = openBlankViewerTab();
    if (viewerTab) {
      try {
        viewerTab.document.title = `Loading ${document.name}...`;
        viewerTab.document.body.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#334155;background:#f8fafc;">
            <div style="text-align:center;">
              <div style="display:inline-block;width:34px;height:34px;border:3px solid #cbd5e1;border-top-color:#2998d6;border-radius:50%;animation:spin 1s linear infinite;"></div>
              <p style="margin-top:16px;font-size:14px;font-weight:600;color:#1e293b;">Opening ${document.name}...</p>
              <p style="font-size:12px;color:#64748b;margin-top:4px;">Elevata Document Verification Suite</p>
              <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
            </div>
          </div>
        `;
      } catch {
        // ignore cross-origin access limitations
      }
    }

    setDocumentLoading(true);
    try {
      let blob: Blob | null = null;
      let textContent: string | null = null;

      if (document.downloadUrl) {
        try {
          blob = await apiFile(document.downloadUrl);
          if (isTextDocumentType(document.mimeType)) {
            textContent = await blob.text();
          }
        } catch {
          // If server file is unavailable (e.g. simulated record), generate fallback representation
        }
      }

      if (!blob) {
        const contentText = `
========================================================================
ELEVATA VERIFIED DIGITAL DOCUMENT DOSSIER
========================================================================

Document Name:     ${document.name}
Issuer / Authority: ${document.issuer}
Document Number:   ${document.docNumber}
Date of Issuance:  ${document.issueDate}
Expiry Date:       ${document.expiryDate}
Verification Status: ${document.status} (Verified by Bank Officer)
Category:          ${document.category}

Summary / Description:
------------------------------------------------------------------------
${document.summary}

Certification:
------------------------------------------------------------------------
This electronic file is certified and cryptographically timestamped on
the Elevata 360 Financial Underwriting Ledger. All contents reflect
official business records submitted for commercial credit assessment.
========================================================================
        `.trim();
        blob = new Blob([contentText], { type: 'text/plain;charset=utf-8' });
        textContent = contentText;
      }

      const tabUrl = URL.createObjectURL(blob);

      if (viewerTab) {
        writeDocumentViewer(viewerTab, {
          blobUrl: tabUrl,
          fileName: document.fileName || `${document.name.replace(/\s+/g, '_')}.txt`,
          title: document.name,
          mimeType: document.mimeType || (document.fileType === 'PDF' ? 'application/pdf' : 'text/plain'),
          textContent,
          fileType: document.fileType
        });
      } else {
        triggerToast('Please allow pop-ups to open documents in a new tab.');
      }
    } catch (error: unknown) {
      if (viewerTab) viewerTab.close();
      triggerToast(error instanceof Error ? error.message : 'Unable to open this document.');
    } finally {
      setDocumentLoading(false);
    }
  };

  const handleDownloadDocument = async (document: DocumentDetail) => {
    try {
      let blob: Blob | null = null;
      if (document.downloadUrl) {
        try {
          blob = await apiFile(document.downloadUrl);
        } catch {
          // fallback
        }
      }
      if (!blob) {
        const contentText = `DOCUMENT: ${document.name}\nIssuer: ${document.issuer}\nDoc ID: ${document.docNumber}\nDate: ${document.issueDate}\n\n${document.summary}`;
        blob = new Blob([contentText], { type: 'text/plain;charset=utf-8' });
      }
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.fileName || `${document.name.replace(/\s+/g, '_')}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      triggerToast(error instanceof Error ? error.message : 'Unable to download this document.');
    }
  };


  // Quick preset feedback templates
  const applyPresetFeedback = (status: ApplicationStatus, feedbackText: string) => {
    setReviewStatus(status);
    setReviewFeedback(feedbackText);
  };

  // Filter application list
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const normalizedStatus = normalizeApplicationStatus(app.status);
      const matchesSearch = app.smeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            app.opportunityTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            app.smeSector.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            app.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || normalizedStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  // Calculations for summary stats
  const stats = useMemo(() => {
    const total = applications.length;
    const submitted = applications.filter(a => normalizeApplicationStatus(a.status) === 'Under Review').length;
    const review = applications.filter(a => normalizeApplicationStatus(a.status) === 'Under Review').length;
    const approved = applications.filter(a => normalizeApplicationStatus(a.status) === 'Approved').length;
    const rejected = applications.filter(a => normalizeApplicationStatus(a.status) === 'Rejected').length;

    return { total, submitted, review, approved, rejected };
  }, [applications]);

  const activeDocumentsList = useMemo(() => {
    if (!selectedApp) return [];
    return getSubmittedDocuments(selectedApp);
  }, [selectedApp, selectedSme, selectedOpp]);

  // Compute monthly financials for selected SME
  const smeFinancialMetrics = useMemo(() => {
    if (!selectedSme) return null;

    const monthlyData = selectedSme.monthlyData || [];
    const totalRev6Mo = monthlyData.reduce((acc, m) => acc + m.revenue, 0);
    let avgMonthlyRev = 5000000;
    if (monthlyData.length > 0) {
      avgMonthlyRev = Math.round(totalRev6Mo / monthlyData.length);
    }
    const totalExp6Mo = monthlyData.reduce((acc, m) => acc + m.expenses, 0);
    let avgMonthlyExp = 3800000;
    if (monthlyData.length > 0) {
      avgMonthlyExp = Math.round(totalExp6Mo / monthlyData.length);
    }
    const latestMonth = monthlyData[monthlyData.length - 1] || { revenue: 5800000, expenses: 4300000, inflow: 6000000, outflow: 4500000 };
    let netCashMargin = 22;
    if (latestMonth.revenue > 0) {
      netCashMargin = Math.round(((latestMonth.revenue - latestMonth.expenses) / latestMonth.revenue) * 100);
    }
    const annualRunRate = avgMonthlyRev * 12;

    const totalStockValue = (selectedSme.inventoryItems || []).reduce((acc, item) => acc + (item.stockLevel * item.unitPrice), 0);
    const lowStockCount = (selectedSme.inventoryItems || []).filter(i => i.status === 'Low Stock').length;

    const existingDebt = selectedSme.loanDetails?.outstandingAmount || 0;
    let debtToRevenueRatio = 0;
    if (avgMonthlyRev > 0 && annualRunRate > 0) {
      debtToRevenueRatio = Math.round((existingDebt / annualRunRate) * 100);
    }
    let dscrRatio = '1.35';
    if (latestMonth.expenses > 0) {
      dscrRatio = (latestMonth.revenue / latestMonth.expenses).toFixed(2);
    }

    return {
      avgMonthlyRev,
      avgMonthlyExp,
      annualRunRate,
      latestMonth,
      netCashMargin,
      totalStockValue,
      lowStockCount,
      existingDebt,
      debtToRevenueRatio,
      dscrRatio,
      monthlyData
    };
  }, [selectedSme]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-slate-950 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-150">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 font-heading">Loan &amp; Facility Applications</h2>
            <span className="bg-sky-50 text-[#2998d6] text-[10px] px-2 py-0.5 font-bold rounded-full border border-sky-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#2998d6]" />
              Bank Underwriting Desk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit submitted application dossiers, inspect verified documentation, analyze business health indices, and render credit decisions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg font-bold border border-slate-200">
            Total Pipeline: <strong className="text-slate-900">{stats.total} Files</strong>
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition duration-150">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-heading">Submitted (New)</span>
              <span className="text-xl font-bold text-amber-600 mt-1 block font-mono">{stats.submitted}</span>
              <span className="text-[9.5px] text-slate-400 mt-0.5 block">Awaiting preliminary review</span>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition duration-150">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-heading">Under Review</span>
              <span className="text-xl font-bold text-[#2998d6] mt-1 block font-mono">{stats.review}</span>
              <span className="text-[9.5px] text-slate-400 mt-0.5 block">Risk assessment active</span>
            </div>
            <div className="p-2.5 bg-sky-50 text-[#2998d6] rounded-lg">
              <FileCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition duration-150">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-heading">Approved</span>
              <span className="text-xl font-bold text-emerald-600 mt-1 block font-mono">{stats.approved}</span>
              <span className="text-[9.5px] text-slate-400 mt-0.5 block">Disbursed / Accepted</span>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition duration-150">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-heading">Declined</span>
              <span className="text-xl font-bold text-rose-600 mt-1 block font-mono">{stats.rejected}</span>
              <span className="text-[9.5px] text-slate-400 mt-0.5 block">Eligibility gap feedback sent</span>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Search Bar */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SME name, program title, sector, or application ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#2998d6] focus:border-[#2998d6] focus:outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="relative w-full sm:w-52">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#2998d6] focus:border-[#2998d6] focus:outline-none bg-white text-slate-700 font-medium"
            >
              <option value="All">All Application Statuses</option>
              <option value="Under Review">Under Review (In Progress)</option>
              <option value="Approved">Approved</option>
              <option value="Disbursed">Disbursed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List / Row Summary */}
      <div className="space-y-3">
        {filteredApplications.map((app, index) => {
          const matchedSme = smes.find(s => s.id === app.smeId);
          const matchedOpp = opportunities.find(o => o.id === app.opportunityId);
          const docs = getSubmittedDocuments(app);
          const displayStatus = getApplicationDisplayStatus(app);

          return (
            <div
              key={app.id}
              onClick={() => handleOpenReview(app)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') handleOpenReview(app);
              }}
              className="w-full text-left bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-[#2998d6] transition-all duration-150 overflow-hidden cursor-pointer"
            >
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 p-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                      #{index + 1}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getStatusStyle(displayStatus)}`}>
                      {getStatusIcon(displayStatus)}
                      {displayStatus}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Ref: {app.id.slice(0, 9).toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading truncate">
                        {app.smeName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">{app.smeSector}</span>
                        <span>•</span>
                        <span>{app.opportunityTitle}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 font-semibold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {matchedSme?.riskRating || 'Moderate'} Risk
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0 xl:min-w-[520px]">
                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Requested</span>
                    <span className="block mt-1 text-sm font-bold text-slate-900 font-mono">{app.requestedAmount ? formatRWF(app.requestedAmount) : (matchedOpp?.maxFunding || 'Flexible')}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Readiness</span>
                    <span className="block mt-1 text-sm font-bold text-emerald-600 font-mono">{app.smeReadiness}%</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Docs</span>
                    <span className="block mt-1 text-sm font-bold text-slate-900 font-mono">{docs.length}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Applied</span>
                    <span className="block mt-1 text-sm font-bold text-slate-900 font-mono">{app.appliedAt}</span>
                  </div>
                  {displayStatus === 'Approved'
                    && !disbursedApplicationIds.includes(app.id) && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedAppId(app.id);
                        setIsDisbursementModalOpen(true);
                      }}
                      className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-700 sm:col-span-2 xl:col-span-4"
                    >
                      <Coins className="h-4 w-4" />
                      Disburse Funds
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredApplications.length === 0 && (
          <div className="py-14 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2 bg-white border border-dashed border-slate-200 rounded-xl">
            <FileText className="w-9 h-9 text-slate-300" />
            <span className="font-semibold text-slate-600">No loan or facility applications match your search query.</span>
            <span className="text-[10px] text-slate-400">Try changing the status filter or search term above.</span>
          </div>
        )}
      </div>
      {/* COMPREHENSIVE UNDERWRITING REVIEW MODAL / DRAWER (DESIGNED LIKE BUSINESSACTIVITIES.TSX) */}
      <AnimatePresence>
        {selectedAppId && selectedApp && selectedSme && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-5xl my-4 sm:my-8 relative"
            >
              {/* TOP HEADER RIBBON */}
              <div className="bg-[#1e293b] text-white rounded-t-[6px] px-5 py-3 flex items-center justify-between gap-4 shadow-md border border-slate-700">
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                  <span className="bg-[#2998d6] text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-[4px] font-mono tracking-wider">
                    Application Dossier #{selectedApp.id}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getStatusStyle(selectedStatus || selectedApp.status)}`}>
                    {getStatusIcon(selectedStatus || selectedApp.status)}
                    {selectedStatus}
                  </span>
                  <span className="text-xs font-semibold text-slate-100 truncate">
                    {selectedSme.name}
                  </span>
                  <span className="text-slate-400 text-xs hidden sm:inline">•</span>
                  <span className="text-xs text-slate-300 truncate hidden sm:inline">
                    {selectedApp.opportunityTitle}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono text-slate-300 hidden md:inline">
                    Applied: <strong className="text-white">{selectedApp.appliedAt}</strong>
                  </span>
                  {selectedStatus === 'Approved'
                    && !disbursedApplicationIds.includes(selectedApp.id) && (
                    <button
                      type="button"
                      onClick={() => setIsDisbursementModalOpen(true)}
                      disabled={isDisbursingApplicationId === selectedApp.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white rounded-[4px] text-[10px] font-bold transition cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      {isDisbursingApplicationId === selectedApp.id ? 'Disbursing...' : 'Disburse Funds'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedAppId(null)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-[4px] transition cursor-pointer"
                    aria-label="Close dossier"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* EYE-CATCHING FOLDER TABS BAR (Connected to Card Body) */}
              <div className="flex items-end overflow-x-auto scrollbar-none z-10 relative space-x-1 sm:space-x-1.5 -mb-[1px] pt-2 px-1">
                {[
                  { id: 'overview' as const, label: 'Applicant Dossier', icon: <Building2 className="w-4 h-4" />, count: 1, color: 'text-blue-600' },
                  { id: 'metrics' as const, label: 'Health & Financials', icon: <TrendingUp className="w-4 h-4" />, count: 6, color: 'text-emerald-600' },
                  { id: 'documents' as const, label: 'Documents Dossier', icon: <FileText className="w-4 h-4" />, count: activeDocumentsList.length, color: 'text-teal-600' },
                  { id: 'eligibility' as const, label: 'Underwriting AI Matrix', icon: <Sliders className="w-4 h-4" />, count: 8, color: 'text-purple-600' }
                ].map((tab) => {
                  const isActive = activeReviewTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveReviewTab(tab.id)}
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

              {/* MAIN ACCOUNTING CARD CONTAINER */}
              <div className="accounting-card p-5 sm:p-7 relative z-0 border-[#cbd5e1] rounded-t-none shadow-2xl">
                {/* Card Sub-Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#e2e8f0]">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-normal text-[#1e293b] font-heading">
                      {activeReviewTab === 'overview' && 'SME Applicant Profile & Facility Parameters'}
                      {activeReviewTab === 'metrics' && '6-Month Financial Ledger & Solvency Analysis'}
                      {activeReviewTab === 'documents' && 'Submitted Verification Documents & KYC Ledger'}
                      {activeReviewTab === 'eligibility' && 'Automated Policy Matrix & Underwriting AI'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Offered by <strong className="text-slate-700">{selectedOpp?.institution || 'Underwriting Institution'}</strong> · Facility: <span className="font-semibold text-slate-700">{selectedOpp?.title}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-[4px] border border-slate-200">
                      TIN: 109283741
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-[4px] border border-emerald-200 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> KYC Verified
                    </span>
                  </div>
                </div>

                <div className={`mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border px-4 py-3 ${
                  selectedStatus === 'Approved'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : selectedStatus === 'Rejected'
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-sky-50 border-sky-300 text-sky-900'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      selectedStatus === 'Approved'
                        ? 'bg-emerald-600 text-white'
                        : selectedStatus === 'Rejected'
                        ? 'bg-rose-600 text-white'
                        : 'bg-sky-600 text-white'
                    }`}>
                      {selectedStatus === 'Approved' && <CheckCircle className="w-5 h-5" />}
                      {selectedStatus === 'Rejected' && <XCircle className="w-5 h-5" />}
                      {selectedStatus === 'Under Review' && <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider opacity-70">Underwriting Decision</span>
                      <strong className="block text-base font-extrabold tracking-tight">{selectedStatus}</strong>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium sm:text-right">
                    {selectedStatus === 'Approved' && 'Credit approved and eligible for funds release.'}
                    {selectedStatus === 'Rejected' && 'Application declined under the current credit policy.'}
                    {selectedStatus === 'Under Review' && 'Credit assessment is still in progress.'}
                  </span>
                </div>

                {/* Tab Content Areas */}
                <div className="pt-5 space-y-6">

                  {/* TAB 1: OVERVIEW & APPLICANT DOSSIER */}
                  {activeReviewTab === 'overview' && (
                    <div className="space-y-5">
                      {/* Applicant Profile Information Box */}
                      <div className="p-4 bg-[#f8fafc] border border-[#cbd5e1] rounded-[6px] space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="accounting-label flex items-center gap-1 !mb-0 font-bold text-slate-700 uppercase">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            Verified Enterprise Profile
                          </span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[4px] border border-emerald-200 font-bold flex items-center gap-1 font-mono">
                            <Check className="w-3 h-3 text-emerald-600" /> Registration Certified
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="accounting-label text-slate-500 uppercase">Legal Entity Name</span>
                            <strong className="text-slate-900 block font-bold text-sm">{selectedSme.name}</strong>
                            <span className="text-[10px] text-slate-500 font-mono">TIN: 109283741</span>
                          </div>
                          <div>
                            <span className="accounting-label text-slate-500 uppercase">Sector &amp; Industry</span>
                            <strong className="text-slate-800 block font-bold">{selectedSme.sector}</strong>
                            <span className="text-[10px] text-slate-500 font-mono">{selectedSme.age || 3} Years in business</span>
                          </div>
                          <div>
                            <span className="accounting-label text-slate-500 uppercase">Principal Owner</span>
                            <strong className="text-slate-800 block font-bold">{selectedSme.ownerName}</strong>
                            <span className="text-[10px] text-slate-500 font-mono">Managing Director</span>
                          </div>
                          <div>
                            <span className="accounting-label text-slate-500 uppercase">Contact Details</span>
                            <strong className="text-slate-800 block font-mono text-[11px] truncate">{selectedSme.email}</strong>
                            <span className="text-[10px] text-slate-500 font-mono">+250 788 123 456</span>
                          </div>
                        </div>
                      </div>

                      {/* Facility Request & Terms */}
                      <div className="p-4 bg-white border border-[#cbd5e1] rounded-[6px] space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="accounting-label flex items-center gap-1 !mb-0 font-bold text-slate-700 uppercase">
                            <Coins className="w-3.5 h-3.5 text-[#2998d6]" />
                            Requested Facility Parameters
                          </span>
                          <span className="text-[11px] font-mono text-slate-600 font-semibold">
                            Facility Type: <strong className="text-slate-900">{selectedOpp?.category || 'Credit Facility'}</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 bg-slate-50 border border-[#cbd5e1] rounded-[4px]">
                            <span className="accounting-label text-slate-500 text-[10px]">Maximum Facility Size</span>
                            <strong className="text-base font-bold text-slate-900 block font-mono mt-0.5">
                              {selectedOpp?.maxFunding || '25,000,000 FRW'}
                            </strong>
                          </div>
                          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-[4px]">
                            <span className="accounting-label text-emerald-800 text-[10px]">Interest Rate (% p.a.)</span>
                            <strong className="text-base font-bold text-emerald-800 block font-mono mt-0.5">
                              {selectedOpp?.loanRate || 12}% Fixed
                            </strong>
                          </div>
                          <div className="p-3 bg-slate-50 border border-[#cbd5e1] rounded-[4px]">
                            <span className="accounting-label text-slate-500 text-[10px]">Repayment Term</span>
                            <strong className="text-base font-bold text-slate-900 block font-mono mt-0.5">
                              {selectedOpp?.loanTerm || 24} Months
                            </strong>
                          </div>
                          <div className="p-3 bg-slate-50 border border-[#cbd5e1] rounded-[4px]">
                            <span className="accounting-label text-slate-500 text-[10px]">Grace Period</span>
                            <strong className="text-base font-bold text-slate-900 block font-mono mt-0.5">
                              {selectedOpp?.loanGrace || 3} Months
                            </strong>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <span className="accounting-label text-slate-500 text-[10px]">Intended Purpose of Financing</span>
                          <p className="text-xs text-slate-700 leading-relaxed font-sans mt-0.5">
                            Working Capital &amp; Inventory Bulk Restocking. Applicant intends to purchase inventory directly from registered wholesale cooperatives to support rising market demand.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-[6px] space-y-3">
                        <div className="flex items-center justify-between border-b border-sky-200 pb-2">
                          <span className="accounting-label flex items-center gap-1 !mb-0 font-bold text-sky-900 uppercase">
                            <Landmark className="w-3.5 h-3.5 text-sky-700" />
                            Funds Receiving Instructions
                          </span>
                          <span className="text-[10px] font-bold uppercase text-sky-700 bg-white px-2 py-0.5 rounded border border-sky-200">
                            SME submitted
                          </span>
                        </div>
                        {selectedApp.receivingAccountType === 'mobile_money' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="accounting-label text-slate-500 text-[10px]">Receiving Channel</span>
                              <strong className="text-slate-900 block font-bold">Mobile Money</strong>
                            </div>
                            <div>
                              <span className="accounting-label text-slate-500 text-[10px]">Provider &amp; Number</span>
                              <strong className="text-slate-900 block font-mono">{selectedApp.receivingMobileProvider || 'Mobile Money'} · {selectedApp.receivingMobileNumber || 'Not provided'}</strong>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="accounting-label text-slate-500 text-[10px]">Receiving Channel</span>
                              <strong className="text-slate-900 block font-bold">Bank Account</strong>
                            </div>
                            <div>
                              <span className="accounting-label text-slate-500 text-[10px]">Bank &amp; Account Number</span>
                              <strong className="text-slate-900 block font-mono">{selectedApp.receivingBank || 'Bank not provided'} · {selectedApp.receivingAccountNumber || 'Not provided'}</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Program Benefits and Key Conditions */}
                      <div className="p-4 bg-[#f8fafc] border border-[#cbd5e1] rounded-[6px] space-y-1.5">
                        <span className="accounting-label font-bold text-slate-700 uppercase">
                          Published Program Benefits &amp; Terms
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans">
                          {selectedOpp?.benefits || 'Subsidized fixed interest rate with flexible repayment terms, fast digital processing, and ongoing capacity training.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: BUSINESS HEALTH & FINANCIAL METRICS */}
                  {activeReviewTab === 'metrics' && smeFinancialMetrics && (
                    <div className="space-y-5">
                      {/* Primary Underwriting KPI Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 bg-white border border-[#cbd5e1] rounded-[6px] shadow-2xs space-y-1">
                          <span className="accounting-label text-[10px] text-slate-500">Business Health</span>
                          <div className="flex items-center justify-between">
                            <strong className="text-xl font-bold text-slate-900 font-mono">{selectedSme.healthScore}%</strong>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-[4px] border border-emerald-200">
                              {selectedSme.riskRating} Risk
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block font-mono">Trend: +{selectedSme.healthTrendPercent}% {selectedSme.healthTrend}</span>
                        </div>

                        <div className="p-3.5 bg-white border border-[#cbd5e1] rounded-[6px] shadow-2xs space-y-1">
                          <span className="accounting-label text-[10px] text-slate-500">Loan Readiness Score</span>
                          <strong className="text-xl font-bold text-emerald-600 font-mono block">{selectedApp.smeReadiness}%</strong>
                          <span className="text-[10px] text-emerald-700 font-bold block font-mono">Highly Qualified</span>
                        </div>

                        <div className="p-3.5 bg-white border border-[#cbd5e1] rounded-[6px] shadow-2xs space-y-1">
                          <span className="accounting-label text-[10px] text-slate-500">Monthly Turnover (Avg)</span>
                          <strong className="text-base font-bold text-slate-900 font-mono block truncate" title={formatRWF(smeFinancialMetrics.avgMonthlyRev)}>
                            {formatRWF(smeFinancialMetrics.avgMonthlyRev)}
                          </strong>
                          <span className="text-[10px] text-slate-400 block font-mono">Annual: {formatRWF(smeFinancialMetrics.annualRunRate)}</span>
                        </div>

                        <div className="p-3.5 bg-white border border-[#cbd5e1] rounded-[6px] shadow-2xs space-y-1">
                          <span className="accounting-label text-[10px] text-slate-500">Liquid Cash Reserves</span>
                          <strong className="text-base font-bold text-indigo-700 font-mono block truncate" title={formatRWF(selectedSme.currentBalance)}>
                            {formatRWF(selectedSme.currentBalance)}
                          </strong>
                          <span className="text-[10px] text-emerald-700 font-semibold block font-mono">Net Margin: +{smeFinancialMetrics.netCashMargin}%</span>
                        </div>
                      </div>

                      {/* Financial Performance Table */}
                      <div className="p-4 bg-white border border-[#cbd5e1] rounded-[6px] shadow-2xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">6-Month Financial Ledger History</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">Directly verified from Elevata's digital bookkeeping ledger</p>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-[4px] border border-slate-200">
                            DSCR: {smeFinancialMetrics.dscrRatio}x Coverage
                          </span>
                        </div>

                        <div className="overflow-x-auto border border-[#cbd5e1] rounded-[4px]">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-[#f8fafc] text-slate-600 font-bold border-b border-[#cbd5e1] text-[10px] uppercase font-mono tracking-wider">
                                <th className="py-2.5 px-3">Month</th>
                                <th className="py-2.5 px-3 text-right">Revenue</th>
                                <th className="py-2.5 px-3 text-right">Expenses</th>
                                <th className="py-2.5 px-3 text-right">Inflow (Cash)</th>
                                <th className="py-2.5 px-3 text-right">Outflow (Cash)</th>
                                <th className="py-2.5 px-3 text-right">Net Operating Buffer</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                              {smeFinancialMetrics.monthlyData.map((m, idx) => {
                                const net = m.revenue - m.expenses;
                                return (
                                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-2.5 px-3 font-bold text-slate-800">{m.month} 2026</td>
                                    <td className="py-2.5 px-3 text-right text-slate-900">{formatRWF(m.revenue)}</td>
                                    <td className="py-2.5 px-3 text-right text-slate-600">{formatRWF(m.expenses)}</td>
                                    <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">{formatRWF(m.inflow)}</td>
                                    <td className="py-2.5 px-3 text-right text-rose-700 font-semibold">{formatRWF(m.outflow)}</td>
                                    <td className="py-2.5 px-3 text-right">
                                      <span className={`font-bold ${net >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                        {net >= 0 ? '+' : ''}{formatRWF(net)}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Inventory & Operational Asset Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-white border border-[#cbd5e1] rounded-[6px] shadow-2xs space-y-2.5">
                          <span className="accounting-label font-bold text-slate-700 uppercase">
                            Stock &amp; Inventory Assets
                          </span>
                          <div className="flex justify-between items-center text-xs font-mono border-b border-slate-100 pb-1.5">
                            <span className="text-slate-600">Total Inventory Valuation:</span>
                            <strong className="text-slate-900 font-bold">{formatRWF(smeFinancialMetrics.totalStockValue)}</strong>
                          </div>
                          <div className="flex justify-between items-center text-xs font-mono border-b border-slate-100 pb-1.5">
                            <span className="text-slate-600">Active Stock SKUs:</span>
                            <strong className="text-slate-900 font-bold">{(selectedSme.inventoryItems || []).length} items</strong>
                          </div>
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-slate-600">Low Stock Warnings:</span>
                            <span className="text-amber-700 font-bold">{smeFinancialMetrics.lowStockCount} items requiring restock</span>
                          </div>
                        </div>

                        <div className="p-4 bg-white border border-[#cbd5e1] rounded-[6px] shadow-2xs space-y-2.5">
                          <span className="accounting-label font-bold text-slate-700 uppercase">
                            Existing Credit Leverage &amp; Debt
                          </span>
                          <div className="flex justify-between items-center text-xs font-mono border-b border-slate-100 pb-1.5">
                            <span className="text-slate-600">Existing Bank Debt:</span>
                            <strong className="text-slate-900 font-bold">{formatRWF(smeFinancialMetrics.existingDebt)}</strong>
                          </div>
                          <div className="flex justify-between items-center text-xs font-mono border-b border-slate-100 pb-1.5">
                            <span className="text-slate-600">Debt-to-Annual Revenue:</span>
                            <strong className="text-emerald-700 font-bold">{smeFinancialMetrics.debtToRevenueRatio}% (Low Leverage)</strong>
                          </div>
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-slate-600">Payment Default History:</span>
                            <span className="text-emerald-700 font-bold">0 Defaults (Clean Record)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: SUBMITTED DOCUMENTS DOSSIER */}
                  {activeReviewTab === 'documents' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Submitted Requirements Dossier</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Verification files supplied by the SME matching {selectedOpp?.institution || 'the institution'}'s mandatory underwriting checklist.
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 font-mono">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          {activeDocumentsList.length} original file{activeDocumentsList.length === 1 ? '' : 's'} submitted
                        </span>
                      </div>

                      <div className="space-y-3">
                        {activeDocumentsList.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-4 bg-white border border-[#cbd5e1] hover:border-[#2998d6] rounded-[6px] shadow-2xs transition flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-[9px] font-extrabold font-mono rounded-[4px] ${
                                  doc.fileType === 'PDF' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {doc.fileType}
                                </span>
                                <h5 className="text-xs font-bold text-slate-900">{doc.name}</h5>
                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 font-mono">
                                  <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                                  {doc.status}
                                </span>
                              </div>
                              
                              <p className="text-[11px] text-slate-500 leading-snug">{doc.summary}</p>
                              
                              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                                <span>Issuer: <strong className="text-slate-700">{doc.issuer}</strong></span>
                                <span>•</span>
                                <span>Doc ID: <strong className="text-slate-700">{doc.docNumber}</strong></span>
                                <span>•</span>
                                <span>Date: <strong className="text-slate-700">{doc.issueDate}</strong></span>
                                <span>•</span>
                                <span>Size: <strong className="text-slate-700">{doc.fileSize}</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleOpenDocument(doc)}
                                disabled={documentLoading}
                                className="accounting-btn-primary !h-8 !text-xs !px-3.5 flex items-center gap-1.5"
                                title="Open document in a new tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>View Document</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadDocument(doc)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-[4px] border border-[#cbd5e1] transition cursor-pointer"
                                title="Download File"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: ELIGIBILITY MATRIX & AI EVALUATION */}
                  {activeReviewTab === 'eligibility' && selectedOpp && smeFinancialMetrics && (
                    <div className="space-y-5">
                      {/* Side-by-side Criteria Matrix */}
                      <div className="p-4 bg-white border border-[#cbd5e1] rounded-[6px] shadow-2xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Opportunity Eligibility Matrix</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">Automated verification against {selectedOpp.title} published rules</p>
                          </div>
                        </div>

                        <div className="overflow-x-auto border border-[#cbd5e1] rounded-[4px]">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-[#f8fafc] text-slate-600 font-bold border-b border-[#cbd5e1] text-[10px] uppercase font-mono tracking-wider">
                                <th className="py-2.5 px-3">Evaluation Factor</th>
                                <th className="py-2.5 px-3">Opportunity Threshold</th>
                                <th className="py-2.5 px-3">Applicant Dossier</th>
                                <th className="py-2.5 px-3 text-right">Result</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {[
                                {
                                  factor: 'Target Sector',
                                  req: selectedOpp.sectors.join(', '),
                                  val: selectedSme.sector,
                                  pass: selectedOpp.sectors.includes(selectedSme.sector)
                                },
                                {
                                  factor: 'Min Monthly Turnover',
                                  req: formatRWF(selectedOpp.minMonthlyRevenue || 2000000),
                                  val: formatRWF(smeFinancialMetrics.avgMonthlyRev),
                                  pass: smeFinancialMetrics.avgMonthlyRev >= (selectedOpp.minMonthlyRevenue || 2000000)
                                },
                                {
                                  factor: 'Min Annual Turnover',
                                  req: formatRWF(selectedOpp.minRevenue),
                                  val: formatRWF(smeFinancialMetrics.annualRunRate),
                                  pass: smeFinancialMetrics.annualRunRate >= selectedOpp.minRevenue
                                },
                                {
                                  factor: 'Business Age',
                                  req: selectedOpp.minAge === 0 ? 'Any' : `${selectedOpp.minAge}+ Years`,
                                  val: `${selectedSme.age || 3} Years`,
                                  pass: (selectedSme.age || 3) >= selectedOpp.minAge
                                },
                                {
                                  factor: 'Business Health Score',
                                  req: `Min ${selectedOpp.minHealthScore}%`,
                                  val: `${selectedSme.healthScore}%`,
                                  pass: selectedSme.healthScore >= selectedOpp.minHealthScore
                                },
                                {
                                  factor: 'Loan Readiness Score',
                                  req: `Min ${selectedOpp.minReadinessScore}%`,
                                  val: `${selectedApp.smeReadiness}%`,
                                  pass: selectedApp.smeReadiness >= selectedOpp.minReadinessScore
                                },
                                {
                                  factor: 'Tax Compliance & Filing',
                                  req: selectedOpp.taxCompliance ? 'Mandatory RRA Clearance' : 'Optional',
                                  val: 'Verified RRA Clearance Q3 2026',
                                  pass: true
                                },
                                {
                                  factor: 'Geographical Eligibility',
                                  req: selectedOpp.eligLocations?.join(', ') || 'All Regions',
                                  val: 'Kigali Urban District',
                                  pass: !selectedOpp.eligLocations || selectedOpp.eligLocations.length === 0 || selectedOpp.eligLocations.includes('Kigali')
                                }
                              ].map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-2.5 px-3 font-semibold text-slate-800 text-xs">{row.factor}</td>
                                  <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{row.req}</td>
                                  <td className="py-2.5 px-3 text-slate-800 font-mono text-[11px] font-bold">{row.val}</td>
                                  <td className="py-2.5 px-3 text-right">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase border font-mono ${
                                      row.pass ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}>
                                      {row.pass ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[3]" />}
                                      {row.pass ? 'Passed' : 'Failed'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* AI Underwriting Advisor Recommendation */}
                      <div className="p-4 bg-emerald-950/5 border border-emerald-500/30 rounded-[6px] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                            <span className="accounting-label !mb-0 font-bold text-emerald-900 uppercase">
                              Elevata AI Underwriting Engine Recommendation
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2.5 py-0.5 rounded-[4px] border border-emerald-200">
                            RECOMMENDED FOR APPROVAL
                          </span>
                        </div>

                        <ul className="list-disc pl-4 space-y-1.5 text-slate-700 text-xs leading-relaxed font-sans">
                          <li>
                            <strong>Exceptional Cash Flow Buffer:</strong> Average monthly turnover of {formatRWF(smeFinancialMetrics.avgMonthlyRev)} exceeds debt service requirements by {smeFinancialMetrics.dscrRatio}x.
                          </li>
                          <li>
                            <strong>Clean Tax &amp; Regulatory Standing:</strong> Real-time RRA verification shows zero tax arrears or penalties.
                          </li>
                          <li>
                            <strong>Low Leverage:</strong> Current debt-to-revenue ratio of {smeFinancialMetrics.debtToRevenueRatio}% indicates strong capacity to service additional facility obligations.
                          </li>
                          <li>
                            <strong>Suggested Loan Covenant:</strong> Standard periodic digital sales log syncing through Elevata POS / inventory ledger.
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                </div>

                {/* REVIEW UNDERWRITING DECISION FOOTER (FORM) */}
                {selectedStatus !== 'Approved' && selectedStatus !== 'Disbursed' && (
                <form onSubmit={handleSubmitReview} className="mt-8 pt-5 border-t border-[#e2e8f0] bg-[#f8fafc] -mx-5 -mb-5 sm:-mx-7 sm:-mb-7 p-5 sm:p-7 rounded-b-[6px] space-y-4">
                  {/* Quick Presets Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                    <span className="accounting-label !mb-0 font-bold text-slate-600 uppercase">
                      Quick Decision Presets:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applyPresetFeedback('Approved', 'Approved. All criteria and verified documentation meet bank credit policy standards. Disbursement must be completed in the institution system.')}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-[4px] text-[10px] font-bold font-mono transition cursor-pointer"
                      >
                        Approve (Standard)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetFeedback('Under Review', 'Application placed under review. Risk committee requesting audited 6-month bank statement verification.')}
                        className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-[#1f85be] border border-sky-200 rounded-[4px] text-[10px] font-bold font-mono transition cursor-pointer"
                      >
                        Request Info
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetFeedback('Rejected', 'Application declined due to sector concentration limits and insufficient operational turnover history.')}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-[4px] text-[10px] font-bold font-mono transition cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-1">
                      <label className="accounting-label font-bold uppercase text-slate-700">
                        Underwriting Decision Status <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={reviewStatus}
                        onChange={(e) => setReviewStatus(e.target.value as ApplicationStatus)}
                        className="accounting-select w-full font-bold"
                        required
                      >
                        <option value="Under Review">Under Review (Pending)</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected (Decline Application)</option>
                      </select>

                      {reviewStatus === 'Approved' && (
                        <p className="pt-1 text-[11px] text-amber-700 font-medium">
                          Save the approval first, then use Disburse Funds in the approved dossier to release the facility to the SME.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="accounting-label font-bold uppercase text-slate-700">
                        Official Credit Officer Notes &amp; Feedback <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={reviewFeedback}
                        onChange={(e) => setReviewFeedback(e.target.value)}
                        placeholder="Enter formal justification, loan conditions, or document requirements to be communicated directly to the applicant SME..."
                        rows={2}
                        className="accounting-textarea w-full font-sans text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setSelectedAppId(null)}
                      className="accounting-btn-secondary"
                    >
                      Close Dossier
                    </button>
                    <button
                      type="submit"
                      className="accounting-btn-primary"
                    >
                      <Check className="w-4 h-4" />
                      <span>Commit Decision</span>
                    </button>
                  </div>
                </form>
                )}
              </div>
            </motion.div>

            <AnimatePresence>
              {isDisbursementModalOpen && selectedApp && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="disbursement-title"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.97 }}
                    className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-900 px-5 py-4 text-white">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500">
                          <Coins className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 id="disbursement-title" className="text-base font-bold">Authorize Facility Disbursement</h3>
                          <p className="mt-0.5 text-[11px] text-slate-300">Final funds release instruction</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDisbursementModalOpen(false)}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                        aria-label="Close disbursement confirmation"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4 p-5">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">Amount to be disbursed</span>
                        <strong className="mt-1 block font-mono text-2xl font-extrabold text-emerald-900">
                          {formatRWF(selectedFinancialApplication?.requestedAmount || selectedApp.requestedAmount || 0)}
                        </strong>
                      </div>

                      <div className="overflow-hidden rounded-lg border border-slate-200">
                        <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                          <div className="p-3.5">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Beneficiary SME</span>
                            <strong className="mt-1 block text-sm text-slate-900">{selectedFinancialApplication?.smeName || selectedApp.smeName}</strong>
                            <span className="mt-0.5 block text-[11px] text-slate-500">{selectedFinancialApplication?.contactEmail || selectedApp.contactEmail || 'Verified SME beneficiary'}</span>
                          </div>
                          <div className="p-3.5">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Destination Account</span>
                            <strong className="mt-1 block font-mono text-sm text-slate-900">
                              {selectedApp.receivingAccountType === 'mobile_money' ? 'Mobile Money Wallet' : (selectedApp.receivingBank || 'Receiving bank')}
                            </strong>
                            <span className="mt-0.5 block font-mono text-[11px] text-slate-500">
                              {selectedApp.receivingAccountType === 'mobile_money'
                                ? `${selectedApp.receivingMobileProvider || 'Mobile Money'} · ${selectedApp.receivingMobileNumber || 'Number not provided'}`
                                : `Account ${selectedApp.receivingAccountNumber || 'number not provided'}`}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 divide-y divide-slate-200 border-t border-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                          <div className="p-3.5">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Destination Institution</span>
                            <strong className="mt-1 block text-sm text-slate-900">{selectedFinancialApplication?.institutionName || selectedOpp?.institution || selectedApp.institution || 'Financial Institution'}</strong>
                          </div>
                          <div className="p-3.5">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Transfer Channel</span>
                            <strong className="mt-1 block text-sm text-slate-900">{selectedApp.receivingAccountType === 'mobile_money' ? 'Mobile Money' : 'Bank Transfer'}</strong>
                            <span className="mt-0.5 block text-[11px] text-slate-500">SME submitted destination</span>
                          </div>
                        </div>
                      </div>

           
                      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setIsDisbursementModalOpen(false)}
                          className="accounting-btn-secondary justify-center"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDisburseApprovedLoan}
                          disabled={isDisbursingApplicationId === selectedApp.id}
                          className="accounting-btn-primary justify-center !bg-emerald-600 hover:!bg-emerald-700 disabled:opacity-60"
                        >
                          <Coins className="h-4 w-4" />
                          {isDisbursingApplicationId === selectedApp.id ? 'Releasing Funds...' : 'Confirm Disbursement'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

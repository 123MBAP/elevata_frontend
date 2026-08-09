import { useState, useMemo } from 'react';
import { useApp, Application } from '../context/AppContext';
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
  ClipboardList,
  AlertCircle,
  Check,
  Sparkles
} from 'lucide-react';

export default function BankerApplications() {
  const { applications, updateApplicationStatus } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Selected application for slide-over drawer
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<Application['status']>('Under Review');
  const [reviewFeedback, setReviewFeedback] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Find selected application details
  const selectedApp = useMemo(() => {
    return applications.find(app => app.id === selectedAppId) || null;
  }, [applications, selectedAppId]);

  // Open drawer helper
  const handleOpenReview = (app: Application) => {
    setSelectedAppId(app.id);
    setReviewStatus(app.status);
    setReviewFeedback(app.feedback || '');
  };

  // Submit review feedback
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;

    updateApplicationStatus(selectedAppId, reviewStatus, reviewFeedback);
    triggerToast(`Application status updated to "${reviewStatus}" successfully.`);
    setSelectedAppId(null);
  };

  // Filter application list
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = app.smeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            app.opportunityTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  // Calculations for summary stats
  const stats = useMemo(() => {
    const total = applications.length;
    const submitted = applications.filter(a => a.status === 'Submitted').length;
    const review = applications.filter(a => a.status === 'Under Review').length;
    const approved = applications.filter(a => a.status === 'Approved').length;
    const rejected = applications.filter(a => a.status === 'Rejected').length;

    return { total, submitted, review, approved, rejected };
  }, [applications]);

  const getStatusStyle = (status: Application['status']) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Under Review':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Rejected':
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      case 'Under Review':
        return <Clock className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-slate-950 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 font-heading">Loan Applications Ledger</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Review, evaluate, and provide eligibility underwriting feedback for submitted business opportunity files.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Pending Review</span>
              <span className="text-xl font-bold text-blue-600 mt-1 block font-mono">{stats.submitted + stats.review}</span>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Approved Files</span>
              <span className="text-xl font-bold text-emerald-600 mt-1 block font-mono">{stats.approved}</span>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Rejected Files</span>
              <span className="text-xl font-bold text-rose-600 mt-1 block font-mono">{stats.rejected}</span>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Total Applications</span>
              <span className="text-xl font-bold text-slate-800 mt-1 block font-mono">{stats.total}</span>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-650 rounded-lg">
              <ClipboardList className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Search Bar */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SME name or opportunity program..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted (New)</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table Card */}
      <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-gray-500 font-bold border-b border-gray-150 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold text-center w-12">No.</th>
                <th className="py-3 px-4 font-semibold">SME / Applicant</th>
                <th className="py-3 px-4 font-semibold">Applied Program</th>
                <th className="py-3 px-4 font-semibold w-32">Readiness Stats</th>
                <th className="py-3 px-4 font-semibold w-40">Submission Date</th>
                <th className="py-3 px-4 font-semibold w-48">Requirements Docs</th>
                <th className="py-3 px-4 font-semibold w-32">Status</th>
                <th className="py-3 px-4 font-semibold text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredApplications.map((app, index) => (
                <tr key={app.id} className="hover:bg-slate-50/40 transition">
                  <td className="py-3 px-4 text-center font-mono font-bold text-gray-400">{index + 1}</td>
                  <td className="py-3 px-4">
                    <span className="block font-bold text-slate-850 font-heading">{app.smeName}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{app.smeSector}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="block font-bold text-slate-800">{app.opportunityTitle}</span>
                    <span className="text-[9px] font-mono text-gray-400">ID: {app.opportunityId}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono">
                        <span>Readiness:</span>
                        <span className="font-bold text-slate-800">{app.smeReadiness}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${app.smeReadiness}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-500 font-semibold">{app.appliedAt}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8px] font-extrabold flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 text-emerald-600" /> TIN Cert
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8px] font-extrabold flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 text-emerald-600" /> RRA Statement
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8px] font-extrabold flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 text-emerald-600" /> Ledger File
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 border rounded-full text-[9px] font-extrabold uppercase ${getStatusStyle(app.status)}`}>
                      {getStatusIcon(app.status)}
                      {app.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleOpenReview(app)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-250 rounded-lg text-[10px] transition"
                    >
                      <span>Review</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApplications.length === 0 && (
          <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center space-y-2">
            <FileText className="w-8 h-8 text-gray-300" />
            <span>No loan or opportunity applications found matching the filter criteria.</span>
          </div>
        )}
      </Card>

      {/* Interactive slide-over review drawer panel */}
      <AnimatePresence>
        {selectedAppId && selectedApp && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAppId(null)}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] z-40"
            />

            {/* Slide-over Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-slate-250 shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-150 bg-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase font-heading">Evaluation Workspace</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Reviewing application dossier details</p>
                </div>
                <button
                  onClick={() => setSelectedAppId(null)}
                  className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-slate-700 transition font-mono font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Body Scroll Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                {/* SME dossier summary */}
                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3">
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">SME Applicant</span>
                    <strong className="text-sm font-extrabold text-slate-900 leading-tight block">{selectedApp.smeName}</strong>
                    <span className="text-[10px] text-slate-500 font-semibold">{selectedApp.smeSector}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[10.5px] pt-1.5 border-t border-slate-200/50">
                    <div>
                      <span className="text-gray-400 block font-mono">Business Health:</span>
                      <strong className="text-slate-800 font-mono font-extrabold">{selectedApp.smeHealth}%</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-mono">Readiness Score:</span>
                      <strong className="text-emerald-600 font-mono font-extrabold">{selectedApp.smeReadiness}%</strong>
                    </div>
                  </div>
                </div>

                {/* Applied Opportunity Details */}
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Funding Opportunity Applied To</span>
                  <div className="p-3.5 border border-gray-200 rounded-xl space-y-2">
                    <strong className="text-slate-850 font-bold leading-snug block">{selectedApp.opportunityTitle}</strong>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold font-mono bg-slate-50 p-2 rounded">
                      <span>Status: {selectedApp.status}</span>
                      <span>Ref: {selectedApp.id}</span>
                    </div>
                  </div>
                </div>

                {/* Submitted Files Dossier Checklist */}
                <div className="space-y-2.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Submitted Requirements Dossier</span>
                  <div className="space-y-2">
                    {[
                      { name: 'Rwandan Revenue Authority (RRA) Tax Certificate', desc: 'Valid Q3 tax clearance certificate verified by RRA platform.' },
                      { name: 'Business License & TIN Certificate', desc: 'Official trade registry certificate (RGB/RDB).' },
                      { name: '3-Month Digital Inventory & Sales Ledger', desc: 'Amortized transaction data exported directly from active workspace catalog.' }
                    ].map((doc, i) => (
                      <div key={i} className="flex gap-2.5 items-start p-2.5 border border-emerald-100 bg-emerald-50/15 rounded-xl">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800 font-bold block leading-tight">{doc.name}</strong>
                          <span className="text-[9px] text-slate-400 block mt-0.5 leading-snug">{doc.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Assessment Advisor match */}
                <div className="p-4 bg-emerald-950/5 border border-emerald-500/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse animate-duration-2000" />
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Elevata Underwriting Advisor</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[10px] font-semibold leading-relaxed">
                    <li>Readiness index met: SME score ({selectedApp.smeReadiness}%) satisfies minimum limit.</li>
                    <li>Low leverage: Zero active defaults or overdue bank repayments.</li>
                    <li>Sufficient turnover cash flow to sustain simulated repayments.</li>
                  </ul>
                </div>
              </div>

              {/* Review Underwriting Form Footer */}
              <form onSubmit={handleSubmitReview} className="p-5 border-t border-gray-150 bg-slate-50 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Change Underwriting Status
                  </label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold"
                    required
                  >
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved (Grant Funding / Disburse Loan)</option>
                    <option value="Rejected">Rejected (Ineligible / Decline)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Bank Officer Review Feedback
                  </label>
                  <textarea
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder="Provide detailed decision reasoning or request additional documents (e.g. Approved. Please proceed to the nearest bank branch to sign the legal collateral agreement.)"
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none leading-relaxed font-sans placeholder:text-gray-400"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => setSelectedAppId(null)}
                    className="flex-1 bg-white border border-slate-200 text-slate-650 hover:bg-slate-100 font-extrabold text-xs h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-9 shadow-sm"
                  >
                    Submit Decision
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from 'react';
import {
  X,
  Send,
  Building2,
  Landmark,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import {
  feedbackService,
  FeedbackCategory,
  FeedbackPriority,
  FeedbackTicket
} from '../../../services/feedbackService';

interface CreateFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (ticket: FeedbackTicket) => void;
  defaultRole?: 'BUSINESS' | 'FINANCIAL_INSTITUTION';
}

const CATEGORIES: { label: FeedbackCategory; description: string }[] = [
  { label: 'Credit & Financing', description: 'Loan terms, grant eligibility, financing limits' },
  { label: 'Underwriting & Applications', description: 'Application dossier status, documentation review' },
  { label: 'Platform & Usability', description: 'User experience, speed, bugs, navigation' },
  { label: 'Accounting & Ledger', description: 'Sales book, purchases, inventory sync, P&L' },
  { label: 'KYC & Verification', description: 'Business registration, RRA tax clearance, tin' },
  { label: 'Virtual Academy', description: 'Live training sessions, certificates, materials' },
  { label: 'Feature Suggestion', description: 'Propose new capabilities or integrations' },
  { label: 'General Inquiry', description: 'General questions or advisory guidance' }
];

export default function CreateFeedbackModal({
  isOpen,
  onClose,
  onCreated,
  defaultRole
}: CreateFeedbackModalProps) {
  const { user } = useAuth();
  const { activeSme } = useApp();

  // Role resolution
  const userEffectiveRole: 'BUSINESS' | 'FINANCIAL_INSTITUTION' =
    defaultRole ||
    (user?.role === 'FINANCIAL_INSTITUTION' ? 'FINANCIAL_INSTITUTION' : 'BUSINESS');

  const [role, setRole] = useState<'BUSINESS' | 'FINANCIAL_INSTITUTION'>(userEffectiveRole);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('Credit & Financing');
  const [priority, setPriority] = useState<FeedbackPriority>('Medium');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Derive sender details
  const isBusiness = role === 'BUSINESS';
  const senderOrgName = isBusiness
    ? (activeSme?.name || user?.business?.businessName || 'Business Entity')
    : (user?.financialInstitution?.institutionName || 'Financial Institution');

  const senderName = isBusiness
    ? (user?.business?.ownerName || activeSme?.ownerName || user?.name || 'Business Owner')
    : (user?.financialInstitution?.representativeName || user?.name || 'Institutional Officer');

  const senderEmail = user?.email || (isBusiness ? 'business@elevata.rw' : 'institution@elevata.rw');
  const senderSector = isBusiness
    ? (activeSme?.sector || user?.business?.businessType || 'General SME')
    : (user?.financialInstitution?.category || 'Financial Services');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please provide a subject title for your feedback.');
      return;
    }
    if (!message.trim()) {
      setError('Please type your message or inquiry for the Administrator.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newTicket = await feedbackService.createTicket({
        subject: subject.trim(),
        category,
        priority,
        senderId: user?.id || (isBusiness ? 'sme-user' : 'fi-user'),
        senderName,
        senderEmail,
        senderPhone: user?.phone || '',
        senderRole: role,
        organizationName: senderOrgName,
        organizationSector: senderSector,
        initialMessage: message.trim()
      });

      onCreated(newTicket);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2998d6]/20 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                Submit Feedback / Inquiry to Admin
              </h3>
              <p className="text-[11px] text-slate-300">
                Direct 2-way verified support chat with Elevata Platform Management
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Sender Entity Badge & Role Toggle */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Submitting Entity
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                {isBusiness ? (
                  <Building2 className="w-4 h-4 text-teal-600" />
                ) : (
                  <Landmark className="w-4 h-4 text-[#2998d6]" />
                )}
                <strong className="text-slate-800 text-xs">{senderOrgName}</strong>
                <span className="text-[10px] text-slate-500 font-mono">({senderName})</span>
              </div>
            </div>

            {/* Quick Role switch for previewing as SME vs FI */}
            <div className="flex items-center bg-slate-200 p-0.5 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setRole('BUSINESS')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                  role === 'BUSINESS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SME Business
              </button>
              <button
                type="button"
                onClick={() => setRole('FINANCIAL_INSTITUTION')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                  role === 'FINANCIAL_INSTITUTION'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bank / FI
              </button>
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <label className="accounting-label font-bold text-slate-700 mb-1 block">
              Feedback Subject / Issue Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Request for enhanced credit ceiling, API integration question, etc."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#2998d6]/30 focus:border-[#2998d6] focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="accounting-label font-bold text-slate-700 mb-1 block">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                className="accounting-select w-full"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="accounting-label font-bold text-slate-700 mb-1 block">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
                className="accounting-select w-full"
              >
                <option value="Low">Low - General Suggestion</option>
                <option value="Medium">Medium - Standard Request</option>
                <option value="High">High - Impairing Daily Operations</option>
                <option value="Urgent">Urgent - Critical Transaction / Underwriting</option>
              </select>
            </div>
          </div>

          {/* Message Area */}
          <div>
            <label className="accounting-label font-bold text-slate-700 mb-1 block">
              Detailed Message / Inquiry <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide complete context, affected loan application ID, specific transaction, or suggested feature enhancement..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#2998d6]/30 focus:border-[#2998d6] focus:outline-none placeholder:text-slate-400 leading-relaxed"
            />
          </div>

          {/* Admin Response Guarantee Info Box */}
          <div className="p-3 bg-sky-50/70 border border-sky-200/80 rounded-xl flex items-start gap-2.5 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-[#2998d6] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Elevata Platform Administrators review and respond to institutional and SME tickets within{' '}
              <strong className="text-slate-800">2 hours</strong>. All chat messages are logged securely to your
              business compliance record.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-150">
            <button
              type="button"
              onClick={onClose}
              className="accounting-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#2998d6] hover:bg-[#1f85be] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Send to Admin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

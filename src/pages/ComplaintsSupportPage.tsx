import { type FormEvent, useState, type ReactNode } from 'react';
import {
  CheckCircle2,
  Mail,
  Phone,
  Send,
  ShieldCheck,
  AlertCircle,
  Clock,
  Copy,
  Check,
  X,
  UploadCloud,
  FileCheck2,
  RotateCcw,
  User,
  Tag,
  MessageSquare,
  Paperclip
} from 'lucide-react';
import { apiRequest } from '../lib/api';

const roles = [
  'SME / Business Owner',
  'Financial Institution Representative',
  'Payment Service Provider',
  'Individual Borrower / Applicant',
  'Other'
];

const categories = [
  'Technical Issue / Platform Access',
  'Loan Application or Lending Concern',
  'Payment or Loan Repayment Issue',
  'Banking or Digital Financial Service',
  'Insurance Service',
  'Data Privacy or Security Concern',
  'Staff Conduct or Communication',
  'Dispute with Financial Institution',
  'Other'
];

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  organizationName: '',
  role: '',
  category: '',
  relatedInstitution: '',
  transactionReference: '',
  subject: '',
  description: '',
  preferredResolution: '',
  confirmation: false,
  website: ''
};

export default function ComplaintsSupportPage() {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const update = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFile = (selected: File | undefined) => {
    if (!selected) return;
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(selected.type)) {
      setError('Please upload a PDF, JPG, or PNG file.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('Supporting evidence must be 10 MB or smaller.');
      return;
    }
    setError('');
    setFile(selected);
  };

  const handleCopyReference = () => {
    if (!reference) return;
    navigator.clipboard.writeText(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const resetForm = () => {
    setForm(initialForm);
    setFile(null);
    setError('');
    setReference(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.confirmation) {
      setError('Please confirm that the information provided is accurate.');
      return;
    }
    if (form.description.trim().length < 20) {
      setError('Please provide at least 20 characters describing what happened and what assistance you need.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries({ ...form, confirmation: String(form.confirmation) }).forEach(([key, value]) =>
        payload.append(key, value)
      );
      if (file) {
        payload.append('supportingEvidence', file);
      }
      const response = await apiRequest('/complaints', { method: 'POST', body: payload });
      setReference(response.data?.referenceNumber || `REF-${Date.now().toString().slice(-6)}`);
    } catch (submitError: any) {
      setError(submitError.message || 'We could not submit your complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (reference) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-200">
        <section className="rounded-2xl border border-emerald-200 border-t-4 border-t-emerald-500 bg-white p-6 sm:p-9 shadow-sm space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                Official Grievance Recorded
              </span>
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                Your complaint has been submitted successfully
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Thank you for contacting Elevata Support. Your issue has been assigned an audit reference and registered for review.
              </p>
            </div>
          </div>

          {/* Reference Card with One-click Copy */}
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10.5px] uppercase font-mono font-bold text-sky-800 block">
                Auditable Complaint Reference
              </span>
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 tracking-wide">
                {reference}
              </div>
              <span className="text-xs text-slate-500">
                Save this reference number for all future communications and case tracking.
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyReference}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-sky-300 text-slate-800 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 shrink-0 self-start sm:self-center cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-sky-600" />}
              <span>{copied ? 'Copied Reference' : 'Copy Reference'}</span>
            </button>
          </div>

          {/* Summary Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 font-mono text-[10.5px] uppercase block">Submitter</span>
              <span className="font-semibold text-slate-800">{form.fullName}</span>
              <span className="text-slate-500 block">{form.email}</span>
            </div>
            <div>
              <span className="text-slate-400 font-mono text-[10.5px] uppercase block">Complaint Category</span>
              <span className="font-semibold text-slate-800">{form.category || 'General Support Inquiry'}</span>
            </div>
            {form.relatedInstitution && (
              <div>
                <span className="text-slate-400 font-mono text-[10.5px] uppercase block">Related Financial Institution</span>
                <span className="font-semibold text-slate-800">{form.relatedInstitution}</span>
              </div>
            )}
            {form.transactionReference && (
              <div>
                <span className="text-slate-400 font-mono text-[10.5px] uppercase block">Related Transaction / Loan Ref</span>
                <span className="font-mono font-semibold text-slate-800">{form.transactionReference}</span>
              </div>
            )}
          </div>

          {/* SLA & Timeline */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>What Happens Next?</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="font-bold text-slate-900 mb-1">1. Triage &amp; Review</div>
                <p className="text-slate-500 text-[11.5px]">
                  Assigned to a Compliance Officer within 24 business hours.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="font-bold text-slate-900 mb-1">2. Lender Engagement</div>
                <p className="text-slate-500 text-[11.5px]">
                  Cross-referenced with the partner Financial Institution switch.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="font-bold text-slate-900 mb-1">3. Direct Resolution</div>
                <p className="text-slate-500 text-[11.5px]">
                  Written findings and corrective actions dispatched to your email.
                </p>
              </div>
            </div>
          </div>

          {/* Reset / Submit Another */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              For urgent matters, call <strong className="text-slate-800">+250 791 689 396</strong> or email <strong className="text-slate-800">info@voltaleltd.com</strong>.
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Submit Another Complaint</span>
            </button>
          </div>
        </section>
      </div>
    );
  }

  // MAIN FORM VIEW
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      {/* Page Header */}
      <section className="rounded-xl border border-[#cbd5e1] border-t-4 border-t-[#2998d6] bg-white p-5 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#e0f2fe] text-[#0369a1] font-mono border border-[#bae6fd]">
                Grievance &amp; Redressal Desk
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                BNR Regulated SLA Support
              </span>
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <ShieldCheck className="h-6 w-6 text-[#2998d6]" />
              Complaints &amp; Inquiries Support Gateway
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Report an issue, request transaction remediation, or submit an official complaint. All inquiries are logged with an auditable reference number and reviewed in accordance with Rwanda financial consumer protection guidelines.
            </p>
          </div>
        </div>
      </section>

      {/* Main Form */}
      <form onSubmit={submit} className="rounded-xl border border-[#cbd5e1] bg-white p-5 sm:p-8 shadow-xs space-y-8">
        {/* Error Notification */}
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-bold">Submission Error</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* SECTION 1: Submitter Information */}
        <div className="space-y-4">
          <div className="pb-2 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-[#2998d6]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
              1. Submitter Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <Field label="Full Name" required>
              <input
                required
                type="text"
                placeholder="e.g. Jean Damascene Hakizimana"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2998d6] transition shadow-2xs"
              />
            </Field>

            <Field label="Email Address" required>
              <input
                required
                type="email"
                placeholder="name@business.rw"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2998d6] transition shadow-2xs"
              />
            </Field>

            <Field label="Phone Number">
              <input
                type="tel"
                placeholder="+250 788 123 456"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2998d6] transition shadow-2xs"
              />
            </Field>

            <Field label="Organization / Business Name">
              <input
                type="text"
                placeholder="e.g. Inziza Logistics Ltd"
                value={form.organizationName}
                onChange={(e) => update('organizationName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2998d6] transition shadow-2xs"
              />
            </Field>
          </div>
        </div>

        {/* SECTION 2: Classification & Context */}
        <div className="space-y-4">
          <div className="pb-2 border-b border-slate-100 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#2998d6]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
              2. Classification &amp; Context
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <Field label="Your Role" required>
              <select
                required
                value={form.role}
                onChange={(e) => update('role', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-[#2998d6] transition shadow-2xs"
              >
                <option value="">Select your role</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </Field>

            <Field label="Complaint Category" required>
              <select
                required
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-[#2998d6] transition shadow-2xs"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </Field>

            <Field label="Related Institution or Service Provider">
              <input
                type="text"
                placeholder="e.g. Bank of Kigali, Equity Bank, MTN MoMo"
                value={form.relatedInstitution}
                onChange={(e) => update('relatedInstitution', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2998d6] transition shadow-2xs"
              />
            </Field>

            <Field label="Transaction Reference / Application ID">
              <input
                type="text"
                placeholder="e.g. REP-MOMO-2026-1029 or APP-8821"
                value={form.transactionReference}
                onChange={(e) => update('transactionReference', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2998d6] transition shadow-2xs"
              />
              <p className="mt-1 text-[11px] text-slate-400 font-normal">
                Optional: Provide this only when relevant to your payment or facility.
              </p>
            </Field>
          </div>
        </div>

        {/* SECTION 3: Incident Details & Narrative */}
        <div className="space-y-4">
          <div className="pb-2 border-b border-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#2998d6]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
              3. Incident Details &amp; Narrative
            </h2>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <Field label="Subject" required>
              <input
                required
                maxLength={180}
                placeholder="Brief summary of the issue (e.g. Disputed repayment deduction or portal timeout)"
                value={form.subject}
                onChange={(e) => update('subject', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2998d6] transition shadow-2xs"
              />
            </Field>

            <Field label="Description of Complaint" required>
              <textarea
                required
                rows={5}
                placeholder="Explain what happened, relevant dates, amounts involved, and what assistance you need (minimum 20 characters)..."
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                className="w-full p-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2998d6] transition shadow-2xs resize-y"
              />
              <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
                <span>Please be specific with dates and transaction amounts.</span>
                <span className="font-mono">{form.description.length} characters</span>
              </div>
            </Field>

            <Field label="Preferred Resolution">
              <textarea
                rows={3}
                placeholder="Describe what outcome, credit adjustment, fee waiver, or technical correction would resolve this concern."
                value={form.preferredResolution}
                onChange={(e) => update('preferredResolution', e.target.value)}
                className="w-full p-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2998d6] transition shadow-2xs resize-y"
              />
            </Field>
          </div>
        </div>

        {/* SECTION 4: Supporting Evidence & Verification */}
        <div className="space-y-4">
          <div className="pb-2 border-b border-slate-100 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-[#2998d6]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
              4. Supporting Evidence &amp; Verification
            </h2>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Supporting Evidence <span className="font-normal text-slate-400">(optional)</span>
            </label>

            {!file ? (
              <label className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-sm text-slate-600 hover:border-[#2998d6] hover:bg-sky-50/30 transition cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-sky-100 text-[#2998d6] flex items-center justify-center shrink-0">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-semibold text-slate-800 block">Click or drag files here to upload</span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Attach bank statement, screenshot, or receipt (PDF, JPG, PNG; max 10 MB)
                  </span>
                </div>
                <input
                  className="sr-only"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Document'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition rounded hover:bg-white cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Antispam honeypot */}
          <input
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="sr-only"
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
          />

          {/* Confirmation Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition">
              <input
                required
                type="checkbox"
                checked={form.confirmation}
                onChange={(e) => update('confirmation', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-[#2998d6] cursor-pointer shrink-0"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                I confirm that the information provided in this grievance report is true, accurate, and complete to the best of my knowledge, and understand that it will be processed by Elevata compliance officers to investigate and resolve this matter.
              </span>
            </label>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2.5 p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-lg text-xs text-emerald-800">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Confidentiality Assurance:</strong> Complaint information is strictly handled in accordance with Rwanda data protection laws and shared only with designated compliance officers.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-400 order-2 sm:order-1">
            * Indicates required fields. An audit reference will be generated immediately.
          </span>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-7 py-3 bg-[#2998d6] hover:bg-[#1f85be] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 order-1 sm:order-2"
          >
            <Send className="h-4 w-4" />
            <span>{submitting ? 'Submitting Grievance...' : 'Submit Grievance'}</span>
          </button>
        </div>
      </form>

      {/* Assistance & Contacts Footer */}
      <section className="rounded-xl border border-[#cbd5e1] bg-white p-5 sm:p-6 shadow-xs">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-800 font-mono mb-3">
          Direct Customer Support Contacts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="mailto:info@voltaleltd.com"
            className="p-3 bg-slate-50 hover:bg-sky-50/50 border border-slate-200 rounded-lg transition group flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#2998d6] flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Email Inquiries</span>
              <span className="text-xs font-bold text-slate-800 group-hover:text-[#2998d6] truncate block">
                info@voltaleltd.com
              </span>
            </div>
          </a>

          <a
            href="tel:+250791689396"
            className="p-3 bg-slate-50 hover:bg-sky-50/50 border border-slate-200 rounded-lg transition group flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#2998d6] flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Support Hotline</span>
              <span className="text-xs font-bold text-slate-800 group-hover:text-[#2998d6] truncate block">
                +250 791 689 396
              </span>
            </div>
          </a>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#2998d6] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Support Hours</span>
              <span className="text-xs font-bold text-slate-800 truncate block">
                Mon - Fri: 8:00 AM – 5:00 PM CAT
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  required,
  children
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-xs font-bold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div>{children}</div>
    </div>
  );
}
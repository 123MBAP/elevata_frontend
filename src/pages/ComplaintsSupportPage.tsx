import { type FormEvent, type ReactNode, useState } from 'react';
import { CheckCircle2, FileText, Mail, Paperclip, Phone, Send, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../lib/api';

const roles = ['SME / Business Owner', 'Financial Institution Representative', 'Payment Service Provider', 'Other'];
const categories = ['Technical Issue / Platform Access', 'Loan Application or Lending Concern', 'Payment or Loan Repayment Issue', 'Banking or Digital Financial Service', 'Insurance Service', 'Data Privacy or Security Concern', 'Staff Conduct or Communication', 'Other'];

const initialForm = { fullName: '', email: '', phone: '', organizationName: '', role: '', category: '', relatedInstitution: '', transactionReference: '', subject: '', description: '', preferredResolution: '', confirmation: false, website: '' };

export default function ComplaintsSupportPage() {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const update = (field: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }));

  const handleFile = (selected: File | undefined) => {
    if (!selected) return;
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(selected.type)) { setError('Please upload a PDF, JPG, or PNG file.'); return; }
    if (selected.size > 10 * 1024 * 1024) { setError('Supporting evidence must be 10 MB or smaller.'); return; }
    setError(''); setFile(selected);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (!form.confirmation) { setError('Please confirm that the information provided is accurate.'); return; }
    if (form.description.trim().length < 20) { setError('Please describe what happened, when it happened, and what assistance you need.'); return; }
    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries({ ...form, confirmation: String(form.confirmation) }).forEach(([key, value]) => payload.append(key, value));
      if (file) payload.append('supportingEvidence', file);
      const response = await apiRequest('/complaints', { method: 'POST', body: payload });
      setReference(response.data.referenceNumber);
    } catch (submitError: any) {
      setError(submitError.message || 'We could not submit your complaint. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (reference) return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="rounded-[4px] border border-emerald-200 border-t-4 border-t-emerald-500 bg-white p-6 shadow-sm sm:p-8">
        <CheckCircle2 className="mb-4 h-10 w-10 text-emerald-600" />
        <h1 className="font-heading text-2xl font-normal text-slate-900">Your complaint has been received.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Thank you for contacting Elevata Support. Your complaint has been recorded for review.</p>
        <p className="mt-5 border-l-4 border-[#2998d6] bg-sky-50 p-4 text-sm text-slate-700"><strong>Complaint Reference:</strong> {reference}</p>
        <p className="mt-4 text-sm leading-6 text-slate-600">Our team will review your concern and contact you regarding the next steps. Please keep your reference number for future communication.</p>
        <p className="mt-5 text-sm text-slate-600">For urgent assistance, contact <a className="font-semibold text-[#1677b8] hover:underline" href="mailto:info@voltaleltd.com">info@voltaleltd.com</a> or <a className="font-semibold text-[#1677b8] hover:underline" href="tel:+250791689396">+250 791 689 396</a>.</p>
      </section>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="rounded-[4px] border border-[#cbd5e1] border-t-4 border-t-[#2998d6] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-[#2998d6]" /><div><h1 className="font-heading text-2xl font-normal text-slate-900">Complaints &amp; Support</h1><p className="mt-1 text-sm text-slate-500">Report an issue or submit a complaint. Our team will review your concern and guide you through the next steps.</p></div></div>
      </section>
      <form onSubmit={submit} className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm sm:p-7">
        {error && <div className="mb-5 rounded-[4px] border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Full Name" required><input required value={form.fullName} onChange={(e) => update('fullName', e.target.value)} /></Field>
          <Field label="Email Address" required><input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} /></Field>
          <Field label="Phone Number"><input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></Field>
          <Field label="Organization / Business Name"><input value={form.organizationName} onChange={(e) => update('organizationName', e.target.value)} /></Field>
          <Field label="Your Role" required><select required value={form.role} onChange={(e) => update('role', e.target.value)}><option value="">Select your role</option>{roles.map((role) => <option key={role}>{role}</option>)}</select></Field>
          <Field label="Complaint Category" required><select required value={form.category} onChange={(e) => update('category', e.target.value)}><option value="">Select a category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></Field>
          <Field label="Related Institution or Service Provider"><input value={form.relatedInstitution} onChange={(e) => update('relatedInstitution', e.target.value)} /></Field>
          <Field label="Transaction Reference / Application ID"><input value={form.transactionReference} onChange={(e) => update('transactionReference', e.target.value)} /><small>Provide this only when it is relevant to your complaint.</small></Field>
          <Field label="Subject" required><input required maxLength={180} value={form.subject} onChange={(e) => update('subject', e.target.value)} /></Field>
          <div className="md:col-span-2"><Field label="Description of Complaint" required><textarea required rows={6} placeholder="Explain what happened, when it happened, and what assistance you need." value={form.description} onChange={(e) => update('description', e.target.value)} /></Field></div>
          <div className="md:col-span-2"><Field label="Preferred Resolution"><textarea rows={4} placeholder="Tell us what outcome or assistance would help resolve this concern." value={form.preferredResolution} onChange={(e) => update('preferredResolution', e.target.value)} /></Field></div>
          <div className="md:col-span-2"><label className="mb-1.5 block text-sm font-semibold text-slate-700">Supporting Evidence <span className="font-normal text-slate-400">(optional)</span></label><label className="flex cursor-pointer items-center gap-3 rounded-[4px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 hover:border-[#2998d6]"><Paperclip className="h-4 w-4 text-[#2998d6]" /><span>{file ? file.name : 'Upload a relevant screenshot or document (PDF, JPG, PNG; max 10 MB)'}</span><input className="sr-only" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFile(e.target.files?.[0])} /></label></div>
        </div>
        <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0" value={form.website} onChange={(e) => update('website', e.target.value)} />
        <label className="mt-6 flex items-start gap-3 text-sm text-slate-600"><input required type="checkbox" checked={form.confirmation} onChange={(e) => update('confirmation', e.target.checked)} className="mt-1 h-4 w-4 accent-[#2998d6]" /><span>I confirm that the information provided is accurate and that I understand it will be used to review and respond to my complaint.</span></label>
        <p className="mt-4 flex gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />Complaint information is handled confidentially and accessed only by authorized personnel as necessary.</p>
        <button disabled={submitting} className="mt-6 inline-flex items-center gap-2 rounded-[4px] bg-[#2998d6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f85be] disabled:cursor-not-allowed disabled:opacity-60"><Send className="h-4 w-4" />{submitting ? 'Submitting complaint...' : 'Submit complaint'}</button>
      </form>
      <section className="rounded-[4px] border border-[#cbd5e1] bg-white p-5 shadow-sm"><h2 className="font-heading text-lg text-slate-900">Need assistance?</h2><div className="mt-3 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:gap-6"><a className="inline-flex items-center gap-2 text-[#1677b8] hover:underline" href="mailto:info@voltaleltd.com"><Mail className="h-4 w-4" />info@voltaleltd.com</a><a className="inline-flex items-center gap-2 text-[#1677b8] hover:underline" href="tel:+250791689396"><Phone className="h-4 w-4" />+250 791 689 396</a></div></section>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) { return <label className="block text-sm font-semibold text-slate-700">{label} {required && <span className="text-rose-500">*</span>}<div className="mt-1.5">{children}</div></label>; }
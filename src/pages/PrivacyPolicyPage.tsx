import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  Eye,
  FileCheck,
  Server,
  Database,
  Printer,
  Scale,
  Users
} from 'lucide-react';
import ElevataLogo from '../assets/images/elevata_logo.png';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans selection:bg-[#0284c7] selection:text-white">
      {/* Navigation Topbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] p-1.5 shadow-md">
                <img src={ElevataLogo} alt="Elevata" className="h-full w-full object-contain" />
              </div>
              <span className="font-extrabold text-lg tracking-wider text-white">ELEVATA</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Policy
            </button>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-[#0369a1] text-white transition-all shadow-md shadow-sky-900/30"
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>

      {/* Main Document Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        {/* Document Header Hero */}
        <div className="border-b border-slate-800 pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Rwandan Data Protection Law N° 058/2021 Compliant
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Elevata Privacy &amp; Data Protection Policy
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
            Detailed disclosure of how Elevata collects, stores, processes, and safeguards personal, business, and financial records.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
            <span><strong>Last Updated:</strong> October 1, 2026</span>
            <span>•</span>
            <span><strong>Data Controller:</strong> Voltale Ltd (Kigali, Rwanda)</span>
            <span>•</span>
            <span><strong>Supervisory Authority:</strong> National Cyber Security Authority (NCSA Rwanda)</span>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-sm leading-relaxed text-slate-300">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-extrabold flex items-center justify-center">1</span>
              Commitment to Data Privacy
            </h2>
            <p>
              At <strong>Elevata</strong> (operated by <strong>Voltale Ltd</strong>), we hold the confidentiality and security of our users&rsquo; financial and personal data as our highest institutional priority. This policy outlines our principles regarding the collection, handling, and protection of your data in strict compliance with <strong>Law N° 058/2021 of 13/10/2021 relating to the protection of personal data and privacy in Rwanda</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-extrabold flex items-center justify-center">2</span>
              Categories of Information We Collect
            </h2>
            <p>
              We collect only data necessary to deliver our accounting intelligence, credit scoring, and financing matching services:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <Users className="w-4 h-4 text-emerald-400" />
                  1. Identification &amp; Contact Data
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Full name, national ID or passport details, email address, verified phone numbers, and physical business location coordinates (latitude and longitude).
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <Database className="w-4 h-4 text-emerald-400" />
                  2. Business &amp; Entity Records
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  RDB enterprise registration name, Tax Identification Number (TIN), business category, operating sector, province, district, sector, and village.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  3. Financial Ledger &amp; Accounting Records
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Daily sales logs, purchasing journals, stock intake values, operating expense records, and system-calculated financial ratios (DSCR, operating margins).
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  4. Credit Dossiers &amp; Uploaded Documents
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Official bank statements, tax clearance certificates (RRA), financial statements, and supporting compliance documentation uploaded by the borrower.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-extrabold flex items-center justify-center">3</span>
              Purpose of Data Processing
            </h2>
            <p>Elevata processes your information solely for the following lawful purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li><strong>Ledger &amp; Financial Analytics:</strong> Generating real-time profit &amp; loss statements, balance sheets, and cash flow projections for your enterprise.</li>
              <li><strong>Credit Readiness Scoring:</strong> Evaluating eligibility criteria against published loan and grant opportunities from regulated financial institutions.</li>
              <li><strong>Financing Facilitation:</strong> Packaging verified applicant dossiers for institutional credit committee reviews when you submit an application.</li>
              <li><strong>Regulatory &amp; AML Compliance:</strong> Fulfilling anti-money laundering (AML), combating the financing of terrorism (CFT), and Know-Your-Customer (KYC) requirements.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-extrabold flex items-center justify-center">4</span>
              Strict Confidentiality &amp; Controlled Sharing
            </h2>
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 text-xs text-emerald-200/90 leading-relaxed space-y-2">
              <p>
                <strong>We NEVER sell your data:</strong> Elevata does not sell, rent, monetize, or disclose your financial records to advertisers or third-party marketing brokers under any circumstances.
              </p>
              <p>
                <strong>Institutional Sharing by Explicit Consent Only:</strong> Your financial ledgers and credit dossiers are shared with licensed Credit Institutions (Commercial Banks, MFIs, SACCOs) <strong>strictly when you initiate an application</strong> for a specific credit product.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-extrabold flex items-center justify-center">5</span>
              Data Security &amp; Encryption Standards
            </h2>
            <p>
              We implement state-of-the-art technical and organizational safeguards to ensure data integrity:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Encryption in Transit:</strong> All HTTP traffic is protected by Transport Layer Security (TLS 1.3) with cryptographic cipher suites.</li>
              <li><strong>Encryption at Rest:</strong> Database storage and sensitive document archives are encrypted using military-grade Advanced Encryption Standard (AES-256).</li>
              <li><strong>Access Control:</strong> Strict role-based access control (RBAC), multi-factor authentication, and tamper-evident audit logs monitoring all administrative access.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-extrabold flex items-center justify-center">6</span>
              Your Rights Under Rwandan Law
            </h2>
            <p>
              In accordance with Rwandan Data Protection legislation, you have the following enforceable rights:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li><strong>Right to Access:</strong> You can inspect and export your complete transaction history, personal data, and credit submissions at any time.</li>
              <li><strong>Right to Rectification:</strong> You can update inaccurate business information or request correction of misstated records.</li>
              <li><strong>Right to Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> Subject to mandatory statutory financial retention periods prescribed by tax and banking regulations, you may request the deletion of your account.</li>
              <li><strong>Right to Data Portability:</strong> You may download your accounting reports (P&amp;L, balance sheet) in standard CSV/PDF formats to share with your chosen advisors.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-extrabold flex items-center justify-center">7</span>
              Data Protection Officer (DPO) Contact
            </h2>
            <p>
              To exercise your rights, report privacy concerns, or submit a data inquiry:
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-1">
              <p className="font-bold text-white">Office of the Data Protection Officer</p>
              <p className="text-slate-400">Voltale Ltd / Elevata Platform</p>
              <p className="text-slate-400">KN 78 St, Norrsken House, Kigali, Rwanda</p>
              <p className="text-slate-400">Email: <a href="mailto:dpo@voltaleltd.com" className="text-emerald-400 hover:underline">dpo@voltaleltd.com</a> | <a href="mailto:privacy@voltaleltd.com" className="text-emerald-400 hover:underline">privacy@voltaleltd.com</a></p>
            </div>
          </section>
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link to="/terms" className="text-sky-400 hover:underline">Read Terms &amp; Conditions</Link>
            <span>•</span>
            <Link to="/login" className="text-slate-300 hover:text-white">Back to Sign In</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold transition-all shadow-md"
            >
              Accept &amp; Continue to Register
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Shield,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Building2,
  Landmark,
  Scale,
  ExternalLink,
  Printer
} from 'lucide-react';
import ElevataLogo from '../assets/images/elevata_logo.png';

export default function TermsPage() {
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
              Print Terms
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Scale className="w-3.5 h-3.5" />
            Legally Binding Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Elevata Platform Terms & Conditions
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
            Governing the use of Elevata Financial Intelligence, SME Credit Readiness, and Institutional Opportunity Matching Services.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
            <span><strong>Effective Date:</strong> October 1, 2026</span>
            <span>•</span>
            <span><strong>Operator:</strong> Voltale Ltd / Finovatra (Kigali, Rwanda)</span>
            <span>•</span>
            <span><strong>Applicable Law:</strong> Republic of Rwanda</span>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-sm leading-relaxed text-slate-300">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-extrabold flex items-center justify-center">1</span>
              Acceptance of Terms & Eligibility
            </h2>
            <p>
              By accessing, browsing, registering for, or using the <strong>Elevata Platform</strong> (accessible via our web portal, mobile web, or APIs), you (&ldquo;User&rdquo;, &ldquo;SME&rdquo;, &ldquo;Financial Institution&rdquo;, or &ldquo;Borrower&rdquo;) agree to be legally bound by these Terms &amp; Conditions and our Privacy Policy.
            </p>
            <p>
              To be eligible to register an account on Elevata, you must:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Be a registered business entity or sole proprietor authorized to conduct commercial operations under Rwandan law (RDB registration), or a licensed Financial Institution regulated by the National Bank of Rwanda (BNR).</li>
              <li>Be at least 18 years of age and possess full legal capacity to enter into binding commercial contracts.</li>
              <li>Provide accurate, genuine, and verifiable identification and business records during registration and Know-Your-Customer (KYC) onboarding.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-extrabold flex items-center justify-center">2</span>
              Scope of Elevata Services
            </h2>
            <p>
              Elevata provides a comprehensive suite of digital financial infrastructure and credit readiness tools, including:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  SME Financial Books & Ledger
                </div>
                <p className="text-xs text-slate-400">
                  Digital sales logging, inventory management, purchase journals, operating expense tracking, and automated balance sheet generation.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <Landmark className="w-4 h-4 text-sky-400" />
                  Credit Opportunity Hub & Matching
                </div>
                <p className="text-xs text-slate-400">
                  Connecting verified businesses with commercial banks, microfinance institutions, and development funds offering working capital and asset financing.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-extrabold flex items-center justify-center">3</span>
              Role of Elevata as Technology & Credit Readiness Facilitator
            </h2>
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200/90 leading-relaxed">
              <strong>Important Disclaimer:</strong> Elevata is a technology and business intelligence platform operated by Voltale Ltd. <strong>Elevata is NOT a bank, primary credit provider, or financial institution.</strong> Elevata does not accept retail deposits, does not issue loans from its own balance sheet, and does not guarantee loan approval. Final underwriting, risk rating, interest rates, collateral requirements, and disbursement decisions remain under the independent discretion of the participating licensed Financial Institutions.
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-extrabold flex items-center justify-center">4</span>
              User Accounts, Password Security & Geolocation
            </h2>
            <p>
              You are solely responsible for maintaining the confidentiality of your account credentials, login passwords, and two-factor authentication tokens. You agree to notify Elevata immediately of any unauthorized access or security breach.
            </p>
            <p>
              To ensure credit transparency and comply with collateral verification standards, Elevata requires business physical location coordinates (latitude and longitude). You warrant that the registered address and geolocation accurately reflect your actual commercial premises.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-extrabold flex items-center justify-center">5</span>
              Truth in Financial Records & Integrity
            </h2>
            <p>
              When entering sales, inventory transactions, and financial statements into Elevata:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>You warrant that all transaction records, cash flows, and uploaded compliance dossiers (tax clearance, bank statements) represent true and unmanipulated commercial activities.</li>
              <li>Submitting fraudulent financial records, falsified invoices, or fictitious turnover figures constitutes a material breach of these Terms and will result in immediate termination, blacklisting from participating institutions, and reporting to relevant Rwandan authorities (RDB, RIB).</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-extrabold flex items-center justify-center">6</span>
              Consent to Share Dossier with Credit Institutions
            </h2>
            <p>
              When an SME voluntarily applies for a credit opportunity through the <strong>Opportunity Hub</strong>:
            </p>
            <p>
              You explicitly grant Elevata authorization to compile and transmit your <strong>Verified SME Readiness Dossier</strong> (comprising business profile, historical turnover, inventory valuation, cashflow ratios, and contact details) to the underwriter of the designated financial institution for loan evaluation purposes.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-extrabold flex items-center justify-center">7</span>
              Intellectual Property
            </h2>
            <p>
              All software, source code, user interfaces, algorithms, scoring engines, trademarks, and documentation comprising the Elevata Platform are the exclusive intellectual property of <strong>Voltale Ltd</strong> and its licensors, protected under Rwandan and international copyright and IP treaties.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-extrabold flex items-center justify-center">8</span>
              Governing Law & Dispute Resolution
            </h2>
            <p>
              These Terms and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the <strong>Laws of the Republic of Rwanda</strong>. Any dispute that cannot be resolved amicably through good-faith negotiation within thirty (30) days shall be submitted to the exclusive jurisdiction of the competent commercial courts of Kigali, Rwanda.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-extrabold flex items-center justify-center">9</span>
              Contact & Official Notices
            </h2>
            <p>
              For legal inquiries, terms clarification, or formal communication, please contact:
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-1">
              <p className="font-bold text-white">Elevata Legal & Compliance Department</p>
              <p className="text-slate-400">Voltale Ltd / Finovatra</p>
              <p className="text-slate-400">KN 78 St, Norrsken House, Kigali, Rwanda</p>
              <p className="text-slate-400">Email: <a href="mailto:legal@voltaleltd.com" className="text-sky-400 hover:underline">legal@voltaleltd.com</a> | <a href="mailto:info@voltaleltd.com" className="text-sky-400 hover:underline">info@voltaleltd.com</a></p>
            </div>
          </section>
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link to="/privacy" className="text-sky-400 hover:underline">Read Privacy Policy</Link>
            <span>•</span>
            <Link to="/login" className="text-slate-300 hover:text-white">Back to Sign In</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold transition-all shadow-md"
            >
              Accept & Continue to Register
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

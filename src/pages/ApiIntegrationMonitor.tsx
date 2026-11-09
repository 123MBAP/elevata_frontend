import React, { useState, useEffect, useMemo } from 'react';
import { financialDemoApi, ApiLogEntry } from '../services/financialDemoApi';
import { Card, CardContent } from '../assets/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Layers,
  Copy,
  Check,
  Landmark,
  Smartphone,
  QrCode,
  Wallet,
  Send,
  Zap,
  Info,
  Sliders,
  X
} from 'lucide-react';

interface CategoryIntegrationSpec {
  id: string;
  name: string;
  feasibility: 'Yes' | 'Yes, with limitations' | 'Yes, but more complex';
  description: string;
  badgeVariant: 'emerald' | 'amber' | 'purple';
  icon: React.ReactNode;
  integrationScope: string;
  partnerProviders: string[];
  technicalControls: string[];
  regulatoryFramework: string;
  sampleEndpoints: {
    method: 'GET' | 'POST';
    path: string;
    label: string;
  }[];
}

const INTEGRATION_CATEGORIES: CategoryIntegrationSpec[] = [
  {
    id: 'digital-savings',
    name: 'Digital savings accounts',
    feasibility: 'Yes',
    description:
      'Display savings products, check requirements, and refer SMEs to the provider. Account opening through Elevata would require appropriate API support.',
    badgeVariant: 'emerald',
    icon: <Landmark className="w-5 h-5 text-emerald-600" />,
    integrationScope: 'Direct Product Comparison & Lead Handover + Digital Account Opening API',
    partnerProviders: ['Bank of Kigali (BK Plc)', 'Urwego Bank', 'Equity Bank Rwanda'],
    technicalControls: [
      'KYC Tier Verification & TIN validation via RDB registry',
      'Automated Lead Dispatch & Consent Token Generation',
      'High-Yield Reserve Account Sweep Rule Configuration'
    ],
    regulatoryFramework: 'BNR Directive on Digital Financial Inclusion & Commercial Deposit Rules',
    sampleEndpoints: [
      { method: 'GET', path: '/api/v1/savings/products', label: 'Query verified savings offerings & tiered yields' },
      { method: 'POST', path: '/api/v1/savings/accounts/onboard', label: 'Initiate digital business reserve account handshake' }
    ]
  },
  {
    id: 'mobile-banking',
    name: 'Mobile banking',
    feasibility: 'Yes, with limitations',
    description:
      "Connect to authorized banking services for account information or transaction data. This requires the bank's APIs, customer consent, and appropriate security controls.",
    badgeVariant: 'amber',
    icon: <Smartphone className="w-5 h-5 text-sky-600" />,
    integrationScope: 'Open Banking Read-Only Telemetry & Customer Consent Management',
    partnerProviders: ['Bank of Kigali', 'I&M Bank Rwanda', 'Equity Bank Rwanda'],
    technicalControls: [
      'BNR OAuth 2.0 Customer Consent & Biometric/USSD Authorization',
      'Mutual TLS 1.3 (mTLS) Transport Security Perimeter',
      'Scoped Read-Only Access (Accounts, Balances, 90-Day Statements)'
    ],
    regulatoryFramework: 'BNR Guidelines on Open Banking Standards & Data Protection Law 058/2021',
    sampleEndpoints: [
      { method: 'POST', path: '/api/v1/open-banking/consent', label: 'Customer biometric / USSD consent authorization' },
      { method: 'GET', path: '/api/v1/open-banking/accounts', label: 'Fetch authorized balances & account status' }
    ]
  },
  {
    id: 'merchant-payment',
    name: 'Merchant payment solutions',
    feasibility: 'Yes',
    description:
      'Help SMEs discover and register for merchant payment services, such as POS terminals, QR payments, or merchant payment acceptance.',
    badgeVariant: 'emerald',
    icon: <QrCode className="w-5 h-5 text-emerald-600" />,
    integrationScope: 'RwandaPay Dynamic Interoperable QR & Android Smart POS Provisioning',
    partnerProviders: ['MTN MoMoPay', 'Airtel Money', 'Equity EazzyPay', 'BK QuickPay'],
    technicalControls: [
      'EMVCo Rwanda Interoperable QR Specification (RwandaPay)',
      'Real-Time Inbound Payment Webhooks with HMAC-SHA256 Signatures',
      'Zero-Chargeback Instant Settlement Switch'
    ],
    regulatoryFramework: 'BNR Regulation No 25/2019 on Payment Service Providers (PSP)',
    sampleEndpoints: [
      { method: 'POST', path: '/api/v1/merchants/qr/generate', label: 'Generate dynamic interoperable EMVCo QR code' },
      { method: 'POST', path: '/api/v1/merchants/terminals/request', label: 'Provision Android Smart POS / softPOS terminal' }
    ]
  },
  {
    id: 'digital-wallets',
    name: 'Digital wallets',
    feasibility: 'Yes, with limitations',
    description:
      'Connect SMEs to wallet providers for registration, wallet information, or supported transactions where APIs and permissions exist.',
    badgeVariant: 'amber',
    icon: <Wallet className="w-5 h-5 text-amber-600" />,
    integrationScope: 'Digital Wallet Onboarding Assistance, Balance & KYC Status Inquiries',
    partnerProviders: ['MTN Mobile Money Rwanda Ltd', 'Airtel Money Rwanda Ltd'],
    technicalControls: [
      'Subscriber MSISDN Match against National Identification (NIDA)',
      'Commercial Entity KYC Tier 3 Verification',
      'Restricted USSD Push Prompt Frequency Rate Limits'
    ],
    regulatoryFramework: 'BNR Regulation on Electronic Money Issuers & Mobile Financial Services',
    sampleEndpoints: [
      { method: 'POST', path: '/api/v1/wallets/kyc-query', label: 'Validate commercial entity wallet tier & limits' },
      { method: 'POST', path: '/api/v1/wallets/collections', label: 'Disburse USSD prompt request-to-pay transaction' }
    ]
  },
  {
    id: 'digital-insurance',
    name: 'Digital insurance (bancassurance)',
    feasibility: 'Yes',
    description:
      'Display insurance products, explain eligibility, and refer SMEs to insurers or participating banks. Digital policy issuance or claims integration requires provider support.',
    badgeVariant: 'emerald',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
    integrationScope: 'Inventory Valuation Stock Cover, Premium Quoting & Underwriting Referral',
    partnerProviders: ['Radiant Insurance Company', 'Sanlam Rwanda', 'BK General Insurance'],
    technicalControls: [
      'Elevata Verified Inventory & Stock Valuation Verification',
      'Automated Digital Policy Binder Webhook Dispatch',
      'BNR Bancassurance Circular Compliance & Direct Premium Settlement'
    ],
    regulatoryFramework: 'BNR Insurance Law & Bancassurance Intermediary Guidelines',
    sampleEndpoints: [
      { method: 'POST', path: '/api/v1/insurance/quotes', label: 'Generate real-time stock & fire premium quotation' },
      { method: 'POST', path: '/api/v1/insurance/policy/refer', label: 'Submit verified SME underwriting application' }
    ]
  },
  {
    id: 'digital-transfers',
    name: 'Digital money transfers',
    feasibility: 'Yes, but more complex',
    description:
      'Enable access to authorized transfer services through an institution or licensed payment provider. Initiating transfers and moving funds require specific integrations and regulatory approval.',
    badgeVariant: 'purple',
    icon: <Send className="w-5 h-5 text-purple-600" />,
    integrationScope: 'National Payment Switch (RIPPS) Gateway & Regulated Funds Movement',
    partnerProviders: ['BNR National Payment System (NPS)', 'Licensed Commercial Banks', 'Licensed Remittance PSPs'],
    technicalControls: [
      'Pre-Flight AML, PEP & Sanctions Screening Engine',
      'Dual-Factor Cryptographic Signatures (PKI / HSM)',
      'BNR Sandbox Clearing Clearance, Settlement Caps & Escrow Controls'
    ],
    regulatoryFramework: 'BNR National Payment System (NPS) Act & Anti-Money Laundering Law',
    sampleEndpoints: [
      { method: 'POST', path: '/api/v1/ripps/instant-interbank-transfer', label: 'Dispatch real-time interbank gross settlement' },
      { method: 'GET', path: '/api/v1/transfers/status/{ref}', label: 'Query transaction settlement audit proof' }
    ]
  }
];

export default function ApiIntegrationMonitor() {
  const [activeTab, setActiveTab] = useState<'categories' | 'telemetry'>('categories');
  const [feasibilityFilter, setFeasibilityFilter] = useState<string>('ALL');
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Category Testing State
  const [testingCategoryId, setTestingCategoryId] = useState<string | null>(null);
  const [selectedSpecModal, setSelectedSpecModal] = useState<CategoryIntegrationSpec | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'danger' | 'warning' | 'info'; text: string } | null>(null);

  const showToast = (type: 'success' | 'danger' | 'warning' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const fetchLogs = async () => {
    try {
      const data = await financialDemoApi.getApiLogs();
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to load API telemetry logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const providersList = useMemo(() => {
    const list = new Set(logs.map(l => l.provider));
    return ['ALL', ...Array.from(list)];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesProvider = selectedProvider === 'ALL' || log.provider === selectedProvider;
      const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;
      const matchesSearch =
        log.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.operation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.relatedSme.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.relatedReference.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesProvider && matchesStatus && matchesSearch;
    });
  }, [logs, selectedProvider, selectedStatus, searchQuery]);

  const filteredCategories = useMemo(() => {
    if (feasibilityFilter === 'ALL') return INTEGRATION_CATEGORIES;
    return INTEGRATION_CATEGORIES.filter(c => c.feasibility === feasibilityFilter);
  }, [feasibilityFilter]);

  const handleCopyJson = (log: ApiLogEntry) => {
    const jsonStr = JSON.stringify({
      requestId: log.requestId,
      provider: log.provider,
      endpoint: log.endpoint,
      requestPayload: log.requestPayload,
      responsePayload: log.responsePayload
    }, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTestCategoryHandshake = async (spec: CategoryIntegrationSpec) => {
    setTestingCategoryId(spec.id);
    try {
      const result = await financialDemoApi.simulateCategoryHandshake({
        category: spec.name,
        smeId: 'sme-1',
        simulateOutcome: 'success'
      });
      await fetchLogs();
      showToast('success', `Simulated ${spec.name} API handshake executed successfully! Logged to Telemetry.`);
    } catch (err: any) {
      showToast('danger', err.message || 'Simulated call failed.');
    } finally {
      setTestingCategoryId(null);
    }
  };

  const handleInspectCategoryInTelemetry = (spec: CategoryIntegrationSpec) => {
    setSelectedProvider('ALL');
    setSelectedStatus('ALL');
    setSearchQuery(spec.name);
    setActiveTab('telemetry');
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

      {/* TOP REGULATORY BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 text-white rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 font-mono">
                BNR REGULATORY SANDBOX EVALUATION
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Financial Services API Integration
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              Financial Services API Integration &amp; Telemetry Monitor
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl">
              Demonstrates Elevata's architectural readiness to connect Rwandan SMEs with regulated commercial lenders, payment service providers, and digital financial products in accordance with BNR Sandbox standards.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>{autoRefresh ? 'Live Polling Active' : 'Polling Paused'}</span>
            </button>
            <button
              onClick={fetchLogs}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition cursor-pointer"
              title="Refresh logs manually"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TOP TABS (CATEGORIES MATRIX VS LIVE TELEMETRY LOGS) */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Services Categories Integration Matrix</span>
          <span className="ml-1 px-1.5 py-0.2 bg-sky-100 text-sky-700 rounded-full text-[10px] font-mono">
            6 Categories
          </span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'telemetry'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-600" />
          <span>Live API Telemetry &amp; Payload Inspector</span>
          {logs.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-mono">
              {logs.length} Calls
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: SERVICES CATEGORIES INTEGRATION MATRIX */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-sky-600" />
                <span>Financial Services API Integration Categories</span>
              </h2>
              <p className="text-xs text-slate-500">
                Detailed regulatory feasibility classifications, architectural scopes, and interactive sandbox endpoints for the National Bank of Rwanda (BNR) evaluation.
              </p>
            </div>

            {/* Feasibility filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setFeasibilityFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
                  feasibilityFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                All (6)
              </button>
              <button
                type="button"
                onClick={() => setFeasibilityFilter('Yes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
                  feasibilityFilter === 'Yes'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                Directly Supported (Yes)
              </button>
              <button
                type="button"
                onClick={() => setFeasibilityFilter('Yes, with limitations')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
                  feasibilityFilter === 'Yes, with limitations'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
                }`}
              >
                With Limitations (2)
              </button>
              <button
                type="button"
                onClick={() => setFeasibilityFilter('Yes, but more complex')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
                  feasibilityFilter === 'Yes, but more complex'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white text-purple-800 border border-purple-200 hover:bg-purple-50'
                }`}
              >
                Complex / Regulated (1)
              </button>
            </div>
          </div>

          {/* THE 6 SERVICES CATEGORIES CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCategories.map((spec) => {
              const isTesting = testingCategoryId === spec.id;

              return (
                <div
                  key={spec.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  {/* Category Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center shrink-0">
                          {spec.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {spec.name}
                          </h3>
                          <span className="text-[10.5px] font-mono text-slate-400">
                            Category Ref: {spec.id}
                          </span>
                        </div>
                      </div>

                      {/* Feasibility Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold font-mono border whitespace-nowrap ${
                          spec.badgeVariant === 'emerald'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : spec.badgeVariant === 'amber'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}
                      >
                        {spec.feasibility}
                      </span>
                    </div>

                    {/* Scope & Description */}
                    <div className="mt-3.5 space-y-2">
                      <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50/70 p-3 rounded-xl border border-slate-150">
                        {spec.description}
                      </p>

                      <div className="text-[11px] text-slate-600">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                          Integration Mechanism:
                        </span>
                        <strong className="text-slate-800 font-semibold">{spec.integrationScope}</strong>
                      </div>
                    </div>

                    {/* Partner Institutions */}
                    <div className="mt-3 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                        Sample Connected Institutions:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {spec.partnerProviders.map((prov, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono"
                          >
                            {prov}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Technical Controls & API Specs */}
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                        Supported API Endpoints:
                      </span>
                      <div className="space-y-1 text-[11px] font-mono">
                        {spec.sampleEndpoints.map((ep, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-150">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              ep.method === 'POST' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {ep.method}
                            </span>
                            <span className="truncate text-[10px] text-slate-800">{ep.path}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSpecModal(spec)}
                      className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      <span>Regulatory Specs</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Simulate API Handshake Button */}
                      <button
                        type="button"
                        onClick={() => handleTestCategoryHandshake(spec)}
                        disabled={isTesting}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                        title="Simulate live API request and record in Telemetry"
                      >
                        {isTesting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                        )}
                        <span>{isTesting ? 'Handshaking...' : 'Test API'}</span>
                      </button>

                      {/* Inspect in Telemetry */}
                      <button
                        type="button"
                        onClick={() => handleInspectCategoryInTelemetry(spec)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                        title="Inspect telemetry logs for this category"
                      >
                        <Terminal className="w-4 h-4 text-emerald-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE API TELEMETRY & TRANSACTION LOGS */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          {/* KPI METRICS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
                  Total Recorded Calls
                </span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {logs.length} Requests
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Disbursements, repayments &amp; onboarding</span>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <span className="text-[10px] font-mono text-emerald-600 uppercase font-bold block">
                  Successful Transactions
                </span>
                <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
                  {logs.filter(l => l.status === 'Success').length} (200 OK)
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Cleared without exceptions</span>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <span className="text-[10px] font-mono text-amber-600 uppercase font-bold block">
                  Pending Authorization
                </span>
                <div className="text-xl font-bold font-mono text-amber-600 mt-1">
                  {logs.filter(l => l.status === 'Pending').length} (202 Queued)
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Awaiting customer USSD or switch</span>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
              <CardContent className="p-4">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
                  Average Latency
                </span>
                <div className="text-xl font-bold font-mono text-sky-700 mt-1">
                  {Math.round(logs.reduce((acc, l) => acc + (l.durationMs || 350), 0) / Math.max(1, logs.length))} ms
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Simulated network round-trip</span>
              </CardContent>
            </Card>
          </div>

          {/* FILTER & SEARCH STRIP */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
            <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by Request ID, endpoint, operation or reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  {providersList.map((p) => (
                    <option key={p} value={p}>
                      {p === 'ALL' ? 'All Providers' : p}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Success">Success (200)</option>
                  <option value="Pending">Pending (202)</option>
                  <option value="Failed">Failed (4xx/5xx)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* TELEMETRY LOGS LIST */}
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="p-10 text-center text-slate-400 bg-white border border-slate-200 rounded-xl text-xs">
                No API telemetry logs match the selected filter. Trigger a repayment, disbursement or category API test above to generate live logs.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden transition"
                  >
                    {/* Collapsed summary row */}
                    <div
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-slate-400">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          log.method === 'POST' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {log.method}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-xs text-slate-900 font-mono">{log.requestId}</strong>
                            <span className="text-[10px] font-mono text-slate-400">({log.operation})</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-md">
                            {log.endpoint}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <div className="text-right text-[11px] font-mono">
                          <div className="text-slate-600 font-semibold">{log.provider}</div>
                          <div className="text-slate-400 text-[10px]">{log.durationMs} ms | {new Date(log.timestamp).toLocaleTimeString()}</div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${
                          log.status === 'Success'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : log.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {log.statusCode} {log.status}
                        </span>
                      </div>
                    </div>

                    {/* Expanded JSON Inspector */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-200 bg-slate-950 text-slate-200 p-4 font-mono text-xs space-y-4"
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                              <span>Target: <strong className="text-slate-200">{log.relatedSme}</strong></span>
                              <span>Ref: <strong className="text-slate-200">{log.relatedReference}</strong></span>
                            </div>

                            <button
                              onClick={() => handleCopyJson(log)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition cursor-pointer"
                            >
                              {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedId === log.id ? 'Copied' : 'Copy JSON'}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Request Payload */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-sky-400 uppercase tracking-wider block font-bold">
                                Sanitized Outgoing Request Body
                              </span>
                              <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto text-[11px] leading-relaxed text-slate-300">
                                {JSON.stringify(log.requestPayload, null, 2)}
                              </pre>
                            </div>

                            {/* Response Payload */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold">
                                Simulated Provider Response Body ({log.statusCode})
                              </span>
                              <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto text-[11px] leading-relaxed text-slate-300">
                                {JSON.stringify(log.responsePayload, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* REGULATORY TECHNICAL SPECS MODAL */}
      <AnimatePresence>
        {selectedSpecModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-6"
            >
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    {selectedSpecModal.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedSpecModal.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Feasibility on Elevata: <strong className="text-slate-800">{selectedSpecModal.feasibility}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSpecModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
                    Regulatory Feasibility &amp; Scope
                  </span>
                  <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                    {selectedSpecModal.description}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
                    Mandatory Technical &amp; Security Controls
                  </span>
                  <ul className="space-y-1.5">
                    {selectedSpecModal.technicalControls.map((ctrl, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{ctrl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
                    Applicable National Regulatory Framework
                  </span>
                  <div className="p-2.5 bg-sky-50 text-sky-900 border border-sky-200 rounded-lg font-mono text-[11px] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0" />
                    <span>{selectedSpecModal.regulatoryFramework}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedSpecModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const spec = selectedSpecModal;
                      setSelectedSpecModal(null);
                      handleTestCategoryHandshake(spec);
                    }}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Run Test API Handshake</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

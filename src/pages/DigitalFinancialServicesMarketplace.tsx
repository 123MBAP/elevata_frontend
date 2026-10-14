import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  financialDemoApi,
  DigitalFinancialService,
  DemoSme
} from '../services/financialDemoApi';
import { formatRWF } from '../lib/mockData';
import { Card, CardContent } from '../assets/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Landmark,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Terminal,
  ChevronRight,
  ArrowRight,
  Search,
  Filter,
  Check,
  X,
  FileText,
  Building2,
  Lock,
  Layers,
  Send,
  HelpCircle,
  DollarSign
} from 'lucide-react';

export default function DigitalFinancialServicesMarketplace() {
  const [services, setServices] = useState<DigitalFinancialService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<DigitalFinancialService | null>(null);

  // Connection flow state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectConsentGranted, setConnectConsentGranted] = useState(false);
  const [connectStep, setConnectStep] = useState<'details' | 'consent' | 'telemetry' | 'result'>('details');
  const [simulateOutcome, setSimulateOutcome] = useState<'success' | 'failure'>('success');
  const [connectionResult, setConnectionResult] = useState<any | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [telemetryStage, setTelemetryStage] = useState<string>('');

  // Category-specific input payload states
  const [momoPhone, setMomoPhone] = useState('+250 788 412 890');
  const [savingsOpeningDeposit, setSavingsOpeningDeposit] = useState('100000');
  const [merchantTerminalType, setMerchantTerminalType] = useState('INTEROPERABLE_RW_QR');
  const [insuranceDeclaredStock, setInsuranceDeclaredStock] = useState('15000000');

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'danger' | 'warning' | 'info'; text: string } | null>(null);

  const showToast = (type: 'success' | 'danger' | 'warning' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await financialDemoApi.getServices();
      setServices(data || []);
    } catch (err: any) {
      console.error('Failed to load services:', err);
      showToast('danger', 'Unable to load digital financial services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const categories = [
    { id: 'All', label: 'All Services', icon: <Layers className="w-4 h-4" /> },
    { id: 'Mobile Money & Digital Payments', label: 'Mobile Money & Payments', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'Business Savings Accounts', label: 'Business Savings', icon: <Landmark className="w-4 h-4" /> },
    { id: 'Merchant Payment Solutions', label: 'Merchant POS & QR', icon: <QrCode className="w-4 h-4" /> },
    { id: 'Business Insurance', label: 'Business Insurance', icon: <ShieldAlert className="w-4 h-4" /> }
  ];

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
      const matchesSearch =
        service.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  const handleOpenConnect = (service: DigitalFinancialService) => {
    setSelectedService(service);
    setConnectConsentGranted(false);
    setConnectStep('details');
    setConnectionResult(null);
    setIsConnectModalOpen(true);
  };

  const executeConnection = async () => {
    if (!connectConsentGranted) {
      showToast('warning', 'Please review and accept the data sharing consent terms.');
      return;
    }

    if (!selectedService) return;

    setIsConnecting(true);
    setConnectStep('telemetry');

    // Track the multi-stage provider handshake
    setTelemetryStage('Validating regulatory consent and SME digital identity...');
    await new Promise(r => setTimeout(r, 600));

    setTelemetryStage('Dispatching encrypted request payload to Provider Mock Gateway...');
    await new Promise(r => setTimeout(r, 600));

    setTelemetryStage('Authenticating with the financial services interoperability switch...');
    await new Promise(r => setTimeout(r, 600));

    try {
      const payload: any = {};
      if (selectedService.category === 'Mobile Money & Digital Payments') {
        payload.phoneNumber = momoPhone;
      } else if (selectedService.category === 'Business Savings Accounts') {
        payload.initialDeposit = Number(savingsOpeningDeposit);
      } else if (selectedService.category === 'Merchant Payment Solutions') {
        payload.terminalType = merchantTerminalType;
      } else if (selectedService.category === 'Business Insurance') {
        payload.stockValue = Number(insuranceDeclaredStock);
      }

      const res = await financialDemoApi.connectService({
        serviceId: selectedService.id,
        smeId: 'sme-1',
        consentGranted: true,
        payload,
        simulateOutcome
      });

      setConnectionResult(res);
      setConnectStep('result');
      await loadServices();

      if (res.success) {
        showToast('success', `${selectedService.serviceName} connected successfully!`);
      } else {
        showToast('danger', 'Connection was declined by the service provider.');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'Service connection failed.');
      setConnectStep('details');
    } finally {
      setIsConnecting(false);
    }
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

      {/* Marketplace header */}
      <div className="bg-white rounded-[4px] p-5 shadow-sm border border-[#cbd5e1] border-t-4 border-t-[#2998d6] relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-wider bg-[#e0f2fe] text-[#0369a1] font-mono border border-[#bae6fd]">
                FINANCIAL SERVICES
              </span>
              <span className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Open finance services
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-[#1e293b] font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2998d6]" />
              Digital Financial Services Marketplace
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl">
              Discover and connect digital banking, merchant payment channels, high-yield reserve accounts, and micro-insurance tailored for Rwandan enterprises.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/banker/api-monitor"
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>API Integration Matrix</span>
            </Link>
            <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#cbd5e1] text-right">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Available services</span>
              <span className="text-base font-bold font-mono text-slate-900">{services.length} Solutions</span>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search digital services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* SERVICES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredServices.map((service) => {
          const isConnected = service.connectionStatus === 'Connected';
          return (
            <Card
              key={service.id}
              className={`bg-white border rounded-2xl shadow-xs hover:shadow-md transition duration-200 overflow-hidden flex flex-col justify-between ${
                isConnected ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200'
              }`}
            >
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10.5px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">
                      {service.providerName}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {service.serviceName}
                    </h3>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border shrink-0 ${
                    isConnected
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {isConnected ? 'Connected' : 'Available'}
                  </span>
                </div>

                {/* Category Badge & Pricing */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md text-[10px] font-semibold font-mono border border-sky-200">
                    {service.category}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-50 text-slate-700 rounded-md text-[10px] font-mono border border-slate-200">
                    Fees: {service.pricing}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {service.description}
                </p>

                {/* Features Pill List */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Core Capabilities
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
                    {service.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-[11px]">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Eligibility & Requirements */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-[11px] space-y-1">
                  <div>
                    <span className="text-slate-400">Eligibility:</span>{' '}
                    <strong className="text-slate-700">{service.eligibilityCriteria}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Requirements:</span>{' '}
                    <span className="text-slate-700">{service.requirements.join(', ')}</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2 border-t border-slate-150 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 font-mono">
                    API Endpoint: {service.endpointUrl.replace('https://api.', '')}
                  </div>

                  <button
                    onClick={() => handleOpenConnect(service)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                      isConnected
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-sky-600 hover:bg-sky-700 text-white'
                    }`}
                  >
                    {isConnected ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Manage / Re-Test</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Connect Service</span>
                      </>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CONNECT & INTEGRATION MODAL */}
      <AnimatePresence>
        {isConnectModalOpen && selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-6"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Open Finance API Integration Handshake
                  </h3>
                  <p className="text-xs text-slate-500">
                    Connecting to <strong>{selectedService.providerName}</strong>
                  </p>
                </div>

                <button
                  onClick={() => setIsConnectModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step 1: Details & Category Inputs */}
              {connectStep === 'details' && (
                <div className="p-5 space-y-4">
                  <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-sky-800 uppercase font-mono block">
                      Target Solution
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{selectedService.serviceName}</h4>
                    <p className="text-xs text-slate-600">{selectedService.description}</p>
                  </div>

                  {/* Category-Specific Form Fields */}
                  {selectedService.category === 'Mobile Money & Digital Payments' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Merchant Disbursement &amp; Collection MSISDN
                      </label>
                      <input
                        type="text"
                        value={momoPhone}
                        onChange={(e) => setMomoPhone(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
                        placeholder="+250 788 123 456"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        This MSISDN will receive instant USSD prompts and API notification callbacks.
                      </span>
                    </div>
                  )}

                  {selectedService.category === 'Business Savings Accounts' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Initial Opening Deposit (RWF)
                      </label>
                      <input
                        type="number"
                        value={savingsOpeningDeposit}
                        onChange={(e) => setSavingsOpeningDeposit(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                        placeholder="100000"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Funds will be allocated into the high-yield interest reserve upon API creation.
                      </span>
                    </div>
                  )}

                  {selectedService.category === 'Merchant Payment Solutions' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Terminal &amp; Payment Standard
                      </label>
                      <select
                        value={merchantTerminalType}
                        onChange={(e) => setMerchantTerminalType(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      >
                        <option value="INTEROPERABLE_RW_QR">Interoperable Rwanda National QR (EMVCo)</option>
                        <option value="CARD_CHECKOUT_GATEWAY">Digital E-Commerce Card Checkout</option>
                      </select>
                    </div>
                  )}

                  {selectedService.category === 'Business Insurance' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Declared Inventory Stock Value to Insure (RWF)
                      </label>
                      <input
                        type="number"
                        value={insuranceDeclaredStock}
                        onChange={(e) => setInsuranceDeclaredStock(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                        placeholder="15000000"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Directly linked to your active Elevata inventory balance.
                      </span>
                    </div>
                  )}

                  {/* DATA SHARING DISCLOSURE */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Regulatory Data Sharing Disclosure</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      To complete this integration, Elevata will transmit the following verified SME records to <strong>{selectedService.providerName}</strong>:
                    </p>
                    <ul className="list-disc pl-4 text-[10.5px] text-slate-600 space-y-0.5">
                      <li>Official Business Name &amp; RRA Tax Identification Number (TIN)</li>
                      <li>Registered Owner National Identification and Phone</li>
                      <li>Verified 6-Month Elevata Turnover &amp; Cash Flow Health Score</li>
                    </ul>
                  </div>

                  {/* Explicit Consent Checkbox */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition">
                    <input
                      type="checkbox"
                      checked={connectConsentGranted}
                      onChange={(e) => setConnectConsentGranted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer"
                    />
                    <div className="text-xs text-slate-700">
                      <strong className="text-slate-900 block">I grant explicit data consent</strong>
                      I authorize Elevata to share the specified business data with {selectedService.providerName} under the applicable financial services framework.
                    </div>
                  </label>

                  {/* Sandbox Outcome Selector */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-[10px] font-bold text-amber-900 uppercase font-mono block mb-1">
                      Provider response
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSimulateOutcome('success')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition border ${
                          simulateOutcome === 'success'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-emerald-800 border-emerald-200'
                        }`}
                      >
                        Success Handshake
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimulateOutcome('failure')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition border ${
                          simulateOutcome === 'failure'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-rose-800 border-rose-200'
                        }`}
                      >
                        Declined / Error
                      </button>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsConnectModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={executeConnection}
                      disabled={!connectConsentGranted || isConnecting}
                      className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 ${
                        connectConsentGranted
                          ? 'bg-sky-600 hover:bg-sky-700 cursor-pointer'
                          : 'bg-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span>Authorize &amp; Connect</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Telemetry Animation */}
              {connectStep === 'telemetry' && (
                <div className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Processing API Handshake...
                    </h4>
                    <p className="text-xs font-mono text-sky-700 mt-1">
                      {telemetryStage}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Result Display */}
              {connectStep === 'result' && connectionResult && (
                <div className="p-5 space-y-4 text-center">
                  <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
                    connectionResult.success
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-rose-100 text-rose-600'
                  }`}>
                    {connectionResult.success ? <CheckCircle2 className="w-8 h-8 stroke-[2.5]" /> : <AlertCircle className="w-8 h-8 stroke-[2.5]" />}
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {connectionResult.success
                        ? 'Service Connected & Provisioned'
                        : 'Integration Handshake Rejected'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {connectionResult.integrationDetails?.message || 'Transaction recorded in API monitor.'}
                    </p>
                  </div>

                  {/* Result Details */}
                  {connectionResult.success && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs font-mono space-y-1.5">
                      {connectionResult.integrationDetails?.accountNumber && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Reserve Account:</span>
                          <strong className="text-slate-900">{connectionResult.integrationDetails.accountNumber}</strong>
                        </div>
                      )}
                      {connectionResult.integrationDetails?.iban && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">IBAN:</span>
                          <span className="text-slate-900 text-[10.5px]">{connectionResult.integrationDetails.iban}</span>
                        </div>
                      )}
                      {connectionResult.integrationDetails?.merchantCode && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Merchant Code:</span>
                          <strong className="text-slate-900">{connectionResult.integrationDetails.merchantCode}</strong>
                        </div>
                      )}
                      {connectionResult.integrationDetails?.policyNumber && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Policy Number:</span>
                          <strong className="text-slate-900">{connectionResult.integrationDetails.policyNumber}</strong>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-400">Status:</span>
                        <span className="text-emerald-600 font-bold">Active / Bound</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsConnectModalOpen(false)}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition hover:bg-slate-800"
                  >
                    Done &amp; Return to Marketplace
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

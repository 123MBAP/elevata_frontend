import React, { useState, useEffect } from 'react';
import {
  financialDemoApi,
  DigitalFinancialService
} from '../services/financialDemoApi';
import { Card, CardContent } from '../assets/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Layers,
  Sparkles,
  Smartphone,
  Landmark,
  QrCode,
  ShieldAlert,
  Send,
  Building2
} from 'lucide-react';

export default function BankerServicesPublisher() {
  const [services, setServices] = useState<DigitalFinancialService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Form states
  const [serviceName, setServiceName] = useState('');
  const [providerName, setProviderName] = useState('Bank of Kigali (BK Plc)');
  const [category, setCategory] = useState<DigitalFinancialService['category']>('Mobile Money & Digital Payments');
  const [description, setDescription] = useState('');
  const [eligibilityCriteria, setEligibilityCriteria] = useState('');
  const [requirements, setRequirements] = useState('');
  const [pricing, setPricing] = useState('');
  const [features, setFeatures] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const showToast = (type: 'success' | 'danger', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await financialDemoApi.getServices();
      setServices(data || []);
    } catch (err: any) {
      showToast('danger', 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleOpenPublish = (service?: DigitalFinancialService) => {
    if (service) {
      setEditingServiceId(service.id);
      setServiceName(service.serviceName);
      setProviderName(service.providerName);
      setCategory(service.category);
      setDescription(service.description);
      setEligibilityCriteria(service.eligibilityCriteria);
      setRequirements(service.requirements.join(', '));
      setPricing(service.pricing);
      setFeatures(service.features.join(', '));
      setEndpointUrl(service.endpointUrl);
    } else {
      setEditingServiceId(null);
      setServiceName('');
      setProviderName('Bank of Kigali (BK Plc)');
      setCategory('Mobile Money & Digital Payments');
      setDescription('');
      setEligibilityCriteria('Registered SME with verified Elevata ledger history');
      setRequirements('RDB Certificate, TIN, Elevata Profile');
      setPricing('Standard regulated tier');
      setFeatures('Instant settlement, Real-time Webhooks');
      setEndpointUrl('https://api.bk.rw/v1/services');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<DigitalFinancialService> = {
        serviceName,
        providerName,
        category,
        description,
        eligibilityCriteria,
        requirements: requirements.split(',').map(r => r.trim()).filter(Boolean),
        pricing,
        features: features.split(',').map(f => f.trim()).filter(Boolean),
        endpointUrl
      };

      if (editingServiceId) {
        await financialDemoApi.updateService(editingServiceId, payload);
        showToast('success', 'Service updated successfully.');
      } else {
        await financialDemoApi.publishService(payload);
        showToast('success', 'New service published to SME Marketplace.');
      }

      setIsModalOpen(false);
      await loadServices();
    } catch (err: any) {
      showToast('danger', err.message || 'Action failed.');
    }
  };

  const handleToggleStatus = async (service: DigitalFinancialService) => {
    const newStatus = service.availabilityStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await financialDemoApi.updateService(service.id, { availabilityStatus: newStatus as any });
      showToast('success', `${service.serviceName} marked as ${newStatus}.`);
      await loadServices();
    } catch (err: any) {
      showToast('danger', 'Failed to toggle service status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in duration-200 border ${
          toastMessage.type === 'success' ? 'bg-emerald-950 text-emerald-100 border-emerald-700' : 'bg-rose-950 text-rose-100 border-rose-700'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Publisher header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 border border-[#cbd5e1] border-t-4 border-t-[#2998d6] rounded-[4px] shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-normal text-[#1e293b] font-heading flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#2998d6]" />
            Digital Financial Services Publisher &amp; Catalog
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Create, configure, and publish institutional financial APIs, merchant solutions, and reserve products to the SME Marketplace.
          </p>
        </div>

        <button
          onClick={() => handleOpenPublish()}
          className="px-4 py-2 bg-[#2998d6] hover:bg-[#1f85be] text-white rounded-[4px] text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Service</span>
        </button>
      </div>

      {/* Services List Table */}
      <Card className="bg-white border border-[#cbd5e1] shadow-sm rounded-[4px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                <th className="p-3">Service Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Pricing Tier</th>
                <th className="p-3 text-center">Catalog Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((svc) => (
                <tr key={svc.id} className="hover:bg-slate-50 transition">
                  <td className="p-3">
                    <strong className="text-slate-900 block">{svc.serviceName}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">{svc.endpointUrl}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded text-[10px] font-mono border border-sky-200">
                      {svc.category}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 font-semibold">{svc.providerName}</td>
                  <td className="p-3 font-mono text-slate-600">{svc.pricing}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleToggleStatus(svc)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono transition border cursor-pointer ${
                        svc.availabilityStatus === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {svc.availabilityStatus}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleOpenPublish(svc)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Publish/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-6"
            >
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingServiceId ? 'Edit Financial Service Product' : 'Publish Digital Financial Service'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Make your institutional digital capability accessible to SMEs.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Service Title</label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold"
                    placeholder="e.g. BK High-Yield SME Escrow Account"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Provider Name</label>
                    <input
                      type="text"
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="Mobile Money & Digital Payments">Mobile Money &amp; Digital Payments</option>
                      <option value="Business Savings Accounts">Business Savings Accounts</option>
                      <option value="Merchant Payment Solutions">Merchant Payment Solutions</option>
                      <option value="Business Insurance">Business Insurance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Product Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                    placeholder="Explain value proposition and SME benefits..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Fees / Pricing</label>
                    <input
                      type="text"
                      value={pricing}
                      onChange={(e) => setPricing(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
                      placeholder="e.g. 0.5% capped or Free"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Service endpoint</label>
                    <input
                      type="text"
                      value={endpointUrl}
                      onChange={(e) => setEndpointUrl(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
                      placeholder="https://api.provider.rw/..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Eligibility Criteria</label>
                  <input
                    type="text"
                    value={eligibilityCriteria}
                    onChange={(e) => setEligibilityCriteria(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                    placeholder="e.g. Minimum 6 months trading history on Elevata"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    {editingServiceId ? 'Update Service' : 'Publish Service'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Cpu,
  Coins,
  Users,
  Target,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  ShieldCheck,
  TrendingUp,
  Edit3,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { Card } from '../assets/components/ui/card';

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  value: number;
  condition: string;
}

export default function BusinessProfilePage() {
  const { user } = useAuth();
  const isFI = user?.role === 'FINANCIAL_INSTITUTION' || user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'general' | 'equipment' | 'balance' | 'workforce' | 'strategy'>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // SME Profile State with smart default values
  const [smeForm, setSmeForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    businessType: '',
    province: '',
    district: '',
    sector: '',
    cell: '',
    village: '',
    knownPlace: '',
    latitude: '',
    longitude: '',
    equipments: [] as EquipmentItem[],
    currentAssets: 0,
    fixedAssets: 0,
    shortTermLiabilities: 0,
    longTermLiabilities: 0,
    monthlyTurnover: 0,
    grossMarginPercentage: 0,
    fullTimeEmployees: 0,
    partTimeEmployees: 0,
    monthlyPayroll: 0,
    keyRoles: '',
    businessStage: '',
    targetMarket: '',
    primaryProducts: '',
    operationalChallenges: '',
    strategicGoals: '',
    digitizationLevel: ''
  });

  // Financial Institution Form State
  const [fiForm, setFiForm] = useState({
    institutionName: '',
    representativeName: '',
    email: '',
    phone: '',
    category: '',
    operatingScope: '',
    licenseNumber: '',
    website: ''
  });

  // Backup state for cancelation
  const [initialSmeData, setInitialSmeData] = useState<typeof smeForm | null>(null);
  const [initialFiData, setInitialFiData] = useState<typeof fiForm | null>(null);

  // Dynamic business categories from DB
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Fetch registered user, business details, and categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await apiRequest('/categories');
        if (res?.success && Array.isArray(res.data?.categories)) {
          const names = res.data.categories.map((category: { businessType?: string; cat_name?: string }) => category.businessType || category.cat_name).filter(Boolean) as string[];
          setAvailableCategories(Array.from(new Set(names)));
        }
      } catch (error) {
        console.warn('Unable to load business categories:', error);
      }
    };
    loadCategories();

    const loadProfileData = async () => {
      try {
        if (isFI) {
          const res = await apiRequest('/users/profile');
          if (res.success && res.data && res.data.user) {
            const u = res.data.user;
            const fi = u.financialInstitution || {};
            const loadedFi = {
              institutionName: fi.institutionName || '',
              representativeName: fi.representativeName || '',
              email: u.email || '',
              phone: u.phone || '',
              category: fi.category || '',
              operatingScope: fi.operatingScope || '',
              licenseNumber: fi.licenseNumber || '',
              website: fi.website || ''
            };
            setFiForm(loadedFi);
            setInitialFiData(loadedFi);
          }
        } else {
          // SME user
          const res = await apiRequest('/business/me');
          if (res.success && res.data && res.data.business) {
            const b = res.data.business;
            const op = b.operational || {};

            const loadedSme = {
              businessName: b.businessName || '',
              ownerName: b.ownerName || '',
              email: user?.email || '',
              phone: user?.phone || '',
              businessType: b.businessType || '',
              province: b.province || '',
              district: b.district || '',
              sector: b.sector || '',
              cell: b.cell || '',
              village: b.village || '',
              knownPlace: b.knownPlace || '',
              latitude: b.latitude ? String(b.latitude) : '',
              longitude: b.longitude ? String(b.longitude) : '',
              equipments: Array.isArray(op.equipments) ? op.equipments : [],
              currentAssets: op.currentAssets ?? 0,
              fixedAssets: op.fixedAssets ?? 0,
              shortTermLiabilities: op.shortTermLiabilities ?? 0,
              longTermLiabilities: op.longTermLiabilities ?? 0,
              monthlyTurnover: op.monthlyTurnover ?? 0,
              grossMarginPercentage: op.grossMarginPercentage ?? 0,
              fullTimeEmployees: op.fullTimeEmployees ?? 0,
              partTimeEmployees: op.partTimeEmployees ?? 0,
              monthlyPayroll: op.monthlyPayroll ?? 0,
              keyRoles: op.roles ? (Array.isArray(op.roles) ? op.roles.join(', ') : op.roles) : '',
              businessStage: op.businessStage || '',
              targetMarket: op.targetMarket || '',
              primaryProducts: op.primaryProducts || '',
              operationalChallenges: op.operationalChallenges || '',
              strategicGoals: op.strategicGoals || '',
              digitizationLevel: op.digitizationLevel || ''
            };

            setSmeForm(loadedSme);
            setInitialSmeData(loadedSme);
          }
        }
      } catch (error: unknown) {
        console.error('Failed to load profile details:', error);
      }
    };

    if (user) {
      loadProfileData();
    }
  }, [user, isFI]);

  // Derived financial calculations for SME
  const totalEquipmentsValue = smeForm.equipments.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const totalAssets = Number(smeForm.currentAssets || 0) + Number(smeForm.fixedAssets || 0);
  const totalLiabilities = Number(smeForm.shortTermLiabilities || 0) + Number(smeForm.longTermLiabilities || 0);
  const ownerCapital = totalAssets - totalLiabilities;
  const totalEmployees = Number(smeForm.fullTimeEmployees || 0) + Number(smeForm.partTimeEmployees || 0);

  // Equipment handlers
  const handleAddEquipment = () => {
    const newItem: EquipmentItem = {
      id: `eq_${Date.now()}`,
      name: 'New Equipment',
      category: 'Technology',
      value: 500000,
      condition: 'Operational'
    };
    setSmeForm((prev) => ({
      ...prev,
      equipments: [...prev.equipments, newItem]
    }));
  };

  const handleRemoveEquipment = (id: string) => {
    setSmeForm((prev) => ({
      ...prev,
      equipments: prev.equipments.filter((item) => item.id !== id)
    }));
  };

  const handleEquipmentChange = (id: string, field: keyof EquipmentItem, value: EquipmentItem[keyof EquipmentItem]) => {
    setSmeForm((prev) => ({
      ...prev,
      equipments: prev.equipments.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleCancelEdit = () => {
    if (isFI && initialFiData) {
      setFiForm(initialFiData);
    } else if (initialSmeData) {
      setSmeForm(initialSmeData);
    }
    setIsEditing(false);
    setErrorMessage(null);
  };

  // Submit profile updates
  const handleSaveProfile = async () => {
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (isFI) {
        await apiRequest('/financial-institution/profile', {
          method: 'PUT',
          body: JSON.stringify(fiForm)
        });
        setInitialFiData({ ...fiForm });
        setSuccessMessage('Institution profile updated successfully.');
      } else {
        await apiRequest('/business/profile', {
          method: 'PUT',
          body: JSON.stringify({
            businessName: smeForm.businessName,
            ownerName: smeForm.ownerName,
            businessType: smeForm.businessType,
            phone: smeForm.phone,
            province: smeForm.province,
            district: smeForm.district,
            sector: smeForm.sector,
            cell: smeForm.cell,
            village: smeForm.village,
            knownPlace: smeForm.knownPlace,
            latitude: Number(smeForm.latitude) || 0,
            longitude: Number(smeForm.longitude) || 0,
            operational: {
              equipments: smeForm.equipments,
              totalEquipmentValue: totalEquipmentsValue,
              currentAssets: smeForm.currentAssets,
              fixedAssets: smeForm.fixedAssets,
              totalAssets,
              shortTermLiabilities: smeForm.shortTermLiabilities,
              longTermLiabilities: smeForm.longTermLiabilities,
              totalLiabilities,
              ownerCapital,
              monthlyTurnover: smeForm.monthlyTurnover,
              annualRevenue: Number(smeForm.monthlyTurnover) * 12,
              grossMarginPercentage: smeForm.grossMarginPercentage,
              fullTimeEmployees: smeForm.fullTimeEmployees,
              partTimeEmployees: smeForm.partTimeEmployees,
              totalEmployees,
              monthlyPayroll: smeForm.monthlyPayroll,
              roles: smeForm.keyRoles,
              businessStage: smeForm.businessStage,
              targetMarket: smeForm.targetMarket,
              primaryProducts: smeForm.primaryProducts,
              operationalChallenges: smeForm.operationalChallenges,
              strategicGoals: smeForm.strategicGoals,
              digitizationLevel: smeForm.digitizationLevel
            }
          })
        });
        setInitialSmeData({ ...smeForm });
        setSuccessMessage('Business Profile and operational intelligence updated successfully.');
      }
      setIsEditing(false);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save profile. Please check the fields and try again.');
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#eaf2ff] via-white to-emerald-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {isFI ? fiForm.institutionName || 'Financial Institution Profile' : smeForm.businessName || 'Business Profile'}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isFI
                ? 'bg-blue-50 text-[#0a66c2] border-blue-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {isFI ? 'Credit Institution' : smeForm.businessType || 'SME Business'}
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            {isFI
              ? 'Institutional accreditation, representative details, and regulatory credentials.'
              : 'Operational assets, machinery, balance sheet, and categorization intelligence.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-gray-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-5 py-2 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-xs font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* =========================================================================
          SME PROFILE VIEW & EDIT (Tabs & Detailed Categorization Forms)
      ========================================================================== */}
      {!isFI ? (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="rounded-xl border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Assets</p>
                  <p className="text-sm md:text-base font-bold text-slate-900">
                    {(totalAssets / 1000000).toFixed(1)}M <span className="text-xs font-normal text-slate-500">RWF</span>
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner Equity</p>
                  <p className="text-sm md:text-base font-bold text-slate-900">
                    {(ownerCapital / 1000000).toFixed(1)}M <span className="text-xs font-normal text-slate-500">RWF</span>
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Equipments</p>
                  <p className="text-sm md:text-base font-bold text-slate-900">{smeForm.equipments.length} Units</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workforce</p>
                  <p className="text-sm md:text-base font-bold text-slate-900">{totalEmployees} Personnel</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'general'
                  ? 'bg-[#0a66c2] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-gray-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              General & Location
            </button>

            <button
              onClick={() => setActiveTab('equipment')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'equipment'
                  ? 'bg-[#0a66c2] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-gray-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Equipments & Tools ({smeForm.equipments.length})
            </button>

            <button
              onClick={() => setActiveTab('balance')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'balance'
                  ? 'bg-[#0a66c2] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-gray-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              Balance Sheet & Capital
            </button>

            <button
              onClick={() => setActiveTab('workforce')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'workforce'
                  ? 'bg-[#0a66c2] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-gray-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Workforce & Payroll
            </button>

            <button
              onClick={() => setActiveTab('strategy')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'strategy'
                  ? 'bg-[#0a66c2] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-gray-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              Strategy & AI Intelligence
            </button>
          </div>

          {/* TAB 1: General & Location */}
          {activeTab === 'general' && (
            <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-5">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  General & Administrative Location
                </h2>
                <span className="text-xs text-slate-400">
                  {isEditing ? 'Editing Mode' : 'View Mode'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Business Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={smeForm.businessName}
                      onChange={(e) => setSmeForm({ ...smeForm, businessName: e.target.value })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                      {smeForm.businessName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Owner / Managing Director</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={smeForm.ownerName}
                      onChange={(e) => setSmeForm({ ...smeForm, ownerName: e.target.value })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                      {smeForm.ownerName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Registered Email</label>
                  <p className="text-xs font-medium text-slate-600 bg-slate-100 px-3.5 py-2.5 rounded-lg border border-gray-100">
                    {smeForm.email}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Phone</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={smeForm.phone}
                      onChange={(e) => setSmeForm({ ...smeForm, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                    />
                  ) : (
                    <p className="text-xs font-medium text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                      {smeForm.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Business Sector</label>
                  {isEditing ? (
                    <select
                      value={smeForm.businessType}
                      onChange={(e) => setSmeForm({ ...smeForm, businessType: e.target.value })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                    >
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs font-medium text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                      {smeForm.businessType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Province & District</label>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Province"
                        value={smeForm.province}
                        onChange={(e) => setSmeForm({ ...smeForm, province: e.target.value })}
                        className="bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="District"
                        value={smeForm.district}
                        onChange={(e) => setSmeForm({ ...smeForm, district: e.target.value })}
                        className="bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                      {smeForm.district}, {smeForm.province}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sector, Cell, Village</label>
                  {isEditing ? (
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Sector"
                        value={smeForm.sector}
                        onChange={(e) => setSmeForm({ ...smeForm, sector: e.target.value })}
                        className="bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Cell"
                        value={smeForm.cell}
                        onChange={(e) => setSmeForm({ ...smeForm, cell: e.target.value })}
                        className="bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Village"
                        value={smeForm.village}
                        onChange={(e) => setSmeForm({ ...smeForm, village: e.target.value })}
                        className="bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                      {smeForm.sector} / {smeForm.cell} / {smeForm.village}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Landmark Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={smeForm.knownPlace}
                      onChange={(e) => setSmeForm({ ...smeForm, knownPlace: e.target.value })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-medium"
                    />
                  ) : (
                    <p className="text-xs font-medium text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                      {smeForm.knownPlace}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* TAB 2: Equipments & Machinery */}
          {activeTab === 'equipment' && (
            <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-600" />
                    Equipments, Machinery & Operational Assets
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Total Estimated Equipment Value: <strong className="text-slate-900">{totalEquipmentsValue.toLocaleString()} RWF</strong>
                  </p>
                </div>

                {isEditing && (
                  <button
                    type="button"
                    onClick={handleAddEquipment}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition flex items-center gap-1 self-start sm:self-auto border border-emerald-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Equipment
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {smeForm.equipments.map((eq) => (
                  <div
                    key={eq.id}
                    className="p-3.5 rounded-xl border border-gray-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Equipment Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={eq.name}
                          onChange={(e) => handleEquipmentChange(eq.id, 'name', e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                        />
                      ) : (
                        <p className="text-xs font-bold text-slate-900">{eq.name}</p>
                      )}
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Category</label>
                      {isEditing ? (
                        <select
                          value={eq.category}
                          onChange={(e) => handleEquipmentChange(eq.id, 'category', e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
                        >
                          <option value="Technology">Technology</option>
                          <option value="Storage">Storage / Refrigeration</option>
                          <option value="Logistics">Logistics / Vehicle</option>
                          <option value="Power">Power & Backup</option>
                          <option value="Manufacturing">Manufacturing & Tools</option>
                        </select>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-1 rounded border border-gray-200">
                          {eq.category}
                        </span>
                      )}
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Estimated Value (RWF)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={eq.value}
                          onChange={(e) => handleEquipmentChange(eq.id, 'value', Number(e.target.value) || 0)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                        />
                      ) : (
                        <p className="text-xs font-bold text-slate-900">{Number(eq.value).toLocaleString()} RWF</p>
                      )}
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-2 sm:pt-0">
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {eq.condition}
                      </span>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEquipment(eq.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                          title="Delete equipment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* TAB 3: Balance Sheet & Capital */}
          {activeTab === 'balance' && (
            <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  Balance Sheet, Assets & Capital Structure
                </h2>
                <span className="text-xs text-slate-400">
                  {isEditing ? 'Editing Mode' : 'View Mode'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Assets Column */}
                <div className="p-4 rounded-xl bg-slate-50 border border-gray-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                    <span>Assets Breakdown</span>
                    <span className="text-emerald-700 font-extrabold">{totalAssets.toLocaleString()} RWF</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Assets (Cash + Stock + Receivables)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={smeForm.currentAssets}
                        onChange={(e) => setSmeForm({ ...smeForm, currentAssets: Number(e.target.value) || 0 })}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                      />
                    ) : (
                      <p className="text-xs font-bold text-slate-900 bg-white px-3 py-2 rounded-lg border border-gray-200">
                        {Number(smeForm.currentAssets).toLocaleString()} RWF
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fixed Assets (Machinery + Vehicles + Property)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={smeForm.fixedAssets}
                        onChange={(e) => setSmeForm({ ...smeForm, fixedAssets: Number(e.target.value) || 0 })}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                      />
                    ) : (
                      <p className="text-xs font-bold text-slate-900 bg-white px-3 py-2 rounded-lg border border-gray-200">
                        {Number(smeForm.fixedAssets).toLocaleString()} RWF
                      </p>
                    )}
                  </div>
                </div>

                {/* Liabilities Column */}
                <div className="p-4 rounded-xl bg-slate-50 border border-gray-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                    <span>Liabilities & Debts</span>
                    <span className="text-rose-600 font-extrabold">{totalLiabilities.toLocaleString()} RWF</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Short-term Liabilities (Trade Credit / Payables)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={smeForm.shortTermLiabilities}
                        onChange={(e) => setSmeForm({ ...smeForm, shortTermLiabilities: Number(e.target.value) || 0 })}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                      />
                    ) : (
                      <p className="text-xs font-bold text-slate-900 bg-white px-3 py-2 rounded-lg border border-gray-200">
                        {Number(smeForm.shortTermLiabilities).toLocaleString()} RWF
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Long-term Liabilities (Bank Loans / Credit Facilities)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={smeForm.longTermLiabilities}
                        onChange={(e) => setSmeForm({ ...smeForm, longTermLiabilities: Number(e.target.value) || 0 })}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                      />
                    ) : (
                      <p className="text-xs font-bold text-slate-900 bg-white px-3 py-2 rounded-lg border border-gray-200">
                        {Number(smeForm.longTermLiabilities).toLocaleString()} RWF
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Capital & Turnover */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-gray-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Calculated Owner Equity</p>
                  <p className="text-base font-extrabold text-emerald-600 mt-0.5">{ownerCapital.toLocaleString()} RWF</p>
                  <p className="text-[10px] text-slate-400">Total Assets minus Total Liabilities</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Turnover (RWF)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={smeForm.monthlyTurnover}
                      onChange={(e) => setSmeForm({ ...smeForm, monthlyTurnover: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-900 bg-slate-50 px-3 py-2.5 rounded-lg border border-gray-100">
                      {Number(smeForm.monthlyTurnover).toLocaleString()} RWF
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Margin (%)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={smeForm.grossMarginPercentage}
                      onChange={(e) => setSmeForm({ ...smeForm, grossMarginPercentage: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-900 bg-slate-50 px-3 py-2.5 rounded-lg border border-gray-100">
                      {smeForm.grossMarginPercentage}%
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* TAB 4: Workforce & Payroll */}
          {activeTab === 'workforce' && (
            <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Workforce & Monthly Payroll
                </h2>
                <span className="text-xs text-slate-400">
                  {isEditing ? 'Editing Mode' : 'View Mode'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full-Time Staff</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={smeForm.fullTimeEmployees}
                      onChange={(e) => setSmeForm({ ...smeForm, fullTimeEmployees: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                      {smeForm.fullTimeEmployees} Personnel
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Part-Time / Casual Staff</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={smeForm.partTimeEmployees}
                      onChange={(e) => setSmeForm({ ...smeForm, partTimeEmployees: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                      {smeForm.partTimeEmployees} Personnel
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Monthly Payroll (RWF)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={smeForm.monthlyPayroll}
                      onChange={(e) => setSmeForm({ ...smeForm, monthlyPayroll: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                      {Number(smeForm.monthlyPayroll).toLocaleString()} RWF
                    </p>
                  )}
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Key Operational Roles</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={smeForm.keyRoles}
                      onChange={(e) => setSmeForm({ ...smeForm, keyRoles: e.target.value })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-medium"
                    />
                  ) : (
                    <p className="text-xs font-medium text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                      {smeForm.keyRoles}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* TAB 5: Strategy & AI Intelligence */}
          {activeTab === 'strategy' && (
            <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  Strategy & Business Categorization
                </h2>
                <span className="text-xs text-slate-400">
                  {isEditing ? 'Editing Mode' : 'View Mode'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Business Lifecycle Stage</label>
                  {isEditing ? (
                    <select
                      value={smeForm.businessStage}
                      onChange={(e) => setSmeForm({ ...smeForm, businessStage: e.target.value })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-900"
                    >
                      <option value="Seed / Startup (0-1 yr)">Seed / Startup (0-1 yr)</option>
                      <option value="Early Growth (1-3 yrs)">Early Growth (1-3 yrs)</option>
                      <option value="Growth / Scaling (3+ yrs)">Growth / Scaling (3+ yrs)</option>
                      <option value="Established / Mature">Established / Mature</option>
                    </select>
                  ) : (
                    <p className="text-xs font-bold text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                      {smeForm.businessStage}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Digitization Level</label>
                  {isEditing ? (
                    <select
                      value={smeForm.digitizationLevel}
                      onChange={(e) => setSmeForm({ ...smeForm, digitizationLevel: e.target.value })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-900"
                    >
                      <option value="Low (Manual Cash Registers)">Low (Manual Cash Registers)</option>
                      <option value="Medium (POS & Mobile Money enabled)">Medium (POS & Mobile Money enabled)</option>
                      <option value="High (Integrated ERP & E-Commerce)">High (Integrated ERP & E-Commerce)</option>
                    </select>
                  ) : (
                    <p className="text-xs font-bold text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                      {smeForm.digitizationLevel}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Customer Segments</label>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={smeForm.targetMarket}
                      onChange={(e) => setSmeForm({ ...smeForm, targetMarket: e.target.value })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg p-3 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-gray-100">
                      {smeForm.targetMarket}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Operational Challenges</label>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={smeForm.operationalChallenges}
                      onChange={(e) => setSmeForm({ ...smeForm, operationalChallenges: e.target.value })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg p-3 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-gray-100">
                      {smeForm.operationalChallenges}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Strategic Growth Objectives</label>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={smeForm.strategicGoals}
                      onChange={(e) => setSmeForm({ ...smeForm, strategicGoals: e.target.value })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg p-3 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-gray-100">
                      {smeForm.strategicGoals}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      ) : (
        /* =========================================================================
            FINANCIAL INSTITUTION PROFILE VIEW & EDIT (Clean Institutional Credentials)
        ========================================================================== */
        <Card className="rounded-2xl border-gray-200 bg-white p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0a66c2]" />
                Institutional Accreditation & Licensing
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official registration credentials for credit underwriting and opportunity publishing.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Partner
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Institution Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={fiForm.institutionName}
                  onChange={(e) => setFiForm({ ...fiForm, institutionName: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-1 focus:ring-purple-500"
                />
              ) : (
                <p className="text-xs font-bold text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                  {fiForm.institutionName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Representative / Lead Officer Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={fiForm.representativeName}
                  onChange={(e) => setFiForm({ ...fiForm, representativeName: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-1 focus:ring-purple-500"
                />
              ) : (
                <p className="text-xs font-bold text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                  {fiForm.representativeName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Institution Category</label>
              {isEditing ? (
                <select
                  value={fiForm.category}
                  onChange={(e) => setFiForm({ ...fiForm, category: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="Commercial Bank">Commercial Bank</option>
                  <option value="Microfinance Institution (MFI)">Microfinance Institution (MFI)</option>
                  <option value="SACCO / Credit Union">SACCO / Credit Union</option>
                  <option value="Development Bank">Development Bank</option>
                  <option value="Fintech & Alternative Lender">Fintech & Alternative Lender</option>
                </select>
              ) : (
                <p className="text-xs font-bold text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                  {fiForm.category}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Operating Scope</label>
              {isEditing ? (
                <select
                  value={fiForm.operatingScope}
                  onChange={(e) => setFiForm({ ...fiForm, operatingScope: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="National (Rwanda)">National (Rwanda)</option>
                  <option value="Regional (East Africa)">Regional (East Africa)</option>
                  <option value="Kigali Urban District">Kigali Urban District</option>
                  <option value="Rural Provinces">Rural Provinces</option>
                </select>
              ) : (
                <p className="text-xs font-bold text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                  {fiForm.operatingScope}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Central Bank License Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={fiForm.licenseNumber}
                  onChange={(e) => setFiForm({ ...fiForm, licenseNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-mono font-bold text-slate-900"
                />
              ) : (
                <p className="text-xs font-mono font-bold text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                  {fiForm.licenseNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Website</label>
              {isEditing ? (
                <input
                  type="text"
                  value={fiForm.website}
                  onChange={(e) => setFiForm({ ...fiForm, website: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs text-slate-800"
                  placeholder="https://www.institution.rw"
                />
              ) : (
                <p className="text-xs font-medium text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                  {fiForm.website}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Email</label>
              <p className="text-xs font-medium text-slate-500 bg-slate-100 px-3.5 py-2.5 rounded-lg border border-gray-100">
                {fiForm.email}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Contact Phone</label>
              {isEditing ? (
                <input
                  type="text"
                  value={fiForm.phone}
                  onChange={(e) => setFiForm({ ...fiForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-semibold"
                />
              ) : (
                <p className="text-xs font-medium text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-gray-100">
                  {fiForm.phone}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

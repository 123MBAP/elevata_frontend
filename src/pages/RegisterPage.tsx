import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Briefcase,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import logo from '../assets/images/elevata_logo.png';
import { apiRequest } from '../lib/api';

// Mini Rwandan Administrative Address Database
const RWANDA_ADDRESSES: Record<string, Record<string, Record<string, Record<string, string[]>>>> = {
  'Kigali City': {
    Nyarugenge: {
      Nyarugenge: {
        Kiyovu: ['Amahoro', 'Kiyovu I', 'Kiyovu II', 'Rugenge'],
        Biryogo: ['Biryogo I', 'Biryogo II', 'Agatare']
      },
      Muhima: {
        Amahoro: ['Amahoro I', 'Amahoro II'],
        Nyabugogo: ['Kabutare', 'Nyabugogo I', 'Nyabugogo II']
      }
    },
    Gasabo: {
      Kacyiru: {
        Kamatamu: ['Kamatamu I', 'Kamatamu II', 'Ubumwe'],
        Kibaza: ['Kibaza I', 'Kibaza II']
      },
      Kimihurura: {
        Rugando: ['Rugando I', 'Rugando II'],
        Kimihurura: ['Kimihurura I', 'Kimihurura II']
      }
    },
    Kicukiro: {
      Kagarama: {
        Muyange: ['Muyange I', 'Muyange II'],
        Kagarama: ['Kagarama I', 'Kagarama II']
      },
      Kanombe: {
        Busanza: ['Busanza I', 'Busanza II'],
        Karama: ['Karama I', 'Karama II']
      }
    }
  },
  'Northern Province': {
    Musanze: {
      Muhoza: {
        Ruhengeri: ['Muhoza I', 'Muhoza II'],
        Mpenge: ['Mpenge I', 'Mpenge II']
      }
    }
  },
  'Eastern Province': {
    Rwamagana: {
      Kigabiro: {
        Sibagire: ['Sibagire I', 'Sibagire II'],
        Rwamagana: ['Rwamagana I']
      }
    }
  },
  'Southern Province': {
    Huye: {
      Ngoma: {
        Butare: ['Butare I', 'Butare II'],
        Matyazo: ['Matyazo I']
      }
    }
  },
  'Western Province': {
    Rubavu: {
      Gisenyi: {
        Gisenyi: ['Gisenyi I', 'Gisenyi II'],
        Mbugangari: ['Mbugangari I']
      }
    }
  }
};

const BUSINESS_TYPES = [
  'Retail Shop',
  'Wholesale',
  'Restaurant',
  'Hotel',
  'Agriculture',
  'Manufacturing',
  'Construction',
  'Transport',
  'Education',
  'Healthcare',
  'ICT',
  'Finance',
  'Pharmacy',
  'Salon',
  'Fashion',
  'Electronics',
  'Hardware Store',
  'Supermarket',
  'Stationery',
  'Printing',
  'Other'
];

const FI_CATEGORIES = [
  'Commercial Bank',
  'Microfinance Institution',
  'Development Bank',
  'SACCO',
  'Fintech / Mobile Money Provider',
  'Insurance Company',
  'Investment Fund',
  'Other'
];

const FI_SCOPES = [
  'Rwanda',
  'Africa',
  'Worldwide'
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Wizard Step State
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handleSendVerificationCode = async () => {
    if (!formData.email) {
      setError('Please enter your email address first.');
      return;
    }
    setError(null);
    setSendingCode(true);
    try {
      await apiRequest('/auth/send-verification-code', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email })
      });
      setShowVerificationInput(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }
    setError(null);
    setVerifyingCode(true);
    try {
      await apiRequest('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email, code: verificationCode })
      });
      setIsEmailVerified(true);
      setShowVerificationInput(false);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setVerifyingCode(false);
    }
  };

  // Form Fields State
  const [formData, setFormData] = useState({
    registrationType: 'SME', // 'SME' | 'FINANCIAL_INSTITUTION'

    // Step 1: Owner / Representative Credentials
    ownerName: '', // acts as representativeName for FI
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',

    // Step 2: SME specific
    businessName: '',
    businessType: '',

    // Step 2: Financial Institution specific
    institutionName: '',
    category: '',
    operatingScope: '',
    licenseNumber: '',
    website: '',

    // Step 3: Rwanda Addresses
    province: '',
    district: '',
    sector: '',
    cell: '',
    village: '',
    knownPlace: '',

    // Step 4: Geolocation
    latitude: '',
    longitude: ''
  });

  const totalSteps = formData.registrationType === 'SME' ? 4 : 2;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Cascading reset logic for address selection
      if (name === 'province') {
        updated.district = '';
        updated.sector = '';
        updated.cell = '';
        updated.village = '';
      } else if (name === 'district') {
        updated.sector = '';
        updated.cell = '';
        updated.village = '';
      } else if (name === 'sector') {
        updated.cell = '';
        updated.village = '';
      } else if (name === 'cell') {
        updated.village = '';
      }

      return updated;
    });
  };

  // Browser Geolocation query handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setError(null);
      },
      (err) => {
        console.error('Geolocation lookup failed:', err);
        let errorMsg = 'Location lookup failed. Defaulted to Kigali Center; you can edit these values manually.';
        if (err.code === 1) {
          errorMsg = 'Location access was denied. Defaulted to Kigali Center; you can edit these values manually.';
        } else if (err.code === 2) {
          errorMsg = 'Location is currently unavailable. Defaulted to Kigali Center; you can edit these values manually.';
        } else if (err.code === 3) {
          errorMsg = 'Location request timed out. Defaulted to Kigali Center; you can edit these values manually.';
        }

        // Fall back to Kigali Center coordinates to avoid blocking the user
        setFormData((prev) => ({
          ...prev,
          latitude: '-1.944100',
          longitude: '30.061900'
        }));

        setError(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!formData.ownerName || !formData.email || !formData.phone || !formData.password) {
        setError('Please fill in all credential fields.');
        return;
      }
      if (!isEmailVerified) {
        setError('Please verify your email address before proceeding.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!strongPasswordRegex.test(formData.password)) {
        setError('Password must be at least 8 characters and contain 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.');
        return;
      }
    } else if (step === 2) {
      if (formData.registrationType === 'SME') {
        if (!formData.businessName || !formData.businessType) {
          setError('Please enter your business name and type.');
          return;
        }
      } else {
        if (!formData.institutionName || !formData.category || !formData.operatingScope || !formData.licenseNumber) {
          setError('Please complete the institution details and license number.');
          return;
        }
      }
    } else if (step === 3) {
      if (!formData.province || !formData.district || !formData.sector || !formData.cell || !formData.village) {
        setError('Please complete the administrative address fields.');
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setError(null);
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let lat = 0;
    let lon = 0;

    // Validate Coordinates only for SMEs
    if (formData.registrationType === 'SME') {
      lat = parseFloat(formData.latitude);
      lon = parseFloat(formData.longitude);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        setError('Latitude must be a valid number between -90 and 90.');
        return;
      }
      if (isNaN(lon) || lon < -180 || lon > 180) {
        setError('Longitude must be a valid number between -180 and 180.');
        return;
      }
    }

    setLoading(true);

    try {
      // Exclude confirmPassword and unused type fields before submitting
      const { confirmPassword, ...rawSubmitData } = formData;
      let submitData: any;

      if (formData.registrationType === 'SME') {
        submitData = {
          registrationType: 'SME',
          ownerName: rawSubmitData.ownerName,
          email: rawSubmitData.email,
          phone: rawSubmitData.phone,
          password: rawSubmitData.password,
          businessName: rawSubmitData.businessName,
          businessType: rawSubmitData.businessType,
          province: rawSubmitData.province,
          district: rawSubmitData.district,
          sector: rawSubmitData.sector,
          cell: rawSubmitData.cell,
          village: rawSubmitData.village,
          knownPlace: rawSubmitData.knownPlace,
          latitude: lat,
          longitude: lon
        };
      } else {
        submitData = {
          registrationType: 'FINANCIAL_INSTITUTION',
          representativeName: rawSubmitData.ownerName, // map representative to the owner field
          email: rawSubmitData.email,
          phone: rawSubmitData.phone,
          password: rawSubmitData.password,
          institutionName: rawSubmitData.institutionName,
          category: rawSubmitData.category,
          operatingScope: rawSubmitData.operatingScope,
          licenseNumber: rawSubmitData.licenseNumber,
          website: rawSubmitData.website || undefined
        };
      }

      const registeredUser = await register(submitData);
      if (registeredUser?.role === 'ADMIN') {
        navigate('/');
      } else if (registeredUser?.isPilotApproved) {
        if (registeredUser?.role === 'FINANCIAL_INSTITUTION') {
          navigate('/banker');
        } else {
          navigate('/');
        }
      } else {
        navigate('/pilot-restricted');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your data.');
    } finally {
      setLoading(false);
    }
  };

  // Cascading lists filters
  const provinces = Object.keys(RWANDA_ADDRESSES);
  const districts = formData.province ? Object.keys(RWANDA_ADDRESSES[formData.province] || {}) : [];
  const sectors = (formData.province && formData.district) ? Object.keys(RWANDA_ADDRESSES[formData.province][formData.district] || {}) : [];
  const cells = (formData.province && formData.district && formData.sector) ? Object.keys(RWANDA_ADDRESSES[formData.province][formData.district][formData.sector] || {}) : [];
  const villages = (formData.province && formData.district && formData.sector && formData.cell) ? RWANDA_ADDRESSES[formData.province][formData.district][formData.sector][formData.cell] || [] : [];

  return (
    <div className="relative flex min-h-dvh w-screen items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_top,_#f7f9fc_0%,_#eef3f9_45%,_#e8eef7_100%)] p-3 font-sans sm:p-4">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.65),rgba(255,255,255,0.1))]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[480px] rounded-[24px] border border-[#e3eaf4] bg-white px-6 py-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8 my-4"
      >
        {/* Logo and Brand Name */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Elevata" className="h-10 w-10 object-contain" />
            <span className="text-[1.8rem] font-extrabold tracking-[-0.04em] text-[#101828]">
              Elevata
            </span>
          </div>
        </div>

        {/* Wizard Progress Header */}
        <div className="mt-6 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.8rem] font-extrabold uppercase tracking-[0.02em] text-[#0f74e7]">
              Step {step} of {totalSteps}
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }, (_, index) => index + 1).map((i) => (
                <div
                  key={i}
                  className={`h-1 w-6 rounded-full transition-all duration-300 ${
                    i <= step ? 'bg-[#0f74e7] shadow-sm' : 'bg-[#d9e2ef]'
                  }`}
                />
              ))}
            </div>
          </div>
          <h2 className="text-[1.25rem] font-extrabold tracking-[-0.02em] text-[#101828]">
            {step === 1 && 'Account Security & Role'}
            {step === 2 && (formData.registrationType === 'SME' ? 'Business Profile' : 'Institution Details')}
            {step === 3 && 'Administrative Address'}
            {step === 4 && 'Geolocation Mapping'}
          </h2>
          <p className="text-[0.9rem] text-[#64748b] mt-1 leading-relaxed">
            {step === 1 && 'Choose your registration profile type and details.'}
            {step === 2 && (formData.registrationType === 'SME' ? 'Tell us about your business.' : 'Fill in institution category and regulatory license.')}
            {step === 3 && 'Select your local operating headquarters inside Rwanda.'}
            {step === 4 && 'Identify your GPS coordinates to activate the account.'}
          </p>
        </div>

        {/* Error Notification Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div>
                <span className="font-semibold">Validation Notice</span>
                <p className="mt-0.5 text-red-600">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* STEP 1: Account Security & Role */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              {/* Role Selection Cards */}
              <div className="space-y-1.5">
                <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                  Register as a:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* SME Card */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, registrationType: 'SME' }))}
                    className={`cursor-pointer rounded-xl border p-3 text-center transition-all duration-200 ${
                      formData.registrationType === 'SME'
                        ? 'border-[#0f74e7] bg-[#eaf2ff] text-[#0f74e7] shadow-[0_4px_12px_rgba(15,116,231,0.08)]'
                        : 'border-[#d9e2ef] bg-[#f8fafc] text-[#64748b] hover:border-[#cbd5e1]'
                    }`}
                  >
                    <Briefcase className={`mx-auto h-5 w-5 mb-1.5 transition-colors ${formData.registrationType === 'SME' ? 'text-[#0f74e7]' : 'text-[#64748b]'}`} />
                    <span className="block text-xs font-bold">SME Owner</span>
                    <span className="text-[9px] leading-none block mt-1 text-[#64748b]">Receive Personalised Offers & Match Eligibility</span>
                  </div>

                  {/* Financial Institution Card */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, registrationType: 'FINANCIAL_INSTITUTION' }))}
                    className={`cursor-pointer rounded-xl border p-3 text-center transition-all duration-200 ${
                      formData.registrationType === 'FINANCIAL_INSTITUTION'
                        ? 'border-[#0f74e7] bg-[#eaf2ff] text-[#0f74e7] shadow-[0_4px_12px_rgba(15,116,231,0.08)]'
                        : 'border-[#d9e2ef] bg-[#f8fafc] text-[#64748b] hover:border-[#cbd5e1]'
                    }`}
                  >
                    <ShieldCheck className={`mx-auto h-5 w-5 mb-1.5 transition-colors ${formData.registrationType === 'FINANCIAL_INSTITUTION' ? 'text-[#0f74e7]' : 'text-[#64748b]'}`} />
                    <span className="block text-xs font-bold">Financial Institution</span>
                    <span className="text-[9px] leading-none block mt-1 text-[#64748b]">Publish Financial Products & Eligibility Criteria</span>
                  </div>
                </div>
              </div>

              {/* Full Name input based on role */}
              <div className="space-y-1">
                <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                  {formData.registrationType === 'SME' ? 'Owner Full Name' : 'Representative Full Name'}
                </label>
                <input
                  type="text"
                  name="ownerName"
                  required
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Jean Claude"
                  className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] px-4 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                  Email Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    name="email"
                    required
                    disabled={isEmailVerified}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="office@elevata.com"
                    className="flex-1 rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] px-4 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)] disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {!isEmailVerified && (
                    <button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={sendingCode || !formData.email}
                      className="px-5 py-3 text-sm font-extrabold text-white bg-[#0f74e7] hover:bg-[#0d67cf] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-[0_8px_16px_rgba(15,116,231,0.12)]"
                    >
                      {sendingCode ? 'Sending...' : 'Verify'}
                    </button>
                  )}
                </div>
              </div>

              {showVerificationInput && !isEmailVerified && (
                <div className="space-y-2 mt-2 p-4 rounded-2xl border border-[#cbd5e1] bg-[#f8fafc]">
                  <label className="block text-[0.8rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                    Verification Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="flex-1 rounded-lg border border-[#2f3a4a] bg-white px-4 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] focus:border-[#1d4ed8] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={verifyingCode || verificationCode.length !== 6}
                      className="px-5 py-3 text-sm font-extrabold text-white bg-[#0f74e7] hover:bg-[#0d67cf] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-[0_8px_16px_rgba(15,116,231,0.12)]"
                    >
                      {verifyingCode ? 'Verifying...' : 'Confirm'}
                    </button>
                  </div>
                  <p className="text-[0.78rem] text-[#64748b]">
                    We sent a verification code to {formData.email}.
                  </p>
                </div>
              )}

              {isEmailVerified && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#15803d] bg-[#f0fdf4] p-2.5 px-3.5 rounded-2xl border border-[#bbf7d0]">
                  <CheckCircle className="h-4 w-4 shrink-0 text-[#16a34a]" />
                  Email address verified successfully
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+250781234567"
                  className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] px-4 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] pl-4 pr-10 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[#94a3b8] transition-colors hover:text-[#475569]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] pl-4 pr-10 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[#94a3b8] transition-colors hover:text-[#475569]"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Conditional Profile details (SME vs FI) */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              {formData.registrationType === 'SME' ? (
                /* SME FIELDS */
                <>
                  <div className="space-y-1">
                    <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      required
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="Kigali Retail Shop"
                      className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] px-4 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                      Business Category
                    </label>
                    <div className="relative">
                      <select
                        name="businessType"
                        required
                        value={formData.businessType}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] px-4 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)] appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="text-[#6b7280]">Select Operating Sector</option>
                        {BUSINESS_TYPES.map((type) => (
                          <option key={type} value={type} className="text-[#111827] bg-white">{type}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#475569]">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* FINANCIAL INSTITUTION FIELDS */
                <>
                  <div className="space-y-1">
                    <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                      Institution Name
                    </label>
                    <input
                      type="text"
                      name="institutionName"
                      required
                      value={formData.institutionName}
                      onChange={handleChange}
                      placeholder="Kigali Development Bank"
                      className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] px-4 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Category */}
                    <div className="space-y-1">
                      <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                        Category
                      </label>
                      <div className="relative">
                        <select
                          name="category"
                          required
                          value={formData.category}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] pl-4 pr-9 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)] appearance-none cursor-pointer"
                        >
                          <option value="" disabled className="text-[#6b7280]">Select...</option>
                          {FI_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat} className="text-[#111827] bg-white">{cat}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#475569]">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Operating Scope */}
                    <div className="space-y-1">
                      <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                        Operating Scope
                      </label>
                      <div className="relative">
                        <select
                          name="operatingScope"
                          required
                          value={formData.operatingScope}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] pl-4 pr-9 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)] appearance-none cursor-pointer"
                        >
                          <option value="" disabled className="text-[#6b7280]">Select...</option>
                          {FI_SCOPES.map((scope) => (
                            <option key={scope} value={scope} className="text-[#111827] bg-white">{scope}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#475569]">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                      Regulatory License Number
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      required
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="BNR-MFI-902348"
                      className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] px-4 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                      Official Website URL (Optional)
                    </label>
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://www.institution.com"
                      className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] px-4 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                    />
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* STEP 3: Rwanda Addresses */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                {/* Province */}
                <div className="space-y-1">
                  <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                    Province
                  </label>
                  <div className="relative">
                    <select
                      name="province"
                      required
                      value={formData.province}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] pl-4 pr-9 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)] appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="text-[#6b7280]">Select...</option>
                      {provinces.map((p) => (
                        <option key={p} value={p} className="text-[#111827] bg-white">{p}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#475569]">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* District */}
                <div className="space-y-1">
                  <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                    District
                  </label>
                  <div className="relative">
                    <select
                      name="district"
                      required
                      disabled={!formData.province}
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] pl-4 pr-9 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)] appearance-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="" disabled className="text-[#6b7280]">Select...</option>
                      {districts.map((d) => (
                        <option key={d} value={d} className="text-[#111827] bg-white">{d}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#475569]">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Sector */}
                <div className="space-y-1">
                  <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                    Sector
                  </label>
                  <div className="relative">
                    <select
                      name="sector"
                      required
                      disabled={!formData.district}
                      value={formData.sector}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] pl-4 pr-9 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)] appearance-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="" disabled className="text-[#6b7280]">Select...</option>
                      {sectors.map((s) => (
                        <option key={s} value={s} className="text-[#111827] bg-white">{s}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#475569]">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Cell */}
                <div className="space-y-1">
                  <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                    Cell
                  </label>
                  <div className="relative">
                    <select
                      name="cell"
                      required
                      disabled={!formData.sector}
                      value={formData.cell}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] pl-4 pr-9 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)] appearance-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="" disabled className="text-[#6b7280]">Select...</option>
                      {cells.map((c) => (
                        <option key={c} value={c} className="text-[#111827] bg-white">{c}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#475569]">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Village */}
                <div className="space-y-1">
                  <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                    Village
                  </label>
                  <div className="relative">
                    <select
                      name="village"
                      required
                      disabled={!formData.cell}
                      value={formData.village}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] pl-4 pr-9 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)] appearance-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="" disabled className="text-[#6b7280]">Select...</option>
                      {villages.map((v) => (
                        <option key={v} value={v} className="text-[#111827] bg-white">{v}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#475569]">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Known Place */}
                <div className="space-y-1">
                  <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                    Known Place
                  </label>
                  <input
                    type="text"
                    name="knownPlace"
                    value={formData.knownPlace}
                    onChange={handleChange}
                    placeholder="e.g. Head Office Suite"
                    className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] px-4 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Geolocation Mapping */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="rounded-2xl border border-[#e3eaf4] bg-[#f8fafc] p-5 text-center">
                <Compass className="mx-auto h-8 w-8 text-[#0f74e7] animate-pulse mb-3" />
                <p className="text-sm text-[#64748b] max-w-xs mx-auto mb-4 leading-relaxed font-sans">
                  Elevata location requirements help credit institutions verify SME business nodes and operating ranges.
                </p>
                <button
                  type="button"
                  onClick={handleLocateMe}
                  className="inline-flex h-10 items-center justify-center gap-1.5 px-5 text-sm font-extrabold text-white bg-[#0f74e7] hover:bg-[#0d67cf] rounded-full shadow-[0_8px_20px_rgba(15,116,231,0.2)] transition-colors"
                >
                  Retrieve Geolocation Coords
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                    Latitude
                  </label>
                  <input
                    type="text"
                    name="latitude"
                    required
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="-1.944100"
                    className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] px-4 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[0.85rem] font-extrabold uppercase tracking-[0.02em] text-[#111827]">
                    Longitude
                  </label>
                  <input
                    type="text"
                    name="longitude"
                    required
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="30.061900"
                    className="w-full rounded-lg border border-[#2f3a4a] bg-[#eaf2ff] px-4 py-3 text-[1rem] text-[#111827] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#6b7280] focus:border-[#1d4ed8] focus:bg-[#edf4ff] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-5 border-t border-[#e2e8f0]">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={loading}
                className="flex h-11 items-center justify-center gap-1.5 px-5 text-sm font-bold border border-[#d9e2ef] hover:bg-[#f1f5f9] bg-transparent text-[#475569] rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 py-2 px-5 text-sm font-extrabold text-white bg-[#0f74e7] hover:bg-[#0d67cf] active:bg-[#0c5ebc] rounded-full transition-colors shadow-[0_12px_24px_rgba(15,116,231,0.2)]"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="flex h-11 flex-1 items-center justify-center gap-2 py-2 px-5 text-sm font-extrabold text-white bg-[#0f74e7] hover:bg-[#0d67cf] active:bg-[#0c5ebc] rounded-full transition-colors shadow-[0_12px_24px_rgba(15,116,231,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    Submit Registration <CheckCircle className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            )}
          </div>
        </form>

        <div className="flex items-center gap-4 py-3 text-center text-[#94a3b8]">
          <span className="h-px flex-1 bg-[#d9e2ef]" />
          <span className="text-sm font-medium">or</span>
          <span className="h-px flex-1 bg-[#d9e2ef]" />
        </div>

        <div className="text-center text-[0.98rem] text-[#64748b]">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-[#1670d8] hover:underline">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
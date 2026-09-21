import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Briefcase,
  ShieldCheck,
  CheckCircle,
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
        Matyazo: ['Matyazo I', 'Matyazo II'],
        Ngoma: ['Ngoma I', 'Ngoma II']
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

const DEFAULT_BUSINESS_TYPES = [
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

  // Dynamic business categories from DB
  const [businessTypes, setBusinessTypes] = useState<string[]>(DEFAULT_BUSINESS_TYPES);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiRequest('/categories');
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const names = res.data.map((c: any) => c.businessType || c.cat_name).filter(Boolean);
          if (names.length > 0) {
            setBusinessTypes(names);
          }
        }
      } catch (e) {
        // Fallback to default categories silently
      }
    }
    loadCategories();
  }, []);

  // Wizard Step State
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    // Step 4: Geolocation (Default Kigali Center coordinates)
    latitude: '-1.944100',
    longitude: '30.061900'
  });

  const totalSteps = formData.registrationType === 'SME' ? 4 : 2;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'email') {
        setEmailVerified(false);
        setVerificationSent(false);
        setVerificationCode('');
      }

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

  const handleSendVerificationCode = async () => {
    setError(null);
    setVerificationLoading(true);

    try {
      await apiRequest('/auth/send-verification-code', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email })
      });
      setVerificationSent(true);
    } catch (err: any) {
      setError(err.message || 'Unable to send the verification code.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setError(null);
    setVerificationLoading(true);

    try {
      await apiRequest('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email, code: verificationCode })
      });
      setEmailVerified(true);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Browser Geolocation query handler - silently falls back to defaults without showing errors
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setFormData((prev) => ({
        ...prev,
        latitude: '-1.944100',
        longitude: '30.061900'
      }));
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
      () => {
        // Silently use default coordinates
        setFormData((prev) => ({
          ...prev,
          latitude: '-1.944100',
          longitude: '30.061900'
        }));
      },
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 }
    );
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!formData.ownerName || !formData.email || !formData.phone || !formData.password) {
        setError('Please fill in all credential fields.');
        return;
      }
      if (!emailVerified) {
        setError('Please verify your email address before continuing.');
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

    // Assign coordinates with default fallback for SMEs
    if (formData.registrationType === 'SME') {
      lat = parseFloat(formData.latitude);
      lon = parseFloat(formData.longitude);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        lat = -1.9441;
      }
      if (isNaN(lon) || lon < -180 || lon > 180) {
        lon = 30.0619;
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
        navigate('/admin/users');
      } else if (registeredUser?.role === 'FINANCIAL_INSTITUTION') {
        navigate('/banker');
      } else {
        navigate('/');
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
    <div className="relative flex min-h-dvh w-screen items-center justify-center overflow-y-auto bg-[#f3f2f0] p-4 font-sans sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="my-4 w-full max-w-[460px] rounded-[10px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.08)] sm:p-8"
      >
        {/* Logo and Brand Name */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <img src={logo} alt="Elevata" className="h-9 w-9 object-contain" />
            <span className="text-[1.65rem] font-black tracking-tight text-[#0a66c2]">
              Elevata
            </span>
          </Link>
          <p className="mt-1 text-sm font-normal text-[#5e5e5e]">
            Make the most of your professional journey
          </p>
        </div>

        {/* Wizard Progress Header */}
        <div className="mt-5 mb-5 border-b border-[#e0e0e0] pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#0a66c2]">
              Step {step} of {totalSteps}
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }, (_, index) => index + 1).map((i) => (
                <div
                  key={i}
                  className={`h-1.5 w-6 rounded-full transition-all duration-300 ${i <= step ? 'bg-[#0a66c2]' : 'bg-[#e0e0e0]'
                    }`}
                />
              ))}
            </div>
          </div>
          <h2 className="text-[1.15rem] font-bold text-[#181818]">
            {step === 1 && 'Create your account'}
            {step === 2 && (formData.registrationType === 'SME' ? 'Business Profile' : 'Institution Details')}
            {step === 3 && 'Administrative Address'}
            {step === 4 && 'Geolocation Mapping'}
          </h2>
          <p className="text-[13px] text-[#5e5e5e] mt-0.5">
            {step === 1 && 'Choose your registration profile type and security details.'}
            {step === 2 && (formData.registrationType === 'SME' ? 'Tell us about your registered business.' : 'Fill in institution category and regulatory license.')}
            {step === 3 && 'Select your local operating headquarters inside Rwanda.'}
            {step === 4 && 'Identify your GPS coordinates to activate the account.'}
          </p>
        </div>

        {/* Error Notification Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div>
                <span className="font-semibold">Validation Notice</span>
                <p className="mt-0.5 text-xs text-red-600">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* STEP 1: Account Security & Role */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              {/* Role Selection Cards */}
              <div>
                <label className="mb-1.5 block text-[14px] font-normal text-[#181818]">
                  Register as
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* SME Card */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, registrationType: 'SME' }))}
                    className={`cursor-pointer rounded-[6px] border p-3 text-center transition-all ${formData.registrationType === 'SME'
                        ? 'border-[#0a66c2] bg-[#eaf2ff] text-[#0a66c2]'
                        : 'border-[#cccccc] bg-white text-[#5e5e5e] hover:border-[#666666]'
                      }`}
                  >
                    <Briefcase className={`mx-auto h-5 w-5 mb-1 transition-colors ${formData.registrationType === 'SME' ? 'text-[#0a66c2]' : 'text-[#5e5e5e]'}`} />
                    <span className="block text-xs font-bold text-[#181818]">SME Owner</span>
                    <span className="text-[10px] leading-tight block mt-0.5 text-[#5e5e5e]">Personalised Offers & Eligibility</span>
                  </div>

                  {/* Financial Institution Card */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, registrationType: 'FINANCIAL_INSTITUTION' }))}
                    className={`cursor-pointer rounded-[6px] border p-3 text-center transition-all ${formData.registrationType === 'FINANCIAL_INSTITUTION'
                        ? 'border-[#0a66c2] bg-[#eaf2ff] text-[#0a66c2]'
                        : 'border-[#cccccc] bg-white text-[#5e5e5e] hover:border-[#666666]'
                      }`}
                  >
                    <ShieldCheck className={`mx-auto h-5 w-5 mb-1 transition-colors ${formData.registrationType === 'FINANCIAL_INSTITUTION' ? 'text-[#0a66c2]' : 'text-[#5e5e5e]'}`} />
                    <span className="block text-xs font-bold text-[#181818]">Financial Institution</span>
                    <span className="text-[10px] leading-tight block mt-0.5 text-[#5e5e5e]">Publish Financial Products</span>
                  </div>
                </div>
              </div>

              {/* Full Name input based on role */}
              <div>
                <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                  {formData.registrationType === 'SME' ? 'Owner full name' : 'Representative full name'}
                </label>
                <input
                  type="text"
                  name="ownerName"
                  required
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Jean Claude"
                  className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="office@elevata.com"
                  className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={!formData.email || verificationLoading || emailVerified}
                    className="h-9 rounded-[4px] border border-[#0a66c2] px-3 text-xs font-semibold text-[#0a66c2] transition-colors hover:bg-[#eaf2ff] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {emailVerified ? 'Email verified' : verificationLoading ? 'Sending...' : verificationSent ? 'Resend code' : 'Send verification code'}
                  </button>
                  {emailVerified && <CheckCircle className="mt-1.5 h-5 w-5 text-[#057642]" />}
                </div>
                {verificationSent && !emailVerified && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit code"
                      aria-label="Email verification code"
                      className="h-10 min-w-0 flex-1 rounded-[4px] border border-[#666666] px-3 text-sm outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyEmail}
                      disabled={verificationCode.length !== 6 || verificationLoading}
                      className="h-10 rounded-[4px] bg-[#057642] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#045c33] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Verify
                    </button>
                  </div>
                )}
                {verificationSent && !emailVerified && (
                  <p className="mt-1 text-xs text-[#5e5e5e]">Check your inbox for the 6-digit code.</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                  Phone number
                </label>
                <input
                  type="text"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+250781234567"
                  className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                  Password (8+ characters)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white pl-3 pr-16 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[14px] font-semibold text-[#0a66c2] transition-colors hover:text-[#004182] hover:underline"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                  Confirm password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white pl-3 pr-16 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-[14px] font-semibold text-[#0a66c2] transition-colors hover:text-[#004182] hover:underline"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
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
                  <div>
                    <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      required
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="Kigali Retail Shop"
                      className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                      Business Category
                    </label>
                    <div className="relative">
                      <select
                        name="businessType"
                        required
                        value={formData.businessType}
                        onChange={handleChange}
                        className="h-11 w-full rounded-[4px] border border-[#666666] bg-white pl-3 pr-8 text-[15px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="text-[#8c8c8c]">Select operating category</option>
                        {businessTypes.map((type) => (
                          <option key={type} value={type} className="text-[#181818] bg-white">{type}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#5e5e5e]">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* FINANCIAL INSTITUTION FIELDS */
                <>
                  <div>
                    <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                      Institution Name
                    </label>
                    <input
                      type="text"
                      name="institutionName"
                      required
                      value={formData.institutionName}
                      onChange={handleChange}
                      placeholder="Kigali Development Bank"
                      className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                        Category
                      </label>
                      <div className="relative">
                        <select
                          name="category"
                          required
                          value={formData.category}
                          onChange={handleChange}
                          className="h-11 w-full rounded-[4px] border border-[#666666] bg-white pl-3 pr-8 text-[15px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] appearance-none cursor-pointer"
                        >
                          <option value="" disabled className="text-[#8c8c8c]">Select...</option>
                          {FI_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat} className="text-[#181818] bg-white">{cat}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#5e5e5e]">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                        Scope
                      </label>
                      <div className="relative">
                        <select
                          name="operatingScope"
                          required
                          value={formData.operatingScope}
                          onChange={handleChange}
                          className="h-11 w-full rounded-[4px] border border-[#666666] bg-white pl-3 pr-8 text-[15px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] appearance-none cursor-pointer"
                        >
                          <option value="" disabled className="text-[#8c8c8c]">Select...</option>
                          {FI_SCOPES.map((scope) => (
                            <option key={scope} value={scope} className="text-[#181818] bg-white">{scope}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#5e5e5e]">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                      Regulatory License Number
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      required
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="BNR-MFI-902348"
                      className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                      Official Website URL (Optional)
                    </label>
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://www.institution.com"
                      className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
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
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Province
                  </label>
                  <div className="relative">
                    <select
                      name="province"
                      required
                      value={formData.province}
                      onChange={handleChange}
                      className="h-11 w-full rounded-[4px] border border-[#666666] bg-white pl-3 pr-8 text-[15px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="text-[#8c8c8c]">Select...</option>
                      {provinces.map((p) => (
                        <option key={p} value={p} className="text-[#181818] bg-white">{p}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#5e5e5e]">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    District
                  </label>
                  <div className="relative">
                    <select
                      name="district"
                      required
                      disabled={!formData.province}
                      value={formData.district}
                      onChange={handleChange}
                      className="h-11 w-full rounded-[4px] border border-[#666666] bg-white pl-3 pr-8 text-[15px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] appearance-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="" disabled className="text-[#8c8c8c]">Select...</option>
                      {districts.map((d) => (
                        <option key={d} value={d} className="text-[#181818] bg-white">{d}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#5e5e5e]">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Sector
                  </label>
                  <div className="relative">
                    <select
                      name="sector"
                      required
                      disabled={!formData.district}
                      value={formData.sector}
                      onChange={handleChange}
                      className="h-11 w-full rounded-[4px] border border-[#666666] bg-white pl-3 pr-8 text-[15px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] appearance-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="" disabled className="text-[#8c8c8c]">Select...</option>
                      {sectors.map((s) => (
                        <option key={s} value={s} className="text-[#181818] bg-white">{s}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#5e5e5e]">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Cell
                  </label>
                  <div className="relative">
                    <select
                      name="cell"
                      required
                      disabled={!formData.sector}
                      value={formData.cell}
                      onChange={handleChange}
                      className="h-11 w-full rounded-[4px] border border-[#666666] bg-white pl-3 pr-8 text-[15px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] appearance-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="" disabled className="text-[#8c8c8c]">Select...</option>
                      {cells.map((c) => (
                        <option key={c} value={c} className="text-[#181818] bg-white">{c}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#5e5e5e]">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Village
                  </label>
                  <div className="relative">
                    <select
                      name="village"
                      required
                      disabled={!formData.cell}
                      value={formData.village}
                      onChange={handleChange}
                      className="h-11 w-full rounded-[4px] border border-[#666666] bg-white pl-3 pr-8 text-[15px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] appearance-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="" disabled className="text-[#8c8c8c]">Select...</option>
                      {villages.map((v) => (
                        <option key={v} value={v} className="text-[#181818] bg-white">{v}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#5e5e5e]">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Known Place
                  </label>
                  <input
                    type="text"
                    name="knownPlace"
                    value={formData.knownPlace}
                    onChange={handleChange}
                    placeholder="e.g. Head Office Suite"
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Geolocation Mapping */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="rounded-[8px] border border-[#e0e0e0] bg-[#f8fafc] p-4 text-center">
                <Compass className="mx-auto h-7 w-7 text-[#0a66c2] mb-2" />
                <p className="text-[13px] text-[#5e5e5e] max-w-xs mx-auto mb-3 leading-relaxed">
                  Elevata location requirements help credit institutions verify SME business nodes and operating ranges.
                </p>
                <button
                  type="button"
                  onClick={handleLocateMe}
                  className="inline-flex h-9 items-center justify-center gap-1.5 px-4 text-xs font-bold text-[#0a66c2] border border-[#0a66c2] hover:bg-[#eaf2ff] rounded-full transition-colors"
                >
                  Retrieve Geolocation Coords
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Latitude
                  </label>
                  <input
                    type="text"
                    name="latitude"
                    required
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="-1.944100"
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Longitude
                  </label>
                  <input
                    type="text"
                    name="longitude"
                    required
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="30.061900"
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-3">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={loading}
                className="flex h-12 items-center justify-center gap-1 px-5 text-[15px] font-semibold border border-[#666666] hover:bg-gray-50 bg-white text-[#181818] rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}

            {step < totalSteps ? (
              <motion.button
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={handleNextStep}
                className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#0a66c2] text-[16px] font-bold text-white transition-colors hover:bg-[#004182]"
              >
                Next <ArrowRight className="h-4 w-4" />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#0a66c2] text-[16px] font-bold text-white transition-colors hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  'Agree & Join'
                )}
              </motion.button>
            )}
          </div>
        </form>

        <div className="relative flex items-center py-3">
          <div className="flex-grow border-t border-[#e0e0e0]"></div>
          <span className="mx-4 flex-shrink text-[13px] text-[#717171]">or</span>
          <div className="flex-grow border-t border-[#e0e0e0]"></div>
        </div>

        <div className="text-center text-[14px] text-[#5e5e5e]">
          Already on Elevata?{' '}
          <Link to="/login" className="font-semibold text-[#0a66c2] hover:underline">
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
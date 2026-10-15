import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  FileText,
  Check,
  AlertCircle,
  ChevronDown,
  Calendar,
  DollarSign,
  Info,
  Plus,
  Trash2,
  Edit3,
  Save,
  ArrowRight,
  Search,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  CheckSquare,
  Square,
  Sliders,
  Bold,
  Italic,
  Underline,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Eye,
  Sparkles,
  Eraser,
  UploadCloud,
  Image as ImageIcon,
  Video,
  Film,
  Play
} from 'lucide-react';
import { OpportunityType } from './SelectOpportunityTypeModal';
import { Opportunity } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import FormattedText from './ui/FormattedText';
import VideoPreviewPlayer from './ui/VideoPreviewPlayer';
import GuideDocumentCard, { GuideDocumentData } from './ui/GuideDocumentCard';

interface PublishOpportunityFormProps {
  oppType: OpportunityType;
  oppCategory: string;
  onCancel: () => void;
  onPublish: (data: any) => Promise<void>;
  initialOpportunity?: Opportunity | null;
  onChangeType: () => void;
  availableCategories: { id: string; businessType: string }[];
  simulatedCandidates: {
    name: string;
    sector: string;
    matchPercent: number;
    status: string;
    checks: { label: string; pass: boolean }[];
    missing: string[];
    readiness: string;
    action: string;
  }[];
  formatRWF: (amount: number) => string;
}

// Hierarchical Rwandan administrative geography (Provinces -> Districts)
const RWANDA_GEOGRAPHY: {
  province: string;
  districts: string[];
}[] = [
  {
    province: 'Kigali City',
    districts: ['Nyarugenge', 'Gasabo', 'Kicukiro']
  },
  {
    province: 'Northern Province',
    districts: ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo']
  },
  {
    province: 'Southern Province',
    districts: ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango']
  },
  {
    province: 'Eastern Province',
    districts: ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana']
  },
  {
    province: 'Western Province',
    districts: ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro']
  }
];

// Curated default business sectors
const DEFAULT_SECTORS = [
  'Agriculture & Agribusiness',
  'Retail Shop & Commerce',
  'Wholesale & FMCG Distribution',
  'Manufacturing & Light Industry',
  'ICT & Technology Services',
  'Transport & Logistics',
  'Healthcare & Pharmaceuticals',
  'Construction & Real Estate',
  'Tourism, Food & Hospitality',
  'Professional & Business Services',
  'Clean Energy & Environment',
  'Education & Vocational Training'
];

// Standard document checklist items
interface StandardDocItem {
  id: string;
  name: string;
  defaultStatus: 'Required' | 'Optional' | 'Not required';
  description: string;
}

const DEFAULT_DOCUMENTS: StandardDocItem[] = [
  {
    id: 'reg_cert',
    name: 'Business Registration Certificate (RDB)',
    defaultStatus: 'Required',
    description: 'Official enterprise incorporation or business certificate'
  },
  {
    id: 'id_doc',
    name: 'National ID or Passport of Authorized Signatory',
    defaultStatus: 'Required',
    description: 'Government issued identification of director or owner'
  },
  {
    id: 'bank_stmt',
    name: 'Bank Statements (Last 6 Months)',
    defaultStatus: 'Required',
    description: 'Operating commercial account turnover history'
  },
  {
    id: 'fin_stmt',
    name: 'Financial Statements / Management Accounts',
    defaultStatus: 'Optional',
    description: 'Income statement, balance sheet, or certified books'
  },
  {
    id: 'biz_plan',
    name: 'Business Plan & Growth Projections',
    defaultStatus: 'Optional',
    description: 'Operational strategy, market overview, and budget plan'
  },
  {
    id: 'cashflow',
    name: 'Cash Flow Forecast',
    defaultStatus: 'Optional',
    description: '12-month expected cash inflow and outflow schedules'
  },
  {
    id: 'collateral_doc',
    name: 'Collateral Documentation / Proof of Assets',
    defaultStatus: 'Not required',
    description: 'Title deed, asset registration, or guarantee commitment'
  },
  {
    id: 'tax_clearance',
    name: 'RRA Tax Clearance Certificate',
    defaultStatus: 'Optional',
    description: 'Rwanda Revenue Authority tax compliance confirmation'
  }
];

export default function PublishOpportunityForm({
  oppType,
  oppCategory,
  onCancel,
  onPublish,
  initialOpportunity = null,
  onChangeType,
  availableCategories,
  formatRWF
}: PublishOpportunityFormProps) {
  const { user } = useAuth();

  // Active Tab State: 1 to 5 (Tabs: 1. Basic Info | 2. Loan Terms | 3. Eligibility | 4. Documents | 5. Review & Publish)
  const [activeTab, setActiveTab] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ==========================================
  // TAB 1: BASIC INFORMATION
  // ==========================================
  const [title, setTitle] = useState('');
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = (file: File) => {
    setImageError(null);
    if (!file.type.startsWith('image/')) {
      setImageError('Please upload a valid image file (.png, .jpg, .jpeg, .webp, .svg)');
      return;
    }
    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image file size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setBannerImage(e.target.result);
      }
    };
    reader.onerror = () => {
      setImageError('Error reading selected image.');
    };
    reader.readAsDataURL(file);
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleImageDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImage(true);
  };

  const handleImageDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImage(false);
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Guidance Resources (Guide Document & Video Walkthrough URL)
  const [guideDoc, setGuideDoc] = useState<GuideDocumentData | null>(null);
  const [guideDocUrlInput, setGuideDocUrlInput] = useState<string>('');
  const [guideDocNameInput, setGuideDocNameInput] = useState<string>('');
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [showDocUrlInput, setShowDocUrlInput] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const processGuideDocFile = (file: File) => {
    setDocUploadError(null);
    if (file.size > 25 * 1024 * 1024) {
      setDocUploadError('Document file size exceeds 25MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setGuideDoc({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          fileData: e.target.result,
          uploadedAt: new Date().toISOString()
        });
      }
    };
    reader.onerror = () => {
      setDocUploadError('Error reading selected document file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDocInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processGuideDocFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleDocDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingDoc(true);
  };

  const handleDocDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingDoc(false);
  };

  const handleDocDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingDoc(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processGuideDocFile(file);
    }
  };

  const [provider, setProvider] = useState(() => {
    return user?.financialInstitution?.institutionName || user?.name || 'Elevata Partner Financial Institution';
  });
  const [financingPurpose, setFinancingPurpose] = useState<string>('Working capital and inventory');
  const [customPurpose, setCustomPurpose] = useState('');
  const [description, setDescription] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  // Execute in-place visual formatting commands on selected text
  const executeFormat = (command: string, value: string = '') => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const currentText = editorRef.current.innerText.trim();
    const currentHtml = editorRef.current.innerHTML.trim();

    if ((!currentText || currentHtml === '<br>' || currentHtml === '<p><br></p>' || currentHtml === '') && 
        (command === 'insertUnorderedList' || command === 'insertOrderedList')) {
      const tag = command === 'insertUnorderedList' ? 'ul' : 'ol';
      document.execCommand('insertHTML', false, `<${tag}><li>List item</li></${tag}><p><br/></p>`);
    } else {
      document.execCommand(command, false, value);
    }

    if (editorRef.current) {
      setDescription(editorRef.current.innerHTML);
      clearError('description');
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setDescription(editorRef.current.innerHTML);
      clearError('description');
    }
  };

  const handleEditorPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    if (html) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Remove noisy interactive or dangerous elements
        const unwanted = doc.querySelectorAll('script, style, form, input, select, textarea, svg, meta, link, iframe');
        unwanted.forEach(el => el.remove());

        // Replace buttons and role="tab" elements with clean paragraph text
        const buttons = doc.querySelectorAll('button, [role="tab"], [role="button"], [role="navigation"], nav');
        buttons.forEach(btn => {
          const btnText = btn.textContent?.trim();
          if (btnText) {
            const p = doc.createElement('p');
            p.textContent = btnText;
            btn.parentNode?.replaceChild(p, btn);
          } else {
            btn.remove();
          }
        });

        // Strip messy style attributes and classes
        const allElements = doc.querySelectorAll('*');
        allElements.forEach(el => {
          el.removeAttribute('class');
          el.removeAttribute('id');
          el.removeAttribute('role');
          el.removeAttribute('aria-selected');
          const style = el.getAttribute('style');
          if (style && (style.includes('--tw') || style.includes('margin:') || style.includes('padding:') || style.includes('position:'))) {
            if (!style.includes('border-left') && !style.includes('background')) {
              el.removeAttribute('style');
            }
          }
        });

        const cleanHtml = doc.body.innerHTML.trim();
        if (cleanHtml) {
          document.execCommand('insertHTML', false, cleanHtml);
          if (editorRef.current) {
            setDescription(editorRef.current.innerHTML);
            clearError('description');
          }
          return;
        }
      } catch (err) {
        console.warn('HTML paste sanitation fallback:', err);
      }
    }

    if (text) {
      const formatted = text
        .split(/\n\n+/)
        .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
        .join('');
      document.execCommand('insertHTML', false, formatted);
      if (editorRef.current) {
        setDescription(editorRef.current.innerHTML);
        clearError('description');
      }
    }
  };

  const insertCallout = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    const text = selection && selection.toString().trim() ? selection.toString() : 'All eligible businesses must maintain active bookkeeping records.';
    document.execCommand(
      'insertHTML',
      false,
      `<blockquote style="border-left: 3px solid #2998d6; background: #f0f9ff; padding: 8px 12px; margin: 8px 0; border-radius: 4px; color: #0369a1; font-style: italic;"><strong>Note:</strong> ${text}</blockquote><p><br/></p>`
    );
    if (editorRef.current) {
      setDescription(editorRef.current.innerHTML);
      clearError('description');
    }
  };

  const insertTemplate = () => {
    const templateHtml = `<h3>Facility Overview</h3><p>Comprehensive credit and working capital facility designed to provide accessible, low-friction financing to qualifying enterprises across Rwanda.</p><h3>Key Highlights &amp; Terms</h3><ul><li>Subsidized competitive annual interest rate and transparent repayment terms</li><li>Expedited underwriting approval decision within 48 to 72 business hours</li><li>Dedicated credit advisory and financial capacity building support</li></ul><h3>Targeted Use of Funds</h3><ol><li>Working capital and inventory acquisition</li><li>Equipment purchasing and technology modernization</li><li>Market expansion and scaling commercial operations</li></ol><blockquote style="border-left: 3px solid #2998d6; background: #f0f9ff; padding: 8px 12px; margin: 8px 0; border-radius: 4px; color: #0369a1; font-style: italic;"><strong>Note:</strong> All eligible businesses must maintain active bookkeeping records on Elevata.</blockquote><p><br/></p>`;
    setDescription(templateHtml);
    if (editorRef.current) {
      editorRef.current.innerHTML = templateHtml;
    }
    clearError('description');
  };

  // Sync initial or draft description into WYSIWYG editor
  useEffect(() => {
    if (editorRef.current && description) {
      if (editorRef.current.innerHTML !== description) {
        editorRef.current.innerHTML = description;
      }
    }
  }, [description]);

  const [showTermsSection, setShowTermsSection] = useState(false);
  const [additionalTerms, setAdditionalTerms] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([
    'Agriculture & Agribusiness',
    'Retail Shop & Commerce',
    'Manufacturing & Light Industry'
  ]);
  const [sectorSearchQuery, setSectorSearchQuery] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([
    'Kigali City',
    'Nyarugenge',
    'Gasabo',
    'Kicukiro',
    'Northern Province',
    'Western Province',
    'Eastern Province',
    'Southern Province'
  ]);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [targetStage, setTargetStage] = useState('All Stages');
  const [deadline, setDeadline] = useState('');
  const [isRollingDeadline, setIsRollingDeadline] = useState(true);

  // ==========================================
  // TAB 2: LOAN TERMS
  // ==========================================
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('25000000');
  const [interestRateStructure, setInterestRateStructure] = useState<'fixed' | 'variable' | 'assessed'>('fixed');
  const [interestRate, setInterestRate] = useState<string>('14.5');
  const [repaymentTermType, setRepaymentTermType] = useState<'single' | 'range'>('single');
  const [singleTermMonths, setSingleTermMonths] = useState<string>('24');
  const [minTermMonths, setMinTermMonths] = useState<string>('6');
  const [maxTermMonths, setMaxTermMonths] = useState<string>('36');
  const [gracePeriodMonths, setGracePeriodMonths] = useState<string>('2');
  const [collateralRequirement, setCollateralRequirement] = useState<'required' | 'not_required' | 'assessed'>('not_required');
  const [collateralDescription, setCollateralDescription] = useState<string>('');
  const [repaymentFrequency, setRepaymentFrequency] = useState<string>('Monthly');
  const [additionalFees, setAdditionalFees] = useState<string>('');
  const [additionalConditions, setAdditionalConditions] = useState<string>('');

  // Fallbacks for other opportunity types
  const [grantImpact, setGrantImpact] = useState('Employment Creation & Green Technology');
  const [guaranteeCoverage, setGuaranteeCoverage] = useState('75');

  // ==========================================
  // TAB 3: ELIGIBILITY REQUIREMENTS
  // ==========================================
  const [legalStructures, setLegalStructures] = useState<string[]>([
    'Sole Proprietorship',
    'Registered Company (Ltd)',
    'Cooperative / SACCO'
  ]);
  const [turnoverBasis, setTurnoverBasis] = useState<'monthly' | 'annual' | 'none'>('monthly');
  const [turnoverAmount, setTurnoverAmount] = useState<string>('1500000');
  const [minOperatingAge, setMinOperatingAge] = useState<string>('1');
  const [otherEligibility, setOtherEligibility] = useState<string>('');
  
  // Advanced Matching Settings (collapsed by default)
  const [showAdvancedMatching, setShowAdvancedMatching] = useState(false);
  const [minReadinessScore, setMinReadinessScore] = useState<string>('0');
  const [minHealthScore, setMinHealthScore] = useState<string>('0');
  const [minEmployees, setMinEmployees] = useState<string>('');
  const [maxDebtToRevenue, setMaxDebtToRevenue] = useState<string>('');
  const [matchingModes, setMatchingModes] = useState<Record<string, 'Required' | 'Preferred'>>({
    turnover: 'Required',
    operatingAge: 'Preferred',
    readinessScore: 'Preferred',
    legalStructure: 'Required'
  });

  // ==========================================
  // TAB 4: REQUIRED DOCUMENTS
  // ==========================================
  const [documentDossier, setDocumentDossier] = useState<
    { id: string; name: string; status: 'Required' | 'Optional' | 'Not required' }[]
  >(() => {
    return DEFAULT_DOCUMENTS.map((doc) => ({
      id: doc.id,
      name: doc.name,
      status: doc.defaultStatus
    }));
  });
  const [customDocName, setCustomDocName] = useState('');
  const [showCustomDocInput, setShowCustomDocInput] = useState(false);

  // ==========================================
  // TAB 5: APPLICATION PROCESS & REVIEW
  // ==========================================
  const [applicationMethod, setApplicationMethod] = useState<'elevata' | 'external' | 'contact' | 'branch'>('elevata');
  const [externalUrl, setExternalUrl] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState(() => user?.email || '');
  const [contactPhone, setContactPhone] = useState(() => user?.phone || '');
  const [branchInstructions, setBranchInstructions] = useState('');
  const [applicationInstructions, setApplicationInstructions] = useState('');

  const isEditMode = Boolean(initialOpportunity);

  useEffect(() => {
    if (!initialOpportunity) return;

    const metadata = (initialOpportunity.metadata || {}) as Record<string, any>;
    setTitle(initialOpportunity.title || '');
    setProvider(initialOpportunity.institution || user?.financialInstitution?.institutionName || user?.name || '');
    setDescription(initialOpportunity.description || '');
    setDeadline(initialOpportunity.deadline || '');
    setIsRollingDeadline(false);
    setMaxAmount(metadata.loanMaxAmt ? String(metadata.loanMaxAmt) : initialOpportunity.maxFunding || '');
    setSelectedSectors(initialOpportunity.sectors || []);
    setMinOperatingAge(String(initialOpportunity.minAge || 0));
    setMinHealthScore(String(initialOpportunity.minHealthScore || 0));
    setMinReadinessScore(String(initialOpportunity.minReadinessScore || 0));
    setDocumentDossier((initialOpportunity.requiredDocs || []).map((name, index) => ({
      id: `existing-${index}`,
      name,
      status: 'Required'
    })));
    setGuideDoc(initialOpportunity.guideDocument || metadata.guideDocument || null);
    setVideoUrlInput(initialOpportunity.videoUrl || metadata.videoUrl || '');
  }, [initialOpportunity, user]);

  // Auto-populate default description if empty
  useEffect(() => {
    if (!description) {
      if (oppType === 'loan' || oppType === 'agricultural_loan') {
        setDescription(
          `Flexible credit and financing facility tailored to support small and growing businesses with sustainable cash flow, inventory expansion, and equipment procurement.`
        );
      } else if (oppType === 'grant') {
        setDescription(
          `Non-dilutive grant facility providing growth funding and technical assistance to qualifying high-impact Rwandan enterprises.`
        );
      } else {
        setDescription(
          `${oppCategory} program providing accessible financial solutions and digital enablement for local businesses across Rwanda.`
        );
      }
    }
  }, [oppType, oppCategory]);

  // Load draft from localStorage on mount if available
  const draftKey = `elevata_draft_opp_${oppType}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.bannerImage) setBannerImage(parsed.bannerImage);
        if (parsed.provider) setProvider(parsed.provider);
        if (parsed.financingPurpose) setFinancingPurpose(parsed.financingPurpose);
        if (parsed.customPurpose) setCustomPurpose(parsed.customPurpose);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.selectedSectors) setSelectedSectors(parsed.selectedSectors);
        if (parsed.selectedLocations) setSelectedLocations(parsed.selectedLocations);
        if (parsed.targetStage) setTargetStage(parsed.targetStage);
        if (parsed.deadline) {
          setDeadline(parsed.deadline);
          setIsRollingDeadline(false);
        }
        if (parsed.minAmount) setMinAmount(parsed.minAmount);
        if (parsed.maxAmount) setMaxAmount(parsed.maxAmount);
        if (parsed.interestRateStructure) setInterestRateStructure(parsed.interestRateStructure);
        if (parsed.interestRate) setInterestRate(parsed.interestRate);
        if (parsed.singleTermMonths) setSingleTermMonths(parsed.singleTermMonths);
        if (parsed.gracePeriodMonths) setGracePeriodMonths(parsed.gracePeriodMonths);
        if (parsed.collateralRequirement) setCollateralRequirement(parsed.collateralRequirement);
        if (parsed.collateralDescription) setCollateralDescription(parsed.collateralDescription);
        if (parsed.turnoverAmount) setTurnoverAmount(parsed.turnoverAmount);
        if (parsed.applicationMethod) {
          setApplicationMethod(typeof parsed.applicationMethod === 'object' ? parsed.applicationMethod.type || 'elevata' : parsed.applicationMethod);
        }
        if (parsed.guideDocUrlInput) setGuideDocUrlInput(parsed.guideDocUrlInput);
        if (parsed.guideDocNameInput) setGuideDocNameInput(parsed.guideDocNameInput);
        if (parsed.videoUrlInput) setVideoUrlInput(parsed.videoUrlInput);
      }
    } catch (e) {
      console.warn('Unable to restore draft:', e);
    }
  }, [draftKey]);

  // Save draft helper
  const handleSaveDraft = () => {
    const draftData = {
      title,
      bannerImage,
      provider,
      financingPurpose,
      customPurpose,
      description,
      additionalTerms,
      selectedSectors,
      selectedLocations,
      targetStage,
      deadline: isRollingDeadline ? '' : deadline,
      minAmount,
      maxAmount,
      interestRateStructure,
      interestRate,
      repaymentTermType,
      singleTermMonths,
      minTermMonths,
      maxTermMonths,
      gracePeriodMonths,
      collateralRequirement,
      collateralDescription,
      repaymentFrequency,
      additionalFees,
      additionalConditions,
      legalStructures,
      turnoverBasis,
      turnoverAmount,
      minOperatingAge,
      otherEligibility,
      minReadinessScore,
      minHealthScore,
      minEmployees,
      maxDebtToRevenue,
      documentDossier,
      applicationMethod,
      externalUrl,
      contactPerson,
      contactEmail,
      contactPhone,
      branchInstructions,
      applicationInstructions,
      guideDoc,
      guideDocUrlInput,
      guideDocNameInput,
      videoUrlInput,
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setDraftSavedAt(timeStr);
      setTimeout(() => setDraftSavedAt(null), 4000);
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  };

  // Clear specific validation error
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Step-by-Step Validation
  const validateTab = (tabNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (tabNumber === 1) {
      if (!title.trim()) {
        newErrors.title = 'Opportunity title is required';
      }
      if (!provider.trim()) {
        newErrors.provider = 'Offering institution name is required';
      }
      if (financingPurpose === 'Other' && !customPurpose.trim()) {
        newErrors.customPurpose = 'Please specify the financing purpose';
      }
      if (!description.trim()) {
        newErrors.description = 'A short description is required';
      }
      if (selectedSectors.length === 0) {
        newErrors.sectors = 'Select at least one eligible business sector';
      }
      if (selectedLocations.length === 0) {
        newErrors.locations = 'Select at least one eligible geographical location';
      }
    }

    if (tabNumber === 2) {
      if (oppType === 'loan' || oppType === 'agricultural_loan') {
        if (!maxAmount || Number(maxAmount) <= 0) {
          newErrors.maxAmount = 'Maximum loan amount is required and must be greater than 0';
        }
        if (minAmount && Number(minAmount) > 0 && maxAmount && Number(maxAmount) < Number(minAmount)) {
          newErrors.maxAmount = 'Maximum loan amount cannot be less than the minimum amount';
        }
        if ((interestRateStructure === 'fixed' || interestRateStructure === 'variable') && (!interestRate || Number(interestRate) < 0)) {
          newErrors.interestRate = 'Valid interest rate percentage is required';
        }
        if (repaymentTermType === 'single') {
          if (!singleTermMonths || Number(singleTermMonths) <= 0) {
            newErrors.singleTermMonths = 'Repayment term is required';
          }
        } else {
          if (!minTermMonths || Number(minTermMonths) <= 0) {
            newErrors.minTermMonths = 'Minimum term is required';
          }
          if (!maxTermMonths || Number(maxTermMonths) <= 0) {
            newErrors.maxTermMonths = 'Maximum term is required';
          }
          if (minTermMonths && maxTermMonths && Number(maxTermMonths) < Number(minTermMonths)) {
            newErrors.maxTermMonths = 'Max term cannot be lower than min term';
          }
        }
        if (collateralRequirement === 'required' && !collateralDescription.trim()) {
          newErrors.collateralDescription = 'Please specify the description for the required collateral';
        }
      }
    }

    if (tabNumber === 3) {
      if (legalStructures.length === 0) {
        newErrors.legalStructures = 'Select at least one permitted legal structure';
      }
      if (turnoverBasis !== 'none' && (!turnoverAmount || Number(turnoverAmount) < 0)) {
        newErrors.turnoverAmount = 'Please enter a valid turnover threshold amount';
      }
    }

    if (tabNumber === 6) {
      if (applicationMethod === 'external' && !externalUrl.trim()) {
        newErrors.externalUrl = 'External application URL is required';
      } else if (applicationMethod === 'external' && externalUrl.trim()) {
        try {
          new URL(externalUrl.startsWith('http') ? externalUrl : `https://${externalUrl}`);
        } catch {
          newErrors.externalUrl = 'Please enter a valid URL (e.g. https://bank.rw/apply)';
        }
      }
      if (applicationMethod === 'contact' && !contactEmail.trim() && !contactPhone.trim()) {
        newErrors.contact = 'Please provide an email or phone number for direct contact';
      }
      if (applicationMethod === 'branch' && !branchInstructions.trim()) {
        newErrors.branchInstructions = 'Please provide branch location instructions';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Direct tab click handler
  const handleTabClick = (tabId: number) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Next tab navigation
  const handleNextTab = () => {
    if (validateTab(activeTab)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveTab((prev) => Math.min(prev + 1, 6));
    }
  };

  // Previous tab navigation
  const handlePrevTab = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveTab((prev) => Math.max(prev - 1, 1));
  };

  // Handle final submission to publish
  const handleSubmitPublish = async () => {
    if (!validateTab(1) || !validateTab(2) || !validateTab(3) || !validateTab(6)) {
      if (!validateTab(1)) setActiveTab(1);
      else if (!validateTab(2)) setActiveTab(2);
      else if (!validateTab(3)) setActiveTab(3);
      else if (!validateTab(6)) setActiveTab(6);
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedMaxAmount = parseInt(maxAmount, 10) || 0;
      const parsedMinAmount = minAmount ? parseInt(minAmount, 10) : 0;
      const formattedMaxFunding = formatRWF(parsedMaxAmount);

      const parsedRate = interestRateStructure === 'assessed' ? 0 : parseFloat(interestRate) || 0;
      const parsedTerm =
        repaymentTermType === 'single'
          ? parseInt(singleTermMonths, 10) || 12
          : parseInt(maxTermMonths, 10) || 24;
      const parsedGrace = parseInt(gracePeriodMonths, 10) || 0;

      // Turnover calculations
      const parsedTurnover = turnoverBasis !== 'none' ? parseInt(turnoverAmount, 10) || 0 : 0;
      const annualRevenue =
        turnoverBasis === 'annual' ? parsedTurnover : turnoverBasis === 'monthly' ? parsedTurnover * 12 : 0;
      const monthlyRevenue =
        turnoverBasis === 'monthly' ? parsedTurnover : turnoverBasis === 'annual' ? Math.round(parsedTurnover / 12) : 0;

      // Build benefits summary
      let benefitsSummary = '';
      if (oppType === 'loan' || oppType === 'agricultural_loan') {
        const rateDesc = interestRateStructure === 'assessed' ? 'Risk-based rate' : `${parsedRate}% Annual Rate`;
        const termDesc =
          repaymentTermType === 'single'
            ? `${parsedTerm} mos term`
            : `${minTermMonths} - ${maxTermMonths} mos term`;
        const graceDesc = parsedGrace > 0 ? `, ${parsedGrace} mos grace` : '';
        benefitsSummary = `${rateDesc}, ${termDesc}${graceDesc}. Repayment: ${repaymentFrequency}.`;
      } else if (oppType === 'grant') {
        benefitsSummary = `100% equity-free matching subsidy. Impact: ${grantImpact}.`;
      } else if (oppType === 'guarantee') {
        benefitsSummary = `${guaranteeCoverage}% credit risk coverage backing commercial borrowing.`;
      } else {
        benefitsSummary = `${oppCategory} designed for enterprise scaling and accessible operations.`;
      }

      // Filter required docs list for backward compatibility
      const requiredDocsList = documentDossier
        .filter((d) => d.status === 'Required')
        .map((d) => d.name);

      const resolvedPurpose = financingPurpose === 'Other' ? customPurpose.trim() : financingPurpose;
      const finalDeadline = isRollingDeadline || !deadline ? '2026-12-31' : deadline;

      const payload = {
        title: title.trim(),
        institution: provider.trim(),
        category: oppCategory || 'Loan',
        description: description.trim() + (additionalTerms ? `\n\n### Additional Terms & Conditions\n${additionalTerms}` : ''),
        benefits: benefitsSummary,
        deadline: finalDeadline,
        maxFunding: formattedMaxFunding,
        sectors: selectedSectors.length > 0 ? selectedSectors : ['All Sectors'],
        minAge: parseInt(minOperatingAge, 10) || 0,
        minRevenue: annualRevenue,
        minHealthScore: parseInt(minHealthScore, 10) || 0,
        minReadinessScore: parseInt(minReadinessScore, 10) || 0,
        registrationRequired: legalStructures.length > 0,
        taxCompliance: documentDossier.some(
          (d) => d.name.toLowerCase().includes('tax') && d.status === 'Required'
        ),
        collateralRequired: collateralRequirement === 'required',
        requiredDocs: requiredDocsList,
        guideDocument: guideDoc || (guideDocUrlInput.trim() ? {
          name: guideDocNameInput.trim() || 'Official Program Guide',
          url: guideDocUrlInput.trim(),
          type: 'application/pdf',
          size: 0,
          uploadedAt: new Date().toISOString()
        } : null),
        videoUrl: videoUrlInput.trim() || null,
        metadata: {
          bannerImage: bannerImage || null,
          imageUrl: bannerImage || null,
          guideDocument: guideDoc || (guideDocUrlInput.trim() ? {
            name: guideDocNameInput.trim() || 'Official Program Guide',
            url: guideDocUrlInput.trim(),
            type: 'application/pdf',
            size: 0,
            uploadedAt: new Date().toISOString()
          } : null),
          videoUrl: videoUrlInput.trim() || null,
          financingPurpose: resolvedPurpose,
          loanStructure: interestRateStructure,
          loanRate: parsedRate,
          repaymentTermType,
          repaymentTermMin: parseInt(minTermMonths, 10) || 6,
          repaymentTermMax: parseInt(maxTermMonths, 10) || 36,
          loanTerm: parsedTerm,
          repaymentFrequency,
          gracePeriodMonths: parsedGrace,
          collateralRequirement,
          collateralDescription: collateralRequirement === 'required' ? collateralDescription.trim() : '',
          collateralType: collateralRequirement === 'required' ? collateralDescription.trim() : '',
          loanMinAmt: parsedMinAmount,
          loanMaxAmt: parsedMaxAmount,
          additionalFees: additionalFees.trim(),
          additionalConditions: additionalConditions.trim(),
          legalStructures,
          turnoverBasis,
          turnoverAmount: parsedTurnover,
          minMonthlyRevenue: monthlyRevenue,
          minAnnualRevenue: annualRevenue,
          minOperatingAge: parseInt(minOperatingAge, 10) || 0,
          otherEligibility: otherEligibility.trim(),
          locations: selectedLocations,
          advancedMatching: {
            minReadinessScore: parseInt(minReadinessScore, 10) || 0,
            minHealthScore: parseInt(minHealthScore, 10) || 0,
            minEmployees: minEmployees ? parseInt(minEmployees, 10) : null,
            maxDebtToRevenue: maxDebtToRevenue ? parseFloat(maxDebtToRevenue) : null,
            matchingModes
          },
          documentDossier,
          applicationMethod: {
            type: applicationMethod,
            externalUrl: externalUrl.trim(),
            contactPerson: contactPerson.trim(),
            contactEmail: contactEmail.trim(),
            contactPhone: contactPhone.trim(),
            branchInstructions: branchInstructions.trim(),
            instructions: applicationInstructions.trim()
          },
          targetStage,
          isRollingDeadline
        }
      };

      await onPublish(payload);
      localStorage.removeItem(draftKey);
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for sector filtering
  const filteredSectorsList = useMemo(() => {
    if (!sectorSearchQuery.trim()) return DEFAULT_SECTORS;
    const q = sectorSearchQuery.toLowerCase();
    return DEFAULT_SECTORS.filter((s) => s.toLowerCase().includes(q));
  }, [sectorSearchQuery]);

  // Helper for Rwanda location hierarchy toggling
  const handleToggleProvince = (provinceName: string, districts: string[]) => {
    const isProvinceSelected = selectedLocations.includes(provinceName);
    if (isProvinceSelected) {
      setSelectedLocations((prev) =>
        prev.filter((loc) => loc !== provinceName && !districts.includes(loc))
      );
    } else {
      setSelectedLocations((prev) => Array.from(new Set([...prev, provinceName, ...districts])));
    }
    clearError('locations');
  };

  const handleToggleDistrict = (provinceName: string, districtName: string, provinceDistricts: string[]) => {
    const isDistrictSelected = selectedLocations.includes(districtName);
    let next: string[];
    if (isDistrictSelected) {
      next = selectedLocations.filter((loc) => loc !== districtName);
    } else {
      next = [...selectedLocations, districtName];
    }
    const allDistrictsSelected = provinceDistricts.every((d) =>
      d === districtName ? !isDistrictSelected : next.includes(d)
    );
    if (allDistrictsSelected && !next.includes(provinceName)) {
      next.push(provinceName);
    }
    setSelectedLocations(next);
    clearError('locations');
  };

  // Definition of the 6 Tabs
  const wizardTabs = [
    { id: 1, label: '1. Basic Info', fullLabel: 'Basic Information', icon: <Info className="w-4 h-4" /> },
    { id: 2, label: '2. Loan Terms', fullLabel: 'Loan Terms & Pricing', icon: <DollarSign className="w-4 h-4" /> },
    { id: 3, label: '3. Eligibility', fullLabel: 'Eligibility Requirements', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 4, label: '4. Documents', fullLabel: 'Required Documents', icon: <FileText className="w-4 h-4" /> },
    { id: 5, label: '5. Guide Accessories', fullLabel: 'Guide Document & Video Walkthrough', icon: <Video className="w-4 h-4" /> },
    { id: 6, label: '6. Review & Publish', fullLabel: 'Process & Review', icon: <CheckCircle2 className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#181818] font-sans pb-24">
      {/* Top Fixed App Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#e5e7eb] px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDiscardModal(true)}
              className="p-1.5 rounded-md text-[#5e5e5e] hover:text-[#181818] hover:bg-[#f3f4f6] transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-[#181818]">
                  {isEditMode ? 'Edit Published Opportunity' : 'Publish Loan Opportunity'}
                </h1>
                <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-[#2998d6] border border-sky-200">
                  {oppCategory || 'Loan'}
                </span>
              </div>
              <p className="text-[12px] text-[#5e5e5e]">
                {wizardTabs[activeTab - 1].fullLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {draftSavedAt && (
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-[#057642] font-medium bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                <Check className="w-3.5 h-3.5" />
                Draft saved at {draftSavedAt}
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#d1d5db] bg-white hover:bg-[#f9fafb] text-xs font-semibold text-[#374151] transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-[#5e5e5e]" />
              <span className="hidden sm:inline">Save Draft</span>
            </button>
            <button
              type="button"
              onClick={onChangeType}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#d1d5db] bg-white hover:bg-[#f9fafb] text-xs font-semibold text-[#374151] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#5e5e5e]" />
              <span className="hidden sm:inline">Change Type</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Tabbed Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 pt-6">
        {/* Navigation Tabs Bar */}
        <div className="bg-white border border-[#e5e7eb] rounded-lg p-1.5 shadow-xs mb-6 overflow-x-auto">
          <div className="flex items-center space-x-1 min-w-max">
            {wizardTabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#2998d6] text-white shadow-xs'
                      : 'text-[#5e5e5e] hover:text-[#181818] hover:bg-[#f3f4f6]'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-[#2998d6]'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: BASIC INFORMATION */}
        {/* ==================================================================== */}
        {activeTab === 1 && (
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-[#e5e7eb] pb-4">
              <h2 className="text-base font-bold text-[#181818]">Basic Opportunity Details</h2>
              <p className="text-xs text-[#5e5e5e] mt-0.5">
                Provide the core identification, purpose, and targeted sectors for this credit product.
              </p>
            </div>

            <div className="space-y-6">
              {/* 1. Opportunity Title */}
              <div>
                <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                  Opportunity Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    clearError('title');
                  }}
                  placeholder="e.g. SME Working Capital & Inventory Line"
                  className={`w-full h-10 px-3.5 rounded-md border text-xs font-medium text-[#181818] bg-white outline-none transition-colors ${
                    errors.title
                      ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                      : 'border-[#d1d5db] focus:border-[#2998d6] focus:ring-1 focus:ring-[#2998d6]'
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.title}
                  </p>
                )}
              </div>

              {/* 2. Offering Financial Institution & Purpose */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                    Offering Financial Institution / Provider <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      clearError('provider');
                    }}
                    className={`w-full h-10 px-3.5 rounded-md border text-xs font-medium text-[#181818] bg-white outline-none transition-colors ${
                      errors.provider
                        ? 'border-red-500'
                        : 'border-[#d1d5db] focus:border-[#2998d6] focus:ring-1 focus:ring-[#2998d6]'
                    }`}
                  />
                  {errors.provider && (
                    <p className="mt-1 text-xs text-red-600">{errors.provider}</p>
                  )}
                </div>

                {/* Financing Purpose */}
                <div>
                  <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                    Financing Purpose <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={financingPurpose}
                    onChange={(e) => {
                      setFinancingPurpose(e.target.value);
                      clearError('customPurpose');
                    }}
                    className="w-full h-10 px-3 rounded-md border border-[#d1d5db] text-xs font-medium text-[#181818] bg-white outline-none focus:border-[#2998d6] focus:ring-1 focus:ring-[#2998d6]"
                  >
                    <option value="Working capital and inventory">Working capital and inventory</option>
                    <option value="Machinery and equipment financing">Machinery and equipment financing</option>
                    <option value="Invoice financing">Invoice financing / factoring</option>
                    <option value="Trade finance">Trade finance &amp; Letters of Credit</option>
                    <option value="Agricultural input and harvest finance">Agricultural input &amp; harvest finance</option>
                    <option value="Other">Other financing purpose...</option>
                  </select>
                </div>
              </div>

              {/* Conditional Custom Purpose input */}
              {financingPurpose === 'Other' && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                    Specify Custom Financing Purpose <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customPurpose}
                    onChange={(e) => {
                      setCustomPurpose(e.target.value);
                      clearError('customPurpose');
                    }}
                    placeholder="e.g. Green Transition and Solar Energy Installation"
                    className="w-full h-9 px-3 rounded border border-[#d1d5db] text-xs bg-white focus:border-[#2998d6] outline-none"
                  />
                  {errors.customPurpose && (
                    <p className="mt-1 text-xs text-red-600">{errors.customPurpose}</p>
                  )}
                </div>
              )}

              {/* 3. Visual WYSIWYG Opportunity Description Editor (Full Width) */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#181818]">
                      Opportunity Description <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-[#6b7280]">
                      Format text visually in real-time. Use tools below to apply bold, headings, and lists.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={insertTemplate}
                      className="bg-white hover:bg-sky-50 border border-sky-200 text-[#2998d6] px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-Fill Template</span>
                    </button>
                    {description && (
                      <button
                        type="button"
                        onClick={() => {
                          setDescription('');
                          if (editorRef.current) editorRef.current.innerHTML = '';
                        }}
                        className="text-gray-500 hover:text-red-600 text-xs px-2 py-1 rounded transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className={`border rounded-lg overflow-hidden bg-white transition-all ${
                    errors.description
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-[#d1d5db] focus-within:border-[#2998d6] focus-within:ring-1 focus-within:ring-[#2998d6]'
                  }`}
                >
                  {/* WYSIWYG Formatting Toolbar */}
                  <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-3 py-2 flex flex-wrap items-center gap-1 text-xs">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('bold')}
                      className="p-1.5 hover:bg-white rounded text-[#374151] hover:text-[#181818] border border-transparent hover:border-gray-200 transition-colors"
                      title="Bold (Select text & click)"
                    >
                      <Bold className="w-4 h-4 font-bold" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('italic')}
                      className="p-1.5 hover:bg-white rounded text-[#374151] hover:text-[#181818] border border-transparent hover:border-gray-200 transition-colors"
                      title="Italic (Select text & click)"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('underline')}
                      className="p-1.5 hover:bg-white rounded text-[#374151] hover:text-[#181818] border border-transparent hover:border-gray-200 transition-colors"
                      title="Underline (Select text & click)"
                    >
                      <Underline className="w-4 h-4" />
                    </button>

                    <div className="h-4 w-px bg-gray-300 mx-1" />

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('formatBlock', '<h3>')}
                      className="p-1.5 hover:bg-white rounded text-[#374151] hover:text-[#181818] border border-transparent hover:border-gray-200 transition-colors flex items-center gap-1"
                      title="Section Heading (H3)"
                    >
                      <Heading3 className="w-4 h-4 text-[#2998d6]" />
                      <span className="text-[11px] font-bold">Heading</span>
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('insertUnorderedList')}
                      className="p-1.5 hover:bg-white rounded text-[#374151] hover:text-[#181818] border border-transparent hover:border-gray-200 transition-colors flex items-center gap-1"
                      title="Bullet List"
                    >
                      <List className="w-4 h-4 text-[#2998d6]" />
                      <span className="text-[11px] font-medium hidden sm:inline">Bullets</span>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('insertOrderedList')}
                      className="p-1.5 hover:bg-white rounded text-[#374151] hover:text-[#181818] border border-transparent hover:border-gray-200 transition-colors flex items-center gap-1"
                      title="Numbered List"
                    >
                      <ListOrdered className="w-4 h-4 text-[#2998d6]" />
                      <span className="text-[11px] font-medium hidden sm:inline">Numbered</span>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={insertCallout}
                      className="p-1.5 hover:bg-white rounded text-[#374151] hover:text-[#181818] border border-transparent hover:border-gray-200 transition-colors flex items-center gap-1"
                      title="Insert Note / Callout Box"
                    >
                      <Quote className="w-4 h-4 text-emerald-600" />
                      <span className="text-[11px] font-medium">Note Box</span>
                    </button>

                    <div className="h-4 w-px bg-gray-300 mx-1" />

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('removeFormat')}
                      className="p-1.5 hover:bg-white rounded text-gray-500 hover:text-gray-800 border border-transparent hover:border-gray-200 transition-colors"
                      title="Clear Formatting from selection"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* ContentEditable Visual WYSIWYG Canvas */}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    onBlur={handleEditorInput}
                    onPaste={handleEditorPaste}
                    className="w-full p-4 text-xs sm:text-sm text-[#181818] leading-relaxed outline-none font-sans min-h-[260px] max-h-[520px] overflow-y-auto bg-white [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-[#181818] [&_h3]:mt-3.5 [&_h3]:mb-1.5 [&_h3]:border-b [&_h3]:border-gray-100 [&_h3]:pb-1 [&_p]:my-1.5 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:list-item [&_li]:my-1 [&_blockquote]:border-l-3 [&_blockquote]:border-[#2998d6] [&_blockquote]:bg-sky-50/60 [&_blockquote]:p-2.5 [&_blockquote]:my-2 [&_blockquote]:rounded-r [&_blockquote]:text-[#0369a1] [&_blockquote]:italic"
                    style={{ minHeight: '260px' }}
                  />

                  {/* Live Status Bar */}
                  <div className="bg-[#f9fafb] border-t border-[#e5e7eb] px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-[#6b7280]">
                    <span>Visual Formatting: Live styled in-place.</span>
                    <span className="font-mono font-semibold text-gray-700">
                      {editorRef.current?.innerText
                        ? `${editorRef.current.innerText.trim().split(/\s+/).filter(Boolean).length} words · ${editorRef.current.innerText.length} chars`
                        : '0 words'}
                    </span>
                  </div>
                </div>
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600">{errors.description}</p>
                )}
              </div>

              {/* 4. Optional Opportunity Cover / Banner Image Upload (Under Description) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-[#181818]">
                      Opportunity Cover / Banner Image{' '}
                      <span className="text-gray-400 font-normal text-[11px]">(Optional)</span>
                    </label>
                    <span className="text-[11px] text-[#6b7280]">
                      Attach a promotional banner or facility cover image to display on SME discovery feeds.
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 hidden sm:inline">Recommended: 1200×600px • Max 5MB</span>
                </div>

                {!bannerImage ? (
                  <div
                    onDragOver={handleImageDragOver}
                    onDragLeave={handleImageDragLeave}
                    onDrop={handleImageDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-5 sm:p-6 text-center cursor-pointer transition-all ${
                      isDraggingImage
                        ? 'border-[#2998d6] bg-sky-50/70 scale-[0.99]'
                        : 'border-gray-300 hover:border-[#2998d6] bg-[#fafafa] hover:bg-[#f0f9ff]/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                      onChange={handleImageInputChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-sky-50 text-[#2998d6] flex items-center justify-center mx-auto mb-2 border border-sky-100 shadow-2xs">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-semibold text-gray-800 mb-0.5">
                      <span className="text-[#2998d6] hover:underline font-bold">Click to upload banner image</span> or drag and drop
                    </div>
                    <p className="text-[11px] text-gray-500">
                      PNG, JPG, or WEBP up to 5MB (1200×600px recommended)
                    </p>
                  </div>
                ) : (
                  <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50 group">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                      onChange={handleImageInputChange}
                      className="hidden"
                    />
                    <div className="relative w-full h-44 sm:h-52 bg-slate-900 overflow-hidden flex items-center justify-center">
                      <img
                        src={bannerImage}
                        alt="Opportunity Banner Preview"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/25 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
                        <span className="bg-white/95 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs border border-gray-200/80 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-[#2998d6]" />
                          <span>Cover Banner Attached</span>
                        </span>
                      </div>

                      {/* Top Right Action Buttons */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="px-2.5 py-1 bg-white/95 hover:bg-white text-slate-800 text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#2998d6]" />
                          <span>Replace</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBannerImage(null);
                          }}
                          className="p-1 bg-white/95 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-md shadow-xs transition-colors cursor-pointer"
                          title="Remove image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Bottom Image Caption */}
                      <div className="absolute bottom-2.5 left-3 right-3 text-white text-xs font-medium truncate drop-shadow-sm">
                        {title ? title : 'Opportunity Banner Preview'}
                      </div>
                    </div>

                    {/* Image footer status strip */}
                    <div className="p-2.5 bg-white border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Cover photo ready for publication</span>
                      <span className="text-[#057642] font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Attached
                      </span>
                    </div>
                  </div>
                )}

                {imageError && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5" /> {imageError}
                  </p>
                )}
              </div>

              {/* Optional Expandable Additional Terms and Conditions */}
              <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setShowTermsSection(!showTermsSection)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold text-[#374151] hover:bg-gray-100/70 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#5e5e5e]" />
                    <span>Additional Terms, Covenants &amp; Conditions (Optional)</span>
                  </div>
                  {showTermsSection ? (
                    <ChevronUp className="w-4 h-4 text-[#5e5e5e]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#5e5e5e]" />
                  )}
                </button>

                {showTermsSection && (
                  <div className="p-4 bg-white border-t border-gray-200 space-y-2 animate-in fade-in duration-150">
                    <p className="text-[11px] text-[#6b7280]">
                      Include any special clauses, disbursement milestones, audit covenants, or insurance requirements.
                    </p>
                    <textarea
                      rows={4}
                      value={additionalTerms}
                      onChange={(e) => setAdditionalTerms(e.target.value)}
                      placeholder="• Borrower must maintain active digital bookkeeping on Elevata&#10;• Quarterly monitoring report required&#10;• Facility disbursed in two tranches upon milestone verification..."
                      className="w-full p-3 rounded-md border border-[#d1d5db] text-xs text-[#181818] bg-white outline-none focus:border-[#2998d6]"
                    />
                  </div>
                )}
              </div>

              {/* 5. Eligible Business Sectors (Searchable Multi-Select) */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#181818]">
                      Eligible Business Sectors <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-[#6b7280]">
                      SMEs in matching sectors will be highlighted and notified.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-[#2998d6] bg-sky-50 px-2 py-0.5 rounded text-[11px]">
                      {selectedSectors.length} selected
                    </span>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSectors([...DEFAULT_SECTORS]);
                        clearError('sectors');
                      }}
                      className="text-xs font-medium text-[#2998d6] hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedSectors([])}
                      className="text-xs font-medium text-gray-500 hover:text-gray-800"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Compact Search Bar for Sectors */}
                <div className="relative mb-2.5">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={sectorSearchQuery}
                    onChange={(e) => setSectorSearchQuery(e.target.value)}
                    placeholder="Search sectors (e.g. Agriculture, Retail, Tech)..."
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-md border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2998d6] outline-none"
                  />
                </div>

                {/* Sector Pills Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50/50 border border-gray-200 rounded-md">
                  {filteredSectorsList.map((sec) => {
                    const isSelected = selectedSectors.includes(sec);
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSectors((prev) => prev.filter((s) => s !== sec));
                          } else {
                            setSelectedSectors((prev) => [...prev, sec]);
                          }
                          clearError('sectors');
                        }}
                        className={`flex items-center justify-between p-2 rounded text-xs text-left transition-all border ${
                          isSelected
                            ? 'bg-white border-[#2998d6] text-[#2998d6] font-semibold shadow-2xs'
                            : 'bg-white border-gray-200 text-[#4b5563] hover:border-gray-300'
                        }`}
                      >
                        <span className="truncate pr-1">{sec}</span>
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 shrink-0 text-[#2998d6]" />
                        ) : (
                          <Square className="w-3.5 h-3.5 shrink-0 text-gray-300" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {errors.sectors && (
                  <p className="mt-1 text-xs text-red-600">{errors.sectors}</p>
                )}
              </div>

              {/* 6. Eligible Geographical Locations (Searchable Hierarchical Selector) */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#181818]">
                      Eligible Geographical Locations <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-[#6b7280]">
                      Selecting a province includes all its districts. You can also exclude specific districts.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-[#2998d6] bg-sky-50 px-2 py-0.5 rounded text-[11px]">
                      {selectedLocations.length} locations
                    </span>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        const all = RWANDA_GEOGRAPHY.flatMap((p) => [p.province, ...p.districts]);
                        setSelectedLocations(all);
                        clearError('locations');
                      }}
                      className="text-xs font-medium text-[#2998d6] hover:underline"
                    >
                      All Rwanda
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedLocations([])}
                      className="text-xs font-medium text-gray-500 hover:text-gray-800"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Location Search */}
                <div className="relative mb-2.5">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    placeholder="Search province or district (e.g. Kigali, Musanze, Huye)..."
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-md border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2998d6] outline-none"
                  />
                </div>

                {/* Hierarchical Accordions for Provinces & Districts */}
                <div className="space-y-2 border border-gray-200 rounded-md p-2 bg-gray-50/40 max-h-64 overflow-y-auto">
                  {RWANDA_GEOGRAPHY.map((geo) => {
                    const isProvinceActive = selectedLocations.includes(geo.province);
                    const matchingDistricts = geo.districts.filter((d) =>
                      locationSearchQuery
                        ? d.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
                          geo.province.toLowerCase().includes(locationSearchQuery.toLowerCase())
                        : true
                    );

                    if (locationSearchQuery && matchingDistricts.length === 0) return null;

                    const selectedCountInProvince = geo.districts.filter((d) =>
                      selectedLocations.includes(d)
                    ).length;

                    return (
                      <div key={geo.province} className="bg-white border border-gray-200 rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isProvinceActive || selectedCountInProvince === geo.districts.length}
                              onChange={() => handleToggleProvince(geo.province, geo.districts)}
                              className="w-4 h-4 rounded text-[#2998d6] accent-[#2998d6] cursor-pointer"
                            />
                            <span className="text-xs font-bold text-[#181818]">
                              {geo.province}
                            </span>
                          </label>
                          <span className="text-[11px] text-[#6b7280]">
                            {selectedCountInProvince} of {geo.districts.length} districts
                          </span>
                        </div>

                        {/* Districts Pills */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-gray-100">
                          {geo.districts.map((district) => {
                            const isDistSelected = selectedLocations.includes(district);
                            return (
                              <button
                                key={district}
                                type="button"
                                onClick={() =>
                                  handleToggleDistrict(geo.province, district, geo.districts)
                                }
                                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors border ${
                                  isDistSelected
                                    ? 'bg-sky-50 text-[#2998d6] border-[#2998d6]/30 font-semibold'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {isDistSelected ? '✓ ' : ''}
                                {district}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {errors.locations && (
                  <p className="mt-1 text-xs text-red-600">{errors.locations}</p>
                )}
              </div>

              {/* 7. Target Stage & Application Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                    Target Business Stage (Optional)
                  </label>
                  <select
                    value={targetStage}
                    onChange={(e) => setTargetStage(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-[#d1d5db] text-xs font-medium text-[#181818] bg-white outline-none focus:border-[#2998d6]"
                  >
                    <option value="All Stages">All Business Stages</option>
                    <option value="Early Stage (0-2 Years)">Early Stage (0 - 2 Years)</option>
                    <option value="Growth & Expansion Stage">Growth &amp; Expansion Stage</option>
                    <option value="Established & Mature">Mature / Established Entity</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#181818]">
                      Application Deadline (Optional)
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-[#5e5e5e] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRollingDeadline}
                        onChange={(e) => {
                          setIsRollingDeadline(e.target.checked);
                          if (e.target.checked) setDeadline('');
                        }}
                        className="w-3.5 h-3.5 accent-[#2998d6]"
                      />
                      <span>Continuous / Rolling</span>
                    </label>
                  </div>

                  {!isRollingDeadline ? (
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-[#d1d5db] text-xs text-[#181818] bg-white outline-none focus:border-[#2998d6]"
                    />
                  ) : (
                    <div className="h-10 px-3 rounded-md border border-gray-200 bg-gray-50 flex items-center text-xs text-gray-500">
                      Applications open continuously with no fixed cutoff date
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: LOAN TERMS */}
        {/* ==================================================================== */}
        {activeTab === 2 && (
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-[#e5e7eb] pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-[#181818]">Financial Terms &amp; Conditions</h2>
                <p className="text-xs text-[#5e5e5e] mt-0.5">
                  Define loan amounts, pricing structure, repayment schedules, and security requirements.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#2998d6] bg-sky-50 px-2.5 py-1 rounded">
                Currency: RWF
              </span>
            </div>

            <div className="space-y-6">
              {/* 1. Loan Amount Range (RWF) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                    Minimum Loan Amount (RWF) <span className="text-[#6b7280] font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={minAmount}
                      onChange={(e) => {
                        setMinAmount(e.target.value);
                        clearError('maxAmount');
                      }}
                      placeholder="e.g. 1000000"
                      className="w-full h-10 px-3 rounded-md border border-[#d1d5db] text-xs font-mono text-[#181818] bg-white outline-none focus:border-[#2998d6]"
                    />
                  </div>
                  {minAmount && Number(minAmount) > 0 && (
                    <p className="mt-1 text-[11px] text-[#057642] font-medium">
                      {formatRWF(Number(minAmount))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                    Maximum Loan Amount (RWF) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={maxAmount}
                      onChange={(e) => {
                        setMaxAmount(e.target.value);
                        clearError('maxAmount');
                      }}
                      placeholder="e.g. 25000000"
                      className={`w-full h-10 px-3 rounded-md border text-xs font-mono text-[#181818] bg-white outline-none transition-colors ${
                        errors.maxAmount
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#d1d5db] focus:border-[#2998d6]'
                      }`}
                    />
                  </div>
                  {maxAmount && Number(maxAmount) > 0 && (
                    <p className="mt-1 text-[11px] text-[#2998d6] font-medium">
                      Up to {formatRWF(Number(maxAmount))}
                    </p>
                  )}
                  {errors.maxAmount && (
                    <p className="mt-1 text-xs text-red-600">{errors.maxAmount}</p>
                  )}
                </div>
              </div>

              {/* 2. Interest Rate Structure & Percentage */}
              <div className="p-4 bg-gray-50/60 border border-gray-200 rounded-md space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#181818] mb-2">
                    Interest Rate Pricing Structure <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'fixed', label: 'Fixed Rate', desc: 'Pre-set annual rate' },
                      { id: 'variable', label: 'Variable Rate', desc: 'Tied to benchmark index' },
                      { id: 'assessed', label: 'Individually Assessed', desc: 'Risk-based pricing' }
                    ].map((struct) => (
                      <button
                        key={struct.id}
                        type="button"
                        onClick={() => {
                          setInterestRateStructure(struct.id as any);
                          clearError('interestRate');
                        }}
                        className={`p-3 rounded-md border text-left transition-all ${
                          interestRateStructure === struct.id
                            ? 'bg-white border-[#2998d6] text-[#2998d6] ring-1 ring-[#2998d6] shadow-2xs'
                            : 'bg-white border-gray-200 text-[#374151] hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{struct.label}</div>
                        <div className="text-[11px] text-[#6b7280] mt-0.5">{struct.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditionally Display Interest Rate % */}
                {interestRateStructure !== 'assessed' && (
                  <div className="max-w-xs animate-in fade-in duration-150">
                    <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                      {interestRateStructure === 'fixed' ? 'Annual Fixed Rate (%)' : 'Indicative Benchmark Rate (%)'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={interestRate}
                        onChange={(e) => {
                          setInterestRate(e.target.value);
                          clearError('interestRate');
                        }}
                        placeholder="e.g. 14.5"
                        className="w-full h-10 px-3 pr-8 rounded-md border border-[#d1d5db] text-xs font-mono text-[#181818] bg-white outline-none focus:border-[#2998d6]"
                      />
                      <span className="absolute right-3 top-3 text-xs text-gray-500 font-bold">%</span>
                    </div>
                    {errors.interestRate && (
                      <p className="mt-1 text-xs text-red-600">{errors.interestRate}</p>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Repayment Period & Structure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#181818]">
                      Repayment Period (Months) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setRepaymentTermType('single')}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          repaymentTermType === 'single'
                            ? 'bg-[#2998d6] text-white font-bold'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        Single Term
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepaymentTermType('range')}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          repaymentTermType === 'range'
                            ? 'bg-[#2998d6] text-white font-bold'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        Min - Max Range
                      </button>
                    </div>
                  </div>

                  {repaymentTermType === 'single' ? (
                    <div>
                      <input
                        type="number"
                        value={singleTermMonths}
                        onChange={(e) => {
                          setSingleTermMonths(e.target.value);
                          clearError('singleTermMonths');
                        }}
                        placeholder="e.g. 24"
                        className="w-full h-10 px-3 rounded-md border border-[#d1d5db] text-xs font-mono text-[#181818] bg-white outline-none focus:border-[#2998d6]"
                      />
                      <span className="text-[11px] text-[#6b7280] mt-1 block">
                        Standard duration: {singleTermMonths || 0} months ({Math.round(((Number(singleTermMonths) || 0) / 12) * 10) / 10} years)
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="number"
                          value={minTermMonths}
                          onChange={(e) => setMinTermMonths(e.target.value)}
                          placeholder="Min (e.g. 6)"
                          className="w-full h-10 px-3 rounded-md border border-[#d1d5db] text-xs font-mono text-[#181818] bg-white outline-none focus:border-[#2998d6]"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={maxTermMonths}
                          onChange={(e) => {
                            setMaxTermMonths(e.target.value);
                            clearError('maxTermMonths');
                          }}
                          placeholder="Max (e.g. 36)"
                          className="w-full h-10 px-3 rounded-md border border-[#d1d5db] text-xs font-mono text-[#181818] bg-white outline-none focus:border-[#2998d6]"
                        />
                      </div>
                    </div>
                  )}
                  {errors.maxTermMonths && (
                    <p className="mt-1 text-xs text-red-600">{errors.maxTermMonths}</p>
                  )}
                </div>

                {/* 4. Grace Period */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#181818]">
                      Grace Period (Months)
                    </label>
                    <button
                      type="button"
                      onClick={() => setGracePeriodMonths('0')}
                      className={`text-[11px] font-medium ${
                        gracePeriodMonths === '0' ? 'text-[#2998d6] font-bold' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      No Grace Period (0 mos)
                    </button>
                  </div>
                  <input
                    type="number"
                    value={gracePeriodMonths}
                    onChange={(e) => setGracePeriodMonths(e.target.value)}
                    placeholder="e.g. 2"
                    className="w-full h-10 px-3 rounded-md border border-[#d1d5db] text-xs font-mono text-[#181818] bg-white outline-none focus:border-[#2998d6]"
                  />
                  <span className="text-[11px] text-[#6b7280] mt-1 block">
                    {Number(gracePeriodMonths) > 0
                      ? `${gracePeriodMonths} months principal deferral before amortisation`
                      : 'Repayment commences immediately in month 1'}
                  </span>
                </div>
              </div>

              {/* 5. Collateral & Repayment Frequency */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                      Collateral Requirement <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'required', label: 'Required' },
                        { id: 'not_required', label: 'Not Required' },
                        { id: 'assessed', label: 'Subject to Assessment' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setCollateralRequirement(item.id as any);
                            clearError('collateralDescription');
                          }}
                          className={`p-2 rounded-md border text-center text-xs transition-colors cursor-pointer ${
                            collateralRequirement === item.id
                              ? 'bg-sky-50 border-[#2998d6] text-[#2998d6] font-bold ring-1 ring-[#2998d6]'
                              : 'bg-white border-gray-200 text-[#4b5563] hover:bg-gray-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                      Repayment Frequency
                    </label>
                    <select
                      value={repaymentFrequency}
                      onChange={(e) => setRepaymentFrequency(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-[#d1d5db] text-xs font-medium text-[#181818] bg-white outline-none focus:border-[#2998d6]"
                    >
                      <option value="Monthly">Monthly Amortisation</option>
                      <option value="Quarterly">Quarterly Amortisation</option>
                      <option value="Semi-Annually">Semi-Annually</option>
                      <option value="Annually">Annually</option>
                      <option value="Seasonal / Post-Harvest">Seasonal / Post-Harvest</option>
                      <option value="Bullet at Maturity">Bullet / Lump Sum at Maturity</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Collateral Requirement Description Textarea */}
                {collateralRequirement === 'required' && (
                  <div className="p-4 bg-sky-50/30 border border-sky-200/90 rounded-lg space-y-3 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <label className="block text-xs font-bold text-[#181818]">
                          Collateral Requirement Description <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-[#5e5e5e]">
                          Describe acceptable pledged assets, maximum LTV ratios, valuation, or guarantee terms.
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-gray-500">
                        {collateralDescription.trim()
                          ? `${collateralDescription.trim().split(/\s+/).filter(Boolean).length} words · ${collateralDescription.length} chars`
                          : '0 words'}
                      </span>
                    </div>

                    {/* Quick Rwanda Collateral Presets */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-gray-600 block">
                        Quick Preset Suggestions (Click to add):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Registered Real Estate Title Deed (UPI with clear search certificate)',
                          'Registered Motor Vehicle Logbook (<= 7 years old, comprehensive insurance)',
                          '100% Lien on Fixed Term Cash Deposit / Treasury Bill',
                          'Corporate / Director Personal Guarantee with Net Worth Statement',
                          'Pledge on Accounts Receivable / Confirmed Purchase Orders',
                          'Lien on Equipment / Machinery with Insurance Assignment'
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setCollateralDescription((prev) => {
                                const trimmed = prev.trim();
                                if (!trimmed) return preset;
                                if (trimmed.includes(preset)) return trimmed;
                                return `${trimmed}\n• ${preset}`;
                              });
                              clearError('collateralDescription');
                            }}
                            className="text-[11px] px-2.5 py-1 bg-white hover:bg-sky-50 text-gray-700 hover:text-[#2998d6] border border-gray-200 hover:border-sky-300 rounded-md font-medium transition-colors cursor-pointer shadow-2xs text-left"
                          >
                            + {preset.split('(')[0].trim()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={6}
                      value={collateralDescription}
                      onChange={(e) => {
                        setCollateralDescription(e.target.value);
                        clearError('collateralDescription');
                      }}
                      placeholder="Detail all acceptable collateral criteria, e.g.:&#10;• Registered commercial or residential property title deed (UPI) within Rwanda&#10;• Maximum Loan-to-Value (LTV) ratio of 75% based on an approved independent valuation&#10;• Original title deed deposited with the bank and registered at the Rwanda Land Management and Use Authority&#10;• Comprehensive fire and peril insurance assigned in favor of the lender"
                      className={`w-full p-3.5 rounded-lg border text-xs sm:text-sm text-[#181818] bg-white outline-none min-h-[160px] leading-relaxed transition-colors font-sans ${
                        errors.collateralDescription
                          ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                          : 'border-[#d1d5db] focus:border-[#2998d6] focus:ring-1 focus:ring-[#2998d6]'
                      }`}
                    />
                    {errors.collateralDescription && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-red-600 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.collateralDescription}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 6. Optional Additional Fees & Loan Conditions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                    Additional Fees or Charges (Optional)
                  </label>
                  <input
                    type="text"
                    value={additionalFees}
                    onChange={(e) => setAdditionalFees(e.target.value)}
                    placeholder="e.g. 1% arrangement fee, no early settlement penalty"
                    className="w-full h-10 px-3 rounded-md border border-[#d1d5db] text-xs text-[#181818] bg-white outline-none focus:border-[#2998d6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                    Special Loan Conditions / Eligibility Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={additionalConditions}
                    onChange={(e) => setAdditionalConditions(e.target.value)}
                    placeholder="e.g. Must have verified bank account in Rwanda"
                    className="w-full h-10 px-3 rounded-md border border-[#d1d5db] text-xs text-[#181818] bg-white outline-none focus:border-[#2998d6]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: ELIGIBILITY REQUIREMENTS */}
        {/* ==================================================================== */}
        {activeTab === 3 && (
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-[#e5e7eb] pb-4">
              <h2 className="text-base font-bold text-[#181818]">SME Eligibility Criteria</h2>
              <p className="text-xs text-[#5e5e5e] mt-0.5">
                Specify qualifying legal structures, turnover requirements, and matching rules.
              </p>
            </div>

            <div className="space-y-6">
              {/* 1. Legal Structures */}
              <div>
                <label className="block text-xs font-semibold text-[#181818] mb-2">
                  Permitted Business Legal Structures <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    'Sole Proprietorship',
                    'Registered Company (Ltd)',
                    'Cooperative / SACCO',
                    'Tech Startup / Partnership'
                  ].map((typeItem) => {
                    const isChecked = legalStructures.includes(typeItem);
                    return (
                      <button
                        key={typeItem}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setLegalStructures((prev) => prev.filter((t) => t !== typeItem));
                          } else {
                            setLegalStructures((prev) => [...prev, typeItem]);
                          }
                          clearError('legalStructures');
                        }}
                        className={`p-3 rounded-md border text-left text-xs transition-all flex items-center justify-between ${
                          isChecked
                            ? 'bg-sky-50 border-[#2998d6] text-[#2998d6] font-semibold'
                            : 'bg-white border-gray-200 text-[#4b5563] hover:border-gray-300'
                        }`}
                      >
                        <span>{typeItem}</span>
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#2998d6]" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-gray-300" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {errors.legalStructures && (
                  <p className="mt-1 text-xs text-red-600">{errors.legalStructures}</p>
                )}
              </div>

              {/* 2. Turnover Requirement */}
              <div className="p-4 bg-gray-50/60 border border-gray-200 rounded-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#181818]">
                      Turnover &amp; Revenue Requirement
                    </label>
                    <span className="text-[11px] text-[#6b7280]">
                      Define a minimum revenue threshold on either a monthly or annual basis.
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 p-1 bg-white border border-gray-200 rounded-md">
                    {(['monthly', 'annual', 'none'] as const).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setTurnoverBasis(b)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors capitalize ${
                          turnoverBasis === b
                            ? 'bg-[#2998d6] text-white shadow-2xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {b === 'none' ? 'No Requirement' : `${b} Basis`}
                      </button>
                    ))}
                  </div>
                </div>

                {turnoverBasis !== 'none' && (
                  <div className="max-w-md pt-1 animate-in fade-in duration-150">
                    <label className="block text-xs font-medium text-[#374151] mb-1">
                      Minimum {turnoverBasis === 'monthly' ? 'Monthly' : 'Annual'} Turnover (RWF)
                    </label>
                    <input
                      type="number"
                      value={turnoverAmount}
                      onChange={(e) => {
                        setTurnoverAmount(e.target.value);
                        clearError('turnoverAmount');
                      }}
                      placeholder="e.g. 2000000"
                      className="w-full h-10 px-3 rounded-md border border-[#d1d5db] text-xs font-mono text-[#181818] bg-white outline-none focus:border-[#2998d6]"
                    />
                    {turnoverAmount && Number(turnoverAmount) > 0 && (
                      <div className="mt-1 flex items-center justify-between text-[11px]">
                        <span className="text-[#057642] font-semibold">
                          {formatRWF(Number(turnoverAmount))} / {turnoverBasis === 'monthly' ? 'month' : 'year'}
                        </span>
                        <span className="text-[#6b7280]">
                          Equivalent to {formatRWF(turnoverBasis === 'monthly' ? Number(turnoverAmount) * 12 : Math.round(Number(turnoverAmount) / 12))} / {turnoverBasis === 'monthly' ? 'year' : 'month'}
                        </span>
                      </div>
                    )}
                    {errors.turnoverAmount && (
                      <p className="mt-1 text-xs text-red-600">{errors.turnoverAmount}</p>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Operating Age & Other Eligibility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                    Minimum Operating Age (Years) <span className="text-[#6b7280] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    value={minOperatingAge}
                    onChange={(e) => setMinOperatingAge(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full h-10 px-3 rounded-md border border-[#d1d5db] text-xs font-mono text-[#181818] bg-white outline-none focus:border-[#2998d6]"
                  />
                  <span className="text-[11px] text-[#6b7280] mt-1 block">
                    {Number(minOperatingAge) > 0
                      ? `Business must have operated for at least ${minOperatingAge} years`
                      : 'Open to new and early stage businesses'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                    Other Eligibility Conditions <span className="text-[#6b7280] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={otherEligibility}
                    onChange={(e) => setOtherEligibility(e.target.value)}
                    placeholder="e.g. Must have a dedicated physical trading premises"
                    className="w-full h-10 px-3 rounded-md border border-[#d1d5db] text-xs text-[#181818] bg-white outline-none focus:border-[#2998d6]"
                  />
                </div>
              </div>

              {/* 4. Sectors & Locations Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#181818] uppercase tracking-wide">
                    Targeted Sectors &amp; Locations Summary
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab(1)}
                    className="text-xs font-semibold text-[#2998d6] hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit in Tab 1</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium block">Sectors:</span>
                    <p className="text-gray-800 font-medium truncate mt-0.5">
                      {selectedSectors.slice(0, 3).join(', ')}
                      {selectedSectors.length > 3 ? ` +${selectedSectors.length - 3} more` : ''}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium block">Locations:</span>
                    <p className="text-gray-800 font-medium truncate mt-0.5">
                      {selectedLocations.slice(0, 4).join(', ')}
                      {selectedLocations.length > 4 ? ` +${selectedLocations.length - 4} more` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. Collapsible Advanced Matching Settings */}
              <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setShowAdvancedMatching(!showAdvancedMatching)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold text-[#374151] hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#2998d6]" />
                    <span>Advanced Matching Settings &amp; Thresholds (Optional)</span>
                  </div>
                  {showAdvancedMatching ? (
                    <ChevronUp className="w-4 h-4 text-[#5e5e5e]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#5e5e5e]" />
                  )}
                </button>

                {showAdvancedMatching && (
                  <div className="p-5 border-t border-gray-200 space-y-4 bg-gray-50/40 animate-in fade-in duration-150">
                    <p className="text-[11px] text-[#6b7280]">
                      These thresholds are optional. If left blank or set to 0, no artificial restriction is applied.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#374151] mb-1">
                          Min Loan Readiness Score (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={minReadinessScore}
                          onChange={(e) => setMinReadinessScore(e.target.value)}
                          placeholder="0"
                          className="w-full h-9 px-2.5 rounded border border-gray-300 text-xs font-mono bg-white outline-none focus:border-[#2998d6]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#374151] mb-1">
                          Min Business Health Score (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={minHealthScore}
                          onChange={(e) => setMinHealthScore(e.target.value)}
                          placeholder="0"
                          className="w-full h-9 px-2.5 rounded border border-gray-300 text-xs font-mono bg-white outline-none focus:border-[#2998d6]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#374151] mb-1">
                          Min Employee Count
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={minEmployees}
                          onChange={(e) => setMinEmployees(e.target.value)}
                          placeholder="Optional"
                          className="w-full h-9 px-2.5 rounded border border-gray-300 text-xs font-mono bg-white outline-none focus:border-[#2998d6]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#374151] mb-1">
                          Max Debt-to-Revenue (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={maxDebtToRevenue}
                          onChange={(e) => setMaxDebtToRevenue(e.target.value)}
                          placeholder="Optional"
                          className="w-full h-9 px-2.5 rounded border border-gray-300 text-xs font-mono bg-white outline-none focus:border-[#2998d6]"
                        />
                      </div>
                    </div>

                    {/* Matching Mode Selector */}
                    <div className="pt-2 border-t border-gray-200">
                      <label className="block text-xs font-semibold text-[#181818] mb-2">
                        Matching Engine Significance Modes
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { id: 'turnover', label: 'Turnover Threshold' },
                          { id: 'operatingAge', label: 'Operating Track Record' },
                          { id: 'readinessScore', label: 'Loan Readiness Score' },
                          { id: 'legalStructure', label: 'Legal Structure' }
                        ].map((crit) => (
                          <div
                            key={crit.id}
                            className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-md"
                          >
                            <span className="text-xs font-medium text-[#374151]">{crit.label}</span>
                            <div className="flex gap-1">
                              {(['Required', 'Preferred'] as const).map((mode) => (
                                <button
                                  key={mode}
                                  type="button"
                                  onClick={() =>
                                    setMatchingModes((prev) => ({ ...prev, [crit.id]: mode }))
                                  }
                                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
                                    matchingModes[crit.id] === mode
                                      ? mode === 'Required'
                                        ? 'bg-[#2998d6] text-white border-[#2998d6]'
                                        : 'bg-emerald-600 text-white border-emerald-600'
                                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                  }`}
                                >
                                  {mode}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: REQUIRED DOCUMENTS */}
        {/* ==================================================================== */}
        {activeTab === 4 && (
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-[#e5e7eb] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#181818]">Required Supporting Documents</h2>
                <p className="text-xs text-[#5e5e5e] mt-0.5">
                  Configure which verified verification documents the applicant SME must provide.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomDocInput(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#2998d6] text-xs font-semibold text-[#2998d6] bg-sky-50 hover:bg-sky-100 transition-colors self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Document</span>
              </button>
            </div>

            {/* Add Custom Document inline input */}
            {showCustomDocInput && (
              <div className="p-3.5 bg-sky-50/50 border border-sky-200 rounded-md flex flex-col sm:flex-row items-center gap-2 animate-in fade-in duration-150">
                <input
                  type="text"
                  value={customDocName}
                  onChange={(e) => setCustomDocName(e.target.value)}
                  placeholder="Enter document title (e.g. Export License, Mining Lease)..."
                  className="w-full sm:flex-1 h-9 px-3 text-xs bg-white border border-gray-300 rounded outline-none focus:border-[#2998d6]"
                />
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (customDocName.trim()) {
                        setDocumentDossier((prev) => [
                          ...prev,
                          {
                            id: `custom_${Date.now()}`,
                            name: customDocName.trim(),
                            status: 'Required'
                          }
                        ]);
                        setCustomDocName('');
                        setShowCustomDocInput(false);
                      }
                    }}
                    className="px-3 py-1.5 bg-[#2998d6] text-white text-xs font-semibold rounded hover:bg-[#1f85be]"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDocName('');
                      setShowCustomDocInput(false);
                    }}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Document Rows */}
            <div className="space-y-2.5">
              {documentDossier.map((docItem) => {
                const isCustom = docItem.id.startsWith('custom_');
                return (
                  <div
                    key={docItem.id}
                    className={`p-3.5 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      docItem.status === 'Required'
                        ? 'bg-white border-[#2998d6]/40 shadow-2xs'
                        : docItem.status === 'Optional'
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-50/60 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText
                        className={`w-4 h-4 shrink-0 ${
                          docItem.status === 'Required'
                            ? 'text-[#2998d6]'
                            : docItem.status === 'Optional'
                            ? 'text-[#057642]'
                            : 'text-gray-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#181818] block truncate">
                          {docItem.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      {/* 3-way toggle buttons */}
                      <div className="flex items-center border border-gray-200 rounded-md p-0.5 bg-gray-50">
                        {(['Required', 'Optional', 'Not required'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              setDocumentDossier((prev) =>
                                prev.map((d) => (d.id === docItem.id ? { ...d, status: st } : d))
                              );
                            }}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                              docItem.status === st
                                ? st === 'Required'
                                  ? 'bg-[#2998d6] text-white shadow-2xs'
                                  : st === 'Optional'
                                  ? 'bg-[#057642] text-white shadow-2xs'
                                  : 'bg-gray-600 text-white shadow-2xs'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            setDocumentDossier((prev) => prev.filter((d) => d.id !== docItem.id));
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove custom document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 5: GUIDE ACCESSORIES & EXPLAINER MEDIA */}
        {/* ==================================================================== */}
        {activeTab === 5 && (
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-[#e5e7eb] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#181818]">Applicant Guide Accessories &amp; Explainer Media</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-[#2998d6] border border-sky-200">
                    Optional Step
                  </span>
                </div>
                <p className="text-xs text-[#5e5e5e] mt-1">
                  Attach official applicant guidance materials: an explainer document (PDF, DOCX, spreadsheet) and/or an explainer video URL (YouTube, Vimeo, Loom, MP4). If a video is provided, the live interactive preview will be shown to applicants.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                {(guideDoc || guideDocUrlInput.trim()) && (
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Guide Document Ready
                  </span>
                )}
                {videoUrlInput.trim() && (
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1 shadow-2xs">
                    <Video className="w-3.5 h-3.5 text-indigo-600" /> Video URL Ready
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT: GUIDE DOCUMENT (UPLOAD OR LINK) */}
              <div className="p-5 rounded-xl bg-slate-50/50 border border-gray-200 space-y-4 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#181818] flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#2998d6]" />
                      <span>1. Official Guide Document</span>
                    </label>
                    {!guideDoc && (
                      <button
                        type="button"
                        onClick={() => setShowDocUrlInput(!showDocUrlInput)}
                        className="text-[11px] text-[#2998d6] hover:underline font-semibold cursor-pointer"
                      >
                        {showDocUrlInput ? 'Upload File Instead' : 'Or Paste Web Link'}
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6b7280] mb-3">
                    Attach application guidelines handbook, checklist PDF, or eligibility instructions for SMEs.
                  </p>

                  {/* Display Guide Document Card if already selected */}
                  {guideDoc ? (
                    <div className="space-y-2">
                      <GuideDocumentCard
                        document={guideDoc}
                        isEditable
                        onRemove={() => setGuideDoc(null)}
                      />
                    </div>
                  ) : showDocUrlInput ? (
                    <div className="space-y-3 p-3.5 bg-white rounded-lg border border-gray-200 animate-in fade-in">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Document Title
                        </label>
                        <input
                          type="text"
                          value={guideDocNameInput}
                          onChange={(e) => setGuideDocNameInput(e.target.value)}
                          placeholder="e.g. Credit Application Guidelines 2026.pdf"
                          className="w-full h-8 px-2.5 text-xs rounded border border-gray-300 bg-white outline-none focus:border-[#2998d6]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Document Web Link (URL)
                        </label>
                        <input
                          type="url"
                          value={guideDocUrlInput}
                          onChange={(e) => setGuideDocUrlInput(e.target.value)}
                          placeholder="https://example.com/guidelines.pdf"
                          className="w-full h-8 px-2.5 text-xs rounded border border-gray-300 bg-white outline-none focus:border-[#2998d6]"
                        />
                      </div>
                      {guideDocUrlInput && (
                        <div className="pt-1">
                          <GuideDocumentCard
                            document={{
                              name: guideDocNameInput.trim() || 'Linked Guide Document',
                              url: guideDocUrlInput.trim()
                            }}
                            isEditable
                            onRemove={() => {
                              setGuideDocUrlInput('');
                              setGuideDocNameInput('');
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDocDragOver}
                      onDragLeave={handleDocDragLeave}
                      onDrop={handleDocDrop}
                      onClick={() => docFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                        isDraggingDoc
                          ? 'border-[#2998d6] bg-sky-50'
                          : 'border-gray-300 hover:border-[#2998d6] bg-white hover:bg-sky-50/30'
                      }`}
                    >
                      <input
                        ref={docFileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        onChange={handleDocInputChange}
                        className="hidden"
                      />
                      <div className="w-10 h-10 rounded-full bg-sky-100 text-[#2998d6] flex items-center justify-center mx-auto mb-2">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-gray-800">
                        <span className="text-[#2998d6] hover:underline font-bold">Click to upload document</span> or drag &amp; drop
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        PDF, Word (DOC/DOCX), Excel, or Slides up to 25MB
                      </p>
                    </div>
                  )}

                  {docUploadError && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="w-3.5 h-3.5" /> {docUploadError}
                    </p>
                  )}
                </div>

                <div className="pt-2.5 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Status: {guideDoc || guideDocUrlInput.trim() ? 'Document Attached' : 'No document attached'}</span>
                  {(guideDoc || guideDocUrlInput.trim()) && (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  )}
                </div>
              </div>

              {/* RIGHT: VIDEO EXPLAINER (URL WITH LIVE PREVIEW) */}
              <div className="p-5 rounded-xl bg-slate-50/50 border border-gray-200 space-y-4 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#181818] flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-indigo-600" />
                      <span>2. Video Explainer &amp; Walkthrough URL</span>
                    </label>
                    {videoUrlInput && (
                      <button
                        type="button"
                        onClick={() => setVideoUrlInput('')}
                        className="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer"
                      >
                        Clear Video
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6b7280] mb-2.5">
                    Paste an explainer or walkthrough video link (YouTube, Vimeo, Loom, or direct MP4).
                  </p>

                  <div className="relative">
                    <input
                      type="url"
                      value={videoUrlInput}
                      onChange={(e) => setVideoUrlInput(e.target.value)}
                      placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
                      className="w-full h-9 px-3 text-xs rounded-md border border-gray-300 bg-white outline-none focus:border-[#2998d6] focus:ring-1 focus:ring-[#2998d6] pr-20"
                    />
                    {!videoUrlInput && (
                      <button
                        type="button"
                        onClick={() => setVideoUrlInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
                        className="absolute right-1.5 top-1.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded transition-colors cursor-pointer"
                        title="Paste sample YouTube video link"
                      >
                        Sample URL
                      </button>
                    )}
                  </div>

                  {/* Video Quick Platform Badges */}
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-500 flex-wrap">
                    <span className="font-semibold text-gray-400">Supported:</span>
                    <span className="px-1.5 py-0.2 rounded bg-white border border-gray-200 text-gray-700 font-mono">YouTube</span>
                    <span className="px-1.5 py-0.2 rounded bg-white border border-gray-200 text-gray-700 font-mono">Vimeo</span>
                    <span className="px-1.5 py-0.2 rounded bg-white border border-gray-200 text-gray-700 font-mono">Loom</span>
                    <span className="px-1.5 py-0.2 rounded bg-white border border-gray-200 text-gray-700 font-mono">Direct MP4</span>
                  </div>
                </div>

                {/* LIVE VIDEO PREVIEW DISPLAY */}
                {videoUrlInput.trim() ? (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#2998d6]" />
                        Live Video Preview:
                      </span>
                    </div>
                    <VideoPreviewPlayer
                      url={videoUrlInput.trim()}
                      title={`${title || 'Opportunity'} - Explainer Video`}
                    />
                  </div>
                ) : (
                  <div className="pt-2.5 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
                    <span>Status: No video attached</span>
                    <span className="text-gray-400">Preview appears when URL is entered</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 6: APPLICATION PROCESS & REVIEW */}
        {/* ==================================================================== */}
        {activeTab === 6 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Application Method Config */}
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 sm:p-8 shadow-xs space-y-5">
              <div className="border-b border-[#e5e7eb] pb-4">
                <h2 className="text-base font-bold text-[#181818]">Application Method &amp; Instructions</h2>
                <p className="text-xs text-[#5e5e5e] mt-0.5">
                  Select how applicant SMEs should submit their loan applications.
                </p>
              </div>

              {/* Method selector radio pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    id: 'elevata',
                    title: 'Direct on Elevata',
                    desc: 'Standard automated pipeline & underwriting'
                  },
                  {
                    id: 'external',
                    title: 'External Portal Link',
                    desc: 'Redirects to institution loan website'
                  },
                  {
                    id: 'contact',
                    title: 'Contact Institution',
                    desc: 'Direct email or loan officer phone'
                  },
                  {
                    id: 'branch',
                    title: 'Visit Branch',
                    desc: 'Physical branch in-person submission'
                  }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setApplicationMethod(m.id as any);
                      clearError('externalUrl');
                      clearError('contact');
                      clearError('branchInstructions');
                    }}
                    className={`p-3.5 rounded-md border text-left transition-all ${
                      applicationMethod === m.id
                        ? 'bg-sky-50/70 border-[#2998d6] text-[#2998d6] ring-1 ring-[#2998d6] shadow-2xs'
                        : 'bg-white border-gray-200 text-[#374151] hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{m.title}</div>
                    <div className="text-[11px] text-[#6b7280] mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>

              {/* Conditional Fields based on method */}
              {applicationMethod === 'external' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-2 animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-[#181818]">
                    External Application URL <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <ExternalLink className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => {
                        setExternalUrl(e.target.value);
                        clearError('externalUrl');
                      }}
                      placeholder="https://www.yourbank.rw/apply/sme-credit"
                      className="w-full h-10 pl-9 pr-3 rounded-md border border-[#d1d5db] text-xs bg-white focus:border-[#2998d6] outline-none"
                    />
                  </div>
                  {errors.externalUrl && (
                    <p className="mt-1 text-xs text-red-600">{errors.externalUrl}</p>
                  )}
                </div>
              )}

              {applicationMethod === 'contact' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-3 animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-[#181818]">
                    Loan Officer Contact Details <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="Contact Officer / Team"
                        className="w-full h-9 px-3 rounded border border-gray-300 text-xs bg-white outline-none focus:border-[#2998d6]"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => {
                          setContactEmail(e.target.value);
                          clearError('contact');
                        }}
                        placeholder="Email: credit@bank.rw"
                        className="w-full h-9 px-3 rounded border border-gray-300 text-xs bg-white outline-none focus:border-[#2998d6]"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => {
                          setContactPhone(e.target.value);
                          clearError('contact');
                        }}
                        placeholder="Phone: +250 788 123 456"
                        className="w-full h-9 px-3 rounded border border-gray-300 text-xs bg-white outline-none focus:border-[#2998d6]"
                      />
                    </div>
                  </div>
                  {errors.contact && (
                    <p className="mt-1 text-xs text-red-600">{errors.contact}</p>
                  )}
                </div>
              )}

              {applicationMethod === 'branch' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-2 animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-[#181818]">
                    Branch Visit Instructions &amp; Desk Addresses <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={branchInstructions}
                    onChange={(e) => {
                      setBranchInstructions(e.target.value);
                      clearError('branchInstructions');
                    }}
                    placeholder="Visit any commercial branch in Kigali, Musanze, or Rubavu. Request the SME Credit Desk with your business registration certificate."
                    className="w-full p-3 rounded-md border border-gray-300 text-xs bg-white outline-none focus:border-[#2998d6]"
                  />
                  {errors.branchInstructions && (
                    <p className="mt-1 text-xs text-red-600">{errors.branchInstructions}</p>
                  )}
                </div>
              )}

              {/* Optional General Instructions */}
              <div>
                <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                  Special Application Guidelines for SMEs (Optional)
                </label>
                <textarea
                  rows={2}
                  value={applicationInstructions}
                  onChange={(e) => setApplicationInstructions(e.target.value)}
                  placeholder="e.g. Ensure bank statements reflect transactions over the past 6 months before submitting."
                  className="w-full p-3 rounded-md border border-[#d1d5db] text-xs text-[#181818] bg-white outline-none focus:border-[#2998d6]"
                />
              </div>
            </div>

            {/* PRE-PUBLICATION SUMMARY REVIEW CARDS */}
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-[#e5e7eb] pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#181818]">Opportunity Review</h3>
                  <p className="text-xs text-[#5e5e5e]">
                    Verify all product details before publishing to the SME network.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#057642] bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  Ready to Publish
                </span>
              </div>

              {/* Review Section 1: Overview */}
              <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700 uppercase">1. Basic Information</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab(1)}
                    className="text-xs font-semibold text-[#2998d6] hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {bannerImage && (
                    <div className="sm:col-span-2 md:col-span-3 mb-1">
                      <span className="text-gray-500 text-[11px] block mb-1 font-medium">Cover Banner:</span>
                      <div className="relative w-full h-36 rounded-md overflow-hidden border border-gray-200 bg-gray-100">
                        <img src={bannerImage} alt="Cover Preview" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 text-[11px] block">Title:</span>
                    <strong className="text-[#181818] font-bold">{title || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px] block">Provider:</span>
                    <span className="text-[#181818]">{provider || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px] block">Purpose:</span>
                    <span className="text-[#181818]">
                      {financingPurpose === 'Other' ? customPurpose : financingPurpose}
                    </span>
                  </div>
                  <div className="sm:col-span-2 md:col-span-3">
                    <span className="text-gray-500 text-[11px] block">Description:</span>
                    <div
                      className="text-gray-700 mt-1 text-xs leading-relaxed [&>h3]:font-bold [&>h3]:text-xs [&>h3]:mt-2 [&>h3]:text-gray-900 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>blockquote]:border-l-2 [&>blockquote]:border-sky-500 [&>blockquote]:pl-2 [&>blockquote]:italic"
                      dangerouslySetInnerHTML={{ __html: description }}
                    />
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px] block">Deadline:</span>
                    <span className="text-gray-800">{isRollingDeadline ? 'Continuous / Rolling' : deadline}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500 text-[11px] block">Target Sectors ({selectedSectors.length}):</span>
                    <span className="text-gray-800 truncate block">{selectedSectors.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Review Section: Guidance Resources (Guide Doc & Video) */}
              {(guideDoc || guideDocUrlInput.trim() || videoUrlInput.trim()) ? (
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#2998d6]" />
                      <span>5. Guide Accessories &amp; Explainer Media</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab(5)}
                      className="text-xs font-semibold text-[#2998d6] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                  
                  {/* Guide Document Review Card */}
                  {(guideDoc || guideDocUrlInput.trim()) && (
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                        Guide Document:
                      </span>
                      <GuideDocumentCard
                        document={guideDoc || {
                          name: guideDocNameInput.trim() || 'Official Program Guide',
                          url: guideDocUrlInput.trim()
                        }}
                      />
                    </div>
                  )}

                  {/* Video Walkthrough Preview Player */}
                  {videoUrlInput.trim() && (
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                        Video Walkthrough Preview:
                      </span>
                      <VideoPreviewPlayer
                        url={videoUrlInput.trim()}
                        title={`${title || 'Opportunity'} - Explainer Video`}
                      />
                    </div>
                  )}
                </div>
              ) : null}

              {/* Review Section 2: Loan Terms */}
              <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700 uppercase">2. Financial Terms</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab(2)}
                    className="text-xs font-semibold text-[#2998d6] hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 text-[11px] block">Max Funding:</span>
                    <strong className="text-[#2998d6] font-bold">{formatRWF(Number(maxAmount) || 0)}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px] block">Interest Structure:</span>
                    <span className="text-gray-800 font-semibold">
                      {interestRateStructure === 'assessed' ? 'Assessed' : `${interestRate}% (${interestRateStructure})`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px] block">Repayment Term:</span>
                    <span className="text-gray-800">
                      {repaymentTermType === 'single' ? `${singleTermMonths} Months` : `${minTermMonths} - ${maxTermMonths} Months`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px] block">Grace Period:</span>
                    <span className="text-gray-800">{Number(gracePeriodMonths) > 0 ? `${gracePeriodMonths} Months` : 'None'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px] block">Collateral:</span>
                    <span className="text-gray-800 capitalize font-medium">{collateralRequirement.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px] block">Repayment Frequency:</span>
                    <span className="text-gray-800">{repaymentFrequency}</span>
                  </div>
                  {collateralRequirement === 'required' && collateralDescription && (
                    <div className="col-span-2 sm:col-span-4 bg-white p-3 rounded-md border border-gray-200 mt-1">
                      <span className="text-gray-500 text-[11px] block font-semibold mb-0.5">Collateral Requirement Description:</span>
                      <p className="text-gray-800 text-xs leading-relaxed">{collateralDescription}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Section 3: Eligibility & Documents */}
              <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700 uppercase">3 &amp; 4. Eligibility &amp; Required Documents</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab(3)}
                    className="text-xs font-semibold text-[#2998d6] hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 text-[11px] block">Turnover Threshold:</span>
                    <span className="text-gray-800 font-semibold">
                      {turnoverBasis === 'none'
                        ? 'No Minimum'
                        : `${formatRWF(Number(turnoverAmount))} / ${turnoverBasis}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px] block">Required Documents ({documentDossier.filter(d => d.status === 'Required').length}):</span>
                    <span className="text-gray-800">
                      {documentDossier.filter(d => d.status === 'Required').map(d => d.name).join(', ') || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Footer Navigation Actions */}
        <div className="mt-8 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {activeTab > 1 && (
              <button
                type="button"
                onClick={handlePrevTab}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md border border-[#d1d5db] bg-white hover:bg-gray-50 text-xs font-bold text-[#374151] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Tab</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-4 py-2.5 rounded-md border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Save Draft
            </button>

            {activeTab < 6 ? (
              <button
                type="button"
                onClick={handleNextTab}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-[#2998d6] hover:bg-[#1f85be] text-white text-xs font-bold transition-all shadow-xs"
              >
                <span>Next Tab: {wizardTabs[activeTab]?.label?.replace(/^\d+\.\s*/, '') || 'Review'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitPublish}
                className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-md bg-[#2998d6] hover:bg-[#1f85be] text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isEditMode ? 'Saving Changes...' : 'Publishing Opportunity...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isEditMode ? 'Save Opportunity Changes' : 'Publish Loan Opportunity'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Discard / Cancel Confirmation Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 max-w-md w-full shadow-xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-[#181818]">Discard Publishing Changes?</h3>
            <p className="text-xs text-[#5e5e5e] mt-1.5 leading-relaxed">
              You have unsaved changes in this loan publishing form. Would you like to save a draft before returning to the dashboard?
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowDiscardModal(false);
                  onCancel();
                }}
                className="px-3.5 py-2 rounded text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Discard &amp; Exit
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveDraft();
                  setShowDiscardModal(false);
                  onCancel();
                }}
                className="px-4 py-2 rounded bg-[#2998d6] hover:bg-[#1f85be] text-white text-xs font-bold transition-colors"
              >
                Save Draft &amp; Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

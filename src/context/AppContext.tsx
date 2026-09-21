import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SmeProfile,
  mockSmes,
  Sale,
  InventoryItem,
  Expense,
  formatRWF,
  ProductItem,
  SaleItemSnapshot,
  MeasurementUnit,
  PurchaseTransaction,
  CashInTransaction,
  CashOutTransaction,
  OtherActivity
} from '../lib/mockData';
import { apiRequest } from '../lib/api';

export interface Opportunity {
  id: string;
  title: string;
  institution: string;
  category: string;
  description: string;
  benefits: string;
  deadline: string;
  maxFunding: string;
  sectors: string[];
  categoryId?: string;
  minAge: number;
  minRevenue: number;
  minHealthScore: number;
  minReadinessScore: number;
  registrationRequired: boolean;
  taxCompliance: boolean;
  collateralRequired: boolean;
  requiredDocs: string[];
  views: number;
  saved: number;
  applicationsCount: number;
  status: 'Active' | 'Closed';
  createdAt: string;
  
  // Extended fields published by publisher
  minMonthlyRevenue?: number;
  maxDebtToRevenue?: number;
  collateralType?: string;
  eligLocations?: string[];
  loanRate?: number;
  loanTerm?: number;
  loanGrace?: number;
  grantCoFundingReq?: boolean;
  grantCoFundingPct?: number;
  grantDuration?: number;
  appMethod?: string;
  appSteps?: string[];
}

export interface Application {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  smeId: string;
  smeName: string;
  smeSector: string;
  smeReadiness: number;
  smeHealth: number;
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  appliedAt: string;
  feedback: string;
  aiSuggestions: string[];
}

export interface TrainingAttendee {
  id: string;
  name: string;
  businessName: string;
  sector: string;
  avatar?: string;
  status: 'waiting' | 'admitted' | 'declined';
  handRaised?: boolean;
  isMuted?: boolean;
  joinedAt?: string;
  cameraOn?: boolean;
}

export interface TrainingChatMessage {
  id: string;
  senderName: string;
  senderRole: 'host' | 'attendee' | 'system';
  avatar?: string;
  text: string;
  timestamp: string;
}

export interface Training {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  speaker: string;
  speakerRole?: string;
  speakerOrg?: string;
  meetingLink: string;
  targetAudience: string[];
  participantsCount: number;
  attended: boolean;
  completed: boolean;
  hasCertificate: boolean;
  status?: 'scheduled' | 'live' | 'completed';
  opportunityId?: string;
  opportunityTitle?: string;
  curriculum?: string[];
  sector?: string;
  durationMinutes?: number;
  maxCapacity?: number;
  enrolled?: boolean;
  enrolledAt?: string;
  materials?: { title: string; url: string; size: string }[];
  attendees?: TrainingAttendee[];
  chatMessages?: TrainingChatMessage[];
}

interface Scenarios {
  salesDrop: boolean;
  expenseIncrease: boolean;
  loanDelay: boolean;
}

interface LoanSimulation {
  amount: number;      // in RWF
  period: number;      // in months
  rate: number;        // in %
}

interface AppContextType {
  selectedSmeId: string;
  setSelectedSmeId: (id: string) => void;
  smes: SmeProfile[];
  activeSme: SmeProfile;
  scenarios: Scenarios;
  setScenarios: React.Dispatch<React.SetStateAction<Scenarios>>;
  loanSimulation: LoanSimulation;
  setLoanSimulation: React.Dispatch<React.SetStateAction<LoanSimulation>>;
  approveLoan: (smeId: string, amount: number, period: number, rate: number) => void;
  rejectLoan: (smeId: string) => void;
  requestFieldVisit: (smeId: string) => void;
  addSale: (smeId: string, product: string, quantity: number, price: number, customer: string) => void;
  deleteSale: (smeId: string, saleId: number | string) => void;
  addInventoryItem: (smeId: string, name: string, category: string, quantity: number, price: number, supplier: string) => void;
  deleteInventoryItem: (smeId: string, itemId: string) => void;
  addExpense: (smeId: string, description: string, category: string, amount: number) => void;
  deleteExpense: (smeId: string, expenseId: number) => void;
  addPurchase: (smeId: string, supplier: string, items: any[], invoiceRef?: string, paymentMethod?: string, notes?: string) => Promise<any>;
  deletePurchase: (smeId: string, purchaseId: string | number) => void;
  addCashIn: (smeId: string, data: { amount: number; source: string; reason: string; paymentMethod: string; category?: string; date?: string; notes?: string }) => void;
  deleteCashIn: (smeId: string, id: string | number) => void;
  addCashOut: (smeId: string, data: { amount: number; category: string; description: string; paymentMethod: string; date?: string; notes?: string }) => void;
  deleteCashOut: (smeId: string, id: string | number) => void;
  addOtherActivity: (smeId: string, data: { title: string; description?: string; date: string; status?: 'Planned' | 'In Progress' | 'Completed' | 'On Hold'; moneyInvolved: boolean; amount?: number; paymentStatus?: 'Completed' | 'Pending' | 'Partial' | 'N/A'; category?: string }) => void;
  deleteOtherActivity: (smeId: string, id: string | number) => void;
  resetAll: () => void;
  
  // Products Master Catalog
  products: ProductItem[];
  createProduct: (data: {
    name: string;
    description?: string;
    unit: string;
    unitPrice: number;
    costPrice?: number;
    stockQuantity: number;
    reorderLevel?: number;
    category?: string;
  }) => Promise<ProductItem>;
  updateProduct: (id: string, data: Partial<ProductItem>) => Promise<ProductItem>;
  deleteProduct: (id: string) => Promise<void>;
  recordStockIntake: (supplier: string, items: any[], notes?: string) => Promise<any>;
  recordSaleTransaction: (payload: {
    customer: string;
    customerContact?: string;
    invoiceNumber?: string;
    paymentStatus?: 'Completed' | 'Pending' | 'Partial' | 'Cancelled';
    paymentMethod?: string;
    notes?: string;
    items: {
      productId?: string;
      productName: string;
      unit: string;
      quantity: number;
      unitPrice: number;
    }[];
  }) => Promise<any>;
  refreshProducts: () => Promise<void>;
  refreshSales: () => Promise<void>;

  // Opportunities, applications, and virtual trainings state
  opportunities: Opportunity[];
  applications: Application[];
  trainings: Training[];
  bookmarkedOpportunities: string[];
  publishOpportunity: (opp: Omit<Opportunity, 'id' | 'views' | 'saved' | 'applicationsCount' | 'status' | 'createdAt'>) => void;
  applyForOpportunity: (oppId: string, smeId: string) => void;
  updateApplicationStatus: (appId: string, status: Application['status'], feedback?: string) => void;
  createTraining: (training: Omit<Training, 'id' | 'participantsCount' | 'attended' | 'completed' | 'hasCertificate'>) => void;
  updateTraining: (trainingId: string, data: Partial<Training>) => void;
  deleteTraining: (trainingId: string) => void;
  joinTraining: (trainingId: string) => void;
  toggleTrainingEnrollment: (trainingId: string) => void;
  startLiveTraining: (trainingId: string) => void;
  endLiveTraining: (trainingId: string) => void;
  requestJoinLiveTraining: (trainingId: string, attendee: Omit<TrainingAttendee, 'status' | 'joinedAt'>) => void;
  admitAttendee: (trainingId: string, attendeeId: string) => void;
  admitAllAttendees: (trainingId: string) => void;
  toggleHandRaise: (trainingId: string, attendeeId: string) => void;
  sendTrainingMessage: (trainingId: string, message: Omit<TrainingChatMessage, 'id' | 'timestamp'>) => void;
  bookmarkOpportunity: (oppId: string) => void;
}

const initialOpportunities: Opportunity[] = [
  {
    id: 'opp-1',
    title: 'Business Expansion Loan',
    institution: 'BPR Bank',
    category: 'Loan',
    description: 'Low-interest credit facility designed to scale SME operations, purchase inventory, or upgrade machinery. Suitable for medium sized businesses with regular monthly sales.',
    benefits: '12% p.a. fixed interest, 3 months grace period, fully digital application and fast disbursement.',
    deadline: '2026-08-30',
    maxFunding: '50,000,000 FRW',
    sectors: ['Retail', 'Agriculture', 'Technology', 'Logistics'],
    minAge: 2,
    minRevenue: 4000000,
    minHealthScore: 70,
    minReadinessScore: 75,
    registrationRequired: true,
    taxCompliance: true,
    collateralRequired: false,
    requiredDocs: ['Business License', 'Tax Clearance Certificate', 'Q2 Financial Statements'],
    views: 142,
    saved: 28,
    applicationsCount: 3,
    status: 'Active',
    createdAt: '2026-08-01',
    minMonthlyRevenue: 3000000,
    maxDebtToRevenue: 35,
    eligLocations: ['Kigali', 'Northern Province'],
    loanRate: 12,
    loanTerm: 24,
    loanGrace: 3,
    collateralType: 'Asset Registration',
    appMethod: 'Apply directly through Elevata',
    appSteps: [
      '1. Check eligibility profile',
      '2. Complete application dossier',
      '3. Upload required documents',
      '4. Automated AI risk review',
      '5. Bank officer interview & disburse'
    ]
  },
  {
    id: 'opp-2',
    title: 'Agribusiness Growth Grant',
    institution: 'Ministry of Agriculture',
    category: 'Grant',
    description: 'Non-repayable grant for processing equipment, cold room storage facilities, and capacity building in agricultural cooperatives.',
    benefits: 'Zero interest, 100% equity-free funding, custom virtual business training sessions.',
    deadline: '2026-09-15',
    maxFunding: '25,000,000 FRW',
    sectors: ['Agriculture'],
    minAge: 1,
    minRevenue: 2000000,
    minHealthScore: 60,
    minReadinessScore: 60,
    registrationRequired: true,
    taxCompliance: true,
    collateralRequired: false,
    requiredDocs: ['Business License', 'Tax Clearance Certificate', 'Cooperative Certificate'],
    views: 284,
    saved: 65,
    applicationsCount: 1,
    status: 'Active',
    createdAt: '2026-08-03',
    minMonthlyRevenue: 1500000,
    eligLocations: ['Northern Province', 'Western Province', 'Eastern Province'],
    grantCoFundingReq: true,
    grantCoFundingPct: 20,
    grantDuration: 12,
    appMethod: 'Apply directly through Elevata',
    appSteps: [
      '1. Check eligibility profile',
      '2. Complete application dossier',
      '3. Upload required documents',
      '4. Ministry evaluation & grant disburse'
    ]
  },
  {
    id: 'opp-3',
    title: 'Digital Sacco Savings Premium',
    institution: 'Elevata Credit Union',
    category: 'Savings Product',
    description: 'High-yield investment and savings program tailored for local SACCO members with instant credit access.',
    benefits: '7.5% annual interest compounded monthly, borrow against savings up to 150% without collateral.',
    deadline: '2026-12-31',
    maxFunding: '10,000,000 FRW',
    sectors: ['Retail', 'Logistics', 'Technology', 'Agriculture'],
    minAge: 0,
    minRevenue: 500000,
    minHealthScore: 50,
    minReadinessScore: 50,
    registrationRequired: false,
    taxCompliance: false,
    collateralRequired: false,
    requiredDocs: ['National ID', 'Proof of Business Address'],
    views: 94,
    saved: 12,
    applicationsCount: 0,
    status: 'Active',
    createdAt: '2026-08-04',
    minMonthlyRevenue: 200000,
    appMethod: 'Apply directly through Elevata'
  },
  {
    id: 'opp-4',
    title: 'Women-Led Tech Venture Fund',
    institution: 'Mastercard Foundation',
    category: 'Investment',
    description: 'Dedicated funding and advisory program for female entrepreneurs leveraging technology to address local problems.',
    benefits: 'Flexible equity or revenue-share, global mentorship network, and free technology licenses.',
    deadline: '2026-11-01',
    maxFunding: '30,000,000 FRW',
    sectors: ['Technology'],
    minAge: 1,
    minRevenue: 3000000,
    minHealthScore: 70,
    minReadinessScore: 70,
    registrationRequired: true,
    taxCompliance: true,
    collateralRequired: false,
    requiredDocs: ['Business License', 'Tax Clearance Certificate', 'Pitch Deck'],
    views: 185,
    saved: 41,
    applicationsCount: 2,
    status: 'Active',
    createdAt: '2026-08-02',
    minMonthlyRevenue: 2500000,
    eligLocations: ['Kigali'],
    appMethod: 'Apply directly through Elevata'
  }
];

const initialApplications: Application[] = [
  {
    id: 'app-1',
    opportunityId: 'opp-1',
    opportunityTitle: 'Business Expansion Loan',
    smeId: 'sme-4',
    smeName: 'Gisenyi Tech Solutions',
    smeSector: 'Technology',
    smeReadiness: 91,
    smeHealth: 91,
    status: 'Approved',
    appliedAt: '2026-08-02',
    feedback: 'Approved based on solid SaaS recurring revenue and tax compliance.',
    aiSuggestions: []
  },
  {
    id: 'app-2',
    opportunityId: 'opp-1',
    opportunityTitle: 'Business Expansion Loan',
    smeId: 'sme-1',
    smeName: 'Kigali Fresh Mart',
    smeSector: 'Retail',
    smeReadiness: 85,
    smeHealth: 82,
    status: 'Under Review',
    appliedAt: '2026-08-04',
    feedback: 'Credit risk assessment is validating the inventory turnover runway.',
    aiSuggestions: ['Upload the Q3 tax clearance certificate as soon as possible to speed up process.']
  },
  {
    id: 'app-3',
    opportunityId: 'opp-2',
    opportunityTitle: 'Agribusiness Growth Grant',
    smeId: 'sme-2',
    smeName: 'Rwanda Agro-Processors Ltd',
    smeSector: 'Agriculture',
    smeReadiness: 64,
    smeHealth: 64,
    status: 'Submitted',
    appliedAt: '2026-08-05',
    feedback: 'Application received. Pending administrative completeness check.',
    aiSuggestions: ['Review outstanding cooperatives receivables to boost cash flow rating.']
  }
];

const initialTrainings: Training[] = [
  {
    id: 'tr-1',
    title: 'Financial Readiness & Tax Compliance Masterclass',
    description: 'Learn how to properly prepare tax clearances, maintain clean financial ledgers, and leverage digital logs to unlock bank financing.',
    date: '2026-08-22',
    time: '10:00 AM - 12:00 PM',
    speaker: 'Jean Paul Habimana',
    speakerRole: 'Senior Credit & Compliance Advisor',
    speakerOrg: 'BPR Bank / RRA Taskforce',
    meetingLink: 'https://elevata.live/rooms/tr-1',
    targetAudience: ['Low Readiness SMEs', 'Retail', 'Agriculture', 'Wholesale'],
    participantsCount: 45,
    attended: false,
    completed: false,
    hasCertificate: true,
    status: 'live',
    opportunityId: 'opp-1',
    opportunityTitle: 'Business Expansion Loan',
    curriculum: [
      'Understanding RRA Tax Clearance & EBM compliance requirements',
      'Bank cash flow debt-service ratio (DSCR) calculations',
      'Automated accounting records vs. physical manual logs',
      'Step-by-step credit application dossier compilation'
    ],
    materials: [
      { title: 'SME Tax Clearance Checklist.pdf', url: '#', size: '1.2 MB' },
      { title: 'Credit Readiness Evaluation Sheet.xlsx', url: '#', size: '850 KB' },
      { title: 'Presentation Slides - Session 1.pdf', url: '#', size: '3.4 MB' }
    ],
    attendees: [
      { id: 'sme-1', name: 'Marie Kabera', businessName: "Marie's Kigali Fresh Mart", sector: 'Retail', avatar: 'MK', status: 'admitted', handRaised: false, cameraOn: true, joinedAt: '10:02 AM' },
      { id: 'sme-2', name: 'Jean Bosco', businessName: 'Rwanda Agro-Processors Ltd', sector: 'Agriculture', avatar: 'JB', status: 'admitted', handRaised: true, cameraOn: false, joinedAt: '10:05 AM' },
      { id: 'sme-3', name: 'David Mugisha', businessName: 'David Transport Haulage', sector: 'Logistics', avatar: 'DM', status: 'waiting', handRaised: false, cameraOn: true, joinedAt: '10:14 AM' },
      { id: 'sme-4', name: 'Divine Mutoni', businessName: 'Gisenyi Tech Solutions', sector: 'Technology', avatar: 'DM', status: 'waiting', handRaised: false, cameraOn: false, joinedAt: '10:15 AM' }
    ],
    chatMessages: [
      { id: 'm-1', senderName: 'Jean Paul Habimana (Trainer)', senderRole: 'host', text: 'Welcome everyone! We will begin the session on credit readiness dossier requirements in 2 minutes.', timestamp: '10:00 AM' },
      { id: 'm-2', senderName: 'Marie Kabera', senderRole: 'attendee', avatar: 'MK', text: 'Good morning Jean Paul! Excited to attend from Kigali.', timestamp: '10:02 AM' },
      { id: 'm-3', senderName: 'Jean Bosco', senderRole: 'attendee', avatar: 'JB', text: 'Does BPR require audited statements for agricultural cooperatives under 50M?', timestamp: '10:08 AM' }
    ]
  },
  {
    id: 'tr-2',
    title: 'Scaling Agribusiness Operations in East Africa',
    description: 'A deep-dive workshop into modern inventory logistics, cooperative management, and obtaining processing certificates.',
    date: '2026-08-25',
    time: '02:00 PM - 04:30 PM',
    speaker: 'Dr. Agnes Kalibata',
    speakerRole: 'Director of Agribusiness Scaling',
    speakerOrg: 'AgroGrow Rwanda',
    meetingLink: 'https://elevata.live/rooms/tr-2',
    targetAudience: ['Agriculture', 'High Growth SMEs'],
    participantsCount: 68,
    attended: false,
    completed: false,
    hasCertificate: true,
    status: 'scheduled',
    opportunityId: 'opp-2',
    opportunityTitle: 'Agribusiness Growth Grant',
    curriculum: [
      'Seasonal working capital structuring',
      'Cold chain storage and harvest losses reduction',
      'Contract farming agreements with commercial buyers'
    ],
    materials: [
      { title: 'Agri Supply Chain Handbook.pdf', url: '#', size: '4.1 MB' }
    ],
    attendees: [
      { id: 'sme-2', name: 'Jean Bosco', businessName: 'Rwanda Agro-Processors Ltd', sector: 'Agriculture', avatar: 'JB', status: 'admitted', joinedAt: '02:00 PM' }
    ],
    chatMessages: []
  },
  {
    id: 'tr-3',
    title: 'SME Digitization & E-commerce Strategy',
    description: 'Interactive session outlining how digital point-of-sale systems can automate cashflow tracking and generate pre-approved credit files.',
    date: '2026-08-28',
    time: '09:00 AM - 11:30 AM',
    speaker: 'Divine Mutoni',
    speakerRole: 'Head of Fintech Integrations',
    speakerOrg: 'Gisenyi Tech Solutions',
    meetingLink: 'https://elevata.live/rooms/tr-3',
    targetAudience: ['Women', 'Retail', 'Technology'],
    participantsCount: 32,
    attended: true,
    completed: true,
    hasCertificate: true,
    status: 'completed',
    curriculum: [
      'Setting up digital POS merchant wallets',
      'Automated transaction reporting for credit scoring'
    ],
    materials: [
      { title: 'Digital Rails Playbook.pdf', url: '#', size: '2.5 MB' }
    ],
    attendees: [],
    chatMessages: []
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    const saved = localStorage.getItem('elevata_opportunities');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse opportunities:", e);
      }
    }
    return initialOpportunities;
  });

  const [applications, setApplications] = useState<Application[]>(() => {
    const saved = localStorage.getItem('elevata_applications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse applications:", e);
      }
    }
    return initialApplications;
  });

  const [trainings, setTrainings] = useState<Training[]>(() => {
    const saved = localStorage.getItem('elevata_trainings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse trainings:", e);
      }
    }
    return initialTrainings;
  });

  const [bookmarkedOpportunities, setBookmarkedOpportunities] = useState<string[]>(() => {
    const saved = localStorage.getItem('elevata_bookmarked');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse bookmarks:", e);
      }
    }
    return [];
  });

  // Fetch backend opportunities and merge with mock/cached opportunities
  useEffect(() => {
    async function fetchBackendOpportunities() {
      try {
        const res = await apiRequest('/opportunities');
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setOpportunities(prev => {
            const map = new Map<string, Opportunity>();
            // Keep all initial/mocked opportunities
            initialOpportunities.forEach(o => map.set(o.id, o));
            // Keep local state
            prev.forEach(o => map.set(o.id, o));
            // Overlay backend database opportunities
            res.data.forEach((o: any) => {
              const existing = (map.get(o.id) || {}) as Partial<Opportunity>;
              map.set(o.id, {
                ...existing,
                ...o,
                sectors: Array.isArray(o.sectors) ? o.sectors : (existing.sectors || []),
                requiredDocs: Array.isArray(o.requiredDocs) ? o.requiredDocs : (existing.requiredDocs || [])
              } as Opportunity);
            });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        // Silently preserve existing mocked data
      }
    }
    fetchBackendOpportunities();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('elevata_opportunities', JSON.stringify(opportunities));
  }, [opportunities]);

  useEffect(() => {
    localStorage.setItem('elevata_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('elevata_trainings', JSON.stringify(trainings));
  }, [trainings]);

  const [selectedSmeId, setSelectedSmeId] = useState<string>(() => {
    return localStorage.getItem('elevata_sme_id') || 'sme-1';
  });

  const [smes, setSmes] = useState<SmeProfile[]>(() => {
    const saved = localStorage.getItem('elevata_smes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((sme: any) => {
            const defaultSme = mockSmes.find(m => m.id === sme.id) || mockSmes[0];
            return {
              ...defaultSme,
              ...sme,
              inventoryItems: Array.isArray(sme.inventoryItems) ? sme.inventoryItems : (defaultSme.inventoryItems || []),
              sales: Array.isArray(sme.sales) ? sme.sales : (defaultSme.sales || []),
              riskAlerts: Array.isArray(sme.riskAlerts) ? sme.riskAlerts : (defaultSme.riskAlerts || []),
              monthlyData: Array.isArray(sme.monthlyData) ? sme.monthlyData : (defaultSme.monthlyData || []),
              loanDetails: {
                ...defaultSme.loanDetails,
                ...(sme.loanDetails || {})
              }
            };
          });
        }
      } catch (e) {
        console.error("Failed to parse saved SMEs from localStorage:", e);
      }
    }
    return mockSmes;
  });

  const [products, setProducts] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem('elevata_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { id: 'prod-1', name: 'Premium Basmati Rice', unit: 'kgs', unitPrice: 28000, costPrice: 24000, stockQuantity: 120, reorderLevel: 25, category: 'Food & Groceries', status: 'In Stock' },
      { id: 'prod-2', name: 'Refined Cooking Oil', unit: 'l', unitPrice: 12000, costPrice: 9500, stockQuantity: 80, reorderLevel: 20, category: 'Food & Groceries', status: 'In Stock' },
      { id: 'prod-3', name: 'White Sugar Grade A', unit: 'bag', unitPrice: 48000, costPrice: 42000, stockQuantity: 25, reorderLevel: 10, category: 'Food & Groceries', status: 'In Stock' },
      { id: 'prod-4', name: 'Dry Local Beans', unit: 'kgs', unitPrice: 1200, costPrice: 900, stockQuantity: 350, reorderLevel: 50, category: 'Agriculture & Produce', status: 'In Stock' },
      { id: 'prod-5', name: 'Cotton Kitenge Fabric', unit: 'meters', unitPrice: 4500, costPrice: 3200, stockQuantity: 180, reorderLevel: 30, category: 'Textiles & Garments', status: 'In Stock' },
      { id: 'prod-6', name: 'Ceramic Floor Tiles', unit: 'm²', unitPrice: 9500, costPrice: 7000, stockQuantity: 95, reorderLevel: 20, category: 'Building & Hardware', status: 'In Stock' },
      { id: 'prod-7', name: 'Fresh Farm Eggs', unit: 'dozen', unitPrice: 2400, costPrice: 1800, stockQuantity: 40, reorderLevel: 15, category: 'Food & Groceries', status: 'In Stock' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('elevata_products', JSON.stringify(products));
  }, [products]);

  const refreshProducts = async () => {
    try {
      const res = await apiRequest('/inventory/products');
      if (res && res.success && Array.isArray(res.data?.products) && res.data.products.length > 0) {
        setProducts(res.data.products);
      }
    } catch (err) {
      // Graceful fallback to local state
    }
  };

  const refreshSales = async () => {
    try {
      const res = await apiRequest('/sales');
      if (res && res.success && Array.isArray(res.data?.sales)) {
        const backendSales: Sale[] = res.data.sales.map((s: any) => ({
          id: s.id,
          customer: s.customer,
          product: s.items && s.items.length > 0 ? s.items[0].productName + (s.items.length > 1 ? ` (+${s.items.length - 1} more)` : '') : 'Sale',
          unit: s.items && s.items.length > 0 ? s.items[0].unit : 'pcs',
          quantity: s.items ? s.items.reduce((sum: number, it: any) => sum + it.quantity, 0) : 1,
          price: s.items && s.items.length > 0 ? s.items[0].unitPrice : s.totalAmount,
          total: s.totalAmount,
          date: new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: s.paymentStatus || 'Completed',
          items: s.items || []
        }));

        setSmes(prev => prev.map(sme => {
          if (sme.id === selectedSmeId) {
            return {
              ...sme,
              sales: backendSales.length > 0 ? backendSales : sme.sales
            };
          }
          return sme;
        }));
      }
    } catch (err) {
      // Graceful fallback
    }
  };

  useEffect(() => {
    refreshProducts();
    refreshSales();
  }, [selectedSmeId]);

  const [scenarios, setScenarios] = useState<Scenarios>({
    salesDrop: false,
    expenseIncrease: false,
    loanDelay: false,
  });

  const [loanSimulation, setLoanSimulation] = useState<LoanSimulation>({
    amount: 5000000, // 5M RWF default
    period: 12,       // 1 year
    rate: 15,         // 15% fixed
  });

  // Keep local storage in sync
  useEffect(() => {
    localStorage.setItem('elevata_sme_id', selectedSmeId);
  }, [selectedSmeId]);

  useEffect(() => {
    localStorage.setItem('elevata_smes', JSON.stringify(smes));
  }, [smes]);

  const activeSme = smes.find(sme => sme.id === selectedSmeId) || smes[0];

  const approveLoan = (smeId: string, amount: number, period: number, rate: number) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const monthlyInstallment = Math.round((amount * (1 + (rate / 100))) / period);
        
        const updatedAlerts = [
          {
            id: `alert-loan-app-${Date.now()}`,
            type: 'info' as const,
            text: `Elevata Alert: Credit of ${new Intl.NumberFormat().format(amount)} FRW approved at ${rate}% interest over ${period} months. Funds credited.`
          },
          ...sme.riskAlerts
        ];

        return {
          ...sme,
          currentBalance: sme.currentBalance + amount,
          borrowingCapacity: Math.max(0, sme.borrowingCapacity - amount),
          healthScore: Math.min(100, Math.round(sme.healthScore * 1.05)),
          loanDetails: {
            status: 'Active',
            outstandingAmount: amount,
            monthlyInstallment,
            interestRate: rate,
            repaymentPeriodMonths: period,
            purpose: 'Approved credit facility expansion'
          },
          riskAlerts: updatedAlerts
        };
      }
      return sme;
    }));
  };

  const rejectLoan = (smeId: string) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        return {
          ...sme,
          riskAlerts: [
            {
              id: `alert-loan-rej-${Date.now()}`,
              type: 'danger' as const,
              text: 'Elevata System notice: Credit expansion request was declined by risk officer.'
            },
            ...sme.riskAlerts
          ]
        };
      }
      return sme;
    }));
  };

  const requestFieldVisit = (smeId: string) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        return {
          ...sme,
          riskAlerts: [
            {
              id: `alert-visit-${Date.now()}`,
              type: 'warning' as const,
              text: 'Elevata System alert: Bank compliance officer has scheduled a local inventory verification field audit.'
            },
            ...sme.riskAlerts
          ]
        };
      }
      return sme;
    }));
  };

  const addSale = (smeId: string, product: string, quantity: number, price: number, customer: string) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const total = quantity * price;
        const newSale: Sale = {
          id: Date.now(),
          product,
          quantity,
          price,
          total,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          customer,
          status: 'Completed'
        };

        // Decrement matching inventory item if it exists
        const updatedInventory = sme.inventoryItems.map(item => {
          if (item.name.toLowerCase() === product.toLowerCase() || item.name.toLowerCase().includes(product.toLowerCase())) {
            const newStock = Math.max(0, item.stockLevel - quantity);
            let newStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstock' = 'In Stock';
            if (newStock === 0) newStatus = 'Out of Stock';
            else if (newStock <= item.reorderPoint) newStatus = 'Low Stock';
            else if (newStock > item.reorderPoint * 2.5) newStatus = 'Overstock';

            const avgDailySales = Math.max(0.1, quantity / 7);
            const newDays = Math.round(newStock / avgDailySales);

            return {
              ...item,
              stockLevel: newStock,
              status: newStatus,
              daysRemaining: newDays
            };
          }
          return item;
        });

        const updatedAlerts = [
          {
            id: `alert-sale-${Date.now()}`,
            type: 'info' as const,
            text: `Transaction completed: Sold ${quantity}x ${product} to ${customer}. Reserves credited by ${formatRWF(total)}.`
          },
          ...sme.riskAlerts
        ];

        const updatedMonthlyData = [...sme.monthlyData];
        if (updatedMonthlyData.length > 0) {
          const currentMonth = updatedMonthlyData[updatedMonthlyData.length - 1];
          updatedMonthlyData[updatedMonthlyData.length - 1] = {
            ...currentMonth,
            revenue: currentMonth.revenue + total,
            inflow: currentMonth.inflow + total
          };
        }

        return {
          ...sme,
          currentBalance: sme.currentBalance + total,
          inventoryItems: updatedInventory,
          riskAlerts: updatedAlerts,
          monthlyData: updatedMonthlyData,
          sales: [newSale, ...sme.sales]
        };
      }
      return sme;
    }));
  };

  const deleteSale = (smeId: string, saleId: string | number) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const saleToDelete = sme.sales.find(s => s.id === saleId);
        if (!saleToDelete) return sme;

        const updatedAlerts = [
          {
            id: `alert-sale-del-${Date.now()}`,
            type: 'warning' as const,
            text: `Transaction reversed: Sale of ${saleToDelete.product} was cancelled. Reserves debited by ${formatRWF(saleToDelete.total)}.`
          },
          ...sme.riskAlerts
        ];

        const updatedMonthlyData = [...sme.monthlyData];
        if (updatedMonthlyData.length > 0) {
          const currentMonth = updatedMonthlyData[updatedMonthlyData.length - 1];
          updatedMonthlyData[updatedMonthlyData.length - 1] = {
            ...currentMonth,
            revenue: Math.max(0, currentMonth.revenue - saleToDelete.total),
            inflow: Math.max(0, currentMonth.inflow - saleToDelete.total)
          };
        }

        return {
          ...sme,
          currentBalance: Math.max(0, sme.currentBalance - saleToDelete.total),
          riskAlerts: updatedAlerts,
          monthlyData: updatedMonthlyData,
          sales: sme.sales.filter(s => s.id !== saleId)
        };
      }
      return sme;
    }));
  };

  const addInventoryItem = (smeId: string, name: string, category: string, quantity: number, price: number, supplier: string) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const newItem: InventoryItem = {
          id: `inv-${Date.now()}`,
          name,
          stockLevel: quantity,
          status: quantity === 0 ? 'Out of Stock' : quantity <= 10 ? 'Low Stock' : 'In Stock',
          daysRemaining: quantity * 2,
          reorderPoint: 10,
          unitPrice: price,
          category,
          supplier
        };

        const updatedAlerts = [
          {
            id: `alert-inv-add-${Date.now()}`,
            type: 'info' as const,
            text: `Inventory restocked: Added ${quantity}x ${name} to stock catalog.`
          },
          ...sme.riskAlerts
        ];

        return {
          ...sme,
          inventoryItems: [...sme.inventoryItems, newItem],
          riskAlerts: updatedAlerts
        };
      }
      return sme;
    }));
  };

  const deleteInventoryItem = (smeId: string, itemId: string) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const itemToDelete = sme.inventoryItems.find(i => i.id === itemId);
        if (!itemToDelete) return sme;

        const updatedAlerts = [
          {
            id: `alert-inv-del-${Date.now()}`,
            type: 'warning' as const,
            text: `Inventory catalog update: Removed ${itemToDelete.name} from active tracking.`
          },
          ...sme.riskAlerts
        ];

        return {
          ...sme,
          inventoryItems: sme.inventoryItems.filter(i => i.id !== itemId),
          riskAlerts: updatedAlerts
        };
      }
      return sme;
    }));
  };

  const createProduct = async (data: {
    name: string;
    description?: string;
    unit: string;
    unitPrice: number;
    costPrice?: number;
    stockQuantity: number;
    reorderLevel?: number;
    category?: string;
  }): Promise<ProductItem> => {
    const qty = Number(data.stockQuantity) || 0;
    const reorder = Number(data.reorderLevel) || 5;
    let status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstock' = 'In Stock';
    if (qty <= 0) status = 'Out of Stock';
    else if (qty <= reorder) status = 'Low Stock';

    let newProd: ProductItem = {
      id: `prod-${Date.now()}`,
      name: data.name,
      description: data.description,
      unit: data.unit || 'pcs',
      unitPrice: Number(data.unitPrice) || 0,
      costPrice: data.costPrice !== undefined ? Number(data.costPrice) : undefined,
      stockQuantity: qty,
      reorderLevel: reorder,
      category: data.category || 'General Merchandise',
      status,
      createdAt: new Date().toISOString()
    };

    try {
      const res = await apiRequest('/inventory/products', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res && res.success && res.data?.product) {
        newProd = res.data.product;
      }
    } catch (err) {
      console.warn('Backend product creation fallback:', err);
    }

    setProducts(prev => [newProd, ...prev.filter(p => p.id !== newProd.id)]);

    const matchingInvItem: InventoryItem = {
      id: newProd.id,
      name: newProd.name,
      unit: newProd.unit,
      stockLevel: newProd.stockQuantity,
      status: newProd.status,
      daysRemaining: Math.round(newProd.stockQuantity * 2),
      reorderPoint: newProd.reorderLevel || 10,
      unitPrice: newProd.unitPrice,
      costPrice: newProd.costPrice,
      category: newProd.category,
      description: newProd.description
    };

    setSmes(prev => prev.map(sme => {
      if (sme.id === selectedSmeId) {
        return {
          ...sme,
          inventoryItems: [matchingInvItem, ...sme.inventoryItems.filter(i => i.id !== matchingInvItem.id)]
        };
      }
      return sme;
    }));

    return newProd;
  };

  const updateProduct = async (id: string, data: Partial<ProductItem>): Promise<ProductItem> => {
    let updatedProd: ProductItem | null = null;

    try {
      const res = await apiRequest(`/inventory/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      if (res && res.success && res.data?.product) {
        updatedProd = res.data.product;
      }
    } catch (err) {
      console.warn('Backend product update fallback:', err);
    }

    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const merged = updatedProd || { ...p, ...data };
        const qty = merged.stockQuantity !== undefined ? Number(merged.stockQuantity) : p.stockQuantity;
        const reorder = merged.reorderLevel !== undefined ? Number(merged.reorderLevel) : (p.reorderLevel || 5);
        let status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstock' = 'In Stock';
        if (qty <= 0) status = 'Out of Stock';
        else if (qty <= reorder) status = 'Low Stock';
        return { ...merged, status };
      }
      return p;
    }));

    return updatedProd || (products.find(p => p.id === id) as ProductItem);
  };

  const deleteProduct = async (id: string): Promise<void> => {
    try {
      await apiRequest(`/inventory/products/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Backend product delete fallback:', err);
    }

    setProducts(prev => prev.filter(p => p.id !== id));
    setSmes(prev => prev.map(sme => {
      if (sme.id === selectedSmeId) {
        return {
          ...sme,
          inventoryItems: sme.inventoryItems.filter(i => i.id !== id)
        };
      }
      return sme;
    }));
  };

  const recordStockIntake = async (supplier: string, items: any[], notes?: string): Promise<any> => {
    try {
      const res = await apiRequest('/inventory/stock-intake', {
        method: 'POST',
        body: JSON.stringify({ supplier, items, notes })
      });
      await refreshProducts();
      return res;
    } catch (err) {
      console.warn('Backend stock intake fallback:', err);
      items.forEach(it => {
        if (it.productId) {
          setProducts(prev => prev.map(p => {
            if (p.id === it.productId) {
              const newQty = p.stockQuantity + Number(it.quantity || 0);
              return { ...p, stockQuantity: newQty };
            }
            return p;
          }));
        }
      });
    }
  };

  const recordSaleTransaction = async (payload: {
    customer: string;
    customerContact?: string;
    invoiceNumber?: string;
    paymentStatus?: 'Completed' | 'Pending' | 'Partial' | 'Cancelled';
    paymentMethod?: string;
    notes?: string;
    items: {
      productId?: string;
      productName: string;
      unit: string;
      quantity: number;
      unitPrice: number;
    }[];
  }): Promise<any> => {
    const totalAmount = payload.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    
    let createdSaleRecord: Sale = {
      id: `sale-${Date.now()}`,
      customer: payload.customer,
      product: payload.items.length > 0 ? payload.items[0].productName + (payload.items.length > 1 ? ` (+${payload.items.length - 1} items)` : '') : 'Sale',
      unit: payload.items[0]?.unit || 'pcs',
      quantity: payload.items.reduce((sum, it) => sum + Number(it.quantity), 0),
      price: payload.items[0]?.unitPrice || 0,
      total: totalAmount,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: payload.paymentStatus || 'Completed',
      items: payload.items.map(it => ({
        productId: it.productId,
        productName: it.productName,
        unit: it.unit,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.quantity * it.unitPrice
      }))
    };

    try {
      const res = await apiRequest('/sales', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res && res.success && res.data?.sale) {
        const s = res.data.sale;
        createdSaleRecord = {
          id: s.id,
          customer: s.customer,
          product: s.items && s.items.length > 0 ? s.items[0].productName + (s.items.length > 1 ? ` (+${s.items.length - 1} items)` : '') : 'Sale',
          unit: s.items && s.items.length > 0 ? s.items[0].unit : 'pcs',
          quantity: s.items ? s.items.reduce((sum: number, it: any) => sum + it.quantity, 0) : 1,
          price: s.items && s.items.length > 0 ? s.items[0].unitPrice : s.totalAmount,
          total: s.totalAmount,
          date: new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: s.paymentStatus || 'Completed',
          items: s.items || []
        };
      }
      await refreshProducts();
    } catch (err) {
      console.warn('Backend sale recording fallback:', err);
      payload.items.forEach(it => {
        if (it.productId) {
          setProducts(prev => prev.map(p => {
            if (p.id === it.productId) {
              const newQty = Math.max(0, p.stockQuantity - Number(it.quantity || 0));
              return { ...p, stockQuantity: newQty };
            }
            return p;
          }));
        }
      });
    }

    setSmes(prev => prev.map(sme => {
      if (sme.id === selectedSmeId) {
        const updatedAlerts = [
          {
            id: `alert-sale-${Date.now()}`,
            type: 'info' as const,
            text: `Sale recorded: Invoice for ${payload.customer} (${formatRWF(totalAmount)}). Reserves credited.`
          },
          ...sme.riskAlerts
        ];

        return {
          ...sme,
          currentBalance: sme.currentBalance + totalAmount,
          sales: [createdSaleRecord, ...sme.sales],
          riskAlerts: updatedAlerts
        };
      }
      return sme;
    }));

    return createdSaleRecord;
  };

  const addExpense = (smeId: string, description: string, category: string, amount: number) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const newExpense: Expense = {
          id: Date.now(),
          description,
          category,
          amount,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        const updatedAlerts = [
          {
            id: `alert-exp-add-${Date.now()}`,
            type: 'info' as const,
            text: `Expense recorded: ${description} (${category}). Cash reserves debited by ${formatRWF(amount)}.`
          },
          ...sme.riskAlerts
        ];

        const updatedMonthlyData = [...sme.monthlyData];
        if (updatedMonthlyData.length > 0) {
          const currentMonth = updatedMonthlyData[updatedMonthlyData.length - 1];
          updatedMonthlyData[updatedMonthlyData.length - 1] = {
            ...currentMonth,
            expenses: currentMonth.expenses + amount,
            outflow: currentMonth.outflow + amount
          };
        }

        return {
          ...sme,
          currentBalance: Math.max(0, sme.currentBalance - amount),
          riskAlerts: updatedAlerts,
          monthlyData: updatedMonthlyData,
          expenses: [newExpense, ...(sme.expenses || [])]
        };
      }
      return sme;
    }));
  };

  const deleteExpense = (smeId: string, expenseId: number) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const expenseToDelete = (sme.expenses || []).find(e => e.id === expenseId);
        if (!expenseToDelete) return sme;

        const updatedAlerts = [
          {
            id: `alert-exp-del-${Date.now()}`,
            type: 'warning' as const,
            text: `Expense reversed: ${expenseToDelete.description}. Cash reserves credited by ${formatRWF(expenseToDelete.amount)}.`
          },
          ...sme.riskAlerts
        ];

        const updatedMonthlyData = [...sme.monthlyData];
        if (updatedMonthlyData.length > 0) {
          const currentMonth = updatedMonthlyData[updatedMonthlyData.length - 1];
          updatedMonthlyData[updatedMonthlyData.length - 1] = {
            ...currentMonth,
            expenses: Math.max(0, currentMonth.expenses - expenseToDelete.amount),
            outflow: Math.max(0, currentMonth.outflow - expenseToDelete.amount)
          };
        }

        return {
          ...sme,
          currentBalance: sme.currentBalance + expenseToDelete.amount,
          riskAlerts: updatedAlerts,
          monthlyData: updatedMonthlyData,
          expenses: (sme.expenses || []).filter(e => e.id !== expenseId)
        };
      }
      return sme;
    }));
  };

  const addPurchase = async (smeId: string, supplier: string, items: any[], invoiceRef?: string, paymentMethod: string = 'Cash', notes?: string) => {
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
    const newPurchase: PurchaseTransaction = {
      id: `purch-${Date.now()}`,
      supplier,
      invoiceRef,
      paymentMethod,
      totalAmount,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Completed',
      items: items.map(it => ({
        productId: it.productId,
        productName: it.name || it.productName,
        unit: it.unit || 'pcs',
        quantity: Number(it.quantity || 0),
        unitPrice: Number(it.unitPrice || 0),
        total: Number(it.quantity || 0) * Number(it.unitPrice || 0)
      })),
      notes
    };

    try {
      await recordStockIntake(
        supplier,
        items.map(it => ({
          productId: it.productId,
          productName: it.name || it.productName,
          unit: it.unit || 'pcs',
          quantity: Number(it.quantity || 0),
          unitPrice: Number(it.unitPrice || 0)
        })),
        invoiceRef ? `Invoice: ${invoiceRef}` : notes
      );
    } catch (e) {
      console.warn('Stock intake backend fallback:', e);
    }

    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const updatedAlerts = [
          {
            id: `alert-purch-${Date.now()}`,
            type: 'info' as const,
            text: `Purchase recorded: ${items.length} product(s) from ${supplier}. Total outflow ${formatRWF(totalAmount)}.`
          },
          ...sme.riskAlerts
        ];

        const updatedMonthlyData = [...sme.monthlyData];
        if (updatedMonthlyData.length > 0) {
          const currentMonth = updatedMonthlyData[updatedMonthlyData.length - 1];
          updatedMonthlyData[updatedMonthlyData.length - 1] = {
            ...currentMonth,
            outflow: currentMonth.outflow + totalAmount
          };
        }

        return {
          ...sme,
          currentBalance: Math.max(0, sme.currentBalance - totalAmount),
          riskAlerts: updatedAlerts,
          monthlyData: updatedMonthlyData,
          purchases: [newPurchase, ...(sme.purchases || [])]
        };
      }
      return sme;
    }));

    return newPurchase;
  };

  const deletePurchase = (smeId: string, purchaseId: string | number) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const pToDelete = (sme.purchases || []).find(p => p.id === purchaseId);
        if (!pToDelete) return sme;

        const updatedMonthlyData = [...sme.monthlyData];
        if (updatedMonthlyData.length > 0) {
          const currentMonth = updatedMonthlyData[updatedMonthlyData.length - 1];
          updatedMonthlyData[updatedMonthlyData.length - 1] = {
            ...currentMonth,
            outflow: Math.max(0, currentMonth.outflow - pToDelete.totalAmount)
          };
        }

        return {
          ...sme,
          currentBalance: sme.currentBalance + pToDelete.totalAmount,
          monthlyData: updatedMonthlyData,
          purchases: (sme.purchases || []).filter(p => p.id !== purchaseId)
        };
      }
      return sme;
    }));
  };

  const addCashIn = (smeId: string, data: { amount: number; source: string; reason: string; paymentMethod: string; category?: string; date?: string; notes?: string }) => {
    const newCashIn: CashInTransaction = {
      id: `cashin-${Date.now()}`,
      amount: data.amount,
      source: data.source,
      reason: data.reason,
      category: data.category || 'Other Inflow',
      paymentMethod: data.paymentMethod,
      date: data.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      notes: data.notes
    };

    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const updatedAlerts = [
          {
            id: `alert-cashin-${Date.now()}`,
            type: 'info' as const,
            text: `Cash Inflow logged: ${formatRWF(data.amount)} received from ${data.source} (${data.reason}).`
          },
          ...sme.riskAlerts
        ];

        const updatedMonthlyData = [...sme.monthlyData];
        if (updatedMonthlyData.length > 0) {
          const currentMonth = updatedMonthlyData[updatedMonthlyData.length - 1];
          updatedMonthlyData[updatedMonthlyData.length - 1] = {
            ...currentMonth,
            inflow: currentMonth.inflow + data.amount
          };
        }

        return {
          ...sme,
          currentBalance: sme.currentBalance + data.amount,
          riskAlerts: updatedAlerts,
          monthlyData: updatedMonthlyData,
          cashIns: [newCashIn, ...(sme.cashIns || [])]
        };
      }
      return sme;
    }));
  };

  const deleteCashIn = (smeId: string, id: string | number) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const item = (sme.cashIns || []).find(c => c.id === id);
        if (!item) return sme;

        const updatedMonthlyData = [...sme.monthlyData];
        if (updatedMonthlyData.length > 0) {
          const currentMonth = updatedMonthlyData[updatedMonthlyData.length - 1];
          updatedMonthlyData[updatedMonthlyData.length - 1] = {
            ...currentMonth,
            inflow: Math.max(0, currentMonth.inflow - item.amount)
          };
        }

        return {
          ...sme,
          currentBalance: Math.max(0, sme.currentBalance - item.amount),
          monthlyData: updatedMonthlyData,
          cashIns: (sme.cashIns || []).filter(c => c.id !== id)
        };
      }
      return sme;
    }));
  };

  const addCashOut = (smeId: string, data: { amount: number; category: string; description: string; paymentMethod: string; date?: string; notes?: string }) => {
    const newCashOut: CashOutTransaction = {
      id: `cashout-${Date.now()}`,
      amount: data.amount,
      category: data.category,
      description: data.description,
      paymentMethod: data.paymentMethod,
      date: data.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      notes: data.notes
    };

    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const updatedAlerts = [
          {
            id: `alert-cashout-${Date.now()}`,
            type: 'info' as const,
            text: `Cash Outflow logged: ${formatRWF(data.amount)} for ${data.description} (${data.category}).`
          },
          ...sme.riskAlerts
        ];

        const updatedMonthlyData = [...sme.monthlyData];
        if (updatedMonthlyData.length > 0) {
          const currentMonth = updatedMonthlyData[updatedMonthlyData.length - 1];
          updatedMonthlyData[updatedMonthlyData.length - 1] = {
            ...currentMonth,
            outflow: currentMonth.outflow + data.amount
          };
        }

        return {
          ...sme,
          currentBalance: Math.max(0, sme.currentBalance - data.amount),
          riskAlerts: updatedAlerts,
          monthlyData: updatedMonthlyData,
          cashOuts: [newCashOut, ...(sme.cashOuts || [])]
        };
      }
      return sme;
    }));
  };

  const deleteCashOut = (smeId: string, id: string | number) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const item = (sme.cashOuts || []).find(c => c.id === id);
        if (!item) return sme;

        const updatedMonthlyData = [...sme.monthlyData];
        if (updatedMonthlyData.length > 0) {
          const currentMonth = updatedMonthlyData[updatedMonthlyData.length - 1];
          updatedMonthlyData[updatedMonthlyData.length - 1] = {
            ...currentMonth,
            outflow: Math.max(0, currentMonth.outflow - item.amount)
          };
        }

        return {
          ...sme,
          currentBalance: sme.currentBalance + item.amount,
          monthlyData: updatedMonthlyData,
          cashOuts: (sme.cashOuts || []).filter(c => c.id !== id)
        };
      }
      return sme;
    }));
  };

  const addOtherActivity = (smeId: string, data: { title: string; description?: string; date: string; status?: 'Planned' | 'In Progress' | 'Completed' | 'On Hold'; moneyInvolved: boolean; amount?: number; paymentStatus?: 'Completed' | 'Pending' | 'Partial' | 'N/A'; category?: string }) => {
    const newAct: OtherActivity = {
      id: `act-${Date.now()}`,
      title: data.title,
      description: data.description,
      date: data.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: data.status || 'Completed',
      moneyInvolved: data.moneyInvolved,
      amount: data.amount,
      paymentStatus: data.paymentStatus,
      category: data.category
    };

    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const updatedAlerts = [
          {
            id: `alert-act-${Date.now()}`,
            type: 'info' as const,
            text: `Milestone logged: ${data.title} marked as ${data.status || 'Completed'}.`
          },
          ...sme.riskAlerts
        ];

        return {
          ...sme,
          riskAlerts: updatedAlerts,
          otherActivities: [newAct, ...(sme.otherActivities || [])]
        };
      }
      return sme;
    }));
  };

  const deleteOtherActivity = (smeId: string, id: string | number) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        return {
          ...sme,
          otherActivities: (sme.otherActivities || []).filter(a => a.id !== id)
        };
      }
      return sme;
    }));
  };

  const publishOpportunity = async (opp: Omit<Opportunity, 'id' | 'views' | 'saved' | 'applicationsCount' | 'status' | 'createdAt'>) => {
    let createdOpp: Opportunity = {
      ...opp,
      id: `opp-${Date.now()}`,
      views: 0,
      saved: 0,
      applicationsCount: 0,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0]
    };

    try {
      const res = await apiRequest('/opportunities', {
        method: 'POST',
        body: JSON.stringify(opp)
      });
      if (res && res.success && res.data) {
        createdOpp = {
          ...createdOpp,
          ...res.data,
          sectors: Array.isArray(res.data.sectors) ? res.data.sectors : opp.sectors,
          requiredDocs: Array.isArray(res.data.requiredDocs) ? res.data.requiredDocs : opp.requiredDocs
        };
      }
    } catch (err) {
      console.warn('Backend opportunity persistence fallback:', err);
    }

    setOpportunities(prev => [createdOpp, ...prev.filter(o => o.id !== createdOpp.id)]);
  };

  const applyForOpportunity = (oppId: string, smeId: string) => {
    const targetOpp = opportunities.find(o => o.id === oppId);
    const targetSme = smes.find(s => s.id === smeId);
    if (!targetOpp || !targetSme) return;

    const exists = applications.some(a => a.opportunityId === oppId && a.smeId === smeId);
    if (exists) return;

    const newApp: Application = {
      id: `app-${Date.now()}`,
      opportunityId: oppId,
      opportunityTitle: targetOpp.title,
      smeId,
      smeName: targetSme.name,
      smeSector: targetSme.sector,
      smeReadiness: Math.round(targetSme.healthScore * 1.05),
      smeHealth: targetSme.healthScore,
      status: 'Submitted',
      appliedAt: new Date().toISOString().split('T')[0],
      feedback: 'Application submitted successfully. Waiting for financial institution review.',
      aiSuggestions: [
        'Keep inventory levels optimal to maintain positive cash reserves.',
        'Attend scheduled virtual trainings to improve financial record scores.'
      ]
    };

    setApplications(prev => [newApp, ...prev]);
    setOpportunities(prev => prev.map(o => {
      if (o.id === oppId) {
        return { ...o, applicationsCount: o.applicationsCount + 1 };
      }
      return o;
    }));
  };

  const updateApplicationStatus = (appId: string, status: Application['status'], feedback?: string) => {
    setApplications(prev => prev.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          status,
          feedback: feedback || app.feedback
        };
      }
      return app;
    }));
  };

  const createTraining = (training: Omit<Training, 'id' | 'participantsCount' | 'attended' | 'completed' | 'hasCertificate'>) => {
    const newTr: Training = {
      ...training,
      id: `tr-${Date.now()}`,
      participantsCount: 0,
      attended: false,
      completed: false,
      hasCertificate: true,
      status: 'scheduled',
      attendees: [],
      chatMessages: [
        {
          id: `m-init-${Date.now()}`,
          senderName: training.speaker || 'Trainer',
          senderRole: 'host',
          text: `Welcome to ${training.title}! The session will start on ${training.date} at ${training.time}.`,
          timestamp: 'Scheduled'
        }
      ]
    };
    setTrainings(prev => [newTr, ...prev]);
  };

  const updateTraining = (trainingId: string, data: Partial<Training>) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        return { ...t, ...data };
      }
      return t;
    }));
  };

  const deleteTraining = (trainingId: string) => {
    setTrainings(prev => prev.filter(t => t.id !== trainingId));
  };

  const toggleTrainingEnrollment = (trainingId: string) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        const isNowEnrolled = !t.enrolled;
        const countDiff = isNowEnrolled ? 1 : -1;
        return {
          ...t,
          enrolled: isNowEnrolled,
          enrolledAt: isNowEnrolled ? new Date().toISOString() : undefined,
          participantsCount: Math.max(0, t.participantsCount + countDiff)
        };
      }
      return t;
    }));
  };

  const joinTraining = (trainingId: string) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        return {
          ...t,
          participantsCount: t.participantsCount + (t.attended ? 0 : 1),
          enrolled: true,
          attended: true,
          completed: true,
          hasCertificate: true
        };
      }
      return t;
    }));
  };

  const startLiveTraining = (trainingId: string) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        return {
          ...t,
          status: 'live'
        };
      }
      return t;
    }));
  };

  const endLiveTraining = (trainingId: string) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        return {
          ...t,
          status: 'completed',
          completed: true,
          attended: true
        };
      }
      return t;
    }));
  };

  const requestJoinLiveTraining = (trainingId: string, attendee: Omit<TrainingAttendee, 'status' | 'joinedAt'>) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        const existingAttendees = t.attendees || [];
        const found = existingAttendees.find(a => a.id === attendee.id);
        if (found) {
          return t;
        }
        const newAttendee: TrainingAttendee = {
          ...attendee,
          status: 'waiting',
          joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          handRaised: false,
          isMuted: false,
          cameraOn: true
        };
        return {
          ...t,
          attendees: [...existingAttendees, newAttendee],
          participantsCount: t.participantsCount + 1,
          enrolled: true
        };
      }
      return t;
    }));
  };

  const admitAttendee = (trainingId: string, attendeeId: string) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        const updatedAttendees = (t.attendees || []).map(a => {
          if (a.id === attendeeId) {
            return { ...a, status: 'admitted' as const };
          }
          return a;
        });
        return {
          ...t,
          attendees: updatedAttendees
        };
      }
      return t;
    }));
  };

  const admitAllAttendees = (trainingId: string) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        const updatedAttendees = (t.attendees || []).map(a => ({
          ...a,
          status: 'admitted' as const
        }));
        return {
          ...t,
          attendees: updatedAttendees
        };
      }
      return t;
    }));
  };

  const toggleHandRaise = (trainingId: string, attendeeId: string) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        const updatedAttendees = (t.attendees || []).map(a => {
          if (a.id === attendeeId) {
            return { ...a, handRaised: !a.handRaised };
          }
          return a;
        });
        return {
          ...t,
          attendees: updatedAttendees
        };
      }
      return t;
    }));
  };

  const sendTrainingMessage = (trainingId: string, message: Omit<TrainingChatMessage, 'id' | 'timestamp'>) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        const newMsg: TrainingChatMessage = {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        return {
          ...t,
          chatMessages: [...(t.chatMessages || []), newMsg]
        };
      }
      return t;
    }));
  };

  const bookmarkOpportunity = (oppId: string) => {
    setBookmarkedOpportunities(prev => {
      const isBookmarked = prev.includes(oppId);
      let updated;
      if (isBookmarked) {
        updated = prev.filter(id => id !== oppId);
      } else {
        updated = [...prev, oppId];
      }
      setOpportunities(prevOpps => prevOpps.map(o => {
        if (o.id === oppId) {
          return { ...o, saved: isBookmarked ? Math.max(0, o.saved - 1) : o.saved + 1 };
        }
        return o;
      }));
      return updated;
    });
  };

  const resetAll = () => {
    setSmes(mockSmes);
    setSelectedSmeId('sme-1');
    setScenarios({ salesDrop: false, expenseIncrease: false, loanDelay: false });
    setLoanSimulation({ amount: 5000000, period: 12, rate: 15 });
    
    setOpportunities(initialOpportunities);
    setApplications(initialApplications);
    setTrainings(initialTrainings);
    setBookmarkedOpportunities([]);
    
    localStorage.setItem('elevata_opportunities', JSON.stringify(initialOpportunities));
    localStorage.setItem('elevata_applications', JSON.stringify(initialApplications));
    localStorage.setItem('elevata_trainings', JSON.stringify(initialTrainings));
    localStorage.setItem('elevata_bookmarked', JSON.stringify([]));
  };

  return (
    <AppContext.Provider value={{
      selectedSmeId,
      setSelectedSmeId,
      smes,
      activeSme,
      scenarios,
      setScenarios,
      loanSimulation,
      setLoanSimulation,
      approveLoan,
      rejectLoan,
      requestFieldVisit,
      addSale,
      deleteSale,
      addInventoryItem,
      deleteInventoryItem,
      addExpense,
      deleteExpense,
      addPurchase,
      deletePurchase,
      addCashIn,
      deleteCashIn,
      addCashOut,
      deleteCashOut,
      addOtherActivity,
      deleteOtherActivity,
      resetAll,
      products,
      createProduct,
      updateProduct,
      deleteProduct,
      recordStockIntake,
      recordSaleTransaction,
      refreshProducts,
      refreshSales,
      opportunities,
      applications,
      trainings,
      bookmarkedOpportunities,
      publishOpportunity,
      applyForOpportunity,
      updateApplicationStatus,
      createTraining,
      updateTraining,
      deleteTraining,
      joinTraining,
      toggleTrainingEnrollment,
      startLiveTraining,
      endLiveTraining,
      requestJoinLiveTraining,
      admitAttendee,
      admitAllAttendees,
      toggleHandRaise,
      sendTrainingMessage,
      bookmarkOpportunity
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
};

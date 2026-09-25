import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  SmeProfile,
  Sale,
  InventoryItem,
  Expense,
  formatRWF,
  ProductItem,
  CashInTransaction,
  CashOutTransaction,
  OtherActivity
} from '../lib/mockData';
import { apiRequest } from '../lib/api';
import { useAuth } from './AuthContext';

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
  publisher?: {
    institutionName: string;
    representativeName?: string;
    category?: string;
    operatingScope?: string;
    email?: string;
    phone?: string;
    website?: string;
  } | null;
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
  requestedAmount?: number;
  purpose?: string;
  termMonths?: number;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  documents?: ApplicationDocument[];
}

export interface ApplicationDocument {
  id: string;
  documentType: string;
  name: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  downloadUrl: string;
}

export interface TrainingAttendee {
  id: string;
  name: string;
  businessName: string;
  company?: string;
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

export interface TrainingLiveState {
  isScreenSharing?: boolean;
  shareType?: 'screen' | 'slides';
  currentSlideIndex?: number;
  hostMicOn?: boolean;
  hostCamOn?: boolean;
  screenSnapshot?: string; // base64 JPEG snapshot for instant screen display
  cameraSnapshot?: string; // base64 JPEG snapshot for presenter camera
  updatedAt?: number;
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
  liveState?: TrainingLiveState;
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
  addSale: (smeId: string, product: string, quantity: number, price: number, customer: string) => void;
  deleteSale: (smeId: string, saleId: number | string) => void;
  addInventoryItem: (smeId: string, name: string, category: string, quantity: number, price: number, supplier: string) => void;
  deleteInventoryItem: (smeId: string, itemId: string) => void;
  addExpense: (smeId: string, description: string, category: string, amount: number) => void;
  deleteExpense: (smeId: string, expenseId: string | number) => void;
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
  refreshApplications: () => Promise<void>;
  trainings: Training[];
  refreshTrainings: (smeId?: string) => Promise<void>;
  bookmarkedOpportunities: string[];
  publishOpportunity: (opp: Omit<Opportunity, 'id' | 'views' | 'saved' | 'applicationsCount' | 'status' | 'createdAt'>) => Promise<Opportunity>;
  applyForOpportunity: (data: {
    opportunityId: string;
    requestedAmount: number;
    purpose: string;
    termMonths: number;
    contactPhone: string;
    contactEmail: string;
    notes?: string;
    documents: Record<string, File>;
  }) => Promise<Application>;
  updateApplicationStatus: (appId: string, status: Application['status'], feedback?: string) => Promise<void>;
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
  updateTrainingLiveState: (trainingId: string, liveState: Partial<TrainingLiveState>) => void;
  bookmarkOpportunity: (oppId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const EMPTY_SME: SmeProfile = {
  id: '',
  name: 'Complete your business profile',
  sector: 'Retail',
  ownerName: '',
  email: '',
  healthScore: 0,
  healthTrend: 'stable',
  healthTrendPercent: 0,
  currentBalance: 0,
  borrowingCapacity: 0,
  riskRating: 'High',
  inventoryItems: [],
  loanDetails: { status: 'None', outstandingAmount: 0, monthlyInstallment: 0, interestRate: 0, repaymentPeriodMonths: 0 },
  riskAlerts: [],
  monthlyData: [],
  sales: [],
  expenses: [],
  purchases: [],
  cashIns: [],
  cashOuts: [],
  otherActivities: [],
  age: 0
};

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  const refreshApplications = useCallback(async () => {
    if (!user) return;
    const endpoint = user.role === 'BUSINESS' ? '/applications/mine' : '/applications';
    try {
      const res = await apiRequest(endpoint);
      if (res?.success && Array.isArray(res.data)) {
        setApplications(res.data.map((application: any) => ({
          ...application,
          smeReadiness: application.smeReadiness ?? 0,
          smeHealth: application.smeHealth ?? 0,
          feedback: application.feedback || 'Application received. Pending review.',
          aiSuggestions: Array.isArray(application.aiSuggestions) ? application.aiSuggestions : [],
          documents: Array.isArray(application.documents) ? application.documents : []
        })));
      }
    } catch (error) {
      console.warn('Unable to synchronize applications:', error);
    }
  }, [user]);

  useEffect(() => {
    refreshApplications();
  }, [refreshApplications]);

  const [trainings, setTrainings] = useState<Training[]>([]);

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

  // Load the persisted opportunity list from the backend.
  useEffect(() => {
    async function fetchBackendOpportunities() {
      try {
        const res = await apiRequest('/opportunities');
        if (res && res.success && Array.isArray(res.data)) {
          setOpportunities(res.data.map((opportunity: Opportunity) => ({
            ...opportunity,
            sectors: Array.isArray(opportunity.sectors) ? opportunity.sectors : [],
            requiredDocs: Array.isArray(opportunity.requiredDocs) ? opportunity.requiredDocs : []
          })));
        }
      } catch (err) {
        console.warn('Unable to load opportunities:', err);
      }
    }
    fetchBackendOpportunities();
  }, []);

  const [selectedSmeId, setSelectedSmeId] = useState('');
  const [smes, setSmes] = useState<SmeProfile[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);

  useEffect(() => {
    if (localStorage.getItem('elevata_data_source') === 'database-v1') return;
    ['elevata_smes', 'elevata_sme_id', 'elevata_products', 'elevata_opportunities', 'elevata_applications', 'elevata_trainings']
      .forEach((key) => localStorage.removeItem(key));
    localStorage.setItem('elevata_data_source', 'database-v1');
  }, []);

  const refreshProducts = async () => {
    try {
      const res = await apiRequest('/inventory/products');
      if (res && res.success && Array.isArray(res.data?.products)) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.warn('Unable to load products:', err);
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
              sales: backendSales
            };
          }
          return sme;
        }));
      }
    } catch (err) {
      console.warn('Unable to load sales:', err);
    }
  };

  useEffect(() => {
    if (user?.role !== 'BUSINESS') return;
    refreshProducts();
    refreshSales();
  }, [selectedSmeId, user?.role]);

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

  const normalizeDashboard = useCallback((raw: any): SmeProfile => {
    const supportedSectors: SmeProfile['sector'][] = ['Retail', 'Agriculture', 'Logistics', 'Technology'];
    const sector = supportedSectors.includes(raw.sector as SmeProfile['sector'])
      ? raw.sector as SmeProfile['sector']
      : 'Retail';
    return {
      ...EMPTY_SME,
      ...raw,
      sector,
      inventoryItems: Array.isArray(raw.inventoryItems) ? raw.inventoryItems : [],
      monthlyData: Array.isArray(raw.monthlyData) ? raw.monthlyData : [],
      riskAlerts: Array.isArray(raw.riskAlerts) ? raw.riskAlerts : [],
      loanDetails: { ...EMPTY_SME.loanDetails, ...(raw.loanDetails || {}) },
      sales: Array.isArray(raw.sales) ? raw.sales.map((sale: any) => ({
        id: sale.id,
        customer: sale.customer,
        product: sale.product || sale.items?.[0]?.productName || 'Sale',
        unit: sale.unit || sale.items?.[0]?.unit || 'pcs',
        quantity: sale.quantity ?? sale.items?.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0) ?? 0,
        price: sale.price ?? sale.items?.[0]?.unitPrice ?? sale.totalAmount ?? 0,
        total: sale.total ?? sale.totalAmount ?? 0,
        date: sale.date || sale.createdAt,
        status: sale.status || sale.paymentStatus || 'Completed',
        items: sale.items || []
      })) : [],
      expenses: Array.isArray(raw.expenses) ? raw.expenses.map((entry: any) => ({
        id: entry.id,
        description: entry.description,
        category: entry.category || 'Expense',
        amount: entry.amount,
        date: entry.occurredAt || entry.date
      })) : [],
      purchases: Array.isArray(raw.purchases) ? raw.purchases.map((entry: any) => ({
        id: entry.id,
        supplier: entry.supplier || 'Supplier',
        invoiceRef: entry.invoiceNumber,
        totalAmount: entry.totalAmount || 0,
        date: entry.createdAt || entry.date,
        status: entry.status || 'Completed',
        items: entry.items || [],
        notes: entry.notes
      })) : [],
      cashIns: Array.isArray(raw.cashIns) ? raw.cashIns.map((entry: any) => ({
        id: entry.id,
        amount: entry.amount,
        source: entry.counterparty || 'Business income',
        reason: entry.description,
        category: entry.category,
        paymentMethod: entry.paymentMethod || '',
        date: entry.occurredAt
      })) : [],
      cashOuts: Array.isArray(raw.cashOuts) ? raw.cashOuts.map((entry: any) => ({
        id: entry.id,
        amount: entry.amount,
        category: entry.category || 'Expense',
        description: entry.description,
        paymentMethod: entry.paymentMethod || '',
        date: entry.occurredAt
      })) : [],
      otherActivities: Array.isArray(raw.otherActivities) ? raw.otherActivities.map((entry: any) => ({
        id: entry.id,
        title: entry.description,
        description: entry.metadata?.description,
        date: entry.occurredAt,
        status: entry.status,
        moneyInvolved: entry.amount > 0,
        amount: entry.amount,
        category: entry.category
      })) : []
    };
  }, []);

  const refreshBusinessData = useCallback(async () => {
    if (!user) return;
    try {
      const endpoint = user.role === 'BUSINESS' ? '/business/dashboard' : '/portfolio/businesses';
      const res = await apiRequest(endpoint);
      const records = user.role === 'BUSINESS'
        ? (res.data?.dashboard ? [res.data.dashboard] : [])
        : (Array.isArray(res.data?.businesses) ? res.data.businesses : []);
      const normalized: SmeProfile[] = (records as unknown[]).map(normalizeDashboard);
      setSmes(normalized);
      setSelectedSmeId((current) => normalized.some((item) => item.id === current) ? current : (normalized[0]?.id || ''));
    } catch (error) {
      console.warn('Unable to load business dashboard data:', error);
      setSmes([]);
      setSelectedSmeId('');
    }
  }, [user, normalizeDashboard]);

  useEffect(() => {
    refreshBusinessData();
  }, [refreshBusinessData]);

  const activeSme = smes.find(sme => sme.id === selectedSmeId) || smes[0] || EMPTY_SME;

  // Synchronize trainings with PostgreSQL database for real-time cross-device availability
  const refreshTrainings = useCallback(async (targetSmeId?: string) => {
    try {
      const activeId = targetSmeId || selectedSmeId || activeSme?.id || '';
      const query = activeId ? `?smeId=${encodeURIComponent(activeId)}` : '';
      const res = await apiRequest(`/trainings${query}`);
      if (res && res.success && Array.isArray(res.data)) {
        setTrainings(res.data.map((training: Training) => ({
          ...training,
          targetAudience: Array.isArray(training.targetAudience) ? training.targetAudience : [],
          curriculum: Array.isArray(training.curriculum) ? training.curriculum : [],
          attendees: Array.isArray(training.attendees) ? training.attendees : [],
          chatMessages: Array.isArray(training.chatMessages) ? training.chatMessages : []
        })));
      }
    } catch (err) {
      console.warn('Unable to load trainings:', err);
    }
  }, [selectedSmeId, activeSme?.id]);

  useEffect(() => {
    refreshTrainings(selectedSmeId);
    // Fast polling (every 2.5s) for responsive cross-device live virtual training sync
    const interval = setInterval(() => {
      refreshTrainings(selectedSmeId);
    }, 2500);
    return () => clearInterval(interval);
  }, [refreshTrainings, selectedSmeId]);

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

  const deleteSale = async (smeId: string, saleId: string | number) => {
    if (typeof saleId === 'string' && !saleId.startsWith('sale-')) {
      await apiRequest(`/sales/${saleId}`, { method: 'DELETE' });
    }
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
    const res = await apiRequest('/inventory/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!res?.success || !res.data?.product) {
      throw new Error('Product creation did not return a persisted product.');
    }
    const newProd: ProductItem = res.data.product;

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
    const res = await apiRequest(`/inventory/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!res?.success || !res.data?.product) {
      throw new Error('Product update did not return a persisted product.');
    }
    const updatedProd: ProductItem = res.data.product;

    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const merged = updatedProd;
        const qty = merged.stockQuantity !== undefined ? Number(merged.stockQuantity) : p.stockQuantity;
        const reorder = merged.reorderLevel !== undefined ? Number(merged.reorderLevel) : (p.reorderLevel || 5);
        let status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstock' = 'In Stock';
        if (qty <= 0) status = 'Out of Stock';
        else if (qty <= reorder) status = 'Low Stock';
        return { ...merged, status };
      }
      return p;
    }));

    return updatedProd;
  };

  const deleteProduct = async (id: string): Promise<void> => {
    await apiRequest(`/inventory/products/${id}`, {
      method: 'DELETE'
    });

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
    const res = await apiRequest('/inventory/stock-intake', {
      method: 'POST',
      body: JSON.stringify({ supplier, items, notes })
    });
    if (!res?.success || !res.data?.intake) {
      throw new Error('Stock intake did not return a persisted record.');
    }
    await refreshProducts();
    return res;
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
    const res = await apiRequest('/sales', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res?.success || !res.data?.sale) {
      throw new Error('Sale recording did not return a persisted sale.');
    }
    const s = res.data.sale;
    const createdSaleRecord: Sale = {
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
    await refreshProducts();

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

  const addExpense = async (smeId: string, description: string, category: string, amount: number) => {
    await apiRequest('/business/ledger', {
      method: 'POST',
      body: JSON.stringify({ kind: 'EXPENSE', description, category, amount })
    });
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

  const deleteExpense = async (smeId: string, expenseId: string | number) => {
    await apiRequest(`/business/ledger/${expenseId}`, { method: 'DELETE' });
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

  const addPurchase = async (_smeId: string, supplier: string, items: any[], invoiceRef?: string, _paymentMethod: string = 'Cash', notes?: string) => {
    const res = await recordStockIntake(
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
    await refreshBusinessData();
    return res.data.intake;
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

  const addCashIn = async (smeId: string, data: { amount: number; source: string; reason: string; paymentMethod: string; category?: string; date?: string; notes?: string }) => {
    await apiRequest('/business/ledger', {
      method: 'POST',
      body: JSON.stringify({ kind: 'CASH_IN', amount: data.amount, counterparty: data.source, description: data.reason, paymentMethod: data.paymentMethod, category: data.category, occurredAt: data.date, metadata: { notes: data.notes } })
    });
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

  const deleteCashIn = async (smeId: string, id: string | number) => {
    await apiRequest(`/business/ledger/${id}`, { method: 'DELETE' });
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

  const addCashOut = async (smeId: string, data: { amount: number; category: string; description: string; paymentMethod: string; date?: string; notes?: string }) => {
    await apiRequest('/business/ledger', {
      method: 'POST',
      body: JSON.stringify({ kind: 'CASH_OUT', amount: data.amount, category: data.category, description: data.description, paymentMethod: data.paymentMethod, occurredAt: data.date, metadata: { notes: data.notes } })
    });
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

  const deleteCashOut = async (smeId: string, id: string | number) => {
    await apiRequest(`/business/ledger/${id}`, { method: 'DELETE' });
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

  const addOtherActivity = async (smeId: string, data: { title: string; description?: string; date: string; status?: 'Planned' | 'In Progress' | 'Completed' | 'On Hold'; moneyInvolved: boolean; amount?: number; paymentStatus?: 'Completed' | 'Pending' | 'Partial' | 'N/A'; category?: string }) => {
    await apiRequest('/business/ledger', {
      method: 'POST',
      body: JSON.stringify({ kind: 'OTHER', amount: data.moneyInvolved ? data.amount : 0, category: data.category, description: data.title, status: data.status, occurredAt: data.date, metadata: { description: data.description, paymentStatus: data.paymentStatus } })
    });
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

  const deleteOtherActivity = async (smeId: string, id: string | number) => {
    await apiRequest(`/business/ledger/${id}`, { method: 'DELETE' });
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
    const res = await apiRequest('/opportunities', {
      method: 'POST',
      body: JSON.stringify(opp)
    });
    if (!res?.success || !res.data?.id) {
      throw new Error('Opportunity publishing did not return a persisted opportunity.');
    }

    const createdOpp: Opportunity = {
      ...res.data,
      sectors: Array.isArray(res.data.sectors) ? res.data.sectors : [],
      requiredDocs: Array.isArray(res.data.requiredDocs) ? res.data.requiredDocs : []
    };
    setOpportunities(prev => [createdOpp, ...prev.filter(o => o.id !== createdOpp.id)]);
    return createdOpp;
  };

  const applyForOpportunity = async (data: {
    opportunityId: string;
    requestedAmount: number;
    purpose: string;
    termMonths: number;
    contactPhone: string;
    contactEmail: string;
    notes?: string;
    documents: Record<string, File>;
  }): Promise<Application> => {
    const form = new FormData();
    form.append('opportunityId', data.opportunityId);
    form.append('requestedAmount', String(data.requestedAmount));
    form.append('purpose', data.purpose);
    form.append('termMonths', String(data.termMonths));
    form.append('contactPhone', data.contactPhone);
    form.append('contactEmail', data.contactEmail);
    form.append('notes', data.notes || '');

    const entries = Object.entries(data.documents);
    form.append('documentTypes', JSON.stringify(entries.map(([documentType]) => documentType)));
    entries.forEach(([, file]) => form.append('documents', file));

    const res = await apiRequest('/applications', { method: 'POST', body: form });
    const created: Application = {
      ...res.data,
      smeReadiness: res.data.smeReadiness ?? Math.round(activeSme.healthScore * 1.05),
      smeHealth: res.data.smeHealth ?? activeSme.healthScore,
      aiSuggestions: res.data.aiSuggestions || []
    };
    setApplications(prev => [created, ...prev.filter(app => app.id !== created.id)]);
    setOpportunities(prev => prev.map(opportunity => (
      opportunity.id === data.opportunityId
        ? { ...opportunity, applicationsCount: opportunity.applicationsCount + 1 }
        : opportunity
    )));
    return created;
  };

  const updateApplicationStatus = async (appId: string, status: Application['status'], feedback?: string) => {
    const res = await apiRequest(`/applications/${appId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, feedback })
    });
    setApplications(prev => prev.map(app => (
      app.id === appId
        ? {
            ...app,
            ...res.data,
            smeReadiness: res.data.smeReadiness ?? app.smeReadiness,
            smeHealth: res.data.smeHealth ?? app.smeHealth,
            aiSuggestions: res.data.aiSuggestions || app.aiSuggestions
          }
        : app
    )));
  };

  const syncLiveRoomToBackend = async (trainingId: string, updates: { status?: string; attendees?: any[]; chatMessages?: any[]; liveState?: TrainingLiveState }) => {
    try {
      await apiRequest(`/trainings/${trainingId}/live`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    } catch (e) {
      // ignore
    }
  };

  const updateTrainingLiveState = (trainingId: string, liveState: Partial<TrainingLiveState>) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        const mergedLiveState = { ...(t.liveState || {}), ...liveState, updatedAt: Date.now() };
        // Video frames stay in the live media/BroadcastChannel path. Persisting
        // base64 frames would exceed API limits and bloat every training poll.
        const {
          cameraSnapshot: _cameraSnapshot,
          screenSnapshot: _screenSnapshot,
          ...persistedLiveState
        } = mergedLiveState;
        syncLiveRoomToBackend(trainingId, { liveState: persistedLiveState });
        return {
          ...t,
          liveState: mergedLiveState
        };
      }
      return t;
    }));
  };

  const createTraining = async (training: Omit<Training, 'id' | 'participantsCount' | 'attended' | 'completed' | 'hasCertificate'>) => {
    const tempId = `tr-${Date.now()}`;
    const newTr: Training = {
      ...training,
      id: tempId,
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

    try {
      const res = await apiRequest('/trainings', {
        method: 'POST',
        body: JSON.stringify(training)
      });
      if (res && res.success && res.data) {
        setTrainings(prev => prev.map(t => t.id === tempId ? { ...t, ...res.data } : t));
      }
    } catch (err) {
      console.warn('Backend createTraining error:', err);
    }
  };

  const updateTraining = async (trainingId: string, data: Partial<Training>) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        return { ...t, ...data };
      }
      return t;
    }));

    try {
      await apiRequest(`/trainings/${trainingId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.warn('Backend updateTraining error:', err);
    }
  };

  const deleteTraining = async (trainingId: string) => {
    setTrainings(prev => prev.filter(t => t.id !== trainingId));
    try {
      await apiRequest(`/trainings/${trainingId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Backend deleteTraining error:', err);
    }
  };

  const toggleTrainingEnrollment = async (trainingId: string) => {
    const currentTr = trainings.find(t => t.id === trainingId);
    const isNowEnrolled = !currentTr?.enrolled;
    const countDiff = isNowEnrolled ? 1 : -1;

    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        return {
          ...t,
          enrolled: isNowEnrolled,
          enrolledAt: isNowEnrolled ? new Date().toISOString() : undefined,
          participantsCount: Math.max(0, (t.participantsCount || 0) + countDiff)
        };
      }
      return t;
    }));

    try {
      await apiRequest(`/trainings/${trainingId}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ smeId: selectedSmeId || activeSme.id })
      });
    } catch (err) {
      console.warn('Backend toggleTrainingEnrollment error:', err);
    }
  };

  const joinTraining = async (trainingId: string) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        return {
          ...t,
          participantsCount: (t.participantsCount || 0) + (t.attended ? 0 : 1),
          enrolled: true,
          attended: true,
          completed: true,
          hasCertificate: true
        };
      }
      return t;
    }));

    try {
      await apiRequest(`/trainings/${trainingId}/join`, {
        method: 'POST',
        body: JSON.stringify({ smeId: selectedSmeId || activeSme.id })
      });
    } catch (err) {
      console.warn('Backend joinTraining error:', err);
    }
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
    syncLiveRoomToBackend(trainingId, { status: 'live' });
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
    syncLiveRoomToBackend(trainingId, { status: 'completed' });
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
        const updatedAttendees = [...existingAttendees, newAttendee];
        syncLiveRoomToBackend(trainingId, { attendees: updatedAttendees });
        return {
          ...t,
          attendees: updatedAttendees,
          participantsCount: (t.participantsCount || 0) + 1,
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
        syncLiveRoomToBackend(trainingId, { attendees: updatedAttendees });
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
        syncLiveRoomToBackend(trainingId, { attendees: updatedAttendees });
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
        syncLiveRoomToBackend(trainingId, { attendees: updatedAttendees });
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
        const updatedMessages = [...(t.chatMessages || []), newMsg];
        syncLiveRoomToBackend(trainingId, { chatMessages: updatedMessages });
        return {
          ...t,
          chatMessages: updatedMessages
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
    setScenarios({ salesDrop: false, expenseIncrease: false, loanDelay: false });
    setLoanSimulation({ amount: 5000000, period: 12, rate: 15 });
    refreshBusinessData();
    refreshProducts();
    refreshApplications();
    refreshTrainings(selectedSmeId);
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
      refreshApplications,
      trainings,
      refreshTrainings,
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
      updateTrainingLiveState,
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SmeProfile, mockSmes, Sale, InventoryItem, Expense, formatRWF } from '../lib/mockData';

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

export interface Training {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  speaker: string;
  meetingLink: string;
  targetAudience: string[];
  participantsCount: number;
  attended: boolean;
  completed: boolean;
  hasCertificate: boolean;
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
  deleteSale: (smeId: string, saleId: number) => void;
  addInventoryItem: (smeId: string, name: string, category: string, quantity: number, price: number, supplier: string) => void;
  deleteInventoryItem: (smeId: string, itemId: string) => void;
  addExpense: (smeId: string, description: string, category: string, amount: number) => void;
  deleteExpense: (smeId: string, expenseId: number) => void;
  resetAll: () => void;
  
  // Opportunities, applications, and virtual trainings state
  opportunities: Opportunity[];
  applications: Application[];
  trainings: Training[];
  bookmarkedOpportunities: string[];
  publishOpportunity: (opp: Omit<Opportunity, 'id' | 'views' | 'saved' | 'applicationsCount' | 'status' | 'createdAt'>) => void;
  applyForOpportunity: (oppId: string, smeId: string) => void;
  updateApplicationStatus: (appId: string, status: Application['status'], feedback?: string) => void;
  createTraining: (training: Omit<Training, 'id' | 'participantsCount' | 'attended' | 'completed' | 'hasCertificate'>) => void;
  joinTraining: (trainingId: string) => void;
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
    title: 'Financial Readiness & Tax Compliance',
    description: 'Learn how to properly prepare tax clearances, maintain clean financial ledgers, and leverage digital logs to unlock bank financing.',
    date: '2026-08-12',
    time: '10:00 AM - 12:00 PM',
    speaker: 'Jean Paul Habimana (Senior Advisor, RRA)',
    meetingLink: 'https://zoom.us/j/elevata-training-1',
    targetAudience: ['Low Readiness SMEs', 'Retail', 'Agriculture'],
    participantsCount: 45,
    attended: false,
    completed: false,
    hasCertificate: false
  },
  {
    id: 'tr-2',
    title: 'Scaling Agribusiness Operations in East Africa',
    description: 'A deep-dive workshop into modern inventory logistics, cooperative management, and obtaining processing certificates.',
    date: '2026-08-15',
    time: '02:00 PM - 04:30 PM',
    speaker: 'Dr. Agnes Kalibata (Director, AgroGrow)',
    meetingLink: 'https://zoom.us/j/elevata-training-2',
    targetAudience: ['Agriculture', 'High Growth SMEs'],
    participantsCount: 68,
    attended: false,
    completed: false,
    hasCertificate: false
  },
  {
    id: 'tr-3',
    title: 'SME Digitization & E-commerce Strategy',
    description: 'Interactive session outlining how digital point-of-sale systems can automate cashflow tracking and generate pre-approved credit files.',
    date: '2026-08-19',
    time: '09:00 AM - 11:30 AM',
    speaker: 'Divine Mutoni (CEO, Gisenyi Tech)',
    meetingLink: 'https://zoom.us/j/elevata-training-3',
    targetAudience: ['Women', 'Retail', 'Technology'],
    participantsCount: 32,
    attended: false,
    completed: false,
    hasCertificate: false
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

  useEffect(() => {
    localStorage.setItem('elevata_bookmarked', JSON.stringify(bookmarkedOpportunities));
  }, [bookmarkedOpportunities]);

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

  const deleteSale = (smeId: string, saleId: number) => {
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

  const publishOpportunity = (opp: Omit<Opportunity, 'id' | 'views' | 'saved' | 'applicationsCount' | 'status' | 'createdAt'>) => {
    const newOpp: Opportunity = {
      ...opp,
      id: `opp-${Date.now()}`,
      views: 0,
      saved: 0,
      applicationsCount: 0,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setOpportunities(prev => [newOpp, ...prev]);
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
      hasCertificate: false
    };
    setTrainings(prev => [newTr, ...prev]);
  };

  const joinTraining = (trainingId: string) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        return {
          ...t,
          participantsCount: t.participantsCount + 1,
          attended: true,
          completed: true,
          hasCertificate: true
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
      resetAll,
      opportunities,
      applications,
      trainings,
      bookmarkedOpportunities,
      publishOpportunity,
      applyForOpportunity,
      updateApplicationStatus,
      createTraining,
      joinTraining,
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

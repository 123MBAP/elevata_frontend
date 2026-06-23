export interface MonthlyFinancial {
  month: string;
  revenue: number;
  expenses: number;
  inflow: number;
  outflow: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  stockLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstock';
  daysRemaining: number;
  reorderPoint: number;
  unitPrice: number;
  category?: string;
  supplier?: string;
}

export interface LoanDetails {
  status: 'Active' | 'None' | 'Pending';
  outstandingAmount: number;
  monthlyInstallment: number;
  interestRate: number;
  repaymentPeriodMonths: number;
  purpose?: string;
}

export interface Sale {
  id: number;
  product: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
  customer: string;
  status: 'Completed' | 'Processing' | 'Cancelled';
}

export interface SmeProfile {
  id: string;
  name: string;
  sector: 'Retail' | 'Agriculture' | 'Logistics' | 'Technology';
  ownerName: string;
  email: string;
  healthScore: number;
  healthTrend: 'up' | 'down' | 'stable';
  healthTrendPercent: number;
  currentBalance: number;
  borrowingCapacity: number;
  riskRating: 'Low' | 'Medium' | 'High';
  inventoryItems: InventoryItem[];
  loanDetails: LoanDetails;
  riskAlerts: { id: string; type: 'warning' | 'info' | 'danger'; text: string }[];
  monthlyData: MonthlyFinancial[];
  sales: Sale[];
}

export const mockSmes: SmeProfile[] = [
  {
    id: 'sme-1',
    name: 'Kigali Fresh Mart',
    sector: 'Retail',
    ownerName: 'Marie Kabera',
    email: 'marie.kabera@freshmart.rw',
    healthScore: 82,
    healthTrend: 'up',
    healthTrendPercent: 4.2,
    currentBalance: 5800000,
    borrowingCapacity: 8500000,
    riskRating: 'Low',
    loanDetails: {
      status: 'None',
      outstandingAmount: 0,
      monthlyInstallment: 0,
      interestRate: 0,
      repaymentPeriodMonths: 0,
    },
    inventoryItems: [
      { id: 'inv-1', name: 'Premium Basmati Rice (25kg)', stockLevel: 12, status: 'Low Stock', daysRemaining: 6, reorderPoint: 30, unitPrice: 28000 },
      { id: 'inv-2', name: 'Refined Cooking Oil (5L)', stockLevel: 80, status: 'Overstock', daysRemaining: 120, reorderPoint: 20, unitPrice: 12000 },
      { id: 'inv-3', name: 'White Sugar (50kg)', stockLevel: 25, status: 'In Stock', daysRemaining: 18, reorderPoint: 15, unitPrice: 48000 },
      { id: 'inv-4', name: 'Local Beans (100kg)', stockLevel: 5, status: 'Low Stock', daysRemaining: 3, reorderPoint: 15, unitPrice: 65000 },
    ],
    riskAlerts: [
      { id: 'alert-1', type: 'warning', text: 'Low stock detected on Local Beans and Rice. Supplier delivery averages 5 days.' },
      { id: 'alert-2', type: 'info', text: 'Overstock alert: Cooking oil inventory exceeds 90 days demand. Capital tied up: 960,000 RWF.' },
      { id: 'alert-3', type: 'info', text: 'Revenue grew by 8.5% this month due to neighborhood marketing campaign.' }
    ],
    monthlyData: [
      { month: 'Jan', revenue: 4200000, expenses: 3500000, inflow: 4500000, outflow: 3700000 },
      { month: 'Feb', revenue: 4500000, expenses: 3700000, inflow: 4300000, outflow: 3900000 },
      { month: 'Mar', revenue: 4800000, expenses: 3900000, inflow: 5100000, outflow: 4100000 },
      { month: 'Apr', revenue: 5100000, expenses: 4000000, inflow: 4900000, outflow: 4200000 },
      { month: 'May', revenue: 5500000, expenses: 4200000, inflow: 5600000, outflow: 4400000 },
      { month: 'Jun', revenue: 5800000, expenses: 4300000, inflow: 6000000, outflow: 4500000 },
    ],
    sales: [
      { id: 1, product: 'Premium Basmati Rice (25kg)', quantity: 3, price: 28000, total: 84000, date: 'Jun 22, 2026', customer: 'Akagera Canteen', status: 'Completed' },
      { id: 2, product: 'White Sugar (50kg)', quantity: 2, price: 48000, total: 96000, date: 'Jun 21, 2026', customer: 'Kimironko Bakers', status: 'Completed' },
      { id: 3, product: 'Refined Cooking Oil (5L)', quantity: 5, price: 12000, total: 60000, date: 'Jun 18, 2026', customer: 'David Bizimana', status: 'Completed' }
    ]
  },
  {
    id: 'sme-2',
    name: 'Rwanda Agro-Processors Ltd',
    sector: 'Agriculture',
    ownerName: 'Jean Bosco Nsengimana',
    email: 'jb.nsengi@rwandaagro.rw',
    healthScore: 64,
    healthTrend: 'down',
    healthTrendPercent: 2.8,
    currentBalance: 12400000,
    borrowingCapacity: 15000000,
    riskRating: 'Medium',
    loanDetails: {
      status: 'Active',
      outstandingAmount: 4500000,
      monthlyInstallment: 420000,
      interestRate: 14,
      repaymentPeriodMonths: 12,
      purpose: 'Maize milling machine upgrade'
    },
    inventoryItems: [
      { id: 'inv-5', name: 'Raw Maize (tons)', stockLevel: 8, status: 'Low Stock', daysRemaining: 8, reorderPoint: 15, unitPrice: 320000 },
      { id: 'inv-6', name: 'Processed Maize Flour (25kg bags)', stockLevel: 450, status: 'In Stock', daysRemaining: 25, reorderPoint: 100, unitPrice: 14500 },
      { id: 'inv-7', name: 'Packaging Bags (custom)', stockLevel: 5000, status: 'Overstock', daysRemaining: 180, reorderPoint: 1000, unitPrice: 250 },
    ],
    riskAlerts: [
      { id: 'alert-4', type: 'danger', text: 'Seasonal cash outflow stress anticipated next month due to high harvest purchase requirements.' },
      { id: 'alert-5', type: 'warning', text: 'Outstanding invoices for 3 core cooperative buyers exceeded 45-day payment cycles.' }
    ],
    monthlyData: [
      { month: 'Jan', revenue: 12000000, expenses: 10500000, inflow: 11000000, outflow: 11500000 },
      { month: 'Feb', revenue: 11500000, expenses: 10200000, inflow: 13000000, outflow: 10800000 },
      { month: 'Mar', revenue: 13000000, expenses: 11800000, inflow: 11800000, outflow: 12200000 },
      { month: 'Apr', revenue: 14500000, expenses: 12500000, inflow: 14000000, outflow: 13100000 },
      { month: 'May', revenue: 13800000, expenses: 12800000, inflow: 12100000, outflow: 13900000 },
      { month: 'Jun', revenue: 15000000, expenses: 13900000, inflow: 14800000, outflow: 14400000 },
    ],
    sales: [
      { id: 4, product: 'Processed Maize Flour (25kg bags)', quantity: 80, price: 14500, total: 1160000, date: 'Jun 22, 2026', customer: 'WFP Supply Rwanda', status: 'Completed' },
      { id: 5, product: 'Processed Maize Flour (25kg bags)', quantity: 40, price: 14500, total: 580000, date: 'Jun 20, 2026', customer: 'Kigali Food Distributors', status: 'Completed' }
    ]
  },
  {
    id: 'sme-3',
    name: 'Akagera Express Logistics',
    sector: 'Logistics',
    ownerName: 'David Mugisha',
    email: 'd.mugisha@akageralogistics.rw',
    healthScore: 45,
    healthTrend: 'down',
    healthTrendPercent: 8.5,
    currentBalance: 2100000,
    borrowingCapacity: 3000000,
    riskRating: 'High',
    loanDetails: {
      status: 'Active',
      outstandingAmount: 8200000,
      monthlyInstallment: 780000,
      interestRate: 16,
      repaymentPeriodMonths: 24,
      purpose: 'Delivery van purchase'
    },
    inventoryItems: [
      { id: 'inv-8', name: 'Engine Oil (10W-40)', stockLevel: 2, status: 'Low Stock', daysRemaining: 4, reorderPoint: 5, unitPrice: 35000 },
      { id: 'inv-9', name: 'Replacement Truck Tires', stockLevel: 4, status: 'In Stock', daysRemaining: 30, reorderPoint: 2, unitPrice: 180000 },
      { id: 'inv-10', name: 'Spare Fan Belts', stockLevel: 15, status: 'Overstock', daysRemaining: 150, reorderPoint: 3, unitPrice: 15000 },
    ],
    riskAlerts: [
      { id: 'alert-6', type: 'danger', text: 'Debt service ratio is critical (outflow exceeds net profit). Default risk prediction increased to 6.2%.' },
      { id: 'alert-7', type: 'danger', text: 'Declining monthly operational profit due to recent 22% fuel price surge.' },
      { id: 'alert-8', type: 'warning', text: 'Current cash balance of 2,100,000 RWF represents less than 8 days of operational buffer.' }
    ],
    monthlyData: [
      { month: 'Jan', revenue: 8500000, expenses: 7800000, inflow: 8100000, outflow: 8300000 },
      { month: 'Feb', revenue: 8200000, expenses: 7900000, inflow: 8300000, outflow: 8200000 },
      { month: 'Mar', revenue: 7900000, expenses: 7700000, inflow: 7600000, outflow: 8000000 },
      { month: 'Apr', revenue: 7600000, expenses: 7800000, inflow: 7800000, outflow: 7900000 },
      { month: 'May', revenue: 7200000, expenses: 7600000, inflow: 6900000, outflow: 7700000 },
      { month: 'Jun', revenue: 6900000, expenses: 7500000, inflow: 7100000, outflow: 7800000 },
    ],
    sales: [
      { id: 6, product: 'Replacement Truck Tires', quantity: 2, price: 180000, total: 360000, date: 'Jun 22, 2026', customer: 'AgroExport Ltd', status: 'Completed' },
      { id: 7, product: 'Spare Fan Belts', quantity: 1, price: 15000, total: 15000, date: 'Jun 19, 2026', customer: 'Kigali Transit Cooperative', status: 'Completed' }
    ]
  },
  {
    id: 'sme-4',
    name: 'Gisenyi Tech Solutions',
    sector: 'Technology',
    ownerName: 'Divine Mutoni',
    email: 'd.mutoni@gisenyitech.com',
    healthScore: 91,
    healthTrend: 'up',
    healthTrendPercent: 6.1,
    currentBalance: 18600000,
    borrowingCapacity: 18000000,
    riskRating: 'Low',
    loanDetails: {
      status: 'None',
      outstandingAmount: 0,
      monthlyInstallment: 0,
      interestRate: 0,
      repaymentPeriodMonths: 0,
    },
    inventoryItems: [
      { id: 'inv-11', name: 'Dual Band WiFi Routers', stockLevel: 45, status: 'In Stock', daysRemaining: 40, reorderPoint: 10, unitPrice: 75000 },
      { id: 'inv-12', name: 'Cat6 Ethernet Cables (300m)', stockLevel: 3, status: 'Low Stock', daysRemaining: 10, reorderPoint: 5, unitPrice: 110000 },
      { id: 'inv-13', name: 'Smart Home Hub Panels', stockLevel: 25, status: 'Overstock', daysRemaining: 100, reorderPoint: 5, unitPrice: 150000 },
    ],
    riskAlerts: [
      { id: 'alert-9', type: 'info', text: 'Optimal credit worthiness. Pre-qualified for low-interest expansion credit up to 18,000,000 RWF.' },
      { id: 'alert-10', type: 'info', text: '92% customer retainer renewal rate provides highly predictable cash flow forecast.' }
    ],
    monthlyData: [
      { month: 'Jan', revenue: 8900000, expenses: 5400000, inflow: 9100000, outflow: 5600000 },
      { month: 'Feb', revenue: 9200000, expenses: 5600000, inflow: 8800000, outflow: 5800000 },
      { month: 'Mar', revenue: 9800000, expenses: 5800000, inflow: 10200000, outflow: 6000000 },
      { month: 'Apr', revenue: 10400000, expenses: 6100000, inflow: 10100000, outflow: 6200000 },
      { month: 'May', revenue: 11100000, expenses: 6300000, inflow: 11500000, outflow: 6500000 },
      { month: 'Jun', revenue: 12200000, expenses: 6800000, inflow: 12500000, outflow: 7000000 },
    ],
    sales: [
      { id: 8, product: 'Dual Band WiFi Routers', quantity: 5, price: 75000, total: 375000, date: 'Jun 22, 2026', customer: 'Kigali Tech Hub', status: 'Completed' },
      { id: 9, product: 'Smart Home Hub Panels', quantity: 2, price: 150000, total: 300000, date: 'Jun 15, 2026', customer: 'BPR Bank HQ', status: 'Completed' }
    ]
  }
];

export const formatRWF = (value: number): string => {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value).replace('RWF', 'FRW'); // Standard local symbol representation
};

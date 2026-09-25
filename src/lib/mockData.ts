export interface MonthlyFinancial {
  month: string;
  revenue: number;
  expenses: number;
  inflow: number;
  outflow: number;
}

export type MeasurementUnit = 'kgs' | 'meters' | 'm²' | 'l' | 'dozen' | 'pcs' | 'box' | 'bag' | 'tons' | 'packs' | 'pairs';

export interface ProductItem {
  id: string;
  name: string;
  description?: string;
  unit: string;
  unitPrice: number;
  costPrice?: number;
  stockQuantity: number;
  reorderLevel?: number;
  category?: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstock';
  createdAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  stockLevel: number;
  unit?: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstock';
  daysRemaining: number;
  reorderPoint: number;
  unitPrice: number;
  costPrice?: number;
  category?: string;
  supplier?: string;
  description?: string;
}

export interface LoanDetails {
  status: 'Active' | 'None' | 'Pending';
  outstandingAmount: number;
  monthlyInstallment: number;
  interestRate: number;
  repaymentPeriodMonths: number;
  purpose?: string;
}

export interface SaleItemSnapshot {
  id?: string;
  productId?: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string | number;
  product: string;
  unit?: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
  customer: string;
  status: 'Completed' | 'Processing' | 'Cancelled' | 'Pending' | 'Partial';
  items?: SaleItemSnapshot[];
}

export interface Expense {
  id: string | number;
  description: string;
  category: string;
  amount: number;
  date: string;
}

export interface PurchaseItemSnapshot {
  id?: string;
  productId?: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseTransaction {
  id: string | number;
  supplier: string;
  invoiceRef?: string;
  paymentMethod?: string;
  totalAmount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Partial';
  items?: PurchaseItemSnapshot[];
  notes?: string;
}

export interface CashInTransaction {
  id: string | number;
  amount: number;
  source: string;
  reason: string;
  category?: string;
  paymentMethod: string;
  date: string;
  notes?: string;
}

export interface CashOutTransaction {
  id: string | number;
  amount: number;
  category: string;
  description: string;
  paymentMethod: string;
  date: string;
  notes?: string;
}

export interface OtherActivity {
  id: string | number;
  title: string;
  description?: string;
  date: string;
  status?: 'Planned' | 'In Progress' | 'Completed' | 'On Hold';
  moneyInvolved: boolean;
  amount?: number;
  paymentStatus?: 'Completed' | 'Pending' | 'Partial' | 'N/A';
  category?: string;
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
  expenses: Expense[];
  purchases?: PurchaseTransaction[];
  cashIns?: CashInTransaction[];
  cashOuts?: CashOutTransaction[];
  otherActivities?: OtherActivity[];
  age: number;
}

export const formatRWF = (value: number): string => {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value).replace('RWF', 'FRW'); // Standard local symbol representation
};

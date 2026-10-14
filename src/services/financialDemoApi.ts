import { apiRequest } from '../lib/api';

export interface DemoInstitution {
  id: string;
  name: string;
  shortName: string;
  category: string;
  licenseNumber: string;
  rating: number;
  supportedChannels: string[];
  contactEmail: string;
  contactPhone: string;
  logoUrl?: string;
}

export interface DemoSme {
  id: string;
  name: string;
  sector: string;
  tin: string;
  ownerName: string;
  phone: string;
  email: string;
  district: string;
  province: string;
  healthScore: number;
  readinessScore: number;
  monthlyTurnover: number;
  currentAccountBalance: number;
}

export interface StatementEntry {
  id: string;
  date: string;
  type: 'Disbursement' | 'Repayment' | 'Adjustment' | 'Fee';
  description: string;
  reference: string;
  channel?: string;
  debit: number;
  credit: number;
  runningBalance: number;
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface DemoLoan {
  id: string;
  applicationId?: string;
  smeId: string;
  smeName: string;
  smeSector: string;
  institutionId: string;
  institutionName: string;
  productName: string;
  referenceNumber: string;
  totalBorrowed: number;
  originalPrincipal: number;
  outstandingPrincipal: number;
  totalRepaymentsMade: number;
  interestRate: number;
  termMonths: number;
  repaymentFrequency: string;
  monthlyInstallment: number;
  totalAmountDueNow: number;
  nextRepaymentDueDate: string;
  status: 'Active' | 'Approved - Ready for Disbursement' | 'Fully Repaid' | 'In Arrears';
  disbursedAt: string | null;
  maturityDate: string;
  disbursementChannel: string | null;
  disbursementReference: string | null;
  disbursementStatus: string;
  statement: StatementEntry[];
}

export interface SmeOverviewData {
  smeId: string;
  totalBorrowed: number;
  outstandingPrincipal: number;
  totalAmountDueNow: number;
  totalRepaymentsMade: number;
  activeLoansCount: number;
  nextRepaymentAmount: number;
  nextRepaymentDueDate: string | null;
  nextLoanReference: string | null;
  connectedServicesCount: number;
  demoMode: boolean;
}

export interface FiOverviewData {
  fiId: string;
  totalDisbursed: number;
  totalOutstanding: number;
  totalRepaymentsCollected: number;
  pendingDisbursements: number;
  pendingApplications: number;
  activeLoansCount: number;
  publishedServicesCount: number;
  demoMode: boolean;
}

export interface DemoApplication {
  id: string;
  smeId: string;
  smeName: string;
  smeSector: string;
  productId: string;
  productName: string;
  institutionId: string;
  institutionName: string;
  requestedAmount: number;
  termMonths: number;
  interestRate: number;
  purpose: string;
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  smeHealthScore: number;
  smeReadinessScore: number;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  feedback: string;
  appliedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  canDisburse: boolean;
  associatedLoanId: string | null;
}

export interface DigitalFinancialService {
  id: string;
  institutionId: string;
  providerName: string;
  serviceName: string;
  category: 'Mobile Money & Digital Payments' | 'Business Savings Accounts' | 'Merchant Payment Solutions' | 'Business Insurance';
  description: string;
  eligibilityCriteria: string;
  requirements: string[];
  pricing: string;
  availabilityStatus: 'Active' | 'Inactive';
  endpointUrl: string;
  features: string[];
  connectionStatus: 'Not Connected' | 'Connected' | 'Pending Provider Response' | 'Failed';
}

export interface ApiLogEntry {
  id: string;
  requestId: string;
  timestamp: string;
  provider: string;
  service: string;
  operation: string;
  method: string;
  endpoint: string;
  durationMs: number;
  statusCode: number;
  status: 'Success' | 'Pending' | 'Failed';
  relatedSme: string;
  relatedReference: string;
  requestPayload: any;
  responsePayload: any;
}

export const financialDemoApi = {
  // Master Meta
  async getDemoMeta() {
    const res = await apiRequest('/financial-demo/meta');
    return res.data;
  },

  // SME Overview & Loans
  async getSmeOverview(smeId = 'sme-1'): Promise<SmeOverviewData> {
    const res = await apiRequest(`/financial-demo/sme/overview?smeId=${encodeURIComponent(smeId)}`);
    return res.data;
  },

  async getSmeLoans(smeId = 'sme-1'): Promise<DemoLoan[]> {
    const res = await apiRequest(`/financial-demo/sme/loans?smeId=${encodeURIComponent(smeId)}`);
    return res.data;
  },

  async getLoanDetails(loanId: string): Promise<DemoLoan> {
    const res = await apiRequest(`/financial-demo/sme/loans/${encodeURIComponent(loanId)}`);
    return res.data;
  },

  async getLoanStatement(loanId: string) {
    const res = await apiRequest(`/financial-demo/sme/loans/${encodeURIComponent(loanId)}/statement`);
    return res.data;
  },

  async repayLoan(payload: {
    loanId: string;
    amount: number;
    channel: 'Mobile Money' | 'Bank Transfer';
    paymentDetails: any;
    idempotencyKey?: string;
    simulateOutcome?: 'success' | 'pending' | 'failure';
  }) {
    const res = await apiRequest('/financial-demo/sme/loans/repay', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  },

  // FI Endpoints
  async getFiOverview(fiId?: string): Promise<FiOverviewData> {
    const query = fiId ? `?fiId=${encodeURIComponent(fiId)}` : '';
    const res = await apiRequest(`/financial-demo/fi/overview${query}`);
    return res.data;
  },

  async getFiApplications(fiId?: string): Promise<DemoApplication[]> {
    const query = fiId ? `?fiId=${encodeURIComponent(fiId)}` : '';
    const res = await apiRequest(`/financial-demo/fi/applications${query}`);
    return res.data;
  },

  async underwriteApplication(applicationId: string, payload: {
    decision: 'Approved' | 'Rejected' | 'Under Review';
    feedback?: string;
    configuredAmount?: number;
    configuredRate?: number;
    configuredTerm?: number;
  }) {
    const res = await apiRequest(`/financial-demo/fi/applications/${encodeURIComponent(applicationId)}/underwrite`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return res.data;
  },

  async disburseLoan(loanId: string, payload: {
    channel?: 'Bank Transfer' | 'Mobile Money';
    destinationAccount?: string;
    simulateOutcome?: 'success' | 'pending' | 'failure';
  }) {
    const res = await apiRequest(`/financial-demo/fi/loans/${encodeURIComponent(loanId)}/disburse`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  },

  // Services Marketplace
  async getServices(category?: string): Promise<DigitalFinancialService[]> {
    const query = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
    const res = await apiRequest(`/financial-demo/services${query}`);
    return res.data;
  },

  async publishService(payload: Partial<DigitalFinancialService>) {
    const res = await apiRequest('/financial-demo/services', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  },

  async updateService(serviceId: string, payload: Partial<DigitalFinancialService>) {
    const res = await apiRequest(`/financial-demo/services/${encodeURIComponent(serviceId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return res.data;
  },

  async connectService(payload: {
    serviceId: string;
    smeId?: string;
    consentGranted: boolean;
    payload?: any;
    simulateOutcome?: 'success' | 'pending' | 'failure';
  }) {
    const res = await apiRequest('/financial-demo/services/connect', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  },

  // Telemetry Monitor
  async getApiLogs(params?: { limit?: number; provider?: string; status?: string }): Promise<ApiLogEntry[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.provider) query.set('provider', params.provider);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiRequest(`/financial-demo/api-logs${qs}`);
    return res.data;
  },

  async simulateCategoryHandshake(payload: {
    category: string;
    smeId?: string;
    simulateOutcome?: 'success' | 'failure';
  }) {
    const res = await apiRequest('/financial-demo/simulate-handshake', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  },

  // Reset Demo
  async resetDemo() {
    const res = await apiRequest('/financial-demo/reset', { method: 'POST' });
    return res.data;
  }
};

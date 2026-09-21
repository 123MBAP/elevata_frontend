import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatRWF, ProductItem, Sale, PurchaseTransaction, CashInTransaction, CashOutTransaction, OtherActivity } from '../lib/mockData';
import { Button } from '../assets/components/ui/button';
import { Card, CardContent } from '../assets/components/ui/card';
import { Input } from '../assets/components/ui/input';
import CreateProductModal from '../assets/components/CreateProductModal';
import EditProductModal from '../assets/components/EditProductModal';
import {
  ShoppingBag,
  Package,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  Phone,
  Tag,
  HelpCircle,
  Truck,
  Building2,
  Wallet,
  Activity,
  Layers,
  ArrowRight,
  Printer,
  Check,
  X,
  CreditCard,
  Briefcase,
  Wrench,
  AlertTriangle,
  Star
} from 'lucide-react';

export const UNIT_SELECT_OPTIONS = [
  { value: 'pcs', label: 'pcs (Pieces)' },
  { value: 'kgs', label: 'kgs (Kilograms)' },
  { value: 'l', label: 'L (Liters)' },
  { value: 'meters', label: 'm (Meters)' },
  { value: 'm²', label: 'm² (Square Meters)' },
  { value: 'dozen', label: 'dozen (12 pcs)' },
  { value: 'box', label: 'box (Boxes)' },
  { value: 'bag', label: 'bag (Bags / Sacks)' },
  { value: 'tons', label: 'tons (Metric Tons)' },
  { value: 'packs', label: 'packs (Packs)' },
  { value: 'pairs', label: 'pairs (Pairs)' },
  { value: 'other', label: 'other (Custom)' }
];

export type ActivityTab = 'sales' | 'purchases' | 'cash_in' | 'cash_out' | 'other';

interface BusinessActivitiesProps {
  defaultTab?: ActivityTab | 'expenses';
}

export default function BusinessActivities({ defaultTab = 'sales' }: BusinessActivitiesProps) {
  const {
    activeSme,
    products,
    createProduct,
    updateProduct,
    deleteProduct,
    recordSaleTransaction,
    deleteSale,
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
    refreshSales,
    refreshProducts
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');

  // Normalize initial tab (treat legacy 'expenses' as 'cash_out')
  const initialTab: ActivityTab = (urlTab === 'expenses' ? 'cash_out' : (urlTab as ActivityTab)) || (defaultTab === 'expenses' ? 'cash_out' : defaultTab) || 'sales';
  const [activeTab, setActiveTab] = useState<ActivityTab>(initialTab);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    refreshSales();
    refreshProducts();
  }, []);

  useEffect(() => {
    if (urlTab) {
      const resolvedTab = urlTab === 'expenses' ? 'cash_out' : (urlTab as ActivityTab);
      if (['sales', 'purchases', 'cash_in', 'cash_out', 'other'].includes(resolvedTab)) {
        setActiveTab(resolvedTab);
      }
    } else if (defaultTab) {
      setActiveTab(defaultTab === 'expenses' ? 'cash_out' : defaultTab);
    }
  }, [urlTab, defaultTab]);

  const handleSelectTab = (tabId: ActivityTab) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // ==========================================
  // TAB 1: SALES STATE
  // ==========================================
  const [saleCustomer, setSaleCustomer] = useState('');
  const [saleContact, setSaleContact] = useState('');
  const [salePaymentMethod, setSalePaymentMethod] = useState('Cash');
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saleItems, setSaleItems] = useState([
    { id: '1', productId: '', product: '', unit: 'pcs', price: 0, quantity: 1, availableStock: 0 }
  ]);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  const handleAddSaleItem = () => {
    setSaleItems(prev => [
      ...prev,
      { id: Date.now().toString(), productId: '', product: '', unit: 'pcs', price: 0, quantity: 1, availableStock: 0 }
    ]);
  };

  const handleDeleteSaleRow = (id: string) => {
    if (saleItems.length <= 1) return;
    setSaleItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSaleItemChange = (id: string, field: string, value: any) => {
    setSaleItems(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'productId') {
          const selectedProd = products.find(p => p.id === value);
          if (selectedProd) {
            return {
              ...item,
              productId: value,
              product: selectedProd.name,
              unit: selectedProd.unit || 'pcs',
              price: selectedProd.unitPrice || 0,
              availableStock: selectedProd.stockQuantity || 0
            };
          }
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const saleTotal = saleItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleCustomer.trim()) {
      alert('Please specify the buyer / client name.');
      return;
    }

    const validItems = saleItems.filter(item => (item.product || item.productId) && Number(item.quantity) > 0);
    if (validItems.length === 0) {
      alert('Please add at least one product line item.');
      return;
    }

    try {
      setIsSubmittingSale(true);
      await recordSaleTransaction({
        customer: saleCustomer.trim(),
        customerContact: saleContact.trim() || undefined,
        paymentStatus: 'Completed',
        paymentMethod: salePaymentMethod,
        items: validItems.map(item => ({
          productId: item.productId || undefined,
          productName: item.product,
          unit: item.unit,
          quantity: Number(item.quantity),
          unitPrice: Number(item.price)
        }))
      });

      showToast(`Sale of ${formatRWF(saleTotal)} to "${saleCustomer}" recorded successfully!`);

      // Reset
      setSaleCustomer('');
      setSaleContact('');
      setSalePaymentMethod('Cash');
      setSaleItems([
        { id: '1', productId: '', product: '', unit: 'pcs', price: 0, quantity: 1, availableStock: 0 }
      ]);
    } catch (err: any) {
      alert(err.message || 'Failed to record sale.');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  // ==========================================
  // TAB 2: PURCHASES / INTAKE STATE
  // ==========================================
  const [purchaseSupplier, setPurchaseSupplier] = useState('');
  const [purchaseInvoiceRef, setPurchaseInvoiceRef] = useState('');
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState('Cash');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [purchaseItems, setPurchaseItems] = useState([
    { id: '1', productId: '', name: '', unit: 'pcs', unitPrice: 0, quantity: 1 }
  ]);
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);

  const handleAddPurchaseRow = () => {
    setPurchaseItems(prev => [
      ...prev,
      { id: Date.now().toString(), productId: '', name: '', unit: 'pcs', unitPrice: 0, quantity: 1 }
    ]);
  };

  const handleDeletePurchaseRow = (id: string) => {
    if (purchaseItems.length <= 1) return;
    setPurchaseItems(prev => prev.filter(item => item.id !== id));
  };

  const handlePurchaseItemChange = (id: string, field: string, value: any) => {
    setPurchaseItems(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'productId') {
          const selectedProd = products.find(p => p.id === value);
          if (selectedProd) {
            return {
              ...item,
              productId: value,
              name: selectedProd.name,
              unit: selectedProd.unit || 'pcs',
              unitPrice: selectedProd.costPrice || selectedProd.unitPrice || 0
            };
          }
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const purchaseTotal = purchaseItems.reduce((sum, item) => sum + (Number(item.unitPrice || 0) * Number(item.quantity || 0)), 0);

  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseSupplier.trim()) {
      alert('Please specify the supplier / vendor name.');
      return;
    }

    const validItems = purchaseItems.filter(item => (item.name || item.productId) && Number(item.quantity) > 0);
    if (validItems.length === 0) {
      alert('Please enter at least one product purchase item.');
      return;
    }

    try {
      setIsSubmittingPurchase(true);
      await addPurchase(
        activeSme.id,
        purchaseSupplier.trim(),
        validItems,
        purchaseInvoiceRef.trim() || undefined,
        purchasePaymentMethod
      );

      showToast(`Purchase of ${formatRWF(purchaseTotal)} from "${purchaseSupplier}" recorded & stock updated!`);

      // Reset
      setPurchaseSupplier('');
      setPurchaseInvoiceRef('');
      setPurchasePaymentMethod('Cash');
      setPurchaseItems([
        { id: '1', productId: '', name: '', unit: 'pcs', unitPrice: 0, quantity: 1 }
      ]);
    } catch (err: any) {
      alert(err.message || 'Failed to record purchase.');
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  // ==========================================
  // TAB 3: CASH IN STATE
  // ==========================================
  const [cashInAmount, setCashInAmount] = useState('');
  const [cashInSource, setCashInSource] = useState('');
  const [cashInReason, setCashInReason] = useState('Loan received');
  const [cashInPaymentMethod, setCashInPaymentMethod] = useState('Bank Transfer');
  const [cashInDate, setCashInDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [cashInNotes, setCashInNotes] = useState('');

  const handleRecordCashIn = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(cashInAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid cash inflow amount.');
      return;
    }
    if (!cashInSource.trim()) {
      alert('Please specify the source of funds (e.g. Bank, Investor, Grantor, Owner).');
      return;
    }

    addCashIn(activeSme.id, {
      amount: amt,
      source: cashInSource.trim(),
      reason: cashInReason,
      paymentMethod: cashInPaymentMethod,
      date: cashInDate,
      notes: cashInNotes.trim() || undefined
    });

    showToast(`Cash Inflow of ${formatRWF(amt)} from ${cashInSource} logged successfully!`);

    // Reset
    setCashInAmount('');
    setCashInSource('');
    setCashInReason('Loan received');
    setCashInNotes('');
  };

  // ==========================================
  // TAB 4: MERGED CASH OUT & EXPENSES STATE
  // ==========================================
  const [cashOutMode, setCashOutMode] = useState<'single' | 'batch'>('single');

  // Single Entry Form
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [cashOutCategory, setCashOutCategory] = useState('Utilities');
  const [cashOutDescription, setCashOutDescription] = useState('');
  const [cashOutPaymentMethod, setCashOutPaymentMethod] = useState('Cash');
  const [cashOutDate, setCashOutDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [cashOutNotes, setCashOutNotes] = useState('');

  // Batch Lines Form (Multi-Expense / Multi-Cashout)
  const [cashOutBatchLines, setCashOutBatchLines] = useState([
    { id: '1', description: '', category: 'Utilities', amount: 0, paymentMethod: 'Cash' },
    { id: '2', description: '', category: 'Rent', amount: 0, paymentMethod: 'Cash' }
  ]);

  const handleAddBatchLine = () => {
    setCashOutBatchLines(prev => [
      ...prev,
      { id: Date.now().toString(), description: '', category: 'Utilities', amount: 0, paymentMethod: 'Cash' }
    ]);
  };

  const handleDeleteBatchLine = (id: string) => {
    if (cashOutBatchLines.length <= 1) return;
    setCashOutBatchLines(prev => prev.filter(item => item.id !== id));
  };

  const handleBatchLineChange = (id: string, field: string, value: any) => {
    setCashOutBatchLines(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const batchTotal = cashOutBatchLines.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const handleRecordSingleCashOut = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(cashOutAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid cash outflow / expense amount.');
      return;
    }
    if (!cashOutDescription.trim()) {
      alert('Please specify the recipient or expense description.');
      return;
    }

    addCashOut(activeSme.id, {
      amount: amt,
      category: cashOutCategory,
      description: cashOutDescription.trim(),
      paymentMethod: cashOutPaymentMethod,
      date: cashOutDate,
      notes: cashOutNotes.trim() || undefined
    });

    showToast(`Cash Outflow / Expense of ${formatRWF(amt)} for "${cashOutDescription}" recorded!`);

    // Reset
    setCashOutAmount('');
    setCashOutDescription('');
    setCashOutNotes('');
  };

  const handleRecordBatchCashOut = (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = cashOutBatchLines.filter(item => item.description.trim() && Number(item.amount) > 0);
    if (validLines.length === 0) {
      alert('Please enter at least one valid expense description and amount.');
      return;
    }

    validLines.forEach(item => {
      addCashOut(activeSme.id, {
        amount: Number(item.amount),
        category: item.category,
        description: item.description.trim(),
        paymentMethod: item.paymentMethod,
        date: cashOutDate
      });
    });

    showToast(`Recorded ${validLines.length} cashout / expense item(s) totaling ${formatRWF(batchTotal)}!`);

    setCashOutBatchLines([
      { id: '1', description: '', category: 'Utilities', amount: 0, paymentMethod: 'Cash' },
      { id: '2', description: '', category: 'Rent', amount: 0, paymentMethod: 'Cash' }
    ]);
  };

  // ==========================================
  // TAB 5: OTHER ACTIVITIES STATE
  // ==========================================
  const [otherTitle, setOtherTitle] = useState('');
  const [otherDescription, setOtherDescription] = useState('');
  const [otherDate, setOtherDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [otherStatus, setOtherStatus] = useState<'Planned' | 'In Progress' | 'Completed' | 'On Hold'>('Completed');
  const [otherMoneyInvolved, setOtherMoneyInvolved] = useState(false);
  const [otherAmount, setOtherAmount] = useState('');
  const [otherPaymentStatus, setOtherPaymentStatus] = useState<'Completed' | 'Pending' | 'Partial' | 'N/A'>('Completed');
  const [otherCategory, setOtherCategory] = useState('Milestone');

  const handleRecordOtherActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otherTitle.trim()) {
      alert('Activity Title is required.');
      return;
    }

    const amt = otherMoneyInvolved && Number(otherAmount) ? Number(otherAmount) : undefined;

    addOtherActivity(activeSme.id, {
      title: otherTitle.trim(),
      description: otherDescription.trim() || undefined,
      date: otherDate,
      status: otherStatus,
      moneyInvolved: otherMoneyInvolved,
      amount: amt,
      paymentStatus: otherMoneyInvolved ? otherPaymentStatus : 'N/A',
      category: otherCategory
    });

    showToast(`Business Activity "${otherTitle}" recorded successfully!`);

    // Reset
    setOtherTitle('');
    setOtherDescription('');
    setOtherMoneyInvolved(false);
    setOtherAmount('');
    setOtherStatus('Completed');
  };

  // ==========================================
  // UNIFIED ACTIVITIES LEDGER & FILTERING
  // ==========================================
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'sales' | 'purchases' | 'cash_in' | 'cash_out' | 'other'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Normalize all activities into a unified timeline
  const salesList = (activeSme.sales || []).map(s => ({
    id: `sale-${s.id}`,
    originalId: s.id,
    type: 'sales' as const,
    typeLabel: 'Sale',
    title: s.product || 'Sale Transaction',
    party: s.customer,
    category: s.status || 'Completed',
    date: s.date,
    amount: s.total,
    isPositive: true,
    status: s.status,
    raw: s
  }));

  const purchasesList = (activeSme.purchases || []).map(p => ({
    id: `purch-${p.id}`,
    originalId: p.id,
    type: 'purchases' as const,
    typeLabel: 'Purchase / Restock',
    title: p.items && p.items.length > 0 ? `${p.items[0].productName}${p.items.length > 1 ? ` (+${p.items.length - 1} more)` : ''}` : 'Stock Purchase',
    party: p.supplier,
    category: p.invoiceRef ? `Invoice: ${p.invoiceRef}` : 'Supplier Restock',
    date: p.date,
    amount: p.totalAmount,
    isPositive: false,
    status: p.status,
    raw: p
  }));

  // Merged Cash Out List (incorporating direct cashouts + historical expenses)
  const legacyExpensesList = (activeSme.expenses || []).map(e => ({
    id: `exp-${e.id}`,
    originalId: e.id,
    type: 'cash_out' as const,
    typeLabel: 'Cash Out / Expense',
    title: e.description,
    party: e.category,
    category: e.category,
    date: e.date,
    amount: e.amount,
    isPositive: false,
    status: 'Completed',
    raw: e
  }));

  const directCashOutsList = (activeSme.cashOuts || []).map(c => ({
    id: `cashout-${c.id}`,
    originalId: c.id,
    type: 'cash_out' as const,
    typeLabel: 'Cash Outflow',
    title: c.description,
    party: c.category,
    category: c.paymentMethod,
    date: c.date,
    amount: c.amount,
    isPositive: false,
    status: 'Completed',
    raw: c
  }));

  const cashOutsCombined = [...directCashOutsList, ...legacyExpensesList];

  const cashInsList = (activeSme.cashIns || []).map(c => ({
    id: `cashin-${c.id}`,
    originalId: c.id,
    type: 'cash_in' as const,
    typeLabel: 'Cash Inflow',
    title: c.reason,
    party: c.source,
    category: c.category || c.paymentMethod,
    date: c.date,
    amount: c.amount,
    isPositive: true,
    status: 'Completed',
    raw: c
  }));

  const otherList = (activeSme.otherActivities || []).map(a => ({
    id: `other-${a.id}`,
    originalId: a.id,
    type: 'other' as const,
    typeLabel: 'Milestone / Event',
    title: a.title,
    party: a.category || 'Milestone',
    category: a.description || a.status || 'General Activity',
    date: a.date,
    amount: a.amount || 0,
    isPositive: true,
    status: a.status || 'Completed',
    raw: a
  }));

  const allActivities = [
    ...salesList,
    ...purchasesList,
    ...cashInsList,
    ...cashOutsCombined,
    ...otherList
  ];

  const filteredActivities = allActivities.filter(item => {
    const matchesTab = ledgerFilter === 'all' || item.type === ledgerFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.party.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Calculate totals
  const totalInflow = salesList.reduce((sum, s) => sum + s.amount, 0) + cashInsList.reduce((sum, c) => sum + c.amount, 0);
  const totalOutflow = purchasesList.reduce((sum, p) => sum + p.amount, 0) + cashOutsCombined.reduce((sum, c) => sum + c.amount, 0);
  const netOperatingCashflow = totalInflow - totalOutflow;

  const tabsConfig = [
    { id: 'sales' as ActivityTab, label: 'Sales', icon: <ShoppingBag className="w-4 h-4" />, count: salesList.length, color: 'text-emerald-600' },
    { id: 'purchases' as ActivityTab, label: 'Purchases', icon: <Truck className="w-4 h-4" />, count: purchasesList.length, color: 'text-blue-600' },
    { id: 'cash_in' as ActivityTab, label: 'Cash In', icon: <ArrowDownLeft className="w-4 h-4" />, count: cashInsList.length, color: 'text-teal-600' },
    { id: 'cash_out' as ActivityTab, label: 'Cash Out', icon: <ArrowUpRight className="w-4 h-4" />, count: cashOutsCombined.length, color: 'text-amber-600' },
    { id: 'other' as ActivityTab, label: 'Other Activities', icon: <Star className="w-4 h-4" />, count: otherList.length, color: 'text-purple-600' }
  ];

  const handleDeleteActivity = (item: typeof allActivities[0]) => {
    if (!window.confirm(`Delete activity record "${item.title}"?`)) return;
    if (item.id.startsWith('sale-')) {
      deleteSale(activeSme.id, item.originalId);
    } else if (item.id.startsWith('purch-')) {
      deletePurchase(activeSme.id, item.originalId);
    } else if (item.id.startsWith('exp-')) {
      deleteExpense(activeSme.id, item.originalId as number);
    } else if (item.id.startsWith('cashin-')) {
      deleteCashIn(activeSme.id, item.originalId);
    } else if (item.id.startsWith('cashout-')) {
      deleteCashOut(activeSme.id, item.originalId);
    } else if (item.id.startsWith('other-')) {
      deleteOtherActivity(activeSme.id, item.originalId);
    }
    showToast('Activity record removed.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-6 z-50 bg-emerald-700 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 border border-emerald-500"
        >
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span className="font-medium">{toastMessage}</span>
        </motion.div>
      )}

      {/* Header & Overview Card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex h-10 items-center gap-2 rounded-[6px] bg-[#0a66c2] px-4 text-[13px] font-bold text-white transition-colors hover:bg-[#004182] shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white stroke-[2.5]" />
            <span className="text-white font-bold">New Master Product</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RECORD BUSINESS ACTIVITIES CONTAINER */}
      {/* ========================================================================= */}
      <div className="rounded-[10px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-[#e0e0e0] p-6 sm:p-8 overflow-hidden">
          {/* =================================================================== */}
          {/* TAB 1: SALES RECORDING FORM */}
          {/* =================================================================== */}
          {activeTab === 'sales' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="space-y-6">
              <div className="pb-3 border-b border-[#e0e0e0]">
                <h3 className="text-[16px] font-bold text-[#181818] flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#0a66c2]" />
                  <span>Record Client Sale &amp; Issue Receipt</span>
                </h3>
                <p className="text-[13px] text-[#5e5e5e] mt-0.5">
                  Record customer sales orders. Master inventory balances decrement in real-time.
                </p>
              </div>

              <form onSubmit={handleRecordSale} className="space-y-4 max-w-4xl">
                {/* Field 1: Customer / Client Name */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Customer / Client Name <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={saleCustomer}
                    onChange={e => setSaleCustomer(e.target.value)}
                    placeholder="e.g. Akagera Canteen or Walk-in Buyer"
                    required
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>

                {/* Field 2: Phone / Contact */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Contact Number <span className="text-[12px] text-[#8c8c8c] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={saleContact}
                    onChange={e => setSaleContact(e.target.value)}
                    placeholder="+250 788 000 000"
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>

                {/* Field 3: Payment Method */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Payment Settlement Method <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <select
                    value={salePaymentMethod}
                    onChange={e => setSalePaymentMethod(e.target.value)}
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                  >
                    <option value="Cash">Cash (Immediate Settlement)</option>
                    <option value="Mobile Money">Mobile Money (MTN / Airtel MoMo)</option>
                    <option value="Bank Transfer">Bank Wire Transfer</option>
                    <option value="Credit / Receivable">Trade Credit (Accounts Receivable)</option>
                  </select>
                </div>

                {/* Field 4: Sale Date */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Transaction Date <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={e => setSaleDate(e.target.value)}
                    required
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>

                {/* Line Items Container */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[14px] font-normal text-[#181818] block">
                      Product Line Items &amp; Quantities <span className="text-rose-600 font-bold">*</span>
                    </label>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto border border-[#cccccc] rounded-[4px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#f8fafc] text-[#5e5e5e] font-semibold border-b border-[#cccccc] text-[12px]">
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3 min-w-[220px]">Product / Item from Master Catalog</th>
                          <th className="py-2.5 px-3 w-28">Unit</th>
                          <th className="py-2.5 px-3 w-36">Unit Price (FRW)</th>
                          <th className="py-2.5 px-3 w-28">Quantity</th>
                          <th className="py-2.5 px-3 w-36 text-right">Line Total (FRW)</th>
                          <th className="py-2.5 px-3 w-14 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e0e0e0] bg-white">
                        {saleItems.map((row, idx) => (
                          <tr key={row.id} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 text-center font-mono text-[#8c8c8c] font-bold">{idx + 1}</td>
                            <td className="py-2 px-2">
                              <div className="space-y-1">
                                <select
                                  value={row.productId}
                                  onChange={e => handleSaleItemChange(row.id, 'productId', e.target.value)}
                                  className="h-9 w-full rounded-[4px] border border-[#666666] bg-white px-2.5 text-[13px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                                >
                                  <option value="">-- Select Master Product or Enter Custom --</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} ({p.stockQuantity} {p.unit} in stock - {formatRWF(p.unitPrice)})
                                    </option>
                                  ))}
                                </select>
                                {!row.productId && (
                                  <input
                                    type="text"
                                    value={row.product}
                                    onChange={e => handleSaleItemChange(row.id, 'product', e.target.value)}
                                    placeholder="Or type custom product title..."
                                    className="h-8 w-full rounded-[4px] border border-[#666666] bg-white px-2 text-[12px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                                  />
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-2">
                              <select
                                value={row.unit || 'pcs'}
                                onChange={e => handleSaleItemChange(row.id, 'unit', e.target.value)}
                                className="h-9 w-full rounded-[4px] border border-[#666666] bg-white px-1.5 text-[12px] font-mono text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                              >
                                {UNIT_SELECT_OPTIONS.map(u => (
                                 <option key={u.value} value={u.value}>
                                   {u.label}
                                 </option>
                               ))}
                               {row.unit && !UNIT_SELECT_OPTIONS.some(u => u.value === row.unit) && (
                                 <option value={row.unit}>{row.unit}</option>
                               )}
                              </select>
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                value={row.price || ''}
                                onChange={e => handleSaleItemChange(row.id, 'price', Number(e.target.value))}
                                placeholder="0"
                                className="h-9 w-full rounded-[4px] border border-[#666666] bg-white px-2 text-[13px] font-mono text-right text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                value={row.quantity || ''}
                                onChange={e => handleSaleItemChange(row.id, 'quantity', Number(e.target.value))}
                                placeholder="1"
                                className="h-9 w-full rounded-[4px] border border-[#666666] bg-white px-2 text-[13px] font-mono text-center text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#181818]">
                              {formatRWF(Number(row.price || 0) * Number(row.quantity || 0))}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteSaleRow(row.id)}
                                disabled={saleItems.length <= 1}
                                className="p-1.5 text-[#5e5e5e] hover:text-rose-600 disabled:opacity-30 rounded transition cursor-pointer"
                                title="Delete row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stacked Rows View */}
                  <div className="block md:hidden space-y-3">
                    {saleItems.map((row, idx) => (
                      <div key={row.id} className="rounded-[6px] border border-[#cccccc] bg-white p-3.5 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#e0e0e0]">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eaf2ff] text-[12px] font-mono font-bold text-[#0a66c2]">
                              {idx + 1}
                            </span>
                            <span className="text-[13px] font-bold text-[#181818]">Sale Item #{idx + 1}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-mono font-bold text-[#057642]">
                              {formatRWF(Number(row.price || 0) * Number(row.quantity || 0))}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSaleRow(row.id)}
                              disabled={saleItems.length <= 1}
                              className="p-1 text-[#5e5e5e] hover:text-rose-600 disabled:opacity-30 rounded transition cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Product Field */}
                        <div>
                          <label className="mb-1 block text-[13px] font-normal text-[#181818]">
                            Product / Item
                          </label>
                          <div className="space-y-1.5">
                            <select
                              value={row.productId}
                              onChange={e => handleSaleItemChange(row.id, 'productId', e.target.value)}
                              className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-2.5 text-[14px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                            >
                              <option value="">-- Select Master Product or Enter Custom --</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.stockQuantity} {p.unit} in stock - {formatRWF(p.unitPrice)})
                                </option>
                              ))}
                            </select>
                            {!row.productId && (
                              <input
                                type="text"
                                value={row.product}
                                onChange={e => handleSaleItemChange(row.id, 'product', e.target.value)}
                                placeholder="Or type custom product title..."
                                className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-2.5 text-[13px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                              />
                            )}
                          </div>
                        </div>

                        {/* Unit & Quantity Grid on Mobile */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="mb-1 block text-[12px] font-normal text-[#181818]">Unit</label>
                            <select
                              value={row.unit || 'pcs'}
                              onChange={e => handleSaleItemChange(row.id, 'unit', e.target.value)}
                              className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-2 text-[13px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                            >
                              {UNIT_SELECT_OPTIONS.map(u => (
                                <option key={u.value} value={u.value}>
                                  {u.label}
                                </option>
                              ))}
                              {row.unit && !UNIT_SELECT_OPTIONS.some(u => u.value === row.unit) && (
                                <option value={row.unit}>{row.unit}</option>
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-[12px] font-normal text-[#181818]">Quantity</label>
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={row.quantity || ''}
                              onChange={e => handleSaleItemChange(row.id, 'quantity', Number(e.target.value))}
                              placeholder="1"
                              className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-2.5 text-[13px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                            />
                          </div>
                        </div>

                        {/* Unit Price Field */}
                        <div>
                          <label className="mb-1 block text-[12px] font-normal text-[#181818]">Unit Price (FRW)</label>
                          <input
                            type="number"
                            value={row.price || ''}
                            onChange={e => handleSaleItemChange(row.id, 'price', Number(e.target.value))}
                            placeholder="0"
                            className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-2.5 text-[13px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Total & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 gap-4 border-t border-[#e0e0e0]">
                  <button
                    type="button"
                    onClick={handleAddSaleItem}
                    className="flex h-9 items-center gap-1.5 rounded-[4px] border border-[#0a66c2] px-3.5 text-xs font-semibold text-[#0a66c2] transition-colors hover:bg-[#eaf2ff] cursor-pointer bg-white self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4 text-[#0a66c2]" />
                    <span>Add Product Line</span>
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[11px] text-[#5e5e5e] uppercase tracking-wider block">Total Sale Amount</span>
                      <span className="text-xl font-bold text-[#057642] font-mono">
                        {formatRWF(saleTotal)}
                      </span>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={isSubmittingSale}
                      className="flex h-11 items-center justify-center rounded-full bg-[#0a66c2] px-8 text-[15px] font-bold text-white transition-colors hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-xs"
                    >
                      <span>{isSubmittingSale ? 'Processing...' : 'Record Sale Transaction'}</span>
                    </motion.button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {/* =================================================================== */}
          {/* TAB 2: PURCHASES / INTAKE FORM */}
          {/* =================================================================== */}
          {activeTab === 'purchases' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="space-y-6">
              <div className="pb-3 border-b border-[#e0e0e0]">
                <h3 className="text-[16px] font-bold text-[#181818] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#0a66c2]" />
                  <span>Record Supplier Purchase &amp; Stock Intake</span>
                </h3>
                <p className="text-[13px] text-[#5e5e5e] mt-0.5">
                  Log goods received from suppliers. Catalog inventory stock balances are incremented automatically.
                </p>
              </div>

              <form onSubmit={handleRecordPurchase} className="space-y-4 max-w-4xl">
                {/* Field 1: Supplier Name */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Supplier / Vendor Name <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={purchaseSupplier}
                    onChange={e => setPurchaseSupplier(e.target.value)}
                    placeholder="e.g. Bakhresa Grain Millers Ltd"
                    required
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>

                {/* Field 2: Invoice / PO Ref */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Supplier Invoice / PO Reference <span className="text-[12px] text-[#8c8c8c] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={purchaseInvoiceRef}
                    onChange={e => setPurchaseInvoiceRef(e.target.value)}
                    placeholder="e.g. INV-2026-904"
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>

                {/* Field 3: Payment Method */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Payment Settlement Method <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <select
                    value={purchasePaymentMethod}
                    onChange={e => setPurchasePaymentMethod(e.target.value)}
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                  >
                    <option value="Cash">Cash (Immediate Settlement)</option>
                    <option value="Bank Transfer">Bank Wire Transfer</option>
                    <option value="Mobile Money">Mobile Money (MoMo)</option>
                    <option value="On Supplier Credit">On Supplier Credit (Pay Later / Accounts Payable)</option>
                  </select>
                </div>

                {/* Field 4: Intake Date */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Intake / Delivery Date <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={e => setPurchaseDate(e.target.value)}
                    required
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>

                {/* Line Items Container */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[14px] font-normal text-[#181818] block">
                      Received Items &amp; Cost Breakdown <span className="text-rose-600 font-bold">*</span>
                    </label>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto border border-[#cccccc] rounded-[4px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#f8fafc] text-[#5e5e5e] font-semibold border-b border-[#cccccc] text-[12px]">
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3 min-w-[220px]">Product / Material Received</th>
                          <th className="py-2.5 px-3 w-28">Unit</th>
                          <th className="py-2.5 px-3 w-36">Unit Cost (FRW)</th>
                          <th className="py-2.5 px-3 w-28">Intake Quantity</th>
                          <th className="py-2.5 px-3 w-36 text-right">Subtotal (FRW)</th>
                          <th className="py-2.5 px-3 w-14 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e0e0e0] bg-white">
                        {purchaseItems.map((row, idx) => (
                          <tr key={row.id} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 text-center font-mono text-[#8c8c8c] font-bold">{idx + 1}</td>
                            <td className="py-2 px-2">
                              <div className="space-y-1">
                                <select
                                  value={row.productId}
                                  onChange={e => handlePurchaseItemChange(row.id, 'productId', e.target.value)}
                                  className="h-9 w-full rounded-[4px] border border-[#666666] bg-white px-2.5 text-[13px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                                >
                                  <option value="">-- Match Master Product or Enter New --</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} (Current: {p.stockQuantity} {p.unit})
                                    </option>
                                  ))}
                                </select>
                                {!row.productId && (
                                  <input
                                    type="text"
                                    value={row.name}
                                    onChange={e => handlePurchaseItemChange(row.id, 'name', e.target.value)}
                                    placeholder="Or enter new product name..."
                                    className="h-8 w-full rounded-[4px] border border-[#666666] bg-white px-2 text-[12px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                                  />
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-2">
                              <select
                                value={row.unit || 'pcs'}
                                onChange={e => handlePurchaseItemChange(row.id, 'unit', e.target.value)}
                                className="h-9 w-full rounded-[4px] border border-[#666666] bg-white px-1.5 text-[12px] font-mono text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                              >
                                {UNIT_SELECT_OPTIONS.map(u => (
                                  <option key={u.value} value={u.value}>
                                    {u.label}
                                  </option>
                                ))}
                                {row.unit && !UNIT_SELECT_OPTIONS.some(u => u.value === row.unit) && (
                                  <option value={row.unit}>{row.unit}</option>
                                )}
                              </select>
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                value={row.unitPrice || ''}
                                onChange={e => handlePurchaseItemChange(row.id, 'unitPrice', Number(e.target.value))}
                                placeholder="0"
                                className="h-9 w-full rounded-[4px] border border-[#666666] bg-white px-2 text-[13px] font-mono text-right text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                value={row.quantity || ''}
                                onChange={e => handlePurchaseItemChange(row.id, 'quantity', Number(e.target.value))}
                                placeholder="1"
                                className="h-9 w-full rounded-[4px] border border-[#666666] bg-white px-2 text-[13px] font-mono text-center text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#181818]">
                              {formatRWF(Number(row.unitPrice || 0) * Number(row.quantity || 0))}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeletePurchaseRow(row.id)}
                                disabled={purchaseItems.length <= 1}
                                className="p-1.5 text-[#5e5e5e] hover:text-rose-600 disabled:opacity-30 rounded transition cursor-pointer"
                                title="Delete row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stacked Rows View */}
                  <div className="block md:hidden space-y-3">
                    {purchaseItems.map((row, idx) => (
                      <div key={row.id} className="rounded-[6px] border border-[#cccccc] bg-white p-3.5 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#e0e0e0]">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eaf2ff] text-[12px] font-mono font-bold text-[#0a66c2]">
                              {idx + 1}
                            </span>
                            <span className="text-[13px] font-bold text-[#181818]">Received Item #{idx + 1}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-mono font-bold text-[#0a66c2]">
                              {formatRWF(Number(row.unitPrice || 0) * Number(row.quantity || 0))}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeletePurchaseRow(row.id)}
                              disabled={purchaseItems.length <= 1}
                              className="p-1 text-[#5e5e5e] hover:text-rose-600 disabled:opacity-30 rounded transition cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Product / Material Field */}
                        <div>
                          <label className="mb-1 block text-[13px] font-normal text-[#181818]">
                            Product / Material
                          </label>
                          <div className="space-y-1.5">
                            <select
                              value={row.productId}
                              onChange={e => handlePurchaseItemChange(row.id, 'productId', e.target.value)}
                              className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-2.5 text-[14px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                            >
                              <option value="">-- Match Master Product or Enter New --</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (Current: {p.stockQuantity} {p.unit})
                                </option>
                              ))}
                            </select>
                            {!row.productId && (
                              <input
                                type="text"
                                value={row.name}
                                onChange={e => handlePurchaseItemChange(row.id, 'name', e.target.value)}
                                placeholder="Or enter new product name..."
                                className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-2.5 text-[13px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                              />
                            )}
                          </div>
                        </div>

                        {/* Unit & Quantity Grid on Mobile */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="mb-1 block text-[12px] font-normal text-[#181818]">Unit</label>
                            <select
                              value={row.unit || 'pcs'}
                              onChange={e => handlePurchaseItemChange(row.id, 'unit', e.target.value)}
                              className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-2 text-[13px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                            >
                              {UNIT_SELECT_OPTIONS.map(u => (
                                <option key={u.value} value={u.value}>
                                  {u.label}
                                </option>
                              ))}
                              {row.unit && !UNIT_SELECT_OPTIONS.some(u => u.value === row.unit) && (
                                <option value={row.unit}>{row.unit}</option>
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-[12px] font-normal text-[#181818]">Intake Qty</label>
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={row.quantity || ''}
                              onChange={e => handlePurchaseItemChange(row.id, 'quantity', Number(e.target.value))}
                              placeholder="1"
                              className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-2.5 text-[13px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                            />
                          </div>
                        </div>

                        {/* Unit Cost Field */}
                        <div>
                          <label className="mb-1 block text-[12px] font-normal text-[#181818]">Unit Cost (FRW)</label>
                          <input
                            type="number"
                            value={row.unitPrice || ''}
                            onChange={e => handlePurchaseItemChange(row.id, 'unitPrice', Number(e.target.value))}
                            placeholder="0"
                            className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-2.5 text-[13px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 gap-4 border-t border-[#e0e0e0]">
                  <button
                    type="button"
                    onClick={handleAddPurchaseRow}
                    className="flex h-9 items-center gap-1.5 rounded-[4px] border border-[#0a66c2] px-3.5 text-xs font-semibold text-[#0a66c2] transition-colors hover:bg-[#eaf2ff] cursor-pointer bg-white self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4 text-[#0a66c2]" />
                    <span>Add Item Row</span>
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[11px] text-[#5e5e5e] uppercase tracking-wider block">Total Purchase Cost</span>
                      <span className="text-xl font-bold text-[#0a66c2] font-mono">
                        {formatRWF(purchaseTotal)}
                      </span>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={isSubmittingPurchase}
                      className="flex h-11 items-center justify-center rounded-full bg-[#0a66c2] px-8 text-[15px] font-bold text-white transition-colors hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-xs"
                    >
                      <span>{isSubmittingPurchase ? 'Processing...' : 'Record Purchase & Restock'}</span>
                    </motion.button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {/* =================================================================== */}
          {/* TAB 3: CASH IN FORM */}
          {/* =================================================================== */}
          {activeTab === 'cash_in' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="space-y-6">
              <div className="pb-3 border-b border-[#e0e0e0]">
                <h3 className="text-[16px] font-bold text-[#181818] flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-[#0a66c2]" />
                  <span>Record Cash Inflow (Capital &amp; Injections)</span>
                </h3>
                <p className="text-[13px] text-[#5e5e5e] mt-0.5">
                  Record non-sale funds entering the business (e.g. loans disbursed, equity investment, grants, founder equity, or debtor payments).
                </p>
              </div>

              <form onSubmit={handleRecordCashIn} className="space-y-4 max-w-4xl">
                {/* Field 1: Amount */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Inflow Amount (FRW) <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cashInAmount}
                    onChange={e => setCashInAmount(e.target.value)}
                    placeholder="e.g. 5000000"
                    required
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>

                {/* Field 2: Source */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Source of Funds / Entity <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={cashInSource}
                    onChange={e => setCashInSource(e.target.value)}
                    placeholder="e.g. BPR Bank / MINAGRI Grant / Angel Investor"
                    required
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>

                {/* Field 3: Category */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Inflow Category / Strategic Reason <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <select
                    value={cashInReason}
                    onChange={e => setCashInReason(e.target.value)}
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                  >
                    <option value="Loan received">Loan / Credit Facility Disbursed</option>
                    <option value="Investment / Equity">Investor Capital / Equity Infusion</option>
                    <option value="Grant funding">Grant / Non-Dilutive Subsidy</option>
                    <option value="Owner contribution">Owner / Founder Capital Contribution</option>
                    <option value="Customer debt payment">Accounts Receivable / Debt Settlement</option>
                    <option value="Asset sale">Sale of Old Machinery / Fixed Asset</option>
                    <option value="Other Inflow">Other Cash Inflow</option>
                  </select>
                </div>

                {/* Field 4: Payment Method */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Payment / Deposit Channel <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <select
                    value={cashInPaymentMethod}
                    onChange={e => setCashInPaymentMethod(e.target.value)}
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                  >
                    <option value="Bank Transfer">Bank Wire Transfer</option>
                    <option value="Mobile Money">Mobile Money (MoMo)</option>
                    <option value="Cash">Cash Deposit</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>

                {/* Field 5: Date */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Date Received <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    value={cashInDate}
                    onChange={e => setCashInDate(e.target.value)}
                    required
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>

                {/* Field 6: Notes */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Memo / Reference Notes <span className="text-[12px] text-[#8c8c8c] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={cashInNotes}
                    onChange={e => setCashInNotes(e.target.value)}
                    placeholder="e.g. Tranche 1 disbursement ref #4829 or Contract Annex A"
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>

                {/* Bottom Submit */}
                <div className="flex justify-end pt-3 border-t border-[#e0e0e0]">
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    className="flex h-11 items-center justify-center rounded-full bg-[#0a66c2] px-8 text-[15px] font-bold text-white transition-colors hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-xs"
                  >
                    <span>Record Cash Inflow</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}

          {/* =================================================================== */}
          {/* TAB 4: MERGED CASH OUT & EXPENSES FORM */}
          {/* =================================================================== */}
          {activeTab === 'cash_out' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#e0e0e0] gap-3">
                <div>
                  <h3 className="text-[16px] font-bold text-[#181818] flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-[#0a66c2]" />
                    <span>Record Cash Outflow &amp; Operational Expenses</span>
                  </h3>
                  <p className="text-[13px] text-[#5e5e5e] mt-0.5">
                    Log all disbursements and expenses (bills, utilities, rent, salaries, repairs, taxes, supplier payments, loan installments, or dividends).
                  </p>
                </div>

                {/* Entry Mode Switcher: Single Item vs Batch Multi-Invoice */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCashOutMode('single')}
                    className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition cursor-pointer ${
                      cashOutMode === 'single'
                        ? 'border border-[#0a66c2] bg-[#eaf2ff] text-[#0a66c2]'
                        : 'border border-[#cccccc] bg-white text-[#5e5e5e] hover:border-[#666666]'
                    }`}
                  >
                    Single Outflow
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashOutMode('batch')}
                    className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition cursor-pointer ${
                      cashOutMode === 'batch'
                        ? 'border border-[#0a66c2] bg-[#eaf2ff] text-[#0a66c2]'
                        : 'border border-[#cccccc] bg-white text-[#5e5e5e] hover:border-[#666666]'
                    }`}
                  >
                    Batch Invoices
                  </button>
                </div>
              </div>

              {cashOutMode === 'single' ? (
                /* Single Entry Form - 1 Field Per Row */
                <form onSubmit={handleRecordSingleCashOut} className="space-y-4 max-w-4xl">
                  {/* Field 1: Amount */}
                  <div>
                    <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                      Outflow / Expense Amount (FRW) <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={cashOutAmount}
                      onChange={e => setCashOutAmount(e.target.value)}
                      placeholder="e.g. 350000"
                      required
                      className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                    />
                  </div>

                  {/* Field 2: Category */}
                  <div>
                    <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                      Expense / Outflow Category <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <select
                      value={cashOutCategory}
                      onChange={e => setCashOutCategory(e.target.value)}
                      className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                    >
                      <optgroup label="Operational Expenses">
                        <option value="Utilities">Utilities (Water, Electricity, Internet)</option>
                        <option value="Rent">Rent &amp; Facility Leases</option>
                        <option value="Salaries">Staff Payroll &amp; Direct Labor</option>
                        <option value="Repairs">Machinery Repairs &amp; Maintenance</option>
                        <option value="Transport">Transport, Fuel &amp; Haulage</option>
                        <option value="Marketing">Marketing, Ads &amp; Promotions</option>
                        <option value="Taxes">Taxes, Municipal Levies &amp; RRA</option>
                        <option value="General Expenses">General Office &amp; Operations</option>
                      </optgroup>
                      <optgroup label="Financial & Capital Outflows">
                        <option value="Loan Repayment">Bank Loan / Credit Repayment</option>
                        <option value="Supplier Settlement">Accounts Payable / Supplier Settlement</option>
                        <option value="Owner Drawing">Owner Drawing / Dividend Cashout</option>
                        <option value="Asset Purchase">Machinery / Fixed Asset Purchase</option>
                        <option value="Advance Cashout">Employee Advance / Petty Cash Out</option>
                        <option value="Other Outflow">Other Direct Outflow</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Field 3: Description / Recipient */}
                  <div>
                    <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                      Description / Recipient <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={cashOutDescription}
                      onChange={e => setCashOutDescription(e.target.value)}
                      placeholder="e.g. Office Electricity Bill or BK Loan Installment"
                      required
                      className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                    />
                  </div>

                  {/* Field 4: Payment Method */}
                  <div>
                    <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                      Payment Method / Channel <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <select
                      value={cashOutPaymentMethod}
                      onChange={e => setCashOutPaymentMethod(e.target.value)}
                      className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                    >
                      <option value="Cash">Cash Settlement</option>
                      <option value="Mobile Money">Mobile Money (MoMo)</option>
                      <option value="Bank Transfer">Bank Wire Transfer</option>
                      <option value="Cheque">Bank Cheque</option>
                    </select>
                  </div>

                  {/* Field 5: Date */}
                  <div>
                    <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                      Payment Date <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <input
                      type="date"
                      value={cashOutDate}
                      onChange={e => setCashOutDate(e.target.value)}
                      required
                      className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                    />
                  </div>

                  {/* Field 6: Notes */}
                  <div>
                    <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                      Notes / Receipt Voucher Reference <span className="text-[12px] text-[#8c8c8c] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={cashOutNotes}
                      onChange={e => setCashOutNotes(e.target.value)}
                      placeholder="e.g. Receipt #84092 or Cash slip voucher"
                      className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                    />
                  </div>

                  {/* Bottom Submit */}
                  <div className="flex justify-end pt-3 border-t border-[#e0e0e0]">
                    <motion.button
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      className="flex h-11 items-center justify-center rounded-full bg-[#0a66c2] px-8 text-[15px] font-bold text-white transition-colors hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-xs"
                    >
                      <span>Record Cash Outflow</span>
                    </motion.button>
                  </div>
                </form>
              ) : (
                /* Batch Invoices Mode */
                <form onSubmit={handleRecordBatchCashOut} className="space-y-4 max-w-4xl">
                  {/* Batch Date Field - 1 per row */}
                  <div>
                    <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                      Batch Effective Date <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <input
                      type="date"
                      value={cashOutDate}
                      onChange={e => setCashOutDate(e.target.value)}
                      required
                      className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                    />
                  </div>

                  {/* Batch Table */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[14px] font-normal text-[#181818] block">
                        Batch Expense &amp; Disbursement Lines <span className="text-rose-600 font-bold">*</span>
                      </label>
                    </div>

                    <div className="overflow-x-auto border border-[#cccccc] rounded-[4px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#f8fafc] text-[#5e5e5e] font-semibold border-b border-[#cccccc] text-[12px]">
                            <th className="py-2.5 px-3 w-10 text-center">#</th>
                            <th className="py-2.5 px-3 min-w-[200px]">Expense / Outflow Description</th>
                            <th className="py-2.5 px-3 w-56">Category</th>
                            <th className="py-2.5 px-3 w-40">Payment Channel</th>
                            <th className="py-2.5 px-3 w-40 text-right">Amount (FRW)</th>
                            <th className="py-2.5 px-3 w-14 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e0e0e0] bg-white">
                          {cashOutBatchLines.map((row, idx) => (
                            <tr key={row.id} className="hover:bg-slate-50/60">
                              <td className="py-2 px-3 text-center font-mono text-[#8c8c8c] font-bold">{idx + 1}</td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={row.description}
                                  onChange={e => handleBatchLineChange(row.id, 'description', e.target.value)}
                                  placeholder="e.g. Office Electricity Bill or Store Rent"
                                  className="h-9 w-full rounded-[4px] border border-[#666666] bg-white px-2 text-[13px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                                  required
                                />
                              </td>
                              <td className="py-2 px-2">
                                <select
                                  value={row.category}
                                  onChange={e => handleBatchLineChange(row.id, 'category', e.target.value)}
                                  className="h-9 w-full rounded-[4px] border border-[#666666] bg-white px-2 text-[13px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                                >
                                  <option value="Utilities">Utilities (Water, Electricity, Web)</option>
                                  <option value="Rent">Rent &amp; Facility Leases</option>
                                  <option value="Salaries">Staff Salaries &amp; Labor</option>
                                  <option value="Repairs">Repairs &amp; Maintenance</option>
                                  <option value="Transport">Transport, Fuel &amp; Logistics</option>
                                  <option value="Taxes">Taxes &amp; RRA Levies</option>
                                  <option value="Loan Repayment">Loan Repayment</option>
                                  <option value="Supplier Settlement">Supplier Settlement</option>
                                  <option value="Other">Other Expenses</option>
                                </select>
                              </td>
                              <td className="py-2 px-2">
                                <select
                                  value={row.paymentMethod}
                                  onChange={e => handleBatchLineChange(row.id, 'paymentMethod', e.target.value)}
                                  className="h-9 w-full rounded-[4px] border border-[#666666] bg-white px-2 text-[13px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                                >
                                  <option value="Cash">Cash</option>
                                  <option value="Mobile Money">MoMo</option>
                                  <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={row.amount || ''}
                                  onChange={e => handleBatchLineChange(row.id, 'amount', Number(e.target.value))}
                                  placeholder="0"
                                  className="h-9 w-full rounded-[4px] border border-[#666666] bg-white px-2 text-[13px] font-mono text-right text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                                  required
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBatchLine(row.id)}
                                  disabled={cashOutBatchLines.length <= 1}
                                  className="p-1.5 text-[#5e5e5e] hover:text-rose-600 disabled:opacity-30 rounded transition cursor-pointer"
                                  title="Delete row"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Batch Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 gap-4 border-t border-[#e0e0e0]">
                    <button
                      type="button"
                      onClick={handleAddBatchLine}
                      className="flex h-9 items-center gap-1.5 rounded-[4px] border border-[#0a66c2] px-3.5 text-xs font-semibold text-[#0a66c2] transition-colors hover:bg-[#eaf2ff] cursor-pointer bg-white self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4 text-[#0a66c2]" />
                      <span>Add Item Line</span>
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[11px] text-[#5e5e5e] uppercase tracking-wider block">Total Outflow Amount</span>
                        <span className="text-xl font-bold text-rose-600 font-mono">
                          {formatRWF(batchTotal)}
                        </span>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        className="flex h-11 items-center justify-center rounded-full bg-[#0a66c2] px-8 text-[15px] font-bold text-white transition-colors hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-xs"
                      >
                        <span>Record Batch Outflows</span>
                      </motion.button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          )}

          {/* =================================================================== */}
          {/* TAB 5: OTHER ACTIVITIES FORM */}
          {/* =================================================================== */}
          {activeTab === 'other' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="space-y-6">
              <div className="pb-3 border-b border-[#e0e0e0]">
                <h3 className="text-[16px] font-bold text-[#181818] flex items-center gap-2">
                                  <span>Record General Business Activity or Milestone</span>
                </h3>
                <p className="text-[13px] text-[#5e5e5e] mt-0.5">
                  Log project starts, client contracts, harvest completions, equipment installations, or compliance certifications.
                </p>
              </div>

              <form onSubmit={handleRecordOtherActivity} className="space-y-4 max-w-4xl">
                {/* Field 1: Title */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Activity Title / Subject <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={otherTitle}
                    onChange={e => setOtherTitle(e.target.value)}
                    placeholder="e.g. Contract signed with Simbisa Brands / Season A Harvest Completed"
                    required
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>

                {/* Field 2: Date */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Event Date <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    value={otherDate}
                    onChange={e => setOtherDate(e.target.value)}
                    required
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>

                {/* Field 3: Description */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Activity Description &amp; Details <span className="text-[12px] text-[#8c8c8c] font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={otherDescription}
                    onChange={e => setOtherDescription(e.target.value)}
                    placeholder="e.g. Supply agreement for 5 tons monthly delivered to Kigali central hub."
                    className="w-full rounded-[4px] border border-[#666666] bg-white p-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </div>

                {/* Field 4: Status */}
                <div>
                  <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                    Execution Status <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <select
                    value={otherStatus}
                    onChange={e => setOtherStatus(e.target.value as any)}
                    className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Planned">Planned</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                {/* Money Involved Toggle Card */}
                <div className="p-3.5 bg-[#f8fafc] border border-[#cccccc] rounded-[6px] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#181818] text-[13px] block">
                      Financial Attachment / Monetary Value?
                    </span>
                    <span className="text-[12px] text-[#5e5e5e]">
                      Enable if this activity has an associated contract budget or valuation.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={otherMoneyInvolved}
                      onChange={e => setOtherMoneyInvolved(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0a66c2]"></div>
                  </label>
                </div>

                {/* Financial Fields (Dedicated single rows when toggled) */}
                {otherMoneyInvolved && (
                  <div className="space-y-4 pt-1">
                    {/* Financial Amount */}
                    <div>
                      <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                        Contract / Budget Amount (FRW) <span className="text-rose-600 font-bold">*</span>
                      </label>
                      <input
                        type="number"
                        value={otherAmount}
                        onChange={e => setOtherAmount(e.target.value)}
                        placeholder="e.g. 12000000"
                        required={otherMoneyInvolved}
                        className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                      />
                    </div>

                    {/* Settlement Status */}
                    <div>
                      <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                        Payment / Settlement Status <span className="text-rose-600 font-bold">*</span>
                      </label>
                      <select
                        value={otherPaymentStatus}
                        onChange={e => setOtherPaymentStatus(e.target.value as any)}
                        className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] cursor-pointer"
                      >
                        <option value="Completed">Completed / Fully Paid</option>
                        <option value="Pending">Pending / Receivable</option>
                        <option value="Partial">Partial Payment</option>
                        <option value="N/A">Not Applicable</option>
                      </select>
                    </div>

                    {/* Category Tag */}
                    <div>
                      <label className="mb-1 block text-[14px] font-normal text-[#181818]">
                        Milestone Classification <span className="text-[12px] text-[#8c8c8c] font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={otherCategory}
                        onChange={e => setOtherCategory(e.target.value)}
                        placeholder="e.g. Major Contract, Machinery, Governance, Certification"
                        className="h-11 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[15px] text-[#181818] outline-none transition-colors placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                      />
                    </div>
                  </div>
                )}

                {/* Bottom Submit */}
                <div className="flex justify-end pt-3 border-t border-[#e0e0e0]">
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    className="flex h-11 items-center justify-center rounded-full bg-[#0a66c2] px-8 text-[15px] font-bold text-white transition-colors hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-xs"
                  >
                    <span>Record Business Activity</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
      </div>

      {/* ========================================================================= */}
      {/* UNIFIED ACTIVITIES HISTORY LEDGER */}
      {/* ========================================================================= */}
      <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Consolidated Business Activities Log &amp; Ledger</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit trail of all transactions and operations recorded for {activeSme.name}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search activities or parties..."
                className="pl-8 h-8 text-xs w-48 sm:w-60 bg-slate-50 border-slate-200 rounded-lg"
              />
            </div>

            <select
              value={ledgerFilter}
              onChange={e => setLedgerFilter(e.target.value as any)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 h-8 outline-none"
            >
              <option value="all">All Activities ({allActivities.length})</option>
              <option value="sales">Sales Only ({salesList.length})</option>
              <option value="purchases">Purchases Only ({purchasesList.length})</option>
              <option value="cash_in">Cash In Only ({cashInsList.length})</option>
              <option value="cash_out">Cash Out &amp; Expenses ({cashOutsCombined.length})</option>
              <option value="other">Other Milestones ({otherList.length})</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Activity Type</th>
                <th className="py-3 px-4">Title / Description</th>
                <th className="py-3 px-4">Entity / Counterparty</th>
                <th className="py-3 px-4">Category / Channel</th>
                <th className="py-3 px-4 text-right">Amount (FRW)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center w-14">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-xs text-slate-600">No activities recorded matching criteria</p>
                    <p className="text-[11px] mt-0.5">Use the forms above to log sales, purchases, cashflow, or milestones.</p>
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => {
                  const getBadge = () => {
                    switch (act.type) {
                      case 'sales':
                        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      case 'purchases':
                        return 'bg-blue-50 text-blue-700 border-blue-200';
                      case 'cash_in':
                        return 'bg-teal-50 text-teal-700 border-teal-200';
                      case 'cash_out':
                        return 'bg-amber-50 text-amber-700 border-amber-200';
                      case 'other':
                        return 'bg-purple-50 text-purple-700 border-purple-200';
                    }
                  };

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {act.date}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadge()}`}>
                          {act.typeLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {act.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {act.party || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {act.category}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        {act.amount > 0 ? (
                          act.isPositive ? (
                            <span className="text-emerald-600">+{formatRWF(act.amount)}</span>
                          ) : (
                            <span className="text-rose-600">-{formatRWF(act.amount)}</span>
                          )
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {act.status || 'Logged'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(act)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal for Creating Master Products */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (data) => {
          const newProd = await createProduct(data);
          showToast(`Created new catalog item: "${newProd.name}"`);
        }}
      />

      {/* Modal for Editing Master Products */}
      {editingProduct && (
        <EditProductModal
          isOpen={!!editingProduct}
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSubmit={async (id: string, data: any) => {
            await updateProduct(id, data);
            showToast(`Product updated successfully.`);
          }}
        />
      )}
    </div>
  );
}

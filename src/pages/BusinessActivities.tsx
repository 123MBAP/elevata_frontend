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
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Trash2,
  Edit3,
  Search,
  FileText,
  Activity,
  Check,
  X,
  Truck,
  Star,
  CheckCircle,
  Bell,
  Users
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

  // Modals & UI View States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [showAttentionBanner, setShowAttentionBanner] = useState(true);
  const [showLedgerView, setShowLedgerView] = useState(true);
  const [showKeypadModal, setShowKeypadModal] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'granted') {
        setShowAttentionBanner(false);
      }
    } else {
      setNotificationPermission('unsupported');
    }
  }, []);

  const sendDesktopNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico'
        });
      } catch (e) {
        console.error('Error firing desktop notification:', e);
      }
    }
  };

  const handleEnableNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Desktop notifications are not supported by this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        sendDesktopNotification(
          'Elevata 360 • Notifications Enabled',
          'You will now receive instant desktop alerts for sales, restock, and accounting transactions.'
        );
        showToast('Desktop notifications enabled successfully!');
        setShowAttentionBanner(false);
      } else if (permission === 'denied') {
        showToast('Desktop notifications were blocked in browser settings.');
      }
    } catch (err) {
      console.error('Failed to request notification permission:', err);
    }
  };

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
      sendDesktopNotification('Sale Recorded', `Sale of ${formatRWF(saleTotal)} to "${saleCustomer}" logged successfully.`);

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
      sendDesktopNotification('Purchase Recorded', `Purchase of ${formatRWF(purchaseTotal)} from "${purchaseSupplier}" logged.`);

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
    sendDesktopNotification('Cash Inflow Logged', `Cash Inflow of ${formatRWF(amt)} from ${cashInSource} recorded.`);

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
    sendDesktopNotification('Expense Voucher Recorded', `Expense of ${formatRWF(amt)} for "${cashOutDescription}" logged.`);

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
    sendDesktopNotification('Batch Expenses Logged', `Recorded ${validLines.length} expense items totaling ${formatRWF(batchTotal)}.`);

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
    sendDesktopNotification('Activity Logged', `Milestone / Activity "${otherTitle}" logged.`);

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
    { id: 'sales' as ActivityTab, label: 'Sales Book', icon: <ShoppingBag className="w-4 h-4" />, count: salesList.length, color: 'text-emerald-600' },
    { id: 'purchases' as ActivityTab, label: 'Purchases Book', icon: <Truck className="w-4 h-4" />, count: purchasesList.length, color: 'text-blue-600' },
    { id: 'cash_in' as ActivityTab, label: 'Cash In Journal', icon: <ArrowDownLeft className="w-4 h-4" />, count: cashInsList.length, color: 'text-teal-600' },
    { id: 'cash_out' as ActivityTab, label: 'Cash Out & OPEX', icon: <ArrowUpRight className="w-4 h-4" />, count: cashOutsCombined.length, color: 'text-amber-600' },
    { id: 'other' as ActivityTab, label: 'General Journal', icon: <Star className="w-4 h-4" />, count: otherList.length, color: 'text-purple-600' }
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

      {/* ========================================================================= */}
      {/* 1. TOP ATTENTION NOTIFICATION BANNER (Functional Desktop Notifications) */}
      {/* ========================================================================= */}
      {showAttentionBanner && notificationPermission !== 'granted' && (
        <div className="flex items-center justify-between rounded-[4px] bg-[#ffa834] px-3.5 sm:px-4 py-2 text-white shadow-xs transition-all">
          <div
            onClick={handleEnableNotifications}
            className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-[13px] font-semibold cursor-pointer hover:opacity-95 select-none transition-opacity"
            title="Click to allow desktop notifications"
          >
            <Bell className="w-4 h-4 shrink-0 text-white animate-pulse" />
            <span className="font-bold">Attention!</span>
            <span>Click to allow displaying of desktop notifications.</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEnableNotifications();
              }}
              className="ml-1 sm:ml-2 px-2.5 py-0.5 rounded-[4px] bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold border border-white/40 shadow-xs transition-colors cursor-pointer"
            >
              Allow Notifications
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAttentionBanner(false)}
              className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss banner"
              title="Dismiss notification prompt"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowLedgerView(!showLedgerView)}
              title="Toggle Ledger Journal"
              className="hidden sm:flex items-center justify-center h-7 w-7 rounded-[4px] bg-[#2998d6] hover:bg-[#1f85be] text-white transition-colors shadow-xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN ACCOUNTING BOOKS & JOURNAL ENTRY CARD (Folder Tab Design) */}
      {/* ========================================================================= */}
      <div className="relative">
        {/* EYE-CATCHING FOLDER TABS BAR (Connected to Card Body) */}
        <div className="flex items-end overflow-x-auto scrollbar-none z-10 relative space-x-1 sm:space-x-1.5 -mb-[1px]">
          {tabsConfig.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`group relative flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-t-[6px] text-xs sm:text-sm transition-all duration-150 cursor-pointer whitespace-nowrap select-none border-t border-x ${
                  isActive
                    ? 'bg-white text-slate-900 font-bold border-[#cbd5e1] border-b-white border-b-2 shadow-xs z-20 -mb-[1px] pt-3 sm:pt-3.5 pb-2.5 sm:pb-3 ring-0'
                    : 'bg-[#f1f5f9] hover:bg-[#e4eaf2] text-[#475569] font-medium border-[#cbd5e1] border-b-[#cbd5e1] hover:text-[#0f172a]'
                }`}
              >
                {/* Active Indicator Accent Top Strip */}
                {isActive && (
                  <span className="absolute top-0 left-0 right-0 h-[3px] bg-[#2998d6] rounded-t-[6px]" />
                )}

                <span className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? tab.color : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {tab.icon}
                </span>

                <span className="tracking-tight">{tab.label}</span>

                {/* Count Badge */}
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors ${
                    isActive
                      ? 'bg-[#2998d6] text-white shadow-xs'
                      : 'bg-[#cbd5e1] text-[#334155] group-hover:bg-[#94a3b8] group-hover:text-white'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* MAIN WHITE CARD CONTAINER */}
        <div className="accounting-card p-5 sm:p-7 relative z-0 border-[#cbd5e1] rounded-t-none">
          {/* Card Header Title & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#e2e8f0]">
            <div>
              <h2 className="text-xl sm:text-2xl font-normal text-[#1e293b] font-heading">
                {activeTab === 'sales' && 'Add a new sale / customer invoice'}
                {activeTab === 'purchases' && 'Add a new purchase / stock intake'}
                {activeTab === 'cash_in' && 'Add a new cash inflow / capital receipt'}
                {activeTab === 'cash_out' && 'Add a new cash outflow / expense voucher'}
                {activeTab === 'other' && 'Add a new milestone / general activity'}
              </h2>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setShowLedgerView(!showLedgerView)}
                className="accounting-btn-primary"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{showLedgerView ? 'Hide Audit Ledger' : 'Edit Fields / View Ledger'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="accounting-btn-secondary"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Master Product</span>
              </button>
            </div>
          </div>

        {/* Top 3 Solid Cyan Select Dropdowns (matching the 3 selects in screenshot) */}
        <div className="pt-3 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="accounting-label">Activity Journal</label>
              <select
                value={activeTab}
                onChange={(e) => handleSelectTab(e.target.value as ActivityTab)}
                className="accounting-select w-full"
              >
                <option value="sales">Sales (Client Orders & Receipts)</option>
                <option value="purchases">Purchases (Supplier Intake & COGS)</option>
                <option value="cash_in">Cash In (Capital & Inflows)</option>
                <option value="cash_out">Cash Out & Operational Expenses</option>
                <option value="other">General Activities & Milestones</option>
              </select>
            </div>

            <div>
              <label className="accounting-label">Settlement Channel</label>
              <select
                value={
                  activeTab === 'sales'
                    ? salePaymentMethod
                    : activeTab === 'purchases'
                    ? purchasePaymentMethod
                    : activeTab === 'cash_in'
                    ? cashInPaymentMethod
                    : cashOutPaymentMethod
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (activeTab === 'sales') setSalePaymentMethod(val);
                  else if (activeTab === 'purchases') setPurchasePaymentMethod(val);
                  else if (activeTab === 'cash_in') setCashInPaymentMethod(val);
                  else setCashOutPaymentMethod(val);
                }}
                className="accounting-select w-full"
              >
                <option value="Cash">Cash (Immediate Settlement)</option>
                <option value="Mobile Money">Mobile Money (MTN / Airtel MoMo)</option>
                <option value="Bank Transfer">Bank Wire Transfer</option>
                <option value="Credit / Receivable">Trade Credit (Accounts Receivable)</option>
                <option value="Cheque">Bank Cheque</option>
              </select>
            </div>

            <div>
              <label className="accounting-label">Ledger Status</label>
              <select
                value="Cleared"
                className="accounting-select w-full opacity-80 cursor-not-allowed"
                disabled
              >
                <option value="Cleared">Cleared & Confirmed</option>
                <option value="Pending">Pending Reconciliation</option>
                <option value="Hold">Audit Hold</option>
              </select>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: SALES FORM (3-Column Accounting Grid) */}
        {/* ===================================================================== */}
        {activeTab === 'sales' && (
          <form onSubmit={handleRecordSale} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Column 1 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">
                    Customer / Client Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={saleCustomer}
                    onChange={(e) => setSaleCustomer(e.target.value)}
                    placeholder="e.g. Akagera Canteen or Walk-in Buyer"
                    required
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Customer Segment / Type</label>
                  <select className="accounting-select w-full">
                    <option value="retail">Direct Retail Buyer</option>
                    <option value="wholesale">Wholesale Distributor</option>
                    <option value="institution">Institutional / Corporate</option>
                  </select>
                </div>
                <div>
                  <label className="accounting-label">Delivery Location / City (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Kigali Central or Musanze"
                    className="accounting-input w-full"
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">Contact / Phone Number</label>
                  <input
                    type="text"
                    value={saleContact}
                    onChange={(e) => setSaleContact(e.target.value)}
                    placeholder="+250 788 000 000"
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">
                    Transaction Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    required
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Payment Method</label>
                  <select className="accounting-select w-full" defaultValue="Cash">
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Mobile money">Mobile money</option>
                  </select>
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">Invoice / Receipt Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-081"
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Tax ID / TIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 100-294-882"
                    className="accounting-input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table: Accounting Ledger Grid */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="accounting-label font-bold text-slate-800">
                  Product Line Items & Inventory Decrement <span className="text-rose-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddSaleItem}
                  className="text-xs font-semibold text-[#0284c7] hover:text-[#0369a1] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-[#cbd5e1] rounded-[4px] bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f1f5f9] text-[#475569] font-bold border-b border-[#cbd5e1] text-[11px] uppercase tracking-wider">
                      <th className="py-2 px-3 w-10 text-center">#</th>
                      <th className="py-2 px-3 min-w-[220px]">Product / Item from Master Catalog</th>
                      <th className="py-2 px-3 w-28">Unit</th>
                      <th className="py-2 px-3 w-36">Unit Price (FRW)</th>
                      <th className="py-2 px-3 w-28 text-center">Quantity</th>
                      <th className="py-2 px-3 w-36 text-right">Line Total (FRW)</th>
                      <th className="py-2 px-3 w-14 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] bg-white">
                    {saleItems.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-2 px-2">
                          <div className="space-y-1">
                            <select
                              value={row.productId}
                              onChange={(e) => handleSaleItemChange(row.id, 'productId', e.target.value)}
                              className="accounting-select w-full !h-8 !min-h-8 text-xs"
                            >
                              <option value="">-- Select Master Product or Type Custom --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.stockQuantity} {p.unit} in stock - {formatRWF(p.unitPrice)})
                                </option>
                              ))}
                            </select>
                            {!row.productId && (
                              <input
                                type="text"
                                value={row.product}
                                onChange={(e) => handleSaleItemChange(row.id, 'product', e.target.value)}
                                placeholder="Or type custom item name..."
                                className="accounting-input w-full !h-7 !min-h-7 text-xs"
                              />
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={row.unit || 'pcs'}
                            onChange={(e) => handleSaleItemChange(row.id, 'unit', e.target.value)}
                            className="accounting-select w-full !h-8 !min-h-8 text-xs font-mono"
                          >
                            {UNIT_SELECT_OPTIONS.map((u) => (
                              <option key={u.value} value={u.value}>
                                {u.label}
                              </option>
                            ))}
                            {row.unit && !UNIT_SELECT_OPTIONS.some((u) => u.value === row.unit) && (
                              <option value={row.unit}>{row.unit}</option>
                            )}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={row.price || ''}
                            onChange={(e) => handleSaleItemChange(row.id, 'price', Number(e.target.value))}
                            placeholder="0"
                            className="accounting-input w-full !h-8 !min-h-8 text-xs font-mono text-right"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={row.quantity || ''}
                            onChange={(e) => handleSaleItemChange(row.id, 'quantity', Number(e.target.value))}
                            placeholder="1"
                            className="accounting-input w-full !h-8 !min-h-8 text-xs font-mono text-center"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                          {formatRWF(Number(row.price || 0) * Number(row.quantity || 0))}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteSaleRow(row.id)}
                            disabled={saleItems.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded transition cursor-pointer"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Description / Ledger Memo Field */}
            <div>
              <label className="accounting-label">Description / Transaction Memo</label>
              <textarea
                rows={2}
                placeholder="Add audit notes, payment terms, or delivery voucher details..."
                className="accounting-textarea w-full"
              />
            </div>

            {/* Bottom Total & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-[#e2e8f0] gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">Total Sale Settlement:</span>
                <span className="text-lg font-bold font-mono text-emerald-700">{formatRWF(saleTotal)}</span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="submit"
                  disabled={isSubmittingSale}
                  className="accounting-btn-primary"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmittingSale ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSaleCustomer('');
                    setSaleContact('');
                    setSaleItems([{ id: '1', productId: '', product: '', unit: 'pcs', price: 0, quantity: 1, availableStock: 0 }]);
                  }}
                  className="accounting-btn-secondary"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: PURCHASES FORM (3-Column Accounting Grid) */}
        {/* ===================================================================== */}
        {activeTab === 'purchases' && (
          <form onSubmit={handleRecordPurchase} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Column 1 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">
                    Supplier / Vendor Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={purchaseSupplier}
                    onChange={(e) => setPurchaseSupplier(e.target.value)}
                    placeholder="e.g. Bakhresa Grain Millers Ltd"
                    required
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Inventory Warehouse / Hub</label>
                  <select className="accounting-select w-full">
                    <option value="main">Main Enterprise Warehouse</option>
                    <option value="transit">Goods in Transit</option>
                    <option value="store">Retail Storefront</option>
                  </select>
                </div>
                <div>
                  <label className="accounting-label">Payment Method</label>
                  <select className="accounting-select w-full" defaultValue="Cash">
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Mobile money">Mobile money</option>
                  </select>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">Supplier Invoice / PO Reference</label>
                  <input
                    type="text"
                    value={purchaseInvoiceRef}
                    onChange={(e) => setPurchaseInvoiceRef(e.target.value)}
                    placeholder="e.g. INV-2026-904"
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">
                    Purchase Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    required
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Currency / Unit</label>
                  <input
                    type="text"
                    value="FRW (Rwandan Franc)"
                    readOnly
                    className="accounting-input w-full bg-slate-50"
                  />
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">Supplier TIN / Tax Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 102-394-118"
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Supplier Contact Number</label>
                  <input
                    type="text"
                    placeholder="+250 788 000 000"
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Received By / Inspector</label>
                  <input
                    type="text"
                    placeholder={activeSme.ownerName || 'Procurement Officer'}
                    className="accounting-input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table: Accounting Ledger Grid */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="accounting-label font-bold text-slate-800">
                  Purchased Goods & Stock Intake Lines <span className="text-rose-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddPurchaseRow}
                  className="text-xs font-semibold text-[#0284c7] hover:text-[#0369a1] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Purchase Line</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-[#cbd5e1] rounded-[4px] bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f1f5f9] text-[#475569] font-bold border-b border-[#cbd5e1] text-[11px] uppercase tracking-wider">
                      <th className="py-2 px-3 w-10 text-center">#</th>
                      <th className="py-2 px-3 min-w-[220px]">Item Description / Catalog Product</th>
                      <th className="py-2 px-3 w-28">Unit</th>
                      <th className="py-2 px-3 w-36">Unit Cost Price (FRW)</th>
                      <th className="py-2 px-3 w-28 text-center">Quantity</th>
                      <th className="py-2 px-3 w-36 text-right">Line Total (FRW)</th>
                      <th className="py-2 px-3 w-14 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] bg-white">
                    {purchaseItems.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-2 px-2">
                          <div className="space-y-1">
                            <select
                              value={row.productId}
                              onChange={(e) => handlePurchaseItemChange(row.id, 'productId', e.target.value)}
                              className="accounting-select w-full !h-8 !min-h-8 text-xs"
                            >
                              <option value="">-- Match Catalog Product or Enter Custom --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.stockQuantity} {p.unit} in stock)
                                </option>
                              ))}
                            </select>
                            {!row.productId && (
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) => handlePurchaseItemChange(row.id, 'name', e.target.value)}
                                placeholder="Type item description..."
                                className="accounting-input w-full !h-7 !min-h-7 text-xs"
                              />
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={row.unit || 'pcs'}
                            onChange={(e) => handlePurchaseItemChange(row.id, 'unit', e.target.value)}
                            className="accounting-select w-full !h-8 !min-h-8 text-xs font-mono"
                          >
                            {UNIT_SELECT_OPTIONS.map((u) => (
                              <option key={u.value} value={u.value}>
                                {u.label}
                              </option>
                            ))}
                            {row.unit && !UNIT_SELECT_OPTIONS.some((u) => u.value === row.unit) && (
                              <option value={row.unit}>{row.unit}</option>
                            )}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={row.unitPrice || ''}
                            onChange={(e) => handlePurchaseItemChange(row.id, 'unitPrice', Number(e.target.value))}
                            placeholder="0"
                            className="accounting-input w-full !h-8 !min-h-8 text-xs font-mono text-right"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={row.quantity || ''}
                            onChange={(e) => handlePurchaseItemChange(row.id, 'quantity', Number(e.target.value))}
                            placeholder="1"
                            className="accounting-input w-full !h-8 !min-h-8 text-xs font-mono text-center"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                          {formatRWF(Number(row.unitPrice || 0) * Number(row.quantity || 0))}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeletePurchaseRow(row.id)}
                            disabled={purchaseItems.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded transition cursor-pointer"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Description / Purchase Memo */}
            <div>
              <label className="accounting-label">Description / Intake Goods Memo</label>
              <textarea
                rows={2}
                placeholder="Log supplier delivery consignment number, warehouse shelf, or batch expiration date..."
                className="accounting-textarea w-full"
              />
            </div>

            {/* Bottom Total & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-[#e2e8f0] gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">Total Supplier Payable:</span>
                <span className="text-lg font-bold font-mono text-blue-700">{formatRWF(purchaseTotal)}</span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="submit"
                  disabled={isSubmittingPurchase}
                  className="accounting-btn-primary"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmittingPurchase ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPurchaseSupplier('');
                    setPurchaseInvoiceRef('');
                    setPurchaseItems([{ id: '1', productId: '', name: '', unit: 'pcs', unitPrice: 0, quantity: 1 }]);
                  }}
                  className="accounting-btn-secondary"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: CASH IN FORM (3-Column Accounting Grid) */}
        {/* ===================================================================== */}
        {activeTab === 'cash_in' && (
          <form onSubmit={handleRecordCashIn} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Column 1 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">
                    Source of Inflow / Fund Provider <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={cashInSource}
                    onChange={(e) => setCashInSource(e.target.value)}
                    placeholder="e.g. Bank of Kigali / Business Owner Capital"
                    required
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">
                    Inflow Amount (FRW) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cashInAmount}
                    onChange={(e) => setCashInAmount(e.target.value)}
                    placeholder="e.g. 5000000"
                    required
                    className="accounting-input w-full font-mono"
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">Reason / Capital Category</label>
                  <select
                    value={cashInReason}
                    onChange={(e) => setCashInReason(e.target.value)}
                    className="accounting-select w-full"
                  >
                    <option value="Loan received">Commercial Bank Loan Received</option>
                    <option value="Owner capital injection">Owner Equity / Capital Injection</option>
                    <option value="Grant received">Donor / Government Grant Award</option>
                    <option value="Customer advance">Customer Advance / Retainer</option>
                    <option value="Receivable collected">Accounts Receivable Settlement</option>
                    <option value="Asset disposal">Disposal of Fixed Assets</option>
                    <option value="Other inflow">Other Direct Cash Inflow</option>
                  </select>
                </div>
                <div>
                  <label className="accounting-label">
                    Transaction Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={cashInDate}
                    onChange={(e) => setCashInDate(e.target.value)}
                    required
                    className="accounting-input w-full"
                  />
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">Bank Reference / Deposit Slip</label>
                  <input
                    type="text"
                    value={cashInNotes}
                    onChange={(e) => setCashInNotes(e.target.value)}
                    placeholder="e.g. TXN-8942-019"
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Receiving Account / Drawer</label>
                  <input
                    type="text"
                    placeholder="BK Corporate / Main Cash Box"
                    className="accounting-input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Description / Ledger Memo */}
            <div>
              <label className="accounting-label">Description / Fund Allocation Notes</label>
              <textarea
                rows={2}
                value={cashInNotes}
                onChange={(e) => setCashInNotes(e.target.value)}
                placeholder="Specify credit tranche, interest rate, repayment terms, or equity agreement details..."
                className="accounting-textarea w-full"
              />
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-[#e2e8f0] gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">Total Inflow Credit:</span>
                <span className="text-lg font-bold font-mono text-emerald-700">
                  {formatRWF(Number(cashInAmount) || 0)}
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button type="submit" className="accounting-btn-primary">
                  <Check className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCashInAmount('');
                    setCashInSource('');
                    setCashInNotes('');
                  }}
                  className="accounting-btn-secondary"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: CASH OUT & EXPENSES FORM (3-Column Accounting Grid) */}
        {/* ===================================================================== */}
        {activeTab === 'cash_out' && (
          <div className="space-y-4">
            {/* Mode Switcher */}
            <div className="flex items-center gap-2 pb-2">
              <button
                type="button"
                onClick={() => setCashOutMode('single')}
                className={`text-xs font-semibold px-3 py-1 rounded-[4px] transition-colors cursor-pointer ${
                  cashOutMode === 'single'
                    ? 'bg-[#2998d6] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Single Disbursement
              </button>
              <button
                type="button"
                onClick={() => setCashOutMode('batch')}
                className={`text-xs font-semibold px-3 py-1 rounded-[4px] transition-colors cursor-pointer ${
                  cashOutMode === 'batch'
                    ? 'bg-[#2998d6] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Batch Multi-Invoice
              </button>
            </div>

            {cashOutMode === 'single' ? (
              <form onSubmit={handleRecordSingleCashOut} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  {/* Column 1 */}
                  <div className="space-y-3">
                    <div>
                      <label className="accounting-label">
                        Recipient / Expense Description <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={cashOutDescription}
                        onChange={(e) => setCashOutDescription(e.target.value)}
                        placeholder="e.g. Office Electricity Bill or BK Loan"
                        required
                        className="accounting-input w-full"
                      />
                    </div>
                    <div>
                      <label className="accounting-label">
                        Amount (FRW) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={cashOutAmount}
                        onChange={(e) => setCashOutAmount(e.target.value)}
                        placeholder="e.g. 350000"
                        required
                        className="accounting-input w-full font-mono"
                      />
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-3">
                    <div>
                      <label className="accounting-label">
                        Expense Category <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={cashOutCategory}
                        onChange={(e) => setCashOutCategory(e.target.value)}
                        className="accounting-select w-full"
                      >
                        <optgroup label="Operational Expenses">
                          <option value="Utilities">Utilities (Water, Power, Internet)</option>
                          <option value="Rent">Rent & Facility Leases</option>
                          <option value="Salaries">Staff Payroll & Direct Wages</option>
                          <option value="Repairs">Machinery Repairs & Maintenance</option>
                          <option value="Transport">Transport, Fuel & Haulage</option>
                          <option value="Marketing">Marketing, Ads & Promotions</option>
                          <option value="Taxes">Taxes, Municipal Levies & RRA</option>
                          <option value="General Expenses">General Office Operations</option>
                        </optgroup>
                        <optgroup label="Financial Outflows">
                          <option value="Loan Repayment">Bank Loan / Credit Repayment</option>
                          <option value="Supplier Settlement">Accounts Payable / Supplier Settlement</option>
                          <option value="Owner Drawing">Owner Drawing / Dividend Cashout</option>
                          <option value="Asset Purchase">Machinery / Fixed Asset Purchase</option>
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="accounting-label">
                        Payment Date <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="date"
                        value={cashOutDate}
                        onChange={(e) => setCashOutDate(e.target.value)}
                        required
                        className="accounting-input w-full"
                      />
                    </div>
                  </div>

                  {/* Column 3 */}
                  <div className="space-y-3">
                    <div>
                      <label className="accounting-label">Voucher / Receipt Reference</label>
                      <input
                        type="text"
                        value={cashOutNotes}
                        onChange={(e) => setCashOutNotes(e.target.value)}
                        placeholder="e.g. Receipt #84092"
                        className="accounting-input w-full"
                      />
                    </div>
                    <div>
                      <label className="accounting-label">Approval Authority</label>
                      <input
                        type="text"
                        placeholder={activeSme.ownerName || 'Finance Manager'}
                        className="accounting-input w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Description / Ledger Memo */}
                <div>
                  <label className="accounting-label">Description / Accounting Justification</label>
                  <textarea
                    rows={2}
                    value={cashOutNotes}
                    onChange={(e) => setCashOutNotes(e.target.value)}
                    placeholder="Log disbursement details, department charge code, or invoice approval notes..."
                    className="accounting-textarea w-full"
                  />
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-[#e2e8f0] gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Total Debit Outflow:</span>
                    <span className="text-lg font-bold font-mono text-rose-700">
                      {formatRWF(Number(cashOutAmount) || 0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button type="submit" className="accounting-btn-primary">
                      <Check className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCashOutAmount('');
                        setCashOutDescription('');
                        setCashOutNotes('');
                      }}
                      className="accounting-btn-secondary"
                    >
                      <X className="w-4 h-4" />
                      <span>Close</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Batch Invoices Mode */
              <form onSubmit={handleRecordBatchCashOut} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="accounting-label">
                      Batch Effective Date <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={cashOutDate}
                      onChange={(e) => setCashOutDate(e.target.value)}
                      required
                      className="accounting-input w-full"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-[#cbd5e1] rounded-[4px] bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f1f5f9] text-[#475569] font-bold border-b border-[#cbd5e1] text-[11px] uppercase tracking-wider">
                        <th className="py-2 px-3 w-10 text-center">#</th>
                        <th className="py-2 px-3 min-w-[200px]">Expense Description</th>
                        <th className="py-2 px-3 w-56">Category</th>
                        <th className="py-2 px-3 w-40">Payment Channel</th>
                        <th className="py-2 px-3 w-40 text-right">Amount (FRW)</th>
                        <th className="py-2 px-3 w-14 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0] bg-white">
                      {cashOutBatchLines.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={row.description}
                              onChange={(e) => handleBatchLineChange(row.id, 'description', e.target.value)}
                              placeholder="e.g. Office supplies or Internet"
                              className="accounting-input w-full !h-8 !min-h-8 text-xs"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={row.category}
                              onChange={(e) => handleBatchLineChange(row.id, 'category', e.target.value)}
                              className="accounting-select w-full !h-8 !min-h-8 text-xs"
                            >
                              <option value="Utilities">Utilities</option>
                              <option value="Rent">Rent</option>
                              <option value="Salaries">Salaries</option>
                              <option value="Repairs">Repairs</option>
                              <option value="Transport">Transport</option>
                              <option value="Marketing">Marketing</option>
                              <option value="General Expenses">General Expenses</option>
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={row.paymentMethod}
                              onChange={(e) => handleBatchLineChange(row.id, 'paymentMethod', e.target.value)}
                              className="accounting-select w-full !h-8 !min-h-8 text-xs"
                            >
                              <option value="Cash">Cash</option>
                              <option value="Mobile Money">MoMo</option>
                              <option value="Bank Transfer">Bank Wire</option>
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={row.amount || ''}
                              onChange={(e) => handleBatchLineChange(row.id, 'amount', Number(e.target.value))}
                              placeholder="0"
                              className="accounting-input w-full !h-8 !min-h-8 text-xs font-mono text-right"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteBatchLine(row.id)}
                              disabled={cashOutBatchLines.length <= 1}
                              className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleAddBatchLine}
                    className="text-xs font-semibold text-[#0284c7] hover:text-[#0369a1] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Expense Line</span>
                  </button>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-semibold mr-2">Batch Total:</span>
                    <span className="font-mono font-bold text-rose-700">{formatRWF(batchTotal)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#e2e8f0]">
                  <button type="submit" className="accounting-btn-primary">
                    <Check className="w-4 h-4" />
                    <span>Save Batch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashOutMode('single')}
                    className="accounting-btn-secondary"
                  >
                    <X className="w-4 h-4" />
                    <span>Close</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 5: OTHER ACTIVITIES FORM (3-Column Accounting Grid) */}
        {/* ===================================================================== */}
        {activeTab === 'other' && (
          <form onSubmit={handleRecordOtherActivity} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Column 1 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">
                    Activity Title / Contract Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={otherTitle}
                    onChange={(e) => setOtherTitle(e.target.value)}
                    placeholder="e.g. RDB Business Registration"
                    required
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Milestone Classification</label>
                  <input
                    type="text"
                    value={otherCategory}
                    onChange={(e) => setOtherCategory(e.target.value)}
                    placeholder="e.g. Regulatory Compliance / Asset Purchase"
                    className="accounting-input w-full"
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">Execution Status</label>
                  <select
                    value={otherStatus}
                    onChange={(e) => setOtherStatus(e.target.value as any)}
                    className="accounting-select w-full"
                  >
                    <option value="Completed">Completed / Certified</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Planned">Planned</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="accounting-label">
                    Date of Milestone <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={otherDate}
                    onChange={(e) => setOtherDate(e.target.value)}
                    required
                    className="accounting-input w-full"
                  />
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">Budget / Contract Value (FRW)</label>
                  <input
                    type="number"
                    value={otherAmount}
                    onChange={(e) => setOtherAmount(e.target.value)}
                    placeholder="e.g. 12000000"
                    className="accounting-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="accounting-label">Payment / Settlement Status</label>
                  <select
                    value={otherPaymentStatus}
                    onChange={(e) => setOtherPaymentStatus(e.target.value as any)}
                    className="accounting-select w-full"
                  >
                    <option value="Completed">Fully Paid / Cleared</option>
                    <option value="Pending">Pending Payment</option>
                    <option value="Partial">Partial Settlement</option>
                    <option value="N/A">Not Applicable</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description / Ledger Memo */}
            <div>
              <label className="accounting-label">Description / Activity Deliverables</label>
              <textarea
                rows={2}
                value={otherDescription}
                onChange={(e) => setOtherDescription(e.target.value)}
                placeholder="Log contract milestones, terms of engagement, or compliance documentation..."
                className="accounting-textarea w-full"
              />
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-[#e2e8f0] gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">Contract Valuation:</span>
                <span className="text-lg font-bold font-mono text-purple-700">
                  {formatRWF(Number(otherAmount) || 0)}
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button type="submit" className="accounting-btn-primary">
                  <Check className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtherTitle('');
                    setOtherDescription('');
                    setOtherAmount('');
                  }}
                  className="accounting-btn-secondary"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </form>
        )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* UNIFIED ACTIVITIES HISTORY LEDGER */}
      {/* ========================================================================= */}
      {showLedgerView && (
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
      )}

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

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatRWF, ProductItem, Sale } from '../lib/mockData';
import { Button } from '../assets/components/ui/button';
import { Card, CardContent } from '../assets/components/ui/card';
import { Input } from '../assets/components/ui/input';
import CreateProductModal from '../assets/components/CreateProductModal';
import EditProductModal from '../assets/components/EditProductModal';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
  FileText,
  User,
  Package,
  ArrowRight,
  Printer
} from 'lucide-react';

export default function Sales() {
  const {
    activeSme,
    products,
    createProduct,
    updateProduct,
    deleteProduct,
    recordSaleTransaction,
    deleteSale,
    refreshSales,
    refreshProducts
  } = useApp();

  // Tab State: 'record' | 'ledger' | 'products'
  const [activeTab, setActiveTab] = useState<'record' | 'ledger' | 'products'>('record');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Sales Form State
  const [customer, setCustomer] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [items, setItems] = useState([
    { id: '1', productId: '', product: '', unit: 'pcs', price: 0, quantity: 1, availableStock: 0 }
  ]);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    refreshSales();
    refreshProducts();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), productId: '', product: '', unit: 'pcs', price: 0, quantity: 1, availableStock: 0 }
    ]);
  };

  const handleDeleteRow = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => {
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

  const overallTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim()) {
      alert('Please specify the buyer / client name.');
      return;
    }

    const validItems = items.filter(item => (item.product || item.productId) && item.quantity > 0 && item.price >= 0);
    if (validItems.length === 0) {
      alert('Please add at least one valid product line.');
      return;
    }

    try {
      setIsSubmittingSale(true);
      await recordSaleTransaction({
        customer: customer.trim(),
        customerContact: customerContact.trim() || undefined,
        paymentStatus: 'Completed',
        paymentMethod,
        items: validItems.map(item => ({
          productId: item.productId || undefined,
          productName: item.product,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.price
        }))
      });

      showToast(`Sale of ${formatRWF(overallTotal)} to ${customer} recorded successfully!`);

      // Reset form
      setCustomer('');
      setCustomerContact('');
      setPaymentMethod('Cash');
      setItems([
        { id: '1', productId: '', product: '', unit: 'pcs', price: 0, quantity: 1, availableStock: 0 }
      ]);
      setActiveTab('ledger');
    } catch (err: any) {
      alert(err.message || 'Failed to record sale.');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  const salesList = activeSme.sales || [];

  const filteredSales = salesList.filter(sale => {
    const matchesSearch = (sale.product || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sale.customer || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || sale.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalSalesCount = salesList.length;
  const totalRevenue = salesList.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const averageSale = totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0;
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const todaySalesCount = salesList.filter(sale => sale.date && sale.date.includes(todayStr)).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Processing': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Cancelled': return 'bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
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

      {/* Header & Top Action Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-heading">
                Sales Transactions & Invoicing Ledger
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Record buyer sales selecting from created products (<span className="font-semibold text-emerald-700">kgs, meters, m², L, dozen</span>) with immutable historical snapshot preservation for <span className="text-emerald-600 font-bold">{activeSme.name}</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Product</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-slate-100 shadow-sm hover:shadow transition rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-heading">Invoices Raised</span>
              <span className="text-2xl font-bold text-slate-800 mt-1 block font-mono">{totalSalesCount}</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-100 shadow-sm hover:shadow transition rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-heading">Gross Revenue</span>
              <span className="text-lg font-bold text-emerald-600 mt-1 block font-mono" title={formatRWF(totalRevenue)}>
                {formatRWF(totalRevenue)}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-100 shadow-sm hover:shadow transition rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-heading">Average Ticket Size</span>
              <span className="text-lg font-bold text-slate-800 mt-1 block font-mono" title={formatRWF(averageSale)}>
                {formatRWF(averageSale)}
              </span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-100 shadow-sm hover:shadow transition rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-heading">Today's Transactions</span>
              <span className="text-2xl font-bold text-slate-800 mt-1 block font-mono">{todaySalesCount}</span>
            </div>
            <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs at Top */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-2xl">
        <button
          onClick={() => setActiveTab('record')}
          className={`py-3.5 px-5 font-bold text-xs flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'record'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Record New Sale</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`py-3.5 px-5 font-bold text-xs flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'ledger'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Sales Invoices Ledger ({salesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`py-3.5 px-5 font-bold text-xs flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'products'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products Catalog ({products.length})</span>
        </button>
      </div>

      {/* TAB 1: RECORD NEW SALE */}
      {activeTab === 'record' && (
        <Card className="bg-white border border-slate-100 shadow-md rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-heading">
                  Record Buyer Sales Invoice
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select products from the catalog, specify quantities, and automatically credit accounts
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Overall Invoice Total</span>
                <span className="text-xl font-bold text-emerald-600 font-mono">{formatRWF(overallTotal)}</span>
              </div>
            </div>

            <form onSubmit={handleRecordSale} className="space-y-4 text-xs">
              {/* Buyer / Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Buyer / Client Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    placeholder="e.g. Marie Claire Retailer, Gasabo Cooperative"
                    className="border-slate-200 h-9 rounded-xl font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Buyer Contact / Phone
                  </label>
                  <Input
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    placeholder="e.g. +250 788 123 456 (optional)"
                    className="border-slate-200 h-9 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none h-9 font-medium"
                  >
                    <option value="Cash">Cash on Delivery</option>
                    <option value="Mobile Money (MoMo)">Mobile Money (MoMo)</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit / Receivable">Credit / 30-Day Terms</option>
                  </select>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3 text-[10px] w-10 text-center uppercase">#</th>
                      <th className="py-2.5 px-3 text-[10px] uppercase">Select Product</th>
                      <th className="py-2.5 px-3 text-[10px] w-24 uppercase">Unit</th>
                      <th className="py-2.5 px-3 text-[10px] w-32 uppercase">Unit Price (RWF)</th>
                      <th className="py-2.5 px-3 text-[10px] w-28 uppercase">Quantity</th>
                      <th className="py-2.5 px-3 text-[10px] w-36 uppercase">Subtotal</th>
                      <th className="py-2.5 px-3 text-[10px] w-12 text-center uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">{index + 1}</td>
                        <td className="py-2.5 px-2">
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(item.id, 'productId', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none h-8 font-medium"
                            required
                          >
                            <option value="">Select from catalog...</option>
                            {products.map(prod => (
                              <option key={prod.id} value={prod.id}>
                                {prod.name} ({formatRWF(prod.unitPrice)} / {prod.unit}) — Stock: {prod.stockQuantity} {prod.unit}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-800 font-mono font-bold rounded text-[11px] border border-emerald-100">
                            {item.unit || 'pcs'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <Input
                            type="number"
                            min="0"
                            value={item.price || ''}
                            onChange={(e) => handleItemChange(item.id, 'price', Number(e.target.value))}
                            placeholder="Price"
                            className="border-slate-200 h-8 text-xs font-mono w-full font-bold text-slate-800"
                            required
                          />
                        </td>
                        <td className="py-2.5 px-2">
                          <Input
                            type="number"
                            step="any"
                            min="0.1"
                            value={item.quantity || ''}
                            onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                            placeholder="Qty"
                            className="border-slate-200 h-8 text-xs font-mono w-full"
                            required
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                          {formatRWF(item.price * item.quantity)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(item.id)}
                            disabled={items.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddItem}
                  className="text-xs h-8 px-3 rounded-lg border-slate-200"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Line Item
                </Button>

                <div className="flex items-center space-x-3">
                  <Button
                    type="submit"
                    disabled={isSubmittingSale}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-6 rounded-xl shadow-md shadow-emerald-600/20"
                  >
                    {isSubmittingSale ? 'Recording...' : 'Record & Issue Invoice'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: SALES INVOICES LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by customer name, product description, or invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="relative w-full sm:w-44">
                <Filter className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
                >
                  <option value="All">All Invoices</option>
                  <option value="Completed">Completed</option>
                  <option value="Processing">Processing</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Sales Ledger Table */}
          <Card className="bg-white border border-slate-100 shadow-sm overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Date & Customer</th>
                    <th className="py-3.5 px-3 font-semibold">Product Description (Snapshot)</th>
                    <th className="py-3.5 px-3 font-semibold">Quantity & Unit</th>
                    <th className="py-3.5 px-3 font-semibold">Unit Price</th>
                    <th className="py-3.5 px-3 font-semibold">Total Amount</th>
                    <th className="py-3.5 px-3 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((sale, index) => (
                    <motion.tr
                      key={sale.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.12, delay: index * 0.02 }}
                      className="hover:bg-slate-50/50 transition"
                    >
                      <td className="py-3.5 px-4">
                        <span className="block font-bold text-slate-800 font-heading text-sm">{sale.customer}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{sale.date}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-800">{sale.product}</span>
                        {sale.items && sale.items.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
                            {sale.items.map((it, idx) => (
                              <div key={idx}>
                                • {it.productName} ({it.quantity} {it.unit} @ {formatRWF(it.unitPrice)})
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-800 font-mono">{sale.quantity}</span>
                        <span className="text-slate-500 ml-1 font-medium text-[11px]">{sale.unit || 'pcs'}</span>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-600 font-mono">
                        {formatRWF(sale.price)}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-emerald-700 font-mono text-sm">
                        {formatRWF(sale.total)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusColor(sale.status)}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to cancel / reverse sale to ${sale.customer}?`)) {
                              deleteSale(activeSme.id, sale.id);
                              showToast(`Sale to ${sale.customer} was reversed.`);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Reverse Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSales.length === 0 && (
              <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-slate-300" />
                <p className="font-semibold text-slate-600">No recorded sales transactions found</p>
                <Button
                  onClick={() => setActiveTab('record')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Record First Sale
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: PRODUCTS CATALOG (WITH EDIT & DELETE) */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <Card className="bg-white border border-slate-100 shadow-sm overflow-hidden rounded-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm font-heading">Master Products Catalog</h3>
                <p className="text-xs text-slate-400">Edits or deletions here will not alter historical sales records</p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-4 rounded-xl"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Product
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-3">Unit</th>
                    <th className="py-3 px-3">Unit Price</th>
                    <th className="py-3 px-3">Stock Balance</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block text-sm">{p.name}</span>
                        <span className="text-[10px] text-slate-400">{p.category}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-mono font-bold rounded text-[11px]">
                          {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800 font-mono">{formatRWF(p.unitPrice)}</td>
                      <td className="py-3 px-3 font-bold font-mono">{p.stockQuantity} {p.unit}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Delete "${p.name}"? Past sales will keep copied details.`)) {
                                await deleteProduct(p.id);
                                showToast(`Product "${p.name}" deleted.`);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Modals */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (data) => {
          await createProduct(data);
          showToast(`Product "${data.name}" registered successfully!`);
        }}
      />

      <EditProductModal
        isOpen={Boolean(editingProduct)}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSubmit={async (id, data) => {
          await updateProduct(id, data);
          showToast(`Product "${data.name || editingProduct?.name}" updated successfully!`);
        }}
      />
    </div>
  );
}
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatRWF, ProductItem } from '../lib/mockData';
import { Button } from '../assets/components/ui/button';
import { Card, CardContent } from '../assets/components/ui/card';
import { Input } from '../assets/components/ui/input';
import CreateProductModal from '../assets/components/CreateProductModal';
import EditProductModal from '../assets/components/EditProductModal';
import {
  Package,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Info,
  Scale,
  DollarSign,
  Layers,
  ArrowDownLeft,
  CheckCircle,
  Truck
} from 'lucide-react';

export default function Inventory() {
  const {
    activeSme,
    products,
    createProduct,
    updateProduct,
    deleteProduct,
    recordStockIntake,
    refreshProducts
  } = useApp();

  // Tab State: 'products' | 'intake' | 'alerts'
  const [activeTab, setActiveTab] = useState<'products' | 'intake' | 'alerts'>('products');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Stock Intake Form State
  const [supplier, setSupplier] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [intakeItems, setIntakeItems] = useState([
    { id: '1', productId: '', name: '', unit: 'pcs', unitPrice: 0, quantity: 0 },
    { id: '2', productId: '', name: '', unit: 'pcs', unitPrice: 0, quantity: 0 }
  ]);
  const [isSubmittingIntake, setIsSubmittingIntake] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    refreshProducts();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddIntakeRow = () => {
    setIntakeItems(prev => [
      ...prev,
      { id: Date.now().toString(), productId: '', name: '', unit: 'pcs', unitPrice: 0, quantity: 0 }
    ]);
  };

  const handleDeleteIntakeRow = (id: string) => {
    if (intakeItems.length <= 1) return;
    setIntakeItems(prev => prev.filter(item => item.id !== id));
  };

  const handleIntakeItemChange = (id: string, field: string, value: any) => {
    setIntakeItems(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'productId') {
          const selectedProd = products.find(p => p.id === value);
          if (selectedProd) {
            return {
              ...item,
              productId: value,
              name: selectedProd.name,
              unit: selectedProd.unit,
              unitPrice: selectedProd.costPrice || selectedProd.unitPrice
            };
          }
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const intakeOverallTotal = intakeItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  const handleRecordIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

    const validItems = intakeItems.filter(item => (item.name || item.productId) && item.quantity > 0);
    if (validItems.length === 0) return;

    try {
      setIsSubmittingIntake(true);
      await recordStockIntake(
        supplier,
        validItems.map(item => ({
          productId: item.productId || undefined,
          productName: item.name,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        invoiceRef ? `Invoice: ${invoiceRef}` : undefined
      );

      showToast(`Successfully registered stock intake of ${validItems.length} product(s) from ${supplier}`);

      // Reset form
      setSupplier('');
      setInvoiceRef('');
      setIntakeItems([
        { id: '1', productId: '', name: '', unit: 'pcs', unitPrice: 0, quantity: 0 },
        { id: '2', productId: '', name: '', unit: 'pcs', unitPrice: 0, quantity: 0 }
      ]);
    } catch (err: any) {
      alert(err.message || 'Failed to record intake');
    } finally {
      setIsSubmittingIntake(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from master products? Historical sales and purchase records will preserve their original copied snapshots.`)) {
      await deleteProduct(id);
      showToast(`Product "${name}" was removed.`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Low Stock': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Out of Stock': return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'Overstock': return 'bg-blue-50 text-blue-700 border border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate statistics
  const totalSKUs = products.length;
  const inStockCount = products.filter(p => p.status === 'In Stock').length;
  const lowStockCount = products.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock').length;
  const totalStockValuation = products.reduce((sum, p) => sum + (p.stockQuantity * p.unitPrice), 0);
  const totalCostValuation = products.reduce((sum, p) => sum + (p.stockQuantity * (p.costPrice || p.unitPrice * 0.75)), 0);

  // Categories list
  const allCategories = Array.from(new Set(products.map(p => p.category || 'General Merchandise')));

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

      {/* Header & Top Action Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-heading">
                Inventory & Products Catalog
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage master products with measurement units (<span className="font-semibold text-emerald-700">kgs, meters, m², L, dozen</span>), stock balances & intakes for <span className="text-emerald-600 font-bold">{activeSme.name}</span>.
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
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-heading">Master Catalog SKUs</span>
              <span className="text-2xl font-bold text-slate-800 mt-1 block font-mono">{totalSKUs}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{inStockCount} currently available</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-100 shadow-sm hover:shadow transition rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-heading">Total Stock Value</span>
              <span className="text-lg font-bold text-emerald-600 mt-1 block font-mono" title={formatRWF(totalStockValuation)}>
                {formatRWF(totalStockValuation)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Estimated Selling Potential</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-100 shadow-sm hover:shadow transition rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-heading">Invested Capital</span>
              <span className="text-lg font-bold text-slate-800 mt-1 block font-mono" title={formatRWF(totalCostValuation)}>
                {formatRWF(totalCostValuation)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Cost Price Basis</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-100 shadow-sm hover:shadow transition rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-heading">Low Stock Warnings</span>
              <span className={`text-2xl font-bold mt-1 block font-mono ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                {lowStockCount}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Need supplier reorder</span>
            </div>
            <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs at Top */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-2xl">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3.5 px-5 font-bold text-xs flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'products'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Master Products List ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('intake')}
          className={`py-3.5 px-5 font-bold text-xs flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'intake'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Stock Intake & Restock</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`py-3.5 px-5 font-bold text-xs flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'alerts'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Stock Health & Alerts ({lowStockCount})</span>
        </button>
      </div>

      {/* TAB 1: MASTER PRODUCTS LIST */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl">
            <CardContent className="p-4 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products by name, unit, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <div className="relative w-44">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
                  >
                    <option value="All">All Categories</option>
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="relative w-36">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
                  >
                    <option value="All">All Statuses</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Master Products Table */}
          <Card className="bg-white border border-slate-100 shadow-sm overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Product & Category</th>
                    <th className="py-3.5 px-3 font-semibold">Unit</th>
                    <th className="py-3.5 px-3 font-semibold">Selling Price</th>
                    <th className="py-3.5 px-3 font-semibold">Cost Price</th>
                    <th className="py-3.5 px-3 font-semibold">Current Stock</th>
                    <th className="py-3.5 px-3 font-semibold">Total Stock Value</th>
                    <th className="py-3.5 px-3 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((prod, index) => (
                    <motion.tr
                      key={prod.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.12, delay: index * 0.02 }}
                      className="hover:bg-slate-50/50 transition"
                    >
                      <td className="py-3.5 px-4">
                        <span className="block font-bold text-slate-800 font-heading text-sm">{prod.name}</span>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="inline-block text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                            {prod.category || 'General'}
                          </span>
                          {prod.description && (
                            <span className="text-[10px] text-slate-400 truncate max-w-xs" title={prod.description}>
                              {prod.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-mono font-bold text-[11px] border border-emerald-100">
                          {prod.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-800 font-mono">
                        {formatRWF(prod.unitPrice)} <span className="text-[10px] text-slate-400 font-normal">/{prod.unit}</span>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-500 font-mono">
                        {prod.costPrice ? formatRWF(prod.costPrice) : '—'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 font-mono text-sm">
                          {prod.stockQuantity}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium ml-1">{prod.unit}</span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-emerald-700 font-mono">
                        {formatRWF(prod.stockQuantity * prod.unitPrice)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusColor(prod.status)}`}>
                          {prod.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setEditingProduct(prod)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Product Master"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-3">
                <Package className="w-10 h-10 text-slate-300" />
                <p className="font-semibold text-slate-600">No products found matching your search</p>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add New Product
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: STOCK INTAKE & SUPPLIER BATCHES */}
      {activeTab === 'intake' && (
        <div className="space-y-4">
          <Card className="bg-white border border-slate-100 shadow-md rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-heading">
                    Register Stock Intake & Supplier Delivery
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Increments master inventory stock quantity and preserves copied snapshot records
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Intake Cost</span>
                  <span className="text-lg font-bold text-emerald-600 font-mono">{formatRWF(intakeOverallTotal)}</span>
                </div>
              </div>

              <form onSubmit={handleRecordIntake} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Supplier / Cooperative Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      placeholder="e.g. Kigali Wholesale Agro Ltd"
                      className="border-slate-200 h-9 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Delivery Note / Invoice Reference
                    </label>
                    <Input
                      value={invoiceRef}
                      onChange={(e) => setInvoiceRef(e.target.value)}
                      placeholder="e.g. DN-2026-8842 (optional)"
                      className="border-slate-200 h-9 rounded-xl"
                    />
                  </div>
                </div>

                {/* Line items table */}
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3 text-[10px] w-10 text-center uppercase">#</th>
                        <th className="py-2.5 px-3 text-[10px] uppercase">Select Master Product</th>
                        <th className="py-2.5 px-3 text-[10px] w-28 uppercase">Unit</th>
                        <th className="py-2.5 px-3 text-[10px] w-32 uppercase">Unit Cost (RWF)</th>
                        <th className="py-2.5 px-3 text-[10px] w-28 uppercase">Quantity</th>
                        <th className="py-2.5 px-3 text-[10px] w-36 uppercase">Subtotal</th>
                        <th className="py-2.5 px-3 text-[10px] w-12 text-center uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {intakeItems.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">{index + 1}</td>
                          <td className="py-2.5 px-2">
                            <select
                              value={item.productId}
                              onChange={(e) => handleIntakeItemChange(item.id, 'productId', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none h-8 font-medium"
                              required
                            >
                              <option value="">Select from master catalog...</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.unit}) — Current: {p.stockQuantity} {p.unit}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 font-mono font-bold rounded text-[11px]">
                              {item.unit || 'pcs'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            <Input
                              type="number"
                              min="0"
                              value={item.unitPrice || ''}
                              onChange={(e) => handleIntakeItemChange(item.id, 'unitPrice', Number(e.target.value))}
                              placeholder="Cost"
                              className="border-slate-200 h-8 text-xs font-mono w-full"
                              required
                            />
                          </td>
                          <td className="py-2.5 px-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity || ''}
                              onChange={(e) => handleIntakeItemChange(item.id, 'quantity', Number(e.target.value))}
                              placeholder="Qty"
                              className="border-slate-200 h-8 text-xs font-mono w-full"
                              required
                            />
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                            {formatRWF(item.unitPrice * item.quantity)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteIntakeRow(item.id)}
                              disabled={intakeItems.length <= 1}
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

                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddIntakeRow}
                    className="text-xs h-8 px-3 rounded-lg border-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Another Line
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmittingIntake}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-6 rounded-xl shadow-md shadow-emerald-600/20"
                  >
                    {isSubmittingIntake ? 'Recording Stock...' : 'Record Intake & Update Stock'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: STOCK HEALTH & ALERTS */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products
              .filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock')
              .map(p => (
                <Card key={p.id} className="bg-amber-50/50 border border-amber-200 shadow-sm rounded-2xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 font-heading text-sm">{p.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Current Balance: <span className="font-bold text-amber-700 font-mono">{p.stockQuantity} {p.unit}</span> (Reorder threshold: {p.reorderLevel || 10} {p.unit})
                        </p>
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(p.status)}`}>
                          {p.status}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        setActiveTab('intake');
                        setIntakeItems([
                          { id: '1', productId: p.id, name: p.name, unit: p.unit, unitPrice: p.costPrice || p.unitPrice, quantity: 20 }
                        ]);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 px-3 rounded-lg"
                    >
                      Restock Item
                    </Button>
                  </div>
                </Card>
              ))}
          </div>

          {lowStockCount === 0 && (
            <Card className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-12 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-emerald-900 font-heading text-base">All Stock Levels Healthy</h4>
              <p className="text-xs text-emerald-700 mt-1">
                All {totalSKUs} products have sufficient inventory above their reorder points.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (data) => {
          await createProduct(data);
          showToast(`Product "${data.name}" registered successfully with unit (${data.unit})!`);
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
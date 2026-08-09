import { motion } from 'framer-motion';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import { Button } from '../assets/components/ui/button';
import { Card, CardContent } from '../assets/components/ui/card';
import { Input } from '../assets/components/ui/input';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Calendar,
  Info
} from 'lucide-react';

export default function Sales() {
  const { activeSme, addSale, deleteSale } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState([
    { id: '1', product: '', price: 0, quantity: 0 },
    { id: '2', product: '', price: 0, quantity: 0 }
  ]);

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), product: '', price: 0, quantity: 0 }
    ]);
  };

  const handleDeleteRow = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const overallTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Processing': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Cancelled': return 'bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const handleRecordSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    // Filter out rows that are empty
    const validItems = items.filter(item => item.product && item.price > 0 && item.quantity > 0);
    if (validItems.length === 0) return;

    validItems.forEach(item => {
      addSale(
        activeSme.id,
        item.product,
        item.quantity,
        item.price,
        customer
      );
    });

    // Reset Form
    setCustomer('');
    setItems([
      { id: '1', product: '', price: 0, quantity: 0 },
      { id: '2', product: '', price: 0, quantity: 0 }
    ]);
  };

  const salesList = activeSme.sales || [];
  const inventoryList = activeSme.inventoryItems || [];

  const filteredSales = salesList.filter(sale => {
    const matchesSearch = (sale.product || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sale.customer || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || sale.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalSales = salesList.length;
  const totalRevenue = salesList.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const averageSale = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;
  const todaySalesCount = salesList.filter(sale => sale.date && sale.date.includes('Jun 22')).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-805 font-heading">Sales Transactions Ledger</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Log invoice sales, record buyer profiles, and update cash accounts for <span className="text-emerald-655 font-bold">{activeSme.name}</span>.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Invoices Raised</span>
              <span className="text-xl font-bold text-slate-800 mt-1 block font-mono">{totalSales}</span>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-650 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Gross Invoice Revenue</span>
              <span className="text-sm font-bold text-emerald-600 mt-1.5 block truncate max-w-[130px] font-mono" title={formatRWF(totalRevenue)}>
                {formatRWF(totalRevenue)}
              </span>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Average Transaction Size</span>
              <span className="text-sm font-bold text-slate-850 mt-1.5 block truncate max-w-[130px] font-mono" title={formatRWF(averageSale)}>
                {formatRWF(averageSale)}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-650 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Today's Transactions</span>
              <span className="text-xl font-bold text-slate-800 mt-1 block font-mono">{todaySalesCount}</span>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Sale Form */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <Card className="bg-white border border-gray-100 shadow-md">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-slate-850 mb-4 pb-2 border-b border-gray-100">
              Log New Sales Invoice (Batch Transactions)
            </h3>
            <form onSubmit={handleRecordSale} className="space-y-4 text-xs">
              {/* Invoice Header details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 font-semibold mb-1">Customer / Cooperative</label>
                  <Input
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    placeholder="e.g. Nyarugenge Bakery"
                    className="border-gray-200 h-9"
                    required
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border-y border-gray-100 text-left">
                  <thead>
                    <tr className="bg-slate-50 text-gray-500 font-bold border-b border-gray-150">
                      <th className="py-2.5 px-3 text-[10px] w-12 text-center uppercase tracking-wider font-semibold">No.</th>
                      <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">Product Description</th>
                      <th className="py-2.5 px-3 text-[10px] w-36 uppercase tracking-wider font-semibold">Unit Price (RWF)</th>
                      <th className="py-2.5 px-3 text-[10px] w-28 uppercase tracking-wider font-semibold">Quantity</th>
                      <th className="py-2.5 px-3 text-[10px] w-36 uppercase tracking-wider font-semibold">Total (RWF)</th>
                      <th className="py-2.5 px-3 text-[10px] w-16 text-center uppercase tracking-wider font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/40">
                        <td className="py-2 px-3 text-center font-mono font-bold text-gray-400">{index + 1}</td>
                        <td className="py-2 px-2">
                          <select
                            value={item.product}
                            onChange={(e) => {
                              const selectedItem = inventoryList.find(i => i.name === e.target.value);
                              handleItemChange(item.id, 'product', e.target.value);
                              handleItemChange(item.id, 'price', selectedItem ? selectedItem.unitPrice : 0);
                            }}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700 h-8"
                            required
                          >
                            <option value="">Select a product...</option>
                            {inventoryList.map(inventoryItem => (
                              <option key={inventoryItem.id} value={inventoryItem.name}>
                                {inventoryItem.name} ({formatRWF(inventoryItem.unitPrice)})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            value={item.price || ''}
                            onChange={(e) => handleItemChange(item.id, 'price', Math.max(0, Number(e.target.value)))}
                            placeholder="Price"
                            className="border-gray-200 h-8 text-xs font-mono w-full"
                            required
                            min="1"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) => handleItemChange(item.id, 'quantity', Math.max(0, Number(e.target.value)))}
                            placeholder="Qty"
                            className="border-gray-200 h-8 text-xs font-mono w-full"
                            required
                            min="1"
                          />
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-700 align-middle">
                          {formatRWF(item.price * item.quantity)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(item.id)}
                            disabled={items.length <= 1}
                            className="p-1 text-gray-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-gray-400 rounded transition"
                            title="Delete Line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Control Panel */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 gap-3">
                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center space-x-1.5 h-8 px-3 font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </Button>
                
                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Overall Invoice Total</span>
                    <span className="text-base font-bold text-emerald-600 font-mono">{formatRWF(overallTotal)}</span>
                  </div>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-5 font-bold text-xs shadow">
                    Record & Credit Accounts
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sales transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
            >
              <option value="All">All Invoices</option>
              <option value="Completed">Completed</option>
              <option value="Processing">Processing</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 pb-2">
          <h3 className="text-base font-bold text-slate-800">Invoice Ledger Journal</h3>
        </div>

        <div className="overflow-x-auto px-6">
          <table className="w-full text-left border-collapse text-xs mt-3">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="pb-3 font-semibold">Invoice Product</th>
                <th className="pb-3 font-semibold">Buyer / Client</th>
                <th className="pb-3 font-semibold">Qty</th>
                <th className="pb-3 font-semibold">Unit Price</th>
                <th className="pb-3 font-semibold">Total Revenue</th>
                <th className="pb-3 font-semibold">Invoice Date</th>
                <th className="pb-3 font-semibold">Receipt Status</th>
                <th className="pb-3 font-semibold text-right">Reversal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSales.map((sale, index) => (
                <motion.tr
                  key={sale.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                  className="hover:bg-gray-50/50 transition"
                >
                  <td className="py-3.5 pr-2">
                    <span className="block font-bold text-slate-850 font-heading">{sale.product}</span>
                    <span className="text-[10px] text-gray-400 font-mono">ID: {sale.id}</span>
                  </td>
                  <td className="py-3.5 text-slate-705 font-medium">{sale.customer}</td>
                  <td className="py-3.5 font-bold text-slate-800 font-mono">{sale.quantity}</td>
                  <td className="py-3.5 font-semibold text-slate-700 font-mono">{formatRWF(sale.price)}</td>
                  <td className="py-3.5 font-extrabold text-emerald-600 font-mono">{formatRWF(sale.total)}</td>
                  <td className="py-3.5 text-gray-500 font-medium font-mono">{sale.date}</td>
                  <td className="py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[9px] ${getStatusColor(sale.status)}`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => deleteSale(activeSme.id, sale.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Cancel & Reverse Transaction"
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
          <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center space-y-2">
            <Info className="w-8 h-8 text-gray-300" />
            <span>No sales invoices logged matching the search queries.</span>
          </div>
        )}
      </Card>
    </div>
  );
}
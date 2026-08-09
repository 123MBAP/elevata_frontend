import { motion } from 'framer-motion';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import { Button } from '../assets/components/ui/button';
import { Card, CardContent } from '../assets/components/ui/card';
import { Input } from '../assets/components/ui/input';
import {
  Package,
  Plus,
  Trash2,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react';

export default function Inventory() {
  const { activeSme, addInventoryItem, deleteInventoryItem } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  
  const [supplier, setSupplier] = useState('');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState([
    { id: '1', name: '', price: 0, quantity: 0 },
    { id: '2', name: '', price: 0, quantity: 0 }
  ]);

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', price: 0, quantity: 0 }
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
      case 'In Stock': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'Low Stock': return 'bg-amber-50 text-amber-700 border border-emerald-100';
      case 'Out of Stock': return 'bg-rose-50 text-rose-700 border border-rose-100';
      case 'Overstock': return 'bg-slate-50 text-slate-700 border border-slate-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

    // Filter out rows that are empty
    const validItems = items.filter(item => item.name && item.price > 0 && item.quantity > 0);
    if (validItems.length === 0) return;

    validItems.forEach(item => {
      addInventoryItem(
        activeSme.id,
        item.name,
        category || 'General',
        item.quantity,
        item.price,
        supplier
      );
    });

    // Reset form
    setSupplier('');
    setCategory('');
    setItems([
      { id: '1', name: '', price: 0, quantity: 0 },
      { id: '2', name: '', price: 0, quantity: 0 }
    ]);
  };

  const filteredItems = activeSme.inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalItems = activeSme.inventoryItems.length;
  const inStock = activeSme.inventoryItems.filter(item => item.status === 'In Stock').length;
  const lowStock = activeSme.inventoryItems.filter(item => item.status === 'Low Stock').length;
  const outOfStock = activeSme.inventoryItems.filter(item => item.status === 'Out of Stock').length;
  const totalValue = activeSme.inventoryItems.reduce((sum, item) => sum + (item.stockLevel * item.unitPrice), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-heading">Inventory Catalog Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor stock levels, reorder alerts, and track stock value for <span className="text-emerald-600 font-bold">{activeSme.name}</span>.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Total SKUs</span>
              <span className="text-xl font-bold text-slate-850 mt-1 block font-mono">{totalItems}</span>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">In Stock</span>
              <span className="text-xl font-bold text-emerald-600 mt-1 block font-mono">{inStock}</span>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Low Stock Alerts</span>
              <span className="text-xl font-bold text-amber-600 mt-1 block font-mono">{lowStock}</span>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Out of Stock</span>
              <span className="text-xl font-bold text-rose-600 mt-1 block font-mono">{outOfStock}</span>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Total Capital Tied</span>
              <span className="text-sm font-bold text-slate-800 mt-1.5 block truncate max-w-[130px] font-mono" title={formatRWF(totalValue)}>
                {formatRWF(totalValue)}
              </span>
            </div>
            <div className="p-2.5 bg-slate-550/10 text-slate-600 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Product Form */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <Card className="bg-white border border-gray-100 shadow-md">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-slate-850 mb-4 pb-2 border-b border-gray-100">
              Register New Stock Invoice (Batch Intake)
            </h3>
            <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
              {/* Invoice Header details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 font-semibold mb-1">Supplier Corp</label>
                  <Input
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="e.g. Kigali Wholesale Ltd"
                    className="border-gray-200 h-9"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-500 font-semibold mb-1">Category (Applies to Batch)</label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Foodstuff / Spares"
                    className="border-gray-200 h-9"
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
                      <th className="py-2.5 px-3 text-[10px] w-36 uppercase tracking-wider font-semibold">Unit Cost (FRW)</th>
                      <th className="py-2.5 px-3 text-[10px] w-28 uppercase tracking-wider font-semibold">Quantity</th>
                      <th className="py-2.5 px-3 text-[10px] w-36 uppercase tracking-wider font-semibold">Total (FRW)</th>
                      <th className="py-2.5 px-3 text-[10px] w-16 text-center uppercase tracking-wider font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/40">
                        <td className="py-2 px-3 text-center font-mono font-bold text-gray-400">{index + 1}</td>
                        <td className="py-2 px-2">
                          <Input
                            value={item.name}
                            onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                            placeholder="e.g. Basmati Rice (25kg)"
                            className="border-gray-200 h-8 text-xs w-full"
                            required
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            value={item.price || ''}
                            onChange={(e) => handleItemChange(item.id, 'price', Math.max(0, Number(e.target.value)))}
                            placeholder="Unit cost"
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
                    Record 
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Controls: Search and Filter */}
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search active stock item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Overstock">Overstock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 pb-2">
          <h3 className="text-base font-bold text-slate-800">Current Stock Inventory</h3>
        </div>

        <div className="overflow-x-auto px-6">
          <table className="w-full text-left border-collapse text-xs mt-3">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="pb-3 font-semibold">Stock Item</th>
                <th className="pb-3 font-semibold">Unit Price</th>
                <th className="pb-3 font-semibold">Stock Level</th>
                <th className="pb-3 font-semibold">Total Capital Value</th>
                <th className="pb-3 font-semibold">Runway Status</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredItems.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                  className="hover:bg-gray-50/50 transition"
                >
                  <td className="py-3.5 pr-2">
                    <span className="block font-bold text-slate-800 font-heading">{item.name}</span>
                    <span className="text-[10px] text-gray-400">Supplier: {item.supplier || 'N/A'}</span>
                  </td>
                  <td className="py-3.5 font-medium text-slate-750 font-mono">{formatRWF(item.unitPrice)}</td>
                  <td className="py-3.5 font-bold text-slate-800 font-mono">{item.stockLevel}</td>
                  <td className="py-3.5 font-bold text-slate-900 font-mono">{formatRWF(item.stockLevel * item.unitPrice)}</td>
                  <td className="py-3.5">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[9px] ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">({item.daysRemaining} days left)</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => deleteInventoryItem(activeSme.id, item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Stock Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center space-y-2">
            <Info className="w-8 h-8 text-gray-300" />
            <span>No matching inventory items found for the selected filter.</span>
          </div>
        )}
      </Card>
    </div>
  );
}
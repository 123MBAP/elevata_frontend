import { motion } from 'framer-motion';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import { Button } from '../assets/components/ui/button';
import { Card, CardContent } from '../assets/components/ui/card';
import { Input } from '../assets/components/ui/input';
import {
  Plus,
  Trash2,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Wrench,
  Info
} from 'lucide-react';

export default function Expenses() {
  const { activeSme, addExpense, deleteExpense } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Batch line items state
  const [items, setItems] = useState([
    { id: '1', description: '', category: 'Utilities', amount: 0 },
    { id: '2', description: '', category: 'Rent', amount: 0 }
  ]);

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), description: '', category: 'Utilities', amount: 0 }
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

  const overallTotal = items.reduce((sum, item) => sum + item.amount, 0);

  const handleRecordExpenses = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out rows that are empty
    const validItems = items.filter(item => item.description && item.amount > 0);
    if (validItems.length === 0) return;

    validItems.forEach(item => {
      addExpense(
        activeSme.id,
        item.description,
        item.category,
        item.amount
      );
    });

    // Reset Form
    setItems([
      { id: '1', description: '', category: 'Utilities', amount: 0 },
      { id: '2', description: '', category: 'Rent', amount: 0 }
    ]);
  };

  const expensesList = activeSme.expenses || [];

  const filteredExpenses = expensesList.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exp.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || exp.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate statistics
  const totalCount = expensesList.length;
  const totalOutflow = expensesList.reduce((sum, exp) => sum + exp.amount, 0);
  const utilitiesTotal = expensesList
    .filter(exp => exp.category === 'Utilities')
    .reduce((sum, exp) => sum + exp.amount, 0);
  const rentRepairsTotal = expensesList
    .filter(exp => exp.category === 'Rent' || exp.category === 'Repairs')
    .reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-heading">Operational Expenses Ledger</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Log bills, rents, repairs, salaries, and other money cashouts for <span className="text-emerald-600 font-bold">{activeSme.name}</span>.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Expenses Logged</span>
              <span className="text-xl font-bold text-slate-800 mt-1 block font-mono">{totalCount}</span>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-600 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Gross Outflow Amount</span>
              <span className="text-sm font-bold text-rose-600 mt-1.5 block truncate max-w-[130px] font-mono" title={formatRWF(totalOutflow)}>
                {formatRWF(totalOutflow)}
              </span>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Utilities & Services</span>
              <span className="text-sm font-bold text-slate-800 mt-1.5 block truncate max-w-[130px] font-mono" title={formatRWF(utilitiesTotal)}>
                {formatRWF(utilitiesTotal)}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-600 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-heading">Rent & Maintenance</span>
              <span className="text-sm font-bold text-slate-800 mt-1.5 block truncate max-w-[130px] font-mono" title={formatRWF(rentRepairsTotal)}>
                {formatRWF(rentRepairsTotal)}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-600 rounded-lg">
              <Wrench className="w-5 h-5 text-slate-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Expense Form */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <Card className="bg-white border border-gray-100 shadow-md">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-slate-850 mb-4 pb-2 border-b border-gray-100">
              Log Operations Expense Invoice (Batch Cashout)
            </h3>
            <form onSubmit={handleRecordExpenses} className="space-y-4 text-xs">
              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border-y border-gray-100 text-left">
                  <thead>
                    <tr className="bg-slate-50 text-gray-500 font-bold border-b border-gray-150">
                      <th className="py-2.5 px-3 text-[10px] w-12 text-center uppercase tracking-wider font-semibold">No.</th>
                      <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">Description</th>
                      <th className="py-2.5 px-3 text-[10px] w-48 uppercase tracking-wider font-semibold">Category</th>
                      <th className="py-2.5 px-3 text-[10px] w-44 uppercase tracking-wider font-semibold">Amount (FRW)</th>
                      <th className="py-2.5 px-3 text-[10px] w-16 text-center uppercase tracking-wider font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/40">
                        <td className="py-2 px-3 text-center font-mono font-bold text-gray-400">{index + 1}</td>
                        <td className="py-2 px-2">
                          <Input
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                            placeholder="e.g. Office Electricity Bill or Machinery Repairing"
                            className="border-gray-200 h-8 text-xs w-full"
                            required
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={item.category}
                            onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700 h-8"
                            required
                          >
                            <option value="Utilities">Utilities (Water, Electricity, Internet)</option>
                            <option value="Rent">Rent & Space Leases</option>
                            <option value="Repairs">Machinery Repairing & Support</option>
                            <option value="Salaries">Staff Salaries & Labor</option>
                            <option value="Taxes">Taxes & RRA Levies</option>
                            <option value="Other">Other Expenses</option>
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            value={item.amount || ''}
                            onChange={(e) => handleItemChange(item.id, 'amount', Math.max(0, Number(e.target.value)))}
                            placeholder="FRW"
                            className="border-gray-200 h-8 text-xs font-mono w-full"
                            required
                            min="1"
                          />
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
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Overall Total Cashout</span>
                    <span className="text-base font-bold text-rose-600 font-mono">{formatRWF(overallTotal)}</span>
                  </div>
                  <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white h-9 px-5 font-bold text-xs shadow">
                    Record Outflow Cashout
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
              placeholder="Search expenses transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
            >
              <option value="All">All Categories</option>
              <option value="Utilities">Utilities</option>
              <option value="Rent">Rent & Space Leases</option>
              <option value="Repairs">Repairs & Maintenance</option>
              <option value="Salaries">Staff Salaries</option>
              <option value="Taxes">Taxes & RRA Levies</option>
              <option value="Other">Other Expenses</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 pb-2">
          <h3 className="text-base font-bold text-slate-800">Operational Expenses Journal</h3>
        </div>

        <div className="overflow-x-auto px-6">
          <table className="w-full text-left border-collapse text-xs mt-3">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="pb-3 font-semibold">Expense Description</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Outflow Amount</th>
                <th className="pb-3 font-semibold">Expense Date</th>
                <th className="pb-3 font-semibold text-right">Reversal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredExpenses.map((exp, index) => (
                <motion.tr
                  key={exp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                  className="hover:bg-gray-50/50 transition"
                >
                  <td className="py-3.5 pr-2">
                    <span className="block font-bold text-slate-850 font-heading">{exp.description}</span>
                    <span className="text-[10px] text-gray-400 font-mono">ID: {exp.id}</span>
                  </td>
                  <td className="py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[9px] bg-slate-50 border border-slate-200 text-slate-700">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3.5 font-extrabold text-rose-600 font-mono">{formatRWF(exp.amount)}</td>
                  <td className="py-3.5 text-gray-500 font-medium font-mono">{exp.date}</td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => deleteExpense(activeSme.id, exp.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Revert Operational Expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredExpenses.length === 0 && (
          <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center space-y-2">
            <Info className="w-8 h-8 text-gray-300" />
            <span>No operational expenses logged matching the current criteria.</span>
          </div>
        )}
      </Card>
    </div>
  );
}

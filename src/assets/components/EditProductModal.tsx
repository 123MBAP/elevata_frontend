import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3, Scale, DollarSign, Layers, Tag, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ProductItem, formatRWF, MeasurementUnit } from '../../lib/mockData';
import { UNIT_OPTIONS, CATEGORY_OPTIONS } from './CreateProductModal';

interface EditProductModalProps {
  isOpen: boolean;
  product: ProductItem | null;
  onClose: () => void;
  onSubmit: (productId: string, updatedData: Partial<ProductItem>) => Promise<void> | void;
}

export default function EditProductModal({ isOpen, product, onClose, onSubmit }: EditProductModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState<MeasurementUnit>('kgs');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = useState<number | ''>('');
  const [reorderLevel, setReorderLevel] = useState<number | ''>(10);
  const [category, setCategory] = useState('General Merchandise');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setUnit((product.unit as MeasurementUnit) || 'kgs');
      setUnitPrice(product.unitPrice ?? '');
      setCostPrice(product.costPrice ?? '');
      setStockQuantity(product.stockQuantity ?? '');
      setReorderLevel(product.reorderLevel ?? 10);
      setCategory(product.category || 'General Merchandise');
      setError(null);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const totalValue = (Number(unitPrice) || 0) * (Number(stockQuantity) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }

    if (unitPrice === '' || Number(unitPrice) < 0) {
      setError('Please provide a valid price per unit.');
      return;
    }

    if (stockQuantity === '' || Number(stockQuantity) < 0) {
      setError('Please provide a valid stock quantity.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(product.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        unit,
        unitPrice: Number(unitPrice),
        costPrice: costPrice !== '' ? Number(costPrice) : undefined,
        stockQuantity: Number(stockQuantity),
        reorderLevel: reorderLevel !== '' ? Number(reorderLevel) : 5,
        category
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md border border-white/20">
                <Edit3 className="w-6 h-6 text-blue-100" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading">Edit Product Details</h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Update master catalog item — historical sales & purchases will preserve their original snapshot values
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Product Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product name"
                className="border-slate-200 text-xs h-10 font-medium"
                required
              />
            </div>

            {/* Category & Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <span>Category</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none h-10 font-medium"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-600" />
                  <span>Unit of Measurement</span>
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as MeasurementUnit)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg text-xs bg-blue-50/40 text-blue-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none h-10"
                  required
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quantity & Reorder Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Current Stock ({unit}) <span className="text-rose-500">*</span></span>
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="border-slate-200 text-xs h-10 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Low Stock Alert Level ({unit})
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value === '' ? '' : Number(e.target.value))}
                  className="border-slate-200 text-xs h-10 font-mono"
                />
              </div>
            </div>

            {/* Pricing Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  <span>Selling Price per {unit} (RWF) <span className="text-rose-500">*</span></span>
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="border-slate-200 text-xs h-10 font-mono font-bold text-blue-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cost Price per {unit} (RWF)
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="border-slate-200 text-xs h-10 font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Specifications
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[70px]"
                rows={2}
              />
            </div>

            {/* Live Inventory Valuation Preview Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-heading">
                  Updated Inventory Valuation
                </span>
                <span className="text-xs text-slate-600">
                  {stockQuantity || 0} {unit} @ {formatRWF(Number(unitPrice) || 0)} / {unit}
                </span>
              </div>
              <span className="text-base font-bold font-mono text-blue-600">
                {formatRWF(totalValue)}
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs h-10 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-6 shadow-md shadow-blue-600/20"
              >
                {isSubmitting ? 'Saving Changes...' : 'Save Updates'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PackagePlus, Sparkles, Scale, DollarSign, Layers, Tag, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { formatRWF, MeasurementUnit } from '../../lib/mockData';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: {
    name: string;
    description?: string;
    unit: string;
    unitPrice: number;
    costPrice?: number;
    stockQuantity: number;
    reorderLevel?: number;
    category?: string;
  }) => Promise<void> | void;
}

export const UNIT_OPTIONS: { value: MeasurementUnit; label: string; desc: string }[] = [
  { value: 'kgs', label: 'Kilograms (kgs)', desc: 'Weight (solids, produce, grain)' },
  { value: 'meters', label: 'Meters (m)', desc: 'Length (fabric, timber, pipes)' },
  { value: 'm²', label: 'Square Meters (m²)', desc: 'Area (tiles, roofing, glass)' },
  { value: 'l', label: 'Liters (L)', desc: 'Volume (milk, oil, liquids)' },
  { value: 'dozen', label: 'Dozen (12 pcs)', desc: 'Count batches (eggs, bakery)' },
  { value: 'pcs', label: 'Pieces (pcs)', desc: 'Individual units & items' },
  { value: 'box', label: 'Boxes (bx)', desc: 'Standard boxed cartons' },
  { value: 'bag', label: 'Bags / Sacks (bg)', desc: 'Packaged sacks (e.g. 25kg/50kg)' },
  { value: 'tons', label: 'Metric Tons (t)', desc: 'Bulk commercial freight' },
  { value: 'packs', label: 'Packs (pk)', desc: 'Retail packets / bundles' },
  { value: 'pairs', label: 'Pairs (pr)', desc: 'Footwear, garments, gloves' },
];

export const CATEGORY_OPTIONS = [
  'General Merchandise',
  'Food & Groceries',
  'Agriculture & Produce',
  'Building & Hardware',
  'Textiles & Garments',
  'Beverages & Liquids',
  'Automotive & Spares',
  'Electronics & Tools',
  'Chemicals & Cleaning'
];

export default function CreateProductModal({ isOpen, onClose, onSubmit }: CreateProductModalProps) {
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

  if (!isOpen) return null;

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
      setError('Please provide a valid initial quantity.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        unit,
        unitPrice: Number(unitPrice),
        costPrice: costPrice !== '' ? Number(costPrice) : undefined,
        stockQuantity: Number(stockQuantity),
        reorderLevel: reorderLevel !== '' ? Number(reorderLevel) : 5,
        category
      });

      // Reset form on success
      setName('');
      setDescription('');
      setUnit('kgs');
      setUnitPrice('');
      setCostPrice('');
      setStockQuantity('');
      setReorderLevel(10);
      setCategory('General Merchandise');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create product. Please try again.');
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
          className="bg-white rounded-[4px] shadow-2xl border border-[#d8e2ec] w-full max-w-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="bg-[#1a2332] px-5 py-4 text-white flex items-center justify-between border-b border-[#2a384c]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-[#2998d6]">
                <PackagePlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold font-heading">New Master Product</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Add product master with units, pricing, and initial stock balance
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-[4px] p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[4px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Product Name */}
            <div>
              <label className="accounting-label">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maize Flour Grade 1, Cotton Textile, Timber Planks"
                className="accounting-input w-full font-medium"
                required
                autoFocus
              />
            </div>

            {/* Category & Unit Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="accounting-label flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="accounting-select w-full font-medium"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="accounting-label flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-[#2998d6]" />
                  Unit of Measurement <span className="text-rose-500">*</span>
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as MeasurementUnit)}
                  className="accounting-select w-full font-semibold"
                  required
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label} — {u.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quantity & Reorder Threshold */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="accounting-label flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  Initial Stock Quantity ({unit}) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={`e.g. 100 ${unit}`}
                  className="accounting-input w-full font-mono"
                  required
                />
              </div>

              <div>
                <label className="accounting-label">
                  Low Stock Alert Level ({unit})
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 10"
                  className="accounting-input w-full font-mono"
                />
              </div>
            </div>

            {/* Pricing Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="accounting-label flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#2998d6]" />
                  Selling Price per {unit} (RWF) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 1500"
                  className="accounting-input w-full font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="accounting-label">
                  Cost / Purchase Price per {unit} (RWF)
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 1200 (optional)"
                  className="accounting-input w-full font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="accounting-label">
                Description / Specifications
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details regarding grade, packaging, source supplier, or specifications..."
                className="accounting-textarea w-full min-h-[70px]"
                rows={2}
              />
            </div>

            {/* Live Inventory Valuation Preview Card */}
            <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-[4px] p-3 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-heading">
                  Initial Inventory Valuation
                </span>
                <span className="text-xs text-slate-600">
                  {stockQuantity || 0} {unit} @ {formatRWF(Number(unitPrice) || 0)} / {unit}
                </span>
              </div>
              <span className="text-base font-bold font-mono text-[#1f85be]">
                {formatRWF(totalValue)}
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="accounting-btn-secondary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="accounting-btn-primary"
              >
                {isSubmitting ? 'Saving to Database...' : 'Create & Save Product'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Building2,
  Factory,
  GraduationCap,
  HeartPulse,
  LayoutGrid,
  Laptop,
  Palette,
  Sprout,
  Store,
  Truck,
  UtensilsCrossed
} from 'lucide-react';
import { apiRequest } from './api';

/**
 * Category templates adapt the business pages to the kind of business.
 * The source of truth is the backend (modules/categories/categoryTemplates.js);
 * FALLBACK_TEMPLATE is only used while loading or if the API is unreachable.
 */

export type JournalKey = 'sales' | 'purchases' | 'cash_in' | 'cash_out' | 'other';
export type KpiFormula =
  | 'gross_margin'
  | 'net_margin'
  | 'cogs_ratio'
  | 'revenue_per_employee'
  | 'revenue_per_unit'
  | 'expense_ratio'
  | 'receivables_ratio'
  | 'average_sale';

export interface CategoryTemplate {
  version: number;
  icon: string;
  description: string;
  sells: 'goods' | 'services' | 'mixed';
  tracksStock: boolean;
  terms: {
    customer: string;
    customers: string;
    supplier: string;
    product: string;
    products: string;
    sale: string;
    sales: string;
    purchase: string;
    purchases: string;
  };
  journals: Record<JournalKey, { enabled: boolean; label: string }>;
  units: string[];
  customerSegments: { value: string; label: string }[];
  expenseCategories: string[];
  milestoneCategories: string[];
  equipmentCategories: string[];
  profileFields: { key: string; label: string; type: 'text' | 'number'; unit?: string; placeholder?: string }[];
  kpis: { key: string; label: string; formula: KpiFormula; field?: string }[];
}

export interface BusinessCategory {
  id: string | null;
  businessType: string | null;
  description: string;
  icon: string;
  isActive: boolean;
  sortOrder?: number;
  hasCustomConfig: boolean;
  config: Partial<CategoryTemplate> | null;
  template: CategoryTemplate;
}

export const FALLBACK_TEMPLATE: CategoryTemplate = {
  version: 1,
  icon: 'briefcase',
  description: 'General business that sells products or services.',
  sells: 'goods',
  tracksStock: true,
  terms: {
    customer: 'Customer',
    customers: 'Customers',
    supplier: 'Supplier',
    product: 'Product',
    products: 'Products',
    sale: 'Sale',
    sales: 'Sales',
    purchase: 'Purchase',
    purchases: 'Purchases'
  },
  journals: {
    sales: { enabled: true, label: 'Sales' },
    purchases: { enabled: true, label: 'Purchases' },
    cash_in: { enabled: true, label: 'Cash In' },
    cash_out: { enabled: true, label: 'Cash Out & Expenses' },
    other: { enabled: true, label: 'Activities & Milestones' }
  },
  units: ['pcs', 'kgs', 'l', 'box', 'bag', 'packs', 'dozen', 'meters', 'tons', 'pairs', 'm²', 'other'],
  customerSegments: [
    { value: 'retail', label: 'Individual / walk-in' },
    { value: 'wholesale', label: 'Wholesale / reseller' },
    { value: 'institution', label: 'Institution / company' }
  ],
  expenseCategories: [],
  milestoneCategories: ['Milestone', 'License / permit', 'New contract', 'Training', 'Expansion'],
  equipmentCategories: [
    'Technology & Computers',
    'Storage & Refrigeration',
    'Logistics & Transport',
    'Power & Backup Energy',
    'Manufacturing & Tools',
    'Office Furniture & Fixtures',
    'Other Assets'
  ],
  profileFields: [],
  kpis: [
    { key: 'gross_margin', label: 'Gross margin', formula: 'gross_margin' },
    { key: 'expense_ratio', label: 'Expenses as % of revenue', formula: 'expense_ratio' },
    { key: 'average_sale', label: 'Average sale', formula: 'average_sale' }
  ]
};

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  store: Store,
  sprout: Sprout,
  utensils: UtensilsCrossed,
  factory: Factory,
  building: Building2,
  truck: Truck,
  laptop: Laptop,
  heart: HeartPulse,
  graduation: GraduationCap,
  palette: Palette,
  grid: LayoutGrid
};

export const iconFor = (name?: string): LucideIcon => CATEGORY_ICONS[name || ''] || Briefcase;

const UNIT_LABELS: Record<string, string> = {
  pcs: 'pcs (pieces)',
  kgs: 'kgs (kilograms)',
  l: 'L (liters)',
  meters: 'm (meters)',
  'm²': 'm² (square meters)',
  dozen: 'dozen (12 pcs)',
  box: 'box',
  bag: 'bag / sack',
  tons: 'tons',
  packs: 'packs',
  pairs: 'pairs',
  other: 'other (custom)'
};
export const unitLabel = (unit: string) => UNIT_LABELS[unit] || unit;

// ---------- Data loading (module-level cache so pages share one request) ----------

let categoriesPromise: Promise<BusinessCategory[]> | null = null;
const templateCache = new Map<string, Promise<BusinessCategory>>();

export const fetchCategories = (force = false): Promise<BusinessCategory[]> => {
  if (!categoriesPromise || force) {
    categoriesPromise = apiRequest('/categories')
      .then((res) => (Array.isArray(res?.data?.categories) ? (res.data.categories as BusinessCategory[]) : []))
      .catch((error) => {
        categoriesPromise = null;
        throw error;
      });
  }
  return categoriesPromise;
};

export const fetchTemplateFor = (businessType?: string | null): Promise<BusinessCategory> => {
  const key = (businessType || '').trim().toLowerCase();
  if (!templateCache.has(key)) {
    const request = apiRequest(`/categories/template?businessType=${encodeURIComponent(businessType || '')}`)
      .then((res) => res.data.category as BusinessCategory)
      .catch((error) => {
        templateCache.delete(key);
        throw error;
      });
    templateCache.set(key, request);
  }
  return templateCache.get(key)!;
};

/** Clears cached templates (after an admin edits a category or a business changes type). */
export const invalidateCategoryCache = () => {
  categoriesPromise = null;
  templateCache.clear();
};

/** Active categories for pickers. */
export function useCategories() {
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchCategories()
      .then((list) => alive && setCategories(list))
      .catch(() => alive && setError('Could not load business categories. Check your connection and reload.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { categories, loading, error };
}

/** Template for a business type; returns the fallback until loaded. */
export function useBusinessTemplate(businessType?: string | null) {
  const [template, setTemplate] = useState<CategoryTemplate>(FALLBACK_TEMPLATE);
  const [category, setCategory] = useState<BusinessCategory | null>(null);

  useEffect(() => {
    let alive = true;
    fetchTemplateFor(businessType)
      .then((cat) => {
        if (!alive) return;
        setCategory(cat);
        setTemplate(cat.template || FALLBACK_TEMPLATE);
      })
      .catch(() => {
        if (alive) setTemplate(FALLBACK_TEMPLATE);
      });
    return () => {
      alive = false;
    };
  }, [businessType]);

  return { template, category };
}

/** True when the business type matches an active category (case-insensitive). */
export const isKnownCategory = (businessType: string | undefined | null, categories: BusinessCategory[]) =>
  Boolean(businessType) &&
  categories.some((c) => (c.businessType || '').toLowerCase() === String(businessType).trim().toLowerCase());

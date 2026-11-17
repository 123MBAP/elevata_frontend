import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { iconFor, type BusinessCategory } from '../../lib/categoryTemplate';

interface CategoryPickerProps {
  categories: BusinessCategory[];
  value: string;
  onChange: (businessType: string) => void;
  loading?: boolean;
  error?: string | null;
}

/**
 * Searchable list of business categories with icon, description and a short
 * preview of how Elevata will adapt to the chosen category.
 * Styled for the dark glass auth screens (login / register).
 */
export default function CategoryPicker({ categories, value, onChange, loading, error }: CategoryPickerProps) {
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) =>
      [c.businessType, c.description, c.template?.terms?.products].some((field) => field && field.toLowerCase().includes(q))
    );
  }, [categories, query]);

  const selected = categories.find((c) => (c.businessType || '').toLowerCase() === value.toLowerCase());

  if (loading) {
    return <div className="rounded-md border border-white/15 bg-white/5 px-3 py-4 text-center text-[12px] text-white/70">Loading categories…</div>;
  }
  if (error) {
    return <div className="rounded-md border border-red-200/35 bg-red-500/15 px-3 py-3 text-[12px] text-red-50">{error}</div>;
  }

  return (
    <div className="space-y-2">
      {categories.length > 6 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search, e.g. farm, salon, shop"
            aria-label="Search business categories"
            className="h-9 w-full rounded-md border border-white/20 bg-white/10 pl-8 pr-3 text-[13px] text-white placeholder:text-white/45 outline-none focus:border-white/50"
          />
        </div>
      )}

      <div role="radiogroup" aria-label="Business category" className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
        {visible.length === 0 && (
          <p className="px-1 py-3 text-center text-[12px] text-white/60">No category matches “{query}”. Try another word or pick “Other Services”.</p>
        )}
        {visible.map((category) => {
          const Icon = iconFor(category.icon);
          const isSelected = category.businessType === selected?.businessType;
          return (
            <button
              key={category.id || category.businessType}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(category.businessType || '')}
              className={`flex w-full items-start gap-2.5 rounded-md border px-2.5 py-2 text-left transition ${
                isSelected ? 'border-white bg-white/20' : 'border-white/15 bg-white/5 hover:border-white/35 hover:bg-white/10'
              }`}
            >
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${isSelected ? 'bg-white text-[#1d4d57]' : 'bg-white/10 text-white/85'}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-white">{category.businessType}</span>
                <span className="block text-[11px] leading-snug text-white/65">{category.description}</span>
              </span>
              {isSelected && <Check className="mt-1 h-4 w-4 shrink-0 text-white" />}
            </button>
          );
        })}
      </div>

      {selected?.template && (
        <div className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-[11px] leading-relaxed text-white/75">
          <span className="font-semibold text-white">Elevata will set up: </span>
          {[
            `${selected.template.terms.customers.toLowerCase()} & ${selected.template.terms.products.toLowerCase()}`,
            Object.values(selected.template.journals).filter((j) => j.enabled).map((j) => j.label).join(', '),
            selected.template.tracksStock ? 'stock tracking' : 'no stock tracking (services)'
          ].join(' · ')}
          . You can change your category later in your business profile.
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Edit3, Eye, EyeOff, Plus, RotateCcw, Save, Search, Trash2, X } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { Card } from '../assets/components/ui/card';
import {
  CATEGORY_ICONS,
  FALLBACK_TEMPLATE,
  iconFor,
  invalidateCategoryCache,
  type BusinessCategory,
  type CategoryTemplate,
  type JournalKey,
  type KpiFormula
} from '../lib/categoryTemplate';

type Defaults = { base: CategoryTemplate; byType: Record<string, Partial<CategoryTemplate>> };

const JOURNAL_KEYS: JournalKey[] = ['sales', 'purchases', 'cash_in', 'cash_out', 'other'];
const TERM_KEYS: (keyof CategoryTemplate['terms'])[] = ['customer', 'customers', 'supplier', 'product', 'products', 'sale', 'sales', 'purchase', 'purchases'];
const KPI_FORMULAS: { value: KpiFormula; label: string }[] = [
  { value: 'gross_margin', label: 'Gross margin %' },
  { value: 'net_margin', label: 'Net margin %' },
  { value: 'cogs_ratio', label: 'Cost of goods ÷ revenue %' },
  { value: 'expense_ratio', label: 'Expenses ÷ revenue %' },
  { value: 'receivables_ratio', label: 'Unpaid sales ÷ revenue %' },
  { value: 'average_sale', label: 'Average sale' },
  { value: 'revenue_per_employee', label: 'Revenue per employee' },
  { value: 'revenue_per_unit', label: 'Revenue per profile field (set field)' }
];

const isPlainObject = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const mergeTemplate = <T,>(base: T, override: unknown): T => {
  if (!isPlainObject(override)) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined || value === null) continue;
    const current = out[key];
    out[key] = isPlainObject(value) && isPlainObject(current) ? mergeTemplate(current, value) : value;
  }
  return out as T;
};

// ---------- line-based editing helpers ----------
const listToText = (list: string[]) => list.join('\n');
const textToList = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);
const rowsToText = (rows: (string | undefined)[][]) => rows.map((r) => r.filter((c) => c !== undefined && c !== '').join(' | ')).join('\n');
const textToRows = (text: string) => textToList(text).map((line) => line.split('|').map((c) => c.trim()));

const inputCls = 'w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500';
const labelCls = 'block text-[11px] font-semibold text-slate-700 mb-1';

interface EditorState {
  id: string | null;
  businessType: string;
  description: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  template: CategoryTemplate;
  // raw text for list fields so typing is not reformatted
  unitsText: string;
  expenseText: string;
  milestoneText: string;
  equipmentText: string;
  segmentsText: string;
  fieldsText: string;
  kpisText: string;
}

const toEditor = (cat: BusinessCategory | null, defaultFor: (name: string) => CategoryTemplate): EditorState => {
  const template = cat?.template || defaultFor('');
  return {
    id: cat?.id || null,
    businessType: cat?.businessType || '',
    description: cat?.description || '',
    icon: cat?.icon || 'briefcase',
    isActive: cat ? cat.isActive !== false : true,
    sortOrder: cat?.sortOrder ?? 0,
    template,
    unitsText: listToText(template.units),
    expenseText: listToText(template.expenseCategories),
    milestoneText: listToText(template.milestoneCategories),
    equipmentText: listToText(template.equipmentCategories),
    segmentsText: rowsToText(template.customerSegments.map((s) => [s.value, s.label])),
    fieldsText: rowsToText(template.profileFields.map((f) => [f.key, f.label, f.type, f.unit])),
    kpisText: rowsToText(template.kpis.map((k) => [k.key, k.label, k.formula, k.field]))
  };
};

/** Builds the edited template and reports the first problem found, if any. */
const buildTemplate = (e: EditorState): { template?: CategoryTemplate; error?: string } => {
  const segments = textToRows(e.segmentsText);
  if (segments.some((r) => r.length < 2)) return { error: 'Each customer type needs "value | label".' };
  const fields = textToRows(e.fieldsText);
  if (fields.some((r) => r.length < 3 || !['text', 'number'].includes(r[2]))) return { error: 'Each profile field needs "key | label | text or number | unit (optional)".' };
  const kpis = textToRows(e.kpisText);
  const formulas = KPI_FORMULAS.map((f) => f.value as string);
  if (kpis.some((r) => r.length < 3 || !formulas.includes(r[2]))) return { error: `Each highlight needs "key | label | formula". Formulas: ${formulas.join(', ')}.` };
  if (kpis.some((r) => r[2] === 'revenue_per_unit' && !fields.some((f) => f[0] === r[3]))) {
    return { error: 'A "revenue_per_unit" highlight must name one of the profile field keys as its 4th part.' };
  }
  if (!JOURNAL_KEYS.some((k) => e.template.journals[k].enabled)) return { error: 'Keep at least one journal enabled.' };
  return {
    template: {
      ...e.template,
      units: textToList(e.unitsText),
      expenseCategories: textToList(e.expenseText),
      milestoneCategories: textToList(e.milestoneText),
      equipmentCategories: textToList(e.equipmentText),
      customerSegments: segments.map(([value, label]) => ({ value, label })),
      profileFields: fields.map(([key, label, type, unit]) => ({ key, label, type: type as 'text' | 'number', ...(unit ? { unit } : {}) })),
      kpis: kpis.map(([key, label, formula, field]) => ({ key, label, formula: formula as KpiFormula, ...(field ? { field } : {}) }))
    }
  };
};

/** Only keys that differ from the built-in default are stored, so later default improvements still apply. */
const diffFromDefault = (edited: CategoryTemplate, base: CategoryTemplate) => {
  const out: Record<string, unknown> = {};
  (Object.keys(edited) as (keyof CategoryTemplate)[]).forEach((key) => {
    if (key === 'description' || key === 'icon' || key === 'version') return;
    if (JSON.stringify(edited[key]) !== JSON.stringify(base[key])) out[key] = edited[key];
  });
  return out;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [defaults, setDefaults] = useState<Defaults | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deletingCategory, setDeletingCategory] = useState<BusinessCategory | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const defaultFor = useMemo(
    () => (name: string): CategoryTemplate => {
      const base = defaults?.base || FALLBACK_TEMPLATE;
      const key = Object.keys(defaults?.byType || {}).find((k) => k.toLowerCase() === name.trim().toLowerCase());
      return mergeTemplate(base, key ? defaults!.byType[key] : {});
    },
    [defaults]
  );

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/categories/admin');
      setCategories(Array.isArray(res?.data?.categories) ? res.data.categories : []);
      if (res?.data?.defaults) setDefaults(res.data.defaults);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load business categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const afterChange = (message: string) => {
    invalidateCategoryCache();
    setSuccessMessage(message);
    loadCategories();
  };

  const saveEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    const name = editor.businessType.trim();
    if (!name) {
      setEditorError('Category name is required.');
      return;
    }
    const built = buildTemplate(editor);
    if (built.error || !built.template) {
      setEditorError(built.error || 'Invalid template.');
      return;
    }
    const config = diffFromDefault(built.template, defaultFor(name));
    const body = {
      businessType: name,
      description: editor.description.trim(),
      icon: editor.icon,
      isActive: editor.isActive,
      sortOrder: editor.sortOrder,
      config: Object.keys(config).length ? config : null
    };
    setSaving(true);
    setEditorError(null);
    try {
      await apiRequest(editor.id ? `/categories/admin/${editor.id}` : '/categories/admin', {
        method: editor.id ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      });
      setEditor(null);
      afterChange(editor.id ? `Category '${name}' updated.` : `Category '${name}' created.`);
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (cat: BusinessCategory) => {
    try {
      await apiRequest(`/categories/admin/${cat.id}`, { method: 'PUT', body: JSON.stringify({ isActive: !cat.isActive }) });
      afterChange(cat.isActive ? `'${cat.businessType}' is now hidden from registration.` : `'${cat.businessType}' is offered again.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update category.');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setSubmittingDelete(true);
    try {
      await apiRequest(`/categories/admin/${deletingCategory.id}`, { method: 'DELETE' });
      setDeletingCategory(null);
      afterChange(`Category '${deletingCategory.businessType}' deleted.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete category.');
    } finally {
      setSubmittingDelete(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    [c.businessType, c.description].some((v) => (v || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const setTemplate = (patch: Partial<CategoryTemplate>) => editor && setEditor({ ...editor, template: { ...editor.template, ...patch } });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Business Categories</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Admin</span>
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Each category is a template: it sets the wording, journals, units, expense types, profile fields and report highlights a business sees.
          </p>
        </div>
        <button
          onClick={() => {
            setEditorError(null);
            setEditor(toEditor(null, defaultFor));
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} aria-label="Dismiss" className="text-emerald-700 hover:text-emerald-900"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} aria-label="Dismiss" className="text-rose-700 hover:text-rose-900"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search categories..."
              className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Showing <strong className="text-slate-900">{filteredCategories.length}</strong> of <strong className="text-slate-900">{categories.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Sells</th>
                <th className="py-3 px-3">Template</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">Loading business categories...</td></tr>
              ) : filteredCategories.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">No business categories found.</td></tr>
              ) : (
                filteredCategories.map((cat) => {
                  const Icon = iconFor(cat.icon);
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Icon className="w-4 h-4" /></span>
                          <div>
                            <div className="font-bold text-slate-900">{cat.businessType}</div>
                            <div className="text-[11px] text-slate-500 max-w-md">{cat.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 capitalize">
                        {cat.template.sells}
                        {!cat.template.tracksStock && <div className="text-[10px] text-slate-400 normal-case">no stock</div>}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cat.hasCustomConfig ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {cat.hasCustomConfig ? 'Customised' : 'Built-in default'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cat.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {cat.isActive ? 'Offered' : 'Hidden'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditorError(null);
                              setEditor(toEditor(cat, defaultFor));
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Edit category and template"
                            aria-label={`Edit ${cat.businessType}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleActive(cat)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                            title={cat.isActive ? 'Hide from registration' : 'Offer again'}
                            aria-label={cat.isActive ? `Hide ${cat.businessType}` : `Offer ${cat.businessType}`}
                          >
                            {cat.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => setDeletingCategory(cat)}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="Delete category"
                            aria-label={`Delete ${cat.businessType}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Category + template editor */}
      {editor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 bg-black/40">
          <form onSubmit={saveEditor} className="my-6 bg-white border border-gray-200 rounded-2xl w-full max-w-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">{editor.id ? `Edit “${editor.businessType}”` : 'New business category'}</h3>
              <button type="button" onClick={() => setEditor(null)} aria-label="Close" className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>

            {/* Basics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Category name</label>
                <input required value={editor.businessType} onChange={(e) => setEditor({ ...editor, businessType: e.target.value })} placeholder="e.g. Renewable Energy & Solar" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(CATEGORY_ICONS).map(([name, Icon]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setEditor({ ...editor, icon: name })}
                      aria-label={`Icon ${name}`}
                      aria-pressed={editor.icon === name}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border ${editor.icon === name ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Short description (shown when choosing a category)</label>
                <input value={editor.description} onChange={(e) => setEditor({ ...editor, description: e.target.value })} placeholder="Who this category is for" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>What the business sells</label>
                <select value={editor.template.sells} onChange={(e) => setTemplate({ sells: e.target.value as CategoryTemplate['sells'] })} className={inputCls}>
                  <option value="goods">Goods</option>
                  <option value="services">Services</option>
                  <option value="mixed">Goods and services</option>
                </select>
              </div>
              <div className="flex items-end gap-5 pb-1">
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" checked={editor.template.tracksStock} onChange={(e) => setTemplate({ tracksStock: e.target.checked })} />
                  Tracks stock
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" checked={editor.isActive} onChange={(e) => setEditor({ ...editor, isActive: e.target.checked })} />
                  Offered at registration
                </label>
              </div>
            </div>

            {/* Wording */}
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-slate-800">Wording</legend>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TERM_KEYS.map((key) => (
                  <div key={key}>
                    <label className={labelCls}>{FALLBACK_TEMPLATE.terms[key]}</label>
                    <input value={editor.template.terms[key]} onChange={(e) => setTemplate({ terms: { ...editor.template.terms, [key]: e.target.value } })} className={inputCls} />
                  </div>
                ))}
              </div>
            </fieldset>

            {/* Journals */}
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-slate-800">Journals in Business Activities</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {JOURNAL_KEYS.map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      aria-label={`Show ${key} journal`}
                      checked={editor.template.journals[key].enabled}
                      onChange={(e) => setTemplate({ journals: { ...editor.template.journals, [key]: { ...editor.template.journals[key], enabled: e.target.checked } } })}
                    />
                    <input
                      value={editor.template.journals[key].label}
                      onChange={(e) => setTemplate({ journals: { ...editor.template.journals, [key]: { ...editor.template.journals[key], label: e.target.value } } })}
                      aria-label={`${key} journal label`}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </fieldset>

            {/* Lists */}
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <legend className="text-xs font-bold text-slate-800 mb-2">Lists (one per line)</legend>
              {([
                ['unitsText', 'Units of measure'],
                ['expenseText', 'Extra expense categories (count as running costs)'],
                ['milestoneText', 'Milestone suggestions'],
                ['equipmentText', 'Equipment categories']
              ] as const).map(([field, label]) => (
                <div key={field}>
                  <label className={labelCls}>{label}</label>
                  <textarea rows={4} value={editor[field]} onChange={(e) => setEditor({ ...editor, [field]: e.target.value })} className={`${inputCls} font-mono`} />
                </div>
              ))}
              <div>
                <label className={labelCls}>Customer types — value | label</label>
                <textarea rows={4} value={editor.segmentsText} onChange={(e) => setEditor({ ...editor, segmentsText: e.target.value })} placeholder="retail | Walk-in customer" className={`${inputCls} font-mono`} />
              </div>
              <div>
                <label className={labelCls}>Profile fields — key | label | text or number | unit</label>
                <textarea rows={4} value={editor.fieldsText} onChange={(e) => setEditor({ ...editor, fieldsText: e.target.value })} placeholder="landSizeHa | Land under cultivation | number | ha" className={`${inputCls} font-mono`} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Report highlights — key | label | formula | profile field key (for revenue_per_unit)</label>
                <textarea rows={3} value={editor.kpisText} onChange={(e) => setEditor({ ...editor, kpisText: e.target.value })} placeholder="revenue_per_ha | Revenue per hectare | revenue_per_unit | landSizeHa" className={`${inputCls} font-mono`} />
                <p className="mt-1 text-[11px] text-slate-500">Formulas: {KPI_FORMULAS.map((f) => `${f.value} (${f.label})`).join(', ')}.</p>
              </div>
            </fieldset>

            {editorError && (
              <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editorError}</span>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  const fresh = toEditor(null, defaultFor);
                  const template = defaultFor(editor.businessType);
                  setEditor({ ...fresh, id: editor.id, businessType: editor.businessType, description: editor.description, icon: editor.icon, isActive: editor.isActive, sortOrder: editor.sortOrder, ...toEditorLists(template), template });
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset template to built-in default
              </button>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setEditor(null)} className="px-4 py-2 bg-white hover:bg-slate-50 border border-gray-200 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save category'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete category</h3>
            <p className="text-xs text-slate-600">
              Delete <strong className="text-slate-900">“{deletingCategory.businessType}”</strong>? This cannot be undone. Businesses already in this
              category keep the name but fall back to the generic template, and are asked to choose a new category at their next login.
              To stop offering it without affecting anyone, use <strong>Hide</strong> instead.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setDeletingCategory(null)} className="px-4 py-2 bg-white hover:bg-slate-50 border border-gray-200 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
              <button type="button" onClick={handleDeleteCategory} disabled={submittingDelete} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                <span>{submittingDelete ? 'Deleting...' : 'Delete permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const toEditorLists = (template: CategoryTemplate) => ({
  unitsText: listToText(template.units),
  expenseText: listToText(template.expenseCategories),
  milestoneText: listToText(template.milestoneCategories),
  equipmentText: listToText(template.equipmentCategories),
  segmentsText: rowsToText(template.customerSegments.map((s) => [s.value, s.label])),
  fieldsText: rowsToText(template.profileFields.map((f) => [f.key, f.label, f.type, f.unit])),
  kpisText: rowsToText(template.kpis.map((k) => [k.key, k.label, k.formula, k.field]))
});

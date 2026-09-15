import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit3,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  Tag,
  FolderTree,
  RotateCcw
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { Card } from '../assets/components/ui/card';

interface CategoryItem {
  id: string;
  businessType: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/categories');
      if (res.success && res.data && Array.isArray(res.data.categories)) {
        setCategories(res.data.categories);
      }
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      setErrorMessage(err.message || 'Failed to load business categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setSubmittingAdd(true);
    setErrorMessage(null);
    try {
      const res = await apiRequest('/categories/admin', {
        method: 'POST',
        body: JSON.stringify({ businessType: newCategoryName.trim() })
      });

      if (res.success) {
        setSuccessMessage(`Category '${newCategoryName.trim()}' created successfully.`);
        setNewCategoryName('');
        setShowAddModal(false);
        fetchCategories();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create category.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCategoryName.trim()) return;

    setSubmittingEdit(true);
    setErrorMessage(null);
    try {
      const res = await apiRequest(`/categories/admin/${editingCategory.id}`, {
        method: 'PUT',
        body: JSON.stringify({ businessType: editCategoryName.trim() })
      });

      if (res.success) {
        setSuccessMessage(`Category updated to '${editCategoryName.trim()}'.`);
        setEditingCategory(null);
        fetchCategories();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update category.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    setSubmittingDelete(true);
    setErrorMessage(null);
    try {
      const res = await apiRequest(`/categories/admin/${deletingCategory.id}`, {
        method: 'DELETE'
      });

      if (res.success) {
        setSuccessMessage(`Category '${deletingCategory.businessType}' removed successfully.`);
        setDeletingCategory(null);
        fetchCategories();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete category.');
    } finally {
      setSubmittingDelete(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    (c.businessType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Business Categories
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Admin Configuration
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Create and manage business sectors and categories used across registration and SME profiling.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Status Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-sm space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search category or ID..."
              className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Showing <strong className="text-slate-900">{filteredCategories.length}</strong> of{' '}
            <strong className="text-slate-900">{categories.length}</strong> categories
          </div>
        </div>

        {/* Categories Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Business Category Name</th>
                <th className="py-3 px-3">Unique Identifier (ID)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading business categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No business categories found matching your query.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{cat.businessType}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                      {cat.id}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Active
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setEditCategoryName(cat.businessType);
                          }}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Edit category"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(cat)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* =========================================================================
          MODAL: Add Category
      ========================================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Add New Business Category
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category / Business Type Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Renewable Energy & Solar"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-gray-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd || !newCategoryName.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{submittingAdd ? 'Creating...' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Edit Category
      ========================================================================== */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                Edit Business Category
              </h3>
              <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-gray-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit || !editCategoryName.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{submittingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Delete Category Confirmation
      ========================================================================== */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                Delete Category
              </h3>
              <button onClick={() => setDeletingCategory(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to delete the business category{' '}
              <strong className="text-slate-900">"{deletingCategory.businessType}"</strong>? This will remove it from the selectable categories list.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-gray-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCategory}
                disabled={submittingDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{submittingDelete ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  CheckCircle2,
  Clock,
  Building2,
  Landmark,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Eye,
  Check,
  X,
  AlertCircle,
  UserX,
  Sparkles,
  ChevronRight,
  Info,
  Trash2
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface UserEntity {
  id: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'BUSINESS' | 'FINANCIAL_INSTITUTION';
  isVerified: boolean;
  isActive: boolean;
  isPilotApproved?: boolean;
  is_approved: boolean;
  createdAt: string;
  updatedAt: string;
  business?: {
    id: string;
    businessName: string;
    ownerName: string;
    businessType: string;
    province: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
    knownPlace?: string;
    latitude: string | number;
    longitude: string | number;
  } | null;
  financialInstitution?: {
    id: string;
    institutionName: string;
    representativeName: string;
    category: string;
    operatingScope: string;
    licenseNumber: string;
    website?: string;
  } | null;
}

interface StatsData {
  total: number;
  approved: number;
  pending: number;
  smes: number;
  financialInstitutions: number;
  admins: number;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    approved: 0,
    pending: 0,
    smes: 0,
    financialInstitutions: 0,
    admins: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'BUSINESS' | 'FINANCIAL_INSTITUTION' | 'ADMIN'>('ALL');
  const [selectedUser, setSelectedUser] = useState<UserEntity | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/admin/users');
      if (res && res.success && res.data) {
        setUsers(res.data.users || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      showToast('error', err.message || 'Failed to load registered users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await apiRequest(`/admin/users/${userToDelete.id}`, {
        method: 'DELETE'
      });

      if (res && res.success) {
        showToast('success', `User account (${userToDelete.email}) permanently deleted.`);
        
        // Remove from list
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));

        // Update stats
        setStats((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          approved: userToDelete.is_approved ? Math.max(0, prev.approved - 1) : prev.approved,
          pending: !userToDelete.is_approved ? Math.max(0, prev.pending - 1) : prev.pending,
          smes: userToDelete.role === 'BUSINESS' ? Math.max(0, prev.smes - 1) : prev.smes,
          financialInstitutions: userToDelete.role === 'FINANCIAL_INSTITUTION' ? Math.max(0, prev.financialInstitutions - 1) : prev.financialInstitutions,
          admins: userToDelete.role === 'ADMIN' ? Math.max(0, prev.admins - 1) : prev.admins,
        }));

        if (selectedUser?.id === userToDelete.id) {
          setSelectedUser(null);
        }
        setUserToDelete(null);
      }
    } catch (err: any) {
      console.error('Delete user failed:', err);
      showToast('error', err.message || 'Failed to delete user account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleApproval = async (userId: string, newApprovalState: boolean) => {
    setActionLoadingId(userId);
    try {
      const res = await apiRequest(`/admin/users/${userId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ is_approved: newApprovalState })
      });

      if (res && res.success) {
        const actionLabel = newApprovalState ? 'approved' : 'approval revoked';
        showToast('success', `User successfully ${actionLabel}!`);
        
        // Update local state smoothly
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, is_approved: newApprovalState, isPilotApproved: newApprovalState }
              : u
          )
        );

        // Update stats
        setStats((prev) => ({
          ...prev,
          approved: newApprovalState ? prev.approved + 1 : Math.max(0, prev.approved - 1),
          pending: newApprovalState ? Math.max(0, prev.pending - 1) : prev.pending + 1
        }));

        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser((prev) =>
            prev ? { ...prev, is_approved: newApprovalState, isPilotApproved: newApprovalState } : null
          );
        }
      }
    } catch (err: any) {
      console.error('Approval update failed:', err);
      showToast('error', err.message || 'Failed to update approval status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter users based on query and filters
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Status filter
      if (statusFilter === 'APPROVED' && !u.is_approved) return false;
      if (statusFilter === 'PENDING' && u.is_approved) return false;

      // Role filter
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const emailMatch = u.email.toLowerCase().includes(q);
        const phoneMatch = u.phone.toLowerCase().includes(q);
        const bizNameMatch = u.business?.businessName?.toLowerCase().includes(q) || false;
        const ownerMatch = u.business?.ownerName?.toLowerCase().includes(q) || false;
        const districtMatch = u.business?.district?.toLowerCase().includes(q) || false;
        const fiNameMatch = u.financialInstitution?.institutionName?.toLowerCase().includes(q) || false;
        const repNameMatch = u.financialInstitution?.representativeName?.toLowerCase().includes(q) || false;
        const licenseMatch = u.financialInstitution?.licenseNumber?.toLowerCase().includes(q) || false;

        return (
          emailMatch ||
          phoneMatch ||
          bizNameMatch ||
          ownerMatch ||
          districtMatch ||
          fiNameMatch ||
          repNameMatch ||
          licenseMatch
        );
      }

      return true;
    });
  }, [users, statusFilter, roleFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-xl border backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900/90 text-emerald-100 border-emerald-500/40 shadow-emerald-950/20'
                : 'bg-rose-900/90 text-rose-100 border-rose-500/40 shadow-rose-950/20'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400" />
            )}
            <span className="text-sm font-semibold">{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-white/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-200 text-[#0f74e7]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-heading">
                Admin User Approvals
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                Review and approve SME business registrations &amp; financial institution onboarding
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Cards Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Total Users */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Users</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[10px] font-semibold text-slate-400">accounts</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pending Review</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900">{stats.pending}</span>
            <span className="text-[10px] font-bold text-amber-600">needs action</span>
          </div>
        </div>

        {/* Approved Users */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Approved</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-900">{stats.approved}</span>
            <span className="text-[10px] font-bold text-emerald-600">unrestricted</span>
          </div>
        </div>

        {/* SME Businesses */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">SME Businesses</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-900">{stats.smes}</span>
            <span className="text-[10px] font-bold text-blue-600">enterprises</span>
          </div>
        </div>

        {/* Financial Institutions */}
        <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Credit Lenders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-900">{stats.financialInstitutions}</span>
            <span className="text-[10px] font-bold text-purple-600">institutions</span>
          </div>
        </div>
      </div>

      {/* Search & Filtering Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, business, license, district..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#0f74e7] focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-700 hover:bg-amber-100/60'
              }`}
            >
              <span>Pending</span>
              {stats.pending > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white/20 px-1 text-[10px] font-black">
                  {stats.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 hover:bg-emerald-100/60'
              }`}
            >
              Approved
            </button>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e: any) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#0f74e7] focus:bg-white"
          >
            <option value="ALL">All Roles</option>
            <option value="BUSINESS">SME Businesses</option>
            <option value="FINANCIAL_INSTITUTION">Financial Institutions</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">User / Contact</th>
                <th className="px-5 py-3.5">Role &amp; Entity</th>
                <th className="px-5 py-3.5">Category &amp; Location</th>
                <th className="px-5 py-3.5">Approval Status</th>
                <th className="px-5 py-3.5">Registered</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="inline-flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#0f74e7] border-t-transparent"></div>
                      <span className="text-xs font-bold text-slate-500">Loading registered users...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="inline-flex flex-col items-center gap-3 text-slate-400">
                      <UserX className="h-10 w-10 text-slate-300" />
                      <p className="text-sm font-bold text-slate-600">No users match your filters</p>
                      <p className="text-xs text-slate-400">
                        Try clearing search terms or switching approval status tabs.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isApproved = u.is_approved || u.isPilotApproved;
                  const isSme = u.role === 'BUSINESS';
                  const isFi = u.role === 'FINANCIAL_INSTITUTION';
                  const isAdmin = u.role === 'ADMIN';

                  const entityName = isSme
                    ? u.business?.businessName || 'Business Profile'
                    : isFi
                    ? u.financialInstitution?.institutionName || 'Financial Entity'
                    : 'System Administrator';

                  const principalName = isSme
                    ? u.business?.ownerName
                    : isFi
                    ? u.financialInstitution?.representativeName
                    : 'Elevata Admin';

                  const locationSummary = isSme
                    ? `${u.business?.district || ''}, ${u.business?.province || ''}`
                    : isFi
                    ? `${u.financialInstitution?.operatingScope || 'National Scope'}`
                    : 'HQ';

                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-slate-50/60"
                    >
                      {/* User / Contact */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                              isAdmin
                                ? 'bg-purple-100 text-purple-700'
                                : isFi
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {(principalName || u.email).substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 truncate">
                              {principalName || 'Registered User'}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                              <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">{u.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>{u.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Entity */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900">{entityName}</div>
                          <div>
                            {isAdmin && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 border border-purple-200">
                                ADMIN
                              </span>
                            )}
                            {isSme && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 border border-blue-200">
                                <Building2 className="h-3 w-3" />
                                SME BUSINESS
                              </span>
                            )}
                            {isFi && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 border border-indigo-200">
                                <Landmark className="h-3 w-3" />
                                FINANCIAL INSTITUTION
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category & Location */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-700">
                            {isSme
                              ? u.business?.businessType || 'General Business'
                              : isFi
                              ? u.financialInstitution?.category || 'Credit Provider'
                              : 'System Access'}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{locationSummary}</span>
                          </div>
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td className="px-5 py-4">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 border border-emerald-200">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-700 border border-amber-200 animate-pulse">
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                            Pending Approval
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="px-5 py-4 text-slate-500 text-[11px] font-medium whitespace-nowrap">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Details Button */}
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                            title="View Full Registration Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </button>

                          {/* Approval Toggle */}
                          {isAdmin ? (
                            <span className="text-[11px] font-semibold text-slate-400 px-2">Super Admin</span>
                          ) : isApproved ? (
                            <button
                              onClick={() => handleToggleApproval(u.id, false)}
                              disabled={actionLoadingId === u.id}
                              className="flex h-8 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                              title="Revoke User Access"
                            >
                              {actionLoadingId === u.id ? (
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
                              <span>Revoke</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleApproval(u.id, true)}
                              disabled={actionLoadingId === u.id}
                              className="flex h-8 items-center gap-1.5 rounded-lg bg-[#0f74e7] px-3 text-xs font-extrabold text-white shadow-sm hover:bg-[#0d67cf] transition-all hover:shadow-[0_4px_12px_rgba(15,116,231,0.25)] disabled:opacity-50"
                              title="Approve User for Full Access"
                            >
                              {actionLoadingId === u.id ? (
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              ) : (
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              )}
                              <span>Approve</span>
                            </button>
                          )}

                          {/* Delete User Button */}
                          {currentUser?.id !== u.id && (
                            <button
                              onClick={() => setUserToDelete(u)}
                              disabled={actionLoadingId === u.id || isDeleting}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-40"
                              title="Delete User Account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Modal Header */}
              <div className="flex items-start gap-4 pr-8">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-black ${
                    selectedUser.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700'
                      : selectedUser.role === 'FINANCIAL_INSTITUTION'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {(
                    selectedUser.business?.businessName ||
                    selectedUser.financialInstitution?.institutionName ||
                    selectedUser.email
                  )
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                    {selectedUser.business?.businessName ||
                      selectedUser.financialInstitution?.institutionName ||
                      'User Account Details'}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-500">{selectedUser.email}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-slate-500">{selectedUser.phone}</span>
                  </div>
                </div>
              </div>

              {/* Status Banner inside modal */}
              <div className="mt-6 flex items-center justify-between rounded-2xl border p-4 bg-slate-50">
                <div className="flex items-center gap-3">
                  {selectedUser.is_approved ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                      <Clock className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {selectedUser.is_approved ? 'Full Platform Access Enabled' : 'Pending Administrative Approval'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {selectedUser.is_approved
                        ? 'This user can log in and access all workspace tools without restrictions.'
                        : 'Currently restricted to pilot holding screen upon login.'}
                    </div>
                  </div>
                </div>

                {selectedUser.role !== 'ADMIN' && (
                  <button
                    onClick={() => handleToggleApproval(selectedUser.id, !selectedUser.is_approved)}
                    disabled={actionLoadingId === selectedUser.id}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition shadow-sm ${
                      selectedUser.is_approved
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        : 'bg-[#0f74e7] text-white hover:bg-[#0d67cf]'
                    }`}
                  >
                    {actionLoadingId === selectedUser.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : selectedUser.is_approved ? (
                      <>
                        <X className="h-4 w-4" />
                        <span>Revoke Access</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 stroke-[3]" />
                        <span>Approve User</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Detailed Breakdown */}
              <div className="mt-6 space-y-5">
                {/* SME Specific Details */}
                {selectedUser.business && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      SME Enterprise Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Owner / Representative</span>
                        <div className="mt-1 font-bold text-slate-900">{selectedUser.business.ownerName}</div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Business Category</span>
                        <div className="mt-1 font-bold text-slate-900">{selectedUser.business.businessType}</div>
                      </div>
                    </div>

                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 pt-2">
                      Geographic Location Breakdown
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Province</span>
                        <div className="mt-1 font-bold text-slate-900">{selectedUser.business.province}</div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">District</span>
                        <div className="mt-1 font-bold text-slate-900">{selectedUser.business.district}</div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Sector</span>
                        <div className="mt-1 font-bold text-slate-900">{selectedUser.business.sector}</div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Cell</span>
                        <div className="mt-1 font-bold text-slate-900">{selectedUser.business.cell}</div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Village</span>
                        <div className="mt-1 font-bold text-slate-900">{selectedUser.business.village}</div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Landmark</span>
                        <div className="mt-1 font-bold text-slate-900">{selectedUser.business.knownPlace || 'None specified'}</div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-700">
                        <MapPin className="h-4 w-4 text-[#0f74e7]" />
                        <span>
                          <strong>GPS Coordinates:</strong> {selectedUser.business.latitude}, {selectedUser.business.longitude}
                        </span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${selectedUser.business.latitude},${selectedUser.business.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] font-bold text-[#0f74e7] hover:underline"
                      >
                        <span>Open Map</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Financial Institution Specific Details */}
                {selectedUser.financialInstitution && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Financial Institution Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Official Representative</span>
                        <div className="mt-1 font-bold text-slate-900">
                          {selectedUser.financialInstitution.representativeName}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                        <div className="mt-1 font-bold text-slate-900">
                          {selectedUser.financialInstitution.category}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">License Number</span>
                        <div className="mt-1 font-bold text-slate-900">
                          {selectedUser.financialInstitution.licenseNumber}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Operating Scope</span>
                        <div className="mt-1 font-bold text-slate-900">
                          {selectedUser.financialInstitution.operatingScope}
                        </div>
                      </div>
                    </div>

                    {selectedUser.financialInstitution.website && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Institution Website:</span>
                        <a
                          href={selectedUser.financialInstitution.website}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 font-bold text-[#0f74e7] hover:underline"
                        >
                          <span>{selectedUser.financialInstitution.website}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
                {currentUser?.id !== selectedUser.id ? (
                  <button
                    onClick={() => {
                      const user = selectedUser;
                      setSelectedUser(null);
                      setUserToDelete(user);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete User Account</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  onClick={() => setSelectedUser(null)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete User Confirmation Modal */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 font-heading">
                    Delete User Account?
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    This action is permanent and cannot be undone. All related profiles (such as enterprise business details, financial institution records, and credentials) will be permanently erased.
                  </p>
                </div>
              </div>

              {/* User details summary card */}
              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs">
                <div className="font-extrabold text-slate-900">
                  {userToDelete.business?.businessName ||
                    userToDelete.financialInstitution?.institutionName ||
                    userToDelete.business?.ownerName ||
                    userToDelete.financialInstitution?.representativeName ||
                    'Registered Account'}
                </div>
                <div className="mt-1 flex items-center gap-2 text-slate-500">
                  <span>{userToDelete.email}</span>
                  <span>•</span>
                  <span className="font-bold text-slate-700">{userToDelete.role}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete User</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

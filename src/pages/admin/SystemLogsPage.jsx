import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Layout from '../../components/Layout';
import { Icon } from '@iconify/react';

const LOG_LIMIT = 500;
const PAGE_SIZE = 10;
const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'register', label: 'Register' },
  { value: 'individual_create', label: 'Individual — Create' },
  { value: 'individual_update', label: 'Individual — Update' },
  { value: 'fca_create', label: 'FCA — Create' },
  { value: 'fca_update', label: 'FCA — Update' },
  { value: 'form_delete', label: 'Form — Delete' },
];

function formatTimestamp(ts) {
  if (!ts) return '—';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleString('en-PH', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

/** Human-readable details per action type (no raw JSON). */
function formatDetails(action, details) {
  if (!details || typeof details !== 'object') return null;
  const formId = details.formId ?? details.id;
  const type = details.type; // 'individuals' | 'fcas' for form_delete
  if (action === 'individual_create' || action === 'individual_update') {
    return formId ? { label: 'Individual form', value: formId } : null;
  }
  if (action === 'fca_create' || action === 'fca_update') {
    return formId ? { label: 'FCA form', value: formId } : null;
  }
  if (action === 'form_delete' && type) {
    const typeLabel = type === 'individuals' ? 'Individual' : type === 'fcas' ? 'FCA' : type;
    return formId ? { label: `Deleted: ${typeLabel}`, value: formId } : { label: `Deleted: ${typeLabel}`, value: '' };
  }
  return null;
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterAction, setFilterAction] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const q = query(
      collection(db, 'systemLogs'),
      orderBy('timestamp', 'desc'),
      limit(LOG_LIMIT)
    );
    getDocs(q)
      .then((snap) => {
        if (cancelled) return;
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setLogs(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load logs');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = logs.filter((log) => {
    if (filterAction && log.action !== filterAction) return false;
    if (filterEmail) {
      const email = (log.userEmail || '').toLowerCase();
      if (!email.includes(filterEmail.toLowerCase())) return false;
    }
    const ts = log.timestamp?.toDate ? log.timestamp.toDate() : (log.timestamp ? new Date(log.timestamp) : null);
    if (ts) {
      if (filterDateFrom && ts < new Date(filterDateFrom + 'T00:00:00')) return false;
      if (filterDateTo && ts > new Date(filterDateTo + 'T23:59:59.999')) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const actionLabel = (action) => ACTION_OPTIONS.find((o) => o.value === action)?.label || action;

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500 min-w-0 overflow-x-hidden">
        <div className="relative rounded-2xl bg-white border border-slate-300 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#2E749E]/5 via-[#A7D9F7]/5 to-transparent pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8">
            <div className="flex items-center gap-5">
              <div className="hidden sm:flex w-14 h-14 rounded-xl bg-[#F2F8ED] border border-[#A7D9F7]/60 items-center justify-center shrink-0">
                <Icon icon="mdi:clipboard-list-outline" className="text-3xl text-[#2E749E]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                  System Logs
                </h1>
                <p className="text-sm text-slate-800 mt-1.5">Activity log for logins, form changes, and deletions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-slate-300 shadow-sm">
          <select
            value={filterAction}
            onChange={handleFilterChange(setFilterAction)}
            className="py-2 pl-3 pr-9 rounded-xl text-sm font-medium bg-slate-50 border border-slate-300 text-slate-700 focus:ring-2 focus:ring-[#2E749E]/30 focus:border-[#2E749E]/50 outline-none"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search by email..."
            value={filterEmail}
            onChange={handleFilterChange(setFilterEmail)}
            className="py-2 px-3 rounded-xl text-sm border border-slate-300 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-[#2E749E]/30 focus:border-[#2E749E]/50 outline-none w-48"
          />
          <input
            type="date"
            value={filterDateFrom}
            onChange={handleFilterChange(setFilterDateFrom)}
            className="py-2 px-3 rounded-xl text-sm border border-slate-300 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-[#2E749E]/30 outline-none"
            title="From date"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={handleFilterChange(setFilterDateTo)}
            className="py-2 px-3 rounded-xl text-sm border border-slate-300 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-[#2E749E]/30 outline-none"
            title="To date"
          />
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <Icon icon="mdi:alert-circle-outline" className="text-lg shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-[#2E749E]/30 border-t-[#2E749E] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-300 bg-white shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Action</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Province</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No logs match the filters.
                    </td>
                  </tr>
                ) : (
                  paginated.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[#2E749E]/10 text-[#2E749E]">
                          {actionLabel(log.action)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{log.userEmail || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{log.role || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{log.province || '—'}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {(() => {
                          const formatted = formatDetails(log.action, log.details);
                          if (formatted) {
                            return <span className="font-medium text-slate-800">{formatted.label}</span>;
                          }
                          return '—';
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <p className="text-xs text-slate-500">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} entries
              {logs.length !== filtered.length ? ` (${logs.length} total loaded)` : ''}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <Icon icon="mdi:chevron-double-left" className="text-base" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <Icon icon="mdi:chevron-left" className="text-base" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-sm select-none">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium border transition-colors ${
                        p === safePage
                          ? 'bg-[#2E749E] text-white border-[#2E749E] shadow-sm'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <Icon icon="mdi:chevron-right" className="text-base" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <Icon icon="mdi:chevron-double-right" className="text-base" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

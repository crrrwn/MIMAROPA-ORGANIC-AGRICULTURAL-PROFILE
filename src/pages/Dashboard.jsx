import { useState, Fragment, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Icon } from '@iconify/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Layout from '../components/Layout';
import { FileList } from '../components/FileUpload';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useDashboardDataByProvince } from '../hooks/useDashboardDataByProvince';
import { useFormEntries } from '../hooks/useFormEntries';
import { PROVINCES } from '../constants';

const COLORS = ['#84C444', '#1E78D1', '#8D5A38', '#A3D2EA', '#346A8E', '#F4F8EB'];
const CHART_GRID = '#E0EDF5';
const CHART_AXIS = '#5D4037';
const tooltipStyle = {
  borderRadius: 12,
  padding: '10px 14px',
  border: '2px solid #B3E5FC',
  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
  backgroundColor: '#FFF8E1',
};
const PAGE_SIZE = 20;

export default function Dashboard() {
  const { isAdmin, getProvince } = useAuth();
  const { showNotification } = useNotification();
  const [selectedProvince, setSelectedProvince] = useState(isAdmin() ? null : getProvince());
  const [selectedYear, setSelectedYear] = useState(null);
  const province = isAdmin() ? selectedProvince : getProvince();
  const { data, perProvince, loading, error } = useDashboardDataByProvince(province, selectedYear);

  const currentYear = new Date().getFullYear();
  const yearOptions = [null, ...Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i)];
  const { individuals, fcas, refresh } = useFormEntries(province);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [formTab, setFormTab] = useState('individual');
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: null });
  const [commodityBreakdown, setCommodityBreakdown] = useState(null);
  const [individualPage, setIndividualPage] = useState(1);
  const [fcaPage, setFcaPage] = useState(1);
  const location = useLocation();

  const totalIndividualPages = Math.max(1, Math.ceil(individuals.length / PAGE_SIZE));
  const totalFcaPages = Math.max(1, Math.ceil(fcas.length / PAGE_SIZE));
  const safeIndividualPage = Math.min(individualPage, totalIndividualPages);
  const safeFcaPage = Math.min(fcaPage, totalFcaPages);
  const individualStart = (safeIndividualPage - 1) * PAGE_SIZE;
  const fcaStart = (safeFcaPage - 1) * PAGE_SIZE;
  const paginatedIndividuals = individuals.slice(individualStart, individualStart + PAGE_SIZE);
  const paginatedFcas = fcas.slice(fcaStart, fcaStart + PAGE_SIZE);

  useEffect(() => {
    if (location.hash === '#individual-form') {
      const el = document.getElementById('individual-form');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location]);

  const handlePrevIndividuals = () => {
    setIndividualPage((p) => Math.max(1, p - 1));
  };

  const handleNextIndividuals = () => {
    setIndividualPage((p) => Math.min(totalIndividualPages, p + 1));
  };

  const handlePrevFcas = () => {
    setFcaPage((p) => Math.max(1, p - 1));
  };

  const handleNextFcas = () => {
    setFcaPage((p) => Math.min(totalFcaPages, p + 1));
  };

  const handleTabSwitch = (tab) => {
    setFormTab(tab);
    setExpandedId(null);
    if (tab === 'individual') {
      setIndividualPage(1);
    } else {
      setFcaPage(1);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id || !deleteConfirm.type) return;
    try {
      await deleteDoc(doc(db, deleteConfirm.type, deleteConfirm.id));
      refresh();
      setDeleteConfirm({ show: false, id: null, type: null });
      showNotification('Form deleted successfully.');
    } catch (err) {
      alert(err.message);
    }
  };

  const commoditiesData = [
    { name: 'Rice', key: 'rice', value: data.commodities?.rice?.totalArea ?? 0 },
    { name: 'Corn', key: 'corn', value: data.commodities?.corn?.totalArea ?? 0 },
    { name: 'Vegetables', key: 'vegetables', value: data.commodities?.vegetables?.totalArea ?? 0 },
    { name: 'Livestock & Poultry', key: 'livestockPoultry', value: data.commodities?.livestockPoultry?.totalArea ?? 0 },
    { name: 'Fertilizer', key: 'fertilizer', value: data.commodities?.fertilizer?.totalArea ?? 0 },
    { name: 'Others', key: 'others', value: data.commodities?.others?.totalArea ?? 0 },
  ].filter((d) => d.value > 0);

  const sharedFacilitiesData = Object.entries(data.fcas?.sharedFacilitiesByType || {})
    .filter(([, value]) => Number(value) > 0)
    .map(([name, value]) => ({ name, value: Number(value) }));

  const machineryData = Object.entries(data.fcas?.machineryByType || {})
    .filter(([, value]) => Number(value) > 0)
    .map(([name, value]) => ({ name, value: Number(value) }));

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome / Header strip */}
        <div className="relative rounded-2xl bg-gradient-to-r from-palette-cream via-palette-cream/95 to-palette-sky/30 border border-palette-sky/30 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-11 h-11 rounded-xl bg-gradient-to-br from-palette-green/25 to-palette-green/10 border border-palette-green/30 items-center justify-center">
                <Icon icon="mdi:view-dashboard" className="text-xl text-palette-green" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-palette-brown tracking-tight">
                  Dashboard {province ? `— ${province}` : '(All Provinces)'}
                </h1>
                <p className="text-sm text-palette-slate mt-1">Organic Agriculture profile overview</p>
              </div>
            </div>
            {!isAdmin() && (
              <button
                onClick={() => setShowEntryModal(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-palette-green text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl border-2 border-palette-green/80 hover:bg-palette-green/90"
              >
                <Icon icon="mdi:plus-circle" className="text-lg" />
                New Entry
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 p-3 bg-white/80 rounded-2xl w-fit border-2 border-palette-sky/30 shadow-md">
          <label className="flex items-center gap-2 text-sm font-semibold text-palette-brown shrink-0">
            <Icon icon="mdi:calendar" className="text-lg text-palette-green" />
            Year:
          </label>
          <select
            value={selectedYear ?? ''}
            onChange={(e) => setSelectedYear(e.target.value === '' ? null : Number(e.target.value))}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-palette-sky/40 bg-white text-palette-brown focus:ring-2 focus:ring-palette-green/30 focus:border-palette-green outline-none"
          >
            <option value="">All Years</option>
            {yearOptions.filter((y) => y !== null).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {isAdmin() && (
            <>
              <span className="text-palette-slate/60 text-sm font-medium shrink-0">|</span>
              <button
                onClick={() => setSelectedProvince(null)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${selectedProvince === null ? 'bg-palette-green text-white shadow-md' : 'text-palette-slate hover:text-palette-brown hover:bg-palette-cream/60'}`}
              >
                All Provinces
              </button>
              {PROVINCES.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedProvince(p)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${selectedProvince === p ? 'bg-palette-green text-white shadow-md' : 'text-palette-slate hover:text-palette-brown hover:bg-palette-cream/60'}`}
                >
                  {p}
                </button>
              ))}
            </>
          )}
        </div>

        {deleteConfirm.show && createPortal(
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[9999] p-4" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border-2 border-red-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <Icon icon="mdi:delete-alert" className="text-lg text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-palette-brown">Delete Form</h2>
              </div>
              <p className="text-palette-slate mb-6">Are you sure you want to delete this form? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm({ show: false, id: null, type: null })}
                  className="flex-1 py-2.5 border-2 border-palette-sky/50 rounded-xl text-palette-brown font-medium hover:bg-palette-cream/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {showEntryModal && createPortal(
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[9999] p-4" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border-2 border-palette-sky/40" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-palette-green/20 flex items-center justify-center border border-palette-green/30">
                  <Icon icon="mdi:plus-box-multiple" className="text-lg text-palette-green" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-palette-brown">Select Form</h2>
                  <p className="text-sm text-palette-slate">Choose a form type to encode</p>
                </div>
              </div>
              <div className="space-y-3 mt-4">
                <Link
                  to="/entry/individual"
                  className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-palette-green text-white rounded-xl font-semibold hover:bg-palette-green/90 shadow-md border-2 border-palette-green/80"
                >
                  <Icon icon="mdi:account-edit" className="text-lg" />
                  Individual OA Profile
                </Link>
                <Link
                  to="/entry/fca"
                  className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-palette-cream border-2 border-palette-sky/50 text-palette-brown rounded-xl font-semibold hover:bg-palette-sky/20"
                >
                  <Icon icon="mdi:account-group" className="text-lg" />
                  FCA Form
                </Link>
              </div>
              <button onClick={() => setShowEntryModal(false)} className="mt-4 w-full py-2.5 border-2 border-palette-sky/50 rounded-xl text-palette-brown font-medium hover:bg-palette-cream/50">
                Cancel
              </button>
            </div>
          </div>,
          document.body
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <Icon icon="mdi:alert-circle" className="text-xl shrink-0" />
            {error} — Make sure Firestore rules allow read access for authenticated users.
          </div>
        )}

        {/* Individual Form — magkakasama */}
        <section id="individual-form" className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-palette-green/20 flex items-center justify-center border border-palette-green/40">
              <Icon icon="mdi:account-edit" className="text-lg text-palette-green" />
            </div>
            <h2 className="text-xl font-bold text-palette-brown">Individual Form</h2>
          </div>
        <div className="bg-white rounded-2xl border-2 border-palette-sky/30 shadow-xl p-6 border-l-4 border-l-palette-green">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-palette-green/20 to-palette-sky/20 flex items-center justify-center border border-palette-sky/30">
                <Icon icon="mdi:account-group" className="text-lg text-palette-blue" />
              </div>
              <h3 className="font-bold text-palette-brown text-lg">OA Practitioners</h3>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <MetricCard title="Devoted Farmers" value={data.practitioners.totalDevoted} />
            <MetricCard title="PGS Certified" value={data.practitioners.totalPGSCertified} />
            <MetricCard title="3rd Party Certified" value={data.practitioners.total3rdParty} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 pt-4 border-t border-palette-sky/20">
            <MetricCard title="Male Practitioners" value={data.practitioners.totalMale ?? 0} />
            <MetricCard title="Female Practitioners" value={data.practitioners.totalFemale ?? 0} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-palette-sky/30 shadow-lg p-6 border-l-4 border-l-palette-blue">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-palette-blue/10 flex items-center justify-center border border-palette-sky/30">
              <Icon icon="mdi:certificate" className="text-lg text-palette-blue" />
            </div>
            <h3 className="font-bold text-palette-brown text-lg">OA Area</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard title="Devoted OA Area (ha)" value={data.oaArea.totalDevoted.toFixed(2)} />
            <MetricCard title="PGS Certified (ha)" value={data.oaArea.totalPGSCertified.toFixed(2)} />
            <MetricCard title="3rd Party (ha)" value={data.oaArea.total3rdParty.toFixed(2)} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-palette-sky/30 shadow-lg p-6 border-l-4 border-l-palette-brown">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-palette-brown/10 flex items-center justify-center border border-palette-sky/30">
              <Icon icon="mdi:chart-pie" className="text-lg text-palette-brown" />
            </div>
            <h3 className="font-bold text-palette-brown text-lg">Commodities — Total Area (ha)</h3>
          </div>
          {commoditiesData.length > 0 ? (
            <div className="rounded-xl bg-gradient-to-b from-palette-cream/40 to-palette-sky/20 p-4 border border-palette-sky/30">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <Pie
                    data={commoditiesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={96}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="#fff"
                    strokeWidth={2}
                    label={({ name, value }) => `${name}: ${Number(value).toFixed(2)} ha`}
                    labelLine={{ stroke: CHART_AXIS, strokeWidth: 1 }}
                    onClick={(entry) => {
                      const items = data.commodities?.[entry.key]?.items || [];
                      if (items.length > 0) setCommodityBreakdown({ name: entry.name, items });
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {commoditiesData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${Number(v).toFixed(2)} ha`, 'Total Area']}
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: CHART_AXIS, fontWeight: 600 }}
                    labelStyle={{ color: CHART_AXIS, fontWeight: 600 }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 8 }}
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => <span style={{ color: CHART_AXIS, fontSize: 12, fontWeight: 500 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-palette-slate text-center py-8">No commodity data yet</p>
          )}
          <p className="text-xs text-palette-slate mt-2">Click on a segment to view breakdown</p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-palette-sky/30 shadow-xl p-6 border-l-4 border-l-palette-green">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-palette-green/20 to-palette-sky/20 flex items-center justify-center border border-palette-sky/30">
              <Icon icon="mdi:certificate-outline" className="text-lg text-palette-green" />
            </div>
            <h3 className="font-bold text-palette-brown text-lg">PGS (Individual)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <MetricCard title="PGS Certified Farmers" value={data.pgs.certifiedFarmers} />
            <MetricCard title="PGS Certified Area (ha)" value={data.pgs.certifiedArea.toFixed(2)} />
          </div>
        </div>
        </section>

        {commodityBreakdown && createPortal(
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', minHeight: '100dvh' }}
            onClick={() => setCommodityBreakdown(null)}
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border-2 border-palette-sky/40" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-palette-green/20 flex items-center justify-center border border-palette-green/30">
                  <Icon icon="mdi:chart-box-outline" className="text-lg text-palette-green" />
                </div>
                <h2 className="text-lg font-bold text-palette-brown">Breakdown: {commodityBreakdown.name}</h2>
              </div>
              <div className="overflow-y-auto flex-1 rounded-lg border border-palette-sky/20">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-palette-sky/30 bg-palette-cream/50">
                      <th className="text-left py-3 px-3 text-palette-brown font-semibold">Name</th>
                      <th className="text-left py-3 px-3 text-palette-brown font-semibold">Products</th>
                      <th className="text-left py-3 px-3 text-palette-brown font-semibold">Area (ha)</th>
                      <th className="text-left py-3 px-3 text-palette-brown font-semibold">Volume (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commodityBreakdown.items.map((item, i) => (
                      <tr key={i} className="border-b border-palette-sky/10 hover:bg-palette-cream/30">
                        <td className="py-2.5 px-3 text-palette-brown">{item.name}</td>
                        <td className="py-2.5 px-3 text-palette-slate">{item.products}</td>
                        <td className="py-2.5 px-3 text-palette-brown">{Number(item.area || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-palette-slate">{Number(item.volume || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setCommodityBreakdown(null)} className="mt-4 py-2.5 px-4 border-2 border-palette-sky/50 rounded-xl text-palette-brown font-medium hover:bg-palette-cream/50 self-end">Close</button>
            </div>
          </div>,
          document.body
        )}

        {/* FCA Form — isang card */}
        <div className="bg-white rounded-2xl border-2 border-palette-sky/30 shadow-xl p-6 border-l-4 border-l-palette-blue">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-palette-blue/10 flex items-center justify-center border border-palette-sky/30">
              <Icon icon="mdi:account-group" className="text-lg text-palette-blue" />
            </div>
            <h3 className="font-bold text-palette-brown text-lg">FCA Form</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <MetricCard title="PGS Accredited Groups" value={data.pgs.accreditedGroups} />
            <MetricCard title="PGS Applicant" value={data.pgs.applyingForAccreditation} />
            <MetricCard title="Engaged Organic Farming" value={data.pgs.engagedOrganicFarming ?? 0} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 pt-4 border-t border-palette-sky/20">
            <MetricCard title="Organic Members (Male)" value={data.fcas.organicMembersMale ?? 0} />
            <MetricCard title="Organic Members (Female)" value={data.fcas.organicMembersFemale ?? 0} />
          </div>

          <div className="mt-6 pt-6 border-t border-palette-sky/20">
            <h4 className="font-semibold text-palette-brown mb-3 flex items-center gap-2">
              <Icon icon="mdi:chart-pie" className="text-palette-blue" />
              Shared Facilities and Capacities
            </h4>
            {sharedFacilitiesData.length > 0 ? (
              <div className="rounded-xl bg-gradient-to-b from-palette-cream/40 to-palette-sky/20 p-4 border border-palette-sky/30">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <Pie
                      data={sharedFacilitiesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={86}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      stroke="#fff"
                      strokeWidth={2}
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={{ stroke: CHART_AXIS, strokeWidth: 1 }}
                    >
                      {sharedFacilitiesData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, 'Count']} contentStyle={tooltipStyle} itemStyle={{ color: CHART_AXIS, fontWeight: 600 }} />
                    <Legend wrapperStyle={{ paddingTop: 8 }} iconType="circle" iconSize={10} formatter={(value) => <span style={{ color: CHART_AXIS, fontSize: 12, fontWeight: 500 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-palette-slate text-sm text-center py-6">No shared facilities data yet</p>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-palette-sky/20">
            <h4 className="font-semibold text-palette-brown mb-3 flex items-center gap-2">
              <Icon icon="mdi:chart-pie" className="text-palette-blue" />
              Machinery, Equipment, and Other Components
            </h4>
            {machineryData.length > 0 ? (
              <div className="rounded-xl bg-gradient-to-b from-palette-cream/40 to-palette-sky/20 p-4 border border-palette-sky/30">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <Pie
                      data={machineryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={86}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      stroke="#fff"
                      strokeWidth={2}
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={{ stroke: CHART_AXIS, strokeWidth: 1 }}
                    >
                      {machineryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, 'Count']} contentStyle={tooltipStyle} itemStyle={{ color: CHART_AXIS, fontWeight: 600 }} />
                    <Legend wrapperStyle={{ paddingTop: 8 }} iconType="circle" iconSize={10} formatter={(value) => <span style={{ color: CHART_AXIS, fontSize: 12, fontWeight: 500 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-palette-slate text-sm text-center py-6">No machinery data yet</p>
            )}
          </div>
        </div>

        {isAdmin() && selectedProvince === null && Object.keys(perProvince).length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border-2 border-palette-sky/30 shadow-lg p-4 sm:p-5 border-l-4 border-l-palette-blue">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-palette-blue/10 flex items-center justify-center border border-palette-sky/30">
                  <Icon icon="mdi:chart-bar" className="text-lg text-palette-blue" />
                </div>
                <h3 className="font-bold text-palette-brown text-lg">OA Area (ha) by Province</h3>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={PROVINCES.map((p) => {
                    const m = perProvince[p];
                    return {
                      province: p,
                      Devoted: m?.oaArea?.totalDevoted ?? 0,
                      'PGS Certified': m?.oaArea?.totalPGSCertified ?? 0,
                      '3rd Party': m?.oaArea?.total3rdParty ?? 0,
                    };
                  })}
                  margin={{ top: 24, right: 24, left: 16, bottom: 64 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                  <XAxis
                    dataKey="province"
                    angle={-25}
                    textAnchor="end"
                    height={64}
                    tick={{ fontSize: 12, fill: CHART_AXIS, fontWeight: 500 }}
                    axisLine={{ stroke: CHART_AXIS, strokeWidth: 1 }}
                    tickLine={{ stroke: CHART_AXIS }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: CHART_AXIS }}
                    axisLine={{ stroke: CHART_AXIS }}
                    tickLine={{ stroke: CHART_AXIS }}
                    tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                  />
                  <Tooltip
                    formatter={(v) => [`${Number(v).toFixed(2)} ha`, '']}
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: CHART_AXIS, fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 8 }} iconType="square" iconSize={12} formatter={(value) => <span style={{ color: CHART_AXIS, fontSize: 12, fontWeight: 500 }}>{value}</span>} />
                  <Bar dataKey="Devoted" stackId="a" fill={COLORS[0]} name="Devoted (ha)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="PGS Certified" stackId="a" fill={COLORS[1]} name="PGS Certified (ha)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="3rd Party" stackId="a" fill={COLORS[2]} name="3rd Party (ha)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl border-2 border-palette-sky/30 shadow-lg p-4 sm:p-5 border-l-4 border-l-palette-green">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-palette-green/10 flex items-center justify-center border border-palette-sky/30">
                  <Icon icon="mdi:chart-bar" className="text-lg text-palette-blue" />
                </div>
                <h3 className="font-bold text-palette-brown text-lg">Practitioners by Province</h3>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={PROVINCES.map((p) => {
                    const m = perProvince[p];
                    return {
                      province: p,
                      Devoted: m?.practitioners?.totalDevoted ?? 0,
                      'PGS Certified': m?.practitioners?.totalPGSCertified ?? 0,
                      '3rd Party': m?.practitioners?.total3rdParty ?? 0,
                    };
                  })}
                  margin={{ top: 24, right: 24, left: 16, bottom: 64 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                  <XAxis
                    dataKey="province"
                    angle={-25}
                    textAnchor="end"
                    height={64}
                    tick={{ fontSize: 12, fill: CHART_AXIS, fontWeight: 500 }}
                    axisLine={{ stroke: CHART_AXIS, strokeWidth: 1 }}
                    tickLine={{ stroke: CHART_AXIS }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: CHART_AXIS }}
                    axisLine={{ stroke: CHART_AXIS }}
                    tickLine={{ stroke: CHART_AXIS }}
                    tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: CHART_AXIS, fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 8 }} iconType="square" iconSize={12} formatter={(value) => <span style={{ color: CHART_AXIS, fontSize: 12, fontWeight: 500 }}>{value}</span>} />
                  <Bar dataKey="Devoted" stackId="b" fill={COLORS[0]} name="Devoted" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="PGS Certified" stackId="b" fill={COLORS[1]} name="PGS Certified" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="3rd Party" stackId="b" fill={COLORS[2]} name="3rd Party" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border-2 border-palette-sky/30 shadow-xl p-6 border-l-4 border-l-palette-slate">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-palette-blue/20 to-palette-sky/20 flex items-center justify-center border border-palette-sky/30">
                <Icon icon="mdi:file-document-multiple" className="text-lg text-palette-blue" />
              </div>
              <h3 className="font-bold text-palette-brown text-lg">
                {isAdmin() ? 'Encoded Forms (from Provincial Encoders)' : 'My Encoded Forms'}
              </h3>
            </div>
            <div className="flex gap-2 mb-5 p-2 bg-palette-cream/50 rounded-2xl w-fit border-2 border-palette-sky/30">
              <button
                onClick={() => handleTabSwitch('individual')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${formTab === 'individual' ? 'bg-palette-green text-white shadow-md' : 'text-palette-slate hover:text-palette-brown hover:bg-white/80'}`}
              >
                <Icon icon="mdi:account" className="text-base" />
                Individual ({individuals.length})
              </button>
              <button
                onClick={() => handleTabSwitch('fca')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${formTab === 'fca' ? 'bg-palette-green text-white shadow-md' : 'text-palette-slate hover:text-palette-brown hover:bg-white/80'}`}
              >
                <Icon icon="mdi:account-group" className="text-base" />
                FCA ({fcas.length})
              </button>
            </div>
            {formTab === 'individual' ? (
              <div className="overflow-x-auto rounded-2xl border-2 border-palette-sky/20 shadow-inner bg-white/50">
                {individuals.length === 0 ? (
                  <div className="py-16 px-6 text-center">
                    <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-palette-sky/30 to-palette-sky/10 items-center justify-center mb-4 border border-palette-sky/30">
                      <Icon icon="mdi:file-document-outline" className="text-2xl text-palette-slate" />
                    </div>
                    <p className="text-palette-brown font-semibold text-lg">No Individual forms yet</p>
                    <p className="text-sm text-palette-slate mt-1">Click <strong>New Entry</strong> above to add one</p>
                  </div>
                ) : (
                  <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-palette-sky/40 bg-gradient-to-r from-palette-cream/70 to-palette-sky/20">
                        <th className="text-left py-4 px-4 text-xs font-bold text-palette-brown uppercase tracking-wider">Name</th>
                        <th className="text-left py-4 px-4 text-xs font-bold text-palette-brown uppercase tracking-wider">Province</th>
                        <th className="text-left py-4 px-4 text-xs font-bold text-palette-brown uppercase tracking-wider">Certification</th>
                        <th className="text-left py-4 px-4 text-xs font-bold text-palette-brown uppercase tracking-wider">Organic Area</th>
                        <th className="text-left py-4 px-4 text-xs font-bold text-palette-brown uppercase tracking-wider">Date</th>
                        <th className="text-left py-4 px-4 text-xs font-bold text-palette-brown uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedIndividuals.map((row) => (
                        <Fragment key={row.id}>
                          <tr className="border-b border-palette-sky/15 hover:bg-palette-cream/40">
                            <td className="py-3.5 px-4 font-medium text-palette-brown">{row.completeName || [row.surname, row.firstName].filter(Boolean).join(' ')}</td>
                            <td className="py-3.5 px-4 text-palette-slate">{row.province}</td>
                            <td className="py-3.5 px-4 text-palette-slate">{row.certification}</td>
                            <td className="py-3.5 px-4 text-palette-brown">{row.organicArea} ha</td>
                            <td className="py-3.5 px-4 text-palette-slate">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1 items-center">
                                <button
                                  onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                                  title={expandedId === row.id ? 'Hide' : 'View'}
                                  className="p-2.5 rounded-xl text-palette-green hover:bg-palette-green/15 border border-transparent hover:border-palette-green/30"
                                >
                                  <Icon icon={expandedId === row.id ? 'mdi:eye-off' : 'mdi:eye'} className="text-base" />
                                </button>
                                <Link to={`/entry/individual/${row.id}/edit`} title="Edit" className="p-2.5 rounded-xl text-palette-blue hover:bg-palette-blue/15 border border-transparent hover:border-palette-blue/30 inline-flex">
                                  <Icon icon="mdi:pencil" className="text-base" />
                                </Link>
                                {isAdmin() && (
                                  <button
                                    onClick={() => setDeleteConfirm({ show: true, id: row.id, type: 'individuals' })}
                                    title="Delete"
                                    className="p-2.5 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200"
                                  >
                                    <Icon icon="mdi:delete" className="text-base" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedId === row.id && (
                            <tr key={`${row.id}-detail`}>
                              <td colSpan={6} className="bg-palette-cream/50 p-5 border-b-2 border-palette-sky/20">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <p><strong>Sex:</strong> {row.sex}</p>
                                  <p><strong>DOB:</strong> {row.dateOfBirth}</p>
                                  <p><strong>PWD:</strong> {row.pwd}</p>
                                  <p><strong>Civil Status:</strong> {row.civilStatus}</p>
                                  <p><strong>Address:</strong> {row.completeAddress}</p>
                                  <p><strong>Mobile:</strong> {row.mobileNumber}</p>
                                  <p><strong>Years in OA:</strong> {row.yearsInOrganicFarming}</p>
                                  <p><strong>Organic Area:</strong> {row.organicArea} ha</p>
                                  {Array.isArray(row.commodities) && row.commodities.length > 0 && (
                                    <div className="md:col-span-2">
                                      <strong>Commodities:</strong>
                                      <ul className="list-disc ml-4 mt-1">
                                        {row.commodities.map((c, i) => (
                                          <li key={i}>{c.commodity} - {c.products} ({c.sizeOfArea} ha)</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {Array.isArray(row.attachments) && row.attachments.length > 0 && (
                                    <div className="md:col-span-2">
                                      <FileList files={row.attachments} />
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                  {individuals.length > PAGE_SIZE && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 text-xs text-palette-slate gap-2 border-t border-palette-sky/20">
                      <span>
                        {`Showing ${individualStart + 1}-${Math.min(individualStart + PAGE_SIZE, individuals.length)} of ${individuals.length} Individual forms`}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrevIndividuals}
                          disabled={safeIndividualPage === 1}
                          className="px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed border-palette-sky/40 hover:bg-palette-cream/40"
                        >
                          Previous
                        </button>
                        <span className="text-[11px]">
                          Page {safeIndividualPage} of {totalIndividualPages}
                        </span>
                        <button
                          onClick={handleNextIndividuals}
                          disabled={safeIndividualPage === totalIndividualPages}
                          className="px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed border-palette-sky/40 hover:bg-palette-cream/40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border-2 border-palette-sky/20 shadow-inner bg-white/50">
                {fcas.length === 0 ? (
                  <div className="py-16 px-6 text-center">
                    <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-palette-sky/30 to-palette-sky/10 items-center justify-center mb-4 border border-palette-sky/30">
                      <Icon icon="mdi:account-group-outline" className="text-2xl text-palette-slate" />
                    </div>
                    <p className="text-palette-brown font-semibold text-lg">No FCA forms yet</p>
                    <p className="text-sm text-palette-slate mt-1">Click <strong>New Entry</strong> above to add one</p>
                  </div>
                ) : (
                  <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-palette-sky/40 bg-gradient-to-r from-palette-cream/70 to-palette-sky/20">
                        <th className="text-left py-4 px-4 text-xs font-bold text-palette-brown uppercase tracking-wider">FCA Name</th>
                        <th className="text-left py-4 px-4 text-xs font-bold text-palette-brown uppercase tracking-wider">Province</th>
                        <th className="text-left py-4 px-4 text-xs font-bold text-palette-brown uppercase tracking-wider">Certification</th>
                        <th className="text-left py-4 px-4 text-xs font-bold text-palette-brown uppercase tracking-wider">Organic Members</th>
                        <th className="text-left py-4 px-4 text-xs font-bold text-palette-brown uppercase tracking-wider">Date</th>
                        <th className="text-left py-4 px-4 text-xs font-bold text-palette-brown uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedFcas.map((row) => (
                        <Fragment key={row.id}>
                          <tr className="border-b border-palette-sky/15 hover:bg-palette-cream/40">
                            <td className="py-3.5 px-4 font-medium text-palette-brown">{row.nameOfFCA}</td>
                            <td className="py-3.5 px-4 text-palette-slate">{row.province}</td>
                            <td className="py-3.5 px-4 text-palette-slate">{row.certification}</td>
                            <td className="py-3.5 px-4 text-palette-brown">{row.organicMembers}</td>
                            <td className="py-3.5 px-4 text-palette-slate">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1 items-center">
                                <button
                                  onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                                  title={expandedId === row.id ? 'Hide' : 'View'}
                                  className="p-2.5 rounded-xl text-palette-green hover:bg-palette-green/15 border border-transparent hover:border-palette-green/30"
                                >
                                  <Icon icon={expandedId === row.id ? 'mdi:eye-off' : 'mdi:eye'} className="text-base" />
                                </button>
                                <Link to={`/entry/fca/${row.id}/edit`} title="Edit" className="p-2.5 rounded-xl text-palette-blue hover:bg-palette-blue/15 border border-transparent hover:border-palette-blue/30 inline-flex">
                                  <Icon icon="mdi:pencil" className="text-base" />
                                </Link>
                                {isAdmin() && (
                                  <button
                                    onClick={() => setDeleteConfirm({ show: true, id: row.id, type: 'fcas' })}
                                    title="Delete"
                                    className="p-2.5 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200"
                                  >
                                    <Icon icon="mdi:delete" className="text-base" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedId === row.id && (
                            <tr key={`${row.id}-detail`}>
                              <td colSpan={6} className="bg-palette-cream/50 p-5 border-b-2 border-palette-sky/20">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <p><strong>Business Address:</strong> {row.businessAddress}</p>
                                  <p><strong>Barangay/Municipalities:</strong> {row.barangayMunicipalitiesCovered}</p>
                                  <p><strong>Head:</strong> {row.headName} - {row.headDesignation}</p>
                                  <p><strong>Contact:</strong> {row.contactName} - {row.contactMobile}</p>
                                  <p><strong>Organic Members:</strong> {row.organicMembers}</p>
                                  <p><strong>Conventional Members:</strong> {row.conventionalMembers}</p>
                                  <p><strong>Production Area:</strong> {row.locationOfProductionArea}</p>
                                  {Array.isArray(row.attachments) && row.attachments.length > 0 && (
                                    <div className="md:col-span-2">
                                      <FileList files={row.attachments} />
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                  {fcas.length > PAGE_SIZE && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 text-xs text-palette-slate gap-2 border-t border-palette-sky/20">
                      <span>
                        {`Showing ${fcaStart + 1}-${Math.min(fcaStart + PAGE_SIZE, fcas.length)} of ${fcas.length} FCA forms`}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrevFcas}
                          disabled={safeFcaPage === 1}
                          className="px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed border-palette-sky/40 hover:bg-palette-cream/40"
                        >
                          Previous
                        </button>
                        <span className="text-[11px]">
                          Page {safeFcaPage} of {totalFcaPages}
                        </span>
                        <button
                          onClick={handleNextFcas}
                          disabled={safeFcaPage === totalFcaPages}
                          className="px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed border-palette-sky/40 hover:bg-palette-cream/40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                  </>
                )}
              </div>
            )}
          </div>
      </div>
    </Layout>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-palette-sky/30 shadow-lg p-5 hover:shadow-xl hover:border-palette-sky/50">
      <div className="min-w-0">
        <p className="text-xs font-bold text-palette-slate uppercase tracking-wider mb-1.5">
          {title}
        </p>
        <p className="text-2xl font-bold text-palette-brown tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

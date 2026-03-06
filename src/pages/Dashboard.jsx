import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
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
import { useAuth } from '../context/AuthContext';
import { useDashboardDataByProvince } from '../hooks/useDashboardDataByProvince';
import { PROVINCES } from '../constants';

const COLORS = ['#88BC44', '#3E6F8F', '#1E7CC8', '#F1F5E8', '#2a6bb5', '#4a7a6e'];
const CHART_GRID = '#f1f5f9'; // slate-100
const CHART_AXIS = '#64748b'; // slate-500
const tooltipStyle = {
  borderRadius: '16px',
  padding: '12px 16px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  backgroundColor: '#ffffff',
  fontSize: '13px',
  fontWeight: '500',
  color: '#334155'
};

export default function Dashboard() {
  const { isAdmin, getProvince } = useAuth();
  const [selectedProvince, setSelectedProvince] = useState(isAdmin() ? null : getProvince());
  const [selectedYear, setSelectedYear] = useState(null);
  const province = isAdmin() ? selectedProvince : getProvince();
  const { data, perProvince, loading, error } = useDashboardDataByProvince(province, selectedYear);

  const yearOptions = [null, 2030, 2029, 2028, 2027, 2026, 2025];
  const [commodityBreakdown, setCommodityBreakdown] = useState(null);
  const [facilityBreakdown, setFacilityBreakdown] = useState(null);
  const [machineryBreakdown, setMachineryBreakdown] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash;
    if (hash === '#individual-form' || hash === '#fca-form') {
      const id = hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location]);

  const commoditiesData = [
    { name: 'Rice', key: 'rice', value: data.commodities?.rice?.totalArea ?? 0 },
    { name: 'Corn', key: 'corn', value: data.commodities?.corn?.totalArea ?? 0 },
    { name: 'Vegetables', key: 'vegetables', value: data.commodities?.vegetables?.totalArea ?? 0 },
    { name: 'Livestock & Poultry', key: 'livestockPoultry', value: data.commodities?.livestockPoultry?.totalArea ?? 0 },
    { name: 'Fertilizer', key: 'fertilizer', value: data.commodities?.fertilizer?.totalArea ?? 0 },
    { name: 'Others', key: 'others', value: data.commodities?.others?.totalArea ?? 0 },
  ].filter((d) => d.value > 0);

  const sharedFacilitiesData = Object.entries(data.fcas?.sharedFacilitiesByType || {})
    .filter(([, v]) => (typeof v === 'number' ? v : v?.count ?? 0) > 0)
    .map(([name, v]) => ({ name, value: Number(typeof v === 'number' ? v : (v?.count ?? 0)), key: name, items: Array.isArray(v?.items) ? v.items : [] }));

  const machineryData = Object.entries(data.fcas?.machineryByType || {})
    .filter(([, v]) => (typeof v === 'number' ? v : v?.count ?? 0) > 0)
    .map(([name, v]) => ({ name, value: Number(typeof v === 'number' ? v : (v?.count ?? 0)), key: name, items: Array.isArray(v?.items) ? v.items : [] }));

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500 min-w-0 overflow-x-hidden">
        {/* Welcome / Header strip — Dashboard title + All Years dropdown */}
        <div className="relative rounded-2xl bg-white border border-slate-300 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#84BC40]/5 via-[#A7D9F7]/5 to-transparent pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8">
            <div className="flex items-center gap-5">
              <div className="hidden sm:flex w-14 h-14 rounded-xl bg-[#F2F8ED] border border-[#A7D9F7]/60 items-center justify-center shrink-0">
                <Icon icon="mdi:view-dashboard-outline" className="text-3xl text-[#84BC40]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                  Dashboard <span className="text-slate-800 font-bold">{province ? `— ${province}` : '— All Provinces'}</span>
                </h1>
                <p className="text-sm text-slate-800 mt-1.5">MIMAROPA Organic Agriculture Profile Overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Icon icon="mdi:calendar-month" className="text-xl text-slate-600 hidden sm:block" />
              <select
                value={selectedYear ?? ''}
                onChange={(e) => setSelectedYear(e.target.value === '' ? null : Number(e.target.value))}
                className="py-2.5 pl-3 pr-9 rounded-xl text-sm font-semibold bg-slate-50 border border-slate-300 text-slate-700 focus:ring-2 focus:ring-[#84BC40]/30 focus:border-[#84BC40]/50 focus:outline-none cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
              >
                <option value="">All Years</option>
                {yearOptions.filter((y) => y !== null).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Province filters (admin only) */}
        {isAdmin() && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-2xl w-fit border border-slate-300 shadow-sm">
            <div className="flex flex-wrap gap-2 px-1">
              <button
                onClick={() => setSelectedProvince(null)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 active:scale-95 ${selectedProvince === null ? 'bg-[#84BC40] text-white border-[#84BC40] shadow-sm' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 border-slate-300'}`}
              >
                All
              </button>
              {PROVINCES.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedProvince(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 active:scale-95 ${selectedProvince === p ? 'bg-[#84BC40] text-white border-[#84BC40] shadow-sm' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 border-slate-300'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-sm font-medium">
            <Icon icon="mdi:alert-circle" className="text-xl shrink-0" />
            {error} — Make sure Firestore rules allow read access for authenticated users.
          </div>
        )}

        {/* Individual Form Section */}
        <section id="individual-form" className="space-y-6 pt-2">
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-xl bg-[#84BC40]/10 flex items-center justify-center border border-[#84BC40]/30">
              <Icon icon="mdi:account-edit" className="text-xl text-[#84BC40]" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Individual Form Data</h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#84BC40]" />
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-300">
                <Icon icon="mdi:account-group-outline" className="text-xl text-slate-600" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">OA Practitioners</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <MetricCard title="Devoted Farmers" value={data?.practitioners?.totalDevoted ?? 0} icon="mdi:account-heart-outline" />
              <MetricCard title="PGS Certified" value={data?.practitioners?.totalPGSCertified ?? 0} icon="mdi:certificate-outline" />
              <MetricCard title="3rd Party Certified" value={data?.practitioners?.total3rdParty ?? 0} icon="mdi:file-certificate-outline" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 pt-5 border-t border-slate-300">
              <MetricCard title="Male Practitioners" value={data?.practitioners?.totalMale ?? 0} icon="mdi:gender-male" />
              <MetricCard title="Female Practitioners" value={data?.practitioners?.totalFemale ?? 0} icon="mdi:gender-female" />
              <MetricCard title="PWD Practitioners" value={data?.practitioners?.totalPWD ?? 0} icon="mdi:wheelchair-accessibility" />
              <MetricCard title="Senior Citizens" value={data?.practitioners?.totalSeniorCitizen ?? 0} icon="mdi:account-star-outline" />
              <MetricCard title="IP (Indigenous Peoples)" value={data?.practitioners?.totalIP ?? 0} icon="mdi:account-group-outline" />
              <MetricCard title="Youth" value={data?.practitioners?.totalYouth ?? 0} icon="mdi:account-school-outline" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#2E749E]" />
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-300">
                <Icon icon="mdi:map-marker-path" className="text-xl text-slate-600" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">OA Area Breakdown</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <MetricCard title="Devoted OA Area (ha)" value={Number(data?.oaArea?.totalDevoted ?? 0).toFixed(2)} icon="mdi:leaf" />
              <MetricCard title="PGS Certified (ha)" value={Number(data?.oaArea?.totalPGSCertified ?? 0).toFixed(2)} icon="mdi:shield-check-outline" />
              <MetricCard title="3rd Party (ha)" value={Number(data?.oaArea?.total3rdParty ?? 0).toFixed(2)} icon="mdi:shield-star-outline" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#8D4A25]" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-300">
                  <Icon icon="mdi:chart-donut" className="text-xl text-slate-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Commodities — Total Area (ha)</h3>
              </div>
              <p className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300">Click a segment to view breakdown</p>
            </div>
            {commoditiesData.length > 0 ? (
              <div className="rounded-xl bg-slate-50/50 p-4 border border-slate-300">
                <ResponsiveContainer width="100%" height={320} debounce={300}>
                  <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <Pie
                      data={commoditiesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      stroke="#ffffff"
                      strokeWidth={3}
                      label={({ name, value }) => `${name}: ${Number(value).toFixed(2)} ha`}
                      labelLine={{ stroke: CHART_AXIS, strokeWidth: 1 }}
                      onClick={(entry) => {
                        const items = data.commodities?.[entry.key]?.items || [];
                        if (items.length > 0) setCommodityBreakdown({ name: entry.name, items });
                      }}
                      className="cursor-pointer outline-none hover:opacity-90 transition-opacity"
                    >
                      {commoditiesData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${Number(v).toFixed(2)} ha`, 'Total Area']}
                      contentStyle={tooltipStyle}
                      cursor={{fill: 'transparent'}}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: 20 }}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span className="text-slate-600 text-xs font-medium ml-1">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50/50 rounded-xl border border-slate-300 border-dashed">
                <Icon icon="mdi:chart-arc" className="text-4xl text-slate-300 mb-2" />
                <p className="text-slate-500 font-medium text-sm">No commodity data available for this selection.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#84BC40]" />
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-300">
                <Icon icon="mdi:check-decagram-outline" className="text-xl text-slate-600" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">PGS (Individual)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <MetricCard title="PGS Certified Farmers" value={data?.pgs?.certifiedFarmers ?? 0} icon="mdi:account-check-outline" />
              <MetricCard title="PGS Certified Area (ha)" value={Number(data?.pgs?.certifiedArea ?? 0).toFixed(2)} icon="mdi:map-check-outline" />
            </div>
          </div>
        </section>

        {/* Commodity Modal */}
        {commodityBreakdown && createPortal(
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity"
            onClick={() => setCommodityBreakdown(null)}
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-300 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#84BC40]/10 flex items-center justify-center border border-[#84BC40]/30">
                    <Icon icon="mdi:format-list-bulleted-type" className="text-2xl text-[#84BC40]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Breakdown</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{commodityBreakdown.name}</p>
                  </div>
                </div>
                <button onClick={() => setCommodityBreakdown(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  <Icon icon="mdi:close" className="text-2xl" />
                </button>
              </div>
              
              <div className="overflow-y-auto flex-1 rounded-xl border border-slate-300 bg-slate-50/30 scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-sm border-b border-slate-300 text-slate-600 z-10">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Name</th>
                      <th className="py-3.5 px-4 font-semibold">Products</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Area (ha)</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Volume (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {commodityBreakdown.items.map((item, i) => (
                      <tr key={i} className="hover:bg-white transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-800">{item.name}</td>
                        <td className="py-3 px-4 text-slate-500">{item.products}</td>
                        <td className="py-3 px-4 text-slate-800 text-right tabular-nums">{Number(item.area || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-slate-500 text-right tabular-nums">{Number(item.volume || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Shared Facilities Breakdown Modal */}
        {facilityBreakdown && createPortal(
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity" onClick={() => setFacilityBreakdown(null)}>
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-300 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#2E749E]/10 flex items-center justify-center border border-[#2E749E]/30">
                    <Icon icon="mdi:warehouse" className="text-2xl text-[#2E749E]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Shared Facilities — Breakdown</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{facilityBreakdown.name}</p>
                  </div>
                </div>
                <button onClick={() => setFacilityBreakdown(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  <Icon icon="mdi:close" className="text-2xl" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 rounded-xl border border-slate-300 bg-slate-50/30 scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-sm border-b border-slate-300 text-slate-600 z-10">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Name</th>
                      <th className="py-3.5 px-4 font-semibold">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {facilityBreakdown.items.map((item, i) => (
                      <tr key={i} className="hover:bg-white transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-800">{item.fcaName}</td>
                        <td className="py-3 px-4 text-slate-600">{item.typeOfFacilities || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Machinery Breakdown Modal */}
        {machineryBreakdown && createPortal(
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity" onClick={() => setMachineryBreakdown(null)}>
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-300 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#8D4A25]/10 flex items-center justify-center border border-[#8D4A25]/30">
                    <Icon icon="mdi:tractor" className="text-2xl text-[#8D4A25]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Machinery & Equipment — Breakdown</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{machineryBreakdown.name}</p>
                  </div>
                </div>
                <button onClick={() => setMachineryBreakdown(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  <Icon icon="mdi:close" className="text-2xl" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 rounded-xl border border-slate-300 bg-slate-50/30 scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-sm border-b border-slate-300 text-slate-600 z-10">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Name</th>
                      <th className="py-3.5 px-4 font-semibold">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {machineryBreakdown.items.map((item, i) => (
                      <tr key={i} className="hover:bg-white transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-800">{item.fcaName}</td>
                        <td className="py-3 px-4 text-slate-600">{item.type || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* FCA Form Section */}
        <section id="fca-form" className="space-y-6 pt-6 mt-6 border-t border-slate-300">
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-xl bg-[#2E749E]/10 flex items-center justify-center border border-[#2E749E]/30">
              <Icon icon="mdi:account-multiple" className="text-xl text-[#2E749E]" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">FCA Form Data</h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 sm:p-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-[#2E749E]" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <MetricCard title="PGS Accredited Groups" value={data?.pgs?.accreditedGroups ?? 0} icon="mdi:certificate" />
              <MetricCard title="PGS Applicant" value={data?.pgs?.applyingForAccreditation ?? 0} icon="mdi:file-document-edit-outline" />
              <MetricCard title="Engaged Organic Farming" value={data?.pgs?.engagedOrganicFarming ?? 0} icon="mdi:sprout-outline" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 pt-5 border-t border-slate-300">
              <MetricCard title="Organic Members (Male)" value={data?.fcas?.organicMembersMale ?? 0} icon="mdi:gender-male" />
              <MetricCard title="Organic Members (Female)" value={data?.fcas?.organicMembersFemale ?? 0} icon="mdi:gender-female" />
            </div>

            <div className="mt-8 pt-8 border-t border-slate-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-300">
                    <Icon icon="mdi:warehouse" className="text-xl text-slate-600" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg">Shared Facilities and Capacities</h4>
                </div>
                <p className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300">Click a segment to view breakdown</p>
              </div>
              
              {sharedFacilitiesData.length > 0 ? (
                <div className="rounded-xl bg-slate-50/50 p-4 border border-slate-300">
                  <ResponsiveContainer width="100%" height={300} debounce={300}>
                    <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <Pie
                        data={sharedFacilitiesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                        stroke="#ffffff"
                        strokeWidth={3}
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={{ stroke: CHART_AXIS, strokeWidth: 1 }}
                        onClick={(entry) => entry?.items?.length > 0 && setFacilityBreakdown({ name: entry.name, items: entry.items })}
                        className="cursor-pointer outline-none hover:opacity-90 transition-opacity"
                      >
                        {sharedFacilitiesData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [v, 'Count']} contentStyle={tooltipStyle} cursor={{fill: 'transparent'}}/>
                      <Legend wrapperStyle={{ paddingTop: 20 }} iconType="circle" iconSize={8} formatter={(value) => <span className="text-slate-600 text-xs font-medium ml-1">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 bg-slate-50/50 rounded-xl border border-slate-300 border-dashed">
                  <p className="text-slate-500 font-medium text-sm">No shared facilities data yet.</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-300">
                    <Icon icon="mdi:tractor" className="text-xl text-slate-600" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg">Machinery & Equipment</h4>
                </div>
                <p className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300">Click a segment to view breakdown</p>
              </div>

              {machineryData.length > 0 ? (
                <div className="rounded-xl bg-slate-50/50 p-4 border border-slate-300">
                  <ResponsiveContainer width="100%" height={300} debounce={300}>
                    <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <Pie
                        data={machineryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                        stroke="#ffffff"
                        strokeWidth={3}
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={{ stroke: CHART_AXIS, strokeWidth: 1 }}
                        onClick={(entry) => entry?.items?.length > 0 && setMachineryBreakdown({ name: entry.name, items: entry.items })}
                        className="cursor-pointer outline-none hover:opacity-90 transition-opacity"
                      >
                        {machineryData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [v, 'Count']} contentStyle={tooltipStyle} cursor={{fill: 'transparent'}}/>
                      <Legend wrapperStyle={{ paddingTop: 20 }} iconType="circle" iconSize={8} formatter={(value) => <span className="text-slate-600 text-xs font-medium ml-1">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                 <div className="flex flex-col items-center justify-center py-10 px-4 bg-slate-50/50 rounded-xl border border-slate-300 border-dashed">
                  <p className="text-slate-500 font-medium text-sm">No machinery data yet.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Admin Overview Section */}
        {isAdmin() && selectedProvince === null && Object.keys(perProvince).length > 0 && (
          <section className="pt-6 mt-6 border-t border-slate-300">
             <div className="flex items-center gap-3 px-1 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#2E749E] text-white flex items-center justify-center border border-[#2E749E]">
                <Icon icon="mdi:chart-box" className="text-xl" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Regional Overview</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#2E749E]" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-300">
                    <Icon icon="mdi:map-legend" className="text-xl text-slate-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">OA Area (ha) by Province</h3>
                </div>
                <div className="rounded-xl bg-slate-50/50 p-4 border border-slate-300">
                  <ResponsiveContainer width="100%" height={340} debounce={300}>
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
                      margin={{ top: 10, right: 10, left: -10, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                      <XAxis
                        dataKey="province"
                        angle={-35}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 11, fill: CHART_AXIS, fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: CHART_AXIS }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                      />
                      <Tooltip
                        formatter={(v) => [`${Number(v).toFixed(2)} ha`, '']}
                        contentStyle={tooltipStyle}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Legend wrapperStyle={{ paddingTop: 20 }} iconType="circle" iconSize={8} formatter={(value) => <span className="text-slate-600 text-xs font-medium ml-1">{value}</span>} />
                      <Bar dataKey="Devoted" stackId="a" fill={COLORS[0]} name="Devoted (ha)" radius={[0, 0, 0, 0]} maxBarSize={40}/>
                      <Bar dataKey="PGS Certified" stackId="a" fill={COLORS[2]} name="PGS Certified (ha)" radius={[0, 0, 0, 0]} maxBarSize={40}/>
                      <Bar dataKey="3rd Party" stackId="a" fill="#8D4A25" name="3rd Party (ha)" radius={[4, 4, 0, 0]} maxBarSize={40}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#84BC40]" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-300">
                    <Icon icon="mdi:account-group" className="text-xl text-slate-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">Practitioners by Province</h3>
                </div>
                <div className="rounded-xl bg-slate-50/50 p-4 border border-slate-300">
                  <ResponsiveContainer width="100%" height={340} debounce={300}>
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
                      margin={{ top: 10, right: 10, left: -10, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                      <XAxis
                        dataKey="province"
                        angle={-35}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 11, fill: CHART_AXIS, fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: CHART_AXIS }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Legend wrapperStyle={{ paddingTop: 20 }} iconType="circle" iconSize={8} formatter={(value) => <span className="text-slate-600 text-xs font-medium ml-1">{value}</span>} />
                      <Bar dataKey="Devoted" stackId="b" fill={COLORS[0]} name="Devoted" radius={[0, 0, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="PGS Certified" stackId="b" fill={COLORS[2]} name="PGS Certified" radius={[0, 0, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="3rd Party" stackId="b" fill="#8D4A25" name="3rd Party" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-5">
      <div className="flex items-start justify-between min-w-0">
        <div>
          <p className="text-[0.8rem] font-bold text-slate-500 uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-3xl font-extrabold text-slate-800 tabular-nums tracking-tight">
            {value}
          </p>
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-[#84BC40]/10 flex items-center justify-center shrink-0 border border-[#84BC40]/30">
            <Icon icon={icon} className="text-xl text-[#84BC40]" />
          </div>
        )}
      </div>
    </div>
  );
}
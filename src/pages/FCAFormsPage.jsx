import { useState } from 'react';
import { Icon } from '@iconify/react';
import {
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

function MetricCard({ title, value, icon }) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-5 transition-all duration-300 hover:shadow-md hover:border-slate-200 hover:-translate-y-1">
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
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-palette-blue/10 group-hover:text-palette-blue group-hover:border-palette-blue/20 transition-colors">
            <Icon icon={icon} className="text-xl text-slate-400 group-hover:text-palette-blue transition-colors" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function FCAFormsPage() {
  const { isAdmin, getProvince } = useAuth();
  const [selectedProvince, setSelectedProvince] = useState(isAdmin() ? null : getProvince());
  const [selectedYear, setSelectedYear] = useState(null);
  const province = isAdmin() ? selectedProvince : getProvince();
  const { data, error } = useDashboardDataByProvince(province, selectedYear);

  const currentYear = new Date().getFullYear();
  const yearOptions = [null, ...Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i)];

  const sharedFacilitiesData = Object.entries(data.fcas?.sharedFacilitiesByType || {})
    .filter(([, value]) => Number(value) > 0)
    .map(([name, value]) => ({ name, value: Number(value) }));

  const machineryData = Object.entries(data.fcas?.machineryByType || {})
    .filter(([, value]) => Number(value) > 0)
    .map(([name, value]) => ({ name, value: Number(value) }));

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="relative rounded-3xl bg-white border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-palette-blue/10 via-palette-sky/5 to-transparent pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8">
            <div className="flex items-center gap-5">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 items-center justify-center shrink-0">
                <Icon icon="mdi:account-multiple-outline" className="text-3xl text-palette-blue" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                  FCA Forms <span className="text-slate-400 font-medium">{province ? `— ${province}` : '— All Provinces'}</span>
                </h1>
                <p className="text-sm text-slate-500 mt-1.5 font-medium">Summary of FCA data (groups, members, facilities, machinery)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-2 bg-white rounded-2xl w-fit border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 px-3">
            <Icon icon="mdi:calendar-month" className="text-xl text-slate-400" />
            <select
              value={selectedYear ?? ''}
              onChange={(e) => setSelectedYear(e.target.value === '' ? null : Number(e.target.value))}
              className="py-2 pl-1 pr-8 rounded-xl text-sm font-semibold bg-transparent text-slate-700 focus:ring-0 focus:outline-none cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.25rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="">All Years</option>
              {yearOptions.filter((y) => y !== null).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          {isAdmin() && (
            <div className="hidden sm:block w-px h-8 bg-slate-200 mx-1"></div>
          )}

          {isAdmin() && (
            <div className="flex flex-wrap gap-1.5 px-2">
              <button
                onClick={() => setSelectedProvince(null)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${selectedProvince === null ? 'bg-palette-blue text-white shadow-md shadow-palette-blue/20' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                All
              </button>
              {PROVINCES.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedProvince(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${selectedProvince === p ? 'bg-palette-blue text-white shadow-md shadow-palette-blue/20' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-medium">
            <Icon icon="mdi:alert-circle" className="text-xl shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-6 pt-2">
          {/* Main FCA Results Container */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-palette-blue"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <Icon icon="mdi:account-group" className="text-xl text-slate-600" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">FCA Results Summary</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <MetricCard title="PGS Accredited Groups" value={data.pgs.accreditedGroups} icon="mdi:certificate" />
              <MetricCard title="PGS Applicant" value={data.pgs.applyingForAccreditation} icon="mdi:file-document-edit-outline" />
              <MetricCard title="Engaged Organic Farming" value={data.pgs.engagedOrganicFarming ?? 0} icon="mdi:sprout-outline" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 pt-5 border-t border-slate-100">
              <MetricCard title="Organic Members (Male)" value={data.fcas.organicMembersMale ?? 0} icon="mdi:gender-male" />
              <MetricCard title="Organic Members (Female)" value={data.fcas.organicMembersFemale ?? 0} icon="mdi:gender-female" />
            </div>

            {/* Shared Facilities Section */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <Icon icon="mdi:warehouse" className="text-xl text-slate-600" />
                </div>
                <h4 className="font-bold text-slate-800 text-lg">Shared Facilities and Capacities</h4>
              </div>
              
              {sharedFacilitiesData.length > 0 ? (
                <div className="rounded-2xl bg-slate-50/50 p-4 border border-slate-100">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <Pie
                        data={sharedFacilitiesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                        stroke="#ffffff"
                        strokeWidth={3}
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={{ stroke: CHART_AXIS, strokeWidth: 1 }}
                        className="outline-none hover:opacity-90 transition-opacity"
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
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                  <Icon icon="mdi:chart-pie-outline" className="text-4xl text-slate-300 mb-2" />
                  <p className="text-slate-500 font-medium text-sm">No shared facilities data available for this selection.</p>
                </div>
              )}
            </div>

            {/* Machinery Section */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <Icon icon="mdi:tractor" className="text-xl text-slate-600" />
                </div>
                <h4 className="font-bold text-slate-800 text-lg">Machinery, Equipment & Components</h4>
              </div>

              {machineryData.length > 0 ? (
                <div className="rounded-2xl bg-slate-50/50 p-4 border border-slate-100">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <Pie
                        data={machineryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                        stroke="#ffffff"
                        strokeWidth={3}
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={{ stroke: CHART_AXIS, strokeWidth: 1 }}
                        className="outline-none hover:opacity-90 transition-opacity"
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
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                  <Icon icon="mdi:chart-donut-variant" className="text-4xl text-slate-300 mb-2" />
                  <p className="text-slate-500 font-medium text-sm">No machinery data available for this selection.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
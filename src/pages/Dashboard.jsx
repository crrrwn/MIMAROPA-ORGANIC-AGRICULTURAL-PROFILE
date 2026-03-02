import { useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
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

const COLORS = ['#6B8E23', '#1565C0', '#5D4037', '#B3E5FC', '#546E7A', '#8BC34A'];

export default function Dashboard() {
  const { isAdmin, getProvince } = useAuth();
  const { showNotification } = useNotification();
  const [selectedProvince, setSelectedProvince] = useState(isAdmin() ? null : getProvince());
  const province = isAdmin() ? selectedProvince : getProvince();
  const { data, perProvince, loading, error } = useDashboardDataByProvince(province);
  const { individuals, fcas, loading: entriesLoading, refresh } = useFormEntries(province);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [formTab, setFormTab] = useState('individual');
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: null });
  const [commodityBreakdown, setCommodityBreakdown] = useState(null);

  const handleTabSwitch = (tab) => {
    setFormTab(tab);
    setExpandedId(null);
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Icon icon="mdi:loading" className="text-4xl text-oa-green animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Dashboard {province ? `— ${province}` : '(All Provinces)'}
            </h1>
            {!isAdmin() && (
            <button
              onClick={() => setShowEntryModal(true)}
              className="btn-primary"
            >
              <Icon icon="mdi:plus-circle" className="text-xl" />
              New Entry
            </button>
          )}
          </div>

          {isAdmin() && (
            <div className="flex flex-wrap gap-2 p-1 bg-gray-200 rounded-xl w-fit">
              <button
                onClick={() => setSelectedProvince(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedProvince === null ? 'bg-white text-oa-green shadow-sm border border-gray-200' : 'text-gray-700 hover:text-gray-900'}`}
              >
                All Provinces
              </button>
              {PROVINCES.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedProvince(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedProvince === p ? 'bg-white text-oa-green shadow-sm border border-gray-200' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-elevated p-6 max-w-sm w-full border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Form</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this form? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm({ show: false, id: null, type: null })}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showEntryModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-elevated p-6 max-w-sm w-full border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Form</h2>
              <div className="space-y-3">
                <Link
                  to="/entry/individual"
                  className="block w-full py-3 px-4 bg-oa-green hover:bg-oa-green-dark rounded-xl font-medium text-white transition text-center"
                >
                  Individual OA Profile
                </Link>
                <Link
                  to="/entry/fca"
                  className="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-800 transition text-center"
                >
                  FCA Form
                </Link>
              </div>
              <button onClick={() => setShowEntryModal(false)} className="mt-4 w-full py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            {error} - Make sure Firestore rules allow read access for authenticated users.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total Devoted OA Area (ha)"
            value={data.oaArea.totalDevoted.toFixed(2)}
            icon="mdi:map-marker-radius"
          />
          <MetricCard
            title="Total PGS Certified Area (ha)"
            value={data.oaArea.totalPGSCertified.toFixed(2)}
            icon="mdi:certificate"
          />
          <MetricCard
            title="Total 3rd Party Area (ha)"
            value={data.oaArea.total3rdParty.toFixed(2)}
            icon="mdi:badge-account"
          />
          <MetricCard
            title="Total Certified Farmers"
            value={Number(data.practitioners?.totalPGSCertified ?? 0) + Number(data.practitioners?.total3rdParty ?? 0)}
            icon="mdi:account-check"
          />
          <MetricCard
            title="FCAs Engage in OA"
            value={data.fcas.engageInOA}
            icon="mdi:account-group"
          />
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4">OA Practitioners</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard title="Devoted Farmers" value={data.practitioners.totalDevoted} icon="mdi:account" />
            <MetricCard title="PGS Certified" value={data.practitioners.totalPGSCertified} icon="mdi:certificate" />
            <MetricCard title="3rd Party Certified" value={data.practitioners.total3rdParty} icon="mdi:badge-account" />
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4">OA Area by Certification</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard title="Devoted OA Area (ha)" value={data.oaArea.totalDevoted.toFixed(2)} icon="mdi:map-marker-radius" />
            <MetricCard title="PGS Certified (ha)" value={data.oaArea.totalPGSCertified.toFixed(2)} icon="mdi:certificate" />
            <MetricCard title="3rd Party (ha)" value={data.oaArea.total3rdParty.toFixed(2)} icon="mdi:badge-account" />
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Commodities — Total Area (ha)</h3>
          {commoditiesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={commoditiesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${Number(value).toFixed(2)} ha`}
                  onClick={(entry) => {
                    const items = data.commodities?.[entry.key]?.items || [];
                    if (items.length > 0) setCommodityBreakdown({ name: entry.name, items });
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {commoditiesData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${Number(v).toFixed(2)} ha`, 'Total Area']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-600 text-center py-8">No commodity data yet</p>
          )}
          <p className="text-xs text-gray-600 mt-2">Click on a segment to view breakdown</p>
        </div>

        {commodityBreakdown && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setCommodityBreakdown(null)}>
            <div className="bg-white rounded-2xl shadow-elevated p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-gray-100" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Breakdown: {commodityBreakdown.name}</h2>
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-oa-green/20">
                      <th className="text-left py-2 px-2">Name</th>
                      <th className="text-left py-2 px-2">Products</th>
                      <th className="text-left py-2 px-2">Area (ha)</th>
                      <th className="text-left py-2 px-2">Volume (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commodityBreakdown.items.map((item, i) => (
                      <tr key={i} className="border-b border-oa-green/10">
                        <td className="py-2 px-2">{item.name}</td>
                        <td className="py-2 px-2">{item.products}</td>
                        <td className="py-2 px-2">{Number(item.area || 0).toFixed(2)}</td>
                        <td className="py-2 px-2">{Number(item.volume || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setCommodityBreakdown(null)} className="mt-4 py-2 px-4 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium self-end transition">Close</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard title="PGS Accredited Groups" value={data.pgs.accreditedGroups} icon="mdi:shield-check" />
          <MetricCard title="PGS Applying" value={data.pgs.applyingForAccreditation} icon="mdi:clock-outline" />
          <MetricCard title="Engaged Organic Farming" value={data.pgs.engagedOrganicFarming ?? 0} icon="mdi:leaf" />
          <MetricCard title="PGS Certified Farmers" value={data.pgs.certifiedFarmers} icon="mdi:account-check" />
          <MetricCard title="PGS Certified Area (ha)" value={data.pgs.certifiedArea.toFixed(2)} icon="mdi:earth" />
        </div>

        {isAdmin() && selectedProvince === null && Object.keys(perProvince).length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">OA Area (ha) by Province</h3>
              <ResponsiveContainer width="100%" height={280}>
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
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="province" angle={-25} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${Number(v).toFixed(2)} ha`, '']} />
                  <Legend />
                  <Bar dataKey="Devoted" stackId="a" fill={COLORS[0]} name="Devoted (ha)" />
                  <Bar dataKey="PGS Certified" stackId="a" fill={COLORS[1]} name="PGS Certified (ha)" />
                  <Bar dataKey="3rd Party" stackId="a" fill={COLORS[2]} name="3rd Party (ha)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Practitioners by Province</h3>
              <ResponsiveContainer width="100%" height={280}>
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
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="province" angle={-25} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Devoted" stackId="b" fill={COLORS[0]} name="Devoted" />
                  <Bar dataKey="PGS Certified" stackId="b" fill={COLORS[1]} name="PGS Certified" />
                  <Bar dataKey="3rd Party" stackId="b" fill={COLORS[2]} name="3rd Party" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon icon="mdi:file-document-multiple" />
              {isAdmin() ? 'Encoded Forms (from Provincial Encoders)' : 'My Encoded Forms'}
            </h3>
            <div className="flex gap-2 mb-4 p-1 bg-gray-200 rounded-lg w-fit">
              <button
                onClick={() => handleTabSwitch('individual')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${formTab === 'individual' ? 'bg-white text-oa-green shadow-sm border border-gray-200' : 'text-gray-700 hover:text-gray-900'}`}
              >
                Individual Forms ({individuals.length})
              </button>
              <button
                onClick={() => handleTabSwitch('fca')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${formTab === 'fca' ? 'bg-white text-oa-green shadow-sm border border-gray-200' : 'text-gray-700 hover:text-gray-900'}`}
              >
                FCA Forms ({fcas.length})
              </button>
            </div>
            {entriesLoading ? (
              <div className="py-8 text-center text-gray-600">
                <Icon icon="mdi:loading" className="text-2xl animate-spin mx-auto" />
              </div>
            ) : formTab === 'individual' ? (
              <div className="overflow-x-auto">
                {individuals.length === 0 ? (
                  <p className="text-gray-600 py-8 text-center">No Individual forms encoded yet</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Province</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Certification</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Organic Area</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {individuals.map((row) => (
                        <Fragment key={row.id}>
                          <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-2">{row.completeName || [row.surname, row.firstName].filter(Boolean).join(' ')}</td>
                            <td className="py-3 px-2">{row.province}</td>
                            <td className="py-3 px-2">{row.certification}</td>
                            <td className="py-3 px-2">{row.organicArea} ha</td>
                            <td className="py-3 px-2">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</td>
                            <td className="py-3 px-2">
                              <div className="flex flex-wrap gap-2 items-center">
                                <button
                                  onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                                  title={expandedId === row.id ? 'Hide' : 'View'}
                                  className="p-2 rounded-lg text-oa-green hover:bg-oa-green/10 transition"
                                >
                                  <Icon icon={expandedId === row.id ? 'mdi:eye-off' : 'mdi:eye'} className="text-lg" />
                                </button>
                                <Link to={`/entry/individual/${row.id}/edit`} title="Edit" className="p-2 rounded-lg text-oa-blue hover:bg-oa-blue/10 transition inline-flex">
                                  <Icon icon="mdi:pencil" className="text-lg" />
                                </Link>
                                {isAdmin() && (
                                  <button
                                    onClick={() => setDeleteConfirm({ show: true, id: row.id, type: 'individuals' })}
                                    title="Delete"
                                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                                  >
                                    <Icon icon="mdi:delete" className="text-lg" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedId === row.id && (
                            <tr key={`${row.id}-detail`}>
                              <td colSpan={6} className="bg-gray-50 p-4">
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
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {fcas.length === 0 ? (
                  <p className="text-gray-600 py-8 text-center">No FCA forms encoded yet</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">FCA Name</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Province</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Certification</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Organic Members</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fcas.map((row) => (
                        <Fragment key={row.id}>
                          <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-2">{row.nameOfFCA}</td>
                            <td className="py-3 px-2">{row.province}</td>
                            <td className="py-3 px-2">{row.certification}</td>
                            <td className="py-3 px-2">{row.organicMembers}</td>
                            <td className="py-3 px-2">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</td>
                            <td className="py-3 px-2">
                              <div className="flex flex-wrap gap-2 items-center">
                                <button
                                  onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                                  title={expandedId === row.id ? 'Hide' : 'View'}
                                  className="p-2 rounded-lg text-oa-green hover:bg-oa-green/10 transition"
                                >
                                  <Icon icon={expandedId === row.id ? 'mdi:eye-off' : 'mdi:eye'} className="text-lg" />
                                </button>
                                <Link to={`/entry/fca/${row.id}/edit`} title="Edit" className="p-2 rounded-lg text-oa-blue hover:bg-oa-blue/10 transition inline-flex">
                                  <Icon icon="mdi:pencil" className="text-lg" />
                                </Link>
                                {isAdmin() && (
                                  <button
                                    onClick={() => setDeleteConfirm({ show: true, id: row.id, type: 'fcas' })}
                                    title="Delete"
                                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                                  >
                                    <Icon icon="mdi:delete" className="text-lg" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedId === row.id && (
                            <tr key={`${row.id}-detail`}>
                              <td colSpan={6} className="bg-gray-50 p-4">
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
                )}
              </div>
            )}
          </div>
      </div>
    </Layout>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-md p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-oa-green/20 flex items-center justify-center">
          <Icon icon={icon} className="text-xl text-oa-green" />
        </div>
      </div>
    </div>
  );
}

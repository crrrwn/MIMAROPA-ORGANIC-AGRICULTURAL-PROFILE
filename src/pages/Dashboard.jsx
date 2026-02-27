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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useDashboardDataByProvince } from '../hooks/useDashboardDataByProvince';
import { useFormEntries } from '../hooks/useFormEntries';
import { PROVINCES } from '../constants';

const COLORS = ['#4CAF50', '#2196F3', '#6D4C41', '#8BC34A', '#1565C0', '#A1887F'];

export default function Dashboard() {
  const { isAdmin, getProvince } = useAuth();
  const [selectedProvince, setSelectedProvince] = useState(isAdmin() ? null : getProvince());
  const province = isAdmin() ? selectedProvince : getProvince();
  const { data, perProvince, loading, error } = useDashboardDataByProvince(province);
  const { individuals, fcas, loading: entriesLoading, refresh } = useFormEntries(province);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [formTab, setFormTab] = useState('individual');
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: null });

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
    } catch (err) {
      alert(err.message);
    }
  };

  const oaAreaData = [
    { name: 'Devoted OA Area', value: data.oaArea.totalDevoted, fill: COLORS[0] },
    { name: 'PGS Certified', value: data.oaArea.totalPGSCertified, fill: COLORS[1] },
    { name: '3rd Party', value: data.oaArea.total3rdParty, fill: COLORS[2] },
  ];

  const practitionersData = [
    { name: 'Devoted Farmers', value: data.practitioners.totalDevoted },
    { name: 'PGS Certified', value: data.practitioners.totalPGSCertified },
    { name: '3rd Party Certified', value: data.practitioners.total3rdParty },
  ];

  const commoditiesData = [
    { name: 'Rice', value: data.commodities.rice },
    { name: 'Corn', value: data.commodities.corn },
    { name: 'Vegetables', value: data.commodities.vegetables },
    { name: 'Livestock & Poultry', value: data.commodities.livestockPoultry },
    { name: 'Fertilizer', value: data.commodities.fertilizer },
    { name: 'Others', value: data.commodities.others },
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
            <h1 className="text-2xl font-bold text-oa-green-dark">
              Dashboard {province ? `- ${province}` : '(All Provinces)'}
            </h1>
            {!isAdmin() && (
            <button
              onClick={() => setShowEntryModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-oa-green hover:bg-oa-green-dark text-white rounded-lg font-medium shadow transition"
            >
              <Icon icon="mdi:plus-circle" className="text-xl" />
              ENTRY
            </button>
          )}
          </div>

          {isAdmin() && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedProvince(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedProvince === null ? 'bg-oa-green text-white' : 'bg-gray-100 text-oa-brown hover:bg-gray-200'}`}
              >
                All Provinces
              </button>
              {PROVINCES.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedProvince(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedProvince === p ? 'bg-oa-green text-white' : 'bg-gray-100 text-oa-brown hover:bg-gray-200'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
              <h2 className="text-lg font-semibold text-oa-green-dark mb-2">Delete Form</h2>
              <p className="text-oa-brown mb-6">Are you sure you want to delete this form? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm({ show: false, id: null, type: null })}
                  className="flex-1 py-2 border border-oa-brown/30 rounded-lg text-oa-brown"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showEntryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
              <h2 className="text-xl font-semibold text-oa-green-dark mb-4">Select Form</h2>
              <div className="space-y-3">
                <Link
                  to="/entry/individual"
                  className="block w-full py-3 px-4 bg-oa-green/20 hover:bg-oa-green/30 rounded-lg font-medium text-oa-green-dark transition text-center"
                >
                  Individual OA Profile
                </Link>
                <Link
                  to="/entry/fca"
                  className="block w-full py-3 px-4 bg-oa-blue/20 hover:bg-oa-blue/30 rounded-lg font-medium text-oa-blue-dark transition text-center"
                >
                  FCA Form
                </Link>
              </div>
              <button onClick={() => setShowEntryModal(false)} className="mt-4 w-full py-2 border border-oa-brown/30 rounded-lg text-oa-brown">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            title="FCAs Engage in OA"
            value={data.fcas.engageInOA}
            icon="mdi:account-group"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6 border border-oa-green/10">
            <h3 className="font-semibold text-oa-green-dark mb-4">OA Practitioners</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={practitionersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4CAF50" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border border-oa-green/10">
            <h3 className="font-semibold text-oa-green-dark mb-4">OA Area by Certification</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={oaAreaData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#4CAF50" name="Area (ha)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 border border-oa-green/10">
          <h3 className="font-semibold text-oa-green-dark mb-4">Commodities</h3>
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
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {commoditiesData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-oa-brown/70 text-center py-8">No commodity data yet</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="PGS Accredited Groups" value={data.pgs.accreditedGroups} icon="mdi:shield-check" />
          <MetricCard title="PGS Applying" value={data.pgs.applyingForAccreditation} icon="mdi:clock-outline" />
          <MetricCard title="PGS Certified Farmers" value={data.pgs.certifiedFarmers} icon="mdi:account-check" />
          <MetricCard title="PGS Certified Area (ha)" value={data.pgs.certifiedArea.toFixed(2)} icon="mdi:earth" />
        </div>

        {isAdmin() && selectedProvince === null && Object.keys(perProvince).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-6 border border-oa-green/10">
              <h3 className="font-semibold text-oa-green-dark mb-4">OA Area (ha) by Province</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={PROVINCES.map((p) => ({
                    province: p,
                    devoted: (perProvince[p]?.oaArea?.totalDevoted || 0),
                    pgs: (perProvince[p]?.oaArea?.totalPGSCertified || 0),
                    thirdParty: (perProvince[p]?.oaArea?.total3rdParty || 0),
                  }))}
                  margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="province" angle={-25} textAnchor="end" height={70} tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="devoted" fill="#4CAF50" name="Devoted OA" stackId="a" />
                  <Bar dataKey="pgs" fill="#2196F3" name="PGS Certified" stackId="a" />
                  <Bar dataKey="thirdParty" fill="#6D4C41" name="3rd Party" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow p-6 border border-oa-green/10">
              <h3 className="font-semibold text-oa-green-dark mb-4">Practitioners by Province</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={PROVINCES.map((p) => ({
                    province: p,
                    devoted: (perProvince[p]?.practitioners?.totalDevoted || 0),
                    pgs: (perProvince[p]?.practitioners?.totalPGSCertified || 0),
                    thirdParty: (perProvince[p]?.practitioners?.total3rdParty || 0),
                  }))}
                  margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="province" angle={-25} textAnchor="end" height={70} tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="devoted" fill="#4CAF50" name="Devoted" stackId="b" />
                  <Bar dataKey="pgs" fill="#2196F3" name="PGS Certified" stackId="b" />
                  <Bar dataKey="thirdParty" fill="#6D4C41" name="3rd Party" stackId="b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-6 border border-oa-green/10">
            <h3 className="font-semibold text-oa-green-dark mb-4 flex items-center gap-2">
              <Icon icon="mdi:file-document-multiple" />
              {isAdmin() ? 'Encoded Forms (from Provincial Encoders)' : 'My Encoded Forms'}
            </h3>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleTabSwitch('individual')}
                className={`px-4 py-2 rounded-lg font-medium transition ${formTab === 'individual' ? 'bg-oa-green text-white' : 'bg-gray-100 text-oa-brown hover:bg-gray-200'}`}
              >
                Individual Forms ({individuals.length})
              </button>
              <button
                onClick={() => handleTabSwitch('fca')}
                className={`px-4 py-2 rounded-lg font-medium transition ${formTab === 'fca' ? 'bg-oa-green text-white' : 'bg-gray-100 text-oa-brown hover:bg-gray-200'}`}
              >
                FCA Forms ({fcas.length})
              </button>
            </div>
            {entriesLoading ? (
              <div className="py-8 text-center text-oa-brown/70">
                <Icon icon="mdi:loading" className="text-2xl animate-spin mx-auto" />
              </div>
            ) : formTab === 'individual' ? (
              <div className="overflow-x-auto">
                {individuals.length === 0 ? (
                  <p className="text-oa-brown/70 py-8 text-center">No Individual forms encoded yet</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-oa-green/20">
                        <th className="text-left py-3 px-2">Name</th>
                        <th className="text-left py-3 px-2">Province</th>
                        <th className="text-left py-3 px-2">Certification</th>
                        <th className="text-left py-3 px-2">Organic Area</th>
                        <th className="text-left py-3 px-2">Date</th>
                        <th className="text-left py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {individuals.map((row) => (
                        <Fragment key={row.id}>
                          <tr className="border-b border-oa-green/10 hover:bg-oa-cream/30">
                            <td className="py-3 px-2">{row.completeName || [row.surname, row.firstName].filter(Boolean).join(' ')}</td>
                            <td className="py-3 px-2">{row.province}</td>
                            <td className="py-3 px-2">{row.certification}</td>
                            <td className="py-3 px-2">{row.organicArea} ha</td>
                            <td className="py-3 px-2">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</td>
                            <td className="py-3 px-2">
                              <div className="flex flex-wrap gap-2 items-center">
                                <button
                                  onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                                  className="text-oa-green font-medium hover:underline"
                                >
                                  {expandedId === row.id ? 'Hide' : 'View'}
                                </button>
                                <Link to={`/entry/individual/${row.id}/edit`} className="text-oa-blue font-medium hover:underline">
                                  Edit
                                </Link>
                                {isAdmin() && (
                                  <button
                                    onClick={() => setDeleteConfirm({ show: true, id: row.id, type: 'individuals' })}
                                    className="text-red-600 font-medium hover:underline"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedId === row.id && (
                            <tr key={`${row.id}-detail`}>
                              <td colSpan={6} className="bg-oa-cream/20 p-4">
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
                  <p className="text-oa-brown/70 py-8 text-center">No FCA forms encoded yet</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-oa-green/20">
                        <th className="text-left py-3 px-2">FCA Name</th>
                        <th className="text-left py-3 px-2">Province</th>
                        <th className="text-left py-3 px-2">Certification</th>
                        <th className="text-left py-3 px-2">Organic Members</th>
                        <th className="text-left py-3 px-2">Date</th>
                        <th className="text-left py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fcas.map((row) => (
                        <Fragment key={row.id}>
                          <tr className="border-b border-oa-green/10 hover:bg-oa-cream/30">
                            <td className="py-3 px-2">{row.nameOfFCA}</td>
                            <td className="py-3 px-2">{row.province}</td>
                            <td className="py-3 px-2">{row.certification}</td>
                            <td className="py-3 px-2">{row.organicMembers}</td>
                            <td className="py-3 px-2">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</td>
                            <td className="py-3 px-2">
                              <div className="flex flex-wrap gap-2 items-center">
                                <button
                                  onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                                  className="text-oa-green font-medium hover:underline"
                                >
                                  {expandedId === row.id ? 'Hide' : 'View'}
                                </button>
                                <Link to={`/entry/fca/${row.id}/edit`} className="text-oa-blue font-medium hover:underline">
                                  Edit
                                </Link>
                                {isAdmin() && (
                                  <button
                                    onClick={() => setDeleteConfirm({ show: true, id: row.id, type: 'fcas' })}
                                    className="text-red-600 font-medium hover:underline"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedId === row.id && (
                            <tr key={`${row.id}-detail`}>
                              <td colSpan={6} className="bg-oa-cream/20 p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <p><strong>Business Address:</strong> {row.businessAddress}</p>
                                  <p><strong>Barangay/Municipalities:</strong> {row.barangayMunicipalitiesCovered}</p>
                                  <p><strong>Head:</strong> {row.headName} - {row.headDesignation}</p>
                                  <p><strong>Contact:</strong> {row.contactName} - {row.contactMobile}</p>
                                  <p><strong>Organic Members:</strong> {row.organicMembers}</p>
                                  <p><strong>Conventional Members:</strong> {row.conventionalMembers}</p>
                                  <p><strong>Production Area:</strong> {row.locationOfProductionArea}</p>
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
    <div className="bg-white rounded-xl shadow p-4 border border-oa-green/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-oa-brown/80">{title}</p>
          <p className="text-xl font-bold text-oa-green-dark mt-1">{value}</p>
        </div>
        <Icon icon={icon} className="text-3xl text-oa-green/60" />
      </div>
    </div>
  );
}

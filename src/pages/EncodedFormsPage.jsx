import { useState, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Icon } from '@iconify/react';
import Layout from '../components/Layout';
import { FileList } from '../components/FileUpload';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useFormEntries } from '../hooks/useFormEntries';

const PAGE_SIZE = 20;

export default function EncodedFormsPage() {
  const { isAdmin, getProvince } = useAuth();
  const { showNotification } = useNotification();
  const province = isAdmin() ? null : getProvince();
  const { individuals, fcas, refresh } = useFormEntries(province);

  const [formTab, setFormTab] = useState('individual');
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: null });
  const [individualPage, setIndividualPage] = useState(1);
  const [fcaPage, setFcaPage] = useState(1);

  const totalIndividualPages = Math.max(1, Math.ceil(individuals.length / PAGE_SIZE));
  const totalFcaPages = Math.max(1, Math.ceil(fcas.length / PAGE_SIZE));
  const safeIndividualPage = Math.min(individualPage, totalIndividualPages);
  const safeFcaPage = Math.min(fcaPage, totalFcaPages);
  const individualStart = (safeIndividualPage - 1) * PAGE_SIZE;
  const fcaStart = (safeFcaPage - 1) * PAGE_SIZE;
  const paginatedIndividuals = individuals.slice(individualStart, individualStart + PAGE_SIZE);
  const paginatedFcas = fcas.slice(fcaStart, fcaStart + PAGE_SIZE);

  const handlePrevIndividuals = () => setIndividualPage((p) => Math.max(1, p - 1));
  const handleNextIndividuals = () => setIndividualPage((p) => Math.min(totalIndividualPages, p + 1));
  const handlePrevFcas = () => setFcaPage((p) => Math.max(1, p - 1));
  const handleNextFcas = () => setFcaPage((p) => Math.min(totalFcaPages, p + 1));

  const handleTabSwitch = (tab) => {
    setFormTab(tab);
    setExpandedId(null);
    if (tab === 'individual') setIndividualPage(1);
    else setFcaPage(1);
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

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500 min-w-0 overflow-x-hidden">
        
        {/* Header — same style as Dashboard / Individual / FCA */}
        <div className="relative rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#2E749E]/5 via-[#A7D9F7]/5 to-transparent pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8">
            <div className="flex items-center gap-5">
              <div className="hidden sm:flex w-14 h-14 rounded-xl bg-[#F2F8ED] border border-[#A7D9F7]/60 items-center justify-center shrink-0">
                <Icon icon="mdi:file-document-multiple-outline" className="text-3xl text-[#2E749E]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                  {isAdmin() ? 'Encoded Forms' : 'My Encoded Forms'}
                  {isAdmin() && <span className="text-slate-800 font-bold text-lg ml-2 block sm:inline">(from Provincial Encoders)</span>}
                </h1>
                <p className="text-sm text-slate-800 mt-1.5">View and manage encoded Individual and FCA forms</p>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Modal */}
        {deleteConfirm.show && createPortal(
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity" onClick={() => setDeleteConfirm({ show: false, id: null, type: null })}>
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-sm w-full border border-slate-200 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center border border-red-200 shrink-0">
                  <Icon icon="mdi:delete-alert-outline" className="text-2xl text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Delete Form</h2>
                  <p className="text-sm text-slate-500 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setDeleteConfirm({ show: false, id: null, type: null })} className="flex-1 py-3 px-4 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-800 transition-all active:scale-[0.98]">
                  Cancel
                </button>
                <button onClick={handleDelete} className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-medium shadow-md shadow-red-500/20 hover:bg-red-600 transition-all active:scale-[0.98]">
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#2E749E]" />
          
          {/* Custom Tabs — wrap on small screens */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => handleTabSwitch('individual')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shrink-0 ${formTab === 'individual' ? 'bg-white text-[#84BC40] shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'}`}
            >
              <Icon icon="mdi:account" className="text-lg shrink-0" />
              <span className="truncate">Individual ({individuals.length})</span>
            </button>
            <button
              onClick={() => handleTabSwitch('fca')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shrink-0 ${formTab === 'fca' ? 'bg-white text-[#2E749E] shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'}`}
            >
              <Icon icon="mdi:account-group" className="text-lg shrink-0" />
              <span className="truncate">FCA ({fcas.length})</span>
            </button>
          </div>

          {/* Individual Tab Content */}
          {formTab === 'individual' ? (
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                {individuals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-slate-50/50 border border-slate-200 rounded-xl">
                    <div className="w-16 h-16 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-4">
                      <Icon icon="mdi:file-document-outline" className="text-3xl text-slate-400" />
                    </div>
                    <p className="text-slate-800 font-semibold text-lg">No Individual forms yet</p>
                    <p className="text-sm text-slate-600 mt-1">Go to <Link to="/dashboard" className="font-semibold text-[#84BC40] hover:underline">Dashboard</Link> and use <strong>New Entry</strong> to add one.</p>
                  </div>
                ) : (
                  <table className="w-full min-w-[640px] text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-xs">
                      <tr>
                        <th className="py-4 px-3 sm:px-5 text-center">Name</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Province</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Certification</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Organic Area</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Date</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {paginatedIndividuals.map((row) => (
                        <Fragment key={row.id}>
                          <tr className={`transition-colors ${expandedId === row.id ? 'bg-slate-50/50' : 'hover:bg-slate-50/80'}`}>
                            <td className="py-4 px-5 font-medium text-slate-800 text-center">{row.completeName || [row.surname, row.firstName].filter(Boolean).join(' ')}</td>
                            <td className="py-4 px-5 text-slate-600 text-center">{row.province}</td>
                            <td className="py-4 px-5 text-center">
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                                {row.certification}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-slate-800 font-medium tabular-nums text-center">{row.organicArea} ha</td>
                            <td className="py-4 px-5 text-slate-500 text-center">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</td>
                            <td className="py-4 px-5 text-center">
                              <div className="flex justify-center gap-1.5">
                                <button onClick={() => setExpandedId(expandedId === row.id ? null : row.id)} title={expandedId === row.id ? 'Hide Details' : 'View Details'} className={`p-2 rounded-xl transition-all ${expandedId === row.id ? 'bg-slate-200 text-slate-700' : 'text-slate-500 hover:text-[#84BC40] hover:bg-[#84BC40]/10'}`}>
                                  <Icon icon={expandedId === row.id ? 'mdi:chevron-up' : 'mdi:eye-outline'} className="text-lg" />
                                </button>
                                <Link to={`/entry/individual/${row.id}/edit`} title="Edit" className="p-2 rounded-xl text-slate-500 hover:text-[#2E749E] hover:bg-[#2E749E]/10 transition-all">
                                  <Icon icon="mdi:pencil-outline" className="text-lg" />
                                </Link>
                                {isAdmin() && (
                                  <button onClick={() => setDeleteConfirm({ show: true, id: row.id, type: 'individuals' })} title="Delete" className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95">
                                    <Icon icon="mdi:delete-outline" className="text-lg" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedId === row.id && (
                            <tr key={`${row.id}-detail`}>
                              <td colSpan={6} className="bg-slate-50/50 p-6 border-b border-slate-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Sex</span><span className="text-slate-800 font-normal">{row.sex}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Date of Birth</span><span className="text-slate-800 font-normal">{row.dateOfBirth}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Civil Status</span><span className="text-slate-800 font-normal">{row.civilStatus}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">PWD / Senior Citizen</span><span className="text-slate-800 font-normal">{row.pwd}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Mobile</span><span className="text-slate-800 font-normal">{row.mobileNumber}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Years in OA</span><span className="text-slate-800 font-normal">{row.yearsInOrganicFarming}</span></div>
                                  <div className="md:col-span-2 lg:col-span-3"><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Address</span><span className="text-slate-800 font-normal">{row.completeAddress}</span></div>
                                  
                                  {Array.isArray(row.commodities) && row.commodities.length > 0 && (
                                    <div className="md:col-span-2 lg:col-span-3 mt-2">
                                      <span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Commodities</span>
                                      <div className="flex flex-wrap gap-2">
                                        {row.commodities.map((c, i) => (
                                          <div key={i} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-700 text-xs font-medium">
                                            {c.commodity} <span className="text-slate-400 mx-1">•</span> {c.products} <span className="text-slate-400 mx-1">•</span> <span className="text-[#8D4A25] font-bold">{c.sizeOfArea} ha</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {Array.isArray(row.attachments) && row.attachments.length > 0 && (
                                    <div className="md:col-span-2 lg:col-span-3 mt-2">
                                      <span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Attachments</span>
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
              
              {/* Pagination */}
              {individuals.length > PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-200 gap-3">
                  <span className="text-sm text-slate-500 font-medium">{`Showing ${individualStart + 1} to ${Math.min(individualStart + PAGE_SIZE, individuals.length)} of ${individuals.length} entries`}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={handlePrevIndividuals} disabled={safeIndividualPage === 1} className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 transition-colors">Prev</button>
                    <span className="text-sm font-medium text-slate-600 px-2">Page {safeIndividualPage} of {totalIndividualPages}</span>
                    <button onClick={handleNextIndividuals} disabled={safeIndividualPage === totalIndividualPages} className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 transition-colors">Next</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* FCA Tab Content */
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                {fcas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-slate-50/50 border border-slate-200 rounded-xl">
                    <div className="w-16 h-16 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-4">
                      <Icon icon="mdi:account-group-outline" className="text-3xl text-slate-400" />
                    </div>
                    <p className="text-slate-800 font-semibold text-lg">No FCA forms yet</p>
                    <p className="text-sm text-slate-600 mt-1">Go to <Link to="/dashboard" className="font-semibold text-[#2E749E] hover:underline">Dashboard</Link> and use <strong>New Entry</strong> to add one.</p>
                  </div>
                ) : (
                  <table className="w-full min-w-[640px] text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-xs">
                      <tr>
                        <th className="py-4 px-3 sm:px-5 text-center">FCA Name</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Province</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Certification</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Organic Members</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Date</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {paginatedFcas.map((row) => (
                        <Fragment key={row.id}>
                          <tr className={`transition-colors ${expandedId === row.id ? 'bg-slate-50/50' : 'hover:bg-slate-50/80'}`}>
                            <td className="py-4 px-5 font-medium text-slate-800 text-center">{row.nameOfFCA}</td>
                            <td className="py-4 px-5 text-slate-600 text-center">{row.province}</td>
                            <td className="py-4 px-5 text-center">
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                                {row.certification}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-slate-800 font-medium tabular-nums text-center">{row.organicMembers}</td>
                            <td className="py-4 px-5 text-slate-500 text-center">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</td>
                            <td className="py-4 px-5 text-center">
                              <div className="flex justify-center gap-1.5">
                                <button onClick={() => setExpandedId(expandedId === row.id ? null : row.id)} title={expandedId === row.id ? 'Hide Details' : 'View Details'} className={`p-2 rounded-xl transition-all ${expandedId === row.id ? 'bg-slate-200 text-slate-700' : 'text-slate-500 hover:text-[#2E749E] hover:bg-[#2E749E]/10'}`}>
                                  <Icon icon={expandedId === row.id ? 'mdi:chevron-up' : 'mdi:eye-outline'} className="text-lg" />
                                </button>
                                <Link to={`/entry/fca/${row.id}/edit`} title="Edit" className="p-2 rounded-xl text-slate-500 hover:text-[#2E749E] hover:bg-[#2E749E]/10 transition-all">
                                  <Icon icon="mdi:pencil-outline" className="text-lg" />
                                </Link>
                                {isAdmin() && (
                                  <button onClick={() => setDeleteConfirm({ show: true, id: row.id, type: 'fcas' })} title="Delete" className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95">
                                    <Icon icon="mdi:delete-outline" className="text-lg" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedId === row.id && (
                            <tr key={`${row.id}-detail`}>
                              <td colSpan={6} className="bg-slate-50/50 p-6 border-b border-slate-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                                  <div className="md:col-span-2 lg:col-span-3"><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Business Address</span><span className="text-slate-800 font-normal">{row.businessAddress}</span></div>
                                  <div className="md:col-span-2 lg:col-span-3"><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Barangay/Municipalities</span><span className="text-slate-800 font-normal">{row.barangayMunicipalitiesCovered}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Head</span><span className="text-slate-800 font-normal">{row.headName} <span className="text-slate-400 font-normal">({row.headDesignation})</span></span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Contact</span><span className="text-slate-800 font-normal">{row.contactName} <span className="text-slate-400 font-normal">({row.contactMobile})</span></span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Members Breakdown</span><span className="text-slate-800 font-normal">{row.organicMembers} Organic <span className="text-slate-300 mx-1">|</span> {row.conventionalMembers} Conventional</span></div>
                                  <div className="md:col-span-2 lg:col-span-3"><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Location of Production Area</span><span className="text-slate-800 font-normal">{row.locationOfProductionArea}</span></div>
                                  
                                  {Array.isArray(row.attachments) && row.attachments.length > 0 && (
                                    <div className="md:col-span-2 lg:col-span-3 mt-2">
                                      <span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Attachments</span>
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
              
              {/* Pagination */}
              {fcas.length > PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-200 gap-3">
                  <span className="text-sm text-slate-500 font-medium">{`Showing ${fcaStart + 1} to ${Math.min(fcaStart + PAGE_SIZE, fcas.length)} of ${fcas.length} entries`}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={handlePrevFcas} disabled={safeFcaPage === 1} className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 transition-colors">Prev</button>
                    <span className="text-sm font-medium text-slate-600 px-2">Page {safeFcaPage} of {totalFcaPages}</span>
                    <button onClick={handleNextFcas} disabled={safeFcaPage === totalFcaPages} className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 transition-colors">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
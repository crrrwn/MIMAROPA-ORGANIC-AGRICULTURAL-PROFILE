import { useState, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Icon } from '@iconify/react';
import ExcelJS from 'exceljs';
import Layout from '../components/Layout';
import { FileList } from '../components/FileUpload';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useFormEntries } from '../hooks/useFormEntries';
import { logAction } from '../services/systemLogs';

const PAGE_SIZE = 20;
const YEAR_OPTIONS = [null, 2025, 2026, 2027, 2028, 2029, 2030];

function getRecordYear(record) {
  const dateStr = record.dateSubmitted || record.updatedAt || record.createdAt;
  if (!dateStr) return null;
  const y = new Date(dateStr).getFullYear();
  return Number.isNaN(y) ? null : y;
}

export default function EncodedFormsPage() {
  const { isAdmin, getProvince, userProfile, user } = useAuth();
  const { showNotification } = useNotification();
  const province = isAdmin() ? null : getProvince();
  const { individuals, fcas, refresh } = useFormEntries(province);

  const [formTab, setFormTab] = useState('individual');
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: null });
  const [individualPage, setIndividualPage] = useState(1);
  const [fcaPage, setFcaPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState(null);

  const getIndividualCertification = (row) => {
    const fromRow = row.certification?.trim();
    if (fromRow) return fromRow;
    const fromCommodities = Array.isArray(row.commodities)
      ? [...new Set(row.commodities.map((c) => c.certification).filter(Boolean))].join(', ')
      : '';
    return fromCommodities || '—';
  };

  const filteredIndividuals = individuals.filter((row) => {
    const year = getRecordYear(row);
    if (filterYear != null && year !== filterYear) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const name = (row.completeName || [row.surname, row.firstName, row.middleName].filter(Boolean).join(' ')).toLowerCase();
    const prov = (row.province || '').toLowerCase();
    const cert = getIndividualCertification(row).toLowerCase();
    const addr = (row.completeAddress || '').toLowerCase();
    const rsbsa = (row.rsbsaNumber || '').toLowerCase();
    const farmersAssociationCooperative = (row.farmersAssociationCooperative || '').toLowerCase();
    return name.includes(q) || prov.includes(q) || cert.includes(q) || addr.includes(q) || rsbsa.includes(q) || farmersAssociationCooperative.includes(q);
  });

  const filteredFcas = fcas.filter((row) => {
    const year = getRecordYear(row);
    if (filterYear != null && year !== filterYear) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const name = (row.nameOfFCA || '').toLowerCase();
    const prov = (row.province || '').toLowerCase();
    const cert = (row.certification || '').toLowerCase();
    const addr = (row.businessAddress || '').toLowerCase();
    const barangay = (row.barangayMunicipalitiesCovered || '').toLowerCase();
    return name.includes(q) || prov.includes(q) || cert.includes(q) || addr.includes(q) || barangay.includes(q);
  });

  const totalIndividualPages = Math.max(1, Math.ceil(filteredIndividuals.length / PAGE_SIZE));
  const totalFcaPages = Math.max(1, Math.ceil(filteredFcas.length / PAGE_SIZE));
  const safeIndividualPage = Math.min(individualPage, totalIndividualPages);
  const safeFcaPage = Math.min(fcaPage, totalFcaPages);
  const individualStart = (safeIndividualPage - 1) * PAGE_SIZE;
  const fcaStart = (safeFcaPage - 1) * PAGE_SIZE;
  const paginatedIndividuals = filteredIndividuals.slice(individualStart, individualStart + PAGE_SIZE);
  const paginatedFcas = filteredFcas.slice(fcaStart, fcaStart + PAGE_SIZE);

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

  const handleExportIndividualExcel = async () => {
    const headers = ['Name', 'Province', 'Certification', 'Organic Area (ha)', 'Date Submitted', 'RSBSA Number', 'Farmers Association/Cooperative', 'Sex', 'Date of Birth', 'Civil Status', 'PWD', 'Senior Citizen', 'IP', 'Youth', 'Mobile', 'Years in OA', 'Address', 'Commodities'];
    const columnWidths = [28, 18, 22, 14, 14, 14, 24, 10, 14, 12, 8, 14, 8, 8, 14, 10, 35, 45];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MIMAROPA Organic Profile';
    const sheet = workbook.addWorksheet('Individual Forms', {
      properties: { defaultRowHeight: 22 },
      pageSetup: { orientation: 'landscape', fitToPage: true },
    });

    // Header row with design
    const headerRow = sheet.addRow(headers);
    headerRow.height = 26;
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2E749E' },
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Data rows
    individuals.forEach((row, idx) => {
      const dateStr = row.dateSubmitted ? new Date(row.dateSubmitted).toLocaleDateString() : (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—');
      const commoditiesStr = Array.isArray(row.commodities) && row.commodities.length > 0
        ? row.commodities
            .map((c) => {
              const commodityLabel = (c?.products || c?.commodity || '').trim();
              const size = String(c?.sizeOfArea ?? '').trim();
              if (!commodityLabel && !size) return '';
              if (commodityLabel && size) return `${commodityLabel} ${size} ha`;
              if (commodityLabel) return commodityLabel;
              return `${size} ha`;
            })
            .filter(Boolean)
            .join('; ')
        : '';
      const dataRow = sheet.addRow([
        row.completeName || [row.surname, row.firstName].filter(Boolean).join(' '),
        row.province || '',
        getIndividualCertification(row),
        row.organicArea || '',
        dateStr,
        row.rsbsaNumber || '',
        row.farmersAssociationCooperative || '',
        row.sex || '',
        row.dateOfBirth || '',
        row.civilStatus || '',
        row.pwd ?? '',
        row.seniorCitizen ?? (row.pwd === 'Senior Citizen' ? 'Yes' : ''),
        row.ip ?? '',
        row.youth ?? '',
        row.mobileNumber || '',
        row.yearsInOrganicFarming || '',
        row.completeAddress || '',
        commoditiesStr,
      ]);
      const isEven = idx % 2 === 0;
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.fill = isEven
          ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
          : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      });
    });

    columnWidths.forEach((w, i) => {
      sheet.getColumn(i + 1).width = w;
    });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Individual_Forms_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Individual forms exported to Excel.');
  };

  const handleExportFCAExcel = async () => {
    const headers = [
      'FCA Name', 'Province', 'Certification', 'Organic Members', 'Date Submitted', 'Date of Registration',
      'Business Address', 'Barangay/Municipalities', 'Head Name', 'Head Designation', 'Head Mobile',
      'Contact Name', 'Contact Designation', 'Contact Mobile', 'Organic (Male)', 'Organic (Female)', 'Conventional Members',
      'Location of Production Area',
    ];
    const columnWidths = [28, 18, 22, 14, 14, 18, 35, 22, 20, 18, 14, 20, 18, 14, 12, 14, 16, 35];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MIMAROPA Organic Profile';
    const sheet = workbook.addWorksheet('FCA Forms', {
      properties: { defaultRowHeight: 22 },
      pageSetup: { orientation: 'landscape', fitToPage: true },
    });

    const headerRow = sheet.addRow(headers);
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2E749E' },
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    fcas.forEach((row, idx) => {
      const dateStr = row.dateSubmitted ? new Date(row.dateSubmitted).toLocaleDateString() : (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—');
      const regStr = row.dateOfRegistration || '—';
      const regDisplay = row.dateOfRegistration === 'OTHERS' && row.dateOfRegistrationOthers ? `${regStr} (${row.dateOfRegistrationOthers})` : regStr;
      const dataRow = sheet.addRow([
        row.nameOfFCA || '',
        row.province || '',
        row.certification || '',
        row.organicMembers ?? '',
        dateStr,
        regDisplay,
        row.businessAddress || '',
        row.barangayMunicipalitiesCovered || '',
        row.headName || '',
        row.headDesignation || '',
        row.headMobile || '',
        row.contactName || '',
        row.contactDesignation || '',
        row.contactMobile || '',
        row.organicMembersMale ?? '',
        row.organicMembersFemale ?? '',
        row.conventionalMembers ?? '',
        row.locationOfProductionArea || '',
      ]);
      const isEven = idx % 2 === 0;
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.fill = isEven
          ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
          : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      });
    });

    columnWidths.forEach((w, i) => {
      sheet.getColumn(i + 1).width = w;
    });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FCA_Forms_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('FCA forms exported to Excel.');
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id || !deleteConfirm.type) return;
    try {
      await deleteDoc(doc(db, deleteConfirm.type, deleteConfirm.id));
      logAction({
        action: 'form_delete',
        userId: user?.uid,
        userEmail: userProfile?.email ?? user?.email,
        role: userProfile?.role,
        province: userProfile?.province ?? getProvince(),
        details: { type: deleteConfirm.type, id: deleteConfirm.id },
      }).catch(() => {});
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
        <div className="relative rounded-2xl bg-white border border-slate-300 shadow-sm overflow-hidden">
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
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-sm w-full border border-slate-300 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
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
                <button onClick={() => setDeleteConfirm({ show: false, id: null, type: null })} className="flex-1 py-3 px-4 border border-slate-300 rounded-xl text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-800 transition-all active:scale-[0.98]">
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
        <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#2E749E]" />
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 min-w-0">
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, province, certification, address..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIndividualPage(1);
                  setFcaPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#2E749E]/20 focus:border-[#2E749E] outline-none transition-all text-sm"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="filter-year" className="text-sm font-semibold text-slate-600 whitespace-nowrap">Filter by year:</label>
              <select
                id="filter-year"
                value={filterYear ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilterYear(v === '' ? null : Number(v));
                  setIndividualPage(1);
                  setFcaPage(1);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-[#2E749E]/20 focus:border-[#2E749E] outline-none transition-all text-sm font-medium min-w-[100px]"
              >
                <option value="">All Years</option>
                {YEAR_OPTIONS.filter((y) => y != null).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Tabs — wrap on small screens */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <button
              onClick={() => handleTabSwitch('individual')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shrink-0 ${formTab === 'individual' ? 'bg-white text-[#84BC40] shadow-sm border border-slate-300' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'}`}
            >
              <Icon icon="mdi:account" className="text-lg shrink-0" />
              <span className="truncate">Individual ({filteredIndividuals.length})</span>
            </button>
            <button
              onClick={() => handleTabSwitch('fca')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shrink-0 ${formTab === 'fca' ? 'bg-white text-[#2E749E] shadow-sm border border-slate-300' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'}`}
            >
              <Icon icon="mdi:account-group" className="text-lg shrink-0" />
              <span className="truncate">FCA ({filteredFcas.length})</span>
            </button>
            {formTab === 'individual' && filteredIndividuals.length > 0 && (
              <button
                onClick={handleExportIndividualExcel}
                className="ml-auto px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 bg-[#84BC40] text-white hover:bg-[#7cb03a] transition-all active:scale-95 shrink-0"
              >
                <Icon icon="mdi:file-excel-outline" className="text-lg" />
                Export Excel
              </button>
            )}
            {formTab === 'fca' && filteredFcas.length > 0 && (
              <button
                onClick={handleExportFCAExcel}
                className="ml-auto px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 bg-[#2E749E] text-white hover:bg-[#266a8a] transition-all active:scale-95 shrink-0"
              >
                <Icon icon="mdi:file-excel-outline" className="text-lg" />
                Export Excel
              </button>
            )}
          </div>

          {/* Individual Tab Content */}
          {formTab === 'individual' ? (
            <div className="rounded-2xl border border-slate-300 overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                {filteredIndividuals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-slate-50/50 border border-slate-300 rounded-xl">
                    <div className="w-16 h-16 rounded-xl bg-white shadow-sm border border-slate-300 flex items-center justify-center mb-4">
                      <Icon icon="mdi:file-document-outline" className="text-3xl text-slate-400" />
                    </div>
                    <p className="text-slate-800 font-semibold text-lg">{individuals.length === 0 ? 'No Individual forms yet' : 'No matching Individual forms'}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {individuals.length === 0
                        ? <>Go to <Link to="/dashboard" className="font-semibold text-[#84BC40] hover:underline">Dashboard</Link> and use <strong>New Entry</strong> to add one.</>
                        : 'Try a different search or year filter.'}
                    </p>
                  </div>
                ) : (
                  <table className="w-full min-w-[640px] text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-300 text-slate-500 uppercase tracking-wider font-semibold text-xs">
                      <tr>
                        <th className="py-4 px-3 sm:px-5 text-center">Name</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Province</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Certification</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Organic Area</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Date</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {paginatedIndividuals.map((row) => (
                        <Fragment key={row.id}>
                          <tr className={`transition-colors ${expandedId === row.id ? 'bg-slate-50/50' : 'hover:bg-slate-50/80'}`}>
                            <td className="py-4 px-5 font-medium text-slate-800 text-center">{row.completeName || [row.surname, row.firstName].filter(Boolean).join(' ')}</td>
                            <td className="py-4 px-5 text-slate-600 text-center">{row.province}</td>
                            <td className="py-4 px-5 text-center">
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                                {getIndividualCertification(row)}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-slate-800 font-medium tabular-nums text-center">{row.organicArea} ha</td>
                            <td className="py-4 px-5 text-slate-500 text-center">{row.dateSubmitted ? new Date(row.dateSubmitted).toLocaleDateString() : (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—')}</td>
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
                              <td colSpan={6} className="bg-slate-50/50 p-6 border-b border-slate-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">RSBSA Number</span><span className="text-slate-800 font-normal">{row.rsbsaNumber || '—'}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Farmers Association/Cooperative</span><span className="text-slate-800 font-normal">{row.farmersAssociationCooperative || '—'}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Sex</span><span className="text-slate-800 font-normal">{row.sex}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Date of Birth</span><span className="text-slate-800 font-normal">{row.dateOfBirth}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Civil Status</span><span className="text-slate-800 font-normal">{row.civilStatus}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">PWD</span><span className="text-slate-800 font-normal">{row.pwd ?? '—'}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Senior Citizen</span><span className="text-slate-800 font-normal">{row.seniorCitizen ?? (row.pwd === 'Senior Citizen' ? 'Yes' : '—')}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">IP (Indigenous Peoples)</span><span className="text-slate-800 font-normal">{row.ip ?? '—'}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Youth</span><span className="text-slate-800 font-normal">{row.youth ?? '—'}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Mobile</span><span className="text-slate-800 font-normal">{row.mobileNumber}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Years in OA</span><span className="text-slate-800 font-normal">{row.yearsInOrganicFarming}</span></div>
                                  <div className="md:col-span-2 lg:col-span-3"><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Address</span><span className="text-slate-800 font-normal">{row.completeAddress}</span></div>
                                  
                                  {Array.isArray(row.commodities) && row.commodities.length > 0 && (
                                    <div className="md:col-span-2 lg:col-span-3 mt-2">
                                      <span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Commodities</span>
                                      <div className="flex flex-wrap gap-2">
                                        {row.commodities.map((c, i) => (
                                          <div key={i} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg shadow-sm text-slate-700 text-xs font-medium">
                                            {c.commodity} <span className="text-slate-400 mx-1">•</span> {c.products} <span className="text-slate-400 mx-1">•</span> <span className="text-[#8D4A25] font-bold">{c.sizeOfArea} ha</span>
                                            {c.certification ? <><span className="text-slate-400 mx-1">•</span> <span className="text-[#2E749E] font-semibold">{c.certification}</span></> : null}
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
              {filteredIndividuals.length > PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-300 gap-3">
                  <span className="text-sm text-slate-500 font-medium">{`Showing ${individualStart + 1} to ${Math.min(individualStart + PAGE_SIZE, filteredIndividuals.length)} of ${filteredIndividuals.length} entries`}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={handlePrevIndividuals} disabled={safeIndividualPage === 1} className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 transition-colors">Prev</button>
                    <span className="text-sm font-medium text-slate-600 px-2">Page {safeIndividualPage} of {totalIndividualPages}</span>
                    <button onClick={handleNextIndividuals} disabled={safeIndividualPage === totalIndividualPages} className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 transition-colors">Next</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* FCA Tab Content */
            <div className="rounded-2xl border border-slate-300 overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                {filteredFcas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-slate-50/50 border border-slate-300 rounded-xl">
                    <div className="w-16 h-16 rounded-xl bg-white shadow-sm border border-slate-300 flex items-center justify-center mb-4">
                      <Icon icon="mdi:account-group-outline" className="text-3xl text-slate-400" />
                    </div>
                    <p className="text-slate-800 font-semibold text-lg">{fcas.length === 0 ? 'No FCA forms yet' : 'No matching FCA forms'}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {fcas.length === 0
                        ? <>Go to <Link to="/dashboard" className="font-semibold text-[#2E749E] hover:underline">Dashboard</Link> and use <strong>New Entry</strong> to add one.</>
                        : 'Try a different search or year filter.'}
                    </p>
                  </div>
                ) : (
                  <table className="w-full min-w-[640px] text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-300 text-slate-500 uppercase tracking-wider font-semibold text-xs">
                      <tr>
                        <th className="py-4 px-3 sm:px-5 text-center">FCA Name</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Province</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Certification</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Organic Members</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Date</th>
                        <th className="py-4 px-3 sm:px-5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
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
                            <td className="py-4 px-5 text-slate-500 text-center">{row.dateSubmitted ? new Date(row.dateSubmitted).toLocaleDateString() : (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—')}</td>
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
                              <td colSpan={6} className="bg-slate-50/50 p-6 border-b border-slate-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Date Submitted</span><span className="text-slate-800 font-normal">{row.dateSubmitted ? new Date(row.dateSubmitted).toLocaleDateString() : (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—')}</span></div>
                                  <div><span className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Date of Registration</span><span className="text-slate-800 font-normal">{row.dateOfRegistration || '—'}{row.dateOfRegistration === 'OTHERS' && row.dateOfRegistrationOthers ? ` (${row.dateOfRegistrationOthers})` : ''}</span></div>
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
              {filteredFcas.length > PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-300 gap-3">
                  <span className="text-sm text-slate-500 font-medium">{`Showing ${fcaStart + 1} to ${Math.min(fcaStart + PAGE_SIZE, filteredFcas.length)} of ${filteredFcas.length} entries`}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={handlePrevFcas} disabled={safeFcaPage === 1} className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 transition-colors">Prev</button>
                    <span className="text-sm font-medium text-slate-600 px-2">Page {safeFcaPage} of {totalFcaPages}</span>
                    <button onClick={handleNextFcas} disabled={safeFcaPage === totalFcaPages} className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 transition-colors">Next</button>
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
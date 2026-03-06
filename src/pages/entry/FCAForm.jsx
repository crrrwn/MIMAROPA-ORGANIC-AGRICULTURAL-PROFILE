import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { PROVINCES } from '../../constants';
import { FileUpload } from '../../components/FileUpload';
import { logAction } from '../../services/systemLogs';

const CERTIFICATION_OPTIONS = ['PGS Accredited', 'Applying for Accreditation', 'Engaged Organic Farming'];

const SPECIALIZATION_OPTIONS = [
  'GRAINS',
  'UPLAND',
  'LOWLAND VEGET',
  'FRUIT',
  'HERBS AND SPIECES',
  'ROOT CROPS',
  'MUSHROOM',
  'LEGUMES (PEANUTS,SOYBEAN)',
  'BEEKEEPING',
  'HIGH VALUE CROPS (CACAO, COFFEE, COCONUT, SUGARCANE, ABACA, RUBBER)',
  'POULTRY AND OTHER (QUAIL, DUCKS, TURKEY, ETC)',
  'LIVESTOCK (SWINE, HORSE, CATTLE, RABBIT)',
  'FISHERIES',
  'ORGANIC SOIL AMENDMENT (OSA)',
  'SERVICE PROVIDER (MACHINERY, EQUIPMENT, AND OTHER COMPONENTS)',
  'ORGANIC RUMINANTS (CATTLE, CARABAO, SHEEP, AND GOAT)',
  'ORGANIC FEEDS (BSF)',
  'OTHERS',
];

const SPECIALIZATION_REQUIRES_SPECIFY = ['OTHERS'];

export default function FCAForm() {
  const { getProvince, userProfile, user } = useAuth();
  const { showNotification } = useNotification();
  const province = getProvince();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [form, setForm] = useState({
    province: province || '',
    nameOfFCA: '',
    businessAddress: '',
    barangayMunicipalitiesCovered: '',
    organicMembersMale: 0,
    organicMembersFemale: 0,
    conventionalMembers: 0,
    headName: '',
    headDesignation: '',
    headMobile: '',
    contactName: '',
    contactDesignation: '',
    contactMobile: '',
    certification: '',
    specializations: [{ value: '', specify: '' }],
    locationOfProductionArea: '',
    sharedFacilities: [{ area: '', typeOfFacilities: '', sizeOfArea: '', capacities: '', cost: '', noOfUnits: '', dedicatedToOrganic: 'No', remarks: '' }],
    machinery: [{ type: '', capacities: '', cost: '', noOfUnits: '', dedicatedToOrganic: 'No', remarks: '' }],
    attachments: [],
  });

  useEffect(() => {
    if (isEdit && id) {
      getDoc(doc(db, 'fcas', id)).then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setForm({
            province: d.province || '',
            nameOfFCA: d.nameOfFCA || '',
            businessAddress: d.businessAddress || '',
            barangayMunicipalitiesCovered: d.barangayMunicipalitiesCovered || '',
            organicMembersMale: d.organicMembersMale ?? 0,
            organicMembersFemale: d.organicMembersFemale ?? (d.organicMembers != null ? Number(d.organicMembers) : 0),
            conventionalMembers: d.conventionalMembers || 0,
            headName: d.headName || '',
            headDesignation: d.headDesignation || '',
            headMobile: d.headMobile || '',
            contactName: d.contactName || '',
            contactDesignation: d.contactDesignation || '',
            contactMobile: d.contactMobile || '',
            certification: d.certification || '',
            specializations: Array.isArray(d.specializations) && d.specializations.length > 0
              ? d.specializations.map((s) => ({ value: s.value || '', specify: s.specify || '' }))
              : d.specializationFocusCommodity
                ? [{ value: d.specializationFocusCommodity || '', specify: d.specializationFocusSpecify || '' }]
                : [{ value: '', specify: '' }],
            locationOfProductionArea: d.locationOfProductionArea || '',
            sharedFacilities: Array.isArray(d.sharedFacilities) && d.sharedFacilities.length > 0
              ? d.sharedFacilities.map((s) => ({
                  area: s.area || '',
                  typeOfFacilities: s.typeOfFacilities || '',
                  sizeOfArea: s.sizeOfArea || '',
                  capacities: s.capacities || '',
                  cost: s.cost || '',
                  noOfUnits: s.noOfUnits || '',
                  dedicatedToOrganic: s.dedicatedToOrganic || 'No',
                  remarks: s.remarks || '',
                }))
              : [{ area: '', typeOfFacilities: '', sizeOfArea: '', capacities: '', cost: '', noOfUnits: '', dedicatedToOrganic: 'No', remarks: '' }],
            machinery: Array.isArray(d.machinery) && d.machinery.length > 0
              ? d.machinery.map((m) => ({
                  type: m.type || '',
                  capacities: m.capacities || '',
                  cost: m.cost || '',
                  noOfUnits: m.noOfUnits || '',
                  dedicatedToOrganic: m.dedicatedToOrganic || 'No',
                  remarks: m.remarks || '',
                }))
              : [{ type: '', capacities: '', cost: '', noOfUnits: '', dedicatedToOrganic: 'No', remarks: '' }],
            attachments: Array.isArray(d.attachments) ? d.attachments : [],
          });
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, isEdit]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const addSharedFacility = () => {
    setForm((f) => ({
      ...f,
      sharedFacilities: [...f.sharedFacilities, { area: '', typeOfFacilities: '', sizeOfArea: '', capacities: '', cost: '', noOfUnits: '', dedicatedToOrganic: 'No', remarks: '' }],
    }));
  };

  const updateSharedFacility = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      sharedFacilities: f.sharedFacilities.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  };

  const addMachinery = () => {
    setForm((f) => ({
      ...f,
      machinery: [...f.machinery, { type: '', capacities: '', cost: '', noOfUnits: '', dedicatedToOrganic: 'No', remarks: '' }],
    }));
  };

  const updateMachinery = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      machinery: f.machinery.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  };

  const addSpecialization = () => {
    setForm((f) => ({
      ...f,
      specializations: [...f.specializations, { value: '', specify: '' }],
    }));
  };

  const updateSpecialization = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      specializations: f.specializations.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const organicMembersTotal = Number(form.organicMembersMale || 0) + Number(form.organicMembersFemale || 0);
    const payload = {
      ...form,
      province: province || form.province,
      organicMembers: organicMembersTotal,
      engageInOA: true,
      attachments: form.attachments || [],
      updatedAt: new Date().toISOString(),
    };
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'fcas', id), payload);
        logAction({
          action: 'fca_update',
          userId: user?.uid,
          userEmail: userProfile?.email ?? user?.email,
          role: userProfile?.role,
          province: userProfile?.province ?? getProvince(),
          details: { formId: id },
        }).catch(() => {});
        showNotification('FCA form updated successfully.');
      } else {
        const ref = await addDoc(collection(db, 'fcas'), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
        logAction({
          action: 'fca_create',
          userId: user?.uid,
          userEmail: userProfile?.email ?? user?.email,
          role: userProfile?.role,
          province: userProfile?.province ?? getProvince(),
          details: { formId: ref.id },
        }).catch(() => {});
        showNotification('FCA form submitted successfully.');
      }
      navigate('/dashboard');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 min-w-0 overflow-x-hidden w-full">
        
        {/* Modern Back Button */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="group inline-flex items-center gap-2 px-5 py-2.5 mb-2 text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
        >
          <Icon icon="mdi:arrow-left" className="text-lg group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-6 sm:p-10 relative overflow-hidden">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-palette-blue via-palette-sky to-palette-green"></div>
            
            {/* Form Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-slate-100 mb-10">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-palette-blue/10 flex items-center justify-center border border-palette-blue/20 shrink-0 mt-1">
                  <Icon icon="mdi:account-group-outline" className="text-3xl text-palette-blue" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                    FCA Profile Form
                  </h1>
                  <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed max-w-xl">
                    {isEdit ? 'Update the details of this Farmers Cooperative/Association (FCA).' : 'Provide the general and certification information of the Farmers Cooperative/Association.'}
                  </p>
                </div>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm shrink-0 border ${isEdit ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-palette-green text-white border-palette-green/20'}`}>
                <Icon icon={isEdit ? 'mdi:pencil-outline' : 'mdi:plus-circle-outline'} className="text-lg" />
                {isEdit ? 'Edit Mode' : 'New Entry'}
              </div>
            </div>

            <div className="space-y-12">
              <Section title="General Information" icon="mdi:information-outline">
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Input label="Name of the FCA" value={form.nameOfFCA} onChange={(v) => update('nameOfFCA', v)} required />
                    <Input label="Business Address" value={form.businessAddress} onChange={(v) => update('businessAddress', v)} />
                    <Input label="Barangay/Municipalities Covered" value={form.barangayMunicipalitiesCovered} onChange={(v) => update('barangayMunicipalitiesCovered', v)} />
                  </div>
                  
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Membership Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <Input label="Organic Members (Male)" type="number" min="0" value={form.organicMembersMale} onChange={(v) => update('organicMembersMale', v)} />
                      <Input label="Organic Members (Female)" type="number" min="0" value={form.organicMembersFemale} onChange={(v) => update('organicMembersFemale', v)} />
                      <Input label="Conventional Members" type="number" min="0" value={form.conventionalMembers} onChange={(v) => update('conventionalMembers', v)} />
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-600 bg-white w-fit px-4 py-2 rounded-lg border border-slate-200">
                      Total Organic Members: <span className="text-lg font-bold text-palette-green tabular-nums">{Number(form.organicMembersMale || 0) + Number(form.organicMembersFemale || 0)}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4"><Icon icon="mdi:account-tie" className="text-palette-blue text-xl"/> Head of Cooperative/Association</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <Input label="Name" value={form.headName} onChange={(v) => update('headName', v)} />
                      <Input label="Designation/Position" value={form.headDesignation} onChange={(v) => update('headDesignation', v)} />
                      <Input label="Mobile No." value={form.headMobile} onChange={(v) => update('headMobile', v)} />
                    </div>
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4"><Icon icon="mdi:card-account-phone-outline" className="text-palette-blue text-xl"/> Registration Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <Input label="Name of Contact Person" value={form.contactName} onChange={(v) => update('contactName', v)} />
                      <Input label="Designation/Position" value={form.contactDesignation} onChange={(v) => update('contactDesignation', v)} />
                      <Input label="Mobile No." value={form.contactMobile} onChange={(v) => update('contactMobile', v)} />
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Certification" icon="mdi:certificate-outline">
                <div className="max-w-md">
                  <Select label="Certification Status" value={form.certification} onChange={(v) => update('certification', v)} options={CERTIFICATION_OPTIONS} />
                </div>
              </Section>

              <Section title="Organization Background" icon="mdi:map-marker-path">
                <div className="space-y-6">
                  <Input label="Location of Production Area" value={form.locationOfProductionArea} onChange={(v) => update('locationOfProductionArea', v)} />
                  
                  <div className="mt-6">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Specializations</label>
                    <div className="space-y-3">
                      {form.specializations.map((s, idx) => (
                        <div key={idx} className="relative p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                          <div className="flex justify-between items-center mb-4">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-slate-500 font-bold text-xs border border-slate-200 shadow-sm">{idx + 1}</span>
                            {form.specializations.length > 1 && (
                              <button type="button" onClick={() => setForm((f) => ({ ...f, specializations: f.specializations.filter((_, i) => i !== idx) }))} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Icon icon="mdi:trash-can-outline" className="text-xl" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Select label="Focus Commodity" value={s.value} onChange={(v) => updateSpecialization(idx, 'value', v)} options={SPECIALIZATION_OPTIONS} />
                            {SPECIALIZATION_REQUIRES_SPECIFY.includes(s.value) && (
                              <Input label={`Specify details for ${s.value}`} value={s.specify} onChange={(v) => updateSpecialization(idx, 'specify', v)} placeholder="Type here..." />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={addSpecialization} className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 mt-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all active:scale-95 text-sm">
                      <Icon icon="mdi:plus-circle-outline" className="text-lg" /> Add Another Specialization
                    </button>
                  </div>
                </div>
              </Section>

              <Section title="Shared Facilities and Capacities" icon="mdi:warehouse">
                <div className="space-y-4">
                  {form.sharedFacilities.map((s, idx) => (
                    <div key={idx} className="relative p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200/60">
                        <span className="font-bold text-slate-700 flex items-center gap-2">
                          <Icon icon="mdi:home-group" className="text-slate-400 text-lg" />
                          Facility #{idx + 1}
                        </span>
                        {form.sharedFacilities.length > 1 && (
                          <button type="button" onClick={() => setForm((f) => ({ ...f, sharedFacilities: f.sharedFacilities.filter((_, i) => i !== idx) }))} className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-red-100 shadow-sm transition-colors">
                            <Icon icon="mdi:trash-can-outline" /> Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <Input label="Area (ha)" type="number" value={s.area} onChange={(v) => updateSharedFacility(idx, 'area', v)} />
                        <Input label="Type of Facilities" value={s.typeOfFacilities} onChange={(v) => updateSharedFacility(idx, 'typeOfFacilities', v)} />
                        <Input label="Size of Area (sqm)" value={s.sizeOfArea} onChange={(v) => updateSharedFacility(idx, 'sizeOfArea', v)} />
                        <Input label="Capacities" value={s.capacities} onChange={(v) => updateSharedFacility(idx, 'capacities', v)} />
                        <Input label="Cost (PHP)" value={s.cost} onChange={(v) => updateSharedFacility(idx, 'cost', v)} />
                        <Input label="No. of Units" type="number" value={s.noOfUnits} onChange={(v) => updateSharedFacility(idx, 'noOfUnits', v)} />
                        <Select label="Dedicated to Organic?" value={s.dedicatedToOrganic} onChange={(v) => updateSharedFacility(idx, 'dedicatedToOrganic', v)} options={['Yes', 'No']} />
                        <div className="md:col-span-2">
                          <Input label="Remarks" value={s.remarks} onChange={(v) => updateSharedFacility(idx, 'remarks', v)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addSharedFacility} className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all active:scale-95 text-sm">
                    <Icon icon="mdi:plus-circle-outline" className="text-lg" /> Add Facility
                  </button>
                </div>
              </Section>

              <Section title="Machinery, Equipment, and Other Components" icon="mdi:tractor">
                <div className="space-y-4">
                  {form.machinery.map((m, idx) => (
                    <div key={idx} className="relative p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200/60">
                        <span className="font-bold text-slate-700 flex items-center gap-2">
                          <Icon icon="mdi:cog-outline" className="text-slate-400 text-lg" />
                          Item #{idx + 1}
                        </span>
                        {form.machinery.length > 1 && (
                          <button type="button" onClick={() => setForm((f) => ({ ...f, machinery: f.machinery.filter((_, i) => i !== idx) }))} className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-red-100 shadow-sm transition-colors">
                            <Icon icon="mdi:trash-can-outline" /> Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <Input label="Type of Machinery/Equipment" value={m.type} onChange={(v) => updateMachinery(idx, 'type', v)} />
                        <Input label="Capacities" value={m.capacities} onChange={(v) => updateMachinery(idx, 'capacities', v)} />
                        <Input label="Cost (PHP)" value={m.cost} onChange={(v) => updateMachinery(idx, 'cost', v)} />
                        <Input label="No. of Units" type="number" value={m.noOfUnits} onChange={(v) => updateMachinery(idx, 'noOfUnits', v)} />
                        <Select label="Dedicated to Organic?" value={m.dedicatedToOrganic} onChange={(v) => updateMachinery(idx, 'dedicatedToOrganic', v)} options={['Yes', 'No']} />
                        <Input label="Remarks" value={m.remarks} onChange={(v) => updateMachinery(idx, 'remarks', v)} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addMachinery} className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all active:scale-95 text-sm">
                    <Icon icon="mdi:plus-circle-outline" className="text-lg" /> Add Machinery/Equipment
                  </button>
                </div>
              </Section>

              <Section title="Attachments / Documents" icon="mdi:paperclip">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <FileUpload value={form.attachments} onChange={(v) => update('attachments', v)} />
                </div>
              </Section>
            </div>

            {/* Form Actions */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full sm:w-auto flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-palette-green text-white font-bold rounded-xl shadow-md shadow-palette-green/20 hover:bg-[#7cb03a] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95 text-lg"
              >
                {loading ? (
                  <><Icon icon="mdi:loading" className="animate-spin text-xl" /> Saving...</>
                ) : (
                  <><Icon icon="mdi:content-save-check-outline" className="text-xl" /> {isEdit ? 'Update Form' : 'Submit Form'}</>
                )}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/dashboard')} 
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border-2 border-slate-200 bg-white text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all active:scale-95 text-lg"
              >
                Cancel
              </button>
            </div>
            
          </div>
        </form>
      </div>
    </Layout>
  );
}

// --- Enhanced Helper Components ---

function Section({ title, icon, children }) {
  return (
    <div className="mb-10 last:mb-0">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 shrink-0">
          <Icon icon={icon} className="text-xl text-slate-500" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
          {title}
        </h2>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required, placeholder, ...rest }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-slate-700">
        {label} {required && <span className="text-red-500 font-black ml-1">*</span>}
      </label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        required={required} 
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:bg-white focus:ring-4 focus:ring-palette-blue/10 focus:border-palette-blue outline-none transition-all placeholder:text-slate-400 font-medium text-sm shadow-sm" 
        {...rest} 
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-slate-700">{label}</label>
      <div className="relative">
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 focus:bg-white focus:ring-4 focus:ring-palette-blue/10 focus:border-palette-blue outline-none transition-all font-medium text-sm shadow-sm appearance-none cursor-pointer"
        >
          <option value="" disabled className="text-slate-400">— Select an Option —</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
          <Icon icon="mdi:chevron-down" className="text-xl" />
        </div>
      </div>
    </div>
  );
}
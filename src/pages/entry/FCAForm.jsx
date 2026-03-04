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
  const { getProvince } = useAuth();
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
        showNotification('FCA form updated successfully.');
      } else {
        await addDoc(collection(db, 'fcas'), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
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
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-4 py-2.5 mb-6 text-sm font-medium rounded-xl border-2 border-palette-sky/50 bg-palette-cream/50 text-palette-brown hover:bg-palette-sky/20 hover:border-palette-blue/40"
        >
          <Icon icon="mdi:arrow-left" className="text-lg" /> Back to Dashboard
        </button>
        <form onSubmit={handleSubmit}>
          <div className="p-6 sm:p-8 bg-white rounded-2xl border-2 border-palette-sky/30 shadow-xl border-l-4 border-l-palette-blue space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-6 border-b border-palette-sky/30">
              <div>
                <h1 className="text-2xl font-bold text-palette-brown">
                  Form B: Organic Agriculture Profile FCA Form
                </h1>
                <p className="text-sm text-palette-slate mt-2">
                  {isEdit ? 'Update the details of this Farmers Cooperative/Association (FCA).' : 'Provide the general and certification information of the FCA.'}
                </p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${isEdit ? 'bg-palette-cream text-palette-brown border-palette-sky/60' : 'bg-palette-green text-white border-palette-green/70'}`}>
                {isEdit ? 'Edit Mode' : 'New Entry'}
              </span>
            </div>
          <Section title="General Information">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Name of the FCA" value={form.nameOfFCA} onChange={(v) => update('nameOfFCA', v)} required />
                <Input label="Business Address" value={form.businessAddress} onChange={(v) => update('businessAddress', v)} />
                <Input label="Barangay/Municipalities Covered" value={form.barangayMunicipalitiesCovered} onChange={(v) => update('barangayMunicipalitiesCovered', v)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="No. of Organic Members (Male)" type="number" min="0" value={form.organicMembersMale} onChange={(v) => update('organicMembersMale', v)} />
                <Input label="No. of Organic Members (Female)" type="number" min="0" value={form.organicMembersFemale} onChange={(v) => update('organicMembersFemale', v)} />
                <Input label="No. of Conventional Members" type="number" min="0" value={form.conventionalMembers} onChange={(v) => update('conventionalMembers', v)} />
              </div>
              <p className="text-sm text-palette-slate">
                Total Organic Members: <strong className="text-palette-brown">{Number(form.organicMembersMale || 0) + Number(form.organicMembersFemale || 0)}</strong>
              </p>
              <h3 className="font-medium text-oa-green-dark">Head of Cooperative/Association</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Name" value={form.headName} onChange={(v) => update('headName', v)} />
                <Input label="Designation/Position" value={form.headDesignation} onChange={(v) => update('headDesignation', v)} />
                <Input label="Mobile No." value={form.headMobile} onChange={(v) => update('headMobile', v)} />
              </div>
              <h3 className="font-medium text-oa-green-dark mt-4">Registration Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Name of Contact Person" value={form.contactName} onChange={(v) => update('contactName', v)} />
                <Input label="Designation/Position" value={form.contactDesignation} onChange={(v) => update('contactDesignation', v)} />
                <Input label="Mobile No." value={form.contactMobile} onChange={(v) => update('contactMobile', v)} />
              </div>
            </div>
          </Section>

          <Section title="Certification">
            <Select label="Certification" value={form.certification} onChange={(v) => update('certification', v)} options={CERTIFICATION_OPTIONS} />
          </Section>

          <Section title="Organization Background">
            <div className="space-y-4">
              <Input label="Location of Production Area" value={form.locationOfProductionArea} onChange={(v) => update('locationOfProductionArea', v)} />
              {form.specializations.map((s, idx) => (
                <div key={idx} className="p-4 bg-palette-sky/20 rounded-lg border border-palette-sky/40">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-palette-brown">Specialization #{idx + 1}</span>
                    {form.specializations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, specializations: f.specializations.filter((_, i) => i !== idx) }))}
                        className="text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Specialization/Focus Commodity"
                      value={s.value}
                      onChange={(v) => updateSpecialization(idx, 'value', v)}
                      options={SPECIALIZATION_OPTIONS}
                    />
                    {SPECIALIZATION_REQUIRES_SPECIFY.includes(s.value) && (
                      <Input
                        label={`Specify (${s.value})`}
                        value={s.specify}
                        onChange={(v) => updateSpecialization(idx, 'specify', v)}
                        placeholder="Type here..."
                      />
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addSpecialization} className="flex items-center gap-2 text-palette-green font-medium">
                <Icon icon="mdi:plus" /> Add Specialization
              </button>
            </div>
          </Section>

          <Section title="Shared Facilities and Capacities">
            {form.sharedFacilities.map((s, idx) => (
              <div key={idx} className="p-4 bg-palette-sky/20 rounded-lg mb-4 border border-palette-sky/40">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium text-palette-brown">Facility #{idx + 1}</span>
                  {form.sharedFacilities.length > 1 && (
                    <button type="button" onClick={() => setForm((f) => ({ ...f, sharedFacilities: f.sharedFacilities.filter((_, i) => i !== idx) }))} className="text-red-600 text-sm">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Area (ha)" type="number" value={s.area} onChange={(v) => updateSharedFacility(idx, 'area', v)} />
                  <Input label="Type of Facilities" value={s.typeOfFacilities} onChange={(v) => updateSharedFacility(idx, 'typeOfFacilities', v)} />
                  <Input label="Size of Area (sqm)" value={s.sizeOfArea} onChange={(v) => updateSharedFacility(idx, 'sizeOfArea', v)} />
                  <Input label="Capacities" value={s.capacities} onChange={(v) => updateSharedFacility(idx, 'capacities', v)} />
                  <Input label="Cost" value={s.cost} onChange={(v) => updateSharedFacility(idx, 'cost', v)} />
                  <Input label="No. of Units" type="number" value={s.noOfUnits} onChange={(v) => updateSharedFacility(idx, 'noOfUnits', v)} />
                  <Select label="Dedicated to Organic" value={s.dedicatedToOrganic} onChange={(v) => updateSharedFacility(idx, 'dedicatedToOrganic', v)} options={['Yes', 'No']} />
                  <Input label="Remarks" value={s.remarks} onChange={(v) => updateSharedFacility(idx, 'remarks', v)} />
                </div>
              </div>
            ))}
            <button type="button" onClick={addSharedFacility} className="flex items-center gap-2 text-palette-green font-medium"><Icon icon="mdi:plus" /> Add Facility</button>
          </Section>

          <Section title="Machinery, Equipment, and Other Components">
            {form.machinery.map((m, idx) => (
              <div key={idx} className="p-4 bg-palette-sky/20 rounded-lg mb-4 border border-palette-sky/40">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium text-palette-brown">Item #{idx + 1}</span>
                  {form.machinery.length > 1 && (
                    <button type="button" onClick={() => setForm((f) => ({ ...f, machinery: f.machinery.filter((_, i) => i !== idx) }))} className="text-red-600 text-sm">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Type of Machinery/Equipment" value={m.type} onChange={(v) => updateMachinery(idx, 'type', v)} />
                  <Input label="Capacities" value={m.capacities} onChange={(v) => updateMachinery(idx, 'capacities', v)} />
                  <Input label="Cost" value={m.cost} onChange={(v) => updateMachinery(idx, 'cost', v)} />
                  <Input label="No. of Units" type="number" value={m.noOfUnits} onChange={(v) => updateMachinery(idx, 'noOfUnits', v)} />
                  <Select label="Dedicated to Organic" value={m.dedicatedToOrganic} onChange={(v) => updateMachinery(idx, 'dedicatedToOrganic', v)} options={['Yes', 'No']} />
                  <Input label="Remarks" value={m.remarks} onChange={(v) => updateMachinery(idx, 'remarks', v)} />
                </div>
              </div>
            ))}
            <button type="button" onClick={addMachinery} className="flex items-center gap-2 text-palette-green font-medium"><Icon icon="mdi:plus" /> Add Machinery</button>
          </Section>

          <Section title="Attachments / Documents">
            <FileUpload value={form.attachments} onChange={(v) => update('attachments', v)} />
          </Section>

          <div className="flex gap-4 pt-2">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Submit'}
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition">Cancel</button>
          </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-palette-brown mb-3 pb-2 border-b border-palette-sky/30">
        {title}
      </h2>
      <div className="pt-3">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required, ...rest }) {
  return (
    <div>
      <label className="block text-sm font-medium text-palette-brown mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="input-base" {...rest} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-palette-brown mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-base">
        <option value="">— Select —</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

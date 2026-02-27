import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { PROVINCES } from '../../constants';

const CERTIFICATION_OPTIONS = ['Devoted of Area', 'PGS', '3rd Party Certified'];

export default function FCAForm() {
  const { getProvince } = useAuth();
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
    organicMembers: 0,
    conventionalMembers: 0,
    headName: '',
    headDesignation: '',
    headMobile: '',
    contactName: '',
    contactDesignation: '',
    contactMobile: '',
    certification: '',
    locationOfProductionArea: '',
    sharedFacilities: [{ area: '', typeOfFacilities: '', sizeOfArea: '', capacities: '', cost: '', noOfUnits: '', dedicatedToOrganic: 'No', remarks: '' }],
    machinery: [{ type: '', capacities: '', cost: '', noOfUnits: '', dedicatedToOrganic: 'No', remarks: '' }],
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
            organicMembers: d.organicMembers || 0,
            conventionalMembers: d.conventionalMembers || 0,
            headName: d.headName || '',
            headDesignation: d.headDesignation || '',
            headMobile: d.headMobile || '',
            contactName: d.contactName || '',
            contactDesignation: d.contactDesignation || '',
            contactMobile: d.contactMobile || '',
            certification: d.certification || '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      province: province || form.province,
      engageInOA: true,
      updatedAt: new Date().toISOString(),
    };
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'fcas', id), payload);
      } else {
        await addDoc(collection(db, 'fcas'), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-oa-green-dark mb-6">
          Form B: Organic Agriculture Profile FCA Form {isEdit && '(Edit)'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <Section title="I. General Information">
            <div className="space-y-4">
              <Input label="Name of the FCA" value={form.nameOfFCA} onChange={(v) => update('nameOfFCA', v)} required />
              <Input label="Business Address" value={form.businessAddress} onChange={(v) => update('businessAddress', v)} />
              <Input label="Barangay/Municipalities Covered" value={form.barangayMunicipalitiesCovered} onChange={(v) => update('barangayMunicipalitiesCovered', v)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="No. of Organic Members" type="number" value={form.organicMembers} onChange={(v) => update('organicMembers', v)} />
                <Input label="No. of Conventional Members" type="number" value={form.conventionalMembers} onChange={(v) => update('conventionalMembers', v)} />
              </div>
              <h3 className="font-medium text-oa-green-dark">Head of Cooperative/Association</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Name" value={form.headName} onChange={(v) => update('headName', v)} />
                <Input label="Designation/Position" value={form.headDesignation} onChange={(v) => update('headDesignation', v)} />
                <Input label="Mobile No." value={form.headMobile} onChange={(v) => update('headMobile', v)} />
              </div>
              <h3 className="font-medium text-oa-green-dark mt-4">Registration Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Name of Contact Person" value={form.contactName} onChange={(v) => update('contactName', v)} />
                <Input label="Designation/Position" value={form.contactDesignation} onChange={(v) => update('contactDesignation', v)} />
                <Input label="Mobile No." value={form.contactMobile} onChange={(v) => update('contactMobile', v)} />
              </div>
            </div>
          </Section>

          <Section title="II. Certification">
            <Select label="Certification" value={form.certification} onChange={(v) => update('certification', v)} options={CERTIFICATION_OPTIONS} />
          </Section>

          <Section title="III. Organization Background">
            <Input label="Location of Production Area" value={form.locationOfProductionArea} onChange={(v) => update('locationOfProductionArea', v)} />
          </Section>

          <Section title="IV. Shared Facilities and Capacities">
            {form.sharedFacilities.map((s, idx) => (
              <div key={idx} className="p-4 bg-oa-cream/50 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium text-oa-green-dark">Facility #{idx + 1}</span>
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
            <button type="button" onClick={addSharedFacility} className="flex items-center gap-2 text-oa-green font-medium"><Icon icon="mdi:plus" /> Add Facility</button>
          </Section>

          <Section title="V. Machinery, Equipment, and Other Components">
            {form.machinery.map((m, idx) => (
              <div key={idx} className="p-4 bg-oa-cream/50 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium text-oa-green-dark">Item #{idx + 1}</span>
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
            <button type="button" onClick={addMachinery} className="flex items-center gap-2 text-oa-green font-medium"><Icon icon="mdi:plus" /> Add Machinery</button>
          </Section>

          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="px-6 py-3 bg-oa-green hover:bg-oa-green-dark text-white rounded-lg font-medium disabled:opacity-50">
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Submit'}
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-3 border border-oa-brown/30 rounded-lg text-oa-brown">Cancel</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-oa-green-dark mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-oa-brown mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full px-4 py-2 border border-oa-green/40 rounded-lg focus:ring-2 focus:ring-oa-green" />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-oa-brown mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-2 border border-oa-green/40 rounded-lg focus:ring-2 focus:ring-oa-green">
        <option value="">-- Select --</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

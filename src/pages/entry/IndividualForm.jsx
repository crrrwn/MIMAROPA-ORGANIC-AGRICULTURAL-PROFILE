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

const SEX_OPTIONS = ['Male', 'Female'];
const CIVIL_STATUS = ['Single', 'Married', 'Widowed', 'Separated', 'Solo Parent'];
const CERTIFICATION_OPTIONS = ['Devoted of Area', 'PGS', '3rd Party Certified'];
const COMMODITY_OPTIONS = ['Rice', 'Corn', 'Vegetables (Specify)', 'Livestock & Poultry (Specify)', 'Fertilizer (Specify)', 'Others (Specify)'];
const LAND_TENURE_OPTIONS = ['Owned', 'Co-Owned', 'Rent/Lease (Year/s)', 'Usufruct (Year/s)', 'Tenancy'];
const ANCESTRAL_DOMAIN_OPTIONS = [
  'Certificate of Ancestral Domain',
  'Certificate of Ancestral Land Title',
  'Certificate of Ancestral Land Claim',
];

const EMPTY_FARM = {
  farmAddress: '',
  landTitleRegistrationNo: '',
  landTenure: '',
  ancestralDomain: '',
};

const EMPTY_FORM = {
  sex: '',
  dateOfBirth: '',
  pwd: 'No',
  surname: '',
  firstName: '',
  middleName: '',
  extension: '',
  civilStatus: '',
  barangay: '',
  municipality: '',
  province: '',
  mobileNumber: '',
  certification: '',
  yearsInOrganicFarming: '',
  organicArea: '',
  commodities: [{ commodity: '', products: '', sizeOfArea: '', annualVolume: '', pricePerUnit: '', certification: '' }],
};

export default function IndividualForm() {
  const { getProvince } = useAuth();
  const { showNotification } = useNotification();
  const userProvince = getProvince();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [form, setForm] = useState({
    sex: '',
    dateOfBirth: '',
    pwd: 'No',
    surname: '',
    firstName: '',
    middleName: '',
    extension: '',
    civilStatus: '',
    barangay: '',
    municipality: '',
    province: userProvince || '',
    mobileNumber: '',
    farms: [{ ...EMPTY_FARM }],
    certification: '',
    yearsInOrganicFarming: '',
    organicArea: '',
    commodities: [{ commodity: '', products: '', sizeOfArea: '', annualVolume: '', pricePerUnit: '', certification: '' }],
    attachments: [],
  });

  useEffect(() => {
    if (isEdit && id) {
      getDoc(doc(db, 'individuals', id)).then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setForm({
            sex: d.sex || '',
            dateOfBirth: d.dateOfBirth || '',
            pwd: d.pwd || 'No',
            surname: d.surname || '',
            firstName: d.firstName || '',
            middleName: d.middleName || '',
            extension: d.extension || '',
            civilStatus: d.civilStatus || '',
            barangay: d.barangay || '',
            municipality: d.municipality || '',
            province: d.province || '',
            mobileNumber: d.mobileNumber || '',
            farms: Array.isArray(d.farms) && d.farms.length > 0
              ? d.farms.map((f) => ({
                  farmAddress: f.farmAddress || '',
                  landTitleRegistrationNo: f.landTitleRegistrationNo || '',
                  landTenure: f.landTenure || '',
                  ancestralDomain: f.ancestralDomain || '',
                }))
              : d.farmAddress || d.landTitleRegistrationNo || d.landTenure || d.ancestralDomain
                ? [{
                    farmAddress: d.farmAddress || '',
                    landTitleRegistrationNo: d.landTitleRegistrationNo || '',
                    landTenure: d.landTenure || '',
                    ancestralDomain: d.ancestralDomain || '',
                  }]
                : [{ ...EMPTY_FARM }],
            certification: d.certification || '',
            yearsInOrganicFarming: d.yearsInOrganicFarming || '',
            organicArea: d.organicArea || '',
            commodities: Array.isArray(d.commodities) && d.commodities.length > 0
              ? d.commodities.map((c) => ({
                  commodity: c.commodity || '',
                  products: c.products || '',
                  sizeOfArea: c.sizeOfArea || '',
                  annualVolume: c.annualVolume || '',
                  pricePerUnit: c.pricePerUnit || '',
                  certification: c.certification || '',
                }))
              : [{ commodity: '', products: '', sizeOfArea: '', annualVolume: '', pricePerUnit: '', certification: '' }],
            attachments: Array.isArray(d.attachments) ? d.attachments : [],
          });
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, isEdit]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const completeName = [form.surname, form.firstName, form.middleName].filter(Boolean).join(' ') + (form.extension ? ` ${form.extension}` : '');
  const completeAddress = [form.barangay, form.municipality, form.province].filter(Boolean).join(', ');

  const addCommodity = () => {
    setForm((f) => ({
      ...f,
      commodities: [...f.commodities, { commodity: '', products: '', sizeOfArea: '', annualVolume: '', pricePerUnit: '', certification: '' }],
    }));
  };

  const updateCommodity = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      commodities: f.commodities.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    }));
  };

  const addFarm = () => {
    setForm((f) => ({ ...f, farms: [...f.farms, { ...EMPTY_FARM }] }));
  };

  const updateFarm = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      farms: f.farms.map((farm, i) => (i === idx ? { ...farm, [field]: value } : farm)),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const finalProvince = userProvince || form.province;
    const payload = {
      ...form,
      completeName,
      completeAddress,
      province: finalProvince,
      commodities: form.commodities,
      certification: form.certification,
      attachments: form.attachments || [],
      updatedAt: new Date().toISOString(),
    };
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'individuals', id), payload);
        showNotification('Individual form updated successfully.');
      } else {
        await addDoc(collection(db, 'individuals'), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
        showNotification('Individual form submitted successfully.');
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
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border-2 border-palette-sky/50 bg-palette-cream/50 text-palette-brown hover:bg-palette-sky/20 hover:border-palette-blue/40"
        >
          <Icon icon="mdi:arrow-left" className="text-lg" /> Back to Dashboard
        </button>
        <form onSubmit={handleSubmit}>
          <div className="p-6 sm:p-8 bg-white rounded-2xl border-2 border-palette-sky/30 shadow-xl border-l-4 border-l-palette-green space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-6 border-b border-palette-sky/30">
              <div>
                <h1 className="text-2xl font-bold text-palette-brown">
                  Form A: Organic Agriculture Profile Individual Form
                </h1>
                <p className="text-sm text-palette-slate mt-2">
                  {isEdit ? 'Review and update the details of this individual organic practitioner.' : 'Fill out the information below for a new individual organic practitioner.'}
                </p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${isEdit ? 'bg-palette-cream text-palette-brown border-palette-sky/60' : 'bg-palette-green text-white border-palette-green/70'}`}>
                {isEdit ? 'Edit Mode' : 'New Entry'}
              </span>
            </div>
          <Section title="1. Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                <Select label="Sex" value={form.sex} onChange={(v) => update('sex', v)} options={SEX_OPTIONS} />
                <Input label="Date of Birth (MM/DD/YYYY)" type="date" value={form.dateOfBirth} onChange={(v) => update('dateOfBirth', v)} />
                <Select label="PWD" value={form.pwd} onChange={(v) => update('pwd', v)} options={['Yes', 'No']} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                <Input label="Surname" value={form.surname} onChange={(v) => update('surname', v)} required />
                <Input label="First Name" value={form.firstName} onChange={(v) => update('firstName', v)} required />
                <Input label="Middle Name" value={form.middleName} onChange={(v) => update('middleName', v)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                <Input label="Complete Name (Auto)" value={completeName} disabled />
                <Input label="Extension (e.g., Jr., II)" value={form.extension} onChange={(v) => update('extension', v)} placeholder="Jr., II" />
                <Select label="Civil Status" value={form.civilStatus} onChange={(v) => update('civilStatus', v)} options={CIVIL_STATUS} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                <Input label="Barangay" value={form.barangay} onChange={(v) => update('barangay', v)} required />
                <Input label="Municipality/City" value={form.municipality} onChange={(v) => update('municipality', v)} required />
                <Select label="Province" value={form.province} onChange={(v) => update('province', v)} options={PROVINCES} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                <Input label="Complete Address (Auto)" value={completeAddress} disabled />
                <Input label="Mobile Number" type="tel" value={form.mobileNumber} onChange={(v) => update('mobileNumber', v)} />
              </div>
            </div>
          </Section>

          <Section title="2. Agricultural Background">
            <div className="space-y-4">
              {form.farms.map((farm, idx) => (
                <div key={idx} className="p-4 bg-palette-sky/20 rounded-lg border border-palette-sky/40 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-palette-brown">Farm #{idx + 1}</span>
                    {form.farms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, farms: f.farms.filter((_, i) => i !== idx) }))}
                        className="text-red-600 text-sm hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input label="Farm Address" value={farm.farmAddress} onChange={(v) => updateFarm(idx, 'farmAddress', v)} placeholder="Full address of the farm" />
                    </div>
                    <Input label="Land Title Registration No." value={farm.landTitleRegistrationNo} onChange={(v) => updateFarm(idx, 'landTitleRegistrationNo', v)} placeholder="e.g. TCT-12345" />
                    <Select label="Land Tenure" value={farm.landTenure} onChange={(v) => updateFarm(idx, 'landTenure', v)} options={LAND_TENURE_OPTIONS} />
                    <div className="md:col-span-2">
                      <Select label="Ancestral Domain" value={farm.ancestralDomain} onChange={(v) => updateFarm(idx, 'ancestralDomain', v)} options={ANCESTRAL_DOMAIN_OPTIONS} />
                      <p className="text-xs text-palette-slate mt-1">Certificate of Ancestral Domain, Certificate of Ancestral Land Title, or Certificate of Ancestral Land Claim</p>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addFarm} className="flex items-center gap-2 text-palette-green font-medium">
                <Icon icon="mdi:plus" /> Add Farm
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Input label="No. of Years in Organic Farming" type="number" value={form.yearsInOrganicFarming} onChange={(v) => update('yearsInOrganicFarming', v)} />
                <Input label="Organic Area (ha)" type="number" step="0.01" value={form.organicArea} onChange={(v) => update('organicArea', v)} />
              </div>
            </div>
          </Section>

          <Section title="3. Organic Commodities / Product">
            {form.commodities.map((c, idx) => (
              <div key={idx} className="p-4 bg-palette-sky/20 rounded-lg mb-4 space-y-4 border border-palette-sky/40">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-oa-green-dark">Commodity #{idx + 1}</span>
                  {form.commodities.length > 1 && (
                    <button type="button" onClick={() => setForm((f) => ({ ...f, commodities: f.commodities.filter((_, i) => i !== idx) }))} className="text-red-600 text-sm">
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select label="Commodity" value={c.commodity} onChange={(v) => updateCommodity(idx, 'commodity', v)} options={COMMODITY_OPTIONS} />
                  <Input label="Product (Specify)" value={c.products} onChange={(v) => updateCommodity(idx, 'products', v)} />
                  <Input label="Size of Area (ha)" type="number" step="0.01" value={c.sizeOfArea} onChange={(v) => updateCommodity(idx, 'sizeOfArea', v)} />
                  <Input label="Annual Volume (kg)" type="number" value={c.annualVolume} onChange={(v) => updateCommodity(idx, 'annualVolume', v)} />
                  <Input label="Price per Unit" type="number" step="0.01" value={c.pricePerUnit} onChange={(v) => updateCommodity(idx, 'pricePerUnit', v)} />
                  <Select label="Certification" value={c.certification} onChange={(v) => updateCommodity(idx, 'certification', v)} options={CERTIFICATION_OPTIONS} />
                </div>
              </div>
            ))}
            <button type="button" onClick={addCommodity} className="flex items-center gap-2 text-palette-green font-medium">
              <Icon icon="mdi:plus" /> Add Commodity
            </button>
          </Section>

          <Section title="4. Attachments / Documents">
            <FileUpload value={form.attachments} onChange={(v) => update('attachments', v)} />
          </Section>

          <div className="flex gap-4 pt-2">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Submit'}
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition">
              Cancel
            </button>
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
      <h2 className="text-base font-semibold text-palette-brown mb-3 flex items-center gap-2 pb-2 border-b border-palette-sky/30">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-palette-green/10 text-palette-green text-xs font-bold">
          {title.split('.')[0]}
        </span>
        <span>{title.replace(/^[0-9.\\s]+/, '')}</span>
      </h2>
      <div className="pt-3">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required, disabled, placeholder, step }) {
  return (
    <div>
      <label className="block text-sm font-medium text-palette-brown mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        step={step}
        className="input-base disabled:bg-gray-50"
      />
    </div>
  );
}

function Select({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-palette-brown mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="input-base"
      >
        <option value="">— Select —</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

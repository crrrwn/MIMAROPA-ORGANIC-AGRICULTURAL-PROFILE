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
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
        
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
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-palette-green via-palette-sky to-palette-blue"></div>
            
            {/* Form Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-slate-100 mb-10">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-palette-green/10 flex items-center justify-center border border-palette-green/20 shrink-0 mt-1">
                  <Icon icon="mdi:account-edit-outline" className="text-3xl text-palette-green" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                    Individual Profile Form
                  </h1>
                  <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed max-w-xl">
                    {isEdit ? 'Review and update the details of this individual organic practitioner.' : 'Fill out the information below to register a new individual organic practitioner.'}
                  </p>
                </div>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm shrink-0 border ${isEdit ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-palette-green text-white border-palette-green/20'}`}>
                <Icon icon={isEdit ? 'mdi:pencil-outline' : 'mdi:plus-circle-outline'} className="text-lg" />
                {isEdit ? 'Edit Mode' : 'New Entry'}
              </div>
            </div>

            <div className="space-y-12">
              <Section title="1. Personal Information" icon="mdi:account-outline">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Select label="Sex" value={form.sex} onChange={(v) => update('sex', v)} options={SEX_OPTIONS} />
                    <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => update('dateOfBirth', v)} />
                    <Select label="PWD/Senior Citizen?" value={form.pwd} onChange={(v) => update('pwd', v)} options={['Yes', 'No']} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <Input label="First Name" value={form.firstName} onChange={(v) => update('firstName', v)} required />
                    <Input label="Middle Name" value={form.middleName} onChange={(v) => update('middleName', v)} />
                    <Input label="Surname" value={form.surname} onChange={(v) => update('surname', v)} required />
                    <Input label="Extension" value={form.extension} onChange={(v) => update('extension', v)} placeholder="e.g. Jr., III" />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                      <Icon icon="mdi:account-badge-outline" className="text-xl text-slate-400" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Generated Full Name</span>
                      <span className="text-slate-800 font-bold">{completeName || '—'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Select label="Civil Status" value={form.civilStatus} onChange={(v) => update('civilStatus', v)} options={CIVIL_STATUS} />
                    <Input label="Mobile Number" type="tel" value={form.mobileNumber} onChange={(v) => update('mobileNumber', v)} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Input label="Barangay" value={form.barangay} onChange={(v) => update('barangay', v)} required />
                    <Input label="Municipality/City" value={form.municipality} onChange={(v) => update('municipality', v)} required />
                    <Select label="Province" value={form.province} onChange={(v) => update('province', v)} options={PROVINCES} required />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                      <Icon icon="mdi:map-marker-outline" className="text-xl text-slate-400" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Generated Full Address</span>
                      <span className="text-slate-800 font-bold">{completeAddress || '—'}</span>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="2. Agricultural Background" icon="mdi:sprout-outline">
                <div className="space-y-6">
                  {form.farms.map((farm, idx) => (
                    <div key={idx} className="relative p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200/60">
                        <span className="font-bold text-slate-700 flex items-center gap-2">
                          <Icon icon="mdi:barn" className="text-slate-400 text-lg" />
                          Farm #{idx + 1}
                        </span>
                        {form.farms.length > 1 && (
                          <button type="button" onClick={() => setForm((f) => ({ ...f, farms: f.farms.filter((_, i) => i !== idx) }))} className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-red-100 shadow-sm transition-colors">
                            <Icon icon="mdi:trash-can-outline" /> Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                          <Input label="Farm Address" value={farm.farmAddress} onChange={(v) => updateFarm(idx, 'farmAddress', v)} placeholder="Full address of the farm" />
                        </div>
                        <Input label="Land Title Registration No." value={farm.landTitleRegistrationNo} onChange={(v) => updateFarm(idx, 'landTitleRegistrationNo', v)} placeholder="e.g. TCT-12345" />
                        <Select label="Land Tenure" value={farm.landTenure} onChange={(v) => updateFarm(idx, 'landTenure', v)} options={LAND_TENURE_OPTIONS} />
                        <div className="md:col-span-2">
                          <Select label="Ancestral Domain Certificate" value={farm.ancestralDomain} onChange={(v) => updateFarm(idx, 'ancestralDomain', v)} options={ANCESTRAL_DOMAIN_OPTIONS} />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button type="button" onClick={addFarm} className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all active:scale-95 text-sm">
                    <Icon icon="mdi:plus-circle-outline" className="text-lg" /> Add Another Farm
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6 border-t border-slate-100">
                    <Input label="Years in Organic Farming" type="number" value={form.yearsInOrganicFarming} onChange={(v) => update('yearsInOrganicFarming', v)} />
                    <Input label="Total Organic Area (ha)" type="number" step="0.01" value={form.organicArea} onChange={(v) => update('organicArea', v)} />
                  </div>
                </div>
              </Section>

              <Section title="3. Organic Commodities & Products" icon="mdi:basket-outline">
                <div className="space-y-4">
                  {form.commodities.map((c, idx) => (
                    <div key={idx} className="relative p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200/60">
                        <span className="font-bold text-slate-700 flex items-center gap-2">
                          <Icon icon="mdi:leaf" className="text-slate-400 text-lg" />
                          Commodity #{idx + 1}
                        </span>
                        {form.commodities.length > 1 && (
                          <button type="button" onClick={() => setForm((f) => ({ ...f, commodities: f.commodities.filter((_, i) => i !== idx) }))} className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-red-100 shadow-sm transition-colors">
                            <Icon icon="mdi:trash-can-outline" /> Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <Select label="Commodity Category" value={c.commodity} onChange={(v) => updateCommodity(idx, 'commodity', v)} options={COMMODITY_OPTIONS} />
                        <Input label="Specific Product" value={c.products} onChange={(v) => updateCommodity(idx, 'products', v)} placeholder="e.g. Tomatoes, Cabbage" />
                        <Input label="Size of Area (ha)" type="number" step="0.01" value={c.sizeOfArea} onChange={(v) => updateCommodity(idx, 'sizeOfArea', v)} />
                        <Input label="Annual Volume (kg)" type="number" value={c.annualVolume} onChange={(v) => updateCommodity(idx, 'annualVolume', v)} />
                        <Input label="Price per Unit (PHP)" type="number" step="0.01" value={c.pricePerUnit} onChange={(v) => updateCommodity(idx, 'pricePerUnit', v)} />
                        <Select label="Certification Status" value={c.certification} onChange={(v) => updateCommodity(idx, 'certification', v)} options={CERTIFICATION_OPTIONS} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addCommodity} className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all active:scale-95 text-sm">
                    <Icon icon="mdi:plus-circle-outline" className="text-lg" /> Add Another Commodity
                  </button>
                </div>
              </Section>

              <Section title="4. Attachments & Documents" icon="mdi:paperclip">
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

function Input({ label, value, onChange, type = 'text', required, disabled, placeholder, step, ...rest }) {
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
        disabled={disabled}
        placeholder={placeholder}
        step={step}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:bg-white focus:ring-4 focus:ring-palette-green/10 focus:border-palette-green outline-none transition-all placeholder:text-slate-400 font-medium text-sm shadow-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed" 
        {...rest} 
      />
    </div>
  );
}

function Select({ label, value, onChange, options, required }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-slate-700">
        {label} {required && <span className="text-red-500 font-black ml-1">*</span>}
      </label>
      <div className="relative">
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          required={required}
          className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 focus:bg-white focus:ring-4 focus:ring-palette-green/10 focus:border-palette-green outline-none transition-all font-medium text-sm shadow-sm appearance-none cursor-pointer"
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
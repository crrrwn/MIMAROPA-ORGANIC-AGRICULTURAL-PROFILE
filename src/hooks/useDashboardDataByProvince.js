import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PROVINCES } from '../constants';

function emptyCommodity() {
  return { totalArea: 0, items: [] };
}

function emptyMetrics() {
  return {
    oaArea: { totalDevoted: 0, totalPGSCertified: 0, total3rdParty: 0 },
    practitioners: { totalFarmers: 0, totalDevoted: 0, totalPGSCertified: 0, total3rdParty: 0, totalMale: 0, totalFemale: 0, totalPWD: 0, totalSeniorCitizen: 0, totalIP: 0, totalYouth: 0 },
    fcas: {
      engageInOA: 0,
      organicMembersMale: 0,
      organicMembersFemale: 0,
      totalSharedFacilities: 0,
      sharedFacilitiesDedicatedToOrganic: 0,
      sharedFacilitiesByType: {},
      machineryByType: {},
    },
    commodities: {
      rice: emptyCommodity(),
      corn: emptyCommodity(),
      vegetables: emptyCommodity(),
      livestockPoultry: emptyCommodity(),
      fertilizer: emptyCommodity(),
      others: emptyCommodity(),
    },
    pgs: { accreditedGroups: 0, applyingForAccreditation: 0, engagedOrganicFarming: 0, certifiedFarmers: 0, certifiedArea: 0 },
  };
}

function getDocYear(d) {
  const dateStr = d.dateSubmitted || d.updatedAt || d.createdAt;
  if (!dateStr) return null;
  const y = new Date(dateStr).getFullYear();
  return Number.isNaN(y) ? null : y;
}

export function useDashboardDataByProvince(province = null, selectedYear = null) {
  const [data, setData] = useState(emptyMetrics());
  const [perProvince, setPerProvince] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let indUnsub, fcasUnsub;
    let indSnapData = { docs: [] };
    let fcasSnapData = { docs: [] };

    function processAndSet() {
      try {
        const indSnap = indSnapData;
        const fcasSnap = fcasSnapData;
        const byProvince = {};
        PROVINCES.forEach((p) => {
          byProvince[p] = emptyMetrics();
        });

        const processIndividual = (d, target) => {
          target.practitioners.totalFarmers += 1;
          const area = parseFloat(d.organicArea) || 0;
          const name = d.completeName || [d.surname, d.firstName].filter(Boolean).join(' ') || 'N/A';
          const coms = Array.isArray(d.commodities) ? d.commodities : (d.commodity ? [{ commodity: d.commodity, sizeOfArea: d.organicArea, certification: d.certification, products: '' }] : []);
          const hasCommodityCerts = coms.some((c) => (c.certification || '').trim());
          const certFlags = { devoted: false, pgs: false, thirdParty: false };

          if (hasCommodityCerts) {
            coms.forEach((c) => {
              const cert = (c.certification || '').toLowerCase();
              const itemArea = parseFloat(c.sizeOfArea) || 0;
              if (cert.includes('devoted')) {
                target.oaArea.totalDevoted += itemArea;
                certFlags.devoted = true;
              }
              if (cert.includes('pgs')) {
                target.oaArea.totalPGSCertified += itemArea;
                certFlags.pgs = true;
                target.pgs.certifiedArea += itemArea;
              }
              if (cert.includes('3rd') || cert.includes('third')) {
                target.oaArea.total3rdParty += itemArea;
                certFlags.thirdParty = true;
              }
            });
          } else {
            // Fallback: individual-level certification (backward compatibility)
            const cert = (d.certification || '').toLowerCase();
            if (cert.includes('devoted')) {
              target.oaArea.totalDevoted += area;
              certFlags.devoted = true;
            }
            if (cert.includes('pgs')) {
              target.oaArea.totalPGSCertified += area;
              certFlags.pgs = true;
              target.pgs.certifiedArea += area;
            }
            if (cert.includes('3rd') || cert.includes('third')) {
              target.oaArea.total3rdParty += area;
              certFlags.thirdParty = true;
            }
          }
          if (certFlags.devoted) target.practitioners.totalDevoted++;
          if (certFlags.pgs) {
            target.practitioners.totalPGSCertified++;
            target.pgs.certifiedFarmers++;
          }
          if (certFlags.thirdParty) target.practitioners.total3rdParty++;

          coms.forEach((c) => {
            const comm = (c.commodity || '').toLowerCase();
            const itemArea = parseFloat(c.sizeOfArea) || 0;
            const itemVolume = parseFloat(c.annualVolume) || 0;
            const itemVolumeUnit = (c.annualVolumeUnit || '').trim() || 'Kg';
            const item = {
              name,
              products: c.products || '',
              area: itemArea,
              volume: itemVolume,
              volumeUnit: itemVolumeUnit,
              commodity: c.commodity,
              certification: (c.certification || d.certification || '').trim(),
            };
            if (comm.includes('rice')) {
              target.commodities.rice.totalArea += itemArea;
              target.commodities.rice.items.push(item);
            } else if (comm.includes('corn')) {
              target.commodities.corn.totalArea += itemArea;
              target.commodities.corn.items.push(item);
            } else if (comm.includes('vegetable')) {
              target.commodities.vegetables.totalArea += itemArea;
              target.commodities.vegetables.items.push(item);
            } else if (comm.includes('livestock') || comm.includes('poultry')) {
              target.commodities.livestockPoultry.totalArea += itemArea;
              target.commodities.livestockPoultry.items.push(item);
            } else if (comm.includes('fertilizer')) {
              target.commodities.fertilizer.totalArea += itemArea;
              target.commodities.fertilizer.items.push(item);
            } else if (comm) {
              target.commodities.others.totalArea += itemArea;
              target.commodities.others.items.push(item);
            }
          });

          const sex = (d.sex || '').toLowerCase();
          if (sex === 'male') target.practitioners.totalMale++;
          else if (sex === 'female') target.practitioners.totalFemale++;

          const pwdVal = (d.pwd || '').toLowerCase();
          const seniorVal = (d.seniorCitizen || '').toLowerCase();
          const ipVal = (d.ip || '').toLowerCase();
          const youthVal = (d.youth || '').toLowerCase();
          if (d.pwd === 'Yes' || pwdVal === 'yes') target.practitioners.totalPWD++;
          if (d.seniorCitizen === 'Yes' || seniorVal === 'yes' || pwdVal === 'senior citizen') target.practitioners.totalSeniorCitizen++;
          if (d.ip === 'Yes' || ipVal === 'yes') target.practitioners.totalIP++;
          if (d.youth === 'Yes' || youthVal === 'yes') target.practitioners.totalYouth++;
        };

        const filterByYear = (d) => {
          if (selectedYear == null) return true;
          const docYear = getDocYear(d);
          return docYear !== null && docYear === selectedYear;
        };

        (indSnap.docs || []).forEach((docSnap) => {
          const d = docSnap.data();
          if (!filterByYear(d)) return;
          const p = d.province || 'Other';
          if (!byProvince[p]) byProvince[p] = emptyMetrics();
          processIndividual(d, byProvince[p]);
        });

        (fcasSnap.docs || []).forEach((docSnap) => {
          const d = docSnap.data();
          if (!filterByYear(d)) return;
          const p = d.province || 'Other';
          if (!byProvince[p]) byProvince[p] = emptyMetrics();
          if (d.engageInOA) byProvince[p].fcas.engageInOA++;
          byProvince[p].fcas.organicMembersMale += Number(d.organicMembersMale) || 0;
          byProvince[p].fcas.organicMembersFemale += Number(d.organicMembersFemale) || 0;
          const fcaName = d.nameOfFCA || 'N/A';
          const facilities = Array.isArray(d.sharedFacilities) ? d.sharedFacilities : [];
          byProvince[p].fcas.totalSharedFacilities += facilities.length;
          facilities.forEach((f) => {
            if ((f.dedicatedToOrganic || '').toString().toLowerCase() === 'yes') {
              byProvince[p].fcas.sharedFacilitiesDedicatedToOrganic++;
            }
            const type = (f.typeOfFacilities || 'Unspecified').trim() || 'Unspecified';
            if (!byProvince[p].fcas.sharedFacilitiesByType[type]) byProvince[p].fcas.sharedFacilitiesByType[type] = { count: 0, items: [] };
            byProvince[p].fcas.sharedFacilitiesByType[type].count++;
            byProvince[p].fcas.sharedFacilitiesByType[type].items.push({
              fcaName,
              area: f.area || '',
              typeOfFacilities: f.typeOfFacilities || '',
              sizeOfArea: f.sizeOfArea || '',
              capacities: f.capacities || '',
              cost: f.cost || '',
              noOfUnits: f.noOfUnits || '',
              dedicatedToOrganic: f.dedicatedToOrganic || '',
              remarks: f.remarks || '',
            });
          });
          const machinery = Array.isArray(d.machinery) ? d.machinery : [];
          machinery.forEach((m) => {
            const type = (m.type || 'Unspecified').trim() || 'Unspecified';
            if (!byProvince[p].fcas.machineryByType[type]) byProvince[p].fcas.machineryByType[type] = { count: 0, items: [] };
            byProvince[p].fcas.machineryByType[type].count++;
            byProvince[p].fcas.machineryByType[type].items.push({
              fcaName,
              type: m.type || '',
              capacities: m.capacities || '',
              cost: m.cost || '',
              noOfUnits: m.noOfUnits || '',
              dedicatedToOrganic: m.dedicatedToOrganic || '',
              remarks: m.remarks || '',
            });
          });
          const fcaCert = (d.certification || '').toLowerCase();
          if (fcaCert.includes('pgs accredited') || fcaCert.includes('pgs accreditation')) {
            byProvince[p].pgs.accreditedGroups++;
          }
          if (fcaCert.includes('applying for accreditation') || fcaCert.includes('applying')) {
            byProvince[p].pgs.applyingForAccreditation++;
          }
          if (fcaCert.includes('engaged organic farming') || fcaCert.includes('engaged')) {
            byProvince[p].pgs.engagedOrganicFarming++;
          }
        });

        if (province) {
          byProvince[province] = byProvince[province] || emptyMetrics();
        } else {
          PROVINCES.forEach((p) => { if (!byProvince[p]) byProvince[p] = emptyMetrics(); });
        }
        setPerProvince(byProvince);

        const target = province ? (byProvince[province] || emptyMetrics()) : Object.values(byProvince).reduce((acc, m) => {
          acc.oaArea.totalDevoted += m.oaArea.totalDevoted;
          acc.oaArea.totalPGSCertified += m.oaArea.totalPGSCertified;
          acc.oaArea.total3rdParty += m.oaArea.total3rdParty;
          acc.practitioners.totalFarmers += m.practitioners.totalFarmers || 0;
          acc.practitioners.totalDevoted += m.practitioners.totalDevoted;
          acc.practitioners.totalPGSCertified += m.practitioners.totalPGSCertified;
          acc.practitioners.total3rdParty += m.practitioners.total3rdParty;
          acc.practitioners.totalMale += m.practitioners.totalMale || 0;
          acc.practitioners.totalFemale += m.practitioners.totalFemale || 0;
          acc.practitioners.totalPWD += m.practitioners.totalPWD || 0;
          acc.practitioners.totalSeniorCitizen += m.practitioners.totalSeniorCitizen || 0;
          acc.practitioners.totalIP += m.practitioners.totalIP || 0;
          acc.practitioners.totalYouth += m.practitioners.totalYouth || 0;
          acc.fcas.engageInOA += m.fcas.engageInOA;
          acc.fcas.organicMembersMale += m.fcas.organicMembersMale || 0;
          acc.fcas.organicMembersFemale += m.fcas.organicMembersFemale || 0;
          acc.fcas.totalSharedFacilities += m.fcas.totalSharedFacilities || 0;
          acc.fcas.sharedFacilitiesDedicatedToOrganic += m.fcas.sharedFacilitiesDedicatedToOrganic || 0;
          Object.entries(m.fcas.sharedFacilitiesByType || {}).forEach(([k, v]) => {
            const prev = acc.fcas.sharedFacilitiesByType[k] || { count: 0, items: [] };
            acc.fcas.sharedFacilitiesByType[k] = {
              count: prev.count + (v.count ?? 0),
              items: [...(prev.items || []), ...(v.items || [])],
            };
          });
          Object.entries(m.fcas.machineryByType || {}).forEach(([k, v]) => {
            const prev = acc.fcas.machineryByType[k] || { count: 0, items: [] };
            acc.fcas.machineryByType[k] = {
              count: prev.count + (v.count ?? 0),
              items: [...(prev.items || []), ...(v.items || [])],
            };
          });
          ['rice', 'corn', 'vegetables', 'livestockPoultry', 'fertilizer', 'others'].forEach((k) => {
            acc.commodities[k].totalArea += (m.commodities[k]?.totalArea || 0);
            acc.commodities[k].items = [...(acc.commodities[k].items || []), ...(m.commodities[k]?.items || [])];
          });
          acc.pgs.accreditedGroups += m.pgs.accreditedGroups;
          acc.pgs.applyingForAccreditation += m.pgs.applyingForAccreditation;
          acc.pgs.engagedOrganicFarming += m.pgs.engagedOrganicFarming;
          acc.pgs.certifiedFarmers += m.pgs.certifiedFarmers;
          acc.pgs.certifiedArea += m.pgs.certifiedArea;
          return acc;
        }, emptyMetrics());

        setData(target);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    const indRef = collection(db, 'individuals');
    const fcasRef = collection(db, 'fcas');
    const indQuery = province ? query(indRef, where('province', '==', province)) : indRef;
    const fcasQuery = province ? query(fcasRef, where('province', '==', province)) : fcasRef;

    indUnsub = onSnapshot(indQuery, (snap) => {
      indSnapData = snap;
      processAndSet();
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    fcasUnsub = onSnapshot(fcasQuery, (snap) => {
      fcasSnapData = snap;
      processAndSet();
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => {
      indUnsub?.();
      fcasUnsub?.();
    };
  }, [province, selectedYear]);

  return { data, perProvince, loading, error };
}

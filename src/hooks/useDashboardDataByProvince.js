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
    practitioners: { totalDevoted: 0, totalPGSCertified: 0, total3rdParty: 0 },
    fcas: { engageInOA: 0 },
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

export function useDashboardDataByProvince(province = null) {
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
          const cert = (d.certification || '').toLowerCase();
          const area = parseFloat(d.organicArea) || 0;
          const name = d.completeName || [d.surname, d.firstName].filter(Boolean).join(' ') || 'N/A';
          if (cert.includes('devoted')) {
            target.oaArea.totalDevoted += area;
            target.practitioners.totalDevoted++;
          }
          if (cert.includes('pgs')) {
            target.oaArea.totalPGSCertified += area;
            target.practitioners.totalPGSCertified++;
            target.pgs.certifiedFarmers++;
            target.pgs.certifiedArea += area;
          }
          if (cert.includes('3rd') || cert.includes('third')) {
            target.oaArea.total3rdParty += area;
            target.practitioners.total3rdParty++;
          }
          const coms = Array.isArray(d.commodities) ? d.commodities : (d.commodity ? [{ commodity: d.commodity, sizeOfArea: d.organicArea, products: '' }] : []);
          coms.forEach((c) => {
            const comm = (c.commodity || '').toLowerCase();
            const itemArea = parseFloat(c.sizeOfArea) || 0;
            const itemVolume = parseFloat(c.annualVolume) || 0;
            const item = { name, products: c.products || '', area: itemArea, volume: itemVolume, commodity: c.commodity };
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
        };

        (indSnap.docs || []).forEach((docSnap) => {
          const d = docSnap.data();
          const p = d.province || 'Other';
          if (!byProvince[p]) byProvince[p] = emptyMetrics();
          processIndividual(d, byProvince[p]);
        });

        (fcasSnap.docs || []).forEach((docSnap) => {
          const d = docSnap.data();
          const p = d.province || 'Other';
          if (!byProvince[p]) byProvince[p] = emptyMetrics();
          if (d.engageInOA) byProvince[p].fcas.engageInOA++;
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
          acc.practitioners.totalDevoted += m.practitioners.totalDevoted;
          acc.practitioners.totalPGSCertified += m.practitioners.totalPGSCertified;
          acc.practitioners.total3rdParty += m.practitioners.total3rdParty;
          acc.fcas.engageInOA += m.fcas.engageInOA;
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
  }, [province]);

  return { data, perProvince, loading, error };
}

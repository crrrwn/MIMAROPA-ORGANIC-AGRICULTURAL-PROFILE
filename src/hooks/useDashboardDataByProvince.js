import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PROVINCES } from '../constants';

function emptyMetrics() {
  return {
    oaArea: { totalDevoted: 0, totalPGSCertified: 0, total3rdParty: 0 },
    practitioners: { totalDevoted: 0, totalPGSCertified: 0, total3rdParty: 0 },
    fcas: { engageInOA: 0 },
    commodities: { rice: 0, corn: 0, vegetables: 0, livestockPoultry: 0, fertilizer: 0, others: 0 },
    pgs: { accreditedGroups: 0, applyingForAccreditation: 0, certifiedFarmers: 0, certifiedArea: 0 },
  };
}

export function useDashboardDataByProvince(province = null) {
  const [data, setData] = useState(emptyMetrics());
  const [perProvince, setPerProvince] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const indRef = collection(db, 'individuals');
        const fcasRef = collection(db, 'fcas');
        const indQuery = province ? query(indRef, where('province', '==', province)) : indRef;
        const fcasQuery = province ? query(fcasRef, where('province', '==', province)) : fcasRef;
        const [indSnap, fcasSnap] = await Promise.all([
          getDocs(indQuery),
          getDocs(fcasQuery),
        ]);

        const byProvince = {};
        PROVINCES.forEach((p) => {
          byProvince[p] = emptyMetrics();
        });

        const processIndividual = (d, target) => {
          const cert = (d.certification || '').toLowerCase();
          const area = parseFloat(d.organicArea) || 0;
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
          const coms = Array.isArray(d.commodities) ? d.commodities : (d.commodity ? [{ commodity: d.commodity }] : []);
          coms.forEach((c) => {
            const comm = (c.commodity || '').toLowerCase();
            if (comm.includes('rice')) target.commodities.rice++;
            else if (comm.includes('corn')) target.commodities.corn++;
            else if (comm.includes('vegetable')) target.commodities.vegetables++;
            else if (comm.includes('livestock') || comm.includes('poultry')) target.commodities.livestockPoultry++;
            else if (comm.includes('fertilizer')) target.commodities.fertilizer++;
            else if (comm) target.commodities.others++;
          });
        };

        indSnap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          const p = d.province || 'Other';
          if (!byProvince[p]) byProvince[p] = emptyMetrics();
          processIndividual(d, byProvince[p]);
        });

        fcasSnap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          const p = d.province || 'Other';
          if (!byProvince[p]) byProvince[p] = emptyMetrics();
          if (d.engageInOA) byProvince[p].fcas.engageInOA++;
        });

        if (province) {
          byProvince[province] = byProvince[province] || emptyMetrics();
        } else {
          PROVINCES.forEach((p) => { if (!byProvince[p]) byProvince[p] = emptyMetrics(); });
        }
        setPerProvince(byProvince);

        const target = province ? (byProvince[province] || emptyMetrics()) : PROVINCES.reduce((acc, p) => {
          const m = byProvince[p] || emptyMetrics();
          acc.oaArea.totalDevoted += m.oaArea.totalDevoted;
          acc.oaArea.totalPGSCertified += m.oaArea.totalPGSCertified;
          acc.oaArea.total3rdParty += m.oaArea.total3rdParty;
          acc.practitioners.totalDevoted += m.practitioners.totalDevoted;
          acc.practitioners.totalPGSCertified += m.practitioners.totalPGSCertified;
          acc.practitioners.total3rdParty += m.practitioners.total3rdParty;
          acc.fcas.engageInOA += m.fcas.engageInOA;
          acc.commodities.rice += m.commodities.rice;
          acc.commodities.corn += m.commodities.corn;
          acc.commodities.vegetables += m.commodities.vegetables;
          acc.commodities.livestockPoultry += m.commodities.livestockPoultry;
          acc.commodities.fertilizer += m.commodities.fertilizer;
          acc.commodities.others += m.commodities.others;
          acc.pgs.accreditedGroups += m.pgs.accreditedGroups;
          acc.pgs.applyingForAccreditation += m.pgs.applyingForAccreditation;
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
    fetchData();
  }, [province]);

  return { data, perProvince, loading, error };
}

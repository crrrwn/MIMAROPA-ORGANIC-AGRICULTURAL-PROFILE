import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useDashboardData(province = null) {
  const [data, setData] = useState({
    oaArea: { totalDevoted: 0, totalPGSCertified: 0, total3rdParty: 0 },
    practitioners: { totalDevoted: 0, totalPGSCertified: 0, total3rdParty: 0 },
    fcas: { engageInOA: 0 },
    commodities: { rice: 0, corn: 0, vegetables: 0, livestockPoultry: 0, fertilizer: 0, others: 0 },
    pgs: { accreditedGroups: 0, applyingForAccreditation: 0, certifiedFarmers: 0, certifiedArea: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const individualsRef = collection(db, 'individuals');
        const fcasRef = collection(db, 'fcas');
        const qInd = province ? query(individualsRef, where('province', '==', province)) : individualsRef;
        const qFcas = province ? query(fcasRef, where('province', '==', province)) : fcasRef;

        const [indSnap, fcasSnap] = await Promise.all([getDocs(qInd), getDocs(qFcas)]);

        const oaArea = { totalDevoted: 0, totalPGSCertified: 0, total3rdParty: 0 };
        const practitioners = { totalDevoted: 0, totalPGSCertified: 0, total3rdParty: 0 };
        const commodities = { rice: 0, corn: 0, vegetables: 0, livestockPoultry: 0, fertilizer: 0, others: 0 };
        const pgs = { accreditedGroups: 0, applyingForAccreditation: 0, certifiedFarmers: 0, certifiedArea: 0 };
        let fcasOA = 0;

        indSnap.docs.forEach((doc) => {
          const d = doc.data();
          const area = parseFloat(d.organicArea) || 0;
          const coms = Array.isArray(d.commodities) ? d.commodities : (d.commodity ? [{ commodity: d.commodity, sizeOfArea: d.organicArea, certification: d.certification }] : []);
          const hasCommodityCerts = coms.some((c) => (c.certification || '').trim());

          if (hasCommodityCerts) {
            coms.forEach((c) => {
              const cert = (c.certification || '').toLowerCase();
              const itemArea = parseFloat(c.sizeOfArea) || 0;
              if (cert.includes('devoted')) {
                oaArea.totalDevoted += itemArea;
                practitioners.totalDevoted++;
              }
              if (cert.includes('pgs')) {
                oaArea.totalPGSCertified += itemArea;
                practitioners.totalPGSCertified++;
                pgs.certifiedFarmers++;
                pgs.certifiedArea += itemArea;
              }
              if (cert.includes('3rd') || cert.includes('third')) {
                oaArea.total3rdParty += itemArea;
                practitioners.total3rdParty++;
              }
            });
          } else {
            const cert = (d.certification || '').toLowerCase();
            if (cert.includes('devoted')) {
              oaArea.totalDevoted += area;
              practitioners.totalDevoted++;
            }
            if (cert.includes('pgs')) {
              oaArea.totalPGSCertified += area;
              practitioners.totalPGSCertified++;
              pgs.certifiedFarmers++;
              pgs.certifiedArea += area;
            }
            if (cert.includes('3rd') || cert.includes('third')) {
              oaArea.total3rdParty += area;
              practitioners.total3rdParty++;
            }
          }

          coms.forEach((c) => {
            const comm = (c.commodity || '').toLowerCase();
            if (comm.includes('rice')) commodities.rice++;
            else if (comm.includes('corn')) commodities.corn++;
            else if (comm.includes('vegetable')) commodities.vegetables++;
            else if (comm.includes('livestock') || comm.includes('poultry')) commodities.livestockPoultry++;
            else if (comm.includes('fertilizer')) commodities.fertilizer++;
            else if (comm) commodities.others++;
          });
        });

        fcasSnap.docs.forEach((doc) => {
          const d = doc.data();
          if (d.engageInOA) fcasOA++;
        });

        setData({
          oaArea,
          practitioners,
          fcas: { engageInOA: fcasOA },
          commodities,
          pgs,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [province]);

  return { data, loading, error };
}

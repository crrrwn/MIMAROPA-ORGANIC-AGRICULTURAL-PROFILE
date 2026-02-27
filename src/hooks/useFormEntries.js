import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useFormEntries(province = null) {
  const [individuals, setIndividuals] = useState([]);
  const [fcas, setFcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const indRef = collection(db, 'individuals');
      const fcasRef = collection(db, 'fcas');
      const indQuery = province ? query(indRef, where('province', '==', province)) : indRef;
      const fcasQuery = province ? query(fcasRef, where('province', '==', province)) : fcasRef;
      const [indSnap, fcasSnap] = await Promise.all([getDocs(indQuery), getDocs(fcasQuery)]);

      const indList = indSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      const fcaList = fcasSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      setIndividuals(indList);
      setFcas(fcaList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [province]);

  return { individuals, fcas, loading, error, refresh: fetchData };
}

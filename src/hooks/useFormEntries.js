import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useFormEntries(province = null) {
  const [individuals, setIndividuals] = useState([]);
  const [fcas, setFcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const indRef = collection(db, 'individuals');
    const fcasRef = collection(db, 'fcas');
    const indQuery = province ? query(indRef, where('province', '==', province)) : indRef;
    const fcasQuery = province ? query(fcasRef, where('province', '==', province)) : fcasRef;

    const unsubInd = onSnapshot(indQuery, (snap) => {
      const indList = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setIndividuals(indList);
    }, (err) => setError(err.message));

    const unsubFcas = onSnapshot(fcasQuery, (snap) => {
      const fcaList = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setFcas(fcaList);
    }, (err) => setError(err.message));

    setLoading(false);

    return () => {
      unsubInd();
      unsubFcas();
    };
  }, [province]);

  return { individuals, fcas, loading, error, refresh: () => {} };
}

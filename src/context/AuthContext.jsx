import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { PROVINCES } from '../constants';
import { logAction } from '../services/systemLogs';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberMe_email');
    const savedRole = localStorage.getItem('rememberMe_role');
    const savedProvince = localStorage.getItem('rememberMe_province');

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);
        const profile = profileSnap.exists() ? profileSnap.data() : null;
        setUser(firebaseUser);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const signIn = async (email, password, rememberMe, role, province = null) => {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const profileRef = doc(db, 'users', userCred.user.uid);
    const profileSnap = await getDoc(profileRef);
    const profile = profileSnap.exists() ? profileSnap.data() : null;

    // Admin login page: only allow users with role 'admin'. Encoders must use Encoder login.
    if (role === 'admin' && profile?.role !== 'admin') {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      throw new Error('Access denied. This page is for administrators only. Please use the Encoder login.');
    }

    // Encoder login page: only allow users with role 'encoder'. Admins must use Admin login.
    if (role === 'encoder' && profile?.role === 'admin') {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      throw new Error('Access denied. This page is for encoders only. Please use the Admin login.');
    }

    setUser(userCred.user);
    setUserProfile(profile);
    setLoading(false);
    logAction({
      action: 'login',
      userId: userCred.user.uid,
      userEmail: userCred.user.email || profile?.email,
      role: profile?.role ?? null,
      province: profile?.province ?? province ?? null,
    }).catch(() => {});
    if (rememberMe) {
      localStorage.setItem('rememberMe_email', email);
      localStorage.setItem('rememberMe_role', role);
      if (province) localStorage.setItem('rememberMe_province', province);
    } else {
      localStorage.removeItem('rememberMe_email');
      localStorage.removeItem('rememberMe_role');
      localStorage.removeItem('rememberMe_province');
    }
    return userCred;
  };

  const register = async (email, password, role, province = null, extraData = {}) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const profileData = {
      email,
      role,
      province: province || null,
      ...extraData,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', userCred.user.uid), profileData);
    setUser(userCred.user);
    setUserProfile(profileData);
    setLoading(false);
    logAction({
      action: 'register',
      userId: userCred.user.uid,
      userEmail: userCred.user.email || email,
      role: role ?? null,
      province: province ?? null,
    }).catch(() => {});
    return userCred;
  };

  const signOut = () => firebaseSignOut(auth);

  const forgotPassword = (email) => sendPasswordResetEmail(auth, email);

  const isAdmin = () => userProfile?.role === 'admin';
  const getProvince = () => userProfile?.province || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        register,
        signOut,
        forgotPassword,
        isAdmin,
        getProvince,
        refreshProfile: async () => {
          if (!user) return;
          const profileRef = doc(db, 'users', user.uid);
          const profileSnap = await getDoc(profileRef);
          setUserProfile(profileSnap.exists() ? profileSnap.data() : null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

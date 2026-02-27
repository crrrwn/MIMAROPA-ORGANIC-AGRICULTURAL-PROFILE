import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDuKZTL6pt3adRx0X6gLY02Zsb_pIvd7qk",
  authDomain: "mimaropa-oa-profile.firebaseapp.com",
  projectId: "mimaropa-oa-profile",
  storageBucket: "mimaropa-oa-profile.firebasestorage.app",
  messagingSenderId: "791947135082",
  appId: "1:791947135082:web:2b4e069713f433081e2213",
  measurementId: "G-WZT8TV5D94"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

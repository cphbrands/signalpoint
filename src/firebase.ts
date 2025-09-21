// firebase.ts
import {initializeApp} from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
import {getStorage} from "firebase/storage";

const firebaseConfig = {
    // apiKey: "AIzaSyA4TAcyzLPsT7SCCv6OVjtOhjmpYY2PzjI",
    // authDomain: "bulksms-pro-7add7.firebaseapp.com",
    // projectId: "bulksms-pro-7add7",
    // storageBucket: "bulksms-pro-7add7.firebasestorage.app",
    // messagingSenderId: "872694046473",
    // appId: "1:872694046473:web:f563df3f7c0cc1dc123dd8",
    apiKey: "AIzaSyBrBIGJFfcx4_mN3YnT2xv4xrnme7saYbk",
    authDomain: "signal-points.firebaseapp.com",
    projectId: "signal-points",
    storageBucket: "signal-points.firebasestorage.app",
    messagingSenderId: "787304784093",
    appId: "1:787304784093:web:d779135f14cbf8c1977b34",
    measurementId: "G-T1791QC8ZS",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBedSDe2cTZ07RNpG82t2IWKs8fIXFAJeg",
  authDomain: "react-practice-44527.firebaseapp.com",
  projectId: "react-practice-44527",
  storageBucket: "react-practice-44527.firebasestorage.app",  
  messagingSenderId: "804314782595",
  appId: "1:804314782595:web:3aecff02a8b3cae4e134b6",
  measurementId: "G-W4YX61WDGG",
};

const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export { app };          





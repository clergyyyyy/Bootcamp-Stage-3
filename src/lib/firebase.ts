import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBedSDe2cTZ07RNpG82t2IWKs8fIXFAJeg",
  authDomain: "react-practice-44527.firebaseapp.com",
  projectId: "react-practice-44527",
  storageBucket: "react-practice-44527.firebasestorage.app",  
  messagingSenderId: "804314782595",
  appId: "1:804314782595:web:3aecff02a8b3cae4e134b6",
  measurementId: "G-W4YX61WDGG",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { app, db };

export { auth, provider, signInWithPopup };     





import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDszZT669EKAzXatWiNE4GsL9zJdQoZRII",
  authDomain: "fint26.firebaseapp.com",
  projectId: "fint26",
  storageBucket: "fint26.firebasestorage.app",
  messagingSenderId: "207728826410",
  appId: "1:207728826410:web:bea404d6b5aceefb060b53"
};

console.log('Initializing Firebase with config:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log('Firebase initialized successfully');

export default app;
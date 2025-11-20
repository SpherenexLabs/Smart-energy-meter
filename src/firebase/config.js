// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Firebase configuration for BESCOM project
// const firebaseConfig = {
//   apiKey: "AIzaSyBi4imuMT5imCT-8IBULdyFqj-ZZtl68Do",
//   authDomain: "regal-welder-453313-d6.firebaseapp.com",
//   databaseURL: "https://regal-welder-453313-d6-default-rtdb.firebaseio.com",
//   projectId: "regal-welder-453313-d6",
//   storageBucket: "regal-welder-453313-d6.firebasestorage.app",
//   messagingSenderId: "981360128010",
//   appId: "1:981360128010:web:5176a72c013f26b8dbeff3",
//   measurementId: "G-T67CCEJ8LW"
// };


const firebaseConfig = {
  apiKey: "AIzaSyAXHnvNZkb00PXbG5JidbD4PbRgf7l6Lgg",
  authDomain: "v2v-communication-d46c6.firebaseapp.com",
  databaseURL: "https://v2v-communication-d46c6-default-rtdb.firebaseio.com",
  projectId: "v2v-communication-d46c6",
  storageBucket: "v2v-communication-d46c6.firebasestorage.app",
  messagingSenderId: "536888356116",
  appId: "1:536888356116:web:983424cdcaf8efdd4e2601",
  measurementId: "G-H0YN6PE3S1"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;

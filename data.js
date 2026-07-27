// ---------- FIREBASE CONNECTION ----------
// Moved out of index.html so the app's data/config lives in one place.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getFirestore, collection, getDocs,
  addDoc, updateDoc, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD2P_MtTYREPQ3uqPRCqTexk0GlGxY6yfQ",
  authDomain: "trip-b2ae6.firebaseapp.com",
  projectId: "trip-b2ae6",
  storageBucket: "trip-b2ae6.firebasestorage.app",
  messagingSenderId: "799328084141",
  appId: "1:799328084141:web:9baf3e0c5ca04c501f2624",
  measurementId: "G-BF5RCRWN2N"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Expose to script.js / admin.js the same way it was exposed before
// (window globals + a "firebase-ready" event), so those files don't need
// to become modules or change how they listen for Firebase being ready.
window.db = db;
window.firestoreCollection = collection;
window.firestoreGetDocs = getDocs;
window.firestoreAddDoc = addDoc;
window.firestoreUpdateDoc = updateDoc;
window.firestoreDeleteDoc = deleteDoc;
window.firestoreDoc = doc;

// ---------- RECORDS / STATS ----------
// Reads every document in the "records" collection (as seen in the Firebase
// console: records/r001 with fields cities_discovered, countries_explored,
// upcoming_trips, visited_places, wishlist_places) and sums the fields
// together. This lets you add more record documents later (r002, r003...)
// without changing any code — they'll just be added into the totals.
async function loadRecordsStats() {
  const totals = {
    countries_explored: 0,
    cities_discovered: 0,
    wishlist_places: 0,
    visited_places: 0,
    upcoming_trips: 0
  };

  try {
    const snapshot = await getDocs(collection(db, "records"));
    if (snapshot.empty) return null;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      Object.keys(totals).forEach(key => {
        totals[key] += Number(data[key]) || 0;
      });
    });

    return totals;
  } catch (err) {
    console.error("Could not load records/stats from Firestore:", err);
    return null;
  }
}

window.loadRecordsStats = loadRecordsStats;

// ---------- CLOUDINARY (free image/PDF hosting) ----------
// Used by admin.js when adding/editing a destination's image or PDF.
const CLOUDINARY_CLOUD_NAME = "dzrko8qrn";             // <-- your cloud name
const CLOUDINARY_UPLOAD_PRESET = "tripweb";            // <-- your unsigned preset

// Uploads a File (image or PDF) to Cloudinary and returns its public URL.
async function uploadToCloudinary(file) {
  if (!file) return "";

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cloudinary upload failed: ${errText}`);
  }
  const data = await res.json();
  return data.secure_url;
}

window.uploadToCloudinary = uploadToCloudinary;

window.dispatchEvent(new Event("firebase-ready"));
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, config.firestoreDatabaseId || "(default)");

async function run() {
  try {
    const cid = "lazizadenta";
    console.log("Fetching clinic:", cid);
    const docRef = doc(db, "clinics", cid);
    const snap = await getDoc(docRef);
    let data: any = {};
    if (snap.exists()) {
      data = snap.data();
      console.log("Clinic found:", data.name);
    } else {
      console.log("Clinic not found! Creating new one...");
      data = {
        id: "lazizadenta",
        name: "Laziza Denta Samarqand",
        subdomain: "lazizadenta",
        address: "Samarqand",
        phone: "+998915213200",
        logo: "🦷",
        rating: 5,
        activePatients: 0,
        rentalPrice: 5000000,
        subscriptionStatus: "active",
        ownerName: "Aziz Kbayev",
        login: "Laziza2026",
        password: "password",
      };
    }
    
    data.lat = 39.64783;
    data.lng = 66.99073;
    data.mapLink = "https://maps.app.goo.gl/dXSfrg19PguvX7LM9"; 
    
    await setDoc(docRef, data);
    console.log("Updated clinic successfully!");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();

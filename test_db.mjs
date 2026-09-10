import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const configPath = './firebase-applet-config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  const docRef = doc(db, 'shared_roster', 'state');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    fs.writeFileSync('db_state.json', JSON.stringify(data, null, 2));
    console.log("Saved to db_state.json");
  } else {
    console.log("No doc");
  }
  process.exit(0);
}
check();

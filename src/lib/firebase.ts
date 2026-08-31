import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

const app = initializeApp(config);

// Pass databaseId as the second argument to getFirestore if needed, or simply getFirestore(app)
export const db = config.firestoreDatabaseId 
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);


import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({ credential: cert(serviceAccount) });
const firestore = getFirestore();

async function checkData() {
  const users = await firestore.collection('users').get();
  console.log(`Total users in DB: ${users.size}`);
  users.forEach(u => console.log(u.data().email, u.data().orgId));

  const employees = await firestore.collection('employees').get();
  console.log(`\nTotal employees in DB: ${employees.size}`);
  
  process.exit(0);
}

checkData().catch(console.error);

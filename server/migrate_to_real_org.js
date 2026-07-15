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

async function convertDefaultToRealOrg() {
  console.log('Starting migration to convert "default" tenant into a real SaaS Organization...');

  // 1. Create a real organization
  const orgRef = firestore.collection('organizations').doc();
  const newOrgId = orgRef.id;
  
  await orgRef.set({
    id: newOrgId,
    name: 'Acme Corporation',
    createdAt: new Date().toISOString(),
    isActive: true,
    isLegacyConverted: true
  });

  console.log(`Created new Organization: Acme Corporation (ID: ${newOrgId})`);

  // 2. Collections to migrate
  const collections = ['users', 'employees', 'visitors', 'visits', 'audit_logs', 'meeting_rooms', 'settings', 'notifications'];
  let totalMoved = 0;

  for (const collectionName of collections) {
    const snapshot = await firestore.collection(collectionName).where('orgId', '==', 'default').get();
    
    if (snapshot.empty) {
      console.log(`[${collectionName}] has no 'default' records.`);
      continue;
    }

    const batch = firestore.batch();
    let batchCount = 0;

    snapshot.docs.forEach(docSnap => {
      batch.update(docSnap.ref, { orgId: newOrgId });
      batchCount++;
      totalMoved++;
    });

    await batch.commit();
    console.log(`Moved ${batchCount} records from [${collectionName}] to the new Organization.`);
  }

  console.log(`\nSuccess! ${totalMoved} total records were successfully moved to the new Organization (${newOrgId}).`);
  process.exit(0);
}

convertDefaultToRealOrg().catch(console.error);

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

async function migrateData() {
  console.log('Starting migration to attach orgId to legacy data...');
  const collectionsToMigrate = ['users', 'employees', 'visitors', 'notifications', 'rooms'];
  let totalUpdated = 0;

  for (const collectionName of collectionsToMigrate) {
    const snapshot = await firestore.collection(collectionName).get();
    
    if (snapshot.empty) {
      continue;
    }

    const batch = firestore.batch();
    let batchCount = 0;

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.orgId) {
        batch.update(docSnap.ref, { orgId: 'default' });
        batchCount++;
        totalUpdated++;
      }
    });

    if (batchCount > 0) {
      await batch.commit();
      console.log(`Migrated ${batchCount} records in [${collectionName}] collection.`);
    } else {
      console.log(`[${collectionName}] is already up to date.`);
    }
  }

  console.log(`Migration complete! Successfully recovered and attached orgId to ${totalUpdated} legacy records.`);
  process.exit(0);
}

migrateData().catch(console.error);

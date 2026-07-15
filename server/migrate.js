import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const firestore = getFirestore();
const dataDir = path.join(__dirname, 'data');

async function migrateData() {
  console.log('🚀 Starting migration to Firebase...');
  
  if (!fs.existsSync(dataDir)) {
    console.log('❌ No data directory found. Nothing to migrate.');
    return;
  }

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const collectionName = file.replace('.json', '');
    console.log(`\n📦 Migrating collection: ${collectionName}...`);
    
    const filePath = path.join(dataDir, file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.log(`⚠️ Skipping ${file}, invalid JSON.`);
      continue;
    }
    
    if (!Array.isArray(data)) {
      console.log(`⚠️ Skipping ${file}, data is not an array.`);
      continue;
    }
    
    if (data.length === 0) {
      console.log(`ℹ️ Collection ${collectionName} is empty.`);
      continue;
    }
    
    // Process in batches (Firestore allows max 500 ops per batch)
    let batch = firestore.batch();
    let batchCount = 0;
    let totalMigrated = 0;
    
    for (const item of data) {
      // Ensure the item has an ID (fallback to a generated one if missing)
      const docId = item.id || firestore.collection(collectionName).doc().id;
      
      const docRef = firestore.collection(collectionName).doc(docId);
      batch.set(docRef, item);
      batchCount++;
      totalMigrated++;
      
      if (batchCount === 450) { // Keep under 500 limit just to be safe
        await batch.commit();
        batch = firestore.batch(); // Create new batch
        batchCount = 0;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    console.log(`✅ Successfully uploaded ${totalMigrated} documents to ${collectionName}`);
  }
  
  console.log('\n🎉 All local data successfully migrated to Firebase!');
  process.exit(0);
}

migrateData().catch(console.error);

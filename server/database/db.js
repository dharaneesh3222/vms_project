import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { tenantContext } from '../utils/context.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Initialize Firebase Admin
// Resolving path to the firebase-service-account.json
// 1. Try Render's secure secrets folder first
let serviceAccountPath = '/etc/secrets/firebase-service-account.json';

if (!fs.existsSync(serviceAccountPath)) {
  // 2. Fallback to local project root
  serviceAccountPath = path.join(__dirname, '..', '..', 'firebase-service-account.json');
}

if (!fs.existsSync(serviceAccountPath)) {
  console.error("FIREBASE ERROR: Missing firebase-service-account.json in the root folder or /etc/secrets!");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const firestore = getFirestore();

// 2. Helper to convert JS queries to Firestore queries
function applyQuery(collectionName, collectionRef, queryObj) {
  const store = tenantContext.getStore();
  if (store && store.orgId && collectionName !== 'organizations' && !queryObj.orgId) {
    queryObj.orgId = store.orgId;
  }

  let ref = collectionRef;
  for (const key in queryObj) {
    const val = queryObj[key];
    if (typeof val === 'object' && val !== null) {
      if ('$in' in val && Array.isArray(val['$in'])) {
        ref = ref.where(key, 'in', val['$in']);
      }
    } else {
      ref = ref.where(key, '==', val);
    }
  }
  return ref;
}

// 3. The new Firebase db object
export const db = {
  async find(collectionName, query = {}) {
    const ref = applyQuery(collectionName, firestore.collection(collectionName), query);
    const snapshot = await ref.get();
    return snapshot.docs.map(doc => doc.data());
  },

  async findOne(collectionName, query = {}) {
    const ref = applyQuery(collectionName, firestore.collection(collectionName), query).limit(1);
    const snapshot = await ref.get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].data();
  },

  async insert(collectionName, doc) {
    const store = tenantContext.getStore();
    if (store && store.orgId && collectionName !== 'organizations' && !doc.orgId) {
      doc.orgId = store.orgId;
    }
    const id = doc.id || firestore.collection(collectionName).doc().id;
    
    const newDoc = {
      ...doc,
      id: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await firestore.collection(collectionName).doc(id).set(newDoc);
    return newDoc;
  },

  async update(collectionName, query = {}, updateData = {}, options = { multi: false }) {
    const ref = applyQuery(collectionName, firestore.collection(collectionName), query);
    if (!options.multi) {
      ref.limit(1);
    }
    
    const snapshot = await ref.get();
    if (snapshot.empty) return null;

    const batch = firestore.batch();
    const updatedDocs = [];

    snapshot.docs.forEach(docSnap => {
      const docRef = firestore.collection(collectionName).doc(docSnap.id);
      const newDocData = {
        ...docSnap.data(),
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      batch.set(docRef, newDocData, { merge: true });
      updatedDocs.push(newDocData);
    });

    await batch.commit();
    return options.multi ? updatedDocs : updatedDocs[0];
  },

  async delete(collectionName, query = {}) {
    const ref = applyQuery(collectionName, firestore.collection(collectionName), query);
    const snapshot = await ref.get();
    
    if (snapshot.empty) return false;

    const batch = firestore.batch();
    snapshot.docs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
    return true;
  },

  async count(collectionName, query = {}) {
    const ref = applyQuery(collectionName, firestore.collection(collectionName), query);
    const snapshot = await ref.getCountFromServer();
    return snapshot.data().count;
  }
};

// 4. Seeding Logic (Pushes your local initial data to Firebase on first run)
export async function seedDatabase() {
  const users = await db.find('users');
  if (users.length > 0) {
    console.log('Firebase Database already seeded. Connecting normally.');
    return;
  }
  
  console.log('First time Firebase connection! Seeding database...');
  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('password123', salt);
  
  // Seed Admin
  await db.insert('users', {
    email: 'admin@vms.com',
    displayName: 'System Admin',
    passwordHash: await bcrypt.hash('admin123', salt),
    role: 'admin',
    department: 'IT',
    phoneNumber: '+1234567890',
    isActive: true
  });

  // Seed Receptionist
  await db.insert('users', {
    email: 'receptionist@vms.com',
    displayName: 'Alice Frontdesk',
    passwordHash: await bcrypt.hash('receptionist123', salt),
    role: 'receptionist',
    department: 'Operations',
    phoneNumber: '+1234567891',
    isActive: true
  });

  // Seed Security Guard
  await db.insert('users', {
    email: 'security@vms.com',
    displayName: 'Guard Bob',
    passwordHash: await bcrypt.hash('security123', salt),
    role: 'security',
    department: 'Security',
    phoneNumber: '+1234567892',
    isActive: true
  });

  // Seed Settings
  const settingsData = [
    { key: 'companyName', value: 'Acme Corporation' },
    { key: 'allowSelfRegistration', value: 'true' },
    { key: 'requireIdProof', value: 'true' },
    { key: 'emergencyContact', value: '+1800-555-0199' }
  ];
  for (const s of settingsData) {
    await db.insert('settings', s);
  }
  
  // Seed Rooms
  const roomsData = [
    { name: 'Room 101', floor: '1st Floor', capacity: 8, isAvailable: true },
    { name: 'Boardroom', floor: '2nd Floor', capacity: 20, isAvailable: true }
  ];
  for (const r of roomsData) {
    await db.insert('meeting_rooms', r);
  }

  console.log('Firebase Database seeded successfully!');
}

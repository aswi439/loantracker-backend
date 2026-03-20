// src/services/firebaseAdmin.ts
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

if (!admin.apps.length) {
  const keyPath = path.resolve(process.env.FIREBASE_ADMIN_KEY_PATH || './firebase-admin-key.json');
  
  if (!fs.existsSync(keyPath)) {
    console.error('❌ Firebase Admin key not found at:', keyPath);
    console.error('   Download from: Firebase Console → Project Settings → Service Accounts → Generate new private key');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase Admin initialized');
}

export default admin;

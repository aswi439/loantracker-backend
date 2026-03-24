// src/services/firebaseAdmin.ts
import admin from 'firebase-admin';

if (!admin.apps.length) {
  // On Railway (and other cloud hosts), we load the Firebase key from an
  // environment variable called FIREBASE_ADMIN_KEY_JSON.
  // On your local machine, we fall back to reading the JSON file.
  let serviceAccount: admin.ServiceAccount;

  if (process.env.FIREBASE_ADMIN_KEY_JSON) {
    // Cloud / production path — key is a JSON string in env var
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY_JSON);
    } catch (e) {
      console.error('❌ Failed to parse FIREBASE_ADMIN_KEY_JSON env var. Make sure it is valid JSON.');
      process.exit(1);
    }
  } else {
    // Local development path — fall back to reading the key file
    const path = require('path');
    const fs = require('fs');
    const keyPath = path.resolve(process.env.FIREBASE_ADMIN_KEY_PATH || './firebase-admin-key.json');

    if (!fs.existsSync(keyPath)) {
      console.error('❌ Firebase Admin key not found at:', keyPath);
      console.error('   Set FIREBASE_ADMIN_KEY_JSON env var, or download the key from:');
      console.error('   Firebase Console → Project Settings → Service Accounts → Generate new private key');
      process.exit(1);
    }

    serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase Admin initialized');
}

export default admin;

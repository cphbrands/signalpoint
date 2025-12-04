import admin from "firebase-admin";

function getServiceAccountFromBase64() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) return null;
  const json = Buffer.from(b64.trim(), "base64").toString("utf8");
  return JSON.parse(json);
}

function getAdmin() {
  if (admin.apps.length) return admin;

  const serviceAccount = getServiceAccountFromBase64();
  if (!serviceAccount) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_BASE64");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return admin;
}

export const adminDb = getAdmin().firestore();
export const adminAuth = getAdmin().auth();

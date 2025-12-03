import admin from "firebase-admin";

function getServiceAccountFromBase64() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) return null;

  // Vercel kan nogle gange få whitespace med – fjern det sikkert
  const cleaned = b64.trim();

  const json = Buffer.from(cleaned, "base64").toString("utf8");
  return JSON.parse(json);
}

export const adminDb = (() => {
  if (admin.apps.length) return admin.firestore();

  const serviceAccount = getServiceAccountFromBase64();
  if (!serviceAccount) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_BASE64");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return admin.firestore();
})();

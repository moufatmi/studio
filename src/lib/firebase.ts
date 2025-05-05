// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Check if all required environment variables are set
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(
    `Firebase configuration is incomplete. Missing environment variables: ${missingEnvVars.join(', ')}. ` +
    `Please create a .env.local file in the root of your project and add these values. ` +
    `You can find these values in your Firebase project settings.`
  );
  // You might want to throw an error or handle this case differently depending on your app's needs.
  // For now, we'll proceed but Firestore operations will likely fail.
}

// Your web app's Firebase configuration using environment variables
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
};

let app;
let db: ReturnType<typeof getFirestore>;

// Initialize Firebase only if environment variables are present
// and conditional initialization to prevent reinitialization in Next.js hot-reloading environments
if (missingEnvVars.length === 0) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
} else {
  // Provide a dummy db object or handle the error appropriately
  // This prevents errors during build or initial load if config is missing
  console.error("Firebase not initialized due to missing configuration.");
  // Assigning a placeholder or null might be necessary depending on how db is used elsewhere
  // For simplicity, we'll leave db potentially undefined, but guard usage elsewhere.
  // db = {} as ReturnType<typeof getFirestore>; // Example placeholder
}


// Export the Firestore database instance (potentially undefined if config is missing)
export { db };

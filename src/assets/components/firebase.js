// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAKihzlyuY_mCqR3E83By6xSVklhlFKV90",
  authDomain: "vyaparsetu-88045.firebaseapp.com",
  projectId: "vyaparsetu-88045",
  storageBucket: "vyaparsetu-88045.firebasestorage.app",
  messagingSenderId: "408581406293",
  appId: "1:408581406293:web:176eb9ab653e88af091edc",
  measurementId: "G-M42FFCRCB2",
  databaseURL: "https://vyaparsetu-88045-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
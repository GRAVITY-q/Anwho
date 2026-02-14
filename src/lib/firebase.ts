// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDNWJ1som58Uz34ka5gAQeb6I78s6dj7l4",
    authDomain: "anywho-60e99.firebaseapp.com",
    projectId: "anywho-60e99",
    storageBucket: "anywho-60e99.firebasestorage.app",
    messagingSenderId: "400044777117",
    appId: "1:400044777117:web:3b32eb725e454eb6013e74"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
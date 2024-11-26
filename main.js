// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {})
      .catch((error) => {
        console.error("ServiceWorker registration failed: ", error);
      });
  });
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAT-uIrw4hfTEO4ANsVipr-txgT5p1henE",
  authDomain: "rr-421.firebaseapp.com",
  projectId: "rr-421",
  storageBucket: "rr-421.appspot.com",
  messagingSenderId: "615275811990",
  appId: "1:615275811990:web:917556f2b6a985df389eb7",
  measurementId: "G-WRD9KWHSZR",
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app); // Export db for use in other modules

// Now `db` can be used to interact with Firestore
const board = document.getElementById("board");

for (let row = 0; row < 33; row++) {
  for (let col = 0; col < 33; col++) {
    const element = document.createElement("div");

    if ((row === 15 || row === 17) && (col === 15 || col === 17)) {
      element.classList.add("element", "square");
    } else if (row % 2 !== 0 && col % 2 !== 0) {
      element.classList.add("element", "square");
    } else if (row % 2 === 0 && col % 2 === 0) {
      element.classList.add("element", "point");
    } else if (row % 2 !== 0 && col % 2 === 0) {
      element.classList.add("element", "thin-vertical");
    } else if (row % 2 === 0 && col % 2 !== 0) {
      element.classList.add("element", "thin-horizontal");
    }

    if (row === 0 || row === 32 || col === 0 || col === 32) {
      element.classList.add("thick", "obstacle", "static-element");
    }

    if (row >= 14 && row <= 18 && col >= 14 && col <= 18) {
      element.classList.add("thick", "obstacle", "static-element");
    }

    board.appendChild(element);
  }
}

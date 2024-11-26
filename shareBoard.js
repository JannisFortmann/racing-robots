import { db } from "./main.js";
import { saveBoardState } from "./robots.js";
import {
  addSquareListeners,
  shareButton,
  replayButton,
} from "./eventListeners.js";
import {
  doc,
  setDoc,
  getDoc,
  collection,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { convertBoardState } from "./solver/formatBoard.js";
import { getSolution } from "./solver/getSolution.js";

// Function to generate a unique identifier using Firestore
async function generateId() {
  const tempDoc = doc(collection(db, "boardStates")); // Create a reference without specifying an ID
  await setDoc(tempDoc, {}); // Creates an empty document to generate a unique ID
  return tempDoc.id;
}

// Function to gather board state
function gatherBoardState() {
  const elements = document.querySelectorAll("#board .element");
  const boardState = [];

  elements.forEach((element, index) => {
    const classes = Array.from(element.classList).filter((c) =>
      ["thick", "obstacle", "colored", "corner", "target"].includes(c)
    );
    if (classes.length > 0) {
      const stateItem = { index, classes };

      // If element has the 'colored' class, save its color style
      if (classes.includes("colored")) {
        const color = window.getComputedStyle(element).backgroundColor;
        stateItem.color = color; // Add color property to the state
      }

      boardState.push(stateItem);
    }
  });

  return boardState;
}

export function showAlert(message) {
  const alertElement = document.createElement("div");
  alertElement.textContent = message;
  alertElement.className = "custom-alert";
  document.body.appendChild(alertElement);

  // Remove the alert after it fades out
  setTimeout(() => alertElement.remove(), 2000);
}

// Function to copy to clipboard with fallback
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    // Modern approach: Clipboard API
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older iOS/Safari versions
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy"); // Fallback method
      return Promise.resolve(); // Simulate async behavior
    } catch (err) {
      console.error("Fallback copy failed:", err);
      return Promise.reject(err);
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

// Function to share the board state using Firestore
export async function shareBoard() {
  const boardState = gatherBoardState();
  saveBoardState();

  const dataToStore = {
    boardState,
    savedBoardState: window.savedBoardState,
  };

  const elements = document.querySelectorAll("#board .element");
  const circle = document.querySelector(".circle");
  if (circle) {
    const circlePosition = Array.from(elements).indexOf(circle.parentElement);
    const circleColor = window.getComputedStyle(circle).backgroundColor;
    dataToStore.circle = { position: circlePosition, color: circleColor };
  }

  const id = await generateId();
  await setDoc(doc(db, "boardStates", id), dataToStore);

  const shareableUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;

  copyToClipboard(shareableUrl)
    .then(() => showAlert("Board state copied to clipboard"))
    .catch((err) => console.error("Could not copy text: ", err));
}

// Function to share the board state and recorded solution using Firestore
export async function shareSolution() {
  const boardState = gatherBoardState();
  saveBoardState();

  const dataToStore = {
    boardState,
    savedBoardState: window.savedBoardState,
  };

  if (window.recordedClicks.length > 0) {
    dataToStore.recordedClicks = window.recordedClicks;
  }

  const elements = document.querySelectorAll("#board .element");
  const circle = document.querySelector(".circle");
  if (circle) {
    const circlePosition = Array.from(elements).indexOf(circle.parentElement);
    const circleColor = window.getComputedStyle(circle).backgroundColor;
    dataToStore.circle = { position: circlePosition, color: circleColor };
  }

  const id = await generateId();
  await setDoc(doc(db, "boardStates", id), dataToStore);

  const shareableUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;

  copyToClipboard(shareableUrl)
    .then(() => showAlert("Solution copied to clipboard"))
    .catch((err) => console.error("Could not copy text: ", err));
}

// Function to restore the board state and refill savedBoardState
async function restoreBoardState(boardData) {
  const {
    boardState,
    savedBoardState: restoredSavedState,
    circle,
    recordedClicks,
  } = boardData;

  const elements = document.querySelectorAll("#board .element");
  boardState.forEach((item) => {
    const { index, classes, color } = item;

    if (elements[index]) {
      classes.forEach((className) => {
        elements[index].classList.add(className);
      });

      if (classes.includes("colored") && color) {
        elements[index].style.backgroundColor = color;
      }
    }
  });

  if (circle) {
    const circleElement = document.createElement("div");
    circleElement.classList.add("circle");
    circleElement.style.backgroundColor = circle.color;

    if (elements[circle.position]) {
      elements[circle.position].appendChild(circleElement);
    }
  }

  if (restoredSavedState) {
    window.savedBoardState.length = 0;
    restoredSavedState.forEach((state) => window.savedBoardState.push(state));
  }

  if (recordedClicks) {
    window.recordedClicks = recordedClicks;
  }

  addSquareListeners();

  const baseUrl = window.location.origin + window.location.pathname;
  history.replaceState(null, "", baseUrl);
}

// Function to check for board state ID in URL and restore it
export async function checkForBoardState() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");

  if (id) {
    const docRef = doc(db, "boardStates", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const boardData = docSnap.data();
      await restoreBoardState(boardData);

      if (boardData.recordedClicks && boardData.recordedClicks.length > 0) {
        enableAllButtons();
        window.hasRecordedSolution = true;
        shareButton.textContent = "Share Solution";
        replayButton.textContent = `Play Solution (${
          boardData.recordedClicks.length / 2
        })`;
      } else {
        enableSomeButtons();
      }

      convertBoardState();
      getSolution();
    } else {
      console.error("No board state found for this ID.");
    }
  }
}

function enableAllButtons() {
  document.getElementById("recording-button").disabled = false;
  document.getElementById("share-button").disabled = false;
  document.getElementById("find-solution").disabled = false;
  document.getElementById("new-target").disabled = false;
  document.getElementById("play-saved-solution").disabled = false;
}

function enableSomeButtons() {
  document.getElementById("recording-button").disabled = false;
  document.getElementById("share-button").disabled = false;
  document.getElementById("find-solution").disabled = false;
  document.getElementById("new-target").disabled = false;
}

window.onload = () => {
  checkForBoardState();
};

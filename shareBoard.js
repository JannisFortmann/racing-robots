import { db } from './main.js';
import { saveBoardState } from './robots.js';
import { recordedClicks } from './recording.js';
import { addSquareListeners } from './eventListeners.js';
import { doc, setDoc, getDoc, collection } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Function to generate a unique identifier using Firestore
async function generateId() {
    const tempDoc = doc(collection(db, "boardStates")); // Create a reference without specifying an ID
    await setDoc(tempDoc, {}); // Creates an empty document to generate a unique ID
    return tempDoc.id;
}

// Function to gather board state
function gatherBoardState() {
    const elements = document.querySelectorAll('#board .element');
    const boardState = [];

    elements.forEach((element, index) => {
        const classes = Array.from(element.classList).filter(c => ['thick', 'obstacle', 'colored', 'corner', 'target'].includes(c));
        if (classes.length > 0) {
            const stateItem = { index, classes };
            
            // If element has the 'colored' class, save its color style
            if (classes.includes('colored')) {
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


// Function to share the board state using Firestore
export async function shareBoard() {
    // Gather board elements and save current board state
    const boardState = gatherBoardState();
    saveBoardState();

    // Combine boardState and savedBoardState
    const dataToStore = { 
        boardState, 
        savedBoardState: window.savedBoardState 
    };

    // Check if there's a circle in the corner and add it to the data to store
    const elements = document.querySelectorAll('#board .element');
    const circle = document.querySelector('.circle');
    if (circle) {
        const circlePosition = Array.from(elements).indexOf(circle.parentElement);
        const circleColor = window.getComputedStyle(circle).backgroundColor;
        dataToStore.circle = { position: circlePosition, color: circleColor };
    }

    // Generate a unique ID and store the data in Firestore
    const id = await generateId();
    await setDoc(doc(db, "boardStates", id), dataToStore);

    // Create a shorter shareable URL with the ID
    const shareableUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;

    // Copy the URL to the clipboard
    navigator.clipboard.writeText(shareableUrl)
        .then(() => showAlert('Board state copied to clipboard'))
        .catch(err => console.error('Could not copy text: ', err));
}

// Function to share the board state and recorded solution using Firestore
export async function shareSolution() {
    // Gather board elements and save current board state
    const boardState = gatherBoardState();
    saveBoardState();

    // Combine boardState and savedBoardState
    const dataToStore = { 
        boardState, 
        savedBoardState: window.savedBoardState 
    };

    // Add recorded solution if it exists
    if (recordedClicks.length > 0) {
        dataToStore.recordedClicks = recordedClicks;
    }

    // Check if there's a circle in the corner and add it to the data to store
    const elements = document.querySelectorAll('#board .element');
    const circle = document.querySelector('.circle');
    if (circle) {
        const circlePosition = Array.from(elements).indexOf(circle.parentElement);
        const circleColor = window.getComputedStyle(circle).backgroundColor;
        dataToStore.circle = { position: circlePosition, color: circleColor };
    }

    // Generate a unique ID and store the data in Firestore
    const id = await generateId();
    await setDoc(doc(db, "boardStates", id), dataToStore);

    // Create a shorter shareable URL with the ID
    const shareableUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;

    // Copy the URL to the clipboard
    navigator.clipboard.writeText(shareableUrl)
        .then(() => showAlert('Solution copied to clipboard'))
        .catch(err => console.error('Could not copy text: ', err));
}


// Function to restore the board state and refill savedBoardState
async function restoreBoardState(boardData) {
    const { boardState, savedBoardState: restoredSavedState, circle, recordedClicks } = boardData;

    // Restore boardState
    const elements = document.querySelectorAll('#board .element');
    boardState.forEach(item => {
        const { index, classes, color } = item;

        if (elements[index]) {
            classes.forEach(className => {
                elements[index].classList.add(className);
            });

            // If the 'colored' class is present, set the background color
            if (classes.includes('colored') && color) {
                elements[index].style.backgroundColor = color;
            }
        }
    });

    // Restore the circle if it exists in the saved data
    if (circle) {
        const circleElement = document.createElement('div');
        circleElement.classList.add('circle');
        circleElement.style.backgroundColor = circle.color;

        if (elements[circle.position]) {
            elements[circle.position].appendChild(circleElement); // Append the circle to the saved position
        }
    }

    // Refill savedBoardState in robots.js
    if (restoredSavedState) {
        window.savedBoardState.length = 0; // Clear the current savedBoardState
        restoredSavedState.forEach(state => window.savedBoardState.push(state)); // Refill it with restored data
    }

    // Refill recordedClicks if they exist in the restored data
    if (recordedClicks) {
        recordedClicks = recordedClicks; // Restore the recorded clicks
    }

    // Call addSquareListeners to reattach event listeners
    addSquareListeners(); // Add event listeners after restoring the board state

    // Reset the URL to its base version without reloading the page
    const baseUrl = window.location.origin + window.location.pathname;
    history.replaceState(null, '', baseUrl); // This updates the URL in the address bar
}

// Function to check for board state ID in URL and restore it
export async function checkForBoardState() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (id) {
        const docRef = doc(db, "boardStates", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const boardData = docSnap.data();
            restoreBoardState(boardData);

            // Check if the board state includes a solution (recordedClicks)
            if (boardData.recordedClicks && boardData.recordedClicks.length > 0) {
                enableAllButtons(); // Enable all buttons if solution exists
            } else {
                enableRecordingButton(); // Enable only specific buttons
            }
        } else {
            console.error('No board state found for this ID.');
        }
    }
}

// Function to enable all buttons
function enableAllButtons() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => button.disabled = false);
}

// Function to enable only the recording and share-board buttons
function enableRecordingButton() {
    document.getElementById('recording-button').disabled = false;
}

// Call the checkForBoardState on page load
window.onload = checkForBoardState;

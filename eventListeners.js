import { thickenEdgeLines, thickenCorners } from './obstacles.js';
import { pickRandomSquareAndDisplayCircle, clearAllCircles } from './newTarget.js';
import { createRandomColoredSquares, saveBoardState, resetRobots } from './robots.js';
import { handleColoredSquareClick, handleNonColoredSquareClick, handleHighlightedSquareClick, resetMoveCounter, undoLastMove, clearMoveHistory } from './movement.js';
import { shareBoard, shareSolution, showAlert } from './shareBoard.js';
import { startRecording, saveRecording, playRecording, clearRecording, isRecording, stopPlayback } from './recording.js';
import { getSolution } from './solver/getSolution.js'

// Variable to keep track of the last colored square clicked
let originalColoredSquare = null;

// Variable to keep track of the recorded solution state
let hasRecordedSolution = false; // Initialize it properly

// Function to add event listener to the board using event delegation
export function addSquareListeners() {
    const board = document.getElementById('board');

    // Remove any existing event listener to avoid duplication
    board.removeEventListener('click', handleBoardClick);

    // Add a single event listener to the board
    board.addEventListener('click', handleBoardClick);
}

// Unified click handler for all square interactions
function handleBoardClick(event) {
    // Use closest() to ensure we get the square element, even if clicking a child inside it
    const clickedSquare = event.target.closest('.square');

    // Ensure we're working with a square and not something else
    if (!clickedSquare) return;

    if (clickedSquare.classList.contains('colored')) {
        console.log("Colored square clicked");
        originalColoredSquare = clickedSquare; // Track the original colored square
        handleColoredSquareClick(event);
    } else if (clickedSquare.classList.contains('square') && !clickedSquare.classList.contains('highlighted')) {
        console.log("Non-colored, non-highlighted square clicked");
        handleNonColoredSquareClick(event);
    } else if (clickedSquare.classList.contains('highlighted')) {
        console.log("Highlighted square clicked");
        handleHighlightedSquareClick(event, originalColoredSquare); // Pass the tracked colored square
    }
}

// Event listeners for control buttons

// Undo button
document.getElementById("undo").addEventListener("click", () => {
    stopPlayback();
    undoLastMove();
});

// Reset robots button
document.getElementById("reset-robots").addEventListener("click", () => {
    stopPlayback();
    resetRobots();
    resetMoveCounter();
    clearMoveHistory();
});

// Function to reset the recording button to its initial state
function resetRecordingButton() {
    recordingButton.textContent = "Record Solution";
    recordingButton.style.backgroundColor = "#333";
    recordingButton.style.color = "white"; 
}

// New target button
document.getElementById("new-target").addEventListener("click", () => {
    stopPlayback();
    pickRandomSquareAndDisplayCircle();
    resetRobots();
    resetMoveCounter();
    clearMoveHistory();
    clearRecording();
    getSolution();

    // Reset recording button state
    resetRecordingButton();

    // Disable replay and share buttons after creating a new target
    replayButton.disabled = true;
    shareButton.disabled = true;
});

// New board button
document.getElementById("new-board").addEventListener("click", () => {
    stopPlayback();
    thickenEdgeLines();
    thickenCorners();
    clearAllCircles();
    createRandomColoredSquares();
    addSquareListeners(); // Add listeners after the new board is created
    saveBoardState();
    resetMoveCounter();
    clearMoveHistory();
    clearRecording();

    // Reset recording button state
    resetRecordingButton();

    // Enable recording and share board buttons
    recordingButton.disabled = false;
    shareBoardButton.disabled = false;

    // Disable replay and share buttons after creating a new board
    replayButton.disabled = true;
    shareButton.disabled = true;
});

// Share Board button
document.getElementById("share-board").addEventListener("click", () => {
    stopPlayback();
    resetRobots();
    resetMoveCounter();
    clearMoveHistory();
    shareBoard();
});

// Buttons for recording, replaying, and sharing solutions
const recordingButton = document.getElementById('recording-button');
const replayButton = document.getElementById('play-saved-solution');
const shareButton = document.getElementById('share-solution');
const shareBoardButton = document.getElementById('share-board');

// Initialize disabled state for replay, recording, and share board buttons
recordingButton.disabled = true;
shareBoardButton.disabled = true;
replayButton.disabled = !hasRecordedSolution; // Disable based on recorded solution state
shareButton.disabled = !hasRecordedSolution;   // Disable based on recorded solution state

recordingButton.addEventListener('click', () => {
    if (isRecording) {
        // If currently recording, save the recording and update the button
        stopPlayback();
        saveRecording();
        resetRecordingButton();

        // Enable replay and share buttons only if recordedClicks has entries
        if (window.recordedClicks.length > 0) {
            hasRecordedSolution = true; // Update the state
            replayButton.disabled = false;
            shareButton.disabled = false;
        }
    } else {
        // If not recording, start a new recording and update the button
        stopPlayback();
        startRecording();
        recordingButton.textContent = "Save Recording";
        recordingButton.style.backgroundColor = "#FF8080"; // Red for "Save Recording"
        recordingButton.style.color = "#333"; 

        // Disable replay and share buttons during recording
        replayButton.disabled = true;
        shareButton.disabled = true;
    }
});

// Play saved recording button
document.getElementById("play-saved-solution").addEventListener("click", () => {
    stopPlayback();
    clearMoveHistory();
    playRecording();
});

// Share Solution button
document.getElementById("share-solution").addEventListener("click", () => {
    if (hasRecordedSolution) {
        stopPlayback();
        resetRobots();
        resetMoveCounter();
        clearMoveHistory();
        shareSolution(); 
    } else {
        alert('No recorded solution available to share.');
    }
});

document.getElementById('check-clipboard').addEventListener('click', async () => {
    try {
        // Read the clipboard text
        const clipboardText = await navigator.clipboard.readText();

        // Check if the clipboard text starts with the specified base URL
        const baseUrl = 'https://rr-421.web.app/';
        if (clipboardText.startsWith(baseUrl)) {
            // If valid, navigate to the URL
            window.location.href = clipboardText;
        } else {
            showAlert('No valid URL found in clipboard.');
        }
    } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
        showAlert('Failed to read clipboard contents.');
    }
});

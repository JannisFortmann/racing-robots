import { thickenEdgeLines, thickenCorners } from './obstacles.js';
import { pickRandomSquareAndDisplayCircle, clearAllCircles } from './newTarget.js';
import { createRandomColoredSquares, saveBoardState, resetRobots } from './robots.js';
import { handleColoredSquareClick, handleNonColoredSquareClick, handleHighlightedSquareClick, resetMoveCounter, undoLastMove, clearMoveHistory, moveCount } from './movement.js';
import { shareBoard, shareSolution } from './shareBoard.js';
import { startRecording, saveRecording, playRecording, clearRecording, isRecording, stopPlayback } from './recording.js';
import { getSolution } from './solver/getSolution.js'
import { playSolvedSolution, solutionStepsCount } from './solver/getSolution.js';

const undoButton = document.getElementById("undo");
const resetButton = document.getElementById("reset-robots");
const newTargetButton = document.getElementById("new-target");
const newBoardButton = document.getElementById("new-board");

const recordingButton = document.getElementById('recording-button');
export const replayButton = document.getElementById('play-saved-solution');
export const shareButton = document.getElementById('share-button');
const solveButton = document.getElementById('find-solution');


// Variable to keep track of the last colored square clicked
let originalColoredSquare = null;

// Variable to keep track of the recorded solution state
window.hasRecordedSolution = false; // Initialize it properly

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
        originalColoredSquare = clickedSquare; // Track the original colored square
        handleColoredSquareClick(event);
    } else if (clickedSquare.classList.contains('square') && !clickedSquare.classList.contains('highlighted')) {
        handleNonColoredSquareClick(event);
    } else if (clickedSquare.classList.contains('highlighted')) {
        handleHighlightedSquareClick(event, originalColoredSquare); // Pass the tracked colored square
    }
}

// Event listeners for control buttons

undoButton.addEventListener("click", () => {
    stopPlayback();
    undoLastMove();
});

// Reset robots button
resetButton.addEventListener("click", () => {
    stopPlayback();
    resetRobots();
    resetMoveCounter();
    clearMoveHistory();
});



// New target button
newTargetButton.addEventListener("click", () => {
    stopPlayback();
    pickRandomSquareAndDisplayCircle();
    resetRobots();
    resetMoveCounter();
    clearMoveHistory();
    clearRecording();
    getSolution();

    // Reset recording button state
    resetRecordingButton();
    resetSolveButton();
    
    solveButton.disabled = false;
    recordingButton.disabled = false;
    shareButton.disabled = false;

    // Disable replay and share buttons after creating a new target
    replayButton.disabled = true;

    replayButton.textContent = "Play Solution";
    shareButton.textContent = "Share Board"

});

// New board button
newBoardButton.addEventListener("click", () => {
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
    resetSolveButton();

    // Enable recording and share board buttons

    // Disable replay and share buttons after creating a new board
    replayButton.disabled = true;
    shareButton.disabled = true;
    solveButton.disabled = true;
    recordingButton.disabled = true;

    replayButton.textContent = "Play Solution";
    shareButton.textContent = "Share Board"


});

let isFirstClick = true;

solveButton.addEventListener("click", async () => {
    stopPlayback();

    // Change appearance on first click
    if (isFirstClick) {
        solveButton.style.color = "#333";
        solveButton.style.backgroundColor = "#A5DD9B";
        solveButton.textContent = `Best Solution (${solutionStepsCount})`;
        isFirstClick = false;
    } else {
        playSolvedSolution();
    }
});

// Function to reset the recording button to its initial state
function resetRecordingButton() {
    recordingButton.textContent = "Record Solution";
    recordingButton.style.backgroundColor = "#333";
    recordingButton.style.color = "white"; 
}

function resetSolveButton() {
    solveButton.textContent = "Solve Board";
    solveButton.style.backgroundColor = "#333";
    solveButton.style.color = "white"; 
    isFirstClick = true;
}

// Initialize disabled state for replay, recording, and share board buttons

replayButton.disabled = !window.hasRecordedSolution; // Disable based on recorded solution state
shareButton.disabled = !window.hasRecordedSolution;   // Disable based on recorded solution state

// recording button
recordingButton.addEventListener('click', () => {
    replayButton.textContent = "Play Solution";
    shareButton.textContent = "Share Board"

    
    if (isRecording) {
        // If currently recording, save the recording and update the button
        stopPlayback();
        saveRecording();
        resetRecordingButton();

        // Enable replay and share buttons only if recordedClicks has entries
if (window.recordedClicks.length > 0) {
    window.hasRecordedSolution = true; // Update the state
    replayButton.disabled = false;
    shareButton.disabled = false;

    // Update the replay button text with the move count
    replayButton.textContent = `Play Solution (${moveCount})`;
    shareButton.textContent = "Share Solution";
}

    } else {
        // If not recording, start a new recording and update the button
        stopPlayback();
        startRecording();
        resetMoveCounter();

        recordingButton.textContent = "Save Recording";
        recordingButton.style.backgroundColor = "#FF8080"; // Red for "Save Recording"
        recordingButton.style.color = "#333"; 

        // Disable replay and share buttons during recording
        replayButton.disabled = true;
        shareButton.disabled = true;
    }
});

// Play saved recording button
replayButton.addEventListener("click", () => {
    stopPlayback();
    clearMoveHistory();
    playRecording();
});

// Share Solution button
shareButton.addEventListener("click", () => {
    stopPlayback();
        resetRobots();
        resetMoveCounter();
        clearMoveHistory();
    if (window.hasRecordedSolution) {
        shareSolution(); 
    } else {
        shareBoard();
    }
});


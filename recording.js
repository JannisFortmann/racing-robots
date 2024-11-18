import { resetRobots } from './robots.js';
import { handleColoredSquareClick, handleHighlightedSquareClick, clearHighlightedSquares, resetMoveCounter } from './movement.js';

// Initialize variables
let isRecording = false; // Tracks if recording is in progress
let hasRecordedSolution = false; // Tracks if a solution has been recorded

export function clearRecording() {
    window.recordedClicks = []; // Clear recorded clicks
    isRecording = false; // Reset recording state
    hasRecordedSolution = false; // Indicate no solution is recorded
}

export function startRecording() {
    isRecording = true; // Set recording mode
    window.recordedClicks = []; // Clear any previous recordings
    resetRobots(); // Reset the robots to their initial positions
    clearHighlightedSquares(); // Clear any previously highlighted squares
    console.log("Recording started");
}

// Function to stop recording and save the recorded clicks
export function saveRecording() {
    if (!isRecording) {
        console.log("No recording in progress to save.");
        return;
    }
    isRecording = false; // Stop recording mode
    hasRecordedSolution = true; // Mark that a solution has been recorded

    console.log("Recording saved");
}

// Initialize replayTimeouts array to keep track of timeouts
let replayTimeouts = [];

// Function to stop th playback
export function stopPlayback() {
    // Clear each timeout in replayTimeouts
    replayTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    replayTimeouts = []; // Reset the array
}

// Function to play the recorded clicks in order
export function playRecording() {
    if (recordedClicks.length === 0) {
        console.log("No recorded solution to play.");
        return;
    }

    stopPlayback(); // Stop any ongoing playback before starting a new one
    resetRobots(); // Reset robots to their initial position
    resetMoveCounter(); // Reset the move counter
    clearHighlightedSquares(); // Clear highlighted squares before playback

    const elements = document.querySelectorAll('#board .element');
    recordedClicks.forEach((click, index) => {
        const timeoutId = setTimeout(() => {
            const { index: squareIndex, isHighlighted } = click;
            const square = elements[squareIndex];
            if (square) {
                if (isHighlighted) {
                    handleHighlightedSquareClick({ target: square }); // Simulate highlighted square click
                } else {
                    handleColoredSquareClick({ target: square }); // Simulate colored square click
                }
            }
        }, index * 500); // 0.5-second delay between moves

        // Store the timeout ID in replayTimeouts
        replayTimeouts.push(timeoutId);
    });
}


// Function to record a click on a square
export function recordClick(square, isHighlighted) {
    if (isRecording) {
        const index = Array.from(document.querySelectorAll('#board .element')).indexOf(square); // Get index of the element
        recordedClicks.push({ index, isHighlighted }); // Store the index instead of the element
        console.log(`Recorded ${isHighlighted ? 'highlighted' : 'colored'} square click.`);
    }
}


// Export variables to track recording state
export { isRecording, hasRecordedSolution };

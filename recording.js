import { resetRobots } from './robots.js';
import { handleColoredSquareClick, handleHighlightedSquareClick, clearHighlightedSquares, resetMoveCounter } from './movement.js';

// Initialize variables
let isRecording = false; // Tracks if recording is in progress
let hasRecordedSolution = false; // Tracks if a solution has been recorded
let recordedClicks = []; // Stores the recorded sequence of clicks

export function clearRecording() {
    recordedClicks = []; // Clear recorded clicks
    isRecording = false; // Reset recording state
    hasRecordedSolution = false; // Indicate no solution is recorded
}

export function startRecording() {
    isRecording = true; // Set recording mode
    recordedClicks = []; // Clear any previous recordings
    resetRobots(); // Reset the robots to their initial positions
    clearHighlightedSquares(); // Clear any previously highlighted squares
}

export function saveRecording() {
    if (!isRecording) {
        return;
    }
    isRecording = false; // Stop recording mode
    hasRecordedSolution = true; // Mark that a solution has been recorded
}

export let replayTimeouts = [];

export function stopPlayback() {
    replayTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    replayTimeouts = [];
}

export function playRecording() {
    if (recordedClicks.length === 0) {
        return;
    }

    stopPlayback();
    resetRobots();
    resetMoveCounter();
    clearHighlightedSquares();

    const elements = document.querySelectorAll('#board .element');
    recordedClicks.forEach((click, index) => {
        const timeoutId = setTimeout(() => {
            const { index: squareIndex, isHighlighted } = click;
            const square = elements[squareIndex];
            if (square) {
                if (isHighlighted) {
                    handleHighlightedSquareClick({ target: square });
                } else {
                    handleColoredSquareClick({ target: square });
                }
            }
        }, index * 500);

        replayTimeouts.push(timeoutId);
    });
}

export function recordClick(square, isHighlighted) {
    if (isRecording) {
        const index = Array.from(document.querySelectorAll('#board .element')).indexOf(square);
        recordedClicks.push({ index, isHighlighted });
    }
}

// Export variables for use in other modules
export { isRecording, hasRecordedSolution, recordedClicks };

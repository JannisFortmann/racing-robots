import init, { solve_from_text } from './KevinCox/pkg/ricochetrobots.js'; // Adjust the path to your built wasm pkg
import { convertBoardState } from './formatBoard.js';

async function getSolution() {
    // Initialize the WebAssembly module
    await init();

    // Get the board state from `convertBoardState`
    const boardState = convertBoardState();

    try {
        // Call the Rust solver with the board string
        const solution = solve_from_text(boardState);

        // Extract and log the steps
        if (solution && solution.steps) {
            console.log("Steps:", solution.steps);
        } else {
            console.warn("No steps found in solution:", solution);
        }
    } catch (error) {
        console.error("Error solving board:", error);
    }
}

// Export the function for use elsewhere
export { getSolution };

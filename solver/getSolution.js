import init, { solve_from_text } from './KevinCox/pkg/ricochetrobots.js';
import { convertBoardState } from './formatBoard.js';
import { handleColoredSquareClick, handleHighlightedSquareClick } from '../movement.js';
import { stopPlayback, replayTimeouts } from '../recording.js';
import { resetRobots } from '../robots.js';
import { resetMoveCounter, clearHighlightedSquares } from '../movement.js';


let solutionStepsCount = 0; // Variable to store the solution length

async function getSolution() {
    await init();

    const boardState = convertBoardState();

    try {
        const solution = solve_from_text(boardState);

        if (solution && solution.steps) {
            solutionStepsCount = solution.steps.length; // Store the length
            console.log("Steps:", solution.steps);
            return solution;

        } else {
            console.warn("No steps found in solution:", solution);
            solutionStepsCount = 0;
        }
    } catch (error) {
        console.error("Error solving board:", error);
        solutionStepsCount = 0;
    }
}

// Export the step count for access in other files
export { getSolution, solutionStepsCount };


async function playSolvedSolution() {
    // Clear any ongoing playback
    stopPlayback(); // Ensure any existing playback is stopped
    resetRobots();
    resetMoveCounter();
    clearHighlightedSquares();


    try {
        // Call getSolution to retrieve the solution steps
        const solution = await getSolution();

        if (!solution || !solution.steps || solution.steps.length === 0) {
            console.warn("No solution steps available.");
            return;
        }

        // Define robot colors corresponding to their numbers
        const robotColors = {
            1: "rgb(255, 128, 128)", // Red
            2: "rgb(165, 221, 155)", // Green
            3: "rgb(177, 175, 255)", // Blue
            4: "rgb(123, 211, 234)", // Purple
        };

        const squares = document.querySelectorAll('.square');
        const boardSize = 16;

        const getAdjacentIndex = (currentIndex, direction) => {
            switch (direction) {
                case "N": return currentIndex - boardSize;
                case "E": return currentIndex + 1;
                case "S": return currentIndex + boardSize;
                case "W": return currentIndex - 1;
                default: return null;
            }
        };

        let delay = 0; // Track cumulative delay for timeouts
        solution.steps.forEach((step, stepIndex) => {
            const timeoutId = setTimeout(() => {
                if (replayTimeouts.length === 0) {
                    // Playback was stopped, exit early
                    return;
                }

                const { robot, direction } = step;

                // Get the correct color for the robot
                const robotColor = robotColors[robot];
                if (!robotColor) {
                    console.error(`No color mapping found for robot ${robot}`);
                    return;
                }

                // Find the square with the matching background color (robot's position)
                let robotSquareIndex = -1;
                squares.forEach((square, index) => {
                    const bgColor = window.getComputedStyle(square).backgroundColor;
                    if (bgColor === robotColor) {
                        robotSquareIndex = index;
                    }
                });

                if (robotSquareIndex === -1) {
                    console.error(`Could not find robot ${robot} on the board.`);
                    return;
                }

                // Trigger `handleColoredSquareClick` on the robot's square
                handleColoredSquareClick({ target: squares[robotSquareIndex] });

                // Calculate the index of the adjacent square in the direction of movement
                const targetSquareIndex = getAdjacentIndex(robotSquareIndex, direction);

                if (targetSquareIndex < 0 || targetSquareIndex >= squares.length) {
                    console.error(`Invalid target index ${targetSquareIndex} for robot ${robot}.`);
                    return;
                }

                // Trigger `handleHighlightedSquareClick` on the adjacent square
                const moveTimeoutId = setTimeout(() => {
                    handleHighlightedSquareClick({ target: squares[targetSquareIndex] });
                }, 500); // Delay after the colored square click

                // Track this timeout as well
                replayTimeouts.push(moveTimeoutId);
            }, delay);

            // Increment delay for the next step
            delay += 1000; // 500ms for each action (colored click + highlighted click)

            // Store timeout in replayTimeouts
            replayTimeouts.push(timeoutId);
        });
    } catch (error) {
        console.error("Error playing solution:", error);
    }
}





// Export the function for use elsewhere
export { playSolvedSolution };

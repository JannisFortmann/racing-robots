import { animateSquareMovement,animateSquareRotation } from './animation.js'; // Import the animation function
import { recordClick } from './recording.js';


let originalColoredSquare = null;
let moveCount = 0;
export let moveHistory = [];

// Function to clear highlighted squares and remove event listeners
export function clearHighlightedSquares() {
    const highlightedSquares = document.querySelectorAll('#board > .element.square.highlighted');

    // First, remove event listeners from each highlighted square
    highlightedSquares.forEach(square => {
        square.removeEventListener('click', handleHighlightedSquareClick); // Remove event listener
    });

    // Then, remove styling and class names from non-colored highlighted squares
    highlightedSquares.forEach(square => {
        if (!square.classList.contains('colored')) { // Only clear non-colored highlighted squares
            square.style.backgroundColor = ''; // Reset background color
        }
        square.classList.remove('highlighted', 'armUp', 'armDown', 'armLeft', 'armRight');
    });
}

// Function to update the move counter display
export function updateMoveCounter() {
    const moveCounterElement = document.getElementById('move-counter');
    moveCounterElement.textContent = `Moves: ${moveCount}`;
}

// Function to reset the move counter
export function resetMoveCounter() {
    moveCount = 0; // Reset the count to zero
    updateMoveCounter(); // Update the display
}

// Function to save the current state before moving
function saveCurrentState() {
    const currentState = {
        coloredSquares: Array.from(document.querySelectorAll('#board > .element.square.colored')).map(square => ({
            element: square, // Reference to the square
            backgroundColor: square.style.backgroundColor // Store its current color
        })),
        lastClickedIndex: originalColoredSquare ? Array.from(document.querySelectorAll('#board > .element')).indexOf(originalColoredSquare) : -1 // Save index of last clicked square
    };
    moveHistory.push(currentState);
}

// Function to clear the move history
export function clearMoveHistory() {
    moveHistory = []; // Clear the array by reassigning it to an empty array
}

export function undoLastMove() {
    if (moveHistory.length === 0) {
        console.log("No moves to undo");
        return; // No moves to undo
    }

    // Retrieve the last state
    const lastState = moveHistory.pop();

    // Clear all highlighted, arm, and colored classes
    clearHighlightedSquares();
    document.querySelectorAll('#board > .element.square').forEach(square => {
        square.classList.remove('colored');
        square.style.backgroundColor = ''; // Clear background
    });

    // Restore each colored square from the previous state
    lastState.coloredSquares.forEach(({ element, backgroundColor }) => {
        element.classList.add('colored');
        element.style.backgroundColor = backgroundColor;
    });

    // Retrieve and set the original colored square to the last clicked square in the previous state
    const elements = Array.from(document.querySelectorAll('#board > .element'));
    const lastClickedSquare = lastState.lastClickedIndex !== -1 ? elements[lastState.lastClickedIndex] : null;

    if (lastClickedSquare) {
        originalColoredSquare = lastClickedSquare;
        handleColoredSquareClick({ target: originalColoredSquare });
    } else {
        originalColoredSquare = null;
    }

    // Decrement the move count (optional)
    moveCount = Math.max(0, moveCount - 1);
    updateMoveCounter(); // Update the display
}









// Function to handle clicks on squares with the "colored" class
export function handleColoredSquareClick(event) {
    const clickedSquare = event.target;

    // Clear previously highlighted squares and their event listeners
    clearHighlightedSquares();

    // Call recordClick for colored square
    recordClick(clickedSquare, false);

    // Get the color of the clicked square
    const color = window.getComputedStyle(clickedSquare).backgroundColor;
    const [r, g, b] = color.match(/\d+/g); // Extract RGB values
    const newColor = `rgba(${r}, ${g}, ${b}, 0.3)`; // Add 0.3 opacity

    const boardSize = 33; // Assuming a 33x33 board
    const elements = Array.from(document.querySelectorAll("#board > .element")); // Get all elements in the board

    // Get the index of the clicked square
    const index = elements.indexOf(clickedSquare);
    const row = Math.floor(index / boardSize);
    const col = index % boardSize;

    console.log(`Clicked square index: ${index}, row: ${row}, col: ${col}`);

    // Highlight squares in the up direction
    let upObstacleCount = 0;
    let upColoredCount = 0; // Counter for colored squares
    for (let r = row - 1; r >= 0; r--) {
        const square = elements[r * boardSize + col];
        if (square.classList.contains('obstacle')) {
            upObstacleCount++;
        }
        if (square.classList.contains('colored')) {
            upColoredCount++;
        }
        if (upObstacleCount >= 1 || upColoredCount >= 1) break; // Stop if any obstacle or colored square is found
        if (square.classList.contains('square')) { // Check if it has the 'square' class
            square.classList.add('highlighted', 'armUp');
            square.style.backgroundColor = newColor; // Set new color
        }
    }

    // Highlight squares in the down direction
    let downObstacleCount = 0;
    let downColoredCount = 0; // Counter for colored squares
    for (let r = row + 1; r < boardSize; r++) {
        const square = elements[r * boardSize + col];
        if (square.classList.contains('obstacle')) {
            downObstacleCount++;
        }
        if (square.classList.contains('colored')) {
            downColoredCount++;
        }
        if (downObstacleCount >= 1 || downColoredCount >= 1) break; // Stop if any obstacle or colored square is found
        if (square.classList.contains('square')) { // Check if it has the 'square' class
            square.classList.add('highlighted', 'armDown');
            square.style.backgroundColor = newColor; // Set new color
        }
    }

    // Highlight squares in the left direction
    let leftObstacleCount = 0;
    let leftColoredCount = 0; // Counter for colored squares
    for (let c = col - 1; c >= 0; c--) {
        const square = elements[row * boardSize + c];
        if (square.classList.contains('obstacle')) {
            leftObstacleCount++;
        }
        if (square.classList.contains('colored')) {
            leftColoredCount++;
        }
        if (leftObstacleCount >= 1 || leftColoredCount >= 1) break; // Stop if any obstacle or colored square is found
        if (square.classList.contains('square')) { // Check if it has the 'square' class
            square.classList.add('highlighted', 'armLeft');
            square.style.backgroundColor = newColor; // Set new color
        }
    }

    // Highlight squares in the right direction
    let rightObstacleCount = 0;
    let rightColoredCount = 0; // Counter for colored squares
    for (let c = col + 1; c < boardSize; c++) {
        const square = elements[row * boardSize + c];
        if (square.classList.contains('obstacle')) {
            rightObstacleCount++;
        }
        if (square.classList.contains('colored')) {
            rightColoredCount++;
        }
        if (rightObstacleCount >= 1 || rightColoredCount >= 1) break; // Stop if any obstacle or colored square is found
        if (square.classList.contains('square')) { // Check if it has the 'square' class
            square.classList.add('highlighted', 'armRight');
            square.style.backgroundColor = newColor; // Set new color
        }
    }

    // Update originalColoredSquare to the current clicked square
    originalColoredSquare = clickedSquare;
}

export function handleNonColoredSquareClick(event) {
    if (event.target.classList.contains('highlighted')) return; // Prevent execution if square is highlighted
    clearHighlightedSquares();
}

export function handleHighlightedSquareClick(event) {
    const clickedSquare = event.target;

    // Call recordClick for highlighted square
    recordClick(clickedSquare, true);

    // The arm classes help identify the direction of the highlighted path
    const armClasses = ['armUp', 'armDown', 'armLeft', 'armRight'];
    const currentArmClass = armClasses.find(armClass => clickedSquare.classList.contains(armClass));
    console.log("Current arm class:", currentArmClass); // Log the current arm class

    // Get all highlighted squares
    const highlightedSquares = Array.from(document.querySelectorAll('#board > .element')); // Select 33x33 grid

    // Filter for squares with the correct arm class
    const squaresInDirection = highlightedSquares.filter(square => square.classList.contains(currentArmClass));

    if (squaresInDirection.length === 0) {
        console.log("No squares found in the selected direction");
        return;
    }

    // Determine target based on direction
    let targetSquare;
    if (currentArmClass === 'armUp' || currentArmClass === 'armLeft') {
        // Pick the square with the lowest index for "up" and "left" directions
        targetSquare = squaresInDirection.reduce((min, sq) =>
            highlightedSquares.indexOf(sq) < highlightedSquares.indexOf(min) ? sq : min
        );
    } else if (currentArmClass === 'armDown' || currentArmClass === 'armRight') {
        // Pick the square with the highest index for "down" and "right" directions
        targetSquare = squaresInDirection.reduce((max, sq) =>
            highlightedSquares.indexOf(sq) > highlightedSquares.indexOf(max) ? sq : max
        );
    }

    console.log("Target square found:", targetSquare); // Log the target square

    // Find the circle element dynamically and get its color
    const circleElement = document.querySelector('.circle');
    const circleColor = circleElement ? window.getComputedStyle(circleElement).backgroundColor : null;

    // Get the color of the originally clicked colored square
    const originalColor = window.getComputedStyle(originalColoredSquare).backgroundColor;

    // Update color and remove highlight from previously clicked square
    if (targetSquare) {
        // Save the current state before making the move
        saveCurrentState();

        // Calculate the duration based on the number of squares traveled
        const distance = squaresInDirection.length;
        const animationDuration = distance * 31; // 0.1 seconds per square (100 ms)

        // Start movement animation before changing the color
        animateSquareMovement(originalColoredSquare, targetSquare, animationDuration);

        // Clear the previously clicked colored square immediately
        if (originalColoredSquare) {
            originalColoredSquare.style.backgroundColor = '';
            originalColoredSquare.classList.remove('colored');
            clearHighlightedSquares();
        }

        // Use a timeout to create a delay in the color change and possible rotation
        setTimeout(() => {
            // Move color and class to the target square
            targetSquare.style.backgroundColor = originalColor;
            targetSquare.classList.add('colored');

            // Update originalColoredSquare to the new target square
            originalColoredSquare = targetSquare;

            // Increment move count and update display
            moveCount++;
            updateMoveCounter();

            // Check both conditions for rotation
            const shouldRotate = targetSquare.classList.contains('target') && originalColor === circleColor;

            if (shouldRotate) {
                console.log("Triggering rotation animation for matching colors and target square."); // Log the animation trigger
                animateSquareRotation(targetSquare, 720);
            } else {
                // Trigger handleColoredSquareClick only if rotation is not initiated
                handleColoredSquareClick({ target: targetSquare });
            }
        }, animationDuration); // Delay to match movement animation duration
    }
}





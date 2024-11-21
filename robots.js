// Robot colors: red, green, blue, purple
const colors = ['#FF8080', '#A5DD9B', '#B1AFFF', '#7BD3EA'];
const squares = document.querySelectorAll('#board > .element.square'); // Select only the "square" elements within the board

// Function to clear previously generated colored squares
function clearColoredSquares() {
    squares.forEach(square => {
        if (square.style.backgroundColor) {
            square.style.backgroundColor = ''; // Reset background color to default
            square.classList.remove('colored'); // Remove "colored" class
        }
    });
}

// Function to check if a square is touching the 4x4 center
function isTouchingCenter(square) {
    const row = Math.floor(square / 16);
    const col = square % 16;
    // Center 4x4 area is between rows 6-9 and columns 6-9
    return (row >= 6 && row <= 9 && col >= 6 && col <= 9);
}

// Function to check if a square is touching any selected square
function isTouchingSelected(square) {
    const row = Math.floor(square / 16);
    const col = square % 16;

    // Get all selected squares from the DOM
    const selectedSquares = Array.from(document.querySelectorAll("#board > .selectedSquare"));

    return selectedSquares.some(sq => {
        const sqIndex = Array.from(squares).indexOf(sq);
        const r = Math.floor(sqIndex / 16);
        const c = sqIndex % 16;

        // Check for direct adjacency
        return Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1;
    });
}

// Function to check if a square is touching any other colored square
function isTouchingColored(square, usedSquares) {
    const row = Math.floor(square / 16);
    const col = square % 16;

    return usedSquares.some(sq => {
        const r = Math.floor(sq / 16);
        const c = sq % 16;

        // Check for direct adjacency
        return Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1;
    });
}

// Function to create 4 random colored squares on the board
export function createRandomColoredSquares() {
    clearColoredSquares();

    const usedSquares = [];

    for (let i = 0; i < colors.length; i++) {
        let square;

        do {
            // Ensure squares are selected from rows 1-14 and columns 1-14
            const row = Math.floor(Math.random() * 14) + 1; // Rows 1-14 (0-indexed)
            const col = Math.floor(Math.random() * 14) + 1; // Columns 1-14 (0-indexed)
            square = row * 16 + col; // Convert (row, col) to index in the board

        } while (
            usedSquares.includes(square) || // Avoid duplicate squares
            isTouchingCenter(square) ||      // Avoid center squares
            isTouchingSelected(square) ||    // Avoid touching selected squares
            isTouchingColored(square, usedSquares) // Avoid touching other colored squares
        );

        // Set the background color and add the "colored" class to the square
        squares[square].style.backgroundColor = colors[i];
        squares[square].classList.add('colored'); // Add "colored" class
        usedSquares.push(square);

       
    }
}

// Variable to track the state of colored squares and the board
window.savedBoardState = [];

// Function to save the current state of the board
export function saveBoardState() {
    const elements = Array.from(document.querySelectorAll('#board > .element'));
    window.savedBoardState = elements.map(square => ({
        color: square.style.backgroundColor,
        isColored: square.classList.contains('colored'),
        isHighlighted: square.classList.contains('highlighted'),
    }));
}

// Function to reset robots and restore the board state
export function resetRobots() {
    const elements = Array.from(document.querySelectorAll('#board > .element'));

    // Clear colored and highlighted squares
    elements.forEach(square => {
        square.classList.remove('colored', 'highlighted', 'armUp', 'armDown', 'armLeft', 'armRight');
        square.style.backgroundColor = ''; // Clear the background color
    });

    // Restore the board state
    elements.forEach((square, index) => {
        if (window.savedBoardState[index]) {
            if (window.savedBoardState[index].isColored) {
                square.classList.add('colored');
                square.style.backgroundColor = window.savedBoardState[index].color; // Restore the color
            }
            if (window.savedBoardState[index].isHighlighted) {
                square.classList.add('highlighted');
            }
        }
    });
}

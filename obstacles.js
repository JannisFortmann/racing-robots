export function thickenEdgeLines() {

// Clear specified classes from all elements on the board, except those with the 'static-element' class
const elementsToClear = document.querySelectorAll("#board > .element:not(.static-element)");

elementsToClear.forEach(element => {
    element.classList.remove("thick", "thick-vertical", "thick-horizontal", "thick-point", "obstacle", "selectedSquare", "corner");
});


    // Get all thin vertical lines
    const verticalRowElements = Array.from(document.querySelectorAll("#board > .thin-vertical"));

    // Function to thicken lines for a given row
    const thickenRow = (rowIndex) => {
        const rowElements = verticalRowElements.filter((element, index) => {
            return Math.floor(index / 17) === rowIndex; // Adjust for rows
        });

        if (rowElements.length > 0) {
            const firstHalfIndex = Math.floor(Math.random() * (7 - 2 + 1)) + 2;
            const firstHalfElement = rowElements[firstHalfIndex];

            const secondHalfIndex = Math.floor(Math.random() * (14 - 9 + 1)) + 9;
            const secondHalfElement = rowElements[secondHalfIndex];

            if (firstHalfElement) {
                firstHalfElement.classList.add("thick", "obstacle");
                firstHalfElement.offsetWidth;  // Force reflow
            }

            if (secondHalfElement) {
                secondHalfElement.classList.add("thick", "obstacle");
                secondHalfElement.offsetWidth;  // Force reflow
            }
        }
    };

    // Thicken lines for row 1 (index 0) and row 15 (index 15)
    thickenRow(0);
    thickenRow(15);

    // Get all thin horizontal lines
    const horizontalLineElements = Array.from(document.querySelectorAll("#board > .thin-horizontal"));

    // Function to thicken lines for a given column
    const thickenColumn = (columnIndex) => {
        const columnElements = horizontalLineElements.filter((element, index) => {
            return index % 16 === columnIndex;
        });

        if (columnElements.length > 0) {
            const firstHalfIndexCol = Math.floor(Math.random() * (7 - 2 + 1)) + 2;
            const firstHalfElementCol = columnElements[firstHalfIndexCol];

            const secondHalfIndexCol = Math.floor(Math.random() * (14 - 9 + 1)) + 9;
            const secondHalfElementCol = columnElements[secondHalfIndexCol];

            if (firstHalfElementCol) {
                firstHalfElementCol.classList.add("thick", "obstacle");
                firstHalfElementCol.offsetWidth;  // Force reflow
            }

            if (secondHalfElementCol) {
                secondHalfElementCol.classList.add("thick", "obstacle");
                secondHalfElementCol.offsetWidth;  // Force reflow
            }
        }
    };

    // Thickening for column 0 (index 0) and column 15 (index 15)
    thickenColumn(0);
    thickenColumn(15);

    // Find all elements with the obstacle class
    const obstacles = Array.from(document.querySelectorAll("#board > .obstacle"));
    obstacles.forEach(obstacle => {
        // Get the obstacle's position in the grid
        const obstacleIndex = Array.from(board.children).indexOf(obstacle);
        const row = Math.floor(obstacleIndex / 33);
        const col = obstacleIndex % 33;

        // Neighboring positions (top, bottom, left, right)
        const neighbors = [
            { row: row - 1, col: col }, // Top
            { row: row + 1, col: col }, // Bottom
            { row: row, col: col - 1 }, // Left
            { row: row, col: col + 1 }  // Right
        ];

        // Check each neighbor and find the ones with the "square" class, excluding "static-element" squares
const squareNeighbors = neighbors.filter(pos => {
    if (pos.row >= 0 && pos.row < 33 && pos.col >= 0 && pos.col < 33) {
        const index = pos.row * 33 + pos.col;
        const neighborElement = board.children[index];
        // Check if the neighbor has the "square" class but not the "static-element" class
        return neighborElement.classList.contains("square") && !neighborElement.classList.contains("static-element");
    }
    return false;
});

// If exactly two neighboring elements have the "square" class, add "selectedSquare"
if (squareNeighbors.length === 2) {
    squareNeighbors.forEach(pos => {
        const index = pos.row * 33 + pos.col;
        const squareElement = board.children[index];
        squareElement.classList.add("selectedSquare");

    });
}

    });

    // Store selected squares globally
    window.selectedSquares = Array.from(document.querySelectorAll("#board > .selectedSquare"));
}







export function thickenCorners() {
    const squares = Array.from(document.querySelectorAll("#board > .square"));
    const globalSelectedSquares = window.selectedSquares || []; // Access global selected squares

    const quadrants = [
        { rowStart: 1, colStart: 1 },      // Top Left
        { rowStart: 1, colStart: 8 },      // Top Right
        { rowStart: 8, colStart: 1 },      // Bottom Left
        { rowStart: 8, colStart: 8 }       // Bottom Right
    ];

    const getIndex = (row, col) => row * 16 + col;

      // Define legal configurations for adjacent thickening
      const configurations = [
        { left: true, above: true }, // left + above
        { left: true, below: true }, // left + below
        { right: true, above: true }, // right + above
        { right: true, below: true }  // right + below
    ];

    quadrants.forEach(quad => {
        let selectedSquares = [];
        let selectedRows = new Set(); // To track selected rows
        let selectedCols = new Set(); // To track selected columns

        // Continue until we have exactly 4 corners in this quadrant
        while (selectedSquares.length < 4) {
            // Generate random row and column within the 7x7 quadrant (1-7 or 8-14)
            const row = Math.floor(Math.random() * 7) + quad.rowStart; // Rows 1 to 7 or 8 to 14
            const col = Math.floor(Math.random() * 7) + quad.colStart; // Columns 1 to 7 or 8 to 14
            const square = squares[getIndex(row, col)];

            // Skip if the selected row or column is within the center area
            if ((row >= 6 && row <= 9) && (col >= 6 && col <= 9)) {
                continue; // Skip if in the 4x4 center
            }

            // Check if this square already has the "selectedSquare" or "corner" class
            if (square.classList.contains("selectedSquare") || square.classList.contains("corner")) {
                continue; // Skip if already selected
            }

            // Check surrounding squares for selectedSquare conflicts before marking
            const neighbors = [
                { row: row - 1, col: col }, // Top
                { row: row + 1, col: col }, // Bottom
                { row: row, col: col - 1 }, // Left
                { row: row, col: col + 1 }, // Right
                { row: row - 1, col: col - 1 }, // Top Left (Diagonal)
                { row: row - 1, col: col + 1 }, // Top Right (Diagonal)
                { row: row + 1, col: col - 1 }, // Bottom Left (Diagonal)
                { row: row + 1, col: col + 1 }  // Bottom Right (Diagonal)
            ];

            const conflict = neighbors.some(pos => {
                if (pos.row >= 0 && pos.row < 16 && pos.col >= 0 && pos.col < 16) {
                    const index = getIndex(pos.row, pos.col);
                    const neighborSquare = squares[index];
                    if (neighborSquare.classList.contains("selectedSquare") || neighborSquare.classList.contains("corner")) {
                        return true; // Found a conflict
                    }
                }
                return false; // No conflict found for this neighbor
            });

            // Skip if there is a conflict
            if (conflict) {
                continue;
            }

            // Check if this row or column is already selected within the quadrant
            if (selectedRows.has(row) || selectedCols.has(col)) {
                continue; // Skip if in the same row or column
            }

            // Mark this square as selected
            square.classList.add("selectedSquare", "corner");
            selectedSquares.push(squares[getIndex(row, col)]);
            selectedRows.add(row); // Add the row to the set
            selectedCols.add(col); // Add the column to the set


        }

        
        // Update global selected squares after processing this quadrant
        window.selectedSquares = [...globalSelectedSquares, ...selectedSquares];

    });

    // Get the 33x33 grid elements
const elements = Array.from(document.querySelectorAll("#board > .element"));

// Define the new quadrant boundaries based on the 17th row and column as dividers
const newQuadrants = [
    { rowStart: 0, rowEnd: 16, colStart: 0, colEnd: 16 },   // Top Left
    { rowStart: 0, rowEnd: 16, colStart: 17, colEnd: 32 },  // Top Right
    { rowStart: 17, rowEnd: 32, colStart: 0, colEnd: 16 },  // Bottom Left
    { rowStart: 17, rowEnd: 32, colStart: 17, colEnd: 32 }  // Bottom Right
];

// Define helper to get index in 33x33 grid
const getElementIndex = (row, col) => row * 33 + col;

// Loop through each quadrant
newQuadrants.forEach((quad, quadrantIndex) => {
    // Find all corner elements within this quadrant
    const quadrantCorners = [];
    for (let row = quad.rowStart; row <= quad.rowEnd; row++) {
        for (let col = quad.colStart; col <= quad.colEnd; col++) {
            const index = getElementIndex(row, col);
            const element = elements[index];
            if (element && element.classList.contains("corner")) {
                quadrantCorners.push({ element, row, col });
            }
        }
    }

    // Check that we have exactly 4 corners in this quadrant
    if (quadrantCorners.length !== 4) {
        console.error(`Error in quadrant ${quadrantIndex}: Expected 4 corners, found ${quadrantCorners.length}`);
        return;
    }

    // Define the four configurations for thickening around corners
    const configurations = [
        { top: true, left: true },   // Top Left thickening
        { top: true, right: true },  // Top Right thickening
        { bottom: true, left: true },// Bottom Left thickening
        { bottom: true, right: true } // Bottom Right thickening
    ];

    // Shuffle the configurations for randomness
    const shuffledConfigurations = configurations.sort(() => Math.random() - 0.5);

    // Apply thickening to each corner with its corresponding configuration
    quadrantCorners.forEach((corner, i) => {
        const { row, col } = corner;
        const config = shuffledConfigurations[i];

        // Apply thickening based on the configuration
        if (config.left && col > 0) {
            const leftNeighborIndex = getElementIndex(row, col - 1);
            elements[leftNeighborIndex]?.classList.add("thick", "obstacle");
        }
        if (config.right && col < 32) {
            const rightNeighborIndex = getElementIndex(row, col + 1);
            elements[rightNeighborIndex]?.classList.add("thick", "obstacle");
        }
        if (config.top && row > 0) {
            const topNeighborIndex = getElementIndex(row - 1, col);
            elements[topNeighborIndex]?.classList.add("thick", "obstacle");
        }
        if (config.bottom && row < 32) {
            const bottomNeighborIndex = getElementIndex(row + 1, col);
            elements[bottomNeighborIndex]?.classList.add("thick", "obstacle");
        }

         // Add thick class to the corresponding diagonal element
         if (config.left && config.top && row > 0 && col > 0) {
            const topLeftDiagonalIndex = getElementIndex(row - 1, col - 1);
            elements[topLeftDiagonalIndex]?.classList.add("thick");
        } else if (config.top && config.right && row > 0 && col < 32) {
            const topRightDiagonalIndex = getElementIndex(row - 1, col + 1);
            elements[topRightDiagonalIndex]?.classList.add("thick");
        } else if (config.bottom && config.left && row < 32 && col > 0) {
            const bottomLeftDiagonalIndex = getElementIndex(row + 1, col - 1);
            elements[bottomLeftDiagonalIndex]?.classList.add("thick");
        } else if (config.bottom && config.right && row < 32 && col < 32) {
            const bottomRightDiagonalIndex = getElementIndex(row + 1, col + 1);
            elements[bottomRightDiagonalIndex]?.classList.add("thick");
        }
    });
});
// Store all corner elements globally
window.cornerSquares = Array.from(document.querySelectorAll("#board > .corner"));

}


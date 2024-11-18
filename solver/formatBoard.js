

export async function convertBoardState() {
    const gridSize = 33;        // Original grid size in the document
    const outputSize = 16;      // Target board size for solver format
    const elements = document.querySelectorAll('.element'); // Get all elements with class 'element'

    let boardString = "board 16 16\n";

    // Generate the 16x16 board layout based on obstacle positions
    for (let row = 0; row < outputSize; row++) {
        let line = "";
        for (let col = 0; col < outputSize; col++) {
            // Calculate the starting index of the 2x2 set within the flat elements list
            const baseIndex = (row * 2 * gridSize) + (col * 2);

            // Get elements for the 2x2 set (top-left, top-right, bottom-left, bottom-right)
            const topLeft = elements[baseIndex];
            const topRight = elements[baseIndex + 1];
            const bottomLeft = elements[baseIndex + gridSize];
            const bottomRight = elements[baseIndex + gridSize + 1];

            // Check for obstacles in horizontal (topRight) and vertical (bottomLeft) lines
            const hasHorizontalObstacle = topRight.classList.contains("obstacle");
            const hasVerticalObstacle = bottomLeft.classList.contains("obstacle");

            // Determine the tile type based on obstacle positions
            let tile;
            if (hasHorizontalObstacle && hasVerticalObstacle) {
                tile = "B";  // Both obstacles
            } else if (hasVerticalObstacle) {
                tile = "W";  // Vertical obstacle only
            } else if (hasHorizontalObstacle) {
                tile = "N";  // Horizontal obstacle only
            } else {
                tile = "C";  // No obstacles
            }

            // Append tile character with a space unless it’s the last in the line
            line += tile + (col < outputSize - 1 ? " " : "");
        }
        boardString += line + "\n";  // Move to the next line after each row
    }

    // Set up robot color mappings and initialize positions
    const robotColors = {
        "rgb(255, 128, 128)": "red",    // Color for red robot
        "rgb(165, 221, 155)": "green",  // Color for green robot
        "rgb(177, 175, 255)": "purple", // Color for purple robot
        "rgb(123, 211, 234)": "blue"    // Color for blue robot
    };

    // Initialize positions list, with the first robot always set to (7, 7)
    let robotPositions = ["robots 5", "7 7"];

    // Retrieve all squares in the 16x16 grid and determine robot positions
    const squares = document.querySelectorAll('.square'); // Select all squares
    squares.forEach((square, index) => {
        if (square.classList.contains('colored')) {
            // Get computed background color to determine robot color
            const color = window.getComputedStyle(square).backgroundColor;
            const robotType = robotColors[color];

            // Calculate robot's coordinates in the 16x16 grid
            const row = Math.floor(index / outputSize);
            const col = index % outputSize;
            const position = `${col} ${row}`;

            // Assign position based on robot color
            if (robotType === "red") {
                robotPositions[2] = position; // Position for red robot
            } else if (robotType === "green") {
                robotPositions[3] = position; // Position for green robot
            } else if (robotType === "purple") {
                robotPositions[4] = position; // Position for purple robot
            } else if (robotType === "blue") {
                robotPositions[5] = position; // Position for blue robot
            }
        }
    });

    // Append the robot positions to the board string
    boardString += robotPositions.join("\n") + "\n";

    // Determine target position and color
    let targetString = "target 0 "; // "target" and "0" are static
    const targetSquare = document.querySelector('.target'); // Select the target element

    if (targetSquare) {
        const targetIndex = Array.from(squares).indexOf(targetSquare);
        const row = Math.floor(targetIndex / outputSize);
        const col = targetIndex % outputSize;

        // Get the color of the target
        const targetColor = window.getComputedStyle(targetSquare.querySelector('.circle')).backgroundColor;
        let targetColorCode;

        // Map the target color to its respective code
        switch (targetColor) {
            case "rgb(255, 128, 128)":
                targetColorCode = "1"; // Red target
                break;
            case "rgb(165, 221, 155)":
                targetColorCode = "2"; // Green target
                break;
            case "rgb(177, 175, 255)":
                targetColorCode = "3"; // Purple target
                break;
            case "rgb(123, 211, 234)":
                targetColorCode = "4"; // Blue target
                break;
            default:
                targetColorCode = "0"; // Default/fallback
        }

        // Format target coordinates and color for output
        targetString += `${col} ${row} ${targetColorCode}\n`;
    } else {
        console.warn("Target element not found.");
        targetString += "0 0 0\n"; // Fallback if target element not found
    }

    // Append the target information to the board string
    boardString += targetString;

    console.log(boardString); // Log the final board format for verification

    try {
        // Call the Rust WebAssembly function with the board string directly
        const result = await parse_board_string(boardString);

        console.log("Parsed result from Rust:", result);
        // Further logic to use the result as needed
    } catch (error) {
        console.error("Error parsing board string:", error);
    }
}

// Call the function to execute and log the board state for testing
convertBoardState();

// change 1

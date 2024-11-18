// Declare the variable globally
window.currentCircle = null; // Initialize as needed

// Circle colors array (no multi-color option)
const circleColors = ['#FF8080', '#B1AFFF', '#7BD3EA', '#A5DD9B'];

// Function to pick a random color from the available options
function getRandomColorOption() {
    // Randomly pick one option from the circleColors array
    const randomIndex = Math.floor(Math.random() * circleColors.length);
    return circleColors[randomIndex];
}

// Function to create and display a circle with a single color
function displayCircleInSquare(square) {
    // Remove any existing circle in the square
    const existingCircle = square.querySelector('.circle');
    if (existingCircle) {
        existingCircle.remove();
    }

    // Create a new circle container
    const circle = document.createElement('div');
    circle.classList.add('circle');

    // Get a random color option
    const colorOption = getRandomColorOption();

    // Set the background color of the circle
    circle.style.backgroundColor = colorOption;

    // Save the actual circle in the global variable
    window.currentCircle = circle;

    // Append the circle to the square
    square.appendChild(circle);
}

// Function to clear all existing circles from the board
export function clearAllCircles() {
    const allCircles = document.querySelectorAll('.circle');
    allCircles.forEach(circle => {
        circle.remove();
    });
}

// Function to pick one random square from the corner squares and place the circle
export function pickRandomSquareAndDisplayCircle() {
    // Select all corner squares dynamically
    const cornerSquares = Array.from(document.querySelectorAll('.square.corner'));

    // Ensure cornerSquares is populated with the elements
    if (cornerSquares.length === 0) {
        console.error('No squares available in cornerSquares');
        return;
    }

    // Clear all existing circles before placing a new one
    clearAllCircles();

    // Remove "target" class from all squares
    const allSquares = document.querySelectorAll('.square');
    allSquares.forEach(square => {
        square.classList.remove('target');
    });

    // Pick a random square from the cornerSquares
    const randomIndex = Math.floor(Math.random() * cornerSquares.length);
    const randomSquare = cornerSquares[randomIndex];

    // Add "target" class to the selected square
    randomSquare.classList.add('target');

    // Display the circle in the selected square
    displayCircleInSquare(randomSquare);
}


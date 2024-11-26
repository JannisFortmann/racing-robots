function animateSquareMovement(originalSquare, targetSquare, duration) {
  // Create a visual square for animation
  const animatedSquare = document.createElement("div");
  animatedSquare.style.position = "absolute";
  animatedSquare.style.width = `${originalSquare.offsetWidth}px`; // Match the size of the original square
  animatedSquare.style.height = `${originalSquare.offsetWidth}px`; // Match the size of the original square
  animatedSquare.style.boxShadow = "0 0 0 1px #505050"; // Match the original square's shadow
  animatedSquare.style.backgroundColor =
    window.getComputedStyle(originalSquare).backgroundColor;

  // Get the positions of the original and target squares
  const originalRect = originalSquare.getBoundingClientRect();
  const targetRect = targetSquare.getBoundingClientRect();

  // Set the initial position of the animated square
  animatedSquare.style.left = `${originalRect.left}px`;
  animatedSquare.style.top = `${originalRect.top}px`;
  document.body.appendChild(animatedSquare); // Append the animated square to the body

  const startTime = performance.now();

  function animate(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1); // Normalize progress (0 to 1)

    // Calculate the current position
    const currentX =
      originalRect.left + (targetRect.left - originalRect.left) * progress;
    const currentY =
      originalRect.top + (targetRect.top - originalRect.top) * progress;

    // Update position
    animatedSquare.style.left = `${currentX}px`;
    animatedSquare.style.top = `${currentY}px`;

    if (progress < 1) {
      requestAnimationFrame(animate); // Continue animating
    } else {
      // Animation complete; remove the animated square
      document.body.removeChild(animatedSquare);
    }
  }

  requestAnimationFrame(animate);
}

export { animateSquareMovement };

export function animateSquareRotation(targetSquare, degrees) {
  // Clear any existing transformations
  targetSquare.style.transition = "none"; // Disable transition for instant rotation
  targetSquare.style.transform = `rotate(0deg)`; // Reset to 0 degrees

  // Force reflow/repaint to apply the reset
  void targetSquare.offsetWidth; // This line forces a reflow

  // Enable the transition and set the new rotation
  targetSquare.style.transition = "transform 1s ease-in-out"; // Adjust duration and easing as needed
  targetSquare.style.transform = `rotate(${degrees}deg)`; // Rotate to the desired degrees

  // Optional: Reset the rotation after the animation
  setTimeout(() => {
    targetSquare.style.transition = "none"; // Disable transition for instant reset
    targetSquare.style.transform = `rotate(0deg)`; // Reset to 0 degrees
  }, 500); // Match this duration with your animation duration
}

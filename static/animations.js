const characterImage = document.querySelector('.character-image');

const mouth = document.getElementById('mouth');
const leftEye = document.getElementById('leftEye');
const rightEye = document.getElementById('rightEye');
let direction = 1; // 1 for opening, -1 for closing
let currentY = 70; // starting position
let easing = 0.6; // Adjusted base easing value

let shouldAnimate = false;

function animateMouth() {
  if (!shouldAnimate) {
    return;
  }

  // Randomly adjust easing for varied speed, but within a tighter range
  easing = 0.6 + Math.random() * 0.1;

  const targetY = direction === 1 ? 90 : 50;
  const distance = targetY - currentY;
  currentY += distance * easing;

  // Reverse direction when reaching limits
  if (currentY >= 88 || currentY <= 52) {
    direction *= -1;
  }

  // Update the path's d attribute with eased values
  mouth.setAttribute('d', `M10 50 Q100 ${currentY} 190 50`);

  // Abstract facial expressions: pulsing eyes with reduced intensity
  const eyeRadius = Math.random() * 3; // Random radius up to 3 for less intensity
  leftEye.setAttribute('r', eyeRadius);
  rightEye.setAttribute('r', eyeRadius);

  // Schedule the next animation frame with a random delay for varied pacing
  const randomDelay = Math.random() * 40; // Up to 40ms delay for more frequent movement

  // Introduce a random pause
  if (Math.random() < 0.03) {
    // 3% chance of a longer pause
    setTimeout(() => requestAnimationFrame(animateMouth), 400); // 400ms pause
  } else {
    setTimeout(() => requestAnimationFrame(animateMouth), randomDelay);
  }
}

function startSpeakingAnimation() {
  shouldAnimate = true;

  startImageAnimation();

  if (!document.querySelector('.character-image.animated-mouth')) {
    animateMouth();
  }
}

function startImageAnimation() {
  // Generate a random delay between 0 and 1
  const randomDelay = Math.random();
  characterImage.setAttribute('data-random-delay', randomDelay);

  // Randomize animation duration for varied speed
  const randomDuration = 0.4 + Math.random() * 0.3;
  characterImage.style.setProperty(
    '--animation-duration',
    `${randomDuration}s`
  );

  // Randomize movement intensity
  const randomMoveX = (Math.random() - 0.5) * 2 + '%';
  const randomMoveY = (Math.random() - 0.5) * 2 + '%';
  const randomScaleY = 0.85 + Math.random() * 0.1;
  characterImage.style.setProperty('--move-x', randomMoveX);
  characterImage.style.setProperty('--move-y', randomMoveY);
  characterImage.style.setProperty('--scale-y', randomScaleY.toString());

  // Introduce a random pause
  if (Math.random() < 0.05) {
    characterImage.style.animationPlayState = 'paused';
    setTimeout(() => {
      characterImage.style.animationPlayState = 'running';
      if (shouldAnimate) {
        startImageAnimation();
      }
    }, 500);
  } else {
    if (shouldAnimate) {
      setTimeout(startImageAnimation, 500);
    }
  }
}

// function to stop the animation
function stopSpeakingAnimation() {
  shouldAnimate = false;
  characterImage.classList.remove('animated-mouth');
}

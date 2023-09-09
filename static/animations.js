class CharacterAnimation {
  constructor(parentElement) {
    this.parentElement = parentElement;
  }

  init() {
    this.characterImage = this.parentElement.querySelector('.character-image');
    this.mouth = this.parentElement.querySelector('.mouth');
    this.leftEye = this.parentElement.querySelector('.leftEye');
    this.rightEye = this.parentElement.querySelector('.rightEye');
    this.direction = 1; // 1 for opening, -1 for closing
    this.currentY = 70; // starting position
    this.easing = 0.6; // Adjusted base easing value
    this.shouldAnimate = false;
  }

  animateMouth() {
    if (!this.shouldAnimate) {
      return;
    }

    this.easing = 0.6 + Math.random() * 0.1;
    const targetY = this.direction === 1 ? 90 : 50;
    const distance = targetY - this.currentY;
    this.currentY += distance * this.easing;

    if (this.currentY >= 88 || this.currentY <= 52) {
      this.direction *= -1;
    }

    this.mouth.setAttribute('d', `M10 50 Q100 ${this.currentY} 190 50`);

    const eyeRadius = Math.random() * 3;
    this.leftEye.setAttribute('r', eyeRadius);
    this.rightEye.setAttribute('r', eyeRadius);

    const randomDelay = Math.random() * 40;

    if (Math.random() < 0.03) {
      setTimeout(
        () => requestAnimationFrame(this.animateMouth.bind(this)),
        400
      );
    } else {
      setTimeout(
        () => requestAnimationFrame(this.animateMouth.bind(this)),
        randomDelay
      );
    }
  }

  startSpeakingAnimation() {
    this.shouldAnimate = true;
    this.startImageAnimation();

    if (!this.characterImage.classList.contains('animated-mouth')) {
      this.animateMouth();
    }
  }

  startImageAnimation() {
    const randomDelay = Math.random();
    this.characterImage.setAttribute('data-random-delay', randomDelay);

    const randomDuration = 0.4 + Math.random() * 0.3;
    this.characterImage.style.setProperty(
      '--animation-duration',
      `${randomDuration}s`
    );

    const randomMoveX = (Math.random() - 0.5) * 2 + '%';
    const randomMoveY = (Math.random() - 0.5) * 2 + '%';
    const randomScaleY = 0.85 + Math.random() * 0.1;
    this.characterImage.style.setProperty('--move-x', randomMoveX);
    this.characterImage.style.setProperty('--move-y', randomMoveY);
    this.characterImage.style.setProperty('--scale-y', randomScaleY.toString());

    if (Math.random() < 0.05) {
      this.characterImage.style.animationPlayState = 'paused';
      setTimeout(() => {
        this.characterImage.style.animationPlayState = 'running';
        if (this.shouldAnimate) {
          this.startImageAnimation();
        }
      }, 500);
    } else {
      if (this.shouldAnimate) {
        setTimeout(this.startImageAnimation.bind(this), 500);
      }
    }
  }

  stopSpeakingAnimation() {
    this.shouldAnimate = false;
    this.characterImage.classList.remove('animated-mouth');
  }
}

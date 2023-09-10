const animationClasses = [
  'not-started',
  'recording',
  'transcribing',
  'thinking',
  'getting-ready',
  'speaking',
  'done-speaking',
  'error',
];
class CharacterComponent extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.characterAnimation = new CharacterAnimation(this.shadow);
    this.characterImageUrl = '';

    this.shadow.innerHTML = `
            <div class="character-container">
              <div class="character-image-and-animation-container">
                <div class="character-image-container">
                  <img class="character-image" src="" alt="Character Image">
                </div>
                <div class="character-animations">
                  <svg width="200" height="100" viewBox="0 0 200 100" style="background-color: #ffffff4d;">
                    <circle class="leftEye" cx="60" cy="30" r="0" fill="#333" />
                    <circle class="rightEye" cx="140" cy="30" r="0" fill="#333" />
                    <rect class="upperTeeth" x="10" y="40" width="180" height="5" fill="#ddd" />
                    <rect class="lowerTeeth" x="10" y="55" width="180" height="5" fill="#ddd" />
                    <path class="mouth" d="M10 50 Q100 70 190 50" fill="none" stroke="black" stroke-width="5" />
                  </svg>
                </div>
              </div>
              <div class="character-dropdown-container flex-row">
                <label class="flex-row"><div class="character-name"></div><div>:</div></label>
                <select class="character-dropdown"></select>
              </div>
            </div>

            <script src="/static/animations.js"></script>
        `;

    // load the css styles and apply it to this component
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', '/static/character-component.css');
    this.shadow.appendChild(linkElem);
  }

  connectedCallback() {
    this.characterId = this.getAttribute('character-id') || '';
    this.label = this.getAttribute('label') || 'Character';

    // Fetch character data and populate dropdown
    fetchDatabaseData()
      .then((data) => {
        this.characters = data.characters;
        this.populateDropdown(this.characters);
        this.chooseRandomCharacter();
        this.characterAnimation.init();
      })
      .catch((error) => {
        console.error('Error in character-component:', error);
      });

    this.shadow
      .querySelector('.character-dropdown')
      .addEventListener('change', this.onCharacterChange.bind(this));
  }

  render(viewState) {
    const characterNameElem = this.shadow.querySelector('.character-name');
    characterNameElem.textContent = this.label;

    const characterImageElem = this.shadow.querySelector('.character-image');
    characterImageElem.src = this.characterImageUrl;

    if (!viewState || !viewState.status) return;

    let currentClass = 'not-started';
    switch (viewState.status.status_string) {
      // cases for each of these statuses:
      // not yet started, recording, transcribing,
      // thinking, getting ready to speak, speaking, done speaking
      case 'recording':
        currentClass = 'recording';
        this.stopSpeaking();
        break;
      case 'transcribing':
        currentClass = 'transcribing';
        break;
      case 'generating_response':
        currentClass = 'thinking';
        break;
      case 'finished_generating_response':
        currentClass = 'getting-ready';
        break;
      case 'synthesizing_voice':
        currentClass = 'getting-ready';
        break;
      case 'speaking':
        currentClass = 'animated-mouth';
        this.startSpeaking();
        break;
      case 'done_speaking':
        currentClass = 'done-speaking';
        this.stopSpeaking();
        break;
      case 'error_text_to_speech':
        currentClass = 'error';
        break;
      default:
        currentClass = 'not-started';
    }

    const characterImage = this.shadow.querySelector('.character-image');
    characterImage.classList.remove(...animationClasses);

    // Add the current class
    characterImage.classList.add(currentClass);
  }

  populateDropdown(characters) {
    const dropdown = this.shadow.querySelector('.character-dropdown');
    Object.keys(characters).forEach((characterId) => {
      const option = document.createElement('option');
      option.value = characterId;
      option.textContent = characterId.replace(/-/g, ' ');
      dropdown.appendChild(option);
    });
  }

  setCharacterImage(characterId, bustCache) {
    if (!characterId) return;
    fetch(`/get_character_image/${characterId}`)
      .then((response) => response.json())
      .then((data) => {
        if (bustCache) {
          this.characterImageUrl = `${data.image_path}?${new Date().getTime()}`;
        } else {
          this.characterImageUrl = data.image_path;
        }
        this.render();
      });
  }

  setCurrentCharacter(characterId) {
    this.characterId = characterId;
    // use the given character id to set the appropriate image and dropdown value
    this.setCharacterImage(characterId);
    this.shadow.querySelector('.character-dropdown').value = characterId;
    // set the id attribute on this component to the character id
    this.setAttribute('data-character-id', characterId);
  }

  onCharacterChange(callback) {
    // pull out the character id from the callback
    const characterId = callback.target.value;
    this.setCurrentCharacter(characterId);
    // emit an event to let the parent know that the character has changed
    const event = new CustomEvent('character-change', {
      detail: { characterId },
    });
    this.dispatchEvent(event);
  }

  getCurrentCharacter() {
    return this.characterId;
  }

  chooseRandomCharacter() {
    // choose a random character (using a loop to make sure
    // it's different than all other characters on the page
    // and set it as the selected one for this dropdown, and then use
    // that to set the character image
    const characterIds = Object.keys(this.characters);
    let randomIndex = Math.floor(Math.random() * characterIds.length);
    while (characterIds[randomIndex] === this.characterId) {
      randomIndex = Math.floor(Math.random() * characterIds.length);
    }
    this.shadow.querySelector('.character-dropdown').value =
      characterIds[randomIndex];
    const randomCharacterId = characterIds[randomIndex];
    this.setCurrentCharacter(randomCharacterId);
  }

  startSpeaking() {
    this.characterAnimation.startSpeakingAnimation();
  }

  stopSpeaking() {
    this.characterAnimation.stopSpeakingAnimation();
  }
}

customElements.define('character-component', CharacterComponent);

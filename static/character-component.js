class CharacterComponent extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.characterId = this.getAttribute('character-id') || '';
    this.label = this.getAttribute('label') || 'Character';

    this.render();

    // Fetch character data and populate dropdown
    fetchDatabaseData()
      .then((data) => {
        this.characters = data.characters;
        this.populateDropdown(this.characters);
        this.chooseRandomCharacter();
      })
      .catch((error) => {
        console.error('Error in character-component:', error);
      });

    this.shadow
      .querySelector('.character-dropdown')
      .addEventListener('change', this.onCharacterChange.bind(this));
  }

  render() {
    this.shadow.innerHTML = `
            <div class="character-container">
                <img class="character-image" src="" alt="Character Image">
                <label>${this.label}:</label>
                <select class="character-dropdown"></select>
            </div>
        `;
    // load the css styles and apply it to this component
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', '/static/character-component.css');
    this.shadow.appendChild(linkElem);
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
        const characterImageElement =
          this.shadow.querySelector('.character-image');
        if (bustCache) {
          characterImageElement.src = `${
            data.image_path.png
          }?${new Date().getTime()}`;
        } else {
          characterImageElement.src = data.image_path;
        }
      });
  }

  setCurrentCharacter(characterId) {
    this.characterId = characterId;
    // use the given character id to set the appropriate image and dropdown value
    this.setCharacterImage(characterId);
    this.shadow.querySelector('.character-dropdown').value = characterId;
  }

  onCharacterChange(callback) {
    // pull out the character id from the callback
    const characterId = callback.target.value;
    this.setCurrentCharacter(characterId);
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
}

customElements.define('character-component', CharacterComponent);

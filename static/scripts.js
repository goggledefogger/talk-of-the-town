let characterDataGlobal = {}; // This will store the fetched character data

// Function to load character data from the Flask API
function fetchCharacterData() {
  fetch('/get-data')
    .then((response) => response.json())
    .then((data) => {
      characterDataGlobal = data; // Store the fetched data in the global variable
      populateCharacterDropdown();
      setCurrentCharacter();
      // populate the form with the current character data
      loadCharacterData();
    });
}

function populateCharacterDropdown() {
  const dropdown = document.getElementById('character_id');
  dropdown.innerHTML = ''; // Clear existing options
  for (let characterId in characterDataGlobal.characters) {
    const option = document.createElement('option');
    option.value = characterId;
    option.textContent = characterId.replace(/-/g, ' '); // Convert "cat-cartman" to "cat cartman"
    dropdown.appendChild(option);
  }
}

function loadCharacterData(userAction = false) {
  const characterId = document.getElementById('character_id').value;
  const characterData = characterDataGlobal.characters[characterId];
  if (characterData) {
    document.getElementById('voice_id').value = characterData.voice_id;
    document.getElementById('prompt').value = characterData.prompt;
  } else {
    console.warn(`Character data for '${characterId}' not found.`);
  }

  setCharacterImage(characterId);

  // If this function was triggered by a user action, enable the button
  if (userAction) {
    document.getElementById('configSubmit').disabled = true;
  }
}

function setCharacterImage(characterId) {
  fetch(`/get_character_image/${characterId}`)
    .then((response) => response.json())
    .then((data) => {
      const characterImageElement = document.getElementById('characterImage');
      characterImageElement.src = data.image_path;
    });
}

// Call the function initially to fetch and populate the character data
fetchCharacterData();

function handleSubmit(event, message) {
  event.preventDefault(); // Prevent the default form submission behavior
  fetch(event.target.action, {
    method: 'POST',
    body: new FormData(event.target), // Send form data
  })
    .then((response) => response.json())
    .then((data) => {
      alert(message); // Show the confirmation message
      location.reload(); // Reload the page to reflect any changes
    })
    .catch((error) => {
      alert('An error occurred. Please try again.');
    });
}

function checkFormValidity(formId) {
  const form = document.getElementById(formId);
  const submitButton = form.querySelector('button[type="submit"]');
  let isFormEdited = false;

  // Check if any input or select field has been edited
  form.querySelectorAll('input, select').forEach((input) => {
    if (input.defaultValue !== input.value) {
      isFormEdited = true;
    }
  });

  if (isFormEdited) {
    submitButton.removeAttribute('disabled');
  } else {
    submitButton.setAttribute('disabled', 'true');
  }
}

function attachInputChangeListeners(formId) {
  const form = document.getElementById(formId);
  const inputs = form.querySelectorAll('input, select, textarea');
  const submitButton = form.querySelector('button[type="submit"]');

  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      submitButton.disabled = false;
    });
  });
}

// Call the function for each form:
attachInputChangeListeners('configForm');
attachInputChangeListeners('characterForm');

function setCurrentCharacter() {
  // use the data structure to get it
  const currentCharacter = characterDataGlobal['current_character'];
  const dropdown = document.getElementById('character_id');
  dropdown.value = currentCharacter;
  loadCharacterData();
}

function sanitizeCharacterId(characterId) {
  // Convert spaces to hyphens
  let sanitized = characterId.replace(/\s+/g, '-');

  // Remove non-alphanumeric and non-hyphen characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9-]/g, '');

  return sanitized.toLowerCase(); // Convert to lowercase for consistency
}

document
  .getElementById('characterForm')
  .addEventListener('submit', function (event) {
    // Sanitize the character_id input value
    const characterIdInput = document.getElementById('new_character_id');
    characterIdInput.value = sanitizeCharacterId(characterIdInput.value);

    // The form will continue with its default submission behavior
  });

// Function to populate the current character dropdown
function populateCurrentCharacterDropdown() {
  const dropdown = document.getElementById('current_character');
  for (let characterId in characterDataGlobal) {
    const option = document.createElement('option');
    option.value = characterId;
    option.textContent = characterId.replace(/-/g, ' ');
    dropdown.appendChild(option);
  }
}

// Function to save the selected character as the default
function setDefaultCharacter() {
  const selectedCharacter = document.getElementById('character_id').value;

  // Make an HTTP POST request to save the selected character as default
  fetch('/save-current-character', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ current_character: selectedCharacter }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert('Character set as default successfully!');
      } else {
        alert('Error setting character as default.');
      }
    });
}

function confirmDeleteCharacter() {
  const characterId = document.getElementById('character_id').value;
  const confirmation = window.confirm(
    `Are you sure you want to delete the character "${characterId.replace(
      /-/g,
      ' '
    )}"?`
  );
  if (confirmation) {
    deleteCharacter(characterId);
  }
}

function deleteCharacter(characterId) {
  fetch('/delete-character', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ character_id: characterId }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Reload the page to refresh the character list
        location.reload();
      } else {
        alert('Error deleting character. Please try again.');
      }
    });
}

function startConversation() {
  fetch('/start-conversation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === 'started') {
        document.getElementById('startConversationBtn').disabled = true;
        document.getElementById('stopConversationBtn').disabled = false;
        document.getElementById('conversationStatus').textContent =
          'Status: In Progress';
      }
    });
}

function stopConversation() {
  fetch('/stop-conversation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === 'stopped') {
        document.getElementById('startConversationBtn').disabled = false;
        document.getElementById('stopConversationBtn').disabled = true;
        document.getElementById('conversationStatus').textContent =
          'Status: Stopped';
      }
    });
}

function regenerateCharacterImage() {
  const characterId = document.getElementById('character_id').value;
  const characterPrompt = characterId.replace(/-/g, ' '); // Convert character_id back to a prompt

  fetch('/generate_character_image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `character_id=${characterId}&prompt=${characterPrompt}`,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === 'success') {
        // Refresh the image
        const characterImageElement = document.getElementById('characterImage');
        characterImageElement.src = `/character_images/${characterId}.png?${new Date().getTime()}`; // Cache busting
      } else {
        alert('Failed to regenerate the image.');
      }
    });
}

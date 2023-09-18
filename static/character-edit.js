let characterComponent = null;
// Call the function initially to fetch and populate the character data
fetchDatabaseData()
  .then((data) => {
    setCurrentCharacter(data.current_character);
    loadCharacterData(data.current_character, data);
  })
  .catch((error) => {
    console.error('Error:', error);
  });

function setCurrentCharacter(characterId) {
  characterComponent = document.querySelector('character-component');
  characterComponent.setCurrentCharacter(characterId);
}

function handleSubmit(event, message) {
  event.preventDefault(); // Prevent the default form submission behavior
  submitFormData(event, message);
}

function handleUpdateCharacterSubmit(event, message) {
  event.preventDefault();
  characterIdInputElem = document.createElement('input');
  characterIdInputElem.type = 'hidden';
  characterIdInputElem.name = 'character_id';
  characterIdInputElem.value = event.target
    .querySelector('character-component')
    .getCurrentCharacter();
  event.target.appendChild(characterIdInputElem);

  submitFormData(event, message);
}

function submitFormData(event, message) {
  showLoader();
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
      hideLoader();
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

document
  .getElementById('characterForm')
  .addEventListener('submit', function (event) {
    // Sanitize the character_id input value
    const characterIdInput = document.getElementById('new_character_id');
    characterIdInput.value = sanitizeCharacterId(characterIdInput.value);

    // The form will continue with its default submission behavior
  });

// add an event listener for when the character dropdown changes
// so it can load the data of the newly selected character
document
  .querySelector('character-component')
  .addEventListener('character-change', function (event) {
    const characterId = event.detail.characterId;
    loadCharacterData(characterId, characterDataGlobal, true);
  });


// Function to populate the current character dropdown
function populateCurrentCharacterDropdown() {
  const dropdown = document.getElementById('current_character');
  for (let characterId in characterDataGlobal.characters) {
    const option = document.createElement('option');
    option.value = characterId;
    option.textContent = characterId.replace(/-/g, ' ');
    dropdown.appendChild(option);
  }
}

// Function to save the selected character as the default
function setDefaultCharacter() {
  const characterId = characterComponent.getCurrentCharacter();
  showLoader();
  // Make an HTTP POST request to save the selected character as default
  fetch('/save-current-character', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ current_character: characterId }),
  })
    .then((response) => response.json())
    .then((data) => {
      hideLoader();
      if (data.success) {
        alert('Character set as default successfully!');
      } else {
        alert('Error setting character as default.');
      }
    });
}

function confirmDeleteCharacter() {
  const characterId = characterComponent.getCurrentCharacter();
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
  showLoader();
  fetch('/delete-character', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ character_id: characterId }),
  })
    .then((response) => response.json())
    .then((data) => {
      hideLoader();
      if (data.success) {
        // Reload the page to refresh the character list
        location.reload();
      } else {
        alert('Error deleting character. Please try again.');
      }
    });
}

function startConversation() {
  const characterId = characterComponent.getCurrentCharacter();
  fetch('/start-conversation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ character_id: characterId }),
  })
    .then((response) => response.json())
    .then(updateUI);
}

function initiateStartRecording() {
  const characterId = characterComponent.getCurrentCharacter();
  // enable the Stop Recording button and disable the Start Recording button
  document.getElementById('startRecordingButton').disabled = true;
  document.getElementById('stopRecordingButton').disabled = false;
  startRecording(characterId);
}

function initiateStopRecording() {
  // enable the Start Recording button and disable the Stop Recording button
  document.getElementById('startRecordingButton').disabled = false;
  document.getElementById('stopRecordingButton').disabled = true;
  stopRecording();
}

function regenerateCharacterImage() {
  const characterId = document.getElementById('mainCharacterComponent').getCurrentCharacter();
  const characterPrompt = characterId.replace(/-/g, ' '); // Convert character_id back to a prompt

  showLoader();
  fetch('/generate_character_image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `character_id=${characterId}&prompt=${characterPrompt}`,
  })
    .then((response) => response.json())
    .then((data) => {
      hideLoader();
      if (data.status === 'success') {
        // call into character-component.js to set the image
        characterComponent.setCharacterImage(characterId, true);
      } else {
        alert('Failed to regenerate the image.');
      }
    });
}

function indexUpdateUI(viewState) {
  if (viewState.status) {
    console.log('status:', viewState.status);
    document.getElementById('serverStatus').innerText = viewState.status.status_string;

    characterComponent.render(viewState);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const originalUpdateUI = updateUI;

  updateUI = function (viewState) {
    originalUpdateUI(viewState); // Call the base function
    indexUpdateUI(viewState); // Call the specific function for this page
  };
});

let characterDataGlobal = {}; // This will store the fetched character data

// Function to load character data from the Flask API
function fetchCharacterData() {
  fetch('/get-character-data')
    .then((response) => response.json())
    .then((data) => {
      characterDataGlobal = data;  // Store the fetched data in the global variable
      populateCharacterDropdown();
      loadCharacterData();
    });
}

function populateCharacterDropdown() {
  const dropdown = document.getElementById('character_id');
  dropdown.innerHTML = ''; // Clear existing options
  for (let characterId in characterDataGlobal) {
    const option = document.createElement('option');
    option.value = characterId;
    option.textContent = characterId.replace(/-/g, ' '); // Convert "cat-cartman" to "cat cartman"
    dropdown.appendChild(option);
  }
}

function loadCharacterData() {
  const characterId = document.getElementById('character_id').value;
  const characterData = characterDataGlobal[characterId]; // Directly access the characterId
  if (characterData) {
    document.getElementById('voice_id').value = characterData.voice_id;
    document.getElementById('prompt').value = characterData.prompt;
  } else {
    console.warn(`Character data for '${characterId}' not found.`);
  }
}

// Call the function initially to fetch and populate the character data
fetchCharacterData();

// Attach the onchange event after data has been loaded
document.getElementById('character_id').addEventListener('change', function () {
  loadCharacterData();
});

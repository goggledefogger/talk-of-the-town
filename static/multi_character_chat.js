function multiCharacterUpdateUI(viewState) {
  // Add any unique behavior for this page
  console.log('Additional behavior for multi_character_chat.html');
  // ...
}

document.addEventListener('DOMContentLoaded', function () {
  const originalUpdateUI = updateUI;

  updateUI = function (viewState) {
    originalUpdateUI(viewState); // Call the base function
    multiCharacterUpdateUI(viewState); // Call the specific function for this page
  };

  fetchDatabaseData()
    .then((data) => {
      populateCharacterDropdown('#character1', data.characters);
      populateCharacterDropdown('#character2', data.characters);
    })
    .catch((error) => {
      console.error('Error in multi_character_chat.js:', error);
    });
});

function startConversation() {
  const character1Id = document.getElementById('character1').value;
  const character2Id = document.getElementById('character2').value;
  const initialMessage = document.getElementById('initialMessage').value;

  fetch('/start-multi-character-conversation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      character1_id: character1Id,
      character2_id: character2Id,
      initial_message: initialMessage
    }),
  })
    .then((response) => response.json())
    .then(updateUI);
}

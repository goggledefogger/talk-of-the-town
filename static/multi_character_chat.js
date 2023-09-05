function updateUI(viewState) {
  // Check the conversation state and update the UI accordingly
  if (viewState.conversation_state === 'started') {
    console.log('conversation state:', viewState.conversation_state);
    // Update UI elements specific to multi_character_chat.html
    // For example:
    // document.getElementById('startChatBtn').disabled = true;
    // document.getElementById('stopChatBtn').disabled = false;
  } else if (viewState.conversation_state === 'stopped') {
    console.log('conversation state:', viewState.conversation_state);
    // Update UI elements specific to multi_character_chat.html
    // For example:
    // document.getElementById('startChatBtn').disabled = false;
    // document.getElementById('stopChatBtn').disabled = true;
  }

  // Handle other UI updates based on viewState
  // ...
}

document.addEventListener('DOMContentLoaded', function () {
  fetchDatabaseData()
    .then((characters) => {
      populateCharacterDropdown('#someOtherDropdownId', characters);
      // ... other code ...
    })
    .catch((error) => {
      console.error('Error in multi_character_chat.js:', error);
    });
});

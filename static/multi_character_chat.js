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
});

function selectRandomCharacters(selector1, selector2) {
  const dropdown1 = document.querySelector(selector1);
  const dropdown2 = document.querySelector(selector2);
  if (!dropdown1 || !dropdown2) {
    console.error(`Element not found for selector: ${selector1} or ${selector2}`);
    return;
  }
  const characterIds = Object.keys(characterDataGlobal.characters);
  // select two random characters and make sure they aren't the same
  let randomIndex1 = Math.floor(Math.random() * characterIds.length);
  let randomIndex2 = Math.floor(Math.random() * characterIds.length);
  while (randomIndex1 === randomIndex2) {
    randomIndex2 = Math.floor(Math.random() * characterIds.length);
  }
  dropdown1.value = characterIds[randomIndex1];
  dropdown2.value = characterIds[randomIndex2];
}

function startConversation() {
  // loop through all the character-component elements and get the selected character
  const characterComponents = document.querySelectorAll('character-component');
  const character1Id = characterComponents[0].shadow.getElementById('characterDropdown').value;
  const character2Id = characterComponents[1].shadow.getElementById('characterDropdown').value;

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

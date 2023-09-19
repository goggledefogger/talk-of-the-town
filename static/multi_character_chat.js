serverRequestsQueue = [];

function multiCharacterUpdateUI(viewState) {
  if (viewState.status) {
    // if the viewState.status.character_id exists, pull out the character_id
    // and use it to find the appropriate character-component element
    // and start the appropriate animation
    if (viewState.status.character_id) {
      console.log('character: ', viewState.status.character_id);
      const characterId = viewState.status.character_id;
      const characterComponent = document.querySelector(
        '[data-character-id="' + characterId + '"]'
      );
      if (characterComponent) {
        characterComponent.render(viewState);
      }
    }

    if (viewState.status.status_string === 'speaking') {
      continueConversation();
    }
  }
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
    console.error(
      `Element not found for selector: ${selector1} or ${selector2}`
    );
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
  conversationState = 'started';
  // loop through all the character-component elements and get the selected character
  const characterComponents = document.querySelectorAll('character-component');
  const character1Id = characterComponents[0].getCurrentCharacter();
  const character2Id = characterComponents[1].getCurrentCharacter();

  const initialMessage = document.getElementById('initialMessage').value;

  fetch('/start-multi-character-conversation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      character1_id: character1Id,
      character2_id: character2Id,
      initial_message: initialMessage,
    }),
  })
    .then((response) => response.json())
    .then(updateUI);
}

function continueConversation() {
  console.log('continuing conversation, requesting from server')
  serverRequestsQueue.push(doContinueConversation)
  if (serverRequestsQueue.length === 1) {
    doContinueConversation();
  }
}

function doContinueConversation() {
  fetch('/continue-multi-character-conversation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((responseObj) => {
      // once this request is done, remove it from the queue
      // and if there is another request in the queue, and
      // the conversation is still going, start the next request
      serverRequestsQueue.shift();
      if (serverRequestsQueue.length > 0 && conversationState === 'started') {
        serverRequestsQueue[0]();
      }
      return Promise.resolve(responseObj);
    })
    .then(updateUI);
}

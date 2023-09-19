// Connect to the Flask-SocketIO server
const host = window.location.hostname;
const socket = io.connect('http://' + host + ':5002');
let serverStatus = null;
let conversationState = null;

// Listen for the 'status_update' event
socket.on('status_update', function (data) {
  console.log('Received status update:', data.status);
  updateUI(data);
});

// Listen for the 'conversation_status_update' event
socket.on('conversation_update', function (data) {
  console.log('Received conversation update:', data.conversation_state);
  updateUI(data);
});

socket.on('connect_error', function (error) {
  console.error('Connection Error:', error);
  updateUI({ status: 'server_error' });
});

socket.on('connect_timeout', function () {
  console.error('Connection Timeout');
  updateUI({ status: 'server_timeout' });
});

socket.on('reconnect_error', function (error) {
  console.error('Reconnection Error:', error);
  updateUI({ status: 'server_error' });
});

socket.on('reconnect_failed', function () {
  console.error('Reconnection Failed');
  updateUI({ status: 'server_error' });
});

let characterDataGlobal = {}; // This will store the fetched character data

// Function to load character data from the Flask API
function fetchDatabaseData() {
  return fetch('/get-data')
    .then((response) => response.json())
    .then((data) => {
      characterDataGlobal = data;
      return data;
    })
    .catch((error) => {
      console.error('Error fetching characters:', error);
      throw error;
    });
}

function loadCharacterData(characterId, characterData, userAction = false) {
  const characterDetails = characterData.characters[characterId];

  if (characterDetails) {
    if (characterDetails.voice_id) {
      document.getElementById('voice_id').value = characterDetails.voice_id;
    }
    if (characterDetails.prompt) {
      document.getElementById('prompt').value = characterDetails.prompt;
    }
  } else {
    console.warn(`Character data for '${characterId}' not found.`);
  }

  // If this function was triggered by a user action, enable the button
  if (userAction) {
    document.getElementById('configSubmit').disabled = false;
  } else {
    document.getElementById('configSubmit').disabled = true;
  }
}

function sanitizeCharacterId(characterId) {
  // Convert spaces to hyphens
  let sanitized = characterId.replace(/\s+/g, '-');

  // Remove non-alphanumeric and non-hyphen characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9-]/g, '');

  return sanitized.toLowerCase(); // Convert to lowercase for consistency
}

function showLoader() {
  document.getElementById('loader').style.display = 'block';
  document.getElementById('dimmedBackground').style.display = 'block';
}

function hideLoader() {
  document.getElementById('loader').style.display = 'none';
  document.getElementById('dimmedBackground').style.display = 'none';
}

function updateConversationButtonState(isStarted) {
  const stopButton = document.getElementById('stopConversationButton');
  if (stopButton) {
    stopButton.disabled = !isStarted;
  }
}

function stopConversation() {
  conversationState = 'stopped';
  fetch('/stop-conversation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.conversation_state === 'stopped') {
        console.log('Conversation stopped.');
        updateConversationButtonState(false);
      } else {
        console.error('Error stopping the conversation.');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

function baseUpdateUI(viewState) {
  const startButton = document.querySelector('.start-conversation-button');
  const stopButton = document.getElementById('stopConversationButton');

  if (viewState.conversation_state === 'started') {
    if (startButton) startButton.disabled = true;
    if (stopButton) stopButton.disabled = false;
  } else if (viewState.conversation_state === 'stopped') {
    if (startButton) startButton.disabled = false;
    if (stopButton) stopButton.disabled = true;
  }
}

function updateUI(viewState) {
  baseUpdateUI(viewState);
  // This can be overridden in specific page JS files
}

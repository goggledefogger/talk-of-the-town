let mediaRecorder;
let audioChunks = [];
let recordingStatus = null;
let recorderReady = false;
let lastRecordedBlob = null;

function setupRecorder() {
  recordingStatus = 'ready';
  recorderReady = true;
  return navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        recordingStatus = 'recording';
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        recordingStatus = 'stopping';
        lastRecordedBlob = new Blob(audioChunks, { type: 'audio/wav' });
        document.dispatchEvent(new Event('recording-stopped'));
      };
    })
    .then(() => {
      console.log('Recorder ready!');
      return Promise.resolve();
    });
}

function startRecording() {
  // create a promise that either will be resolved when the recorder is ready
  // or if it's already ready, it continues on
  const recorderReadyPromise = recorderReady
    ? Promise.resolve()
    : setupRecorder();
  // now start the promise chain
  recorderReadyPromise.then(() => {
    audioChunks = [];
    mediaRecorder.start();
  });
}

function stopRecording() {
  console.log('stopping recording');
  // add an additional event handler for when the recording is stopped
  mediaRecorder.stop();
}

document.addEventListener('recording-stopped', () => {
  console.log('recording-stopped event fired');
  const characterId = characterComponent.getCurrentCharacter();
  return sendDataToServer(characterId, lastRecordedBlob).then(
    playAudioFromServer
  ).then(() => {
    console.log('done playing audio done')
    updateUI({
      status: {
        status_string: 'done_speaking',
        character_id: characterId
      }
    });
  });
});

function sendDataToServer(characterId, audioBlob) {
  recordingStatus = 'sending';
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.wav');
  formData.append('character_id', characterId);

  return fetch('/process_audio', {
    method: 'POST',
    body: formData,
  }).then((response) => {
    recordingStatus = 'sent';
    return response.blob();
  });
}

function playAudioFromServer(audioBlob) {
  recordingStatus = 'playing';
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
  // create a promise that will be resolved when the audio is done playing
  return new Promise((resolve) => {
    audio.onended = () => {
      console.log('audio ended');
      resolve();
    };
  });

}

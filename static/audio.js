let mediaRecorder;
let audioChunks = [];
let recordingStatus = null;
let recorderReady = false;

function setupRecorder(characterId) {
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
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        try {
          return sendDataToServer(characterId, audioBlob);
        } catch (error) {
          recordingStatus = 'error';
          return Promise.reject(error);
        }
      };
    })
    .then(() => {
      console.log('Recorder ready!');
      return Promise.resolve();
    });
}

function startRecording(characterId) {
  // create a promise that either will be resolved when the recorder is ready
  // or if it's already ready, it continues on
  const recorderReadyPromise = recorderReady
    ? Promise.resolve()
    : setupRecorder(characterId);
  // now start the promise chain
  recorderReadyPromise.then(() => {
    audioChunks = [];
    mediaRecorder.start();
  });
}

function stopRecording() {
  mediaRecorder.stop();
}

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
    return response.blob().then(playAudioFromServer);
  });
}

function playAudioFromServer(audioBlob) {
  recordingStatus = 'playing';
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
  return Promise.resolve();
}

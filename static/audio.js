let mediaRecorder;
let audioChunks = [];
let recorderReady = false;

function setupRecorder() {
  recorderReady = true;
  return navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        try {
          return sendDataToServer(audioBlob);
        } catch (error) {
          return Promise.reject(error);
        }
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
  mediaRecorder.stop();
}

function sendDataToServer(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.wav');

  return fetch('/process_audio', {
    method: 'POST',
    body: formData,
  }).then((response) => {
    return response.blob().then(playAudioFromServer);
  });
}

function playAudioFromServer(audioBlob) {
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
  return Promise.resolve();
}

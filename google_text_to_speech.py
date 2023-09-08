import os
import random
import logging
from dotenv import load_dotenv

load_dotenv('config.env')

from google.cloud import texttospeech

character_voices = {}
available_voices = []
client = None

def google_text_to_speech(text, character_id):
    global client, available_voices, character_voices

    # Set the path to the service account key
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("GOOGLE_CLOUD_TTS_KEY_PATH")

    # Initialize the client
    if not client:
        client = texttospeech.TextToSpeechClient()
    if not available_voices:
        # Get a list of the available voices
        available_voices = client.list_voices(language_code="en-US").voices

    # Set the text input to be synthesized
    synthesis_input = texttospeech.SynthesisInput(text=text)

    # if the character_id isn't in the character_voices dictionary, add it
    if character_id not in character_voices:
        # Get a list of the available voice names
        voice_names = [voice.name for voice in available_voices]

        # Select a random voice name
        voice_name = random.choice(voice_names)
        logging.info(f"Selected voice name: {voice_name}")

        # Add the character_id and voice_name to the character_voices dictionary
        character_voices[character_id] = voice_name
    else:
        # Get the voice name from the character_voices dictionary
        voice_name = character_voices[character_id]

    # Build the voice request
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name=voice_name,
        # ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
    )

    # Select the type of audio file you want
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    # Perform the text-to-speech request
    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )

    # Save the audio to a file
    with open("output.mp3", "wb") as out:
        out.write(response.audio_content)


import requests
import os
import random
from dotenv import load_dotenv

load_dotenv('config.env')

base_url = "https://api.elevenlabs.io/v1/"
api_key = os.getenv('ELEVEN_LABS_KEY')

def get_random_voice_id():
    url = base_url + "voices"

    headers = {
        "Accept": "application/json",
        "xi-api-key": api_key
    }

    response = requests.get(url, headers=headers)

    data = response.json()
    # find the size of the 'voices' array and choose a random index
    random_index = random.randint(0, len(data['voices']) - 1)

    # return the voice_id at the random index
    return data['voices'][random_index]['voice_id']

def get_speech_audio(text, voice_id):
    url = base_url + f'text-to-speech/{voice_id}'
    headers = {
        'Accept': 'audio/mpeg',
        'xi-api-key': api_key,
        'Content-Type': 'application/json'
    }
    data = {
        'text': text,
        'model_id': 'eleven_monolingual_v1',
        'voice_settings': {
            'stability': 0.6,
            'similarity_boost': 0.85
        }
    }
    return requests.post(url, headers=headers, json=data)

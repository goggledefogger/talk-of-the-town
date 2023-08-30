import sounddevice as sd
import soundfile as sf
import numpy as np
import openai
import os
import requests
import re
from colorama import Fore, Style, init
import datetime
import base64
from pydub import AudioSegment
from pydub.playback import play
from pydub.playback import _play_with_simpleaudio
import time

init()

def open_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as infile:
        return infile.read()

api_key = open_file('openaiapikey2.key')
elapikey = open_file('elabapikey.key')

conversation1 = []  
chatbot1 = open_file('chatbot1.txt')

def chatgpt(api_key, conversation, chatbot, user_input, temperature=0.9, frequency_penalty=0.2, presence_penalty=0):
    openai.api_key = api_key
    conversation.append({"role": "user","content": user_input})
    messages_input = conversation.copy()
    prompt = [{"role": "system", "content": chatbot}]
    messages_input.insert(0, prompt[0])
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-0613",
        temperature=temperature,
        frequency_penalty=frequency_penalty,
        presence_penalty=presence_penalty,
        messages=messages_input)
    chat_response = completion['choices'][0]['message']['content']
    conversation.append({"role": "assistant", "content": chat_response})
    return chat_response


def play_waiting_music():
    audio = AudioSegment.from_file('waiting.wav')
    return _play_with_simpleaudio(audio)


def text_to_speech(text, voice_id, api_key, playback):
    url = f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}'
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
    response = requests.post(url, headers=headers, json=data)
    try:
        playback.stop()
    except:
        print('error stopping playback')
    if response.status_code == 200:
        with open('output.mp3', 'wb') as f:
            f.write(response.content)
        audio = AudioSegment.from_mp3('output.mp3')
        play(audio)
    else:
        print('Error:', response.text)

def print_colored(agent, text):
    agent_colors = {
        "ChatBot:": Fore.YELLOW,
    }
    color = agent_colors.get(agent, "")
    print(color + f"{agent}: {text}" + Style.RESET_ALL, end="")

voice_id1 = '2EiwWnXFnvU5JabPnv8n'
# voice_id1 = 'zl5ZqIU7ndzp8UL8KuqY'

def record_and_transcribe(playback, duration=8, fs=44100):
    print('Recording...')
    myrecording = sd.rec(int(duration * fs), samplerate=fs, channels=2)
    sd.wait()
    print('Recording complete.')
    playback = play_waiting_music()
    filename = 'myrecording.wav'
    sf.write(filename, myrecording, fs)
    with open(filename, "rb") as file:
        openai.api_key = api_key
        result = openai.Audio.transcribe("whisper-1", file)
    transcription = result['text']
    return transcription, playback

while True:
    playback = None
    user_message, playback = record_and_transcribe(playback)
    response = chatgpt(api_key, conversation1, chatbot1, user_message)
    print_colored("ChatBot:", f"{response}\n\n")
    user_message_without_generate_image = re.sub(r'(Response:|Narration:|Image: generate_image:.*|)', '', response).strip()
    text_to_speech(user_message_without_generate_image, voice_id1, elapikey, playback)

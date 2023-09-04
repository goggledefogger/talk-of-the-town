import sounddevice as sd
import soundfile as sf
import openai
import os
from dotenv import load_dotenv
import re
import logging
from colorama import Fore, Style, init
from pydub import AudioSegment
from pydub.playback import play
from pydub.playback import _play_with_simpleaudio
import time

from database import get_current_character_data, get_system_prompt
from audio_device import get_default_audio_input_device, get_device_metadata
from eleven_labs import get_speech_audio
from socket_controller import socketio, emit_status, emit_conversation_state

logging.basicConfig(level=logging.INFO)

conversation_state = 'init'

init()

def set_status(new_status):
    global status
    status = new_status
    logging.info('status: ' + status)
    emit_status(new_status)

set_status('not_started')

def get_status():
    global status
    return status

def is_conversation_active():
    global conversation_state
    emit_conversation_state(conversation_state)
    return conversation_state == 'started'

def set_conversation_state(state):
    global conversation_state
    conversation_state = state
    logging.info('conversation state: ' + str(conversation_state))
    emit_conversation_state(conversation_state)

def open_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as infile:
        return infile.read()

load_dotenv('config.env')

api_key = os.getenv('OPENAI_API_KEY')

# throw an exception if the API key is not set
if not api_key:
    raise Exception("Please set your OPENAI_API_KEY environment variable.")

conversation1 = []

device_name = get_default_audio_input_device()
device_metadata = get_device_metadata(device_name)

num_channels = device_metadata['channels']
sample_rate = int(device_metadata['sample_rate'])


def chatgpt(api_key, conversation, character_data, user_input, temperature=0.9, frequency_penalty=0.2, presence_penalty=0):
    set_status('generating_response')
    openai.api_key = api_key
    conversation.append({"role": "user","content": user_input})
    messages_input = conversation.copy()
    prompt = [{"role": "system", "content": get_system_prompt() + character_data['prompt']}]
    messages_input.insert(0, prompt[0])
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-0613",
        temperature=temperature,
        frequency_penalty=frequency_penalty,
        presence_penalty=presence_penalty,
        messages=messages_input)
    chat_response = completion['choices'][0]['message']['content']
    conversation.append({"role": "assistant", "content": chat_response})
    set_status('finished_generating_response')
    return chat_response


def play_waiting_music():
    audio = AudioSegment.from_file('waiting.wav')
    return _play_with_simpleaudio(audio)


def text_to_speech(text, voice_id, playback):
    set_status('synthesizing_voice')
    response = get_speech_audio(text, voice_id)
    try:
        playback.stop()
    except:
        logging.error('error stopping playback')
    set_status('speaking')
    if response.status_code == 200:
        with open('output.mp3', 'wb') as f:
            f.write(response.content)
        audio = AudioSegment.from_mp3('output.mp3')
        play(audio)
        set_status('done_speaking')
    else:
        logging.error('Error:', response.text)
        set_status('error_text_to_speech')


def print_colored(agent, text):
    agent_colors = {
        "ChatBot:": Fore.YELLOW,
    }
    color = agent_colors.get(agent, "")
    print(color + f"{agent}: {text}" + Style.RESET_ALL, end="")

def record_and_transcribe(playback, duration=8, fs=sample_rate):
    set_status("recording")
    logging.info('Recording...')
    myrecording = sd.rec(int(duration * fs), samplerate=fs, channels=num_channels)
    # previously used sd.wait() but that had a threading problem
    # with the socketio emit so now we're doing it this way
    time.sleep(duration)
    sd.stop()

    set_status("transcribing")
    logging.info('Recording complete.')
    playback = play_waiting_music()
    filename = 'myrecording.wav'
    sf.write(filename, myrecording, fs)
    with open(filename, "rb") as file:
        openai.api_key = api_key
        result = openai.Audio.transcribe("whisper-1", file)
    transcription = result['text']
    return transcription, playback

def start_talking(character_id=None):
    character_data = get_current_character_data(character_id)
    # logging.info('character data: ' + str(character_data))

    while is_conversation_active():
        playback = None
        # q = Queue()
        # p = Process(target=record_and_transcribe, args=(q, playback))
        # p.start()
        # p.join()
        # user_message, playback = q.get()
        user_message, playback = record_and_transcribe(playback)
        response = chatgpt(api_key, conversation1, character_data, user_message)
        print_colored("ChatBot:", f"{response}\n\n")
        user_message_without_generate_image = re.sub(r'(Response:|Narration:|Image: generate_image:.*|)', '', response).strip()
        text_to_speech(user_message_without_generate_image, character_data['voice_id'], playback)
        if not is_conversation_active():
            break

if __name__ == "__main__":
    start_talking()

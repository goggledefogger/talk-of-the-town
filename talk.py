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
import subprocess
import random

from database import get_current_character_data, get_system_prompt, reset_system_prompt
from audio_device import get_default_audio_input_device, get_device_metadata
from eleven_labs import get_speech_audio
from socket_controller import socketio, emit_status, emit_conversation_state
from google_text_to_speech import google_text_to_speech

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

conversation = []
last_character_id = None

device_name = get_default_audio_input_device()
device_metadata = get_device_metadata(device_name)

num_channels = device_metadata['channels']
sample_rate = int(device_metadata['sample_rate'])

def reset_conversation():
    global conversation
    conversation = []
    logging.info('conversation reset')


def chatgpt(api_key, conversation, character_id, character_data, user_input, multi_character=False, initial_message="", temperature=0.9, frequency_penalty=0.2, presence_penalty=0):
    set_status('generating_response')
    openai.api_key = api_key
    conversation.append({"role": "user","content": user_input})
    messages_input = conversation.copy()
    # if it's not multi_character, get the system prompt and append the character's prompt
    if not multi_character:
        prompt = [{"role": "system", "content": get_system_prompt() + character_data['prompt']}]
    else:
        # if it's multi_character, get the system prompt and append the initial message and the character's prompt
        system_content = get_system_prompt(multi_character) + initial_message
        system_content = system_content + '\n\n' + '. The character speaking now is: ' + character_data['prompt']
        prompt = [{"role": "system", "content": system_content}]

    # prompt = [{"role": "system", "content": get_system_prompt(multi_character) + character_data['prompt']}]

    messages_input.insert(0, prompt[0])
    logging.info("prompt: " + str(prompt))
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-0613",
        temperature=temperature,
        frequency_penalty=frequency_penalty,
        presence_penalty=presence_penalty,
        messages=messages_input)
    chat_response = completion['choices'][0]['message']['content']
    conversation.append({"role": "assistant", "content": chat_response})
    set_status('finished_generating_response')

    print_colored(f"{character_id}:", f"{chat_response}\n\n")

    return chat_response


def play_waiting_music():
    audio = AudioSegment.from_file('waiting.wav')
    return _play_with_simpleaudio(audio)


def text_to_speech(text, voice_id, playback=None):
    set_status('synthesizing_voice')
    response = get_speech_audio(text, voice_id)
    if playback is not None:
        try:
            playback.stop()
        except:
            logging.error('error stopping playback')
    set_status('speaking')
    if response.status_code == 200:
        play_audio_file('output.mp3')
        set_status('done_speaking')
    else:
        logging.error('Error:', response.text)
        set_status('error_text_to_speech')
        logging.info('continuing on to use google cloud as a fallback')
        try:
            google_text_to_speech(text)
            play_audio_file('output.mp3')
        except:
            logging.error('error using google cloud')
            logging.info('continuing on to use espeak as a fallback')
            # since the eleven labs response had an error,
            # we'll just play the text-to-speech using espeak
            subprocess.run(["espeak", text])
        set_status('done_speaking')

def play_audio_file(filepath):
    audio = AudioSegment.from_mp3('output.mp3')
    play(audio)

character_colors = {}

def print_colored(character_id, text):
    # if the character_id isn't yet in the character_colors dictionary,
    # add it with a randomly generated color
    if character_id not in character_colors:
        # generate a random color
        color = random.choice([Fore.RED, Fore.GREEN, Fore.YELLOW, Fore.BLUE, Fore.MAGENTA, Fore.CYAN])
        # add the character_id and color to the dictionary
        character_colors[character_id] = color
    else:
        color = character_colors.get(character_id)

    print(color + f"{character_id}: {text}" + Style.RESET_ALL, end="")

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
    global last_character_id

     # Check if the character has been switched
    if last_character_id is not None and last_character_id != character_id:
        reset_conversation()

    # Update the last_character_id
    last_character_id = character_id

    character_data = get_current_character_data(character_id)
    # logging.info('character data: ' + str(character_data))

    while is_conversation_active():
        playback = None
        user_message, playback = record_and_transcribe(playback)
        response = chatgpt(api_key, conversation, character_id, character_data, user_message)
        print_colored("ChatBot:", f"{response}\n\n")
        user_message_without_generate_image = re.sub(r'(Response:|Narration:|Image: generate_image:.*|)', '', response).strip()
        text_to_speech(user_message_without_generate_image, character_data['voice_id'], playback)

def strip_character_prefix(message):
    """Remove character prefix from the message."""
    return re.sub(r'^Character\w+:\s', '', message)


def start_multi_character_talking(character1_id, character2_id, initial_message="hello"):
    character1_data = get_current_character_data(character1_id)
    character2_data = get_current_character_data(character2_id)

    reset_conversation()
    reset_system_prompt()

    character_a_response = ""
    character_b_response = ""

    while is_conversation_active():
        character_a_response = chatgpt(api_key, conversation, character1_id,
                                character1_data, f"CharacterB: {character_b_response}",
                                multi_character=True, initial_message=initial_message)
        text_to_speech(strip_character_prefix(character_a_response), character1_data['voice_id'])
        conversation.append({"role": "user", "content": f"CharacterA: {character_a_response}"})

        # Check if conversation is still active before Character 2 speaks
        if not is_conversation_active():
            break

        # Character 2 responds to the message from Character 1
        character_b_response = chatgpt(api_key, conversation, character2_id,
                                character2_data, f"CharacterA: {character_a_response}",
                                multi_character=True, initial_message=initial_message)
        text_to_speech(strip_character_prefix(character_b_response), character2_data['voice_id'])
        conversation.append({"role": "assistant", "content": f"CharacterB: {character_b_response}"})


if __name__ == "__main__":
    start_talking()

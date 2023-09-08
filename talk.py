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

from database import get_current_character_data, get_system_prompt, reset_system_prompt, get_multi_character_settings
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
temperature=0.9
frequency_penalty=0.2
presence_penalty=0

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

def construct_multi_character_system_prompt(characters, initial_message):
    multi_character_settings = get_multi_character_settings()
    final_system_prompt = multi_character_settings['system_prompt']
    # logging.info('original system prompt: ' + final_system_prompt)

    # add the user's initial message to the system prompt
    # final_system_prompt = final_system_prompt + '\n\n' + 'Setting:'
    # final_system_prompt = final_system_prompt + '\n\n' + initial_message

    # final_system_prompt = final_system_prompt + '\n\n' + 'Ensure that characters respond to the most recent statement or question directed at them.'

    final_system_prompt = final_system_prompt + '\n\n' + '[USER-SET INSTRUCTIONS]'
    # if there is a setting for response_sentence_limit int, load it
    response_sentence_limit = 5 # Default to 5 so we at least have a limit by default
    if multi_character_settings['response_sentence_limit']:
        response_sentence_limit = multi_character_settings['response_sentence_limit']
    final_system_prompt = final_system_prompt + '\n\n- Maximum Response Sentence Limit: ' + str(response_sentence_limit)
    final_system_prompt = final_system_prompt + '. Do not artificially extend the dialogue to meet this limit.'

    final_system_prompt = final_system_prompt + '\n\n' + '- Language Style: Casual language is permitted. '
    # if the setting for 'explicit' is set to true, add a string to the system prompt
    if multi_character_settings['explicit'] and multi_character_settings['explicit']=='true':
        final_system_prompt = final_system_prompt + 'Include swear words.'
    else:
        final_system_prompt = final_system_prompt + 'Exclude swear words.'

    # if the setting for 'stage_directions' is set to true, add a string to the system prompt
    if multi_character_settings['stage_directions'] and multi_character_settings['stage_directions']=='true':
        final_system_prompt = final_system_prompt + '\n\n -Stage Directions: Include minimal stage directions for added comedy, action, drama, or plot progression.'

    final_system_prompt = final_system_prompt + '\n\nList of the universe of characters by character id, with the format:\n\n[CHARACTER_ID]:[CHARACTER_PROMPT]\n\n*** START OF FULL CHARACTER LIST ***'
    # loop through characters and add them to the system prompt
    for character_id in characters:
        # logging.info('character id: ' + character_id)
        character_data = characters[character_id]
        # logging.info('character data: ' + str(character_data))
        final_system_prompt = final_system_prompt + '\n\n[' + character_id + ']: ' + '[' + character_data['prompt'] + ']'

    final_system_prompt = final_system_prompt + '\n\n*** END OF FULL CHARACTER LIST ***'

    final_system_prompt = final_system_prompt + '\n\nREMEMBER: this response should only include one character\'s dialog.'

    # logging.info('final multicharacter system prompt: ' + final_system_prompt)
    return final_system_prompt

def chatgpt(api_key, conversation, character_id, character_data, user_input):
    set_status('generating_response')
    openai.api_key = api_key
    conversation.append({"role": "user","content": user_input})

    messages_input = conversation.copy()
    prompt = [{"role": "system", "content": get_system_prompt() + character_data['prompt']}]

    messages_input.insert(0, prompt[0])
    # logging.info("prompt: " + str(prompt))
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


def chatgpt_multi_character_initial_prompt(initial_user_message):
    initial_prompt = get_multi_character_settings()['initial_prompt']
    initial_prompt = initial_prompt + initial_user_message
    return initial_prompt


def chatgpt_multi_character(api_key, conversation, multi_character_system_prompt, last_character_output):
    set_status('generating_multicharacter_response')
    openai.api_key = api_key

    conversation.append({"role": "user", "content": last_character_output})
    messages_input = conversation.copy()
    messages_input.insert(0, {"role": "system", "content": multi_character_system_prompt})

    logging.info("messages_input1: " + str(messages_input))
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-0613",
        temperature=temperature,
        frequency_penalty=frequency_penalty,
        presence_penalty=presence_penalty,
        messages=messages_input)
    chat_response = completion['choices'][0]['message']['content']
    # logging.info('chat response: ' + chat_response)
    # conversation.append({"role": "assistant", "content": chat_response})
    set_status('finished_generating_response')

    # from the chat_response, parse out the character id from the beginning of
    # the response string, it always starts in the form of "[character_id]: ..."
    # and we need to escape and use parenthesis properly in the re.search method

    try:
        character_id = re.search(r'\[.*?\]:', chat_response).group(0)
        # specifically trim out the square brackets and colon
        character_id = character_id[1:-2]
        logging.info('character id: ' + character_id)
    except:
        logging.error('error parsing character id from chat response: ' + chat_response)
        logging.error('using the last character id instead: ' + last_character_id)
        character_id = last_character_id

    print_colored(f"{character_id}:", f"{chat_response}\n\n")

    return chat_response, character_id


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
            google_text_to_speech(text, voice_id)
            play_audio_file('output.mp3')
        except Exception as e:
            logging.error('error using google cloud: ' + str(e))
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
        # print_colored("ChatBot:", f"{response}\n\n")
        user_message_without_generate_image = re.sub(r'(Response:|Narration:|Image: generate_image:.*|)', '', response).strip()
        text_to_speech(user_message_without_generate_image, character_data['voice_id'], playback)

def strip_character_prefix(message):
    """Remove character prefix "[character_id]:" from the message."""
    try:
        return re.sub(r'^.+?:\s', '', message)
    except:
        logging.error('error stripping character prefix from message: ' + message)
        return message


def start_multi_character_talking(characters, initial_message="hello"):
    reset_conversation()
    reset_system_prompt()

    multi_character_system_prompt = construct_multi_character_system_prompt(characters, initial_message)
    initial_prompt = chatgpt_multi_character_initial_prompt(initial_message)
    last_character_response = initial_prompt

    while is_conversation_active():
        response, responding_character_id = chatgpt_multi_character(api_key, conversation, multi_character_system_prompt, last_character_response)
        voice_id_to_use = characters[responding_character_id]['voice_id']
        logging.info('using voice id for ' + responding_character_id + ': ' + voice_id_to_use)
        text_to_speech(strip_character_prefix(response), voice_id_to_use)
        last_character_response = response

if __name__ == "__main__":
    start_talking()

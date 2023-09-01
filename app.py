from flask import Flask, request, jsonify, render_template, send_from_directory
from pubsub import pub
import json
import logging
import threading

from database import update_character_data, get_data, update_data, delete_character_data
from talk import start_talking, is_conversation_active, set_conversation_state
from generate_image import generate_image

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

@app.route('/')
@app.route('/index.html')
def index():
    return render_template('index.html')

@app.route('/start-conversation', methods=['POST'])
def start_conversation_endpoint():
    if not is_conversation_active():
        set_conversation_state(True)
        # Start a new thread for the conversation to allow other requests to be processed
        threading.Thread(target=initiate_conversation).start()
        return jsonify({'status': 'started'})
    return jsonify({'status': 'error'})

@app.route('/stop-conversation', methods=['POST'])
def stop_conversation_endpoint():
    set_conversation_state(False)
    return jsonify({'status': 'stopped'})

def initiate_conversation():
    logging.info('Starting conversation...' + str(is_conversation_active()))
    if is_conversation_active():
        start_talking()  # Call the function from talk.py


# get the character data from the database
@app.route('/get-data', methods=['GET'])
def get_data():
    with open('database.json', 'r') as file:
        data = json.load(file)
    return data

@app.route('/add-character', methods=['POST'])
def add_character():
    new_character_id = request.form.get('new_character_id')
    new_voice_id = request.form.get('new_voice_id')
    new_prompt = request.form.get('new_prompt')

    logging.info('adding character id ' + str(new_character_id))

    # Load the existing data from database.json
    with open('database.json', 'r') as file:
        data = json.load(file)

    # Add the new character data
    data['characters'][new_character_id] = {
        "voice_id": new_voice_id,
        "prompt": new_prompt
    }

    # Save the updated data back to database.json
    with open('database.json', 'w') as file:
        json.dump(data, file, indent=4)

    generate_image(new_prompt, f"character_images/{new_character_id}.png")

    return jsonify({"message": "Character added successfully!"}), 200

@app.route('/save-current-character', methods=['POST'])
def save_current_character():
    data = request.json
    current_character = data.get('current_character')

    if current_character:
        saved_data = get_data()
        # logging.info(str(saved_data))

        logging.info(f"Current character: {current_character}")
        # Update the current_character field
        saved_data['current_character'] = current_character

        # use database.py to save the updated data
        update_data(json.dumps(saved_data))

        return jsonify({"success": True, "message": "Character saved successfully!"}), 200
    else:
        return jsonify({"success": False, "message": "Error saving character."}), 400



def handle_character_update(character_data):
    logging.info(f"Updating character: {character_data}")
    character_dict = json.loads(character_data)
    update_character_data(character_dict["character_id"], character_dict)


# Subscribe to the 'character_updated' event
pub.subscribe(handle_character_update, 'character_updated')


@app.route('/update-character', methods=['POST'])
def update_character():
    character_id = request.form.get('character_id')
    voice_id = request.form.get('voice_id')
    prompt = request.form.get('prompt')

    # Convert form data to a dictionary
    data_dict = {
        "character_id": character_id,
        "voice_id": voice_id,
        "prompt": prompt
    }

    # Convert dictionary to JSON string
    data_json = json.dumps(data_dict)
    logging.info(f"New character data: {data_json}")

    pub.sendMessage('character_updated', character_data=data_json)
    return jsonify({"message": "Character updated!"}), 200

@app.route('/delete-character', methods=['POST'])
def delete_character():
    try:
        character_id = request.json.get('character_id')

        deleted = delete_character_data(character_id)
        if not deleted:
            return jsonify({"success": False, "message": "Character not found."}), 400

        return jsonify({"success": True, "message": "Character deleted successfully."}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/character_images/<character_image_url>')
def serve_character_image(character_image_url):
    return send_from_directory('character_images', f"{character_image_url}")


@app.route('/get_character_image/<character_id>', methods=['GET'])
def get_character_image(character_id):
    # Assuming the image filename is the same as character_id or some logic to get the filename
    image_path = f"/character_images/{character_id}.png"
    return jsonify({"image_path": image_path})


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5002, debug=True)

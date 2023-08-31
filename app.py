from flask import Flask, request, jsonify, render_template, redirect, url_for
from pubsub import pub
import json
import logging

from database import update_data

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)


@app.route('/')
@app.route('/index.html')
def index():
    return render_template('index.html')

# get the character data from the database
@app.route('/get-character-data', methods=['GET'])
def get_character_data():
    with open('database.json', 'r') as file:
        data = json.load(file)
    return jsonify(data['characters'])

@app.route('/get-current-character', methods=['GET'])
def get_current_character():
    with open('database.json', 'r') as file:
        data = json.load(file)
    return jsonify({"current_character": data.get('current_character')})


@app.route('/add-character', methods=['POST'])
def add_character():
    new_character_id = request.form.get('new_character_id')
    new_voice_id = request.form.get('new_voice_id')
    new_prompt = request.form.get('new_prompt')

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

    return jsonify({"message": "Character added successfully!"}), 200

@app.route('/save-current-character', methods=['POST'])
def save_current_character():
    data = request.json
    current_character = data.get('current_character')

    if current_character:
        # Load the existing data from database.json
        with open('database.json', 'r') as file:
            saved_data = json.load(file)

        # Update the current_character field
        saved_data['current_character'] = current_character

        # Save the updated data back to database.json
        with open('database.json', 'w') as file:
            json.dump(saved_data, file, indent=2)

        return jsonify({"success": True, "message": "Character saved successfully!"}), 200
    else:
        return jsonify({"success": False, "message": "Error saving character."}), 400



def handle_config_update(config):
    # Update the character service configuration
    logging.info(f"Updating configuration: {config}")
    update_data(config)


# Subscribe to the 'config_updated' event
pub.subscribe(handle_config_update, 'config_updated')


@app.route('/update-config', methods=['POST'])
def update_config():
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
    logging.info(f"New configuration: {data_json}")

    pub.sendMessage('config_updated', config=data_json)
    return jsonify({"message": "Configuration updated!"}), 200


if __name__ == '__main__':
    app.run(port=5002, debug=True)

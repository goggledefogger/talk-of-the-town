from flask import Flask, request, jsonify, render_template
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

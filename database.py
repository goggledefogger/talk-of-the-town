import json
import logging

def update_data(new_data):
    logging.info(f"New configuration: {new_data}")
    new_data_dict = json.loads(new_data)

    # Load the existing data from database.json
    with open('database.json', 'r') as file:
        saved_data = json.load(file)

    # loop through each character and save its data
    for character in new_data_dict['characters']:
        saved_data['characters'][character] = {
            "voice_id": new_data_dict['characters'][character]['voice_id'],
            "prompt": new_data_dict['characters'][character]['prompt']
        }

    # Update the current character
    if new_data_dict['current_character']:
        saved_data['current_character'] = new_data_dict['current_character']

    # Save the updated data back to database.json
    with open('database.json', 'w') as file:
        json.dump(saved_data, file, indent=2)

def update_character_data(character_id, new_data):
    logging.info(f"New configuration: {json.dumps(new_data)}")

    # Load the existing data from database.json
    with open('database.json', 'r') as file:
        saved_data = json.load(file)

    saved_data['characters'][character_id] = {
        "voice_id": new_data['voice_id'],
        "prompt": new_data['prompt']
    }

    # Save the updated data back to database.json
    with open('database.json', 'w') as file:
        json.dump(saved_data, file, indent=2)

def get_current_character_data():
    with open('database.json', 'r') as file:
        data = json.load(file)
        current_character_id = data.get('current_character')
        return data['characters'].get(current_character_id)

def get_data():
    with open('database.json', 'r') as file:
        data = json.load(file)
        return data


def delete_character_data(character_id):
    # Load the existing data from database.json
    with open('database.json', 'r') as file:
        data = json.load(file)

    # Check if character exists
    if character_id not in data['characters']:
        return False

    # Delete the character
    del data['characters'][character_id]

    # Save the updated data back to database.json
    with open('database.json', 'w') as file:
        json.dump(data, file, indent=4)

    return True


import os

def save_image(character_id, image_content):
    # Define a directory for storing character images
    directory = "character_images"

    # Ensure the directory exists
    if not os.path.exists(directory):
        os.makedirs(directory)

    # Define the path for the image
    image_path = os.path.join(directory, f"{character_id}.png")

    # Save the image
    with open(image_path, "wb") as f:
        f.write(image_content)

    return image_path

import json
import logging

def update_data(new_data):
    logging.info(f"New configuration: {new_data}")
    new_data_dict = json.loads(new_data)

    # Load the existing data from database.json
    with open('database.json', 'r') as file:
        saved_data = json.load(file)

    character = new_data_dict['character_id']
    if character in saved_data['characters']:
        if new_data_dict['voice_id']:
            saved_data['characters'][character]['voice_id'] = new_data_dict['voice_id']
        if new_data_dict['prompt']:
            saved_data['characters'][character]['prompt'] = new_data_dict['prompt']

    # Update the current character
    saved_data['current_character'] = character

    # Save the updated data back to database.json
    with open('database.json', 'w') as file:
        json.dump(saved_data, file, indent=4)

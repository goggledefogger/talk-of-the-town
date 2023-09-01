# Talk of the Town

Talk of the Town is an interactive voice-based chatbot that integrates with GPT-3 and a text-to-speech service to provide a unique conversational experience. This project is a fork of [talk-to-chatgpt](https://github.com/AllAboutAI-YT/talk-to-chatgpt) by AllAboutAI-YT.

## Overview

This project provides a web-based interface where users can interact with virtual characters. Each character has a unique voice and a generative art image associated with it. The interactions are powered by OpenAI's GPT-3 Turbo, and the voices are generated using Eleven Labs' API. The generative art images for each character are created using OpenAI's DALL-E.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/talk-of-the-town.git
   ```

2. Navigate to the project directory:
   ```bash
   cd talk-of-the-town
   ```

3. Install the required Python packages:
   Ensure you have Python 3.9 or higher installed. Then, run:
   ```bash
   pip install -r requirements.txt
   ```

   Note: On Raspberry Pi, you may also need to run the following commands to ensure `numpy` works correctly:
   ```bash
   sudo apt-get install libatlas-base-dev libjasper-dev
   ```

   On Linux systems, you might need to run:
   ```bash
   sudo apt-get install libportaudio2
   ```

4. Copy the sample configuration and database files:
   ```bash
   cp sample.config.env config.env
   cp sample.database.json database.json
   ```

5. Update the `config.env` file with the necessary API keys:
   - `OPENAI_API_KEY`: Obtain this key from [OpenAI](https://beta.openai.com/signup/). This key powers the GPT-3 Turbo and DALL-E art interactions.
   - `ELEVEN_LABS_KEY`: Get this key from [Eleven Labs](https://www.eleven-labs.com/). It's used for text-to-speech and voice functionalities.

Ensure you keep these keys confidential and do not expose them publicly.

## Usage

1. Start the Flask server:
   ```bash
   python app.py
   ```

2. Open a web browser and navigate to `http://localhost:5002/`.

3. Interact with the virtual characters, change their voices, and enjoy the experience!

## Credits

This project was forked from [AllAboutAI-YT/talk-to-chatgpt](https://github.com/AllAboutAI-YT/talk-to-chatgpt). Many thanks to the original authors for their foundational work.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

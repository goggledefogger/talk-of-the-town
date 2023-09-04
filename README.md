# Talk of the Town

Talk of the Town is an interactive voice-based chatbot that integrates with GPT-3 and a text-to-speech service to provide a unique conversational experience. This project is a fork of [talk-to-chatgpt](https://github.com/AllAboutAI-YT/talk-to-chatgpt) by AllAboutAI-YT.

## Overview

This project provides a web-based interface where users can interact with virtual characters. Each character has a unique voice and a generative art image associated with it. The interactions are powered by OpenAI's GPT-3 Turbo. The primary voice generation is done using Eleven Labs' API, with a fallback to `espeak` if Eleven Labs is unavailable. The generative art images for each character are created using OpenAI's DALL·E. Real-time communication between the frontend and backend is facilitated using Socket.io, ensuring a smooth and responsive user experience.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/talk-of-the-town.git
   ```

2. Navigate to the project directory:
   ```bash
   cd talk-of-the-town
   ```

3. **Linux/Raspberry Pi Specific Instructions**:
   - Ensure `numpy` works correctly:
     ```bash
     sudo apt-get install libatlas-base-dev libjasper-dev
     ```
   - Install `libportaudio2`:
     ```bash
     sudo apt-get install libportaudio2
     ```
   - Install `espeak` for text-to-speech fallback functionality:
     ```bash
     sudo apt-get install espeak
     ```

4. **macOS Specific Instructions**:
   - Install `espeak` for text-to-speech fallback functionality:
     ```bash
     brew install espeak
     ```

5. Install the required Python packages:
   Ensure you have Python 3.9 or higher installed. Then, run:
   ```bash
   pip install -r requirements.txt
   ```

6. Copy the sample configuration and database files:
   ```bash
   cp sample.config.env config.env
   cp sample.database.json database.json
   ```

7. Update the `config.env` file with the necessary API keys:
   - `OPENAI_API_KEY`: Obtain this key from [OpenAI](https://beta.openai.com/signup/). This key powers the GPT-3 Turbo and DALL·E art interactions.
   - `ELEVEN_LABS_KEY`: Get this key from [Eleven Labs](https://www.eleven-labs.com/). It's used for text-to-speech and voice functionalities.

Ensure you keep these keys confidential and do not expose them publicly.

## Usage

1. Start the Flask server with Socket.io support:
   ```bash
   python app.py
   ```

2. Open a web browser and navigate to `http://localhost:5002/` or the IP address of the machine running the server if accessing from another device.

3. Interact with the virtual characters, change their voices, and enjoy the experience! The real-time status of the server and conversation can be monitored via the web interface, thanks to the Socket.io integration.

## Credits

This project was forked from [AllAboutAI-YT/talk-to-chatgpt](https://github.com/AllAboutAI-YT/talk-to-chatgpt). Many thanks to the original authors for their foundational work.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

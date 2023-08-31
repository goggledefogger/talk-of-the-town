import subprocess
import sys
import pyaudio

def get_default_audio_input_device():
    platform = sys.platform

    # For Linux
    if platform == "linux" or platform == "linux2":
        try:
            result = subprocess.check_output(['pactl', 'info']).decode('utf-8')
            for line in result.split('\n'):
                if 'Default Source' in line:
                    return line.split(': ')[1]
        except Exception as e:
            print(f"Error: {e}")
            return None

    # For macOS
    elif platform == "darwin":
        try:
            result = subprocess.check_output(["SwitchAudioSource", "-c", "-t", "input"], text=True)
            return result.strip()
        except Exception as e:
            print(f"Error: {e}")
            return None

    # For Windows
    elif platform == "win32":
        # Note: This requires PyAudio to be installed
        import pyaudio
        p = pyaudio.PyAudio()
        default_device_index = p.get_default_input_device_info()["index"]
        return p.get_device_info_by_index(default_device_index)["name"]

    else:
        print("Unsupported OS")
        return None

def get_device_metadata(device_name):
    p = pyaudio.PyAudio()
    for i in range(p.get_device_count()):
        device_info = p.get_device_info_by_index(i)
        if device_info["name"] == device_name:
            return {
                "name": device_name,
                "channels": device_info["maxInputChannels"],
                "sample_rate": device_info["defaultSampleRate"]
            }
    return None

def main():
    device_name = get_default_audio_input_device()
    if device_name:
        metadata = get_device_metadata(device_name)
        if metadata:
            print(f"Device Name: {metadata['name']}")
            print(f"Channels: {metadata['channels']}")
            print(f"Sample Rate: {metadata['sample_rate']}")
        else:
            print(f"Could not retrieve metadata for device: {device_name}")
    else:
        print("Could not retrieve default audio input device.")

if __name__ == "__main__":
    main()

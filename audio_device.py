import subprocess
import sys
import pyaudio

def get_default_audio_input_device():
    p = pyaudio.PyAudio()

    if sys.platform == "darwin":
        # macOS
        try:
            # Get a list of all input audio devices
            cmd = "SwitchAudioSource -a -t input"
            devices = subprocess.check_output(cmd, shell=True).decode('utf-8').strip().split('\n')

            # Get the default input device
            cmd_default = "SwitchAudioSource -c -t input"
            default_device_name = subprocess.check_output(cmd_default, shell=True).decode('utf-8').strip()

            for i in range(p.get_device_count()):
                info = p.get_device_info_by_index(i)
                if info["name"] == default_device_name:
                    return i  # Return the device index
        except Exception as e:
            print(f"Error getting default audio input device on macOS: {e}")
            return None

    elif sys.platform == "win32":
        # Windows
        default_device_index = p.get_default_input_device_info()["index"]
        return default_device_index

    elif sys.platform == "linux" or sys.platform == "linux2":
        # Linux
        try:
            cmd = "pacmd list-sources | grep '* index:'"
            default_device_index = int(subprocess.check_output(cmd, shell=True).decode('utf-8').split(':')[1].strip())
            return default_device_index
        except Exception as e:
            print(f"Error getting default audio input device on Linux: {e}")
            return None

    else:
        print("Unsupported OS platform")
        return None

    p.terminate()


def get_device_metadata(device_index):
    p = pyaudio.PyAudio()
    device_info = p.get_device_info_by_index(device_index)
    return {
        "name": device_info["name"],
        "channels": device_info["maxInputChannels"],
        "sample_rate": device_info["defaultSampleRate"]
    }

def main():
    device_index = get_default_audio_input_device()
    if device_index:
        metadata = get_device_metadata(device_index)
        if metadata:
            print(f"Device Name: {metadata['name']}")
            print(f"Channels: {metadata['channels']}")
            print(f"Sample Rate: {metadata['sample_rate']}")
        else:
            print(f"Could not retrieve metadata for device: {device_index}")
    else:
        print("Could not retrieve default audio input device.")

if __name__ == "__main__":
    main()

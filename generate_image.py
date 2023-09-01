import openai

def generate_image(prompt, save_path):
    """
    Generate an image using DALL·E based on the given prompt.

    Args:
    - prompt (str): The textual prompt for DALL·E.
    - save_path (str): Path to save the generated image.

    Returns:
    - str: Path to the saved image.
    """
    response = openai.Image.create(
        model="image-alpha-001",
        prompt=prompt,
        n=1,  # Number of images to generate
        size="256x256",  # Image size
        response_format="url"  # Get the image URL
    )

    image_url = response.data[0]['url']

    print(image_url)
    print(save_path)

    # Download the image and save it locally
    import urllib.request
    urllib.request.urlretrieve(image_url, save_path)

    return save_path

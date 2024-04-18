from src.dataclasses.image import Image


def image_builder(url="image_url.png", height=300, width=300):
    return Image.model_validate({"url": url, "height": height, "width": width})

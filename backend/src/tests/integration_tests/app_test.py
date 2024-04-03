import pytest
from dotenv import load_dotenv, find_dotenv
import requests
from src import app
from src.tests.mock_builders.current_user_playlists_builder import (
    current_user_playlists_builder,
)

user_id = "1"


@pytest.fixture
def client():
    # Use our test integration config instead of the 'real' version
    file_path = find_dotenv(".env.test")
    load_dotenv(file_path, override=True)

    # Create the new app.
    test_app = app.create_app()
    # Use the app to create a test_client that can be used in our tests.
    with test_app.test_client() as client:
        client.set_cookie("user_id", user_id)
        client.set_cookie("spotify_access_token", "1")
        yield client


def test_index_page(monkeypatch, client):
    # This replaces any call to requests.get with our own function
    monkeypatch.setattr(requests, "get", stub)

    response = client.get("/")
    assert response.status_code == 200
    assert "Playlist 1" in response.data.decode()


class StubResponse:
    def __init__(self, fake_response_data):
        self.fake_response_data = fake_response_data

    def json(self):
        return self.fake_response_data


def stub(url, params={}, auth={}):
    if url == f"https://api.spotify.com/v1/users/{user_id}/playlists":
        fake_response_data = current_user_playlists_builder().model_dump()
        return StubResponse(fake_response_data)

    raise Exception(f'Integration test did not expect URL "{url}"')

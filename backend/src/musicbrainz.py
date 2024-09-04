import requests
from typing import List
from urllib.parse import quote_plus
from src.dataclasses.musicbrainz.release_group_response import ReleaseGroupResponse
from src.exceptions.Unauthorized import UnauthorizedException
from time import sleep


class MusicbrainzClient:
    request_headers = {
        "Accept": "application/json",
        "User-Agent": "Application PlaylistManager/1.0 - Hobby project (calpinsw@gmail.com)",
    }

    def response_handler(self, response: requests.Response, jsonify=True):
        if response.status_code == 401:
            raise UnauthorizedException
        else:
            if jsonify:
                if response.status_code == 204:
                    return None
                else:
                    return response.json()
            else:
                return response

    def get_genre_list(self, limit=100, offset=0) -> List[str]:
        if offset == 0:
            query = f"?limit={limit}"
        else:
            query = f"?limit={limit}&offset={offset}"
        response = requests.get(
            url="https://musicbrainz.org/ws/2/genre/all" + query,
            headers=self.request_headers,
        )
        data = response.json()
        genre_list = [genre["name"] for genre in data["genres"]]
        if genre_list == []:
            return []
        else:
            sleep(2)  # Needed to avoid rate limiting
            return genre_list + self.get_genre_list(limit, offset + limit)

    def get_album_genres(self, artist_name: str, album_title: str) -> List[str]:
        query = quote_plus(
            f'artistname:"{artist_name}" AND releasegroup:"{album_title}"'
        )
        response = requests.get(
            url="https://musicbrainz.org/ws/2/release-group?query=" + query,
            headers=self.request_headers,
        )
        data = response.json()
        release_group_response = ReleaseGroupResponse.model_validate(data)
        sleep(1)
        if release_group_response.count == 0:
            return []
        return [
            tag.name
            for tag in release_group_response.release_groups[0].tags or []
            if tag.count > 0
        ]

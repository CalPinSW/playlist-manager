class Album:
    def __init__(
        self,
        artists,
        title,
        release_date=None,
        spotify_id=None,
        score=None,
        genres=None,
        summary=None,
    ):
        self.artists = artists
        self.title = title
        self.release_date = release_date
        self.score = score
        self.genres = genres
        self.summary = summary
        self.spotify_id = spotify_id

    def get_formatted_artists(self):
        return ", ".join(self.artists)

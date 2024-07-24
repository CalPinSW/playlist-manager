from flask import Response, make_response


class ResponseCreator:
    def __init__(self):
        self.response = make_response()

    def with_cookies(self, cookie_dict: dict):
        for key, value in cookie_dict.items():
            self.response.set_cookie(key, value, samesite="None", secure=True)
        return self

    def create(self) -> Response:
        return self.response

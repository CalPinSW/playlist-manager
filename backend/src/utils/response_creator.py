from flask import Response


def add_cookies_to_response(response: Response, cookie_dict: dict):
    for key, value in cookie_dict.items():
        response.set_cookie(key, value, samesite="None", secure=True)
    return response

FROM python:3.10

RUN ["pip3", "install", "poetry"]

COPY pyproject.toml .

RUN ["poetry", "install", "--no-dev"]

COPY ./src ./src

EXPOSE 5000

ENTRYPOINT ["poetry", "run", "flask", "run", "--host=0.0.0.0"]
# ENTRYPOINT ["poetry", "run", 'gunicorn -c gunicorn.conf.py --bind localhost:5000 "src.app:create_app()"']
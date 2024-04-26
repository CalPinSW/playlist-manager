FROM python:3.10 AS os-base

RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"
RUN poetry config virtualenvs.create false
RUN apt-get remove -y curl

FROM os-base AS app-base

COPY ./src ./src
COPY pyproject.toml .
COPY gunicorn.conf.py .
RUN python -m venv /app/venv

RUN ["poetry", "install", "--no-dev"]

FROM app-base AS main

ENTRYPOINT exec poetry run gunicorn "src.app:create_app()" -c gunicorn.conf.py --bind 0.0.0.0:5000

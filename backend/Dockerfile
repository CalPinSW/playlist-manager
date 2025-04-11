FROM --platform=linux/amd64 python:3.10 AS os-base

RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"
RUN poetry config virtualenvs.create false
RUN apt-get remove -y curl

FROM os-base AS app-base

WORKDIR /backend
COPY src src
COPY pyproject.toml gunicorn.conf.py README.md ./

RUN ["poetry", "install", "--only", "main"]

EXPOSE 5000

FROM app-base AS test

RUN ["poetry", "install"]
ENV PYTHONPATH=.

ENTRYPOINT [ "poetry", "run", "pytest" ]

FROM app-base AS development

ENTRYPOINT [ "poetry", "run", "flask", "run", "--host=0.0.0.0" ]

FROM app-base AS production

ENTRYPOINT exec poetry run gunicorn "src.app:create_app()" -c gunicorn.conf.py --bind 0.0.0.0:5000




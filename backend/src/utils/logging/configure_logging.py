from flask import Flask
import logging
from loggly.handlers import HTTPSHandler
from pythonjsonlogger.json import JsonFormatter
from logging import LogRecord, getLogger

class EnvironmentFilter(logging.Filter):
    def __init__(self, environment):
        super().__init__()
        self.environment = environment

    def filter(self, record):
        record.environment = self.environment
        return True
    
def configure_app_logging(app: Flask):
    jsonFormatter = JsonFormatter(
        "[%(asctime)s] %(levelname)s in %(module)s [%(environment)s]: %(message)s"
    )
    loggly_url = f'https://logs-01.loggly.com/inputs/{app.config["LOGGLY_TOKEN"]}/tag/playman'

    # Default Logging
    handler = HTTPSHandler(loggly_url)
    handler.setFormatter(jsonFormatter)
    handler.addFilter(EnvironmentFilter(app.config["ENVIRONMENT"]))
    app.logger.addHandler(handler)

    # Request Logging
    request_logger = getLogger("werkzeug")
    request_logger.setLevel(app.config["LOGGING_LEVEL"])
    request_handler = HTTPSHandler(loggly_url + "-requests")
    request_handler.setFormatter(jsonFormatter)
    request_handler.addFilter(EnvironmentFilter(app.config["ENVIRONMENT"]))
    request_logger.addHandler(request_handler)

    # DB Logging
    db_logger = logging.getLogger("peewee")
    db_logger.setLevel(app.config["LOGGING_LEVEL"])
    db_handler = HTTPSHandler(loggly_url + "-db")
    db_handler.setFormatter(jsonFormatter)
    db_handler.addFilter(EnvironmentFilter(app.config["ENVIRONMENT"]))
    db_logger.addHandler(db_handler)
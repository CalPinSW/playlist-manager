#!/bin/bash

/bin/sh -ec "cd backend && poetry run flask --debug run"&
/bin/sh -ec "cd frontend && npm run dev"&

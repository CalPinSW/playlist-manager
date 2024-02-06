#!/bin/bash

cd backend && poetry install && cd ../frontend && npm install && cd ..
echo "Frontend and Backend dependencies installed"